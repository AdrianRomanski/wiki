import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GenerateMaintenanceReportUseCase } from './generate-maintenance-report-use-case';
import { DetectDuplicatesUseCase } from './detect-duplicates-use-case';
import { DetectContradictionsUseCase } from './detect-contradictions-use-case';
import { DetectBrokenLinksUseCase } from './detect-broken-links-use-case';
import { DetectOrphansUseCase } from './detect-orphans-use-case';

describe('GenerateMaintenanceReportUseCase', () => {
  let useCase: GenerateMaintenanceReportUseCase;
  let mockDetectDuplicatesUseCase: DetectDuplicatesUseCase;
  let mockDetectContradictionsUseCase: DetectContradictionsUseCase;
  let mockDetectBrokenLinksUseCase: DetectBrokenLinksUseCase;
  let mockDetectOrphansUseCase: DetectOrphansUseCase;

  beforeEach(() => {
    mockDetectDuplicatesUseCase = {
      execute: vi.fn().mockResolvedValue([]),
    } as any;

    mockDetectContradictionsUseCase = {
      execute: vi.fn().mockResolvedValue([]),
    } as any;

    mockDetectBrokenLinksUseCase = {
      execute: vi.fn().mockResolvedValue([]),
    } as any;

    mockDetectOrphansUseCase = {
      execute: vi.fn().mockResolvedValue([]),
    } as any;

    useCase = new GenerateMaintenanceReportUseCase(
      mockDetectDuplicatesUseCase,
      mockDetectContradictionsUseCase,
      mockDetectBrokenLinksUseCase,
      mockDetectOrphansUseCase
    );
  });

  it('should generate maintenance report', async () => {
    const report = await useCase.execute();

    expect(report).toBeDefined();
    expect(report.timestamp).toBeInstanceOf(Date);
    expect(report.duplicates).toEqual([]);
    expect(report.contradictions).toEqual([]);
    expect(report.brokenLinks).toEqual([]);
    expect(report.orphans).toEqual([]);
    expect(report.summary).toBeDefined();
  });

  it('should calculate health score', async () => {
    (mockDetectBrokenLinksUseCase.execute as any).mockResolvedValue([
      { page: 'page1.md', brokenLinks: ['Link1'] },
    ]);

    const report = await useCase.execute();

    expect(report.summary.healthScore).toBeLessThan(100);
  });

  it('should suggest consolidation for duplicates', async () => {
    (mockDetectDuplicatesUseCase.execute as any).mockResolvedValue([
      {
        page1: 'page1.md',
        page2: 'page2.md',
        similarity: 0.8,
        recommendation: 'Merge pages',
      },
    ]);

    const report = await useCase.execute();

    expect(report.consolidationOpportunities.length).toBeGreaterThan(0);
  });

  it('should handle all issues types', async () => {
    (mockDetectDuplicatesUseCase.execute as any).mockResolvedValue([
      {
        page1: 'dup1.md',
        page2: 'dup2.md',
        similarity: 0.9,
        recommendation: 'Merge',
      },
    ]);

    (mockDetectContradictionsUseCase.execute as any).mockResolvedValue([
      { pages: ['contra.md'], reason: 'contradiction', snippet: 'text' },
    ]);

    (mockDetectBrokenLinksUseCase.execute as any).mockResolvedValue([
      { page: 'broken.md', brokenLinks: ['Missing'] },
    ]);

    (mockDetectOrphansUseCase.execute as any).mockResolvedValue([
      { page: 'orphan.md' },
    ]);

    const report = await useCase.execute();

    expect(report.duplicates).toHaveLength(1);
    expect(report.contradictions).toHaveLength(1);
    expect(report.brokenLinks).toHaveLength(1);
    expect(report.orphans).toHaveLength(1);
  });
});
