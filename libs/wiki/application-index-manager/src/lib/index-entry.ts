export interface IndexEntry {
  title: string;
  path: string;
  description: string;
  type: 'entity' | 'concept' | 'source';
  date?: string;
}
