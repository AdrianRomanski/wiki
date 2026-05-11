/**
 * Type definitions for library analysis and big picture generation
 * Feature: polished-research-workflow
 */

/**
 * Capability type classification
 */
export type CapabilityType = 
  | 'component' 
  | 'directive' 
  | 'service' 
  | 'function' 
  | 'class' 
  | 'interface';

/**
 * Entry point type classification
 */
export type EntryPointType = 'main' | 'secondary' | 'submodule';

/**
 * Dependency type classification
 */
export type DependencyType = 'dependency' | 'peerDependency' | 'devDependency';

/**
 * Directory node in library structure
 */
export interface DirectoryNode {
  name: string;
  path: string;
  children: (DirectoryNode | FileNode)[];
}

/**
 * File node in library structure
 */
export interface FileNode {
  name: string;
  path: string;
  extension: string;
  size: number;
}

/**
 * Library structure analysis result
 */
export interface StructureAnalysis {
  rootPath: string;
  directories: DirectoryNode[];
  files: FileNode[];
  totalFiles: number;
  totalDirectories: number;
}

/**
 * Individual capability within a library
 */
export interface Capability {
  name: string;
  type: CapabilityType;
  description: string;
  exportPath: string;
}

/**
 * Categorized capabilities
 */
export interface CapabilityCategories {
  categories: Map<string, Capability[]>;
  uncategorized: Capability[];
}

/**
 * Library entry point information
 */
export interface EntryPoint {
  path: string;
  type: EntryPointType;
  exports: string[];
}

/**
 * Public API export information
 */
export interface APIExport {
  name: string;
  type: string;
  signature: string;
  documentation: string | null;
}

/**
 * Dependency information
 */
export interface DependencyInfo {
  name: string;
  version: string;
  type: DependencyType;
}

/**
 * Complete library analysis result
 */
export interface LibraryAnalysis {
  libraryName: string;
  version: string;
  structure: StructureAnalysis;
  capabilities: CapabilityCategories;
  entryPoints: EntryPoint[];
  publicAPI: APIExport[];
  dependencies: DependencyInfo[];
}
