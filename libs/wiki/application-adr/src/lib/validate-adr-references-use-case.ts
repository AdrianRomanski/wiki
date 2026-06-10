import { FileSystemPort } from '@wiki/application-ports';
import { SessionReference, LinkValidationResult } from './interfaces';

export class ValidateADRReferencesUseCase {
  constructor(private fileSystemPort: FileSystemPort) {}

  async execute(sessionReference: SessionReference): Promise<LinkValidationResult> {
    const errors: string[] = [];

    if (sessionReference.sessionPath) {
      try {
        const stats = await this.fileSystemPort.getRawFileStats(sessionReference.sessionPath);
        if (!stats) {
          errors.push(`Session directory not found: ${sessionReference.sessionPath}`);
        }
      } catch {
        errors.push(`Session directory not accessible: ${sessionReference.sessionPath}`);
      }
    }

    if (sessionReference.rawADRPath) {
      try {
        const exists = await this.fileSystemPort.rawFileExists(sessionReference.rawADRPath);
        if (!exists) {
          errors.push(`Raw ADR file not found: ${sessionReference.rawADRPath}`);
        }
      } catch {
        errors.push(`Raw ADR file not accessible: ${sessionReference.rawADRPath}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
