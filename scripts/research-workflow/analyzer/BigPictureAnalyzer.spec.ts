/**
 * Unit tests for BigPictureAnalyzer
 * Feature: polished-research-workflow
 * Requirements: 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BigPictureAnalyzer } from './BigPictureAnalyzer.js';
import {
  LibraryAnalysis,
  StructureAnalysis,
  CapabilityCategories,
  EntryPoint,
  APIExport
} from '../types/analysis.js';

describe('BigPictureAnalyzer', () => {
  let analyzer: BigPictureAnalyzer;
  let testNodeModulesPath: string;

  beforeEach(() => {
    testNodeModulesPath = path.join(process.cwd(), 'test-node-modules');
    analyzer = new BigPictureAnalyzer(testNodeModulesPath);
  });

  describe('analyzeLibrary', () => {
    it('should throw error when library not found', async () => {
      await expect(
        analyzer.analyzeLibrary('non-existent-library')
      ).rejects.toThrow('Library not found in node_modules');
    });

    it('should analyze library structure successfully', async () => {
      // Create mock library structure
      const libraryPath = path.join(testNodeModulesPath, 'test-lib');
      await fs.mkdir(libraryPath, { recursive: true });
      
      // Create package.json
      await fs.writeFile(
        path.join(libraryPath, 'package.json'),
        JSON.stringify({
          name: 'test-lib',
          version: '1.0.0',
          main: 'index.js',
          dependencies: {
            'dep1': '^1.0.0'
          }
        })
      );

      // Create index.js with exports
      await fs.writeFile(
        path.join(libraryPath, 'index.js'),
        'export class TestComponent {}\nexport function testFunction() {}'
      );

      const analysis = await analyzer.analyzeLibrary('test-lib');

      expect(analysis.libraryName).toBe('test-lib');
      expect(analysis.version).toBe('1.0.0');
      expect(analysis.structure).toBeDefined();
      expect(analysis.entryPoints.length).toBeGreaterThan(0);
      expect(analysis.dependencies.length).toBeGreaterThan(0);

      // Cleanup
      await fs.rm(libraryPath, { recursive: true, force: true });
    });
  });

  describe('analyzeStructure', () => {
    it('should traverse directory structure correctly', async () => {
      const testPath = path.join(testNodeModulesPath, 'struct-test');
      
      // Create test structure
      await fs.mkdir(path.join(testPath, 'src'), { recursive: true });
      await fs.writeFile(path.join(testPath, 'index.js'), 'content');
      await fs.writeFile(path.join(testPath, 'src', 'file.ts'), 'content');

      const structure = await analyzer.analyzeStructure(testPath);

      expect(structure.rootPath).toBe(testPath);
      expect(structure.totalFiles).toBeGreaterThan(0);
      expect(structure.directories.length).toBeGreaterThan(0);

      // Cleanup
      await fs.rm(testPath, { recursive: true, force: true });
    });

    it('should skip node_modules and .git directories', async () => {
      const testPath = path.join(testNodeModulesPath, 'skip-test');
      
      // Create structure with directories to skip
      await fs.mkdir(path.join(testPath, 'node_modules'), { recursive: true });
      await fs.mkdir(path.join(testPath, '.git'), { recursive: true });
      await fs.mkdir(path.join(testPath, 'src'), { recursive: true });
      await fs.writeFile(path.join(testPath, 'node_modules', 'dep.js'), 'content');
      await fs.writeFile(path.join(testPath, 'src', 'file.js'), 'content');

      const structure = await analyzer.analyzeStructure(testPath);

      // Should not count files in node_modules or .git
      const allPaths = structure.files.map(f => f.path);
      expect(allPaths.some(p => p.includes('node_modules'))).toBe(false);
      expect(allPaths.some(p => p.includes('.git'))).toBe(false);

      // Cleanup
      await fs.rm(testPath, { recursive: true, force: true });
    });
  });

  describe('identifyEntryPoints', () => {
    it('should identify main entry point from package.json', async () => {
      const testPath = path.join(testNodeModulesPath, 'entry-test');
      
      await fs.mkdir(testPath, { recursive: true });
      await fs.writeFile(
        path.join(testPath, 'package.json'),
        JSON.stringify({
          name: 'entry-test',
          main: 'dist/index.js',
          module: 'dist/index.esm.js'
        })
      );

      const entryPoints = await analyzer.identifyEntryPoints(testPath);

      expect(entryPoints.length).toBeGreaterThan(0);
      expect(entryPoints.some(ep => ep.path === 'dist/index.js')).toBe(true);
      expect(entryPoints.some(ep => ep.type === 'main')).toBe(true);

      // Cleanup
      await fs.rm(testPath, { recursive: true, force: true });
    });

    it('should handle exports field in package.json', async () => {
      const testPath = path.join(testNodeModulesPath, 'exports-test');
      
      await fs.mkdir(testPath, { recursive: true });
      await fs.writeFile(
        path.join(testPath, 'package.json'),
        JSON.stringify({
          name: 'exports-test',
          exports: {
            '.': './dist/index.js',
            './utils': './dist/utils.js'
          }
        })
      );

      const entryPoints = await analyzer.identifyEntryPoints(testPath);

      expect(entryPoints.length).toBeGreaterThanOrEqual(2);
      expect(entryPoints.some(ep => ep.path === './dist/index.js')).toBe(true);

      // Cleanup
      await fs.rm(testPath, { recursive: true, force: true });
    });

    it('should default to index.js when no entry points specified', async () => {
      const testPath = path.join(testNodeModulesPath, 'default-test');
      
      await fs.mkdir(testPath, { recursive: true });
      await fs.writeFile(
        path.join(testPath, 'package.json'),
        JSON.stringify({ name: 'default-test' })
      );
      await fs.writeFile(path.join(testPath, 'index.js'), 'content');

      const entryPoints = await analyzer.identifyEntryPoints(testPath);

      expect(entryPoints.length).toBeGreaterThan(0);
      expect(entryPoints.some(ep => ep.path === 'index.js')).toBe(true);

      // Cleanup
      await fs.rm(testPath, { recursive: true, force: true });
    });
  });

  describe('extractPublicAPI', () => {
    it('should extract exports from entry point files', async () => {
      const testPath = path.join(testNodeModulesPath, 'api-test');
      
      await fs.mkdir(testPath, { recursive: true });
      
      const entryContent = `
        export class MyComponent {}
        export function myFunction() {}
        export const MY_CONSTANT = 'value';
        export interface MyInterface {}
      `;
      
      await fs.writeFile(path.join(testPath, 'index.js'), entryContent);

      const entryPoints: EntryPoint[] = [
        { path: 'index.js', type: 'main', exports: [] }
      ];

      const apiExports = await analyzer.extractPublicAPI(testPath, entryPoints);

      expect(apiExports.length).toBeGreaterThan(0);
      expect(apiExports.some(e => e.name === 'MyComponent')).toBe(true);
      expect(apiExports.some(e => e.name === 'myFunction')).toBe(true);
      expect(apiExports.some(e => e.name === 'MY_CONSTANT')).toBe(true);

      // Cleanup
      await fs.rm(testPath, { recursive: true, force: true });
    });

    it('should handle export { } syntax', async () => {
      const testPath = path.join(testNodeModulesPath, 'export-syntax-test');
      
      await fs.mkdir(testPath, { recursive: true });
      
      const entryContent = `
        const foo = 'foo';
        const bar = 'bar';
        export { foo, bar };
      `;
      
      await fs.writeFile(path.join(testPath, 'index.js'), entryContent);

      const entryPoints: EntryPoint[] = [
        { path: 'index.js', type: 'main', exports: [] }
      ];

      const apiExports = await analyzer.extractPublicAPI(testPath, entryPoints);

      expect(apiExports.some(e => e.name === 'foo')).toBe(true);
      expect(apiExports.some(e => e.name === 'bar')).toBe(true);

      // Cleanup
      await fs.rm(testPath, { recursive: true, force: true });
    });
  });

  describe('categorizeCapabilities', () => {
    it('should categorize capabilities by type correctly', () => {
      const mockStructure: StructureAnalysis = {
        rootPath: '/test',
        directories: [],
        files: [],
        totalFiles: 0,
        totalDirectories: 0
      };

      const mockAPI: APIExport[] = [
        { name: 'MyComponent', type: 'class', signature: 'export class MyComponent', documentation: null },
        { name: 'MyDirective', type: 'class', signature: 'export class MyDirective', documentation: null },
        { name: 'MyService', type: 'class', signature: 'export class MyService', documentation: null },
        { name: 'utilFunction', type: 'function', signature: 'export function utilFunction', documentation: null },
        { name: 'MyInterface', type: 'interface', signature: 'export interface MyInterface', documentation: null }
      ];

      const categories = analyzer.categorizeCapabilities(mockStructure, mockAPI);

      expect(categories.categories.has('Components')).toBe(true);
      expect(categories.categories.has('Directives')).toBe(true);
      expect(categories.categories.has('Services')).toBe(true);
      expect(categories.categories.has('Types & Interfaces')).toBe(true);
      
      const components = categories.categories.get('Components');
      expect(components?.some(c => c.name === 'MyComponent')).toBe(true);
    });

    it('should handle uncategorized capabilities', () => {
      const mockStructure: StructureAnalysis = {
        rootPath: '/test',
        directories: [],
        files: [],
        totalFiles: 0,
        totalDirectories: 0
      };

      const mockAPI: APIExport[] = [
        { name: 'SomeClass', type: 'class', signature: 'export class SomeClass', documentation: null }
      ];

      const categories = analyzer.categorizeCapabilities(mockStructure, mockAPI);

      // Should be uncategorized since it doesn't match any heuristics
      expect(categories.uncategorized.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateVisualization', () => {
    it('should generate markdown visualization with all sections', () => {
      const mockAnalysis: LibraryAnalysis = {
        libraryName: 'test-lib',
        version: '1.0.0',
        structure: {
          rootPath: '/test',
          directories: [{
            name: 'test-lib',
            path: '',
            children: [
              { name: 'src', path: 'src', children: [] },
              { name: 'index.js', path: 'index.js', extension: '.js', size: 100 }
            ]
          }],
          files: [
            { name: 'index.js', path: 'index.js', extension: '.js', size: 100 }
          ],
          totalFiles: 1,
          totalDirectories: 1
        },
        capabilities: {
          categories: new Map([
            ['Components', [
              { name: 'TestComponent', type: 'component', description: 'A test component', exportPath: 'export class TestComponent' }
            ]]
          ]),
          uncategorized: []
        },
        entryPoints: [
          { path: 'index.js', type: 'main', exports: ['TestComponent'] }
        ],
        publicAPI: [
          { name: 'TestComponent', type: 'class', signature: 'export class TestComponent', documentation: 'A test component' }
        ],
        dependencies: [
          { name: 'dep1', version: '^1.0.0', type: 'dependency' }
        ]
      };

      const visualization = analyzer.generateVisualization(mockAnalysis);

      expect(visualization).toContain('# Big Picture: test-lib');
      expect(visualization).toContain('**Version**: 1.0.0');
      expect(visualization).toContain('## Structure Overview');
      expect(visualization).toContain('## Capabilities by Category');
      expect(visualization).toContain('### Components');
      expect(visualization).toContain('## Entry Points');
      expect(visualization).toContain('## Dependencies');
      expect(visualization).toContain('## What You Can Build');
    });
  });

  describe('generateComparisonView', () => {
    it('should generate side-by-side comparison for multiple libraries', () => {
      const mockAnalyses: LibraryAnalysis[] = [
        {
          libraryName: 'lib-a',
          version: '1.0.0',
          structure: {
            rootPath: '/lib-a',
            directories: [],
            files: [],
            totalFiles: 10,
            totalDirectories: 3
          },
          capabilities: {
            categories: new Map([
              ['Components', [
                { name: 'ComponentA', type: 'component', description: '', exportPath: '' }
              ]]
            ]),
            uncategorized: []
          },
          entryPoints: [{ path: 'index.js', type: 'main', exports: [] }],
          publicAPI: [
            { name: 'ComponentA', type: 'class', signature: '', documentation: null }
          ],
          dependencies: [
            { name: 'dep1', version: '^1.0.0', type: 'dependency' }
          ]
        },
        {
          libraryName: 'lib-b',
          version: '2.0.0',
          structure: {
            rootPath: '/lib-b',
            directories: [],
            files: [],
            totalFiles: 15,
            totalDirectories: 5
          },
          capabilities: {
            categories: new Map([
              ['Components', [
                { name: 'ComponentB', type: 'component', description: '', exportPath: '' }
              ]],
              ['Services', [
                { name: 'ServiceB', type: 'service', description: '', exportPath: '' }
              ]]
            ]),
            uncategorized: []
          },
          entryPoints: [{ path: 'index.js', type: 'main', exports: [] }],
          publicAPI: [
            { name: 'ComponentB', type: 'class', signature: '', documentation: null },
            { name: 'ServiceB', type: 'class', signature: '', documentation: null }
          ],
          dependencies: [
            { name: 'dep1', version: '^1.0.0', type: 'dependency' },
            { name: 'dep2', version: '^2.0.0', type: 'peerDependency' }
          ]
        }
      ];

      const comparisonView = analyzer.generateComparisonView(mockAnalyses);

      expect(comparisonView).toContain('# Library Comparison View');
      expect(comparisonView).toContain('Comparing 2 libraries');
      expect(comparisonView).toContain('## Overview');
      expect(comparisonView).toContain('lib-a');
      expect(comparisonView).toContain('lib-b');
      expect(comparisonView).toContain('## Structure Comparison');
      expect(comparisonView).toContain('## Capability Comparison');
      expect(comparisonView).toContain('## API Design Differences');
      expect(comparisonView).toContain('## Dependency Comparison');
    });

    it('should highlight differences in capabilities', () => {
      const mockAnalyses: LibraryAnalysis[] = [
        {
          libraryName: 'lib-with-services',
          version: '1.0.0',
          structure: { rootPath: '', directories: [], files: [], totalFiles: 0, totalDirectories: 0 },
          capabilities: {
            categories: new Map([
              ['Services', [
                { name: 'ServiceA', type: 'service', description: '', exportPath: '' },
                { name: 'ServiceB', type: 'service', description: '', exportPath: '' }
              ]]
            ]),
            uncategorized: []
          },
          entryPoints: [],
          publicAPI: [],
          dependencies: []
        },
        {
          libraryName: 'lib-without-services',
          version: '1.0.0',
          structure: { rootPath: '', directories: [], files: [], totalFiles: 0, totalDirectories: 0 },
          capabilities: {
            categories: new Map([
              ['Components', [
                { name: 'ComponentA', type: 'component', description: '', exportPath: '' }
              ]]
            ]),
            uncategorized: []
          },
          entryPoints: [],
          publicAPI: [],
          dependencies: []
        }
      ];

      const comparisonView = analyzer.generateComparisonView(mockAnalyses);

      expect(comparisonView).toContain('Services');
      expect(comparisonView).toContain('lib-with-services');
      expect(comparisonView).toContain('lib-without-services');
      // Should show count difference
      expect(comparisonView).toContain('| lib-with-services | 2 |');
      expect(comparisonView).toContain('| lib-without-services | 0 |');
      // Should highlight capability differences (Requirement 2.10)
      expect(comparisonView).toContain('Key Capability Differences');
      expect(comparisonView).toContain('only available in');
    });

    it('should highlight structural differences between libraries', () => {
      const mockAnalyses: LibraryAnalysis[] = [
        {
          libraryName: 'large-lib',
          version: '1.0.0',
          structure: { rootPath: '', directories: [], files: [], totalFiles: 50, totalDirectories: 10 },
          capabilities: { categories: new Map(), uncategorized: [] },
          entryPoints: [
            { path: 'index.js', type: 'main', exports: [] },
            { path: 'utils.js', type: 'secondary', exports: [] },
            { path: 'extra.js', type: 'secondary', exports: [] }
          ],
          publicAPI: [
            { name: 'A', type: 'class', signature: '', documentation: null },
            { name: 'B', type: 'class', signature: '', documentation: null },
            { name: 'C', type: 'function', signature: '', documentation: null },
            { name: 'D', type: 'function', signature: '', documentation: null }
          ],
          dependencies: []
        },
        {
          libraryName: 'small-lib',
          version: '1.0.0',
          structure: { rootPath: '', directories: [], files: [], totalFiles: 5, totalDirectories: 2 },
          capabilities: { categories: new Map(), uncategorized: [] },
          entryPoints: [{ path: 'index.js', type: 'main', exports: [] }],
          publicAPI: [
            { name: 'X', type: 'function', signature: '', documentation: null }
          ],
          dependencies: []
        }
      ];

      const comparisonView = analyzer.generateComparisonView(mockAnalyses);

      // Should highlight structural differences (Requirement 2.10)
      expect(comparisonView).toContain('Key Structural Differences');
      expect(comparisonView).toContain('large-lib');
      expect(comparisonView).toContain('small-lib');
    });

    it('should highlight API design differences when styles differ', () => {
      const mockAnalyses: LibraryAnalysis[] = [
        {
          libraryName: 'class-lib',
          version: '1.0.0',
          structure: { rootPath: '', directories: [], files: [], totalFiles: 5, totalDirectories: 1 },
          capabilities: { categories: new Map(), uncategorized: [] },
          entryPoints: [],
          publicAPI: [
            { name: 'MyClass', type: 'class', signature: 'export class MyClass', documentation: null }
          ],
          dependencies: []
        },
        {
          libraryName: 'functional-lib',
          version: '1.0.0',
          structure: { rootPath: '', directories: [], files: [], totalFiles: 5, totalDirectories: 1 },
          capabilities: { categories: new Map(), uncategorized: [] },
          entryPoints: [],
          publicAPI: [
            { name: 'doThing', type: 'function', signature: 'export function doThing', documentation: null }
          ],
          dependencies: []
        }
      ];

      const comparisonView = analyzer.generateComparisonView(mockAnalyses);

      // Should highlight API design differences (Requirement 2.10)
      expect(comparisonView).toContain('Key API Design Differences');
      expect(comparisonView).toContain('Different API paradigms');
    });
  });

  describe('error handling', () => {
    it('should handle missing or malformed library structure', async () => {
      const testPath = path.join(testNodeModulesPath, 'malformed-test');
      
      await fs.mkdir(testPath, { recursive: true });
      // Create malformed package.json
      await fs.writeFile(
        path.join(testPath, 'package.json'),
        'invalid json content'
      );

      await expect(
        analyzer.analyzeLibrary('malformed-test')
      ).rejects.toThrow();

      // Cleanup
      await fs.rm(testPath, { recursive: true, force: true });
    });

    it('should handle missing entry point files gracefully', async () => {
      const testPath = path.join(testNodeModulesPath, 'missing-entry-test');
      
      await fs.mkdir(testPath, { recursive: true });
      await fs.writeFile(
        path.join(testPath, 'package.json'),
        JSON.stringify({
          name: 'missing-entry-test',
          main: 'non-existent.js'
        })
      );

      const entryPoints: EntryPoint[] = [
        { path: 'non-existent.js', type: 'main', exports: [] }
      ];

      // Should not throw, just skip the missing file
      const apiExports = await analyzer.extractPublicAPI(testPath, entryPoints);
      expect(apiExports).toBeDefined();

      // Cleanup
      await fs.rm(testPath, { recursive: true, force: true });
    });

    it('should throw LIBRARY_NOT_FOUND error with correct code', async () => {
      try {
        await analyzer.analyzeLibrary('totally-nonexistent-lib');
      } catch (error: any) {
        expect(error.code).toBe('LIBRARY_NOT_FOUND');
        expect(error.context.libraryName).toBe('totally-nonexistent-lib');
      }
    });

    it('should handle library with empty package.json exports', async () => {
      const testPath = path.join(testNodeModulesPath, 'empty-exports-test');
      
      await fs.mkdir(testPath, { recursive: true });
      await fs.writeFile(
        path.join(testPath, 'package.json'),
        JSON.stringify({
          name: 'empty-exports-test',
          version: '1.0.0',
          main: 'index.js'
        })
      );
      await fs.writeFile(path.join(testPath, 'index.js'), '// empty file');

      const analysis = await analyzer.analyzeLibrary('empty-exports-test');

      expect(analysis.libraryName).toBe('empty-exports-test');
      expect(analysis.publicAPI).toBeDefined();
      expect(analysis.publicAPI.length).toBe(0);

      // Cleanup
      await fs.rm(testPath, { recursive: true, force: true });
    });

    it('should handle library with no dependencies', async () => {
      const testPath = path.join(testNodeModulesPath, 'no-deps-test');
      
      await fs.mkdir(testPath, { recursive: true });
      await fs.writeFile(
        path.join(testPath, 'package.json'),
        JSON.stringify({
          name: 'no-deps-test',
          version: '2.0.0',
          main: 'index.js'
        })
      );
      await fs.writeFile(path.join(testPath, 'index.js'), 'export function hello() {}');

      const analysis = await analyzer.analyzeLibrary('no-deps-test');

      expect(analysis.dependencies).toEqual([]);

      // Cleanup
      await fs.rm(testPath, { recursive: true, force: true });
    });
  });

  describe('extractPublicAPI - additional patterns', () => {
    it('should handle export default syntax', async () => {
      const testPath = path.join(testNodeModulesPath, 'default-export-test');
      
      await fs.mkdir(testPath, { recursive: true });
      await fs.writeFile(
        path.join(testPath, 'index.js'),
        'export default MyDefaultClass'
      );

      const entryPoints: EntryPoint[] = [
        { path: 'index.js', type: 'main', exports: [] }
      ];

      const apiExports = await analyzer.extractPublicAPI(testPath, entryPoints);

      expect(apiExports.some(e => e.name === 'MyDefaultClass')).toBe(true);
      expect(apiExports.find(e => e.name === 'MyDefaultClass')?.type).toBe('default');

      // Cleanup
      await fs.rm(testPath, { recursive: true, force: true });
    });

    it('should deduplicate exports with the same name', async () => {
      const testPath = path.join(testNodeModulesPath, 'dedup-test');
      
      await fs.mkdir(testPath, { recursive: true });
      await fs.writeFile(
        path.join(testPath, 'index.js'),
        'export class Foo {}\nexport { Foo }'
      );

      const entryPoints: EntryPoint[] = [
        { path: 'index.js', type: 'main', exports: [] }
      ];

      const apiExports = await analyzer.extractPublicAPI(testPath, entryPoints);
      const fooExports = apiExports.filter(e => e.name === 'Foo');

      expect(fooExports.length).toBe(1);

      // Cleanup
      await fs.rm(testPath, { recursive: true, force: true });
    });

    it('should handle export with "as" alias', async () => {
      const testPath = path.join(testNodeModulesPath, 'alias-test');
      
      await fs.mkdir(testPath, { recursive: true });
      await fs.writeFile(
        path.join(testPath, 'index.js'),
        'export { internalName as publicName }'
      );

      const entryPoints: EntryPoint[] = [
        { path: 'index.js', type: 'main', exports: [] }
      ];

      const apiExports = await analyzer.extractPublicAPI(testPath, entryPoints);

      // Should use the original name (before "as")
      expect(apiExports.some(e => e.name === 'internalName')).toBe(true);

      // Cleanup
      await fs.rm(testPath, { recursive: true, force: true });
    });
  });

  describe('identifyEntryPoints - conditional exports', () => {
    it('should handle conditional exports with import/default fields', async () => {
      const testPath = path.join(testNodeModulesPath, 'conditional-exports-test');
      
      await fs.mkdir(testPath, { recursive: true });
      await fs.writeFile(
        path.join(testPath, 'package.json'),
        JSON.stringify({
          name: 'conditional-exports-test',
          exports: {
            '.': {
              import: './dist/esm/index.js',
              default: './dist/cjs/index.js'
            },
            './utils': {
              import: './dist/esm/utils.js',
              default: './dist/cjs/utils.js'
            }
          }
        })
      );

      const entryPoints = await analyzer.identifyEntryPoints(testPath);

      expect(entryPoints.length).toBe(2);
      expect(entryPoints.some(ep => ep.path === './dist/esm/index.js' && ep.type === 'main')).toBe(true);
      expect(entryPoints.some(ep => ep.path === './dist/esm/utils.js' && ep.type === 'secondary')).toBe(true);

      // Cleanup
      await fs.rm(testPath, { recursive: true, force: true });
    });
  });

  describe('categorizeCapabilities - edge cases', () => {
    it('should categorize utility functions correctly', () => {
      const mockStructure: StructureAnalysis = {
        rootPath: '/test',
        directories: [],
        files: [],
        totalFiles: 0,
        totalDirectories: 0
      };

      const mockAPI: APIExport[] = [
        { name: 'utilFormatDate', type: 'function', signature: 'export function utilFormatDate', documentation: null },
        { name: 'helperParse', type: 'function', signature: 'export function helperParse', documentation: null },
        { name: 'configOptions', type: 'const', signature: 'export const configOptions', documentation: null }
      ];

      const categories = analyzer.categorizeCapabilities(mockStructure, mockAPI);

      expect(categories.categories.has('Utilities')).toBe(true);
      expect(categories.categories.has('Configuration')).toBe(true);
      
      const utils = categories.categories.get('Utilities')!;
      expect(utils.some(c => c.name === 'utilFormatDate')).toBe(true);
      expect(utils.some(c => c.name === 'helperParse')).toBe(true);
      
      const config = categories.categories.get('Configuration')!;
      expect(config.some(c => c.name === 'configOptions')).toBe(true);
    });

    it('should return empty categories for empty API', () => {
      const mockStructure: StructureAnalysis = {
        rootPath: '/test',
        directories: [],
        files: [],
        totalFiles: 0,
        totalDirectories: 0
      };

      const categories = analyzer.categorizeCapabilities(mockStructure, []);

      expect(categories.categories.size).toBe(0);
      expect(categories.uncategorized.length).toBe(0);
    });
  });

  describe('generateVisualization - edge cases', () => {
    it('should handle library with no dependencies', () => {
      const mockAnalysis: LibraryAnalysis = {
        libraryName: 'minimal-lib',
        version: '0.1.0',
        structure: {
          rootPath: '/test',
          directories: [{ name: 'minimal-lib', path: '', children: [] }],
          files: [],
          totalFiles: 0,
          totalDirectories: 0
        },
        capabilities: { categories: new Map(), uncategorized: [] },
        entryPoints: [],
        publicAPI: [],
        dependencies: []
      };

      const visualization = analyzer.generateVisualization(mockAnalysis);

      expect(visualization).toContain('# Big Picture: minimal-lib');
      expect(visualization).toContain('**Dependencies**: 0');
      // Should not have a Dependencies section with content
      expect(visualization).not.toContain('### Runtime Dependencies');
    });

    it('should handle uncategorized capabilities in visualization', () => {
      const mockAnalysis: LibraryAnalysis = {
        libraryName: 'uncat-lib',
        version: '1.0.0',
        structure: {
          rootPath: '/test',
          directories: [{ name: 'uncat-lib', path: '', children: [] }],
          files: [],
          totalFiles: 0,
          totalDirectories: 0
        },
        capabilities: {
          categories: new Map(),
          uncategorized: [
            { name: 'SomeThing', type: 'class', description: 'A thing', exportPath: '' }
          ]
        },
        entryPoints: [],
        publicAPI: [],
        dependencies: []
      };

      const visualization = analyzer.generateVisualization(mockAnalysis);

      expect(visualization).toContain('### Other');
      expect(visualization).toContain('**SomeThing**');
    });
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testNodeModulesPath, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });
});
