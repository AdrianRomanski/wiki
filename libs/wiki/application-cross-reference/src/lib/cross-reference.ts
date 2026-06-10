export interface CrossReference {
  matchedText: string;
  targetTitle: string;
  targetFilename?: string;
  exists: boolean;
  position: number;
}
