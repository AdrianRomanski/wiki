import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProgressStateService } from './services/progress-state.service';
import { StorageService } from './services/storage.service';
// AssessmentService requires no startup initialization (mock, no file/storage
// dependency), but is provided in root via `@Injectable({ providedIn: 'root' })`
// alongside ProgressStateService and StorageService below.

/**
 * Root application component.
 *
 * Owns startup initialization of progress tracking: requests access to the
 * workspace directory via StorageService and loads persisted progress via
 * ProgressStateService. Both services are `providedIn: 'root'`, making them
 * available application-wide as singletons.
 *
 * Requirements: 2.1, 2.2
 */
@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected title = 'wiki-graph';

  private readonly storageService = inject(StorageService);
  private readonly progressStateService = inject(ProgressStateService);

  /** True while the initial workspace connection + progress load is running. */
  protected readonly initializingProgress = signal(false);
  /** True once the workspace has been connected and progress loaded successfully. */
  protected readonly progressReady = signal(false);
  /** User-friendly message describing why progress tracking is unavailable, or null. */
  protected readonly progressInitError = signal<string | null>(null);

  ngOnInit(): void {
    // Attempt automatic initialization on startup. Browsers require a user
    // gesture to show the directory picker, so this first attempt will
    // typically fail with a permission/security error; the resulting banner
    // lets the user retry via a button click, which satisfies that
    // requirement.
    void this.initializeProgressTracking();
  }

  /**
   * Requests workspace directory access and loads progress from disk.
   * Safe to call multiple times (e.g. via a "Grant Access" retry button).
   *
   * Requirements: 2.1, 2.2
   */
  protected async initializeProgressTracking(): Promise<void> {
    this.initializingProgress.set(true);
    this.progressInitError.set(null);

    try {
      await this.storageService.initialize();
      await this.progressStateService.loadFromFiles();
      this.progressReady.set(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.progressInitError.set(this.toUserFriendlyMessage(message));
      this.progressReady.set(false);
    } finally {
      this.initializingProgress.set(false);
    }
  }

  /**
   * Translates raw StorageService/ProgressStateService error messages into
   * user-friendly guidance, per the error handling scenarios in the design
   * (missing directory, permission denied, unsupported browser).
   */
  private toUserFriendlyMessage(message: string): string {
    if (message.includes('not supported')) {
      return 'Progress tracking requires a browser that supports the File System Access API (e.g. Chrome or Edge). Progress tracking is disabled.';
    }
    if (message.includes('cancelled')) {
      return 'Workspace access was not granted, so progress tracking is disabled. Click "Grant Access" to select your workspace folder.';
    }
    if (message.includes('Failed to access directory')) {
      return 'Unable to access the workspace folder. Click "Grant Access" and select your project folder to enable progress tracking.';
    }
    if (message.includes('Failed to create progress directories')) {
      return (
        'Unable to create the progress directory (wiki/progress/). Progress tracking is disabled. ' +
        'Troubleshooting: verify you have write permission to the selected folder, confirm the disk ' +
        'is not full or read-only, then click "Grant Access" to retry.'
      );
    }
    if (message.toLowerCase().includes('permission')) {
      return (
        'Unable to create the progress directory. Check file system permissions and try again. ' +
        'Troubleshooting: confirm the selected folder is writable and not on a read-only volume.'
      );
    }
    return `Progress tracking is unavailable: ${message}`;
  }
}
