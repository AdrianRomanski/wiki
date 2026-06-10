import type { FileSystemPort, FrontmatterPort, MarkdownPort } from '@wiki/application-ports';
import {
  validateAllLinks,
  detectDuplicates,
  detectContradictions,
  suggestConsolidation,
  findOrphans,
  generateMaintenanceReport,
} from '@wiki/application-maintenance';

export interface MaintenanceFunctions {
  validateAllLinks: () => ReturnType<typeof validateAllLinks>;
  detectDuplicates: (similarityThreshold?: number) => ReturnType<typeof detectDuplicates>;
  detectContradictions: () => ReturnType<typeof detectContradictions>;
  suggestConsolidation: () => ReturnType<typeof suggestConsolidation>;
  findOrphans: () => ReturnType<typeof findOrphans>;
  generateMaintenanceReport: () => ReturnType<typeof generateMaintenanceReport>;
}

export function createMaintenanceFunctions(
  fileSystemPort: FileSystemPort,
  frontmatterPort: FrontmatterPort,
  markdownPort: MarkdownPort
): MaintenanceFunctions {
  return {
    validateAllLinks: () => validateAllLinks(fileSystemPort, frontmatterPort, markdownPort),
    detectDuplicates: (similarityThreshold?: number) => 
      detectDuplicates(fileSystemPort, frontmatterPort, similarityThreshold),
    detectContradictions: () => detectContradictions(fileSystemPort, frontmatterPort, markdownPort),
    suggestConsolidation: () => suggestConsolidation(fileSystemPort, frontmatterPort),
    findOrphans: () => findOrphans(fileSystemPort, frontmatterPort, markdownPort),
    generateMaintenanceReport: () => 
      generateMaintenanceReport(fileSystemPort, frontmatterPort, markdownPort),
  };
}
