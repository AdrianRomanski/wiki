import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from './app';
import { RouterModule } from '@angular/router';
import { StorageService } from './services/storage.service';
import { ProgressStateService } from './services/progress-state.service';

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('App', () => {
  let storageServiceMock: Pick<StorageService, 'initialize'>;
  let progressStateServiceMock: Pick<ProgressStateService, 'loadFromFiles'>;

  beforeEach(async () => {
    storageServiceMock = { initialize: vi.fn().mockResolvedValue(undefined) };
    progressStateServiceMock = { loadFromFiles: vi.fn().mockResolvedValue(undefined) };

    await TestBed.configureTestingModule({
      imports: [App, RouterModule.forRoot([])],
      providers: [
        { provide: StorageService, useValue: storageServiceMock },
        { provide: ProgressStateService, useValue: progressStateServiceMock },
      ],
    }).compileComponents();
  });

  it('should create the app', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('initializes storage and loads progress from disk on startup', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    await flushMicrotasks();

    expect(storageServiceMock.initialize).toHaveBeenCalled();
    expect(progressStateServiceMock.loadFromFiles).toHaveBeenCalled();
    expect(fixture.componentInstance['progressReady']()).toBe(true);
    expect(fixture.componentInstance['progressInitError']()).toBeNull();
  });

  it('shows a user-friendly message when directory access is not supported', async () => {
    vi.mocked(storageServiceMock.initialize).mockRejectedValue(
      new Error('File System Access API is not supported in this browser.')
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    await flushMicrotasks();

    const error = fixture.componentInstance['progressInitError']();
    expect(error).toContain('browser that supports');
    expect(fixture.componentInstance['progressReady']()).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    expect(compiled.querySelector('.progress-init-banner')).toBeTruthy();
  });

  it('shows a user-friendly message when permission is denied', async () => {
    vi.mocked(storageServiceMock.initialize).mockResolvedValue(undefined);
    vi.mocked(progressStateServiceMock.loadFromFiles).mockRejectedValue(
      new Error('Failed to load progress data from disk: Permission denied')
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    await flushMicrotasks();

    const error = fixture.componentInstance['progressInitError']() as string | null;
    expect(error).toContain('permissions');
    expect(fixture.componentInstance['progressReady']()).toBe(false);
  });

  it('allows retrying initialization via the Grant Access button', async () => {
    vi.mocked(storageServiceMock.initialize).mockRejectedValueOnce(
      new Error('Directory access was cancelled by user.')
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    await flushMicrotasks();

    expect(fixture.componentInstance['progressInitError']()).toContain('Grant Access');

    vi.mocked(storageServiceMock.initialize).mockResolvedValueOnce(undefined);
    await fixture.componentInstance['initializeProgressTracking']();

    expect(fixture.componentInstance['progressReady']()).toBe(true);
    expect(fixture.componentInstance['progressInitError']()).toBeNull();
    expect(storageServiceMock.initialize).toHaveBeenCalledTimes(2);
  });
});
