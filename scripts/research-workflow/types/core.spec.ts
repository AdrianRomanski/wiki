/**
 * Unit tests for core type definitions
 * Feature: polished-research-workflow
 */

import { describe, it, expect } from 'vitest';
import { Phase, ResearchMode, SessionStatus, ArtifactType } from './core.js';

describe('Core Type Enums', () => {
  describe('Phase', () => {
    it('should have all required phases', () => {
      expect(Phase.IDLE).toBe('IDLE');
      expect(Phase.SETUP).toBe('SETUP');
      expect(Phase.ANALYSIS).toBe('ANALYSIS');
      expect(Phase.PROTOTYPING).toBe('PROTOTYPING');
      expect(Phase.DECISION).toBe('DECISION');
      expect(Phase.FINALIZED).toBe('FINALIZED');
    });

    it('should have exactly 6 phases', () => {
      const phases = Object.values(Phase);
      expect(phases).toHaveLength(6);
    });
  });

  describe('ResearchMode', () => {
    it('should have SINGLE and COMPARISON modes', () => {
      expect(ResearchMode.SINGLE).toBe('SINGLE');
      expect(ResearchMode.COMPARISON).toBe('COMPARISON');
    });

    it('should have exactly 2 modes', () => {
      const modes = Object.values(ResearchMode);
      expect(modes).toHaveLength(2);
    });
  });

  describe('SessionStatus', () => {
    it('should have all required statuses', () => {
      expect(SessionStatus.ACTIVE).toBe('ACTIVE');
      expect(SessionStatus.PAUSED).toBe('PAUSED');
      expect(SessionStatus.FINALIZED).toBe('FINALIZED');
    });

    it('should have exactly 3 statuses', () => {
      const statuses = Object.values(SessionStatus);
      expect(statuses).toHaveLength(3);
    });
  });

  describe('ArtifactType', () => {
    it('should have all required artifact types', () => {
      expect(ArtifactType.BIG_PICTURE).toBe('BIG_PICTURE');
      expect(ArtifactType.COMPARISON_VIEW).toBe('COMPARISON_VIEW');
      expect(ArtifactType.PROTOTYPE).toBe('PROTOTYPE');
      expect(ArtifactType.PHASE_REPORT).toBe('PHASE_REPORT');
      expect(ArtifactType.FINAL_REPORT).toBe('FINAL_REPORT');
      expect(ArtifactType.ADR).toBe('ADR');
      expect(ArtifactType.RESEARCH_DECISION_RECORD).toBe('RESEARCH_DECISION_RECORD');
    });

    it('should have exactly 7 artifact types', () => {
      const types = Object.values(ArtifactType);
      expect(types).toHaveLength(7);
    });
  });
});
