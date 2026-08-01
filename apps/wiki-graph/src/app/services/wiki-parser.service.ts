import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import type { GraphData, GraphEdge, GraphNode, NodeType, WikiManifest } from '../models/graph.models';

const WIKILINK_REGEX = /\[\[([^\]]+)\]\]/g;
const VALID_NODE_TYPES = new Set<string>(['entity', 'concept', 'source']);

export function extractWikilinks(content: string): string[] {
  const targets = new Set<string>();
  let match: RegExpExecArray | null;
  WIKILINK_REGEX.lastIndex = 0;
  while ((match = WIKILINK_REGEX.exec(content)) !== null) {
    let target = match[1];
    const pipeIdx = target.indexOf('|');
    if (pipeIdx !== -1) target = target.slice(0, pipeIdx);
    const hashIdx = target.indexOf('#');
    if (hashIdx !== -1) target = target.slice(0, hashIdx);
    target = target.trim();
    if (target) targets.add(target);
  }
  return Array.from(targets);
}

function normalizeId(title: string): string {
  return title.toLowerCase().trim();
}

@Injectable({ providedIn: 'root' })
export class WikiParserService {
  private readonly http = inject(HttpClient);

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

  private buildGraphFromManifest(manifest: WikiManifest): Observable<GraphData> {
    if (!manifest.files || manifest.files.length === 0) {
      return of(buildEmptyGraphData());
    }

    const fileRequests = manifest.files.map((filePath) =>
      this.http.get(`wiki/${filePath}`, { responseType: 'text' }).pipe(
        map((content) => ({ filePath, content })),
        catchError((err: unknown) => {
          console.warn(`[WikiParserService] Failed to fetch wiki/${filePath}:`, err);
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

function buildEmptyGraphData(): GraphData {
  return { nodes: new Map(), edges: [], allTags: [] };
}

export function parseFilesToGraphData(
  files: Array<{ filePath: string; content: string }>
): GraphData {
  const nodes = new Map<string, GraphNode>();
  const rawEdges = new Map<string, Set<string>>();

  for (const { filePath, content } of files) {
    const parsed = parseFrontmatter(filePath, content);
    if (!parsed) continue;

    const { node, linkTargets } = parsed;
    nodes.set(node.id, node);
    rawEdges.set(node.id, new Set(linkTargets));
  }

  for (const [, targets] of rawEdges) {
    for (const target of targets) {
      const targetId = normalizeId(target);
      if (!nodes.has(targetId)) {
        nodes.set(targetId, createGhostNode(target));
      }
    }
  }

  const edges: GraphEdge[] = [];
  for (const [sourceId, targets] of rawEdges) {
    for (const target of targets) {
      const targetId = normalizeId(target);
      edges.push({ sourceId, targetId });
    }
  }

  for (const edge of edges) {
    const source = nodes.get(edge.sourceId);
    const target = nodes.get(edge.targetId);
    if (source) source.outDegree++;
    if (target) target.inDegree++;
  }

  const tagSet = new Set<string>();
  for (const node of nodes.values()) {
    if (!node.isGhost) {
      for (const tag of node.tags) tagSet.add(tag);
    }
  }
  const allTags = Array.from(tagSet).sort();

  return { nodes, edges, allTags };
}

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

    if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
      data[key] = rawVal
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    } else if (rawVal === '') {
      data[key] = [];
    } else {
      data[key] = rawVal.replace(/^['"]|['"]$/g, '');
    }
  }

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

function createGhostNode(title: string): GraphNode {
  return {
    id: normalizeId(title),
    title,
    type: 'entity',
    tags: [],
    filePath: '',
    isGhost: true,
    inDegree: 0,
    outDegree: 0,
  };
}
