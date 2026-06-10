export class NamingConventionError extends Error {
  constructor(
    message: string,
    public filename: string,
    public pageType: 'entity' | 'concept' | 'source',
    public expectedPattern: string
  ) {
    super(message);
    this.name = 'NamingConventionError';
  }
}
