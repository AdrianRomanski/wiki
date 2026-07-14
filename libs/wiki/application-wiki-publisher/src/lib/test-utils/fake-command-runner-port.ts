/**
 * In-memory FakeCommandRunnerPort test double for `regenerate-manifest-index.spec.ts`.
 *
 * Records every invoked command (and its cwd) and can be configured to throw
 * for a specific command string, allowing both the success path and the
 * per-script failure path of `regenerateManifestAndIndex` to be tested
 * without any real `child_process` execution.
 */

import type { CommandRunnerPort } from '@wiki/application-ports';

export class FakeCommandRunnerPort implements CommandRunnerPort {
  readonly calls: Array<{ command: string; cwd: string }> = [];
  private readonly failingCommands = new Map<string, string>();

  runSync(command: string, cwd: string): void {
    this.calls.push({ command, cwd });

    const failureMessage = this.failingCommands.get(command);
    if (failureMessage !== undefined) {
      throw new Error(failureMessage);
    }
  }

  /** Configures a specific command string to throw with the given message when run. */
  failCommand(command: string, message: string): void {
    this.failingCommands.set(command, message);
  }
}
