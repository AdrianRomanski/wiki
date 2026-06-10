import { QueryEngine } from '@wiki/application-query';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import type { FileSystemConfig } from '@wiki/infrastructure-filesystem';

export async function readSinglePageExample() {
  const config: FileSystemConfig = {
    rootDir: process.cwd(),
    rawDir: 'raw',
    wikiDir: 'wiki',
  };

  const fileSystemAdapter = new FileSystemAdapter(config);
  const frontmatterAdapter = new FrontmatterAdapter();
  const markdownAdapter = new MarkdownAdapter();

  const pagePath = 'entities/angular-cdk.md';
  
  const exists = await fileSystemAdapter.wikiFileExists(pagePath);
  if (!exists) {
    console.log(`Page not found: ${pagePath}`);
    return;
  }

  const content = await fileSystemAdapter.readWikiFile(pagePath);
  const { frontmatter, content: bodyContent } =
    frontmatterAdapter.parseFrontmatter(content);

  console.log('Page Details:');
  console.log('  Title:', frontmatter.title);
  console.log('  Type:', frontmatter.type);
  console.log('  Tags:', frontmatter.tags.join(', '));
  console.log('  Created:', frontmatter.created);
  console.log('  Updated:', frontmatter.updated);
  
  if (frontmatter.sources && frontmatter.sources.length > 0) {
    console.log('  Sources:', frontmatter.sources.join(', '));
  }

  console.log('\nBody Content Length:', bodyContent.length, 'characters');

  return { frontmatter, bodyContent };
}

export async function parseFrontmatterExample() {
  const config: FileSystemConfig = {
    rootDir: process.cwd(),
    rawDir: 'raw',
    wikiDir: 'wiki',
  };

  const fileSystemAdapter = new FileSystemAdapter(config);
  const frontmatterAdapter = new FrontmatterAdapter();

  const pagePath = 'concepts/progressive-enhancement.md';
  
  const content = await fileSystemAdapter.readWikiFile(pagePath);
  const { frontmatter, content: bodyContent } =
    frontmatterAdapter.parseFrontmatter(content);

  console.log('Frontmatter Extraction Example:');
  console.log('');
  console.log('Required Fields:');
  console.log('  title:', frontmatter.title);
  console.log('  type:', frontmatter.type);
  console.log('  tags:', JSON.stringify(frontmatter.tags));
  console.log('  created:', frontmatter.created);
  console.log('  updated:', frontmatter.updated);
  
  console.log('');
  console.log('Optional Fields:');
  console.log('  sources:', frontmatter.sources || 'none');
  console.log('  author:', frontmatter.author || 'none');
  console.log('  date:', frontmatter.date || 'none');
  console.log('  url:', frontmatter.url || 'none');

  const isValid = 
    frontmatter.title &&
    frontmatter.type &&
    Array.isArray(frontmatter.tags) &&
    frontmatter.created &&
    frontmatter.updated;

  console.log('');
  console.log('Validation: Frontmatter is', isValid ? 'valid' : 'invalid');

  return { frontmatter, bodyContent };
}

export async function parseMarkdownSectionsExample() {
  const config: FileSystemConfig = {
    rootDir: process.cwd(),
    rawDir: 'raw',
    wikiDir: 'wiki',
  };

  const fileSystemAdapter = new FileSystemAdapter(config);
  const frontmatterAdapter = new FrontmatterAdapter();
  const markdownAdapter = new MarkdownAdapter();

  const pagePath = 'entities/angular-cdk.md';
  
  const content = await fileSystemAdapter.readWikiFile(pagePath);
  const { content: bodyContent } = frontmatterAdapter.parseFrontmatter(content);

  const sections = markdownAdapter.parseMarkdownSections(bodyContent);

  console.log('Markdown Section Parsing:');
  console.log('');
  console.log(`Found ${sections.length} top-level sections`);
  console.log('');

  sections.forEach((section, index) => {
    console.log(`Section ${index + 1}:`);
    console.log(`  Heading: ${section.heading}`);
    console.log(`  Level: ${section.level}`);
    console.log(`  Content Length: ${section.content.length} characters`);
    console.log(`  Subsections: ${section.subsections.length}`);
    
    if (section.subsections.length > 0) {
      section.subsections.forEach((subsection, subIndex) => {
        console.log(`    Subsection ${subIndex + 1}:`);
        console.log(`      Heading: ${subsection.heading}`);
        console.log(`      Level: ${subsection.level}`);
      });
    }
    console.log('');
  });

  return sections;
}

export async function extractWikiLinksExample() {
  const config: FileSystemConfig = {
    rootDir: process.cwd(),
    rawDir: 'raw',
    wikiDir: 'wiki',
  };

  const fileSystemAdapter = new FileSystemAdapter(config);
  const frontmatterAdapter = new FrontmatterAdapter();
  const markdownAdapter = new MarkdownAdapter();

  const pagePath = 'entities/angular-cdk.md';
  
  const content = await fileSystemAdapter.readWikiFile(pagePath);
  const { content: bodyContent } = frontmatterAdapter.parseFrontmatter(content);

  const wikiLinks = markdownAdapter.extractWikiLinks(bodyContent);

  console.log('WikiLink Extraction:');
  console.log('');
  console.log(`Found ${wikiLinks.length} WikiLinks in the page`);
  console.log('');

  if (wikiLinks.length > 0) {
    console.log('WikiLinks:');
    wikiLinks.forEach((link, index) => {
      console.log(`  ${index + 1}. [[${link}]]`);
    });
  } else {
    console.log('No WikiLinks found in this page');
  }

  return wikiLinks;
}

export async function findBacklinksExample() {
  const config: FileSystemConfig = {
    rootDir: process.cwd(),
    rawDir: 'raw',
    wikiDir: 'wiki',
  };

  const fileSystemAdapter = new FileSystemAdapter(config);
  const frontmatterAdapter = new FrontmatterAdapter();
  const markdownAdapter = new MarkdownAdapter();

  const queryEngine = new QueryEngine(
    fileSystemAdapter,
    frontmatterAdapter,
    markdownAdapter
  );

  const pagePath = 'entities/angular-cdk.md';
  
  const backlinks = await queryEngine.findBacklinks(pagePath);

  console.log(`Backlinks for ${pagePath}:`);
  console.log('');
  console.log(`Found ${backlinks.length} pages linking to this page`);
  console.log('');

  if (backlinks.length > 0) {
    console.log('Pages that link here:');
    backlinks.forEach((page, index) => {
      console.log(`  ${index + 1}. ${page.frontmatter.title}`);
      console.log(`     Path: ${page.path}`);
      console.log(`     Type: ${page.frontmatter.type}`);
    });
  } else {
    console.log('No backlinks found for this page');
  }

  return backlinks;
}

export async function readPagesByTypeExample() {
  const config: FileSystemConfig = {
    rootDir: process.cwd(),
    rawDir: 'raw',
    wikiDir: 'wiki',
  };

  const fileSystemAdapter = new FileSystemAdapter(config);
  const frontmatterAdapter = new FrontmatterAdapter();
  const markdownAdapter = new MarkdownAdapter();

  const queryEngine = new QueryEngine(
    fileSystemAdapter,
    frontmatterAdapter,
    markdownAdapter
  );

  console.log('Reading Pages by Type:');
  console.log('');

  const entities = await queryEngine.findEntities();
  console.log(`Entity pages: ${entities.length}`);
  entities.slice(0, 3).forEach((page) => {
    console.log(`  - ${page.frontmatter.title} (${page.path})`);
  });
  console.log('');

  const concepts = await queryEngine.findConcepts();
  console.log(`Concept pages: ${concepts.length}`);
  concepts.slice(0, 3).forEach((page) => {
    console.log(`  - ${page.frontmatter.title} (${page.path})`);
  });
  console.log('');

  const sources = await queryEngine.findSources();
  console.log(`Source pages: ${sources.length}`);
  sources.slice(0, 3).forEach((page) => {
    console.log(`  - ${page.frontmatter.title} (${page.path})`);
  });

  return { entities, concepts, sources };
}

export async function searchPagesExample() {
  const config: FileSystemConfig = {
    rootDir: process.cwd(),
    rawDir: 'raw',
    wikiDir: 'wiki',
  };

  const fileSystemAdapter = new FileSystemAdapter(config);
  const frontmatterAdapter = new FrontmatterAdapter();
  const markdownAdapter = new MarkdownAdapter();

  const queryEngine = new QueryEngine(
    fileSystemAdapter,
    frontmatterAdapter,
    markdownAdapter
  );

  const query = 'accessibility';
  const results = await queryEngine.search(query, {
    maxResults: 5,
    includeRelatedPages: true,
    caseSensitive: false,
  });

  console.log(`Search Results for "${query}":`);
  console.log('');
  console.log(`Found ${results.length} results`);
  console.log('');

  results.forEach((result, index) => {
    console.log(`Result ${index + 1}:`);
    console.log(`  Title: ${result.page.frontmatter.title}`);
    console.log(`  Path: ${result.page.path}`);
    console.log(`  Relevance Score: ${result.relevance}`);
    
    if (result.matchedContent.length > 0) {
      console.log(`  Snippet: ${result.matchedContent[0]}`);
    }
    
    if (result.relatedPages.length > 0) {
      console.log(`  Related Pages: ${result.relatedPages.length}`);
      result.relatedPages.slice(0, 2).forEach((related) => {
        console.log(`    - ${related.frontmatter.title}`);
      });
    }
    console.log('');
  });

  return results;
}
