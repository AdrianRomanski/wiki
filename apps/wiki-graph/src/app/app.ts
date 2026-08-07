import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProgressStateService } from './services/progress-state.service';
import { StorageService } from './services/storage.service';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private title = 'wiki-graph';

  private readonly storageService = inject(StorageService);
  private readonly progressStateService = inject(ProgressStateService);

  protected readonly initializingProgress = signal(false);

  private readonly progressReady = signal(false);

  protected readonly progressInitError = signal<string | null>(null);

  ngOnInit(): void {

    void this.initializeProgressTracking();
  }

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
