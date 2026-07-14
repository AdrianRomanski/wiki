import { execSync } from 'child_process';
import { CommandRunnerPort } from '@wiki/application-ports';

/**
 * Infrastructure Layer Driven_Adapter implementing CommandRunnerPort using
 * Node's `child_process.execSync`. This isolates the concrete `child_process`
 * dependency out of the Application Layer (Requirement 4.5).
 */
export class CommandRunnerAdapter implements CommandRunnerPort {
  runSync(command: string, cwd: string): void {
    execSync(command, { cwd, stdio: 'pipe', encoding: 'utf-8' });
  }
}
