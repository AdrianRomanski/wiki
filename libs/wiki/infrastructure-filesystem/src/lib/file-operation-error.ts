export class FileOperationError extends Error {
  constructor(message: string, public filePath: string, public cause?: Error) {
    super(message);
    this.name = 'FileOperationError';
  }
}
