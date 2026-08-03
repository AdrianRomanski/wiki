import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { ProgressState, ProgressEntry, ProgressIndex } from '../models/progress.models';
import { SCHEMA_VERSION } from '../models/progress.schemas';

/**
 * A notification describing a progress file that was quarantined because it
 * contained unresolved git merge conflict markers. Surfaced so a UI layer
 * can display a link to the quarantined file for manual resolution.
 *
 * Requirements: 2.1, 2.3
 */
export interface ConflictNotification {
  /** Kebab-case concept identifier whose progress file had conflict markers */
  conceptId: string;
  /** Path to the quarantined file (relative to workspace root), e.g. ending in `.conflict` */
  filePath: string;
  /** Human-readable message suitable for direct display in a notification */
  message: string;
}

/**
 * ProgressStateService manages progress state for all concepts with CRUD operations.
 * Uses Angular signals for reactive state management and delegates file system
 * persistence to StorageService.
 * 
 * Requirements: 2.1, 2.2, 2.3
 */
@Injectable({ providedIn: 'root' })
export class ProgressStateService {
  // Observable state using Angular signals
  private readonly progressMap$ = signal<Map<string, ProgressState>>(new Map());
  private readonly assessmentCounts$ = signal<Map<string, number>>(new Map());
  private readonly loading$ = signal<boolean>(false);
  private readonly lastSyncTime$ = signal<Date | null>(null);
  private readonly lastError$ = signal<string | null>(null);
  /**
   * Parameters of the most recent setProgress() call that failed to persist,
   * or null if the last write succeeded (or none has been attempted yet).
   * Retained so the UI can offer a "Retry" action without the caller having
   * to resupply the concept ID/title/state.
   */
  private readonly lastFailedWrite$ = signal<{
    conceptId: string;
    conceptTitle: string;
    state: ProgressState;
  } | null>(null);
  /**
   * Notifications for progress files quarantined due to unresolved git
   * merge conflict markers, most recent last. Consumed by a UI layer to
   * display a link to each file for manual resolution.
   */
  private readonly conflictNotifications$ = signal<ConflictNotification[]>([]);
  /**
   * The set of concept IDs currently present in the wiki graph, or null if
   * unknown (e.g. wiki graph not loaded yet). When set, progress files on
   * disk for concept IDs outside this set are treated as "orphaned": kept
   * on disk but excluded from the active progress map (getAllProgress())
   * and from index.json rebuilds. See setKnownConceptIds().
   */
  private readonly knownConceptIds$ = signal<ReadonlySet<string> | null>(null);
  
  // Track file timestamps to detect external modifications
  private readonly fileTimestamps = new Map<string, number>();

  constructor(private readonly storageService: StorageService) {}

  /**
   * Get the progress state for a specific concept.
   * Returns 'Not_Started' if no progress data exists for the concept.
   * 
   * Requirements: 2.1, 2.2
   * 
   * @param conceptId - Kebab-case concept identifier
   * @returns Current progress state for the concept
   */
  getProgress(conceptId: string): ProgressState {
    return this.progressMap$().get(conceptId) ?? 'Not_Started';
  }

  /**
   * Get the assessment count for a specific concept.
   * Returns 0 if no progress data exists for the concept.
   *
   * @param conceptId - Kebab-case concept identifier
   * @returns Number of times the concept has been assessed
   */
  getAssessmentCount(conceptId: string): number {
    return this.assessmentCounts$().get(conceptId) ?? 0;
  }

  /**
   * Set the progress state for a specific concept.
   * Updates the in-memory state and persists to disk via StorageService.
   * Detects external file modifications and warns user if file was changed externally.
   * 
   * Requirements: 2.1, 2.3
   * 
   * @param conceptId - Kebab-case concept identifier
   * @param conceptTitle - Human-readable concept title
   * @param state - New progress state
   * @throws Error if file write fails after retries
   */
  async setProgress(conceptId: string, conceptTitle: string, state: ProgressState): Promise<void> {
    this.loading$.set(true);
    this.lastError$.set(null);
    let savedAssessmentCount: number | null = null;

    try {
      // Check for external modifications before writing
      const currentTimestamp = await this.storageService.getFileTimestamp(conceptId);
      const lastKnownTimestamp = this.fileTimestamps.get(conceptId);
      
      if (currentTimestamp !== null && lastKnownTimestamp !== undefined && 
          currentTimestamp !== lastKnownTimestamp) {
        console.warn(
          `Progress file for ${conceptId} was modified externally. ` +
          `Last known: ${new Date(lastKnownTimestamp).toISOString()}, ` +
          `Current: ${new Date(currentTimestamp).toISOString()}`
        );
        
        // Reload the file to get the latest version before making changes
        const externalEntry = await this.storageService.readProgressFile(conceptId);
        if (externalEntry) {
          // Use the external assessment count as the base
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
          
          // Update timestamp after successful write
          const newTimestamp = await this.storageService.getFileTimestamp(conceptId);
          if (newTimestamp !== null) {
            this.fileTimestamps.set(conceptId, newTimestamp);
          }
        }
      } else {
        // No external modification detected, proceed normally
        // Get existing entry or create new one
        const existingEntry = await this.storageService.readProgressFile(conceptId);
        
        const entry: ProgressEntry = {
          conceptId,
          conceptTitle,
          state,
          lastAssessed: new Date().toISOString(),
          assessmentCount: existingEntry ? existingEntry.assessmentCount + 1 : 0,
          version: SCHEMA_VERSION
        };

        // Save to disk first (throws on failure)
        await this.saveProgressFile(conceptId, entry);
        savedAssessmentCount = entry.assessmentCount;
        
        // Update timestamp after successful write
        const newTimestamp = await this.storageService.getFileTimestamp(conceptId);
        if (newTimestamp !== null) {
          this.fileTimestamps.set(conceptId, newTimestamp);
        }
      }

      // Update in-memory state only after successful disk write
      const newMap = new Map(this.progressMap$());
      newMap.set(conceptId, state);
      this.progressMap$.set(newMap);

      // Keep the assessment count in sync with what was persisted
      if (savedAssessmentCount !== null) {
        const newCounts = new Map(this.assessmentCounts$());
        newCounts.set(conceptId, savedAssessmentCount);
        this.assessmentCounts$.set(newCounts);
      }

      // Update index file
      await this.updateIndexFile();

      // Update sync time
      this.lastSyncTime$.set(new Date());

      // A successful write means there's nothing left to retry.
      this.lastFailedWrite$.set(null);
    } catch (error) {
      const errorMessage = `Failed to save progress for ${conceptTitle}: ${error instanceof Error ? error.message : String(error)}`;
      this.lastError$.set(errorMessage);

      // Remember what failed so the UI can offer a "Retry" action without
      // the caller having to resupply the concept ID/title/state.
      this.lastFailedWrite$.set({ conceptId, conceptTitle, state });
      
      // Re-throw to allow caller to handle
      throw new Error(errorMessage);
    } finally {
      this.loading$.set(false);
    }
  }

  /**
   * Retry the most recent failed `setProgress()` write, if any.
   * Re-invokes `setProgress()` with the same concept ID/title/state that
   * failed previously. No-ops if there is no pending failed write.
   *
   * Requirements: 2.3
   *
   * @throws Error if the retry also fails (same semantics as setProgress)
   */
  async retryLastWrite(): Promise<void> {
    const failed = this.lastFailedWrite$();
    if (!failed) return;
    await this.setProgress(failed.conceptId, failed.conceptTitle, failed.state);
  }

  /**
   * Get the parameters of the most recent failed write, or null if the
   * last write succeeded (or none has been attempted). Used by the UI to
   * decide whether to show a "Retry" action.
   *
   * @returns Signal containing the failed write's concept ID/title/state, or null
   */
  getLastFailedWrite() {
    return this.lastFailedWrite$.asReadonly();
  }

  /**
   * Get a read-only view of all progress states.
   * Returns a read-only Map to prevent external modification of internal state.
   * Excludes orphaned progress files (concepts no longer present in the wiki
   * graph, per setKnownConceptIds()) from the active view, per the
   * "Orphaned Progress Files" edge case: their data is preserved on disk but
   * not surfaced for rendering.
   * 
   * Requirements: 2.1, 2.2
   * 
   * @returns Read-only map of concept IDs to progress states
   */
  getAllProgress(): ReadonlyMap<string, ProgressState> {
    return this.filterOrphaned(this.progressMap$());
  }

  /**
   * Get a read-only view of assessment counts for all concepts.
   * Used by GraphService to size nodes by assessment count in progress mode.
   * Excludes orphaned progress files, mirroring getAllProgress().
   *
   * @returns Read-only map of concept IDs to assessment counts
   */
  getAllAssessmentCounts(): ReadonlyMap<string, number> {
    return this.filterOrphaned(this.assessmentCounts$());
  }

  /**
   * Register the set of concept IDs currently present in the wiki graph.
   * Progress files on disk for concept IDs outside this set are treated as
   * orphaned: preserved on disk (never deleted) but excluded from
   * getAllProgress()/getAllAssessmentCounts() (and therefore from graph
   * rendering) and from index.json rebuilds.
   *
   * Intended to be called by GraphStateService whenever the wiki graph is
   * (re)loaded, so progress data can be correlated with current wiki
   * concepts.
   *
   * Requirements: 2.1, 2.3
   *
   * @param conceptIds - All concept IDs currently present in the wiki graph
   */
  setKnownConceptIds(conceptIds: Iterable<string>): void {
    this.knownConceptIds$.set(new Set(conceptIds));
  }

  /**
   * Get a read-only view of orphaned progress data: progress files that
   * exist on disk for concepts no longer present in the wiki graph. Intended
   * for an "Orphaned Progress" admin view for manual cleanup. Returns an
   * empty map until setKnownConceptIds() has been called at least once.
   *
   * Requirements: 2.1
   *
   * @returns Read-only map of orphaned concept IDs to their progress states
   */
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

  /**
   * Get the notifications for progress files quarantined due to unresolved
   * git merge conflict markers. Consumed by a UI layer to display a link to
   * each quarantined file for manual resolution.
   *
   * Requirements: 2.1, 2.3
   *
   * @returns Signal containing the list of conflict notifications, most recent last
   */
  getConflictNotifications() {
    return this.conflictNotifications$.asReadonly();
  }

  /**
   * Dismiss a previously surfaced merge conflict notification, e.g. once the
   * user has acknowledged it or resolved the conflict manually.
   *
   * @param conceptId - Concept ID whose conflict notification should be dismissed
   */
  dismissConflictNotification(conceptId: string): void {
    this.conflictNotifications$.set(
      this.conflictNotifications$().filter((n) => n.conceptId !== conceptId)
    );
  }

  /**
   * Filter a map down to only concept IDs known to be present in the wiki
   * graph, per setKnownConceptIds(). If setKnownConceptIds() has not been
   * called yet (knownConceptIds$ is null), returns the map unfiltered so
   * behavior is unchanged before the wiki graph has loaded.
   */
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

  /**
   * Load all progress data from disk into memory.
   * Called on service initialization to restore state.
   * Handles corrupted JSON files by quarantining them with .invalid extension.
   * Rebuilds index.json if missing.
   * 
   * Requirements: 2.1
   * 
   * @throws Error if directory cannot be read or files are corrupted
   */
  async loadFromFiles(): Promise<void> {
    this.loading$.set(true);
    this.lastError$.set(null);

    try {
      // Ensure directories exist
      await this.storageService.ensureDirectories();

      // List all progress files
      const conceptIds = await this.storageService.listProgressFiles();

      // Load each progress file
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
            
            // Track file timestamp for external modification detection
            const timestamp = await this.storageService.getFileTimestamp(conceptId);
            if (timestamp !== null) {
              this.fileTimestamps.set(conceptId, timestamp);
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          // Check for unresolved git merge conflict markers first (a more
          // specific case than generic JSON corruption): quarantine with a
          // `.conflict` extension and surface a dedicated notification
          // rather than the generic ".invalid" corruption path.
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
            // Concept is treated as Not_Started until the conflict is
            // resolved: simply omit it from newMap/newCounts (both default
            // to 'Not_Started'/0 via getProgress()/getAssessmentCount()).
          } else if (errorMessage.includes('Invalid progress entry') ||
              errorMessage.includes('JSON') || 
              errorMessage.includes('parse')) {
            // Other validation/parsing error (corrupted JSON)
            console.warn(`Corrupted progress file detected for ${conceptId}, quarantining...`);
            corruptedFiles.push(conceptId);
            
            // Attempt to quarantine the corrupted file and create a fresh one
            try {
              await this.quarantineAndReset(conceptId);
            } catch (quarantineError) {
              console.error(`Failed to quarantine file for ${conceptId}:`, quarantineError);
            }
          } else {
            // Other types of errors (file read failures, etc.)
            console.warn(`Failed to load progress file for ${conceptId}:`, error);
            failedFiles.push(conceptId);
          }
        }
      }

      // Update in-memory state
      this.progressMap$.set(newMap);
      this.assessmentCounts$.set(newCounts);
      this.lastSyncTime$.set(new Date());

      // Rebuild index if missing
      await this.rebuildIndexIfMissing();

      // Report issues if any
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

  /**
   * Refresh progress data from disk.
   * Reloads all progress files and updates in-memory state.
   * 
   * Requirements: 2.1
   */
  async refreshFromDisk(): Promise<void> {
    await this.loadFromFiles();
  }

  /**
   * Manually reconstruct index.json from the concept files currently in
   * memory (which mirror the files on disk following `loadFromFiles()`).
   * Unlike `rebuildIndexIfMissing()`, this always overwrites the index
   * file, so it also serves as user-triggered recovery when the index is
   * present but stale or inconsistent with the concept files.
   *
   * Exposed for the dashboard's "Rebuild Index" action described in the
   * file read failure error handling scenario.
   *
   * Requirements: 2.1
   *
   * @throws Error if the index file cannot be written
   */
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

  /**
   * Clear all progress data from memory and disk.
   * WARNING: This is a destructive operation.
   * 
   * Requirements: 2.1
   */
  async clearAllProgress(): Promise<void> {
    this.loading$.set(true);
    this.lastError$.set(null);

    try {
      const conceptIds = Array.from(this.progressMap$().keys());
      const failedDeletes: string[] = [];

      // Delete all progress files
      for (const conceptId of conceptIds) {
        try {
          await this.storageService.deleteProgressFile(conceptId);
        } catch (error) {
          console.warn(`Failed to delete progress file for ${conceptId}:`, error);
          failedDeletes.push(conceptId);
        }
      }

      // Clear in-memory state
      this.progressMap$.set(new Map());
      this.assessmentCounts$.set(new Map());

      // Update index file to reflect empty state
      await this.updateIndexFile();

      this.lastSyncTime$.set(new Date());

      // Report failures if any
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

  /**
   * Get the loading state signal.
   * Indicates whether a file system operation is in progress.
   * 
   * @returns Signal containing current loading state
   */
  isLoading() {
    return this.loading$.asReadonly();
  }

  /**
   * Get the last sync time signal.
   * Indicates when progress data was last synchronized with the file system.
   * 
   * @returns Signal containing last sync timestamp or null if never synced
   */
  getLastSyncTime() {
    return this.lastSyncTime$.asReadonly();
  }

  /**
   * Get the last error signal.
   * Contains error message from the most recent failed operation.
   * 
   * @returns Signal containing error message or null if no error
   */
  getLastError() {
    return this.lastError$.asReadonly();
  }

  /**
   * Dismiss the current error notification without retrying anything.
   * Used by the UI's dismiss/close action on error banners.
   */
  clearError(): void {
    this.lastError$.set(null);
  }

  /**
   * Write a progress entry file for a specific concept.
   * Updates the timestamp and delegates to StorageService with retry logic.
   * 
   * Requirements: 2.1, 2.3
   * 
   * @param conceptId - Kebab-case concept identifier
   * @param entry - Progress entry data to save
   * @throws Error if file cannot be written after retries
   */
  private async saveProgressFile(conceptId: string, entry: ProgressEntry): Promise<void> {
    try {
      await this.storageService.writeProgressFile(conceptId, entry);
    } catch (error) {
      throw new Error(
        `Failed to write progress file for ${conceptId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Regenerate the progress index file based on current in-memory state.
   * Called after any progress change to keep index synchronized.
   * 
   * Requirements: 2.1, 2.3
   * 
   * @throws Error if index file cannot be written
   */
  private async updateIndexFile(): Promise<void> {
    try {
      // Exclude orphaned concepts (progress files for concepts no longer in
      // the wiki graph) from the rebuilt index, per the "Orphaned Progress
      // Files" edge case: their data is preserved on disk but not tracked
      // in index.json.
      const conceptIds = Array.from(this.filterOrphaned(this.progressMap$()).keys());
      
      const index: ProgressIndex = {
        version: SCHEMA_VERSION,
        lastUpdated: new Date().toISOString(),
        totalConcepts: conceptIds.length,
        conceptIds: conceptIds.sort() // Sort for consistent ordering
      };

      await this.storageService.writeIndexFile(index);
    } catch (error) {
      throw new Error(
        `Failed to update index file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Quarantine a corrupted progress file and reset concept to Not_Started.
   * Renames the corrupted file to [conceptId].json.invalid
   * 
   * Requirements: 2.1
   * 
   * @param conceptId - Kebab-case concept identifier
   */
  private async quarantineAndReset(conceptId: string): Promise<void> {
    try {
      // Quarantine the corrupted file by renaming it
      await this.storageService.quarantineProgressFile(conceptId);
      
      // Note: We don't create a fresh file here because we don't have
      // the concept title. The file will be created when progress is
      // next updated for this concept via setProgress()
    } catch (error) {
      throw new Error(
        `Failed to quarantine file for ${conceptId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Rebuild index.json from all concept files in the concepts directory
   * if the index file is missing or corrupted.
   * 
   * Requirements: 2.1
   */
  private async rebuildIndexIfMissing(): Promise<void> {
    try {
      // Check if index exists
      const existingIndex = await this.storageService.readIndexFile();
      
      if (existingIndex === null) {
        // Index is missing, rebuild it
        console.warn('Index file missing, rebuilding from concept files...');
        await this.updateIndexFile();
        console.info('Index file rebuilt successfully');
      }
    } catch (error) {
      // If we get a validation error, the index is corrupted
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Invalid index format')) {
        console.warn('Index file corrupted, rebuilding from concept files...');
        await this.updateIndexFile();
        console.info('Index file rebuilt successfully');
      } else {
        // Other error, don't suppress it
        throw error;
      }
    }
  }
}
