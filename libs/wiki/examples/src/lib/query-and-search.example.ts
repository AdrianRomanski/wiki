import { SearchUseCase } from '@wiki/application-query';
import { SearchByTagUseCase } from '@wiki/application-query';
import { FindEntitiesUseCase } from '@wiki/application-query';
import { FindConceptsUseCase } from '@wiki/application-query';
import { FindSourcesUseCase } from '@wiki/application-query';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { SearchOptions, SourceFilters } from '@wiki/application-query';

export async function fullTextSearchExample() {
  const fileSystemAdapter = new FileSystemAdapter({
    rootDir: process.cwd(),
    rawDir: './raw',
    wikiDir: './wiki'
  });
  const frontmatterAdapter = new FrontmatterAdapter();
  const markdownAdapter = new MarkdownAdapter();

  const searchUseCase = new SearchUseCase(
    fileSystemAdapter,
    frontmatterAdapter,
    markdownAdapter
  );

  const query = 'Angular framework';

  console.log(`Searching for: "${query}"\n`);

  try {
    const results = await searchUseCase.execute(query);

    console.log(`Found ${results.length} results:\n`);

    for (const result of results) {
      console.log(`- ${result.page.frontmatter.title}`);
      console.log(`  Type: ${result.page.frontmatter.type}`);
      console.log(`  Relevance: ${result.relevance}`);
      console.log(`  Path: ${result.page.path}`);

      if (result.matchedContent.length > 0) {
        console.log(`  Snippet: ${result.matchedContent[0]}`);
      }

      console.log();
    }

    return results;
  } catch (error) {
    console.log('Note: This example requires an actual wiki directory structure.');
    console.log('Error:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function fullTextSearchWithOptionsExample() {
  const fileSystemAdapter = new FileSystemAdapter({
    rootDir: process.cwd(),
    rawDir: './raw',
    wikiDir: './wiki'
  });
  const frontmatterAdapter = new FrontmatterAdapter();
  const markdownAdapter = new MarkdownAdapter();

  const searchUseCase = new SearchUseCase(
    fileSystemAdapter,
    frontmatterAdapter,
    markdownAdapter
  );

  const query = 'component architecture';
  const options: SearchOptions = {
    maxResults: 5,
    includeRelatedPages: true,
    caseSensitive: false,
    snippetLength: 200,
    sortByDate: false
  };

  console.log(`Searching with options: "${query}"\n`);
  console.log('Options:', JSON.stringify(options, null, 2));
  console.log();

  try {
    const results = await searchUseCase.execute(query, options);

    console.log(`Found ${results.length} results:\n`);

    for (const result of results) {
      console.log(`- ${result.page.frontmatter.title} (Relevance: ${result.relevance})`);
      
      if (result.matchedContent.length > 0) {
        console.log(`  Snippet: ${result.matchedContent[0]}`);
      }

      if (result.relatedPages.length > 0) {
        console.log(`  Related pages: ${result.relatedPages.map(p => p.frontmatter.title).join(', ')}`);
      }

      console.log();
    }

    return results;
  } catch (error) {
    console.log('Note: This example requires an actual wiki directory structure.');
    console.log('Error:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function tagBasedSearchExample() {
  const fileSystemAdapter = new FileSystemAdapter({
    rootDir: process.cwd(),
    rawDir: './raw',
    wikiDir: './wiki'
  });
  const frontmatterAdapter = new FrontmatterAdapter();
  const markdownAdapter = new MarkdownAdapter();

  const searchByTagUseCase = new SearchByTagUseCase(
    fileSystemAdapter,
    frontmatterAdapter,
    markdownAdapter
  );

  const tag = 'typescript';

  console.log(`Searching for pages with tag: "${tag}"\n`);

  try {
    const pages = await searchByTagUseCase.execute(tag);

    console.log(`Found ${pages.length} pages:\n`);

    for (const page of pages) {
      console.log(`- ${page.frontmatter.title}`);
      console.log(`  Type: ${page.frontmatter.type}`);
      console.log(`  Tags: ${page.frontmatter.tags.join(', ')}`);
      console.log(`  Path: ${page.path}`);
      console.log();
    }

    return pages;
  } catch (error) {
    console.log('Note: This example requires an actual wiki directory structure.');
    console.log('Error:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function queryByPageTypeExample() {
  const fileSystemAdapter = new FileSystemAdapter({
    rootDir: process.cwd(),
    rawDir: './raw',
    wikiDir: './wiki'
  });
  const frontmatterAdapter = new FrontmatterAdapter();
  const markdownAdapter = new MarkdownAdapter();

  const findEntitiesUseCase = new FindEntitiesUseCase(
    fileSystemAdapter,
    frontmatterAdapter,
    markdownAdapter
  );

  const findConceptsUseCase = new FindConceptsUseCase(
    fileSystemAdapter,
    frontmatterAdapter,
    markdownAdapter
  );

  const findSourcesUseCase = new FindSourcesUseCase(
    fileSystemAdapter,
    frontmatterAdapter,
    markdownAdapter
  );

  console.log('=== Finding Pages by Type ===\n');

  try {
    console.log('1. Finding all entity pages:\n');
    const entities = await findEntitiesUseCase.execute();
    console.log(`Found ${entities.length} entities:`);
    for (const entity of entities.slice(0, 5)) {
      console.log(`  - ${entity.frontmatter.title}`);
    }
    if (entities.length > 5) {
      console.log(`  ... and ${entities.length - 5} more`);
    }
    console.log();

    console.log('2. Finding concept pages matching "pattern":\n');
    const concepts = await findConceptsUseCase.execute('pattern');
    console.log(`Found ${concepts.length} concepts:`);
    for (const concept of concepts) {
      console.log(`  - ${concept.frontmatter.title}`);
    }
    console.log();

    console.log('3. Finding all source pages:\n');
    const sources = await findSourcesUseCase.execute();
    console.log(`Found ${sources.length} sources:`);
    for (const source of sources.slice(0, 5)) {
      console.log(`  - ${source.frontmatter.title}`);
      if (source.frontmatter.author) {
        console.log(`    Author: ${source.frontmatter.author}`);
      }
      if (source.frontmatter.date) {
        console.log(`    Date: ${source.frontmatter.date}`);
      }
    }
    if (sources.length > 5) {
      console.log(`  ... and ${sources.length - 5} more`);
    }
    console.log();

    return {
      entities,
      concepts,
      sources
    };
  } catch (error) {
    console.log('Note: This example requires an actual wiki directory structure.');
    console.log('Error:', error instanceof Error ? error.message : String(error));
    return {
      entities: [],
      concepts: [],
      sources: []
    };
  }
}

export async function combineMultipleCriteriaExample() {
  const fileSystemAdapter = new FileSystemAdapter({
    rootDir: process.cwd(),
    rawDir: './raw',
    wikiDir: './wiki'
  });
  const frontmatterAdapter = new FrontmatterAdapter();
  const markdownAdapter = new MarkdownAdapter();

  const searchByTagUseCase = new SearchByTagUseCase(
    fileSystemAdapter,
    frontmatterAdapter,
    markdownAdapter
  );

  const findSourcesUseCase = new FindSourcesUseCase(
    fileSystemAdapter,
    frontmatterAdapter,
    markdownAdapter
  );

  console.log('=== Combining Multiple Search Criteria ===\n');

  try {
    console.log('Step 1: Find all pages tagged with "angular":\n');
    const angularPages = await searchByTagUseCase.execute('angular');
    console.log(`Found ${angularPages.length} pages with angular tag\n`);

    console.log('Step 2: Filter to only entity pages:\n');
    const angularEntities = angularPages.filter(
      page => page.frontmatter.type === 'entity'
    );
    console.log(`Found ${angularEntities.length} Angular entities:`);
    for (const entity of angularEntities) {
      console.log(`  - ${entity.frontmatter.title}`);
    }
    console.log();

    console.log('Step 3: Find sources with specific filters:\n');
    const filters: SourceFilters = {
      libraryName: 'angular'
    };
    const angularSources = await findSourcesUseCase.execute(filters);
    console.log(`Found ${angularSources.length} Angular sources:`);
    for (const source of angularSources.slice(0, 5)) {
      console.log(`  - ${source.frontmatter.title}`);
      if (source.frontmatter.author) {
        console.log(`    Author: ${source.frontmatter.author}`);
      }
    }
    if (angularSources.length > 5) {
      console.log(`  ... and ${angularSources.length - 5} more`);
    }
    console.log();

    return {
      allAngularPages: angularPages,
      angularEntities,
      angularSources
    };
  } catch (error) {
    console.log('Note: This example requires an actual wiki directory structure.');
    console.log('Error:', error instanceof Error ? error.message : String(error));
    return {
      allAngularPages: [],
      angularEntities: [],
      angularSources: []
    };
  }
}

export async function searchResultRankingExample() {
  const fileSystemAdapter = new FileSystemAdapter({
    rootDir: process.cwd(),
    rawDir: './raw',
    wikiDir: './wiki'
  });
  const frontmatterAdapter = new FrontmatterAdapter();
  const markdownAdapter = new MarkdownAdapter();

  const searchUseCase = new SearchUseCase(
    fileSystemAdapter,
    frontmatterAdapter,
    markdownAdapter
  );

  console.log('=== Search Result Ranking Example ===\n');

  const query = 'dependency injection';

  console.log(`Searching for: "${query}"\n`);
  console.log('Ranking factors:');
  console.log('- Title matches: +10 points');
  console.log('- Tag matches: +5 points');
  console.log('- Content matches: +1 point per occurrence');
  console.log();

  try {
    const results = await searchUseCase.execute(query, {
      maxResults: 10,
      includeRelatedPages: false
    });

    console.log(`Found ${results.length} results (sorted by relevance):\n`);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      console.log(`${i + 1}. ${result.page.frontmatter.title}`);
      console.log(`   Relevance Score: ${result.relevance}`);
      console.log(`   Type: ${result.page.frontmatter.type}`);
      console.log(`   Tags: ${result.page.frontmatter.tags.join(', ')}`);
      
      if (result.matchedContent.length > 0) {
        console.log(`   Match: "${result.matchedContent[0].substring(0, 80)}..."`);
      }
      
      console.log();
    }

    console.log('Results are sorted by relevance score (highest first)');
    console.log('Pages with query terms in title rank highest');
    console.log('Pages with query terms in tags rank next');
    console.log('Pages with many content matches rank last');

    return results;
  } catch (error) {
    console.log('Note: This example requires an actual wiki directory structure.');
    console.log('Error:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function comprehensiveQueryWorkflowExample() {
  const fileSystemAdapter = new FileSystemAdapter({
    rootDir: process.cwd(),
    rawDir: './raw',
    wikiDir: './wiki'
  });
  const frontmatterAdapter = new FrontmatterAdapter();
  const markdownAdapter = new MarkdownAdapter();

  const searchUseCase = new SearchUseCase(
    fileSystemAdapter,
    frontmatterAdapter,
    markdownAdapter
  );

  const searchByTagUseCase = new SearchByTagUseCase(
    fileSystemAdapter,
    frontmatterAdapter,
    markdownAdapter
  );

  const findEntitiesUseCase = new FindEntitiesUseCase(
    fileSystemAdapter,
    frontmatterAdapter,
    markdownAdapter
  );

  const findSourcesUseCase = new FindSourcesUseCase(
    fileSystemAdapter,
    frontmatterAdapter,
    markdownAdapter
  );

  console.log('=== Comprehensive Query Workflow ===\n');

  try {
    console.log('Scenario: Finding information about Angular components\n');

    console.log('Step 1: Full-text search for "component"\n');
    const searchResults = await searchUseCase.execute('component', {
      maxResults: 3,
      includeRelatedPages: true
    });
    console.log(`Found ${searchResults.length} results from full-text search`);
    for (const result of searchResults) {
      console.log(`  - ${result.page.frontmatter.title} (Score: ${result.relevance})`);
    }
    console.log();

    console.log('Step 2: Find entities with "component" in the name\n');
    const componentEntities = await findEntitiesUseCase.execute('component');
    console.log(`Found ${componentEntities.length} entity pages:`);
    for (const entity of componentEntities.slice(0, 3)) {
      console.log(`  - ${entity.frontmatter.title}`);
    }
    console.log();

    console.log('Step 3: Search for pages tagged with "components"\n');
    const taggedPages = await searchByTagUseCase.execute('components');
    console.log(`Found ${taggedPages.length} pages with "components" tag:`);
    for (const page of taggedPages.slice(0, 3)) {
      console.log(`  - ${page.frontmatter.title} (${page.frontmatter.type})`);
    }
    console.log();

    console.log('Step 4: Find source documentation about components\n');
    const filters: SourceFilters = {
      libraryName: 'component'
    };
    const componentSources = await findSourcesUseCase.execute(filters);
    console.log(`Found ${componentSources.length} source documents:`);
    for (const source of componentSources.slice(0, 3)) {
      console.log(`  - ${source.frontmatter.title}`);
      if (source.frontmatter.url) {
        console.log(`    URL: ${source.frontmatter.url}`);
      }
    }
    console.log();

    console.log('Summary:');
    console.log(`- Full-text search: ${searchResults.length} results`);
    console.log(`- Entity pages: ${componentEntities.length} results`);
    console.log(`- Tagged pages: ${taggedPages.length} results`);
    console.log(`- Source documents: ${componentSources.length} results`);
    console.log();

    console.log('Next steps:');
    console.log('- Review high-relevance pages from full-text search');
    console.log('- Explore related pages for additional context');
    console.log('- Check source documents for official documentation');

    return {
      searchResults,
      componentEntities,
      taggedPages,
      componentSources
    };
  } catch (error) {
    console.log('Note: This example requires an actual wiki directory structure.');
    console.log('Error:', error instanceof Error ? error.message : String(error));
    return {
      searchResults: [],
      componentEntities: [],
      taggedPages: [],
      componentSources: []
    };
  }
}
