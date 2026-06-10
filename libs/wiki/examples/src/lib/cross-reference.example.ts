import { DetectCrossReferencesUseCase } from '@wiki/application-cross-reference';
import { InsertCrossReferenceLinksUseCase } from '@wiki/application-cross-reference';
import { ValidateWikiLinksUseCase } from '@wiki/application-cross-reference';
import { FindBacklinksUseCase } from '@wiki/application-cross-reference';
import { SuggestBidirectionalLinksUseCase } from '@wiki/application-cross-reference';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';

export function detectCrossReferencesExample() {
  const markdownAdapter = new MarkdownAdapter();
  const detectUseCase = new DetectCrossReferencesUseCase(markdownAdapter);

  const existingPages = [
    'Angular',
    'TypeScript',
    'RxJS',
    'Angular CDK',
    'Dependency Injection',
    'Component',
    'Directive'
  ];

  const content = `
Angular is a web application framework built with TypeScript. 
It uses RxJS for reactive programming and provides powerful 
features like Dependency Injection and component-based architecture.

The Angular CDK provides reusable component behaviors that work 
with any Angular component or directive.
`.trim();

  const references = detectUseCase.execute({
    content,
    existingPages,
    caseInsensitive: true,
    minWordLength: 3
  });

  console.log('Detected Cross-References:\n');
  for (const ref of references) {
    console.log(`- "${ref.matchedText}" -> ${ref.targetTitle} (position: ${ref.position})`);
  }

  return references;
}

export function insertCrossReferenceLinksExample() {
  const markdownAdapter = new MarkdownAdapter();
  const detectUseCase = new DetectCrossReferencesUseCase(markdownAdapter);
  const insertUseCase = new InsertCrossReferenceLinksUseCase(markdownAdapter);

  const existingPages = [
    'React',
    'Vue',
    'Angular',
    'TypeScript',
    'JavaScript'
  ];

  const originalContent = `
Modern frontend frameworks like React, Vue, and Angular have become 
essential tools for web developers. While JavaScript remains the 
foundation, TypeScript adds type safety and better tooling support.
`.trim();

  console.log('Original Content:\n');
  console.log(originalContent);
  console.log('\n');

  const references = detectUseCase.execute({
    content: originalContent,
    existingPages,
    caseInsensitive: true
  });

  console.log('Detected References:\n');
  for (const ref of references) {
    console.log(`- ${ref.matchedText} at position ${ref.position}`);
  }
  console.log('\n');

  const updatedContent = insertUseCase.execute(originalContent, references);

  console.log('Content with WikiLinks:\n');
  console.log(updatedContent);

  return {
    originalContent,
    references,
    updatedContent
  };
}

export function validateWikiLinksExample() {
  const markdownAdapter = new MarkdownAdapter();
  const validateUseCase = new ValidateWikiLinksUseCase(markdownAdapter);

  const existingPages = [
    'Angular',
    'TypeScript',
    'RxJS',
    'Component'
  ];

  const contentWithLinks = `
This page discusses [[Angular]] and [[TypeScript]]. It also references 
[[RxJS]] for reactive programming and [[Component]] architecture.

However, it incorrectly links to [[AngularJS]] and [[Webpack]] which 
don't exist in the wiki yet.
`.trim();

  console.log('Content:\n');
  console.log(contentWithLinks);
  console.log('\n');

  const validationResult = validateUseCase.execute(contentWithLinks, existingPages);

  console.log('Validation Result:\n');
  console.log(`Total links: ${validationResult.totalLinks}`);
  console.log(`Valid links: ${validationResult.validLinks.length}`);
  console.log('  -', validationResult.validLinks.join(', '));
  console.log(`Broken links: ${validationResult.brokenLinks.length}`);
  if (validationResult.brokenLinks.length > 0) {
    console.log('  -', validationResult.brokenLinks.join(', '));
  }

  return validationResult;
}

export async function findBacklinksForTargetPageExample() {
  const fileSystemAdapter = new FileSystemAdapter({
    rootDir: process.cwd(),
    rawDir: './raw',
    wikiDir: './wiki'
  });
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();

  const findBacklinksUseCase = new FindBacklinksUseCase(
    fileSystemAdapter,
    markdownAdapter,
    frontmatterAdapter
  );

  const targetPage = 'Angular';
  const wikiDir = './wiki';

  console.log(`Finding pages that link to "${targetPage}"...\n`);

  try {
    const backlinks = await findBacklinksUseCase.execute(targetPage, wikiDir);

    console.log('Backlinks found:\n');
    if (backlinks.length === 0) {
      console.log('No backlinks found.');
    } else {
      for (const backlinkTitle of backlinks) {
        console.log(`- ${backlinkTitle}`);
      }
    }

    return backlinks;
  } catch (error) {
    console.log('Note: This example requires an actual wiki directory structure.');
    console.log('Error:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function suggestBidirectionalLinksExample() {
  const fileSystemAdapter = new FileSystemAdapter({
    rootDir: process.cwd(),
    rawDir: './raw',
    wikiDir: './wiki'
  });
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();

  const suggestUseCase = new SuggestBidirectionalLinksUseCase(
    fileSystemAdapter,
    markdownAdapter,
    frontmatterAdapter
  );

  const wikiDir = './wiki';

  console.log('Analyzing wiki for missing bidirectional links...\n');

  try {
    const suggestions = await suggestUseCase.execute(wikiDir);

    console.log('Suggestions:\n');
    if (suggestions.length === 0) {
      console.log('No suggestions found. All links are bidirectional!');
    } else {
      for (const suggestion of suggestions) {
        console.log(`- Add link from "${suggestion.from}" to "${suggestion.to}"`);
        console.log(`  Reason: ${suggestion.reason}`);
      }
    }

    return suggestions;
  } catch (error) {
    console.log('Note: This example requires an actual wiki directory structure.');
    console.log('Error:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export function completeWorkflowExample() {
  const markdownAdapter = new MarkdownAdapter();
  const detectUseCase = new DetectCrossReferencesUseCase(markdownAdapter);
  const insertUseCase = new InsertCrossReferenceLinksUseCase(markdownAdapter);
  const validateUseCase = new ValidateWikiLinksUseCase(markdownAdapter);

  console.log('=== Complete Cross-Reference Workflow ===\n');

  const existingPages = [
    'Angular',
    'TypeScript',
    'JavaScript',
    'Single Page Application',
    'Progressive Web App'
  ];

  console.log('Step 1: Original Content\n');
  const originalContent = `
# Modern Web Development

Angular is a popular framework for building Single Page Application 
and Progressive Web App experiences. It uses TypeScript as its 
primary language, which extends JavaScript with static typing.
`.trim();

  console.log(originalContent);
  console.log('\n');

  console.log('Step 2: Detect Cross-References\n');
  const references = detectUseCase.execute({
    content: originalContent,
    existingPages,
    caseInsensitive: true,
    minWordLength: 4
  });

  console.log(`Found ${references.length} potential cross-references:`);
  for (const ref of references) {
    console.log(`  - "${ref.matchedText}" -> [[${ref.targetTitle}]]`);
  }
  console.log('\n');

  console.log('Step 3: Insert WikiLinks\n');
  const contentWithLinks = insertUseCase.execute(originalContent, references);
  console.log(contentWithLinks);
  console.log('\n');

  console.log('Step 4: Validate WikiLinks\n');
  const validation = validateUseCase.execute(contentWithLinks, existingPages);
  console.log(`Total links: ${validation.totalLinks}`);
  console.log(`Valid: ${validation.validLinks.length}, Broken: ${validation.brokenLinks.length}`);

  if (validation.brokenLinks.length > 0) {
    console.log('Broken links found:');
    for (const broken of validation.brokenLinks) {
      console.log(`  - ${broken}`);
    }
  } else {
    console.log('All links are valid!');
  }

  return {
    originalContent,
    references,
    contentWithLinks,
    validation
  };
}
