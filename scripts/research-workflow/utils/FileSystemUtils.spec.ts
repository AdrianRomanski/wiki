/**
 * FileSystemUtils unit tests
 * Feature: polished-research-workflow
 * Requirement 9.7: Structured session directory with clear naming conventions
 */

import { describe, it, expect } from 'vitest';
import {
  validatePath,
  sanitizeName,
  generateArtifactName,
  getSessionPath,
  getSessionSubdirectoryPath,
  validateSessionId,
  SESSION_SUBDIRECTORIES,
  ARTIFACT_NAMING
} from './FileSystemUtils';

describe('FileSystemUtils', () => {
  describe('validatePath', () => {
    it('should accept valid relative paths', () => {
      expect(validatePath('libraries/focus-trap/big-picture.md')).toBe(true);
      expect(validatePath('prototypes/example.ts')).toBe(true);
      expect(validatePath('session.json')).toBe(true);
    });

    it('should reject empty paths', () => {
      expect(validatePath('')).toBe(false);
      expect(validatePath('   ')).toBe(false);
    });

    it('should reject directory traversal', () => {
      expect(validatePath('../secret/file.txt')).toBe(false);
      expect(validatePath('libraries/../../etc/passwd')).toBe(false);
      expect(validatePath('..\\windows\\system32')).toBe(false);
    });

    it('should reject absolute paths', () => {
      expect(validatePath('/etc/passwd')).toBe(false);
      expect(validatePath('/home/user/file.txt')).toBe(false);
    });

    it('should reject paths with null bytes', () => {
      expect(validatePath('file\0.txt')).toBe(false);
    });

    it('should reject paths that are too long', () => {
      const longPath = 'a'.repeat(4097);
      expect(validatePath(longPath)).toBe(false);
    });

    it('should reject paths with segments that are too long', () => {
      const longSegment = 'a'.repeat(256);
      expect(validatePath(`dir/${longSegment}/file.txt`)).toBe(false);
    });
  });

  describe('sanitizeName', () => {
    it('should handle scoped package names', () => {
      expect(sanitizeName('@angular/cdk')).toBe('angular-cdk');
      expect(sanitizeName('@scope/package')).toBe('scope-package');
    });

    it('should replace special characters with dashes', () => {
      expect(sanitizeName('my library!')).toBe('my-library');
      expect(sanitizeName('test@#$%name')).toBe('test-name');
    });

    it('should collapse multiple dashes', () => {
      expect(sanitizeName('a---b---c')).toBe('a-b-c');
    });

    it('should remove leading and trailing dashes', () => {
      expect(sanitizeName('-test-')).toBe('test');
    });

    it('should convert to lowercase', () => {
      expect(sanitizeName('MyLibrary')).toBe('mylibrary');
    });

    it('should limit length to 100 characters', () => {
      const longName = 'a'.repeat(150);
      expect(sanitizeName(longName).length).toBeLessThanOrEqual(100);
    });

    it('should preserve dots and dashes', () => {
      expect(sanitizeName('file.name-v2')).toBe('file.name-v2');
    });
  });

  describe('generateArtifactName', () => {
    it('should generate big picture artifact name', () => {
      const name = generateArtifactName('BIG_PICTURE', { library: 'focus-trap' });
      expect(name).toBe('focus-trap-big-picture.md');
    });

    it('should generate prototype artifact name', () => {
      const name = generateArtifactName('PROTOTYPE', { index: '1', description: 'basic modal' });
      expect(name).toBe('prototype-1-basic-modal.md');
    });

    it('should generate phase report name', () => {
      const name = generateArtifactName('PHASE_REPORT', { phase: 'analysis' });
      expect(name).toBe('analysis-report.md');
    });

    it('should generate final report name', () => {
      const name = generateArtifactName('FINAL_REPORT');
      expect(name).toBe('final-report.md');
    });

    it('should generate ADR name', () => {
      const name = generateArtifactName('ADR');
      expect(name).toBe('decision.adr.md');
    });

    it('should handle unknown artifact types', () => {
      const name = generateArtifactName('UNKNOWN_TYPE');
      expect(name).toBe('unknown_type.md');
    });

    it('should sanitize parameter values', () => {
      const name = generateArtifactName('BIG_PICTURE', { library: '@angular/cdk' });
      expect(name).toBe('angular-cdk-big-picture.md');
    });

    it('should replace missing params with unknown', () => {
      const name = generateArtifactName('PROTOTYPE', { index: '1' });
      expect(name).toContain('unknown');
    });
  });

  describe('getSessionPath', () => {
    it('should resolve session path from base directory', () => {
      const result = getSessionPath('/base/dir', 'my-session-2024');
      expect(result).toContain('my-session-2024');
      expect(result).toContain('/base/dir');
    });

    it('should sanitize session ID in path', () => {
      const result = getSessionPath('/base', 'My Session!@#');
      expect(result).not.toContain('!');
      expect(result).not.toContain('@');
      expect(result).not.toContain('#');
    });

    it('should handle empty session ID', () => {
      const result = getSessionPath('/base', '');
      expect(result).toContain('unnamed-session');
    });
  });

  describe('getSessionSubdirectoryPath', () => {
    it('should resolve libraries subdirectory', () => {
      const result = getSessionSubdirectoryPath('/base', 'session-1', 'libraries');
      expect(result).toContain('session-1');
      expect(result).toContain('libraries');
    });

    it('should resolve prototypes subdirectory', () => {
      const result = getSessionSubdirectoryPath('/base', 'session-1', 'prototypes');
      expect(result).toContain('prototypes');
    });

    it('should resolve phase-reports subdirectory', () => {
      const result = getSessionSubdirectoryPath('/base', 'session-1', 'phase-reports');
      expect(result).toContain('phase-reports');
    });
  });

  describe('validateSessionId', () => {
    it('should accept valid session IDs', () => {
      expect(validateSessionId('focus-trap-research-2024-01-15')).toBe(true);
      expect(validateSessionId('my-session')).toBe(true);
      expect(validateSessionId('session123')).toBe(true);
    });

    it('should reject empty session IDs', () => {
      expect(validateSessionId('')).toBe(false);
      expect(validateSessionId('   ')).toBe(false);
    });

    it('should reject session IDs with path separators', () => {
      expect(validateSessionId('path/to/session')).toBe(false);
      expect(validateSessionId('path\\to\\session')).toBe(false);
    });

    it('should reject session IDs with directory traversal', () => {
      expect(validateSessionId('..')).toBe(false);
      expect(validateSessionId('session/../other')).toBe(false);
    });

    it('should reject session IDs that are too long', () => {
      const longId = 'a'.repeat(201);
      expect(validateSessionId(longId)).toBe(false);
    });
  });

  describe('constants', () => {
    it('should define standard subdirectories', () => {
      expect(SESSION_SUBDIRECTORIES).toContain('libraries');
      expect(SESSION_SUBDIRECTORIES).toContain('prototypes');
      expect(SESSION_SUBDIRECTORIES).toContain('phase-reports');
    });

    it('should define artifact naming templates for all types', () => {
      expect(ARTIFACT_NAMING.BIG_PICTURE).toBeDefined();
      expect(ARTIFACT_NAMING.COMPARISON_VIEW).toBeDefined();
      expect(ARTIFACT_NAMING.PROTOTYPE).toBeDefined();
      expect(ARTIFACT_NAMING.PHASE_REPORT).toBeDefined();
      expect(ARTIFACT_NAMING.FINAL_REPORT).toBeDefined();
      expect(ARTIFACT_NAMING.ADR).toBeDefined();
      expect(ARTIFACT_NAMING.RESEARCH_DECISION_RECORD).toBeDefined();
    });
  });
});
