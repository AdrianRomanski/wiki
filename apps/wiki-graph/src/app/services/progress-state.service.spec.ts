import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProgressStateService } from './progress-state.service';
import { StorageService } from './storage.service';
import { ProgressEntry } from '../models/progress.models';

describe('ProgressStateService', () => {
  let service: ProgressStateService;
  let storageServiceMock: StorageService;

  beforeEach(() => {
    // Create mock for StorageService
    storageServiceMock = {
      readProgressFile: vi.fn(),
      writeProgressFile: vi.fn(),
      readIndexFile: vi.fn(),
      writeIndexFile: vi.fn(),
      listProgressFiles: vi.fn(),
      deleteProgressFile: vi.fn(),
      ensureDirectories: vi.fn(),
      quarantineProgressFile: vi.fn(),
      quarantineConflictedFile: vi.fn(),
      getFileTimestamp: vi.fn(),
      initialize: vi.fn(),
      readJSONFile: vi.fn(),
      writeJSONFile: vi.fn()
    } as any;

    TestBed.configureTestingModule({
      providers: [
        ProgressStateService,
        { provide: StorageService, useValue: storageServiceMock }
      ]
    });

    service = TestBed.inject(ProgressStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProgress', () => {
    it('should return Not_Started for concepts without progress data', () => {
      const state = service.getProgress('non-existent-concept');
      expect(state).toBe('Not_Started');
    });

    it('should return the stored progress state for existing concepts', async () => {
      // Set progress first
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue(null);
      vi.mocked(storageServiceMock.writeProgressFile).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);

      await service.setProgress('typescript', 'TypeScript', 'In_Progress');

      const state = service.getProgress('typescript');
      expect(state).toBe('In_Progress');
    });
  });

  describe('setProgress', () => {
    it('should create new progress entry and persist to disk', async () => {
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue(null);
      vi.mocked(storageServiceMock.writeProgressFile).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);

      await service.setProgress('typescript', 'TypeScript', 'In_Progress');

      // Verify storage service was called correctly
      expect(storageServiceMock.writeProgressFile).toHaveBeenCalledWith(
        'typescript',
        expect.objectContaining({
          conceptId: 'typescript',
          conceptTitle: 'TypeScript',
          state: 'In_Progress',
          assessmentCount: 0,
          version: '1.0.0'
        })
      );

      // Verify index file was updated
      expect(storageServiceMock.writeIndexFile).toHaveBeenCalledWith(
        expect.objectContaining({
          version: '1.0.0',
          totalConcepts: 1,
          conceptIds: ['typescript']
        })
      );

      // Verify in-memory state was updated
      expect(service.getProgress('typescript')).toBe('In_Progress');
    });

    it('should update existing progress entry and increment assessment count', async () => {
      const existingEntry: ProgressEntry = {
        conceptId: 'typescript',
        conceptTitle: 'TypeScript',
        state: 'In_Progress',
        lastAssessed: '2024-01-01T00:00:00Z',
        assessmentCount: 2,
        version: '1.0.0'
      };

      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue(existingEntry);
      vi.mocked(storageServiceMock.writeProgressFile).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);

      await service.setProgress('typescript', 'TypeScript', 'Understood');

      // Verify assessment count was incremented
      expect(storageServiceMock.writeProgressFile).toHaveBeenCalledWith(
        'typescript',
        expect.objectContaining({
          conceptId: 'typescript',
          conceptTitle: 'TypeScript',
          state: 'Understood',
          assessmentCount: 3
        })
      );
    });

    it('should update lastSyncTime after successful save', async () => {
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue(null);
      vi.mocked(storageServiceMock.writeProgressFile).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);

      const beforeTime = new Date();
      await service.setProgress('typescript', 'TypeScript', 'In_Progress');
      const afterTime = new Date();

      const lastSyncTime = service.getLastSyncTime()();
      expect(lastSyncTime).not.toBeNull();
      expect(lastSyncTime!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(lastSyncTime!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should set loading state during operation', async () => {
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue(null);
      vi.mocked(storageServiceMock.writeProgressFile).mockImplementation(() => {
        // Check that loading is true during the operation
        expect(service.isLoading()()).toBe(true);
        return Promise.resolve();
      });
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);

      await service.setProgress('typescript', 'TypeScript', 'In_Progress');

      // Loading should be false after completion
      expect(service.isLoading()()).toBe(false);
    });

    it('should handle file write failures and set error message', async () => {
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue(null);
      vi.mocked(storageServiceMock.writeProgressFile).mockRejectedValue(
        new Error('Disk full')
      );

      await expect(
        service.setProgress('typescript', 'TypeScript', 'In_Progress')
      ).rejects.toThrow('Failed to save progress for TypeScript');

      // Error should be stored
      const lastError = service.getLastError()();
      expect(lastError).toContain('TypeScript');
      expect(lastError).toContain('Disk full');

      // Loading should be false after error
      expect(service.isLoading()()).toBe(false);

      // In-memory state should not be updated on failure
      expect(service.getProgress('typescript')).toBe('Not_Started');
    });

    it('should not update in-memory state if disk write fails', async () => {
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue(null);
      vi.mocked(storageServiceMock.writeProgressFile).mockRejectedValue(
        new Error('Permission denied')
      );

      try {
        await service.setProgress('typescript', 'TypeScript', 'Understood');
      } catch {
        // Expected error
      }

      // State should remain Not_Started
      expect(service.getProgress('typescript')).toBe('Not_Started');
    });
  });

  describe('loadFromFiles', () => {
    it('should load all progress files into memory', async () => {
      const mockEntries: ProgressEntry[] = [
        {
          conceptId: 'typescript',
          conceptTitle: 'TypeScript',
          state: 'Understood',
          lastAssessed: '2024-01-15T10:00:00Z',
          assessmentCount: 3,
          version: '1.0.0'
        },
        {
          conceptId: 'rxjs',
          conceptTitle: 'RxJS',
          state: 'In_Progress',
          lastAssessed: '2024-01-14T15:30:00Z',
          assessmentCount: 1,
          version: '1.0.0'
        }
      ];

      vi.mocked(storageServiceMock.ensureDirectories).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.listProgressFiles).mockResolvedValue([
        'typescript',
        'rxjs'
      ]);
      vi.mocked(storageServiceMock.readProgressFile)
        .mockResolvedValueOnce(mockEntries[0])
        .mockResolvedValueOnce(mockEntries[1]);

      await service.loadFromFiles();

      // Verify all files were loaded
      expect(storageServiceMock.listProgressFiles).toHaveBeenCalled();
      expect(storageServiceMock.readProgressFile).toHaveBeenCalledWith('typescript');
      expect(storageServiceMock.readProgressFile).toHaveBeenCalledWith('rxjs');

      // Verify in-memory state was updated
      expect(service.getProgress('typescript')).toBe('Understood');
      expect(service.getProgress('rxjs')).toBe('In_Progress');

      const allProgress = service.getAllProgress();
      expect(allProgress.size).toBe(2);
    });

    it('should handle individual file read failures gracefully', async () => {
      vi.mocked(storageServiceMock.ensureDirectories).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.listProgressFiles).mockResolvedValue([
        'typescript',
        'corrupted-file',
        'rxjs'
      ]);
      vi.mocked(storageServiceMock.readProgressFile)
        .mockResolvedValueOnce({
          conceptId: 'typescript',
          conceptTitle: 'TypeScript',
          state: 'Understood',
          lastAssessed: '2024-01-15T10:00:00Z',
          assessmentCount: 3,
          version: '1.0.0'
        })
        .mockRejectedValueOnce(new Error('Invalid JSON'))
        .mockResolvedValueOnce({
          conceptId: 'rxjs',
          conceptTitle: 'RxJS',
          state: 'In_Progress',
          lastAssessed: '2024-01-14T15:30:00Z',
          assessmentCount: 1,
          version: '1.0.0'
        });

      await service.loadFromFiles();

      // Should load the valid files
      expect(service.getProgress('typescript')).toBe('Understood');
      expect(service.getProgress('rxjs')).toBe('In_Progress');

      // Should have an error message about the corrupted file
      const lastError = service.getLastError()();
      expect(lastError).toContain('corrupted-file');
    });

    it('should throw error if directory operations fail', async () => {
      vi.mocked(storageServiceMock.ensureDirectories).mockRejectedValue(
        new Error('Permission denied')
      );

      await expect(service.loadFromFiles()).rejects.toThrow(
        'Failed to load progress data from disk'
      );

      // Error should be stored
      const lastError = service.getLastError()();
      expect(lastError).toContain('Permission denied');
    });

    it('should update lastSyncTime after successful load', async () => {
      vi.mocked(storageServiceMock.ensureDirectories).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.listProgressFiles).mockResolvedValue([]);

      const beforeTime = new Date();
      await service.loadFromFiles();
      const afterTime = new Date();

      const lastSyncTime = service.getLastSyncTime()();
      expect(lastSyncTime).not.toBeNull();
      expect(lastSyncTime!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(lastSyncTime!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('refreshFromDisk', () => {
    it('should reload all progress data from disk', async () => {
      vi.mocked(storageServiceMock.ensureDirectories).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.listProgressFiles).mockResolvedValue([
        'typescript'
      ]);
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue({
        conceptId: 'typescript',
        conceptTitle: 'TypeScript',
        state: 'Mastered',
        lastAssessed: '2024-01-20T12:00:00Z',
        assessmentCount: 5,
        version: '1.0.0'
      });

      await service.refreshFromDisk();

      expect(service.getProgress('typescript')).toBe('Mastered');
    });
  });

  describe('clearAllProgress', () => {
    it('should delete all progress files and clear in-memory state', async () => {
      // Set up initial state
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue(null);
      vi.mocked(storageServiceMock.writeProgressFile).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.deleteProgressFile).mockResolvedValue(undefined);

      await service.setProgress('typescript', 'TypeScript', 'In_Progress');
      await service.setProgress('rxjs', 'RxJS', 'Understood');

      expect(service.getAllProgress().size).toBe(2);

      // Clear all progress
      await service.clearAllProgress();

      // Verify all files were deleted
      expect(storageServiceMock.deleteProgressFile).toHaveBeenCalledWith('typescript');
      expect(storageServiceMock.deleteProgressFile).toHaveBeenCalledWith('rxjs');

      // Verify in-memory state was cleared
      expect(service.getAllProgress().size).toBe(0);
      expect(service.getProgress('typescript')).toBe('Not_Started');
      expect(service.getProgress('rxjs')).toBe('Not_Started');

      // Verify index was updated
      expect(storageServiceMock.writeIndexFile).toHaveBeenCalledWith(
        expect.objectContaining({
          totalConcepts: 0,
          conceptIds: []
        })
      );
    });

    it('should handle file deletion failures', async () => {
      // Set up initial state
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue(null);
      vi.mocked(storageServiceMock.writeProgressFile).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);

      await service.setProgress('typescript', 'TypeScript', 'In_Progress');

      // Mock deletion failure
      vi.mocked(storageServiceMock.deleteProgressFile).mockRejectedValue(
        new Error('File locked')
      );

      await expect(service.clearAllProgress()).rejects.toThrow(
        'Failed to delete 1 progress file(s)'
      );

      // Error should be stored
      const lastError = service.getLastError()();
      expect(lastError).toContain('typescript');
    });
  });

  describe('getAssessmentCount / getAllAssessmentCounts', () => {
    it('should return 0 for concepts without progress data', () => {
      expect(service.getAssessmentCount('non-existent-concept')).toBe(0);
    });

    it('should track the assessment count after setProgress persists an entry', async () => {
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue(null);
      vi.mocked(storageServiceMock.writeProgressFile).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);

      await service.setProgress('typescript', 'TypeScript', 'In_Progress');

      expect(service.getAssessmentCount('typescript')).toBe(0);
    });

    it('should increment the tracked assessment count on repeated setProgress calls', async () => {
      const existingEntry: ProgressEntry = {
        conceptId: 'typescript',
        conceptTitle: 'TypeScript',
        state: 'In_Progress',
        lastAssessed: '2024-01-01T00:00:00Z',
        assessmentCount: 2,
        version: '1.0.0'
      };

      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue(existingEntry);
      vi.mocked(storageServiceMock.writeProgressFile).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);

      await service.setProgress('typescript', 'TypeScript', 'Understood');

      expect(service.getAssessmentCount('typescript')).toBe(3);
    });

    it('should populate assessment counts from disk on loadFromFiles', async () => {
      vi.mocked(storageServiceMock.ensureDirectories).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.listProgressFiles).mockResolvedValue(['typescript']);
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue({
        conceptId: 'typescript',
        conceptTitle: 'TypeScript',
        state: 'Understood',
        lastAssessed: '2024-01-15T10:00:00Z',
        assessmentCount: 7,
        version: '1.0.0'
      });

      await service.loadFromFiles();

      expect(service.getAssessmentCount('typescript')).toBe(7);
      expect(service.getAllAssessmentCounts().get('typescript')).toBe(7);
    });

    it('should clear assessment counts when clearAllProgress is called', async () => {
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue(null);
      vi.mocked(storageServiceMock.writeProgressFile).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.deleteProgressFile).mockResolvedValue(undefined);

      await service.setProgress('typescript', 'TypeScript', 'In_Progress');
      expect(service.getAllAssessmentCounts().size).toBe(1);

      await service.clearAllProgress();

      expect(service.getAllAssessmentCounts().size).toBe(0);
      expect(service.getAssessmentCount('typescript')).toBe(0);
    });
  });

  describe('getAllProgress', () => {
    it('should return an empty read-only map initially', () => {
      const progressMap = service.getAllProgress();
      expect(progressMap).toBeInstanceOf(Map);
      expect(progressMap.size).toBe(0);
    });

    it('should return a read-only map', () => {
      const progressMap = service.getAllProgress();
      
      // TypeScript enforces read-only at compile time
      // At runtime, the returned Map is the same reference from the signal
      expect(progressMap).toBeInstanceOf(Map);
      
      // Verify that the type is ReadonlyMap at compile time
      // (TypeScript will catch any attempts to call .set(), .delete(), etc.)
      const _typeCheck: ReadonlyMap<string, any> = progressMap;
      expect(_typeCheck).toBe(progressMap);
    });
  });

  describe('isLoading', () => {
    it('should return a signal with initial value false', () => {
      const loadingSignal = service.isLoading();
      expect(loadingSignal()).toBe(false);
    });
  });

  describe('getLastSyncTime', () => {
    it('should return a signal with initial value null', () => {
      const lastSyncSignal = service.getLastSyncTime();
      expect(lastSyncSignal()).toBeNull();
    });
  });

  describe('getLastError', () => {
    it('should return a signal with initial value null', () => {
      const lastErrorSignal = service.getLastError();
      expect(lastErrorSignal()).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear a previously set error message', async () => {
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue(null);
      vi.mocked(storageServiceMock.writeProgressFile).mockRejectedValue(new Error('Disk full'));

      await expect(
        service.setProgress('typescript', 'TypeScript', 'In_Progress')
      ).rejects.toThrow();

      expect(service.getLastError()()).not.toBeNull();

      service.clearError();

      expect(service.getLastError()()).toBeNull();
    });
  });

  describe('retryLastWrite / getLastFailedWrite (Requirements 2.3)', () => {
    it('should have no pending failed write initially', () => {
      expect(service.getLastFailedWrite()()).toBeNull();
    });

    it('should record the failed write parameters when setProgress fails', async () => {
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue(null);
      vi.mocked(storageServiceMock.writeProgressFile).mockRejectedValue(new Error('Disk full'));

      await expect(
        service.setProgress('typescript', 'TypeScript', 'In_Progress')
      ).rejects.toThrow();

      expect(service.getLastFailedWrite()()).toEqual({
        conceptId: 'typescript',
        conceptTitle: 'TypeScript',
        state: 'In_Progress',
      });
    });

    it('should clear the failed write record after a successful write', async () => {
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue(null);
      vi.mocked(storageServiceMock.writeProgressFile).mockRejectedValueOnce(
        new Error('Disk full')
      );
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);

      await expect(
        service.setProgress('typescript', 'TypeScript', 'In_Progress')
      ).rejects.toThrow();
      expect(service.getLastFailedWrite()()).not.toBeNull();

      vi.mocked(storageServiceMock.writeProgressFile).mockResolvedValueOnce(undefined);
      await service.setProgress('typescript', 'TypeScript', 'In_Progress');

      expect(service.getLastFailedWrite()()).toBeNull();
    });

    it('should re-attempt the failed write with the same parameters', async () => {
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue(null);
      vi.mocked(storageServiceMock.writeProgressFile).mockRejectedValueOnce(
        new Error('Disk full')
      );
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);

      await expect(
        service.setProgress('typescript', 'TypeScript', 'In_Progress')
      ).rejects.toThrow();

      vi.mocked(storageServiceMock.writeProgressFile).mockResolvedValueOnce(undefined);
      await service.retryLastWrite();

      expect(storageServiceMock.writeProgressFile).toHaveBeenCalledWith(
        'typescript',
        expect.objectContaining({ conceptId: 'typescript', state: 'In_Progress' })
      );
      expect(service.getProgress('typescript')).toBe('In_Progress');
      expect(service.getLastFailedWrite()()).toBeNull();
    });

    it('should do nothing when there is no pending failed write', async () => {
      await service.retryLastWrite();
      expect(storageServiceMock.writeProgressFile).not.toHaveBeenCalled();
    });
  });

  describe('rebuildIndex (Requirements 2.1)', () => {
    it('should write the index file derived from current in-memory progress', async () => {
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue(null);
      vi.mocked(storageServiceMock.writeProgressFile).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);

      await service.setProgress('typescript', 'TypeScript', 'In_Progress');
      vi.mocked(storageServiceMock.writeIndexFile).mockClear();

      await service.rebuildIndex();

      expect(storageServiceMock.writeIndexFile).toHaveBeenCalledWith(
        expect.objectContaining({
          totalConcepts: 1,
          conceptIds: ['typescript'],
        })
      );
    });

    it('should throw and record an error when the index file cannot be written', async () => {
      vi.mocked(storageServiceMock.writeIndexFile).mockRejectedValue(new Error('Disk full'));

      await expect(service.rebuildIndex()).rejects.toThrow('Failed to rebuild index');
      expect(service.getLastError()()).toContain('Disk full');
    });
  });

  describe('corrupted file handling', () => {
    it('should quarantine corrupted JSON files and continue loading others', async () => {
      vi.mocked(storageServiceMock.ensureDirectories).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.listProgressFiles).mockResolvedValue([
        'typescript',
        'corrupted-file',
        'rxjs'
      ]);
      vi.mocked(storageServiceMock.readProgressFile)
        .mockResolvedValueOnce({
          conceptId: 'typescript',
          conceptTitle: 'TypeScript',
          state: 'Understood',
          lastAssessed: '2024-01-15T10:00:00Z',
          assessmentCount: 3,
          version: '1.0.0'
        })
        .mockRejectedValueOnce(new Error('Invalid progress entry format'))
        .mockResolvedValueOnce({
          conceptId: 'rxjs',
          conceptTitle: 'RxJS',
          state: 'In_Progress',
          lastAssessed: '2024-01-14T15:30:00Z',
          assessmentCount: 1,
          version: '1.0.0'
        });
      vi.mocked(storageServiceMock.quarantineProgressFile).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.readIndexFile).mockResolvedValue({
        version: '1.0.0',
        lastUpdated: '2024-01-15T10:00:00Z',
        totalConcepts: 2,
        conceptIds: ['typescript', 'rxjs']
      });
      vi.mocked(storageServiceMock.getFileTimestamp)
        .mockResolvedValueOnce(Date.now())
        .mockResolvedValueOnce(Date.now());

      await service.loadFromFiles();

      // Verify quarantine was called for the corrupted file
      expect(storageServiceMock.quarantineProgressFile).toHaveBeenCalledWith('corrupted-file');

      // Should load the valid files
      expect(service.getProgress('typescript')).toBe('Understood');
      expect(service.getProgress('rxjs')).toBe('In_Progress');

      // Should have an error message about the corrupted file
      const lastError = service.getLastError()();
      expect(lastError).toContain('Corrupted progress data quarantined');
      expect(lastError).toContain('corrupted-file');
    });

    it('should handle quarantine failures gracefully', async () => {
      vi.mocked(storageServiceMock.ensureDirectories).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.listProgressFiles).mockResolvedValue([
        'corrupted-file'
      ]);
      vi.mocked(storageServiceMock.readProgressFile).mockRejectedValue(
        new Error('Invalid JSON structure')
      );
      vi.mocked(storageServiceMock.quarantineProgressFile).mockRejectedValue(
        new Error('Cannot write quarantine file')
      );
      vi.mocked(storageServiceMock.readIndexFile).mockResolvedValue({
        version: '1.0.0',
        lastUpdated: '2024-01-15T10:00:00Z',
        totalConcepts: 0,
        conceptIds: []
      });

      // Should not throw, just log the error
      await service.loadFromFiles();

      expect(storageServiceMock.quarantineProgressFile).toHaveBeenCalledWith('corrupted-file');
    });
  });

  describe('external file modification detection', () => {
    it('should detect external modifications and reload file before saving', async () => {
      const initialTimestamp = 1000;
      const modifiedTimestamp = 2000;
      const externalEntry: ProgressEntry = {
        conceptId: 'typescript',
        conceptTitle: 'TypeScript',
        state: 'Understood',
        lastAssessed: '2024-01-15T10:00:00Z',
        assessmentCount: 5,
        version: '1.0.0'
      };

      // First load - set initial timestamp
      vi.mocked(storageServiceMock.ensureDirectories).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.listProgressFiles).mockResolvedValue(['typescript']);
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue(externalEntry);
      vi.mocked(storageServiceMock.getFileTimestamp).mockResolvedValue(initialTimestamp);
      vi.mocked(storageServiceMock.readIndexFile).mockResolvedValue(null);
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);

      await service.loadFromFiles();

      // Now simulate external modification
      vi.mocked(storageServiceMock.getFileTimestamp)
        .mockResolvedValueOnce(modifiedTimestamp) // Check timestamp
        .mockResolvedValueOnce(modifiedTimestamp); // Update timestamp after write
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue(externalEntry);
      vi.mocked(storageServiceMock.writeProgressFile).mockResolvedValue(undefined);

      await service.setProgress('typescript', 'TypeScript', 'Mastered');

      // Should have reloaded the file to get external assessment count
      expect(storageServiceMock.readProgressFile).toHaveBeenCalledWith('typescript');

      // Should have used external assessment count as base
      expect(storageServiceMock.writeProgressFile).toHaveBeenCalledWith(
        'typescript',
        expect.objectContaining({
          assessmentCount: 6 // External count (5) + 1
        })
      );
    });

    it('should proceed normally when no external modification detected', async () => {
      const timestamp = 1000;

      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue(null);
      vi.mocked(storageServiceMock.getFileTimestamp)
        .mockResolvedValueOnce(null) // No existing file
        .mockResolvedValueOnce(timestamp); // After write
      vi.mocked(storageServiceMock.writeProgressFile).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);

      await service.setProgress('typescript', 'TypeScript', 'In_Progress');

      expect(storageServiceMock.writeProgressFile).toHaveBeenCalledWith(
        'typescript',
        expect.objectContaining({
          assessmentCount: 0
        })
      );
    });
  });

  describe('index rebuild', () => {
    it('should rebuild index.json when missing', async () => {
      vi.mocked(storageServiceMock.ensureDirectories).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.listProgressFiles).mockResolvedValue([
        'typescript',
        'rxjs'
      ]);
      vi.mocked(storageServiceMock.readProgressFile)
        .mockResolvedValueOnce({
          conceptId: 'typescript',
          conceptTitle: 'TypeScript',
          state: 'Understood',
          lastAssessed: '2024-01-15T10:00:00Z',
          assessmentCount: 3,
          version: '1.0.0'
        })
        .mockResolvedValueOnce({
          conceptId: 'rxjs',
          conceptTitle: 'RxJS',
          state: 'In_Progress',
          lastAssessed: '2024-01-14T15:30:00Z',
          assessmentCount: 1,
          version: '1.0.0'
        });
      vi.mocked(storageServiceMock.readIndexFile).mockResolvedValue(null); // Index missing
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.getFileTimestamp)
        .mockResolvedValueOnce(Date.now())
        .mockResolvedValueOnce(Date.now());

      await service.loadFromFiles();

      // Verify index was rebuilt
      expect(storageServiceMock.writeIndexFile).toHaveBeenCalledWith(
        expect.objectContaining({
          version: '1.0.0',
          totalConcepts: 2,
          conceptIds: expect.arrayContaining(['typescript', 'rxjs'])
        })
      );
    });

    it('should rebuild index.json when corrupted', async () => {
      vi.mocked(storageServiceMock.ensureDirectories).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.listProgressFiles).mockResolvedValue(['typescript']);
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue({
        conceptId: 'typescript',
        conceptTitle: 'TypeScript',
        state: 'Understood',
        lastAssessed: '2024-01-15T10:00:00Z',
        assessmentCount: 3,
        version: '1.0.0'
      });
      vi.mocked(storageServiceMock.readIndexFile).mockRejectedValue(
        new Error('Invalid index format')
      );
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.getFileTimestamp).mockResolvedValue(Date.now());

      await service.loadFromFiles();

      // Verify index was rebuilt
      expect(storageServiceMock.writeIndexFile).toHaveBeenCalledWith(
        expect.objectContaining({
          version: '1.0.0',
          totalConcepts: 1,
          conceptIds: ['typescript']
        })
      );
    });

    it('should drop orphaned concept IDs (file missing but tracked) from the rebuilt index', async () => {
      // Only 'typescript' has a file on disk; 'rxjs' was previously tracked
      // (e.g. in a stale in-memory map) but has no corresponding file, and
      // must not be carried forward into the rebuilt index.
      vi.mocked(storageServiceMock.ensureDirectories).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.listProgressFiles).mockResolvedValue(['typescript']);
      vi.mocked(storageServiceMock.readProgressFile).mockResolvedValue({
        conceptId: 'typescript',
        conceptTitle: 'TypeScript',
        state: 'Understood',
        lastAssessed: '2024-01-15T10:00:00Z',
        assessmentCount: 3,
        version: '1.0.0'
      });
      vi.mocked(storageServiceMock.readIndexFile).mockResolvedValue(null); // Index missing, triggers rebuild
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.getFileTimestamp).mockResolvedValue(Date.now());

      await service.loadFromFiles();

      // Since loadFromFiles() only populates newMap from files that exist on
      // disk, the rebuilt index should only contain 'typescript' -- 'rxjs'
      // (no file) is never added and therefore correctly dropped.
      expect(storageServiceMock.writeIndexFile).toHaveBeenCalledWith(
        expect.objectContaining({
          totalConcepts: 1,
          conceptIds: ['typescript']
        })
      );
      expect(service.getAllProgress().has('rxjs')).toBe(false);
    });
  });

  describe('orphaned progress files', () => {
    const typescriptEntry: ProgressEntry = {
      conceptId: 'typescript',
      conceptTitle: 'TypeScript',
      state: 'Understood',
      lastAssessed: '2024-01-15T10:00:00Z',
      assessmentCount: 3,
      version: '1.0.0'
    };
    const orphanEntry: ProgressEntry = {
      conceptId: 'deprecated-concept',
      conceptTitle: 'Deprecated Concept',
      state: 'Mastered',
      lastAssessed: '2023-06-01T10:00:00Z',
      assessmentCount: 5,
      version: '1.0.0'
    };

    async function loadWithOrphan(): Promise<void> {
      vi.mocked(storageServiceMock.ensureDirectories).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.listProgressFiles).mockResolvedValue([
        'typescript',
        'deprecated-concept'
      ]);
      vi.mocked(storageServiceMock.readProgressFile)
        .mockResolvedValueOnce(typescriptEntry)
        .mockResolvedValueOnce(orphanEntry);
      vi.mocked(storageServiceMock.readIndexFile).mockResolvedValue({
        version: '1.0.0',
        lastUpdated: '2024-01-15T10:00:00Z',
        totalConcepts: 2,
        conceptIds: ['typescript', 'deprecated-concept']
      });
      vi.mocked(storageServiceMock.getFileTimestamp).mockResolvedValue(Date.now());

      await service.loadFromFiles();

      // Register 'typescript' as the only concept still present in the wiki graph.
      service.setKnownConceptIds(['typescript']);
    }

    it('should exclude orphaned progress files from getAllProgress()', async () => {
      await loadWithOrphan();

      const allProgress = service.getAllProgress();
      expect(allProgress.has('typescript')).toBe(true);
      expect(allProgress.has('deprecated-concept')).toBe(false);
    });

    it('should exclude orphaned progress files from getAllAssessmentCounts()', async () => {
      await loadWithOrphan();

      const allCounts = service.getAllAssessmentCounts();
      expect(allCounts.has('typescript')).toBe(true);
      expect(allCounts.has('deprecated-concept')).toBe(false);
    });

    it('should not delete orphaned progress files from disk', async () => {
      await loadWithOrphan();

      expect(storageServiceMock.deleteProgressFile).not.toHaveBeenCalled();
    });

    it('should exclude orphaned concepts from index rebuilds', async () => {
      await loadWithOrphan();
      vi.mocked(storageServiceMock.writeIndexFile).mockClear();

      // Trigger an index rebuild via the public rebuildIndex() API.
      await service.rebuildIndex();

      expect(storageServiceMock.writeIndexFile).toHaveBeenCalledWith(
        expect.objectContaining({
          totalConcepts: 1,
          conceptIds: ['typescript']
        })
      );
    });

    it('should list orphaned progress via getOrphanedProgress()', async () => {
      await loadWithOrphan();

      const orphaned = service.getOrphanedProgress();
      expect(orphaned.size).toBe(1);
      expect(orphaned.get('deprecated-concept')).toBe('Mastered');
    });

    it('should return an empty map from getOrphanedProgress() before setKnownConceptIds() is called', () => {
      expect(service.getOrphanedProgress().size).toBe(0);
    });

    it('should not exclude any concepts before setKnownConceptIds() has been called', async () => {
      vi.mocked(storageServiceMock.ensureDirectories).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.listProgressFiles).mockResolvedValue([
        'typescript',
        'deprecated-concept'
      ]);
      vi.mocked(storageServiceMock.readProgressFile)
        .mockResolvedValueOnce(typescriptEntry)
        .mockResolvedValueOnce(orphanEntry);
      vi.mocked(storageServiceMock.readIndexFile).mockResolvedValue({
        version: '1.0.0',
        lastUpdated: '2024-01-15T10:00:00Z',
        totalConcepts: 2,
        conceptIds: ['typescript', 'deprecated-concept']
      });
      vi.mocked(storageServiceMock.getFileTimestamp).mockResolvedValue(Date.now());

      await service.loadFromFiles();

      // setKnownConceptIds() was never called, so nothing is considered orphaned yet.
      expect(service.getAllProgress().has('deprecated-concept')).toBe(true);
    });
  });

  describe('merge conflict detection', () => {
    it('should quarantine a progress file with merge conflict markers and treat concept as Not_Started', async () => {
      vi.mocked(storageServiceMock.ensureDirectories).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.listProgressFiles).mockResolvedValue([
        'typescript',
        'conflicted-concept'
      ]);
      vi.mocked(storageServiceMock.readProgressFile)
        .mockResolvedValueOnce({
          conceptId: 'typescript',
          conceptTitle: 'TypeScript',
          state: 'Understood',
          lastAssessed: '2024-01-15T10:00:00Z',
          assessmentCount: 3,
          version: '1.0.0'
        })
        .mockRejectedValueOnce(
          new Error('Merge conflict markers detected in file: wiki/progress/concepts/conflicted-concept.json')
        );
      vi.mocked(storageServiceMock.quarantineConflictedFile).mockResolvedValue(
        'wiki/progress/concepts/conflicted-concept.json.conflict'
      );
      vi.mocked(storageServiceMock.readIndexFile).mockResolvedValue({
        version: '1.0.0',
        lastUpdated: '2024-01-15T10:00:00Z',
        totalConcepts: 2,
        conceptIds: ['typescript', 'conflicted-concept']
      });
      vi.mocked(storageServiceMock.getFileTimestamp).mockResolvedValue(Date.now());

      await service.loadFromFiles();

      // Quarantined with .conflict extension via StorageService
      expect(storageServiceMock.quarantineConflictedFile).toHaveBeenCalledWith('conflicted-concept');

      // Concept treated as Not_Started until manually resolved
      expect(service.getProgress('conflicted-concept')).toBe('Not_Started');

      // Valid file still loaded normally
      expect(service.getProgress('typescript')).toBe('Understood');

      // Error surfaced for visibility
      const lastError = service.getLastError()();
      expect(lastError).toContain('merge conflicts');
      expect(lastError).toContain('conflicted-concept');
    });

    it('should set a conflict notification with a path to the quarantined file', async () => {
      vi.mocked(storageServiceMock.ensureDirectories).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.listProgressFiles).mockResolvedValue(['conflicted-concept']);
      vi.mocked(storageServiceMock.readProgressFile).mockRejectedValue(
        new Error('Merge conflict markers detected in file: wiki/progress/concepts/conflicted-concept.json')
      );
      vi.mocked(storageServiceMock.quarantineConflictedFile).mockResolvedValue(
        'wiki/progress/concepts/conflicted-concept.json.conflict'
      );
      vi.mocked(storageServiceMock.readIndexFile).mockResolvedValue(null);
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);

      await service.loadFromFiles();

      const notifications = service.getConflictNotifications()();
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toMatchObject({
        conceptId: 'conflicted-concept',
        filePath: 'wiki/progress/concepts/conflicted-concept.json.conflict'
      });
      expect(notifications[0].message).toContain('wiki/progress/concepts/conflicted-concept.json.conflict');
    });

    it('should allow dismissing a conflict notification', async () => {
      vi.mocked(storageServiceMock.ensureDirectories).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.listProgressFiles).mockResolvedValue(['conflicted-concept']);
      vi.mocked(storageServiceMock.readProgressFile).mockRejectedValue(
        new Error('Merge conflict markers detected in file: wiki/progress/concepts/conflicted-concept.json')
      );
      vi.mocked(storageServiceMock.quarantineConflictedFile).mockResolvedValue(
        'wiki/progress/concepts/conflicted-concept.json.conflict'
      );
      vi.mocked(storageServiceMock.readIndexFile).mockResolvedValue(null);
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);

      await service.loadFromFiles();
      expect(service.getConflictNotifications()()).toHaveLength(1);

      service.dismissConflictNotification('conflicted-concept');

      expect(service.getConflictNotifications()()).toHaveLength(0);
    });

    it('should continue loading other files when quarantining a conflicted file fails', async () => {
      vi.mocked(storageServiceMock.ensureDirectories).mockResolvedValue(undefined);
      vi.mocked(storageServiceMock.listProgressFiles).mockResolvedValue(['conflicted-concept']);
      vi.mocked(storageServiceMock.readProgressFile).mockRejectedValue(
        new Error('Merge conflict markers detected in file: wiki/progress/concepts/conflicted-concept.json')
      );
      vi.mocked(storageServiceMock.quarantineConflictedFile).mockRejectedValue(
        new Error('Cannot write quarantine file')
      );
      vi.mocked(storageServiceMock.readIndexFile).mockResolvedValue(null);
      vi.mocked(storageServiceMock.writeIndexFile).mockResolvedValue(undefined);

      // Should not throw, just log the error
      await service.loadFromFiles();

      expect(storageServiceMock.quarantineConflictedFile).toHaveBeenCalledWith('conflicted-concept');
      expect(service.getProgress('conflicted-concept')).toBe('Not_Started');
    });
  });
});
