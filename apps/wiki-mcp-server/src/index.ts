import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { validateStructure, buildIndex } from './services/wiki-index.service';
import { createMcpServer } from './server';

function getWikiDir(): string {
  const args = process.argv.slice(2);
  const wikiDirArgIdx = args.indexOf('--wiki-dir');
  if (wikiDirArgIdx !== -1 && args[wikiDirArgIdx + 1]) {
    return args[wikiDirArgIdx + 1];
  }
  if (process.env.WIKI_DIR) {
    return process.env.WIKI_DIR;
  }
  console.error('Error: Wiki directory not specified. Use --wiki-dir <path> or set WIKI_DIR env var.');
  process.exit(1);
}

async function run(): Promise<void> {
  const wikiDir = getWikiDir();

  const validation = validateStructure(wikiDir);
  if (!validation.valid) {
    console.error(`Error: Invalid wiki directory "${wikiDir}": ${validation.error}`);
    process.exit(1);
  }

  console.error(`Building wiki index from: ${wikiDir}`);
  const index = await buildIndex(wikiDir);
  console.error(`Indexed ${index.pages.size} pages.`);

  const server = createMcpServer(wikiDir, index);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Wiki MCP Server running on stdio.');
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
