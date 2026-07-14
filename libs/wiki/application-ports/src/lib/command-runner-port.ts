export interface CommandRunnerPort {
  /**
   * Runs a shell command synchronously relative to the given working directory.
   * Implementations MUST throw on a non-zero exit code and MUST NOT contain
   * business logic — this port exists solely to isolate the concrete
   * `child_process` dependency out of the Application Layer.
   */
  runSync(command: string, cwd: string): void;
}
