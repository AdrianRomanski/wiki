export interface RawSource {
  path: string;
  filename: string;
  format: 'md' | 'pdf' | 'txt' | 'code';
  category: string;
  addedDate: Date;
  fileSize: number;
  content: string | Uint8Array;
  ingested: boolean;
  generatedPages: string[];
}
