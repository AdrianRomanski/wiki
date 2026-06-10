import { FileSystemPort, FrontmatterPort, MarkdownPort } from '@wiki/application-ports';
import { DetectDuplicatesUseCase } from './detect-duplicates-use-case';
import { DetectContradictionsUseCase } from './detect-contradictions-use-case';
import { DetectBrokenLinksUseCase } from './detect-broken-links-use-case';
import { DetectOrphansUseCase } from './detect-orphans-use-case';
import { GenerateMaintenanceReportUseCase } from './generate-maintenance-report-use-case';

export async function validateAllLinks(
  fileSystemPort: FileSystemPort,
  frontmatterPort: FrontmatterPort,
  markdownPort: MarkdownPort
) {
  const useCase = new DetectBrokenLinksUseCase(
    fileSystemPort,
    markdownPort,
    frontmatterPort
  );

  return useCase.execute();
}

export async function detectDuplicates(
  fileSystemPort: FileSystemPort,
  frontmatterPort: FrontmatterPort,
  similarityThreshold = 0.7
) {
  const useCase = new DetectDuplicatesUseCase(
    fileSystemPort,
    frontmatterPort
  );

  return useCase.execute(similarityThreshold);
}

export async function detectContradictions(
  fileSystemPort: FileSystemPort,
  frontmatterPort: FrontmatterPort,
  markdownPort: MarkdownPort
) {
  const useCase = new DetectContradictionsUseCase(
    fileSystemPort,
    markdownPort,
    frontmatterPort
  );

  return useCase.execute();
}

export async function suggestConsolidation(
  fileSystemPort: FileSystemPort,
  frontmatterPort: FrontmatterPort
) {
  const duplicates = await detectDuplicates(fileSystemPort, frontmatterPort, 0.5);
  
  return duplicates.map(dup => ({
    pages: [dup.page1, dup.page2],
    reason: `${Math.round(dup.similarity * 100)}% similar content`,
    suggestedAction: dup.recommendation,
  }));
}

export async function findOrphans(
  fileSystemPort: FileSystemPort,
  frontmatterPort: FrontmatterPort,
  markdownPort: MarkdownPort
) {
  const useCase = new DetectOrphansUseCase(
    fileSystemPort,
    markdownPort,
    frontmatterPort
  );

  return useCase.execute();
}

export async function generateMaintenanceReport(
  fileSystemPort: FileSystemPort,
  frontmatterPort: FrontmatterPort,
  markdownPort: MarkdownPort
) {
  const detectDuplicatesUseCase = new DetectDuplicatesUseCase(
    fileSystemPort,
    frontmatterPort
  );

  const detectContradictionsUseCase = new DetectContradictionsUseCase(
    fileSystemPort,
    markdownPort,
    frontmatterPort
  );

  const detectBrokenLinksUseCase = new DetectBrokenLinksUseCase(
    fileSystemPort,
    markdownPort,
    frontmatterPort
  );

  const detectOrphansUseCase = new DetectOrphansUseCase(
    fileSystemPort,
    markdownPort,
    frontmatterPort
  );

  const useCase = new GenerateMaintenanceReportUseCase(
    detectDuplicatesUseCase,
    detectContradictionsUseCase,
    detectBrokenLinksUseCase,
    detectOrphansUseCase
  );

  return useCase.execute();
}
