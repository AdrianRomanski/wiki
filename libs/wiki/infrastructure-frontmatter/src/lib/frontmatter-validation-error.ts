export class FrontmatterValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'FrontmatterValidationError';
  }
}
