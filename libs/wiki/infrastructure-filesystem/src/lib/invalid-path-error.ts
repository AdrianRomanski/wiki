export class InvalidPathError extends Error {
  constructor(message: string, public attemptedPath: string) {
    super(message);
    this.name = 'InvalidPathError';
  }
}
