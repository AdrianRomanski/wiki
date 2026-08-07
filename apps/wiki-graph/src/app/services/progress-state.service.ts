import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { ProgressState, ProgressEntry, ProgressIndex } from '../models/progress.models';
import { SCHEMA_VERSION } from '../models/progress.schemas';

export interface ConflictNotification {

  conceptId: string;

  filePath: string;

  message: string;
}

@Injectable({ providedIn: 'root' })
export class ProgressStateService {

  private readonly progressMap$ = signal<Map<string, ProgressState>>(new Map());
  private readonly assessmentCounts$ = signal<Map<string, number>>(new Map());
  private readonly loading$ = signal<boolean>(false);
  private readonly lastSyncTime$ = signal<Date | null>(null);
  private readonly lastError$ = signal<string | null>(null);

  private readonly lastFailedWrite$ = signal<{
    conceptId: string;
    conceptTitle: string;
    state: ProgressState;
  } | null>(null);

  private readonly conflictNotifications$ = signal<ConflictNotification[]>([]);

  private readonly knownConceptIds$ = signal<ReadonlySet<string> | null>(null);

  private readonly fileTimestamps = new Map<string, number>();

  constructor(private readonly storageService: StorageService) {}

  getProgress(conceptId: string): ProgressState {
    return this.progressMap$().get(conceptId) ?? 'Not_Started';
  }

  getAssessmentCount(conceptId: string): number {
    return this.assessmentCounts$().get(conceptId) ?? 0;
  }

  async setProgress(conceptId: string, conceptTitle: string, state: ProgressState): Promise<void> {
    this.loading$.set(true);
    this.lastError$.set(null);
    let savedAssessmentCount: number | null = null;

    try {

      const currentTimestamp = await this.storageService.getFileTimestamp(conceptId);
      const lastKnownTimestamp = this.fileTimestamps.get(conceptId);

      if (currentTimestamp !== null && lastKnownTimestamp !== undefined && 
          currentTimestamp !== lastKnownTimestamp) {
        console.warn(
          `Progress file for ${conceptId} was modified externally. ` +
          `Last known: ${new Date(lastKnownTimestamp).toISOString()}, ` +
          `Current: ${new Date(currentTimestamp).toISOString()}`
        );

        const externalEntry = await this.storageService.readProgressFile(conceptId);
        if (externalEntry) {

          const entry: ProgressEntry = {
            conceptId,
            conceptTitle,
            state,
            lastAssessed: new Date().toISOString(),
            assessmentCount: externalEntry.assessmentCount + 1,
            version: SCHEMA_VERSION
          };

          await this.saveProgressFile(conceptId, entry);
          savedAssessmentCount = entry.assessmentCount;

          const newTimestamp = await this.storageService.getFileTimestamp(conceptId);
          if (newTimestamp !== null) {
            this.fileTimestamps.set(conceptId, newTimestamp);
          }
        }
      } else {

        const existingEntry = await this.storageService.readProgressFile(conceptId);

        const entry: ProgressEntry = {
          conceptId,
          conceptTitle,
          state,
          lastAssessed: new Date().toISOString(),
          assessmentCount: existingEntry ? existingEntry.assessmentCount + 1 : 0,
          version: SCHEMA_VERSION
        };

        await this.saveProgressFile(conceptId, entry);
        savedAssessmentCount = entry.assessmentCount;

        const newTimestamp = await this.storageService.getFileTimestamp(conceptId);
        if (newTimestamp !== null) {
          this.fileTimestamps.set(conceptId, newTimestamp);
        }
      }

      const newMap = new Map(this.progressMap$());
      newMap.set(conceptId, state);
      this.progressMap$.set(newMap);

      if (savedAssessmentCount !== null) {
        const newCounts = new Map(this.assessmentCounts$());
        newCounts.set(conceptId, savedAssessmentCount);
        this.assessmentCounts$.set(newCounts);
      }

      await this.updateIndexFile();

      this.lastSyncTime$.set(new Date());

      this.lastFailedWrite$.set(null);
    } catch (error) {
      const errorMessage = `Failed to save progress for ${conceptTitle}: ${error instanceof Error ? error.message : String(error)}`;
      this.lastError$.set(errorMessage);

      this.lastFailedWrite$.set({ conceptId, conceptTitle, state });

      throw new Error(errorMessage);
    } finally {
      this.loading$.set(false);
    }
  }

  async retryLastWrite(): Promise<void> {
    const failed = this.lastFailedWrite$();
    if (!failed) return;
    await this.setProgress(failed.conceptId, failed.conceptTitle, failed.state);
  }

  getLastFailedWrite() {
    return this.lastFailedWrite$.asReadonly();
  }

  getAllProgress(): ReadonlyMap<string, ProgressState> {
    return this.filterOrphaned(this.progressMap$());
  }

  getAllAssessmentCounts(): ReadonlyMap<string, number> {
    return this.filterOrphaned(this.assessmentCounts$());
  }

  setKnownConceptIds(conceptIds: Iterable<string>): void {
    this.knownConceptIds$.set(new Set(conceptIds));
  }

  getOrphanedProgress(): ReadonlyMap<string, ProgressState> {
    const known = this.knownConceptIds$();
    if (known === null) return new Map();

    const orphaned = new Map<string, ProgressState>();
    for (const [conceptId, state] of this.progressMap$()) {
      if (!known.has(conceptId)) {
        orphaned.set(conceptId, state);
      }
    }
    return orphaned;
  }

  getConflictNotifications() {
    return this.conflictNotifications$.asReadonly();
  }

  dismissConflictNotification(conceptId: string): void {
    this.conflictNotifications$.set(
      this.conflictNotifications$().filter((n) => n.conceptId !== conceptId)
    );
  }

  private filterOrphaned<V>(map: ReadonlyMap<string, V>): ReadonlyMap<string, V> {
    const known = this.knownConceptIds$();
    if (known === null) return map;

    const filtered = new Map<string, V>();
    for (const [conceptId, value] of map) {
      if (known.has(conceptId)) {
        filtered.set(conceptId, value);
      }
    }
    return filtered;
  }

  async loadFromFiles(): Promise<void> {
    this.loading$.set(true);
    this.lastError$.set(null);

    try {

      await this.storageService.ensureDirectories();

      const conceptIds = await this.storageService.listProgressFiles();

      const newMap = new Map<string, ProgressState>();
      const newCounts = new Map<string, number>();
      const failedFiles: string[] = [];
      const corruptedFiles: string[] = [];
      const conflictedFiles: string[] = [];

      for (const conceptId of conceptIds) {
        try {
          const entry = await this.storageService.readProgressFile(conceptId);
          if (entry) {
            newMap.set(conceptId, entry.state);
            newCounts.set(conceptId, entry.assessmentCount);

            const timestamp = await this.storageService.getFileTimestamp(conceptId);
            if (timestamp !== null) {
              this.fileTimestamps.set(conceptId, timestamp);
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          if (errorMessage.includes('Merge conflict markers detected')) {
            console.warn(`Merge conflict markers detected in progress file for ${conceptId}, quarantining...`);
            conflictedFiles.push(conceptId);

            try {
              const filePath = await this.storageService.quarantineConflictedFile(conceptId);
              this.conflictNotifications$.set([
                ...this.conflictNotifications$(),
                {
                  conceptId,
                  filePath,
                  message: `Progress for ${conceptId} has merge conflicts. Manual resolution required: ${filePath}`
                }
              ]);
            } catch (quarantineError) {
              console.error(`Failed to quarantine conflicted file for ${conceptId}:`, quarantineError);
            }

          } else if (errorMessage.includes('Invalid progress entry') ||
              errorMessage.includes('JSON') || 
              errorMessage.includes('parse')) {

            console.warn(`Corrupted progress file detected for ${conceptId}, quarantining...`);
            corruptedFiles.push(conceptId);

            try {
              await this.quarantineAndReset(conceptId);
            } catch (quarantineError) {
              console.error(`Failed to quarantine file for ${conceptId}:`, quarantineError);
            }
          } else {

            console.warn(`Failed to load progress file for ${conceptId}:`, error);
            failedFiles.push(conceptId);
          }
        }
      }

      this.progressMap$.set(newMap);
      this.assessmentCounts$.set(newCounts);
      this.lastSyncTime$.set(new Date());

      await this.rebuildIndexIfMissing();

      if (conflictedFiles.length > 0) {
        const errorMessage = `Progress for ${conflictedFiles.length} concept(s) has merge conflicts and requires manual resolution: ${conflictedFiles.join(', ')}. Files have been reset to Not_Started.`;
        this.lastError$.set(errorMessage);
        console.error(errorMessage);
      } else if (corruptedFiles.length > 0) {
        const errorMessage = `Corrupted progress data quarantined for ${corruptedFiles.length} concept(s): ${corruptedFiles.join(', ')}. Files have been reset to Not_Started.`;
        this.lastError$.set(errorMessage);
        console.error(errorMessage);
      } else if (failedFiles.length > 0) {
        const errorMessage = `Failed to load progress data for ${failedFiles.length} concept(s): ${failedFiles.join(', ')}`;
        this.lastError$.set(errorMessage);
        console.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = `Failed to load progress data from disk: ${error instanceof Error ? error.message : String(error)}`;
      this.lastError$.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this.loading$.set(false);
    }
  }

  async refreshFromDisk(): Promise<void> {
    await this.loadFromFiles();
  }

  async rebuildIndex(): Promise<void> {
    this.loading$.set(true);
    try {
      await this.updateIndexFile();
      this.lastSyncTime$.set(new Date());
    } catch (error) {
      const errorMessage = `Failed to rebuild index: ${error instanceof Error ? error.message : String(error)}`;
      this.lastError$.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this.loading$.set(false);
    }
  }

  async clearAllProgress(): Promise<void> {
    this.loading$.set(true);
    this.lastError$.set(null);

    try {
      const conceptIds = Array.from(this.progressMap$().keys());
      const failedDeletes: string[] = [];

      for (const conceptId of conceptIds) {
        try {
          await this.storageService.deleteProgressFile(conceptId);
        } catch (error) {
          console.warn(`Failed to delete progress file for ${conceptId}:`, error);
          failedDeletes.push(conceptId);
        }
      }

      this.progressMap$.set(new Map());
      this.assessmentCounts$.set(new Map());

      await this.updateIndexFile();

      this.lastSyncTime$.set(new Date());

      if (failedDeletes.length > 0) {
        const errorMessage = `Failed to delete ${failedDeletes.length} progress file(s): ${failedDeletes.join(', ')}`;
        this.lastError$.set(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = `Failed to clear progress data: ${error instanceof Error ? error.message : String(error)}`;
      this.lastError$.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this.loading$.set(false);
    }
  }

  isLoading() {
    return this.loading$.asReadonly();
  }

  getLastSyncTime() {
    return this.lastSyncTime$.asReadonly();
  }

  getLastError() {
    return this.lastError$.asReadonly();
  }

  clearError(): void {
    this.lastError$.set(null);
  }

  private async saveProgressFile(conceptId: string, entry: ProgressEntry): Promise<void> {
    try {
      await this.storageService.writeProgressFile(conceptId, entry);
    } catch (error) {
      throw new Error(
        `Failed to write progress file for ${conceptId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async updateIndexFile(): Promise<void> {
    try {

      const conceptIds = Array.from(this.filterOrphaned(this.progressMap$()).keys());

      const index: ProgressIndex = {
        version: SCHEMA_VERSION,
        lastUpdated: new Date().toISOString(),
        totalConcepts: conceptIds.length,
        conceptIds: conceptIds.sort() 
      };

      await this.storageService.writeIndexFile(index);
    } catch (error) {
      throw new Error(
        `Failed to update index file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async quarantineAndReset(conceptId: string): Promise<void> {
    try {

      await this.storageService.quarantineProgressFile(conceptId);

    } catch (error) {
      throw new Error(
        `Failed to quarantine file for ${conceptId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async rebuildIndexIfMissing(): Promise<void> {
    try {

      const existingIndex = await this.storageService.readIndexFile();

      if (existingIndex === null) {

        console.warn('Index file missing, rebuilding from concept files...');
        await this.updateIndexFile();
        console.info('Index file rebuilt successfully');
      }
    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Invalid index format')) {
        console.warn('Index file corrupted, rebuilding from concept files...');
        await this.updateIndexFile();
        console.info('Index file rebuilt successfully');
      } else {

        throw error;
      }
    }
  }
}
