/**
 * BigPictureAnalyzer - Analyzes library structure and generates comprehensive visualizations
 * Feature: polished-research-workflow
 * Requirements: 2.5, 2.6, 2.7, 2.8, 2.9, 2.10
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  LibraryAnalysis,
  StructureAnalysis,
  DirectoryNode,
  FileNode,
  EntryPoint,
  APIExport,
  DependencyInfo,
  CapabilityCategories,
  Capability,
  CapabilityType,
  EntryPointType,
  DependencyType
} from '../types/analysis.js';
import { WorkflowError } from '../errors/WorkflowError.js';

/**
 * BigPictureAnalyzer provides comprehensive library structure analysis,
 * capability categorization, and visualization generation.
 */
export class BigPictureAnalyzer {
  private readonly nodeModulesPath: string;

  constructor(nodeModulesPath: string = 'node_modules') {
    this.nodeModulesPath = path.resolve(process.cwd(), nodeModulesPath);
  }

  /**
   * Analyzes a library and returns comprehensive analysis results
   * Requirement 2.5: Analyze library structure from node_modules
   * Requirement 2.8: Identify entry points and public API surface
   */
  async analyzeLibrary(libraryName: string): Promise<LibraryAnalysis> {
    const libraryPath = path.join(this.nodeModulesPath, libraryName);

    // Verify library exists
    try {
      await fs.access(libraryPath);
    } catch (error) {
      throw new WorkflowError(
        `Library not found in node_modules: ${libraryName}`,
        'LIBRARY_NOT_FOUND',
        { libraryName, path: libraryPath }
      );
    }

    // Get library version
    const version = await this.getLibraryVersion(libraryPath);

    // Analyze structure
    const structure = await this.analyzeStructure(libraryPath);

    // Identify entry points
    const entryPoints = await this.identifyEntryPoints(libraryPath);

    // Extract public API
    const publicAPI = await this.extractPublicAPI(libraryPath, entryPoints);

    // Categorize capabilities
    const capabilities = this.categorizeCapabilities(structure, publicAPI);

    // Extract dependencies
    const dependencies = await this.extractDependencies(libraryPath);

    return {
      libraryName,
      version,
      structure,
      capabilities,
      entryPoints,
      publicAPI,
      dependencies
    };
  }

  /**
   * Analyzes the directory structure of a library
   * Requirement 2.5: Traverse node_modules directory
   */
  async analyzeStructure(libraryPath: string): Promise<StructureAnalysis> {
    const directories: DirectoryNode[] = [];
    const files: FileNode[] = [];
    let totalFiles = 0;
    let totalDirectories = 0;

    const traverseDirectory = async (
      dirPath: string,
      relativePath: string = ''
    ): Promise<DirectoryNode | null> => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const children: (DirectoryNode | FileNode)[] = [];

        for (const entry of entries) {
          const entryPath = path.join(dirPath, entry.name);
          const entryRelativePath = path.join(relativePath, entry.name);

          // Skip node_modules, .git, and other common directories to avoid
          if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.nx') {
            continue;
          }

          if (entry.isDirectory()) {
            totalDirectories++;
            const dirNode = await traverseDirectory(entryPath, entryRelativePath);
            if (dirNode) {
              children.push(dirNode);
            }
          } else if (entry.isFile()) {
            totalFiles++;
            const stats = await fs.stat(entryPath);
            const fileNode: FileNode = {
              name: entry.name,
              path: entryRelativePath,
              extension: path.extname(entry.name),
              size: stats.size
            };
            files.push(fileNode);
            children.push(fileNode);
          }
        }

        return {
          name: path.basename(dirPath),
          path: relativePath,
          children
        };
      } catch (error) {
        // Skip directories we can't read
        return null;
      }
    };

    const rootNode = await traverseDirectory(libraryPath);
    if (rootNode) {
      directories.push(rootNode);
    }

    return {
      rootPath: libraryPath,
      directories,
      files,
      totalFiles,
      totalDirectories
    };
  }

  /**
   * Identifies entry points from package.json
   * Requirement 2.8: Identify entry points from package.json
   */
  async identifyEntryPoints(libraryPath: string): Promise<EntryPoint[]> {
    const entryPoints: EntryPoint[] = [];

    try {
      const packageJsonPath = path.join(libraryPath, 'package.json');
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);

      // Main entry point
      if (packageJson.main) {
        entryPoints.push({
          path: packageJson.main,
          type: 'main' as EntryPointType,
          exports: [] // Will be populated by extractPublicAPI
        });
      }

      // Module entry point (ES modules)
      if (packageJson.module && packageJson.module !== packageJson.main) {
        entryPoints.push({
          path: packageJson.module,
          type: 'main' as EntryPointType,
          exports: []
        });
      }

      // Exports field (modern package.json)
      if (packageJson.exports) {
        this.parseExportsField(packageJson.exports, entryPoints);
      }

      // If no entry points found, default to index.js or index.ts
      if (entryPoints.length === 0) {
        const defaultEntries = ['index.js', 'index.ts', 'src/index.js', 'src/index.ts'];
        for (const entry of defaultEntries) {
          const entryPath = path.join(libraryPath, entry);
          try {
            await fs.access(entryPath);
            entryPoints.push({
              path: entry,
              type: 'main' as EntryPointType,
              exports: []
            });
            break;
          } catch {
            // Try next default entry
          }
        }
      }

      return entryPoints;
    } catch (error) {
      throw new WorkflowError(
        `Failed to identify entry points for library`,
        'ENTRY_POINT_ERROR',
        { libraryPath, error: (error as Error).message }
      );
    }
  }

  /**
   * Extracts public API from entry point files
   * Requirement 2.8: Extract public API from entry point files
   */
  async extractPublicAPI(
    libraryPath: string,
    entryPoints: EntryPoint[]
  ): Promise<APIExport[]> {
    const apiExports: APIExport[] = [];

    for (const entryPoint of entryPoints) {
      const entryFilePath = path.join(libraryPath, entryPoint.path);

      try {
        const content = await fs.readFile(entryFilePath, 'utf-8');

        // Extract exports using regex patterns
        const exports = this.parseExports(content);
        apiExports.push(...exports);

        // Update entry point with export names
        entryPoint.exports = exports.map(e => e.name);
      } catch (error) {
        // Skip files we can't read
        console.warn(`Could not read entry point: ${entryPoint.path}`);
      }
    }

    return apiExports;
  }

  /**
   * Categorizes capabilities into logical groups
   * Requirement 2.6: Categorize by type and group by logical categories
   */
  categorizeCapabilities(
    structure: StructureAnalysis,
    publicAPI: APIExport[]
  ): CapabilityCategories {
    const categories = new Map<string, Capability[]>();
    const uncategorized: Capability[] = [];

    for (const apiExport of publicAPI) {
      const capability: Capability = {
        name: apiExport.name,
        type: this.determineCapabilityType(apiExport),
        description: apiExport.documentation || '',
        exportPath: apiExport.signature
      };

      const category = this.determineCategory(capability, structure);

      if (category) {
        if (!categories.has(category)) {
          categories.set(category, []);
        }
        categories.get(category)!.push(capability);
      } else {
        uncategorized.push(capability);
      }
    }

    return {
      categories,
      uncategorized
    };
  }

  /**
   * Generates markdown visualization of library analysis
   * Requirement 2.7: Generate visualization with structure, capabilities, entry points, dependencies
   */
  generateVisualization(analysis: LibraryAnalysis): string {
    const sections: string[] = [];

    // Header
    sections.push(`# Big Picture: ${analysis.libraryName}\n`);
    sections.push(`**Version**: ${analysis.version}  `);
    sections.push(`**Entry Points**: ${analysis.entryPoints.length}  `);
    sections.push(`**Public Exports**: ${analysis.publicAPI.length}  `);
    sections.push(`**Dependencies**: ${analysis.dependencies.length}\n`);

    // Structure Overview
    sections.push('## Structure Overview\n');
    sections.push('```');
    sections.push(this.generateStructureTree(analysis.structure));
    sections.push('```\n');

    // Capabilities by Category
    sections.push('## Capabilities by Category\n');
    
    if (analysis.capabilities.categories.size > 0) {
      for (const [category, capabilities] of analysis.capabilities.categories) {
        sections.push(`### ${category}\n`);
        for (const capability of capabilities) {
          const desc = capability.description ? `: ${capability.description}` : '';
          sections.push(`- **${capability.name}** (${capability.type})${desc}`);
        }
        sections.push('');
      }
    }

    if (analysis.capabilities.uncategorized.length > 0) {
      sections.push('### Other\n');
      for (const capability of analysis.capabilities.uncategorized) {
        const desc = capability.description ? `: ${capability.description}` : '';
        sections.push(`- **${capability.name}** (${capability.type})${desc}`);
      }
      sections.push('');
    }

    // Entry Points
    sections.push('## Entry Points\n');
    for (let i = 0; i < analysis.entryPoints.length; i++) {
      const ep = analysis.entryPoints[i];
      sections.push(`${i + 1}. **${ep.type === 'main' ? 'Main' : 'Secondary'} Entry**: \`${ep.path}\``);
      if (ep.exports.length > 0) {
        sections.push(`   - Exports: ${ep.exports.slice(0, 10).join(', ')}${ep.exports.length > 10 ? '...' : ''}`);
      }
      sections.push('');
    }

    // Dependencies
    if (analysis.dependencies.length > 0) {
      sections.push('## Dependencies\n');
      const depsByType = this.groupDependenciesByType(analysis.dependencies);
      
      for (const [type, deps] of Object.entries(depsByType)) {
        if (deps.length > 0) {
          sections.push(`### ${this.formatDependencyType(type)}\n`);
          for (const dep of deps) {
            sections.push(`- **${dep.name}**: ${dep.version}`);
          }
          sections.push('');
        }
      }
    }

    // What You Can Build
    sections.push('## What You Can Build\n');
    sections.push(this.generateUseCases(analysis));

    return sections.join('\n');
  }

  /**
   * Generates comparison view for multiple libraries
   * Requirement 2.9, 2.10: Side-by-side analysis highlighting differences
   */
  /**
   * Generates a comparison view highlighting differences across libraries
   * Requirement 2.9: Generate comparison view showing all libraries side-by-side
   * Requirement 2.10: Highlight differences in structure, capabilities, and API design
   */
  generateComparisonView(analyses: LibraryAnalysis[]): string {
    const sections: string[] = [];

    sections.push('# Library Comparison View\n');
    sections.push(`Comparing ${analyses.length} libraries\n`);

    // Overview Table
    sections.push('## Overview\n');
    sections.push('| Library | Version | Exports | Entry Points | Dependencies |');
    sections.push('|---------|---------|---------|--------------|--------------|');
    
    for (const analysis of analyses) {
      sections.push(
        `| ${analysis.libraryName} | ${analysis.version} | ${analysis.publicAPI.length} | ${analysis.entryPoints.length} | ${analysis.dependencies.length} |`
      );
    }
    sections.push('');

    // Structure Comparison with difference highlighting
    sections.push('## Structure Comparison\n');
    sections.push('| Library | Total Files | Total Directories |');
    sections.push('|---------|-------------|-------------------|');
    for (const analysis of analyses) {
      sections.push(
        `| ${analysis.libraryName} | ${analysis.structure.totalFiles} | ${analysis.structure.totalDirectories} |`
      );
    }
    sections.push('');

    // Highlight structural differences
    const structureDiffs = this.highlightStructureDifferences(analyses);
    if (structureDiffs.length > 0) {
      sections.push('**Key Structural Differences:**\n');
      for (const diff of structureDiffs) {
        sections.push(`- ${diff}`);
      }
      sections.push('');
    }

    // Capability Comparison with difference highlighting
    sections.push('## Capability Comparison\n');
    
    // Collect all unique categories
    const allCategories = new Set<string>();
    for (const analysis of analyses) {
      for (const category of analysis.capabilities.categories.keys()) {
        allCategories.add(category);
      }
    }

    for (const category of allCategories) {
      sections.push(`### ${category}\n`);
      sections.push('| Library | Count | Examples |');
      sections.push('|---------|-------|----------|');
      
      for (const analysis of analyses) {
        const capabilities = analysis.capabilities.categories.get(category) || [];
        const examples = capabilities.slice(0, 3).map(c => c.name).join(', ');
        sections.push(`| ${analysis.libraryName} | ${capabilities.length} | ${examples} |`);
      }
      sections.push('');
    }

    // Highlight capability differences
    const capabilityDiffs = this.highlightCapabilityDifferences(analyses, allCategories);
    if (capabilityDiffs.length > 0) {
      sections.push('**Key Capability Differences:**\n');
      for (const diff of capabilityDiffs) {
        sections.push(`- ${diff}`);
      }
      sections.push('');
    }

    // API Design Differences
    sections.push('## API Design Differences\n');
    sections.push(this.generateAPIDesignComparison(analyses));
    sections.push('');

    // Highlight API design differences
    const apiDiffs = this.highlightAPIDesignDifferences(analyses);
    if (apiDiffs.length > 0) {
      sections.push('\n**Key API Design Differences:**\n');
      for (const diff of apiDiffs) {
        sections.push(`- ${diff}`);
      }
      sections.push('');
    }

    // Dependency Comparison
    sections.push('## Dependency Comparison\n');
    sections.push(this.generateDependencyComparison(analyses));

    return sections.join('\n');
  }

  // Private helper methods

  private async getLibraryVersion(libraryPath: string): Promise<string> {
    try {
      const packageJsonPath = path.join(libraryPath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);
      return packageJson.version || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private async extractDependencies(libraryPath: string): Promise<DependencyInfo[]> {
    const dependencies: DependencyInfo[] = [];

    try {
      const packageJsonPath = path.join(libraryPath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);

      // Regular dependencies
      if (packageJson.dependencies) {
        for (const [name, version] of Object.entries(packageJson.dependencies)) {
          dependencies.push({
            name,
            version: version as string,
            type: 'dependency' as DependencyType
          });
        }
      }

      // Peer dependencies
      if (packageJson.peerDependencies) {
        for (const [name, version] of Object.entries(packageJson.peerDependencies)) {
          dependencies.push({
            name,
            version: version as string,
            type: 'peerDependency' as DependencyType
          });
        }
      }

      // Dev dependencies (optional, usually not relevant for analysis)
      if (packageJson.devDependencies) {
        for (const [name, version] of Object.entries(packageJson.devDependencies)) {
          dependencies.push({
            name,
            version: version as string,
            type: 'devDependency' as DependencyType
          });
        }
      }
    } catch {
      // Return empty if package.json can't be read
    }

    return dependencies;
  }

  private parseExportsField(
    exportsField: any,
    entryPoints: EntryPoint[]
  ): void {
    if (typeof exportsField === 'string') {
      entryPoints.push({
        path: exportsField,
        type: 'main' as EntryPointType,
        exports: []
      });
    } else if (typeof exportsField === 'object') {
      for (const [key, value] of Object.entries(exportsField)) {
        if (typeof value === 'string') {
          entryPoints.push({
            path: value,
            type: key === '.' ? 'main' : 'secondary' as EntryPointType,
            exports: []
          });
        } else if (typeof value === 'object' && value !== null) {
          // Handle conditional exports
          const importPath = (value as any).import || (value as any).default;
          if (importPath) {
            entryPoints.push({
              path: importPath,
              type: key === '.' ? 'main' : 'secondary' as EntryPointType,
              exports: []
            });
          }
        }
      }
    }
  }

  private parseExports(content: string): APIExport[] {
    const exports: APIExport[] = [];

    // Pattern 1: export class/interface/type/function/const
    const namedPattern = /export\s+(class|interface|type|function|const|let|var)\s+(\w+)/g;
    let match;
    while ((match = namedPattern.exec(content)) !== null) {
      const name = match[2];
      if (name && !exports.some(e => e.name === name)) {
        exports.push({
          name,
          type: match[1],
          signature: match[0],
          documentation: null
        });
      }
    }

    // Pattern 2: export { a, b, c }
    const bracedPattern = /export\s+\{([^}]+)\}/g;
    while ((match = bracedPattern.exec(content)) !== null) {
      const names = match[1].split(',').map(n => n.trim().split(' as ')[0].trim());
      for (const name of names) {
        if (name && !exports.some(e => e.name === name)) {
          exports.push({
            name,
            type: 'unknown',
            signature: `export { ${name} }`,
            documentation: null
          });
        }
      }
    }

    // Pattern 3: export default
    const defaultPattern = /export\s+default\s+(\w+)/g;
    while ((match = defaultPattern.exec(content)) !== null) {
      const name = match[1];
      if (name && !exports.some(e => e.name === name)) {
        exports.push({
          name,
          type: 'default',
          signature: match[0],
          documentation: null
        });
      }
    }

    return exports;
  }

  private determineCapabilityType(apiExport: APIExport): CapabilityType {
    const name = apiExport.name.toLowerCase();
    const type = apiExport.type.toLowerCase();

    if (name.endsWith('component') || type === 'component') {
      return 'component';
    }
    if (name.endsWith('directive') || type === 'directive') {
      return 'directive';
    }
    if (name.endsWith('service') || type === 'service') {
      return 'service';
    }
    if (type === 'function') {
      return 'function';
    }
    if (type === 'class') {
      return 'class';
    }
    if (type === 'interface' || type === 'type') {
      return 'interface';
    }

    return 'function'; // Default
  }

  private determineCategory(
    capability: Capability,
    structure: StructureAnalysis
  ): string | null {
    const name = capability.name.toLowerCase();

    // Category heuristics based on naming
    if (capability.type === 'component' || name.includes('component')) {
      return 'Components';
    }
    if (capability.type === 'directive' || name.includes('directive')) {
      return 'Directives';
    }
    if (capability.type === 'service' || name.includes('service')) {
      return 'Services';
    }
    if (capability.type === 'interface' || name.includes('interface') || name.includes('type')) {
      return 'Types & Interfaces';
    }
    if (name.includes('util') || name.includes('helper')) {
      return 'Utilities';
    }
    if (name.includes('config') || name.includes('option')) {
      return 'Configuration';
    }

    return null;
  }

  private generateStructureTree(structure: StructureAnalysis): string {
    const lines: string[] = [];
    const libraryName = path.basename(structure.rootPath);

    lines.push(`${libraryName}/`);

    const renderNode = (node: DirectoryNode | FileNode, prefix: string, isLast: boolean) => {
      const connector = isLast ? '└── ' : '├── ';
      const name = 'children' in node ? `${node.name}/` : node.name;
      lines.push(`${prefix}${connector}${name}`);

      if ('children' in node && node.children.length > 0) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        const children = node.children.slice(0, 10); // Limit depth
        children.forEach((child, index) => {
          renderNode(child, newPrefix, index === children.length - 1);
        });
        if (node.children.length > 10) {
          lines.push(`${newPrefix}... (${node.children.length - 10} more)`);
        }
      }
    };

    if (structure.directories.length > 0) {
      const rootNode = structure.directories[0];
      if (rootNode.children.length > 0) {
        rootNode.children.slice(0, 15).forEach((child, index) => {
          renderNode(child, '', index === Math.min(rootNode.children.length, 15) - 1);
        });
        if (rootNode.children.length > 15) {
          lines.push(`... (${rootNode.children.length - 15} more items)`);
        }
      }
    }

    return lines.join('\n');
  }

  private groupDependenciesByType(dependencies: DependencyInfo[]): Record<string, DependencyInfo[]> {
    return {
      dependency: dependencies.filter(d => d.type === 'dependency'),
      peerDependency: dependencies.filter(d => d.type === 'peerDependency'),
      devDependency: dependencies.filter(d => d.type === 'devDependency')
    };
  }

  private formatDependencyType(type: string): string {
    const map: Record<string, string> = {
      dependency: 'Runtime Dependencies',
      peerDependency: 'Peer Dependencies',
      devDependency: 'Development Dependencies'
    };
    return map[type] || type;
  }

  private generateUseCases(analysis: LibraryAnalysis): string {
    const useCases: string[] = [];

    // Generate use cases based on capabilities
    const categories = Array.from(analysis.capabilities.categories.keys());

    if (categories.includes('Components')) {
      useCases.push('- Build UI components and interfaces');
    }
    if (categories.includes('Directives')) {
      useCases.push('- Enhance DOM elements with custom behaviors');
    }
    if (categories.includes('Services')) {
      useCases.push('- Implement business logic and data management');
    }
    if (categories.includes('Utilities')) {
      useCases.push('- Use helper functions for common tasks');
    }

    // Generic use case if no specific categories
    if (useCases.length === 0) {
      useCases.push(`- Integrate ${analysis.libraryName} functionality into your application`);
      useCases.push('- Leverage the library\'s API for your use case');
    }

    return useCases.join('\n');
  }

  /**
   * Highlights structural differences between libraries
   * Requirement 2.10: Highlight differences in structure
   */
  private highlightStructureDifferences(analyses: LibraryAnalysis[]): string[] {
    const diffs: string[] = [];

    if (analyses.length < 2) return diffs;

    const fileCounts = analyses.map(a => a.structure.totalFiles);
    const dirCounts = analyses.map(a => a.structure.totalDirectories);

    const maxFiles = Math.max(...fileCounts);
    const minFiles = Math.min(...fileCounts);
    if (maxFiles > 0 && minFiles > 0 && maxFiles / minFiles >= 2) {
      const largest = analyses[fileCounts.indexOf(maxFiles)].libraryName;
      const smallest = analyses[fileCounts.indexOf(minFiles)].libraryName;
      diffs.push(`${largest} has ${maxFiles} files vs ${smallest} with ${minFiles} files (${Math.round(maxFiles / minFiles)}x larger)`);
    }

    const maxDirs = Math.max(...dirCounts);
    const minDirs = Math.min(...dirCounts);
    if (maxDirs > 0 && minDirs > 0 && maxDirs / minDirs >= 2) {
      const deepest = analyses[dirCounts.indexOf(maxDirs)].libraryName;
      const flattest = analyses[dirCounts.indexOf(minDirs)].libraryName;
      diffs.push(`${deepest} has a deeper directory structure (${maxDirs} dirs) compared to ${flattest} (${minDirs} dirs)`);
    }

    const entryPointCounts = analyses.map(a => a.entryPoints.length);
    const maxEP = Math.max(...entryPointCounts);
    const minEP = Math.min(...entryPointCounts);
    if (maxEP > minEP && maxEP > 1) {
      const moreModular = analyses[entryPointCounts.indexOf(maxEP)].libraryName;
      diffs.push(`${moreModular} exposes ${maxEP} entry points, suggesting a more modular architecture`);
    }

    return diffs;
  }

  /**
   * Highlights capability differences between libraries
   * Requirement 2.10: Highlight differences in capabilities
   */
  private highlightCapabilityDifferences(analyses: LibraryAnalysis[], allCategories: Set<string>): string[] {
    const diffs: string[] = [];

    if (analyses.length < 2) return diffs;

    // Find categories unique to specific libraries
    for (const category of allCategories) {
      const librariesWithCategory = analyses.filter(
        a => (a.capabilities.categories.get(category) || []).length > 0
      );
      const librariesWithout = analyses.filter(
        a => (a.capabilities.categories.get(category) || []).length === 0
      );

      if (librariesWithCategory.length > 0 && librariesWithout.length > 0) {
        const withNames = librariesWithCategory.map(a => a.libraryName).join(', ');
        const withoutNames = librariesWithout.map(a => a.libraryName).join(', ');
        diffs.push(`"${category}" only available in ${withNames} (not in ${withoutNames})`);
      }
    }

    // Highlight significant count differences within shared categories
    for (const category of allCategories) {
      const counts = analyses.map(a => (a.capabilities.categories.get(category) || []).length);
      const max = Math.max(...counts);
      const min = Math.min(...counts);
      if (max > 0 && min > 0 && max / min >= 3) {
        const richest = analyses[counts.indexOf(max)].libraryName;
        const leanest = analyses[counts.indexOf(min)].libraryName;
        diffs.push(`${richest} offers ${max} ${category.toLowerCase()} vs ${leanest} with ${min}`);
      }
    }

    return diffs;
  }

  /**
   * Highlights API design differences between libraries
   * Requirement 2.10: Highlight differences in API design
   */
  private highlightAPIDesignDifferences(analyses: LibraryAnalysis[]): string[] {
    const diffs: string[] = [];

    if (analyses.length < 2) return diffs;

    // Compare API styles
    const styles = analyses.map(a => ({
      name: a.libraryName,
      style: this.determineAPIStyle(a)
    }));

    const uniqueStyles = new Set(styles.map(s => s.style));
    if (uniqueStyles.size > 1) {
      const styleDescriptions = styles.map(s => `${s.name} uses a ${s.style} approach`);
      diffs.push(`Different API paradigms: ${styleDescriptions.join(', ')}`);
    }

    // Compare export counts
    const exportCounts = analyses.map(a => a.publicAPI.length);
    const maxExports = Math.max(...exportCounts);
    const minExports = Math.min(...exportCounts);
    if (maxExports > 0 && minExports > 0 && maxExports / minExports >= 2) {
      const larger = analyses[exportCounts.indexOf(maxExports)].libraryName;
      const smaller = analyses[exportCounts.indexOf(minExports)].libraryName;
      diffs.push(`${larger} exposes a larger API surface (${maxExports} exports) vs ${smaller} (${minExports} exports)`);
    }

    return diffs;
  }

  private generateAPIDesignComparison(analyses: LibraryAnalysis[]): string {
    const lines: string[] = [];

    lines.push('| Library | API Style | Export Count | Main Patterns |');
    lines.push('|---------|-----------|--------------|---------------|');

    for (const analysis of analyses) {
      const apiStyle = this.determineAPIStyle(analysis);
      const mainPatterns = this.identifyMainPatterns(analysis);
      
      lines.push(
        `| ${analysis.libraryName} | ${apiStyle} | ${analysis.publicAPI.length} | ${mainPatterns} |`
      );
    }

    return lines.join('\n');
  }

  private generateDependencyComparison(analyses: LibraryAnalysis[]): string {
    const lines: string[] = [];

    lines.push('| Library | Total | Runtime | Peer | Dev |');
    lines.push('|---------|-------|---------|------|-----|');

    for (const analysis of analyses) {
      const byType = this.groupDependenciesByType(analysis.dependencies);
      lines.push(
        `| ${analysis.libraryName} | ${analysis.dependencies.length} | ${byType.dependency.length} | ${byType.peerDependency.length} | ${byType.devDependency.length} |`
      );
    }

    return lines.join('\n');
  }

  private determineAPIStyle(analysis: LibraryAnalysis): string {
    const hasClasses = analysis.publicAPI.some(e => e.type === 'class');
    const hasFunctions = analysis.publicAPI.some(e => e.type === 'function');
    const hasInterfaces = analysis.publicAPI.some(e => e.type === 'interface' || e.type === 'type');

    if (hasClasses && hasFunctions) return 'Mixed';
    if (hasClasses) return 'Class-based';
    if (hasFunctions) return 'Functional';
    if (hasInterfaces) return 'Type-only';
    return 'Unknown';
  }

  private identifyMainPatterns(analysis: LibraryAnalysis): string {
    const patterns: string[] = [];
    const categories = Array.from(analysis.capabilities.categories.keys());

    if (categories.includes('Components')) patterns.push('Components');
    if (categories.includes('Services')) patterns.push('Services');
    if (categories.includes('Utilities')) patterns.push('Utils');

    return patterns.length > 0 ? patterns.join(', ') : 'Various';
  }
}
