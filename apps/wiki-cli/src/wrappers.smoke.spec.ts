/**
 * CLI smoke/integration tests for the wiki-cli Nx application's
 * subcommands (Driver_Adapter composition roots).
 *
 * Invokes the built CLI (`dist/apps/wiki-cli/index.cjs`) as a real
 * subprocess from the actual repo root, asserting on stdout content and
 * exit code — the same way `nx run wiki-cli:<target>` invokes it.
 *
 * Requires `nx build wiki-cli` to have already produced
 * `dist/apps/wiki-cli/index.cjs`.
 *
 * **Validates: Requirements 2.6**
 */

import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { renameSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(__dirname, '..', '..', '..');
const cliPath = join(workspaceRoot, 'dist/apps/wiki-cli/index.cjs');

/** Runs the built CLI from the workspace root and captures stdout/exit code without throwing. */
function runCli(args: string[]): { stdout: string; stderr: string; status: number } {
  try {
    const stdout = execFileSync('node', [cliPath, ...args], {
      cwd: workspaceRoot,
      encoding: 'utf-8',
    });
    return { stdout, stderr: '', status: 0 };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; status?: number | null };
    return {
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
      status: err.status ?? 1,
    };
  }
}

describe('wiki-cli smoke tests', () => {
  it('generate-manifest exits 0 and prints the manifest summary', () => {
    const { stdout, status } = runCli(['generate-manifest']);

    expect(status).toBe(0);
    expect(stdout).toMatch(/wiki\/manifest\.json written with \d+ file\(s\)/);
  });

  it('generate-index exits 0 and prints the index summary', () => {
    const { stdout, status } = runCli(['generate-index']);

    expect(status).toBe(0);
    expect(stdout).toMatch(/wiki\/index\.md regenerated/);
  });

  it('validate-tags exits 0 or 1 and prints the validation header', () => {
    const { stdout, status } = runCli(['validate-tags']);

    // Both outcomes are valid "the command ran correctly" results — 0 when
    // no tag exceeds the 60% threshold, 1 when one or more tags do.
    expect([0, 1]).toContain(status);
    expect(stdout).toMatch(/Tag Distribution Validation/);
  });

  it('init exits 0 and prints the initialization banner', () => {
    const { stdout, status } = runCli(['init']);

    expect(status).toBe(0);
    expect(stdout).toMatch(/LLM Wiki Second Brain Initialization/);
  });

  it('unknown command exits 1 with an error message', () => {
    const { stderr, status } = runCli(['not-a-real-command']);

    expect(status).toBe(1);
    expect(stderr).toMatch(/Unknown command/);
  });

  describe('explicit exit-code contract (Requirement 2.6)', () => {
    const distDepDir = join(workspaceRoot, 'dist/apps/wiki-cli');
    const distDepDirMoved = `${distDepDir}.smoke-test-moved`;

    afterEach(() => {
      // Guarantee restoration even if an assertion above threw mid-test.
      if (existsSync(distDepDirMoved) && !existsSync(distDepDir)) {
        renameSync(distDepDirMoved, distDepDir);
      }
    });

    it('returns exit 0 on success', () => {
      const { status } = runCli(['generate-manifest']);
      expect(status).toBe(0);
    });

    it('returns non-zero exit on failure (missing build output)', () => {
      expect(existsSync(distDepDir)).toBe(true);

      renameSync(distDepDir, distDepDirMoved);
      try {
        expect(() =>
          execFileSync('node', [cliPath, 'generate-manifest'], {
            cwd: workspaceRoot,
            encoding: 'utf-8',
          })
        ).toThrow();
      } finally {
        renameSync(distDepDirMoved, distDepDir);
      }

      // Confirm restoration succeeded and the CLI is usable again.
      expect(existsSync(distDepDir)).toBe(true);
      const { status: statusAfterRestore } = runCli(['generate-manifest']);
      expect(statusAfterRestore).toBe(0);
    });
  });
});
