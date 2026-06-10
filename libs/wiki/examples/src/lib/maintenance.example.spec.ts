import { describe, it, expect } from 'vitest';
import {
  detectDuplicateContentExample,
  detectBrokenLinksExample,
  detectOrphanPagesExample,
  detectContradictionsExample,
  generateMaintenanceReportExample,
  comprehensiveMaintenanceWorkflowExample
} from './maintenance.example';

describe('Maintenance Examples', () => {
  describe('detectDuplicateContentExample', () => {
    it('should return an array', async () => {
      const duplicates = await detectDuplicateContentExample();

      expect(Array.isArray(duplicates)).toBe(true);
    });

    it('should handle missing wiki directory gracefully', async () => {
      const duplicates = await detectDuplicateContentExample();

      expect(duplicates).toBeDefined();
    });

    it('should return duplicate pairs with required fields', async () => {
      const duplicates = await detectDuplicateContentExample();

      if (duplicates.length > 0) {
        const first = duplicates[0];
        expect(first).toHaveProperty('page1');
        expect(first).toHaveProperty('page2');
        expect(first).toHaveProperty('similarity');
        expect(first).toHaveProperty('recommendation');
      }
    });

    it('should calculate similarity as a number between 0 and 1', async () => {
      const duplicates = await detectDuplicateContentExample();

      for (const duplicate of duplicates) {
        expect(duplicate.similarity).toBeGreaterThanOrEqual(0);
        expect(duplicate.similarity).toBeLessThanOrEqual(1);
      }
    });

    it('should provide recommendations for duplicates', async () => {
      const duplicates = await detectDuplicateContentExample();

      for (const duplicate of duplicates) {
        expect(duplicate.recommendation).toBeTruthy();
        expect(typeof duplicate.recommendation).toBe('string');
      }
    });
  });

  describe('detectBrokenLinksExample', () => {
    it('should return an array', async () => {
      const brokenLinks = await detectBrokenLinksExample();

      expect(Array.isArray(brokenLinks)).toBe(true);
    });

    it('should handle missing wiki directory gracefully', async () => {
      const brokenLinks = await detectBrokenLinksExample();

      expect(brokenLinks).toBeDefined();
    });

    it('should return results with required fields', async () => {
      const brokenLinks = await detectBrokenLinksExample();

      if (brokenLinks.length > 0) {
        const first = brokenLinks[0];
        expect(first).toHaveProperty('page');
        expect(first).toHaveProperty('brokenLinks');
        expect(Array.isArray(first.brokenLinks)).toBe(true);
      }
    });

    it('should include page path in results', async () => {
      const brokenLinks = await detectBrokenLinksExample();

      for (const result of brokenLinks) {
        expect(typeof result.page).toBe('string');
        expect(result.page.length).toBeGreaterThan(0);
      }
    });

    it('should list broken links as strings', async () => {
      const brokenLinks = await detectBrokenLinksExample();

      for (const result of brokenLinks) {
        for (const link of result.brokenLinks) {
          expect(typeof link).toBe('string');
        }
      }
    });
  });

  describe('detectOrphanPagesExample', () => {
    it('should return an array', async () => {
      const orphans = await detectOrphanPagesExample();

      expect(Array.isArray(orphans)).toBe(true);
    });

    it('should handle missing wiki directory gracefully', async () => {
      const orphans = await detectOrphanPagesExample();

      expect(orphans).toBeDefined();
    });

    it('should return results with required fields', async () => {
      const orphans = await detectOrphanPagesExample();

      if (orphans.length > 0) {
        const first = orphans[0];
        expect(first).toHaveProperty('page');
        expect(first).toHaveProperty('reason');
      }
    });

    it('should provide reason for each orphan', async () => {
      const orphans = await detectOrphanPagesExample();

      for (const orphan of orphans) {
        expect(typeof orphan.reason).toBe('string');
        expect(orphan.reason.length).toBeGreaterThan(0);
      }
    });

    it('should identify pages with no incoming links', async () => {
      const orphans = await detectOrphanPagesExample();

      for (const orphan of orphans) {
        expect(orphan.reason).toContain('incoming links');
      }
    });
  });

  describe('detectContradictionsExample', () => {
    it('should return an array', async () => {
      const contradictions = await detectContradictionsExample();

      expect(Array.isArray(contradictions)).toBe(true);
    });

    it('should handle missing wiki directory gracefully', async () => {
      const contradictions = await detectContradictionsExample();

      expect(contradictions).toBeDefined();
    });

    it('should return results with required fields', async () => {
      const contradictions = await detectContradictionsExample();

      if (contradictions.length > 0) {
        const first = contradictions[0];
        expect(first).toHaveProperty('pages');
        expect(first).toHaveProperty('contradiction');
        expect(first).toHaveProperty('severity');
      }
    });

    it('should include multiple pages in contradiction results', async () => {
      const contradictions = await detectContradictionsExample();

      for (const contradiction of contradictions) {
        expect(Array.isArray(contradiction.pages)).toBe(true);
        expect(contradiction.pages.length).toBeGreaterThan(0);
      }
    });

    it('should assign valid severity levels', async () => {
      const contradictions = await detectContradictionsExample();

      const validSeverities = ['low', 'medium', 'high'];

      for (const contradiction of contradictions) {
        expect(validSeverities).toContain(contradiction.severity);
      }
    });

    it('should provide contradiction description', async () => {
      const contradictions = await detectContradictionsExample();

      for (const contradiction of contradictions) {
        expect(typeof contradiction.contradiction).toBe('string');
        expect(contradiction.contradiction.length).toBeGreaterThan(0);
      }
    });
  });

  describe('generateMaintenanceReportExample', () => {
    it('should return a report object or null', async () => {
      const report = await generateMaintenanceReportExample();

      expect(report === null || typeof report === 'object').toBe(true);
    });

    it('should handle missing wiki directory gracefully', async () => {
      const report = await generateMaintenanceReportExample();

      expect(report).toBeDefined();
    });

    it('should include all required report sections when wiki exists', async () => {
      const report = await generateMaintenanceReportExample();

      if (report) {
        expect(report).toHaveProperty('timestamp');
        expect(report).toHaveProperty('duplicates');
        expect(report).toHaveProperty('contradictions');
        expect(report).toHaveProperty('brokenLinks');
        expect(report).toHaveProperty('consolidationOpportunities');
        expect(report).toHaveProperty('orphans');
        expect(report).toHaveProperty('summary');
      }
    });

    it('should include summary with health metrics', async () => {
      const report = await generateMaintenanceReportExample();

      if (report) {
        expect(report.summary).toHaveProperty('totalPages');
        expect(report.summary).toHaveProperty('totalLinks');
        expect(report.summary).toHaveProperty('healthScore');
      }
    });

    it('should calculate health score between 0 and 100', async () => {
      const report = await generateMaintenanceReportExample();

      if (report) {
        expect(report.summary.healthScore).toBeGreaterThanOrEqual(0);
        expect(report.summary.healthScore).toBeLessThanOrEqual(100);
      }
    });

    it('should include timestamp as Date object', async () => {
      const report = await generateMaintenanceReportExample();

      if (report) {
        expect(report.timestamp).toBeInstanceOf(Date);
      }
    });

    it('should include arrays for all finding types', async () => {
      const report = await generateMaintenanceReportExample();

      if (report) {
        expect(Array.isArray(report.duplicates)).toBe(true);
        expect(Array.isArray(report.contradictions)).toBe(true);
        expect(Array.isArray(report.brokenLinks)).toBe(true);
        expect(Array.isArray(report.consolidationOpportunities)).toBe(true);
        expect(Array.isArray(report.orphans)).toBe(true);
      }
    });
  });

  describe('comprehensiveMaintenanceWorkflowExample', () => {
    it('should execute all maintenance checks', async () => {
      const result = await comprehensiveMaintenanceWorkflowExample();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('duplicates');
      expect(result).toHaveProperty('brokenLinks');
      expect(result).toHaveProperty('orphans');
      expect(result).toHaveProperty('contradictions');
      expect(result).toHaveProperty('report');
    });

    it('should return arrays for individual checks', async () => {
      const result = await comprehensiveMaintenanceWorkflowExample();

      expect(Array.isArray(result.duplicates)).toBe(true);
      expect(Array.isArray(result.brokenLinks)).toBe(true);
      expect(Array.isArray(result.orphans)).toBe(true);
      expect(Array.isArray(result.contradictions)).toBe(true);
    });

    it('should complete without errors', async () => {
      const result = await comprehensiveMaintenanceWorkflowExample();

      expect(result).toBeTruthy();
    });

    it('should execute duplicate detection', async () => {
      const result = await comprehensiveMaintenanceWorkflowExample();

      expect(result.duplicates).toBeDefined();
    });

    it('should execute broken link detection', async () => {
      const result = await comprehensiveMaintenanceWorkflowExample();

      expect(result.brokenLinks).toBeDefined();
    });

    it('should execute orphan page detection', async () => {
      const result = await comprehensiveMaintenanceWorkflowExample();

      expect(result.orphans).toBeDefined();
    });

    it('should execute contradiction detection', async () => {
      const result = await comprehensiveMaintenanceWorkflowExample();

      expect(result.contradictions).toBeDefined();
    });

    it('should generate comprehensive report', async () => {
      const result = await comprehensiveMaintenanceWorkflowExample();

      expect(result.report).toBeDefined();
    });

    it('should handle missing wiki directory gracefully for all checks', async () => {
      const result = await comprehensiveMaintenanceWorkflowExample();

      expect(result.duplicates).toBeDefined();
      expect(result.brokenLinks).toBeDefined();
      expect(result.orphans).toBeDefined();
      expect(result.contradictions).toBeDefined();
    });
  });
});
