import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import type { WikiPageFrontmatter } from '@wiki/domain-models';

export function wikiLinkSyntaxExamples() {
  const markdownAdapter = new MarkdownAdapter();

  console.log('WikiLink Syntax Examples:\n');

  const basicLink = markdownAdapter.generateWikiLink('Angular CDK');
  console.log('Basic link:', basicLink);

  const linkWithDisplayText = markdownAdapter.generateWikiLink('Angular CDK', 'the CDK');
  console.log('Link with display text:', linkWithDisplayText);

  const linkWithSection = markdownAdapter.generateWikiLink('Angular CDK', undefined, 'Installation');
  console.log('Link to section:', linkWithSection);

  const linkWithBoth = markdownAdapter.generateWikiLink('Angular CDK', 'CDK installation', 'Installation');
  console.log('Link with display text and section:', linkWithBoth);

  const links = [
    markdownAdapter.generateWikiLink('TypeScript'),
    markdownAdapter.generateWikiLink('Angular'),
    markdownAdapter.generateWikiLink('RxJS')
  ];
  const linkList = markdownAdapter.generateList(links);
  console.log('\nList of links:');
  console.log(linkList);

  return {
    basicLink,
    linkWithDisplayText,
    linkWithSection,
    linkWithBoth,
    linkList
  };
}

export function markdownGenerationExamples() {
  const markdownAdapter = new MarkdownAdapter();

  console.log('Markdown Generation Examples:\n');

  const h1 = markdownAdapter.generateHeading('Main Title', 1);
  const h2 = markdownAdapter.generateHeading('Section Title', 2);
  const h3 = markdownAdapter.generateHeading('Subsection Title', 3);
  console.log('Headings:');
  console.log(h1);
  console.log(h2);
  console.log(h3);
  console.log('');

  const unorderedList = markdownAdapter.generateList([
    'First item',
    'Second item',
    'Third item'
  ]);
  console.log('Unordered list:');
  console.log(unorderedList);
  console.log('');

  const orderedList = markdownAdapter.generateList([
    'Step one',
    'Step two',
    'Step three'
  ], true);
  console.log('Ordered list:');
  console.log(orderedList);
  console.log('');

  const nestedList = markdownAdapter.generateList([
    'Parent item',
    markdownAdapter.generateList(['Child item 1', 'Child item 2'], false, 1)
  ]);
  console.log('Nested list:');
  console.log(nestedList);
  console.log('');

  const codeBlock = markdownAdapter.generateCodeBlock(
    'const greeting = "Hello, World!";\nconsole.log(greeting);',
    'typescript'
  );
  console.log('Code block:');
  console.log(codeBlock);
  console.log('');

  const quote = markdownAdapter.generateBlockquote(
    'This is a blockquote with multiple lines.\nIt demonstrates quote formatting.'
  );
  console.log('Blockquote:');
  console.log(quote);
  console.log('');

  const table = markdownAdapter.generateTable(
    ['Feature', 'Supported', 'Notes'],
    [
      ['Signals', 'Yes', 'Fine-grained reactivity'],
      ['Standalone', 'Yes', 'Simplified architecture'],
      ['SSR', 'Yes', 'With hydration']
    ]
  );
  console.log('Table:');
  console.log(table);

  return {
    headings: { h1, h2, h3 },
    lists: { unorderedList, orderedList, nestedList },
    codeBlock,
    quote,
    table
  };
}

export function frontmatterCreationExamples() {
  const frontmatterAdapter = new FrontmatterAdapter();

  console.log('Frontmatter Creation Examples:\n');

  const entityFrontmatter = frontmatterAdapter.createFrontmatter({
    title: 'Angular CDK',
    type: 'entity',
    tags: ['angular', 'ui', 'components'],
    sources: ['angular-cdk-documentation-2024-01-15']
  });
  console.log('Entity page frontmatter:');
  console.log(entityFrontmatter);
  console.log('');

  const conceptFrontmatter = frontmatterAdapter.createFrontmatter({
    title: 'Dependency Injection',
    type: 'concept',
    tags: ['design-pattern', 'architecture'],
    created: '2024-01-20'
  });
  console.log('Concept page frontmatter:');
  console.log(conceptFrontmatter);
  console.log('');

  const sourceFrontmatter = frontmatterAdapter.createFrontmatter({
    title: 'Modern Web Development with Angular',
    type: 'source',
    tags: ['angular', 'web-development'],
    author: 'Jane Developer',
    date: '2024-01-15',
    url: 'https://example.com/article',
    created: '2024-01-15'
  });
  console.log('Source page frontmatter:');
  console.log(sourceFrontmatter);
  console.log('');

  return {
    entityFrontmatter,
    conceptFrontmatter,
    sourceFrontmatter
  };
}

export function frontmatterValidationExample() {
  const frontmatterAdapter = new FrontmatterAdapter();

  console.log('Frontmatter Validation Example:\n');

  const validFrontmatter: WikiPageFrontmatter = {
    title: 'Test Page',
    type: 'entity',
    tags: ['test'],
    created: '2024-01-01',
    updated: '2024-01-01'
  };

  const markdown = frontmatterAdapter.generateFrontmatter(validFrontmatter);
  console.log('Generated markdown with frontmatter:');
  console.log(markdown);
  console.log('');

  const parsed = frontmatterAdapter.parseFrontmatter(markdown);
  console.log('Parsed frontmatter:');
  console.log(parsed.frontmatter);
  console.log('');
  console.log('Content (should be empty):');
  console.log(`"${parsed.content}"`);

  return { validFrontmatter, markdown, parsed };
}

export function completePageGenerationExample() {
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();

  console.log('Complete Page Generation Example:\n');

  const frontmatter = frontmatterAdapter.createFrontmatter({
    title: 'Example Library',
    type: 'entity',
    tags: ['library', 'javascript', 'example'],
    sources: ['library-docs-2024-01-01']
  });

  const sections: string[] = [];

  sections.push(markdownAdapter.generateHeading('Example Library', 1));
  sections.push('');

  sections.push(markdownAdapter.generateHeading('Overview', 2));
  sections.push('A demonstration library that showcases various features and capabilities.');
  sections.push('');

  sections.push(markdownAdapter.generateHeading('Features', 2));
  sections.push(markdownAdapter.generateList([
    'TypeScript support',
    'Tree-shaking enabled',
    'Zero dependencies',
    'Comprehensive test coverage'
  ]));
  sections.push('');

  sections.push(markdownAdapter.generateHeading('Installation', 2));
  sections.push(markdownAdapter.generateCodeBlock(
    'npm install example-library',
    'bash'
  ));
  sections.push('');

  sections.push(markdownAdapter.generateHeading('Usage', 2));
  sections.push(markdownAdapter.generateCodeBlock(
    'import { ExampleClass } from "example-library";\n\nconst instance = new ExampleClass();\ninstance.doSomething();',
    'typescript'
  ));
  sections.push('');

  sections.push(markdownAdapter.generateHeading('Related Libraries', 2));
  const relatedLinks = [
    markdownAdapter.generateWikiLink('TypeScript'),
    markdownAdapter.generateWikiLink('Node.js'),
    markdownAdapter.generateWikiLink('NPM')
  ];
  sections.push(markdownAdapter.generateList(relatedLinks));
  sections.push('');

  sections.push(markdownAdapter.generateHeading('Key Concepts', 2));
  const conceptLinks = [
    markdownAdapter.generateWikiLink('Dependency Injection', 'dependency injection'),
    markdownAdapter.generateWikiLink('Tree Shaking', 'tree-shaking'),
    markdownAdapter.generateWikiLink('Type Safety', 'type safety')
  ];
  sections.push(`This library demonstrates ${conceptLinks.join(', ')}.`);
  sections.push('');

  sections.push(markdownAdapter.generateHeading('References', 2));
  const sourceLinks = [
    markdownAdapter.generateWikiLink('library-docs-2024-01-01')
  ];
  sections.push(markdownAdapter.generateList(sourceLinks));
  sections.push('');

  const bodyContent = sections.join('\n').trim();
  const completeMarkdown = frontmatterAdapter.generateFrontmatter(frontmatter, bodyContent);

  console.log('Complete page:');
  console.log(completeMarkdown);

  return completeMarkdown;
}

export function advancedMarkdownFeaturesExample() {
  const markdownAdapter = new MarkdownAdapter();

  console.log('Advanced Markdown Features:\n');

  const comparisonTable = markdownAdapter.generateTable(
    ['Approach', 'Pros', 'Cons'],
    [
      ['Option A', 'Simple', 'Limited features'],
      ['Option B', 'Flexible', 'Complex setup'],
      ['Option C', 'Best of both', 'Newer, less tested']
    ]
  );
  console.log('Comparison table:');
  console.log(comparisonTable);
  console.log('');

  const multilineQuote = markdownAdapter.generateBlockquote(
    'First principle: Do not harm the user.\nSecond principle: Provide value quickly.\nThird principle: Be transparent about limitations.'
  );
  console.log('Multi-line quote:');
  console.log(multilineQuote);
  console.log('');

  const nestedLists = [
    'Frontend frameworks',
    markdownAdapter.generateList([
      markdownAdapter.generateWikiLink('React'),
      markdownAdapter.generateWikiLink('Angular'),
      markdownAdapter.generateWikiLink('Vue.js')
    ], false, 1),
    'Backend frameworks',
    markdownAdapter.generateList([
      markdownAdapter.generateWikiLink('Express'),
      markdownAdapter.generateWikiLink('NestJS'),
      markdownAdapter.generateWikiLink('Fastify')
    ], false, 1)
  ].join('\n');
  console.log('Nested categorized lists:');
  console.log(nestedLists);

  return {
    comparisonTable,
    multilineQuote,
    nestedLists
  };
}
