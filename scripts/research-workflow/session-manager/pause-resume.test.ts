/**
 * Unit tests for pause and resume functionality
 * Feature: article-research-session
 * Requirements: 8.2, 8.3, 8.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  pauseSession,
  resumeSession,
  PauseError,
  ResumeError,
} from './pause-resume';
import type { SessionJson } from '../types/article-session';

describe('pauseSession', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pause-resume-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
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
    await fs.writeFile(
      path.join(tmpDir, 'session.json'),
      JSON.stringify(full, null, 2),
      'utf-8'
    );
  }

  async function readSession(): Promise<SessionJson> {
    const content = await fs.readFile(
      path.join(tmpDir, 'session.json'),
      'utf-8'
    );
    return JSON.parse(content);
  }

  it('should pause a session in EXPLORE state', async () => {
    await writeSession({ state: 'EXPLORE' });

    const result = await pauseSession(tmpDir);

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

    const result = await pauseSession(tmpDir);

    expect(result.state).toBe('PAUSED');
    expect(result.resumeFrom).toBe('SYNTHESIZE');
  });

  it('should pause a session in FINALIZE state', async () => {
    await writeSession({ state: 'FINALIZE' });

    const result = await pauseSession(tmpDir);

    expect(result.state).toBe('PAUSED');
    expect(result.resumeFrom).toBe('FINALIZE');
  });

  it('should throw PauseError when session is already PAUSED', async () => {
    await writeSession({
      state: 'PAUSED',
      pausedAt: '2024-05-10',
      resumeFrom: 'EXPLORE',
    });

    await expect(pauseSession(tmpDir)).rejects.toThrow(PauseError);
  });

  it('should throw PauseError when session is FINALIZED', async () => {
    await writeSession({ state: 'FINALIZED' });

    await expect(pauseSession(tmpDir)).rejects.toThrow(PauseError);
  });

  it('should preserve all other session fields when pausing', async () => {
    await writeSession({
      state: 'SYNTHESIZE',
      articleTitle: 'My Article',
      articleUrl: 'https://example.com/article',
    });

    const result = await pauseSession(tmpDir);

    expect(result.id).toBe('test-session');
    expect(result.topic).toBe('Test Topic');
    expect(result.scope).toBe('article');
    expect(result.articleTitle).toBe('My Article');
    expect(result.articleUrl).toBe('https://example.com/article');
  });
});

describe('resumeSession', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pause-resume-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
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
    await fs.writeFile(
      path.join(tmpDir, 'session.json'),
      JSON.stringify(full, null, 2),
      'utf-8'
    );
  }

  async function readSession(): Promise<SessionJson> {
    const content = await fs.readFile(
      path.join(tmpDir, 'session.json'),
      'utf-8'
    );
    return JSON.parse(content);
  }

  it('should resume a paused session to EXPLORE', async () => {
    await writeSession({ resumeFrom: 'EXPLORE' });

    const result = await resumeSession(tmpDir);

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
    await fs.writeFile(path.join(tmpDir, 'article-analysis.md'), '# Analysis');

    const result = await resumeSession(tmpDir);

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
    await fs.writeFile(path.join(tmpDir, 'article-analysis.md'), '# Analysis');
    await fs.writeFile(path.join(tmpDir, 'findings-summary.md'), '# Findings');

    const result = await resumeSession(tmpDir);

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

    const result = await resumeSession(tmpDir);

    expect(result.title).toBe('My Great Article');
  });

  it('should fall back to topic for title when articleTitle is not set', async () => {
    await writeSession({ articleTitle: undefined });

    const result = await resumeSession(tmpDir);

    expect(result.title).toBe('Test Topic');
  });

  it('should throw ResumeError when session is not paused', async () => {
    await writeSession({ state: 'EXPLORE' });

    await expect(resumeSession(tmpDir)).rejects.toThrow(ResumeError);
  });

  it('should include session id and current state in ResumeError', async () => {
    await writeSession({ state: 'SYNTHESIZE' });

    try {
      await resumeSession(tmpDir);
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

    await expect(resumeSession(tmpDir)).rejects.toThrow(ResumeError);
  });

  it('should discover all present artifacts', async () => {
    await writeSession({ resumeFrom: 'EXPLORE' });
    await fs.writeFile(path.join(tmpDir, 'raw-article.md'), '# Raw');
    await fs.writeFile(
      path.join(tmpDir, 'article-content.json'),
      '{}'
    );

    const result = await resumeSession(tmpDir);

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

    await resumeSession(tmpDir);

    const persisted = await readSession();
    expect(persisted.articleTitle).toBe('My Article');
    expect(persisted.articleUrl).toBe('https://example.com/article');
    expect(persisted.articleAuthor).toBe('John Doe');
    expect(persisted.id).toBe('test-session');
    expect(persisted.topic).toBe('Test Topic');
  });
});
