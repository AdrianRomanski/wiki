import { UpdatePageWorkflow } from '@wiki/application-workflow';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import type { FileSystemConfig } from '@wiki/infrastructure-filesystem';
import type { UpdatePageOptions } from '@wiki/application-workflow';

export async function updatePageTimestampExample() {
  const config: FileSystemConfig = {
    rootDir: process.cwd(),
    rawDir: 'raw',
    wikiDir: 'wiki',
  };

  const fileSystemAdapter = new FileSystemAdapter(config);
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();

  const workflow = new UpdatePageWorkflow(
    fileSystemAdapter,
    frontmatterAdapter,
    markdownAdapter
  );

  const updateOptions: UpdatePageOptions = {
    pagePath: 'entities/angular-cdk.md',
    changes: 'Updated timestamp to reflect latest review',
    reason: 'Periodic content review',
  };

  const result = await workflow.execute(updateOptions);

  console.log('Page Updated:');
  console.log('  Path:', result.writtenPath);
  console.log('  Title:', result.page.frontmatter.title);
  console.log('  Updated:', result.page.frontmatter.updated);
  console.log('  Changes:', updateOptions.changes);
  console.log('  Reason:', updateOptions.reason);

  return result;
}

export async function updatePageContentExample() {
  const config: FileSystemConfig = {
    rootDir: process.cwd(),
    rawDir: 'raw',
    wikiDir: 'wiki',
  };

  const fileSystemAdapter = new FileSystemAdapter(config);
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();

  const pagePath = 'entities/typescript.md';

  const content = await fileSystemAdapter.readWikiFile(pagePath);
  const { frontmatter, content: bodyContent } =
    frontmatterAdapter.parseFrontmatter(content);

  const newSection = '\n\n## Recent Updates\n\nAdded support for decorators in TypeScript 5.0.';
  const updatedBodyContent = bodyContent + newSection;

  const updatedFrontmatter = frontmatterAdapter.updateTimestamp(frontmatter);

  const updatedContent = frontmatterAdapter.generateFrontmatter(
    updatedFrontmatter,
    updatedBodyContent
  );

  await fileSystemAdapter.writeWikiFile(pagePath, updatedContent);

  console.log('Content Updated:');
  console.log('  Page:', pagePath);
  console.log('  Title:', updatedFrontmatter.title);
  console.log('  Previous Update:', frontmatter.updated);
  console.log('  New Update:', updatedFrontmatter.updated);
  console.log('  Added Section:', 'Recent Updates');

  return { frontmatter: updatedFrontmatter, content: updatedContent };
}

export async function updatePageFrontmatterTagsExample() {
  const config: FileSystemConfig = {
    rootDir: process.cwd(),
    rawDir: 'raw',
    wikiDir: 'wiki',
  };

  const fileSystemAdapter = new FileSystemAdapter(config);
  const frontmatterAdapter = new FrontmatterAdapter();

  const pagePath = 'entities/nestjs.md';

  const content = await fileSystemAdapter.readWikiFile(pagePath);
  const { frontmatter, content: bodyContent } =
    frontmatterAdapter.parseFrontmatter(content);

  const existingTags = frontmatter.tags;
  const newTags = [...existingTags, 'microservices', 'api-gateway'];
  
  const updatedFrontmatter = {
    ...frontmatter,
    tags: newTags,
    updated: new Date().toISOString().split('T')[0],
  };

  const updatedContent = frontmatterAdapter.generateFrontmatter(
    updatedFrontmatter,
    bodyContent
  );

  await fileSystemAdapter.writeWikiFile(pagePath, updatedContent);

  console.log('Tags Updated:');
  console.log('  Page:', pagePath);
  console.log('  Previous Tags:', existingTags.join(', '));
  console.log('  New Tags:', newTags.join(', '));
  console.log('  Added:', newTags.filter(t => !existingTags.includes(t)).join(', '));

  return { frontmatter: updatedFrontmatter, content: updatedContent };
}

export async function updatePageSourcesExample() {
  const config: FileSystemConfig = {
    rootDir: process.cwd(),
    rawDir: 'raw',
    wikiDir: 'wiki',
  };

  const fileSystemAdapter = new FileSystemAdapter(config);
  const frontmatterAdapter = new FrontmatterAdapter();

  const pagePath = 'entities/angular-material.md';

  const content = await fileSystemAdapter.readWikiFile(pagePath);
  const { frontmatter, content: bodyContent } =
    frontmatterAdapter.parseFrontmatter(content);

  const existingSources = frontmatter.sources || [];
  const newSource = 'angular-material-documentation-2024-03-15';
  const updatedSources = [...existingSources, newSource];

  const updatedFrontmatter = {
    ...frontmatter,
    sources: updatedSources,
    updated: new Date().toISOString().split('T')[0],
  };

  const updatedContent = frontmatterAdapter.generateFrontmatter(
    updatedFrontmatter,
    bodyContent
  );

  await fileSystemAdapter.writeWikiFile(pagePath, updatedContent);

  console.log('Sources Updated:');
  console.log('  Page:', pagePath);
  console.log('  Previous Sources:', existingSources.join(', ') || 'none');
  console.log('  Added Source:', newSource);
  console.log('  Total Sources:', updatedSources.length);

  return { frontmatter: updatedFrontmatter, content: updatedContent };
}

export async function addWikiLinksToPageExample() {
  const config: FileSystemConfig = {
    rootDir: process.cwd(),
    rawDir: 'raw',
    wikiDir: 'wiki',
  };

  const fileSystemAdapter = new FileSystemAdapter(config);
  const frontmatterAdapter = new FrontmatterAdapter();
  const markdownAdapter = new MarkdownAdapter();

  const pagePath = 'concepts/dependency-injection.md';

  const content = await fileSystemAdapter.readWikiFile(pagePath);
  const { frontmatter, content: bodyContent } =
    frontmatterAdapter.parseFrontmatter(content);

  const existingLinks = markdownAdapter.extractWikiLinks(bodyContent);

  const linkToAdd = 'Angular';
  const wikiLink = markdownAdapter.generateWikiLink(linkToAdd);

  const updatedBodyContent = bodyContent.replace(
    'Angular framework',
    `[[${linkToAdd}]] framework`
  );

  const newLinks = markdownAdapter.extractWikiLinks(updatedBodyContent);

  const updatedFrontmatter = frontmatterAdapter.updateTimestamp(frontmatter);

  const updatedContent = frontmatterAdapter.generateFrontmatter(
    updatedFrontmatter,
    updatedBodyContent
  );

  await fileSystemAdapter.writeWikiFile(pagePath, updatedContent);

  console.log('WikiLinks Added:');
  console.log('  Page:', pagePath);
  console.log('  Previous Links:', existingLinks.length);
  console.log('  New Links:', newLinks.length);
  console.log('  Added Link:', wikiLink);

  return { frontmatter: updatedFrontmatter, content: updatedContent };
}

export async function restructurePageSectionsExample() {
  const config: FileSystemConfig = {
    rootDir: process.cwd(),
    rawDir: 'raw',
    wikiDir: 'wiki',
  };

  const fileSystemAdapter = new FileSystemAdapter(config);
  const frontmatterAdapter = new FrontmatterAdapter();
  const markdownAdapter = new MarkdownAdapter();

  const pagePath = 'entities/rxjs.md';

  const content = await fileSystemAdapter.readWikiFile(pagePath);
  const { frontmatter, content: bodyContent } =
    frontmatterAdapter.parseFrontmatter(content);

  const sections = markdownAdapter.parseMarkdownSections(bodyContent);

  console.log('Original Structure:');
  console.log(`  Total Sections: ${sections.length}`);
  sections.forEach((section) => {
    console.log(`  - ${section.heading} (Level ${section.level})`);
  });

  const newSection = markdownAdapter.generateHeading('Advanced Patterns', 2);
  const sectionContent = '\nObservables can be combined using operators like merge, concat, and combineLatest.';
  
  const exampleCode = markdownAdapter.generateCodeBlock(
    'const combined$ = combineLatest([obs1$, obs2$]);',
    'typescript'
  );

  const newSectionFull = `${newSection}${sectionContent}\n\n${exampleCode}`;

  const updatedBodyContent = bodyContent + '\n\n' + newSectionFull;

  const updatedFrontmatter = frontmatterAdapter.updateTimestamp(frontmatter);

  const updatedContent = frontmatterAdapter.generateFrontmatter(
    updatedFrontmatter,
    updatedBodyContent
  );

  await fileSystemAdapter.writeWikiFile(pagePath, updatedContent);

  const newSections = markdownAdapter.parseMarkdownSections(updatedBodyContent);

  console.log('');
  console.log('Updated Structure:');
  console.log(`  Total Sections: ${newSections.length}`);
  console.log('  Added Section: Advanced Patterns');

  return { frontmatter: updatedFrontmatter, content: updatedContent };
}
