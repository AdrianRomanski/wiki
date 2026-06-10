import { MaintenanceReport } from '@wiki/domain-models';
import { DetectDuplicatesUseCase } from './detect-duplicates-use-case';
import { DetectContradictionsUseCase } from './detect-contradictions-use-case';
import { DetectBrokenLinksUseCase } from './detect-broken-links-use-case';
import { DetectOrphansUseCase } from './detect-orphans-use-case';

export class GenerateMaintenanceReportUseCase {
  constructor(
    private readonly detectDuplicatesUseCase: DetectDuplicatesUseCase,
    private readonly detectContradictionsUseCase: DetectContradictionsUseCase,
    private readonly detectBrokenLinksUseCase: DetectBrokenLinksUseCase,
    private readonly detectOrphansUseCase: DetectOrphansUseCase
  ) {}

  async execute(): Promise<MaintenanceReport> {
    const duplicates = await this.detectDuplicatesUseCase.execute();
    const contradictions = await this.detectContradictionsUseCase.execute();
    const brokenLinks = await this.detectBrokenLinksUseCase.execute();
    const orphans = await this.detectOrphansUseCase.execute();

    const consolidationOpportunities = await this.suggestConsolidation(
      duplicates
    );

    const totalPages = await this.countTotalPages();
    const totalLinks = brokenLinks.reduce((sum, b) => sum + b.brokenLinks.length, 0);
    const totalBrokenLinks = brokenLinks.reduce((sum, b) => sum + b.brokenLinks.length, 0);
    const totalOrphans = orphans.length;
    const totalDuplicates = duplicates.length;
    const totalContradictions = contradictions.length;

    let healthScore = 100;
    healthScore -= Math.min(20, totalBrokenLinks * 2);
    healthScore -= Math.min(15, totalOrphans * 3);
    healthScore -= Math.min(15, totalDuplicates * 5);
    healthScore -= Math.min(20, totalContradictions * 10);

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
      }
    };
  }

  private async suggestConsolidation(
    duplicates: {
      page1: string;
      page2: string;
      similarity: number;
      recommendation: string;
    }[]
  ): Promise<{
    pages: string[];
    reason: string;
    suggestedAction: string;
  }[]> {
    const opportunities: {
      pages: string[];
      reason: string;
      suggestedAction: string;
    }[] = [];

    for (const dup of duplicates) {
      if (dup.similarity >= 0.6) {
        opportunities.push({
          pages: [dup.page1, dup.page2],
          reason: `High content similarity (${Math.round(dup.similarity * 100)}%)`,
          suggestedAction: 'Merge into single page'
        });
      }
    }

    return opportunities;
  }

  private async countTotalPages(): Promise<number> {
    let count = 0;
    const subdirs = ['entities', 'concepts', 'sources'];

    for (const subdir of subdirs) {
      try {
        count += 1;
      } catch (error) {
        console.warn(`Warning: Could not count pages in ${subdir}:`, error);
      }
    }

    return count;
  }
}
