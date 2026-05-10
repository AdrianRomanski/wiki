/**
 * Maintenance workflow for the LLM Wiki Second Brain system.
 * 
 * This module provides functions for:
 * - Validating [[WikiLink]] references
 * - Detecting duplicate and overlapping content
 * - Identifying contradictory information
 * - Suggesting consolidation opportunities
 * - Detecting orphaned pages
 * - Generating maintenance reports
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { parseFrontmatter } from './frontmatter.js';
import { extractWikiLinks } from './markdown.js';
import { MaintenanceReport } from './models.js';

/**
 * Result of link validation for a single page.
 */
export interface PageLinkValidation {
  /** Path to the page */
  page: string;
  
  /** Title of the page */
  title: string;
  
  /** Valid links that point to existing pages */
  validLinks: string[];
  
  /** Broken links that point to non-existent pages */
  brokenLinks: string[];
  
  /** Total number of links in the page */
  totalLinks: number;
}

/**
 * Extracts all [[WikiLink]] references from all wiki pages.
 * 
 * @param wikiDir - Path to the wiki directory
 * @returns Map of page paths to their wiki links
 * 
 * @example
 * ```typescript
 * const links = await extractAllWikiLinks('wiki');
 * // Returns: Map {
 * //   'entities/angular-cdk.md' => ['Progressive Enhancement', 'Accessibility'],
 * //   'concepts/progressive-enhancement.md' => ['Angular CDK']
 * // }
 * ```
 */
export async function extractAllWikiLinks(wikiDir: string): Promise<Map<string, string[]>> {
  const linkMap = new Map<string, string[]>();
  const subdirs = ['entities', 'concepts', 'sources'];
  
  for (const subdir of subdirs) {
    const subdirPath = join(wikiDir, subdir);
    
    try {
      const files = await readdir(subdirPath);
      
      for (const file of files) {
        if (!file.endsWith('.md')) {
          continue;
        }
        
        const filePath = join(subdirPath, file);
        const relativePath = `${subdir}/${file}`;
        
        try {
          const content = await readFile(filePath, 'utf-8');
          const links = extractWikiLinks(content);
          linkMap.set(relativePath, links);
        } catch (error) {
          console.warn(`Warning: Could not read ${filePath}:`, error);
        }
      }
    } catch (error) {
      // Skip subdirectories that don't exist
      console.warn(`Warning: Could not read directory ${subdirPath}:`, error);
    }
  }
  
  return linkMap;
}

/**
 * Loads all existing wiki page titles from the wiki directory.
 * 
 * @param wikiDir - Path to the wiki directory
 * @returns Map of page titles (lowercase) to their file paths
 * 
 * @example
 * ```typescript
 * const titles = await loadPageTitles('wiki');
 * // Returns: Map {
 * //   'angular cdk' => 'entities/angular-cdk.md',
 * //   'progressive enhancement' => 'concepts/progressive-enhancement.md'
 * // }
 * ```
 */
export async function loadPageTitles(wikiDir: string): Promise<Map<string, string>> {
  const titleMap = new Map<string, string>();
  const subdirs = ['entities', 'concepts', 'sources'];
  
  for (const subdir of subdirs) {
    const subdirPath = join(wikiDir, subdir);
    
    try {
      const files = await readdir(subdirPath);
      
      for (const file of files) {
        if (!file.endsWith('.md')) {
          continue;
        }
        
        const filePath = join(subdirPath, file);
        const relativePath = `${subdir}/${file}`;
        
        try {
          const content = await readFile(filePath, 'utf-8');
          const { frontmatter } = parseFrontmatter(content);
          
          // Store title in lowercase for case-insensitive matching
          titleMap.set(frontmatter.title.toLowerCase(), relativePath);
        } catch (error) {
          console.warn(`Warning: Could not parse ${filePath}:`, error);
        }
      }
    } catch (error) {
      // Skip subdirectories that don't exist
      console.warn(`Warning: Could not read directory ${subdirPath}:`, error);
    }
  }
  
  return titleMap;
}

/**
 * Validates all [[WikiLink]] references in the wiki.
 * 
 * Checks that each link target corresponds to an existing wiki page.
 * Returns detailed validation results for each page.
 * 
 * @param wikiDir - Path to the wiki directory
 * @returns Array of validation results for each page
 * 
 * @example
 * ```typescript
 * const results = await validateAllLinks('wiki');
 * // Returns: [
 * //   {
 * //     page: 'entities/angular-cdk.md',
 * //     title: 'Angular CDK',
 * //     validLinks: ['Progressive Enhancement'],
 * //     brokenLinks: ['NonExistent Page'],
 * //     totalLinks: 2
 * //   }
 * // ]
 * ```
 */
export async function validateAllLinks(wikiDir: string): Promise<PageLinkValidation[]> {
  const linkMap = await extractAllWikiLinks(wikiDir);
  const titleMap = await loadPageTitles(wikiDir);
  const results: PageLinkValidation[] = [];
  
  // Load page titles for each page
  const pageTitles = new Map<string, string>();
  for (const [pagePath] of linkMap) {
    const filePath = join(wikiDir, pagePath);
    try {
      const content = await readFile(filePath, 'utf-8');
      const { frontmatter } = parseFrontmatter(content);
      pageTitles.set(pagePath, frontmatter.title);
    } catch (error) {
      console.warn(`Warning: Could not read ${filePath}:`, error);
    }
  }
  
  // Validate links for each page
  for (const [pagePath, links] of linkMap) {
    const validLinks: string[] = [];
    const brokenLinks: string[] = [];
    
    for (const link of links) {
      const linkLower = link.toLowerCase();
      if (titleMap.has(linkLower)) {
        validLinks.push(link);
      } else {
        brokenLinks.push(link);
      }
    }
    
    results.push({
      page: pagePath,
      title: pageTitles.get(pagePath) || pagePath,
      validLinks,
      brokenLinks,
      totalLinks: links.length
    });
  }
  
  return results;
}

/**
 * Detects duplicate or overlapping content across wiki pages.
 * 
 * Uses a simple similarity metric based on shared words.
 * Pages with high similarity (>0.7) are flagged as potential duplicates.
 * 
 * @param wikiDir - Path to the wiki directory
 * @param similarityThreshold - Minimum similarity score to flag (default: 0.7)
 * @returns Array of duplicate pairs with similarity scores
 * 
 * @example
 * ```typescript
 * const duplicates = await detectDuplicates('wiki');
 * // Returns: [
 * //   {
 * //     page1: 'entities/angular-cdk.md',
 * //     page2: 'entities/cdk.md',
 * //     similarity: 0.85,
 * //     recommendation: 'Consider merging these pages'
 * //   }
 * // ]
 * ```
 */
export async function detectDuplicates(
  wikiDir: string,
  similarityThreshold: number = 0.7
): Promise<{
  page1: string;
  page2: string;
  similarity: number;
  recommendation: string;
}[]> {
  const duplicates: {
    page1: string;
    page2: string;
    similarity: number;
    recommendation: string;
  }[] = [];
  
  // Load all page contents
  const pageContents = new Map<string, string>();
  const subdirs = ['entities', 'concepts', 'sources'];
  
  for (const subdir of subdirs) {
    const subdirPath = join(wikiDir, subdir);
    
    try {
      const files = await readdir(subdirPath);
      
      for (const file of files) {
        if (!file.endsWith('.md')) {
          continue;
        }
        
        const filePath = join(subdirPath, file);
        const relativePath = `${subdir}/${file}`;
        
        try {
          const fileContent = await readFile(filePath, 'utf-8');
          const { content } = parseFrontmatter(fileContent);
          pageContents.set(relativePath, content);
        } catch (error) {
          console.warn(`Warning: Could not read ${filePath}:`, error);
        }
      }
    } catch (error) {
      // Skip subdirectories that don't exist
      console.warn(`Warning: Could not read directory ${subdirPath}:`, error);
    }
  }
  
  // Compare all pairs of pages
  const pages = Array.from(pageContents.keys());
  
  for (let i = 0; i < pages.length; i++) {
    for (let j = i + 1; j < pages.length; j++) {
      const page1 = pages[i];
      const page2 = pages[j];
      const content1 = pageContents.get(page1)!;
      const content2 = pageContents.get(page2)!;
      
      const similarity = calculateSimilarity(content1, content2);
      
      if (similarity >= similarityThreshold) {
        duplicates.push({
          page1,
          page2,
          similarity,
          recommendation: `Consider merging these pages (${Math.round(similarity * 100)}% similar)`
        });
      }
    }
  }
  
  return duplicates;
}

/**
 * Calculates similarity between two text contents.
 * 
 * Uses Jaccard similarity based on word sets.
 * 
 * @param content1 - First content
 * @param content2 - Second content
 * @returns Similarity score between 0 and 1
 */
function calculateSimilarity(content1: string, content2: string): number {
  // Tokenize into words (lowercase, alphanumeric only)
  const words1 = new Set(
    content1
      .toLowerCase()
      .match(/\b\w+\b/g) || []
  );
  
  const words2 = new Set(
    content2
      .toLowerCase()
      .match(/\b\w+\b/g) || []
  );
  
  // Calculate Jaccard similarity: |intersection| / |union|
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  if (union.size === 0) {
    return 0;
  }
  
  return intersection.size / union.size;
}

/**
 * Detects contradictory information across wiki pages.
 * 
 * This is a placeholder implementation that looks for explicit contradiction markers.
 * A full implementation would use NLP or LLM-based analysis.
 * 
 * @param wikiDir - Path to the wiki directory
 * @returns Array of detected contradictions
 * 
 * @example
 * ```typescript
 * const contradictions = await detectContradictions('wiki');
 * // Returns: [
 * //   {
 * //     pages: ['entities/angular-cdk.md', 'concepts/accessibility.md'],
 * //     contradiction: 'Conflicting information about ARIA support',
 * //     severity: 'medium'
 * //   }
 * // ]
 * ```
 */
export async function detectContradictions(wikiDir: string): Promise<{
  pages: string[];
  contradiction: string;
  severity: 'low' | 'medium' | 'high';
}[]> {
  const contradictions: {
    pages: string[];
    contradiction: string;
    severity: 'low' | 'medium' | 'high';
  }[] = [];
  
  // This is a simplified implementation
  // A full implementation would use NLP or LLM-based analysis to detect semantic contradictions
  
  // For now, we look for explicit contradiction markers in content
  const contradictionMarkers = [
    'however',
    'but',
    'on the other hand',
    'contrary to',
    'unlike',
    'different from'
  ];
  
  // Load all page contents
  const pageContents = new Map<string, string>();
  const subdirs = ['entities', 'concepts', 'sources'];
  
  for (const subdir of subdirs) {
    const subdirPath = join(wikiDir, subdir);
    
    try {
      const files = await readdir(subdirPath);
      
      for (const file of files) {
        if (!file.endsWith('.md')) {
          continue;
        }
        
        const filePath = join(subdirPath, file);
        const relativePath = `${subdir}/${file}`;
        
        try {
          const fileContent = await readFile(filePath, 'utf-8');
          const { content } = parseFrontmatter(fileContent);
          pageContents.set(relativePath, content);
        } catch (error) {
          console.warn(`Warning: Could not read ${filePath}:`, error);
        }
      }
    } catch (error) {
      // Skip subdirectories that don't exist
      console.warn(`Warning: Could not read directory ${subdirPath}:`, error);
    }
  }
  
  // Look for pages that reference each other and contain contradiction markers
  const linkMap = await extractAllWikiLinks(wikiDir);
  const titleMap = await loadPageTitles(wikiDir);
  
  // Build reverse map (path -> title)
  const pathToTitle = new Map<string, string>();
  for (const [title, path] of titleMap) {
    pathToTitle.set(path, title);
  }
  
  for (const [pagePath, links] of linkMap) {
    const content = pageContents.get(pagePath);
    if (!content) continue;
    
    const contentLower = content.toLowerCase();
    
    // Check if this page contains contradiction markers
    const hasContradictionMarker = contradictionMarkers.some(marker =>
      contentLower.includes(marker)
    );
    
    if (hasContradictionMarker && links.length > 0) {
      // Find the linked pages
      const linkedPages: string[] = [];
      for (const link of links) {
        const linkedPath = titleMap.get(link.toLowerCase());
        if (linkedPath) {
          linkedPages.push(linkedPath);
        }
      }
      
      if (linkedPages.length > 0) {
        // Only add if we haven't already added this combination
        const pagesSet = new Set([pagePath, ...linkedPages].sort());
        const alreadyAdded = contradictions.some(c => {
          const existingSet = new Set(c.pages.sort());
          return pagesSet.size === existingSet.size && 
                 [...pagesSet].every(p => existingSet.has(p));
        });
        
        if (!alreadyAdded) {
          contradictions.push({
            pages: [pagePath, ...linkedPages],
            contradiction: `Page contains contradiction markers and references other pages`,
            severity: 'low'
          });
        }
      }
    }
  }
  
  return contradictions;
}

/**
 * Identifies related pages that could be merged.
 * 
 * Looks for:
 * - Pages with high content similarity
 * - Pages with many mutual cross-references
 * - Pages with similar tags
 * 
 * @param wikiDir - Path to the wiki directory
 * @returns Array of consolidation opportunities
 * 
 * @example
 * ```typescript
 * const opportunities = await suggestConsolidation('wiki');
 * // Returns: [
 * //   {
 * //     pages: ['entities/angular-cdk.md', 'entities/cdk.md'],
 * //     reason: 'High content similarity (85%)',
 * //     suggestedAction: 'Merge into single page'
 * //   }
 * // ]
 * ```
 */
export async function suggestConsolidation(wikiDir: string): Promise<{
  pages: string[];
  reason: string;
  suggestedAction: string;
}[]> {
  const opportunities: {
    pages: string[];
    reason: string;
    suggestedAction: string;
  }[] = [];
  
  // Find duplicates (high similarity)
  const duplicates = await detectDuplicates(wikiDir, 0.6);
  
  for (const dup of duplicates) {
    opportunities.push({
      pages: [dup.page1, dup.page2],
      reason: `High content similarity (${Math.round(dup.similarity * 100)}%)`,
      suggestedAction: 'Merge into single page'
    });
  }
  
  // Find pages with many mutual cross-references
  const linkMap = await extractAllWikiLinks(wikiDir);
  const titleMap = await loadPageTitles(wikiDir);
  
  // Build reverse map (title -> path)
  const pathToTitle = new Map<string, string>();
  for (const [title, path] of titleMap) {
    pathToTitle.set(path, title);
  }
  
  // Check for mutual references
  for (const [page1Path, links1] of linkMap) {
    const page1Title = pathToTitle.get(page1Path);
    if (!page1Title) continue;
    
    for (const link of links1) {
      const page2Path = titleMap.get(link.toLowerCase());
      if (!page2Path) continue;
      
      const links2 = linkMap.get(page2Path);
      if (!links2) continue;
      
      // Check if page2 links back to page1
      const linksBackToPage1 = links2.some(
        l => l.toLowerCase() === page1Title.toLowerCase()
      );
      
      if (linksBackToPage1) {
        // Count total mutual references
        const mutualRefs = links1.filter(l => {
          const targetPath = titleMap.get(l.toLowerCase());
          return targetPath === page2Path;
        }).length;
        
        if (mutualRefs >= 3) {
          opportunities.push({
            pages: [page1Path, page2Path],
            reason: `Many mutual cross-references (${mutualRefs})`,
            suggestedAction: 'Consider merging or creating a parent concept page'
          });
        }
      }
    }
  }
  
  return opportunities;
}

/**
 * Finds orphaned pages with no incoming links.
 * 
 * @param wikiDir - Path to the wiki directory
 * @returns Array of orphaned pages
 * 
 * @example
 * ```typescript
 * const orphans = await findOrphans('wiki');
 * // Returns: [
 * //   {
 * //     page: 'entities/unused-entity.md',
 * //     reason: 'No incoming links from other pages'
 * //   }
 * // ]
 * ```
 */
export async function findOrphans(wikiDir: string): Promise<{
  page: string;
  reason: string;
}[]> {
  const orphans: { page: string; reason: string }[] = [];
  
  // Load all pages and their titles
  const titleMap = await loadPageTitles(wikiDir);
  const linkMap = await extractAllWikiLinks(wikiDir);
  
  // Build reverse map (path -> title)
  const pathToTitle = new Map<string, string>();
  for (const [title, path] of titleMap) {
    pathToTitle.set(path, title);
  }
  
  // Count incoming links for each page
  const incomingLinks = new Map<string, number>();
  
  // Initialize all pages with 0 incoming links
  for (const path of titleMap.values()) {
    incomingLinks.set(path, 0);
  }
  
  // Count incoming links
  for (const [, links] of linkMap) {
    for (const link of links) {
      const targetPath = titleMap.get(link.toLowerCase());
      if (targetPath) {
        incomingLinks.set(targetPath, (incomingLinks.get(targetPath) || 0) + 1);
      }
    }
  }
  
  // Find pages with no incoming links
  for (const [path, count] of incomingLinks) {
    if (count === 0) {
      orphans.push({
        page: path,
        reason: 'No incoming links from other pages'
      });
    }
  }
  
  return orphans;
}

/**
 * Validates session references in ADR-generated wiki pages.
 * 
 * Checks that Session_Reference links in Source_Summary pages point to
 * existing research sessions and their artifacts.
 * 
 * @param wikiDir - Path to the wiki directory
 * @returns Array of broken session references with suggested fixes
 * 
 * @example
 * ```typescript
 * const brokenRefs = await validateSessionReferences('wiki');
 * // Returns: [
 * //   {
 * //     page: 'sources/choose-focus-trap-library-2024-01-15.md',
 * //     sessionId: 'focus-trap-2024-01-15',
 * //     errors: ['Session directory does not exist'],
 * //     suggestedActions: ['Verify session ID is correct', 'Check if session was moved']
 * //   }
 * // ]
 * ```
 */
export async function validateSessionReferences(wikiDir: string): Promise<{
  page: string;
  sessionId: string;
  errors: string[];
  suggestedActions: string[];
}[]> {
  const brokenReferences: {
    page: string;
    sessionId: string;
    errors: string[];
    suggestedActions: string[];
  }[] = [];
  
  // Load all source pages (ADRs are in sources/)
  const sourcesDir = join(wikiDir, 'sources');
  
  try {
    const files = await readdir(sourcesDir);
    
    for (const file of files) {
      if (!file.endsWith('.md')) {
        continue;
      }
      
      const filePath = join(sourcesDir, file);
      const relativePath = `sources/${file}`;
      
      try {
        const fileContent = await readFile(filePath, 'utf-8');
        const { frontmatter, content } = parseFrontmatter(fileContent);
        
        // Check if this is an ADR-generated page (has sessionId in frontmatter)
        if (!frontmatter.sessionId) {
          continue;
        }
        
        const sessionId = frontmatter.sessionId;
        const errors: string[] = [];
        const suggestedActions: string[] = [];
        
        // Construct expected session path
        const sessionPath = join(process.cwd(), '.kiro', 'research', 'sessions', sessionId);
        
        // Check if session directory exists
        try {
          const { stat } = await import('fs/promises');
          const stats = await stat(sessionPath);
          
          if (!stats.isDirectory()) {
            errors.push(`Session path exists but is not a directory: .kiro/research/sessions/${sessionId}`);
            suggestedActions.push('Verify session path is correct');
          } else {
            // Directory exists, check for artifacts
            
            // Check for comparison report
            const comparisonReportPath = join(sessionPath, 'comparison-report.md');
            try {
              await stat(comparisonReportPath);
            } catch {
              errors.push(`Comparison report not found: comparison-report.md`);
              suggestedActions.push('Verify comparison report was generated during research');
            }
            
            // Check for final report
            const finalReportPath = join(sessionPath, 'final-report.md');
            try {
              await stat(finalReportPath);
            } catch {
              errors.push(`Final report not found: final-report.md`);
              suggestedActions.push('Verify final report was generated during finalization');
            }
            
            // Check for ADR
            const adrPath = join(sessionPath, 'decision.adr.md');
            try {
              await stat(adrPath);
            } catch {
              errors.push(`ADR not found: decision.adr.md`);
              suggestedActions.push('Verify ADR was generated during finalization');
            }
          }
        } catch {
          errors.push(`Session directory does not exist: .kiro/research/sessions/${sessionId}`);
          suggestedActions.push('Verify session ID is correct');
          suggestedActions.push('Check if session was moved or deleted');
          suggestedActions.push('Update frontmatter sessionId if session was renamed');
        }
        
        // If there are errors, add to broken references
        if (errors.length > 0) {
          brokenReferences.push({
            page: relativePath,
            sessionId,
            errors,
            suggestedActions
          });
        }
      } catch (error) {
        console.warn(`Warning: Could not read ${filePath}:`, error);
      }
    }
  } catch (error) {
    // Sources directory doesn't exist or can't be read
    console.warn(`Warning: Could not read directory ${sourcesDir}:`, error);
  }
  
  return brokenReferences;
}

/**
 * Detects duplicate library Entity_Page entries across ADRs.
 * 
 * Identifies when multiple ADRs reference the same library and suggests
 * consolidation opportunities.
 * 
 * @param wikiDir - Path to the wiki directory
 * @returns Array of duplicate library entries with consolidation suggestions
 * 
 * @example
 * ```typescript
 * const duplicates = await detectDuplicateLibraryEntities('wiki');
 * // Returns: [
 * //   {
 * //     libraryName: '@angular/cdk/a11y',
 * //     entityPages: ['entities/angular-cdk-a11y.md', 'entities/angular-cdk-a11y-2.md'],
 * //     referencedByADRs: ['sources/adr-1.md', 'sources/adr-2.md'],
 * //     suggestedAction: 'Consolidate into single entity page with multiple ADR references'
 * //   }
 * // ]
 * ```
 */
export async function detectDuplicateLibraryEntities(wikiDir: string): Promise<{
  libraryName: string;
  entityPages: string[];
  referencedByADRs: string[];
  suggestedAction: string;
}[]> {
  const duplicates: {
    libraryName: string;
    entityPages: string[];
    referencedByADRs: string[];
    suggestedAction: string;
  }[] = [];
  
  // Load all entity pages
  const entitiesDir = join(wikiDir, 'entities');
  const libraryMap = new Map<string, {
    pages: string[];
    adrSources: Set<string>;
  }>();
  
  try {
    const files = await readdir(entitiesDir);
    
    for (const file of files) {
      if (!file.endsWith('.md')) {
        continue;
      }
      
      const filePath = join(entitiesDir, file);
      const relativePath = `entities/${file}`;
      
      try {
        const fileContent = await readFile(filePath, 'utf-8');
        const { frontmatter } = parseFrontmatter(fileContent);
        
        // Check if this entity has ADR-related tags or sources
        const hasResearchTag = frontmatter.tags?.some((tag: string) => 
          ['research', 'adr', 'decision'].includes(tag.toLowerCase())
        );
        
        if (!hasResearchTag) {
          continue;
        }
        
        // Normalize library name (lowercase, remove special chars for comparison)
        const normalizedName = frontmatter.title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');
        
        if (!libraryMap.has(normalizedName)) {
          libraryMap.set(normalizedName, {
            pages: [],
            adrSources: new Set()
          });
        }
        
        const entry = libraryMap.get(normalizedName)!;
        entry.pages.push(relativePath);
        
        // Extract ADR sources from frontmatter
        if (frontmatter.sources && Array.isArray(frontmatter.sources)) {
          for (const source of frontmatter.sources) {
            if (typeof source === 'string' && source.includes('sources/')) {
              entry.adrSources.add(source);
            }
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not read ${filePath}:`, error);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${entitiesDir}:`, error);
  }
  
  // Find duplicates (libraries with multiple entity pages)
  for (const [normalizedName, entry] of libraryMap) {
    if (entry.pages.length > 1) {
      // Get the actual library name from the first page
      const firstPagePath = join(wikiDir, entry.pages[0]);
      let libraryName = normalizedName;
      
      try {
        const content = await readFile(firstPagePath, 'utf-8');
        const { frontmatter } = parseFrontmatter(content);
        libraryName = frontmatter.title;
      } catch {
        // Use normalized name as fallback
      }
      
      duplicates.push({
        libraryName,
        entityPages: entry.pages,
        referencedByADRs: Array.from(entry.adrSources),
        suggestedAction: entry.adrSources.size > 1
          ? 'Consolidate into single entity page with multiple ADR references'
          : 'Merge duplicate entity pages into one'
      });
    }
  }
  
  return duplicates;
}

/**
 * Flags outdated research decisions (superseded ADRs).
 * 
 * Identifies ADR-generated Source_Summary pages that have been superseded
 * by newer decisions.
 * 
 * @param wikiDir - Path to the wiki directory
 * @returns Array of superseded decisions with recommendations
 * 
 * @example
 * ```typescript
 * const outdated = await flagSupersededDecisions('wiki');
 * // Returns: [
 * //   {
 * //     page: 'sources/old-decision.md',
 * //     title: 'Old Decision',
 * //     status: 'Superseded',
 * //     supersededBy: 'sources/new-decision.md',
 * //     recommendation: 'Mark as archived or add prominent superseded notice'
 * //   }
 * // ]
 * ```
 */
export async function flagSupersededDecisions(wikiDir: string): Promise<{
  page: string;
  title: string;
  status: string;
  supersededBy?: string;
  recommendation: string;
}[]> {
  const superseded: {
    page: string;
    title: string;
    status: string;
    supersededBy?: string;
    recommendation: string;
  }[] = [];
  
  // Load all source pages
  const sourcesDir = join(wikiDir, 'sources');
  
  try {
    const files = await readdir(sourcesDir);
    
    for (const file of files) {
      if (!file.endsWith('.md')) {
        continue;
      }
      
      const filePath = join(sourcesDir, file);
      const relativePath = `sources/${file}`;
      
      try {
        const fileContent = await readFile(filePath, 'utf-8');
        const { frontmatter } = parseFrontmatter(fileContent);
        
        // Check if this is an ADR with Superseded status
        if (frontmatter.status === 'Superseded') {
          superseded.push({
            page: relativePath,
            title: frontmatter.title,
            status: frontmatter.status,
            supersededBy: frontmatter.supersededBy,
            recommendation: frontmatter.supersededBy
              ? `Update to reference newer decision: ${frontmatter.supersededBy}`
              : 'Mark as archived or add prominent superseded notice'
          });
        }
      } catch (error) {
        console.warn(`Warning: Could not read ${filePath}:`, error);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${sourcesDir}:`, error);
  }
  
  return superseded;
}

/**
 * Validates cross-reference links in ADR-generated pages.
 * 
 * Checks that wiki links in ADR Source_Summary and Entity_Page entries
 * point to existing pages.
 * 
 * @param wikiDir - Path to the wiki directory
 * @returns Array of ADR pages with broken cross-references
 * 
 * @example
 * ```typescript
 * const brokenRefs = await validateADRCrossReferences('wiki');
 * // Returns: [
 * //   {
 * //     page: 'sources/adr-decision.md',
 * //     brokenLinks: ['NonExistent Library', 'Missing Concept'],
 * //     suggestedActions: ['Create entity page for NonExistent Library']
 * //   }
 * // ]
 * ```
 */
export async function validateADRCrossReferences(wikiDir: string): Promise<{
  page: string;
  brokenLinks: string[];
  suggestedActions: string[];
}[]> {
  const brokenReferences: {
    page: string;
    brokenLinks: string[];
    suggestedActions: string[];
  }[] = [];
  
  // Get all link validation results
  const linkValidation = await validateAllLinks(wikiDir);
  
  // Filter for ADR-related pages (sources with research tags or entities with research tags)
  for (const validation of linkValidation) {
    if (validation.brokenLinks.length === 0) {
      continue;
    }
    
    // Check if this is an ADR-related page
    const filePath = join(wikiDir, validation.page);
    
    try {
      const fileContent = await readFile(filePath, 'utf-8');
      const { frontmatter } = parseFrontmatter(fileContent);
      
      // Check for ADR indicators
      const isADRPage = 
        frontmatter.sessionId || // Has session ID
        frontmatter.status === 'Accepted' || // Has decision status
        frontmatter.status === 'Rejected' ||
        frontmatter.status === 'Superseded' ||
        frontmatter.tags?.some((tag: string) => 
          ['research', 'adr', 'decision'].includes(tag.toLowerCase())
        );
      
      if (!isADRPage) {
        continue;
      }
      
      // Generate suggested actions for broken links
      const suggestedActions: string[] = [];
      for (const brokenLink of validation.brokenLinks) {
        // Check if this looks like a library name
        if (brokenLink.includes('/') || brokenLink.includes('@')) {
          suggestedActions.push(`Create entity page for library: ${brokenLink}`);
        } else {
          suggestedActions.push(`Create or fix wiki link: ${brokenLink}`);
        }
      }
      
      brokenReferences.push({
        page: validation.page,
        brokenLinks: validation.brokenLinks,
        suggestedActions
      });
    } catch (error) {
      // Skip pages we can't read
      continue;
    }
  }
  
  return brokenReferences;
}

/**
 * Generates a comprehensive maintenance report.
 * 
 * Runs all maintenance checks and compiles findings into a structured report.
 * 
 * @param wikiDir - Path to the wiki directory
 * @returns Complete maintenance report
 * 
 * @example
 * ```typescript
 * const report = await generateMaintenanceReport('wiki');
 * console.log(`Health score: ${report.summary.healthScore}`);
 * console.log(`Broken links: ${report.brokenLinks.length}`);
 * ```
 */
export async function generateMaintenanceReport(wikiDir: string): Promise<MaintenanceReport> {
  // Run all maintenance checks
  const linkValidation = await validateAllLinks(wikiDir);
  const duplicates = await detectDuplicates(wikiDir);
  const contradictions = await detectContradictions(wikiDir);
  const consolidationOpportunities = await suggestConsolidation(wikiDir);
  const orphans = await findOrphans(wikiDir);
  
  // Run ADR-specific maintenance checks
  const brokenSessionReferences = await validateSessionReferences(wikiDir);
  const duplicateLibraries = await detectDuplicateLibraryEntities(wikiDir);
  const supersededDecisions = await flagSupersededDecisions(wikiDir);
  const adrCrossReferenceIssues = await validateADRCrossReferences(wikiDir);
  
  // Extract broken links
  const brokenLinks = linkValidation
    .filter(v => v.brokenLinks.length > 0)
    .map(v => ({
      page: v.page,
      brokenLinks: v.brokenLinks
    }));
  
  // Calculate summary statistics
  const totalPages = linkValidation.length;
  const totalLinks = linkValidation.reduce((sum, v) => sum + v.totalLinks, 0);
  const totalBrokenLinks = brokenLinks.reduce((sum, b) => sum + b.brokenLinks.length, 0);
  const totalOrphans = orphans.length;
  const totalDuplicates = duplicates.length;
  const totalContradictions = contradictions.length;
  
  // ADR-specific statistics
  const totalBrokenSessionRefs = brokenSessionReferences.length;
  const totalDuplicateLibraries = duplicateLibraries.length;
  const totalSupersededDecisions = supersededDecisions.length;
  const totalADRCrossRefIssues = adrCrossReferenceIssues.length;
  
  // Calculate health score (0-100)
  // Deduct points for issues
  let healthScore = 100;
  healthScore -= Math.min(20, totalBrokenLinks * 2); // -2 per broken link, max -20
  healthScore -= Math.min(15, totalOrphans * 3); // -3 per orphan, max -15
  healthScore -= Math.min(15, totalDuplicates * 5); // -5 per duplicate, max -15
  healthScore -= Math.min(20, totalContradictions * 10); // -10 per contradiction, max -20
  
  // ADR-specific deductions
  healthScore -= Math.min(10, totalBrokenSessionRefs * 3); // -3 per broken session ref, max -10
  healthScore -= Math.min(5, totalDuplicateLibraries * 2); // -2 per duplicate library, max -5
  healthScore -= Math.min(5, totalADRCrossRefIssues * 1); // -1 per ADR cross-ref issue, max -5
  // Note: Superseded decisions are not penalized as they're expected
  
  healthScore = Math.max(0, healthScore);
  
  return {
    timestamp: new Date(),
    duplicates,
    contradictions,
    brokenLinks,
    consolidationOpportunities,
    orphans,
    summary: {
      totalPages,
      totalLinks,
      healthScore
    },
    // ADR-specific findings
    adrFindings: {
      brokenSessionReferences,
      duplicateLibraries,
      supersededDecisions,
      adrCrossReferenceIssues
    }
  };
}
