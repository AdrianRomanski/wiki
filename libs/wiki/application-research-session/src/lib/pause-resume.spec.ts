/**
 * Unit tests for pause and resume functionality
 * Feature: article-research-session
 * Requirements: 8.2, 8.3, 8.4
 *
 * Migrated from scripts/research-workflow/session-manager/pause-resume.test.ts.
 * Uses FakeFileSystemPort in place of real temp directories; sessionDir is now
 * a workspace-root-relative string rather than an absolute filesystem path.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { pauseSession, resumeSession, PauseError, ResumeError } from './pause-resume';
import { FakeFileSystemPort } from './test-utils/fake-file-system-port';
import type { SessionJson } from '@wiki/domain-research-session';

describe('pauseSession', () => {
  let fs: FakeFileSystemPort;
  const sessionDir = '.kiro/research/sessions/test-session';

  beforeEach(() => {
    fs = new FakeFileSystemPort();
  });

  async function writeSession(session: Partial<SessionJson>): Promise<void> {
    const full: SessionJson = {
      id: 'test-session',
      topic: 'Test Topic',
      state: 'EXPLORE',
      scope: 'article',
      createdAt: '2024-05-10',
      articleInputType: 'url',
      ...session,
    };
    await fs.writeFile(`${sessionDir}/session.json`, JSON.stringify(full, null, 2));
  }

  async function readSession(): Promise<SessionJson> {
    const content = await fs.readFile(`${sessionDir}/session.json`);
    return JSON.parse(content);
  }

  it('should pause a session in EXPLORE state', async () => {
    await writeSession({ state: 'EXPLORE' });

    const result = await pauseSession(fs, sessionDir);

    expect(result.state).toBe('PAUSED');
    expect(result.resumeFrom).toBe('EXPLORE');
    expect(result.pausedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Verify persisted to disk
    const persisted = await readSession();
    expect(persisted.state).toBe('PAUSED');
    expect(persisted.resumeFrom).toBe('EXPLORE');
    expect(persisted.pausedAt).toBeDefined();
  });

  it('should pause a session in SYNTHESIZE state', async () => {
    await writeSession({ state: 'SYNTHESIZE' });

    const result = await pauseSession(fs, sessionDir);

    expect(result.state).toBe('PAUSED');
    expect(result.resumeFrom).toBe('SYNTHESIZE');
  });

  it('should pause a session in FINALIZE state', async () => {
    await writeSession({ state: 'FINALIZE' });

    const result = await pauseSession(fs, sessionDir);

    expect(result.state).toBe('PAUSED');
    expect(result.resumeFrom).toBe('FINALIZE');
  });

  it('should throw PauseError when session is already PAUSED', async () => {
    await writeSession({
      state: 'PAUSED',
      pausedAt: '2024-05-10',
      resumeFrom: 'EXPLORE',
    });

    await expect(pauseSession(fs, sessionDir)).rejects.toThrow(PauseError);
  });

  it('should throw PauseError when session is FINALIZED', async () => {
    await writeSession({ state: 'FINALIZED' });

    await expect(pauseSession(fs, sessionDir)).rejects.toThrow(PauseError);
  });

  it('should preserve all other session fields when pausing', async () => {
    await writeSession({
      state: 'SYNTHESIZE',
      articleTitle: 'My Article',
      articleUrl: 'https://example.com/article',
    });

    const result = await pauseSession(fs, sessionDir);

    expect(result.id).toBe('test-session');
    expect(result.topic).toBe('Test Topic');
    expect(result.scope).toBe('article');
    expect(result.articleTitle).toBe('My Article');
    expect(result.articleUrl).toBe('https://example.com/article');
  });
});

describe('resumeSession', () => {
  let fs: FakeFileSystemPort;
  const sessionDir = '.kiro/research/sessions/test-session';

  beforeEach(() => {
    fs = new FakeFileSystemPort();
  });

  async function writeSession(session: Partial<SessionJson>): Promise<void> {
    const full: SessionJson = {
      id: 'test-session',
      topic: 'Test Topic',
      state: 'PAUSED',
      scope: 'article',
      createdAt: '2024-05-10',
      articleInputType: 'url',
      pausedAt: '2024-05-12',
      resumeFrom: 'EXPLORE',
      ...session,
    };
    await fs.writeFile(`${sessionDir}/session.json`, JSON.stringify(full, null, 2));
  }

  async function readSession(): Promise<SessionJson> {
    const content = await fs.readFile(`${sessionDir}/session.json`);
    return JSON.parse(content);
  }

  it('should resume a paused session to EXPLORE', async () => {
    await writeSession({ resumeFrom: 'EXPLORE' });

    const result = await resumeSession(fs, sessionDir);

    expect(result.sessionId).toBe('test-session');
    expect(result.resumeFrom).toBe('EXPLORE');
    expect(result.pausedAt).toBe('2024-05-12');
    expect(result.scope).toBe('article');

    // Verify persisted state
    const persisted = await readSession();
    expect(persisted.state).toBe('EXPLORE');
    expect(persisted.pausedAt).toBeUndefined();
    expect(persisted.resumeFrom).toBeUndefined();
  });

  it('should resume a paused session to SYNTHESIZE', async () => {
    await writeSession({ resumeFrom: 'SYNTHESIZE' });
    // Create artifact to simulate completed EXPLORE
    await fs.writeFile(`${sessionDir}/article-analysis.md`, '# Analysis');

    const result = await resumeSession(fs, sessionDir);

    expect(result.resumeFrom).toBe('SYNTHESIZE');
    expect(result.completedSteps).toEqual([
      { step: 'EXPLORE', artifactPath: 'article-analysis.md' },
    ]);

    const persisted = await readSession();
    expect(persisted.state).toBe('SYNTHESIZE');
  });

  it('should resume a paused session to FINALIZE', async () => {
    await writeSession({ resumeFrom: 'FINALIZE' });
    // Create artifacts to simulate completed EXPLORE and SYNTHESIZE
    await fs.writeFile(`${sessionDir}/article-analysis.md`, '# Analysis');
    await fs.writeFile(`${sessionDir}/findings-summary.md`, '# Findings');

    const result = await resumeSession(fs, sessionDir);

    expect(result.resumeFrom).toBe('FINALIZE');
    expect(result.completedSteps).toEqual([
      { step: 'EXPLORE', artifactPath: 'article-analysis.md' },
      { step: 'SYNTHESIZE', artifactPath: 'findings-summary.md' },
    ]);

    const persisted = await readSession();
    expect(persisted.state).toBe('FINALIZE');
  });

  it('should use articleTitle for title when available', async () => {
    await writeSession({ articleTitle: 'My Great Article' });

    const result = await resumeSession(fs, sessionDir);

    expect(result.title).toBe('My Great Article');
  });

  it('should fall back to topic for title when articleTitle is not set', async () => {
    await writeSession({ articleTitle: undefined });

    const result = await resumeSession(fs, sessionDir);

    expect(result.title).toBe('Test Topic');
  });

  it('should throw ResumeError when session is not paused', async () => {
    await writeSession({ state: 'EXPLORE' });

    await expect(resumeSession(fs, sessionDir)).rejects.toThrow(ResumeError);
  });

  it('should include session id and current state in ResumeError', async () => {
    await writeSession({ state: 'SYNTHESIZE' });

    try {
      await resumeSession(fs, sessionDir);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ResumeError);
      const resumeErr = err as InstanceType<typeof ResumeError>;
      expect(resumeErr.sessionId).toBe('test-session');
      expect(resumeErr.currentState).toBe('SYNTHESIZE');
      expect(resumeErr.message).toContain('test-session');
      expect(resumeErr.message).toContain('SYNTHESIZE');
    }
  });

  it('should throw ResumeError when session is FINALIZED', async () => {
    await writeSession({ state: 'FINALIZED' });

    await expect(resumeSession(fs, sessionDir)).rejects.toThrow(ResumeError);
  });

  it('should discover all present artifacts', async () => {
    await writeSession({ resumeFrom: 'EXPLORE' });
    await fs.writeFile(`${sessionDir}/raw-article.md`, '# Raw');
    await fs.writeFile(`${sessionDir}/article-content.json`, '{}');

    const result = await resumeSession(fs, sessionDir);

    expect(result.artifactPaths).toContain('session.json');
    expect(result.artifactPaths).toContain('raw-article.md');
    expect(result.artifactPaths).toContain('article-content.json');
  });

  it('should preserve all other session fields when resuming', async () => {
    await writeSession({
      articleTitle: 'My Article',
      articleUrl: 'https://example.com/article',
      articleAuthor: 'John Doe',
    });

    await resumeSession(fs, sessionDir);

    const persisted = await readSession();
    expect(persisted.articleTitle).toBe('My Article');
    expect(persisted.articleUrl).toBe('https://example.com/article');
    expect(persisted.articleAuthor).toBe('John Doe');
    expect(persisted.id).toBe('test-session');
    expect(persisted.topic).toBe('Test Topic');
  });
});
