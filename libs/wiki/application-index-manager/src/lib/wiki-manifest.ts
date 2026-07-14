/**
 * Shape of wiki/manifest.json. Must remain byte-compatible with the
 * WikiManifest interface documented in
 * apps/wiki-graph/src/app/models/graph.models.ts.
 */
export interface WikiManifest {
  files: string[];
  generatedAt: string;
}
