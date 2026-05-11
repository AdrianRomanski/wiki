import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import type { GraphData, GraphEdge, GraphNode, NodeType, WikiManifest } from '../models/graph.models';

/** Regex that matches [[wikilink]], [[wikilink|display]], [[wikilink#section]], etc. */
const WIKILINK_REGEX = /\[\[([^\]]+)\]\]/g;

/** Valid node types from frontmatter. */
const VALID_NODE_TYPES = new Set<string>(['entity', 'concept', 'source']);

/**
 * Extracts all unique wikilink targets from a markdown content string.
 * Strips display text (|) and section anchors (#), deduplicates results.
 * Requirement 1.4, 1.6, 1.7
 */
export function extractWikilinks(content: string): string[] {
  const targets = new Set<string>();
  let match: RegExpExecArray | null;
  // Reset lastIndex before each use since the regex is module-level with /g flag
  WIKILINK_REGEX.lastIndex = 0;
  while ((match = WIKILINK_REGEX.exec(content)) !== null) {
    let target = match[1];
    // Strip display text: [[Page Title|Display]] → "Page Title"
    const pipeIdx = target.indexOf('|');
    if (pipeIdx !== -1) target = target.slice(0, pipeIdx);
    // Strip section anchor: [[Page Title#Section]] → "Page Title"
    const hashIdx = target.indexOf('#');
    if (hashIdx !== -1) target = target.slice(0, hashIdx);
    target = target.trim();
    if (target) targets.add(target);
  }
  return Array.from(targets);
}

/** Normalizes a title to a stable node id (lowercase, trimmed). */
function normalizeId(title: string): string {
  return title.toLowerCase().trim();
}

@Injectable({ providedIn: 'root' })
export class WikiParserService {
  private readonly http = inject(HttpClient);

  /**
   * Fetches wiki/manifest.json, then all .md files in parallel, parses them,
   * and returns a complete GraphData object.
   *
   * Uses switchMap so a new call cancels any in-flight request (Requirement 6.2).
   * Requirement 1.1–1.8, 6.3, 6.4
   */
  loadGraph(): Observable<GraphData> {
    return this.http.get<WikiManifest>('wiki/manifest.json').pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          return throwError(
            () =>
              new Error(
                'Wiki manifest not found. Run `npm run wiki:manifest` to generate it.'
              )
          );
        }
        return throwError(() => new Error(`Failed to load wiki manifest: ${err.message}`));
      }),
      switchMap((manifest) => this.buildGraphFromManifest(manifest))
    );
  }

  /**
   * Fetches all .md files listed in the manifest in parallel, then builds GraphData.
   */
  private buildGraphFromManifest(manifest: WikiManifest): Observable<GraphData> {
    if (!manifest.files || manifest.files.length === 0) {
      return of(buildEmptyGraphData());
    }

    // Fetch all files in parallel; individual failures are caught and logged
    const fileRequests = manifest.files.map((filePath) =>
      this.http.get(`wiki/${filePath}`, { responseType: 'text' }).pipe(
        map((content) => ({ filePath, content })),
        catchError((err: unknown) => {
          console.warn(`[WikiParserService] Failed to fetch wiki/${filePath}:`, err);
          // Return null to signal a skipped file
          return of(null);
        })
      )
    );

    return forkJoin(fileRequests).pipe(
      map((results) => {
        const validResults = results.filter(
          (r): r is { filePath: string; content: string } => r !== null
        );
        return parseFilesToGraphData(validResults);
      })
    );
  }
}

/** Builds an empty GraphData when the manifest has no files. */
function buildEmptyGraphData(): GraphData {
  return { nodes: new Map(), edges: [], allTags: [] };
}

/**
 * Pure function: given an array of { filePath, content } pairs, builds a complete GraphData.
 * Exported for unit testing.
 */
export function parseFilesToGraphData(
  files: Array<{ filePath: string; content: string }>
): GraphData {
  const nodes = new Map<string, GraphNode>();
  // Map from sourceNodeId → Set of target titles (for deduplication before edge creation)
  const rawEdges = new Map<string, Set<string>>();

  // Pass 1: parse frontmatter and register real nodes
  for (const { filePath, content } of files) {
    const parsed = parseFrontmatter(filePath, content);
    if (!parsed) continue; // skip files with invalid frontmatter

    const { node, linkTargets } = parsed;
    nodes.set(node.id, node);
    rawEdges.set(node.id, new Set(linkTargets));
  }

  // Pass 2: create ghost nodes for broken wikilink targets (Requirement 1.5)
  for (const [, targets] of rawEdges) {
    for (const target of targets) {
      const targetId = normalizeId(target);
      if (!nodes.has(targetId)) {
        nodes.set(targetId, createGhostNode(target));
      }
    }
  }

  // Pass 3: build edges array (Requirement 1.4, 1.7 — already deduplicated via Set)
  const edges: GraphEdge[] = [];
  for (const [sourceId, targets] of rawEdges) {
    for (const target of targets) {
      const targetId = normalizeId(target);
      edges.push({ sourceId, targetId });
    }
  }

  // Pass 4: compute inDegree / outDegree (Requirement 1.8)
  for (const edge of edges) {
    const source = nodes.get(edge.sourceId);
    const target = nodes.get(edge.targetId);
    if (source) source.outDegree++;
    if (target) target.inDegree++;
  }

  // Collect and sort all tags from non-ghost nodes
  const tagSet = new Set<string>();
  for (const node of nodes.values()) {
    if (!node.isGhost) {
      for (const tag of node.tags) tagSet.add(tag);
    }
  }
  const allTags = Array.from(tagSet).sort();

  return { nodes, edges, allTags };
}

/**
 * Minimal browser-safe YAML frontmatter parser.
 * Handles string, array (inline `[a, b]` and block `- item`), and ignores other types.
 * Returns { data, body } — no Node.js APIs used.
 */
function parseFrontmatterRaw(content: string): { data: Record<string, unknown>; body: string } | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;

  const yamlBlock = match[1];
  const body = match[2] ?? '';
  const data: Record<string, unknown> = {};

  for (const line of yamlBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const rawVal = line.slice(colonIdx + 1).trim();
    if (!key) continue;

    // Inline array: [a, b, c]
    if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
      data[key] = rawVal
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    } else if (rawVal === '') {
      // Possibly a block array — collect subsequent `- item` lines
      // (handled below via multi-line pass; skip for now)
      data[key] = [];
    } else {
      data[key] = rawVal.replace(/^['"]|['"]$/g, '');
    }
  }

  // Second pass: collect block-style arrays (`key:\n  - item`)
  const blockArrayRegex = /^(\w[\w\s-]*):\s*\n((?:[ \t]*-[ \t]+.+\n?)+)/gm;
  let m: RegExpExecArray | null;
  while ((m = blockArrayRegex.exec(yamlBlock + '\n')) !== null) {
    const key = m[1].trim();
    const items = m[2]
      .split('\n')
      .map((l) => l.replace(/^[ \t]*-[ \t]+/, '').trim())
      .filter(Boolean);
    data[key] = items;
  }

  return { data, body };
}

/**
 * Parses a single markdown file's frontmatter and extracts wikilinks.
 * Returns null (and logs a warning) if frontmatter is missing or invalid.
 */
function parseFrontmatter(
  filePath: string,
  content: string
): { node: GraphNode; linkTargets: string[] } | null {
  const parsed = parseFrontmatterRaw(content);
  if (!parsed) {
    console.warn(`[WikiParserService] Missing or unparseable frontmatter in ${filePath}`);
    return null;
  }

  const { data, body } = parsed;

  if (!data['title'] || typeof data['title'] !== 'string') {
    console.warn(`[WikiParserService] Missing or invalid 'title' in frontmatter: ${filePath}`);
    return null;
  }

  if (!data['type'] || !VALID_NODE_TYPES.has(data['type'] as string)) {
    console.warn(`[WikiParserService] Missing or invalid 'type' in frontmatter: ${filePath}`);
    return null;
  }

  const title = data['title'] as string;
  const type = data['type'] as NodeType;
  const tags: string[] = Array.isArray(data['tags'])
    ? (data['tags'] as unknown[]).filter((t): t is string => typeof t === 'string')
    : [];

  const node: GraphNode = {
    id: normalizeId(title),
    title,
    type,
    tags,
    filePath,
    isGhost: false,
    inDegree: 0,
    outDegree: 0,
  };

  const linkTargets = extractWikilinks(body);

  return { node, linkTargets };
}

/** Creates a ghost node for a wikilink target that has no corresponding wiki page. */
function createGhostNode(title: string): GraphNode {
  return {
    id: normalizeId(title),
    title,
    type: 'entity', // default type for ghost nodes; visually overridden by isGhost
    tags: [],
    filePath: '',
    isGhost: true,
    inDegree: 0,
    outDegree: 0,
  };
}
