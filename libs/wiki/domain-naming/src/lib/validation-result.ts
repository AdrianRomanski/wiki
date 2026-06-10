export interface ValidationResult {
  valid: boolean;
  error?: string;
  expectedPattern: string;
  suggestions?: string[];
}
