import { GenerateEntityPageUseCase } from '@wiki/application-generators';
import type { EntityPageOptions } from '@wiki/application-generators';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

export function generateEntityPageExample() {
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();
  
  const useCase = new GenerateEntityPageUseCase(
    markdownAdapter,
    frontmatterAdapter
  );

  const libraryOptions: EntityPageOptions = {
    name: 'Angular CDK',
    definition: 'A set of behavior primitives for building UI components with Angular.',
    properties: [
      'Provides reusable component behaviors',
      'Framework-agnostic design principles',
      'Accessibility-first approach',
      'No Material Design styling dependencies'
    ],
    relationships: [
      {
        target: 'Angular',
        description: 'Built on top of'
      },
      {
        target: 'Angular Material',
        description: 'Provides foundation for'
      },
      {
        target: 'Web Accessibility',
        description: 'Implements standards from'
      }
    ],
    examples: [
      'The `Overlay` module provides positioning and backdrop management for floating UI elements like dialogs and tooltips.',
      'The `a11y` module includes focus management utilities such as `FocusTrap` and `LiveAnnouncer` for screen reader support.'
    ],
    tags: ['angular', 'ui', 'components', 'accessibility'],
    sources: ['angular-cdk-documentation-2024-01-15'],
    created: '2024-01-15'
  };

  const result = useCase.execute(libraryOptions);

  console.log('Generated Entity Page:');
  console.log('Filename:', result.filename);
  console.log('');
  console.log('Frontmatter:');
  console.log('  title:', result.frontmatter.title);
  console.log('  type:', result.frontmatter.type);
  console.log('  tags:', result.frontmatter.tags.join(', '));
  console.log('  sources:', result.frontmatter.sources?.join(', ') || 'none');
  console.log('  created:', result.frontmatter.created);
  console.log('');
  console.log('Content Preview:');
  console.log(result.content);

  return result;
}

export function generateEntityPageWithMinimalOptions() {
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();
  
  const useCase = new GenerateEntityPageUseCase(
    markdownAdapter,
    frontmatterAdapter
  );

  const toolOptions: EntityPageOptions = {
    name: 'TypeScript',
    definition: 'A strongly typed programming language that builds on JavaScript.',
    tags: ['programming-language', 'javascript', 'types']
  };

  const result = useCase.execute(toolOptions);

  console.log('Generated Minimal Entity Page:');
  console.log('Filename:', result.filename);
  console.log('');
  console.log('Content:');
  console.log(result.content);

  return result;
}

export function generateEntityPageForFramework() {
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();
  
  const useCase = new GenerateEntityPageUseCase(
    markdownAdapter,
    frontmatterAdapter
  );

  const frameworkOptions: EntityPageOptions = {
    name: 'NestJS',
    definition: 'A progressive Node.js framework for building efficient, reliable and scalable server-side applications.',
    properties: [
      'TypeScript-first development',
      'Modular architecture with dependency injection',
      'Built-in support for GraphQL and REST APIs',
      'Integration with Express or Fastify',
      'Comprehensive testing utilities'
    ],
    relationships: [
      {
        target: 'Node.js',
        description: 'Runs on'
      },
      {
        target: 'Express',
        description: 'Uses as underlying HTTP server'
      },
      {
        target: 'TypeScript',
        description: 'Built with'
      },
      {
        target: 'Dependency Injection',
        description: 'Implements pattern'
      }
    ],
    examples: [
      'Decorators like `@Controller()` and `@Get()` define REST endpoints declaratively.',
      'The module system organizes application code into cohesive units with clear boundaries.'
    ],
    tags: ['framework', 'backend', 'nodejs', 'typescript'],
    sources: ['nestjs-documentation-2024-02-01'],
    created: '2024-02-01'
  };

  const result = useCase.execute(frameworkOptions);

  return result;
}
