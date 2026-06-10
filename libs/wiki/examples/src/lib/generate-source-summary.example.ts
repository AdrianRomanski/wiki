import { GenerateSourceSummaryUseCase } from '@wiki/application-generators';
import type { SourceSummaryOptions } from '@wiki/application-generators';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

export function generateSourceSummaryArticleExample() {
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();
  
  const useCase = new GenerateSourceSummaryUseCase(
    markdownAdapter,
    frontmatterAdapter
  );

  const articleOptions: SourceSummaryOptions = {
    title: 'Modern Web Development with Angular',
    author: 'Jane Developer',
    date: '2024-01-15',
    url: 'https://example.com/modern-angular-dev',
    sourceType: 'article',
    rawSourcePath: 'articles/modern-angular-dev.pdf',
    keyPoints: [
      'Standalone components simplify Angular application architecture',
      'Signal-based reactivity improves performance and developer experience',
      'Modern control flow syntax replaces structural directives',
      'Hydration support enables better SSR performance'
    ],
    insights: 'The article emphasizes Angular\'s evolution toward simplicity and performance. The shift to standalone components removes boilerplate while signals provide fine-grained reactivity. These changes align Angular with modern web standards and developer expectations.',
    relevantEntities: [
      'Angular',
      'TypeScript',
      'RxJS'
    ],
    relevantConcepts: [
      'Reactive Programming',
      'Component-Based Architecture',
      'Server-Side Rendering'
    ],
    quotes: [
      'Standalone components represent the future of Angular development.',
      'Signals bring fine-grained reactivity to Angular without sacrificing simplicity.'
    ],
    tags: ['angular', 'web-development', 'frontend'],
    created: '2024-01-15'
  };

  const result = useCase.execute(articleOptions);

  console.log('Generated Source Summary (Article):');
  console.log('Filename:', result.filename);
  console.log('');
  console.log('Frontmatter:');
  console.log('  title:', result.frontmatter.title);
  console.log('  type:', result.frontmatter.type);
  console.log('  author:', result.frontmatter.author);
  console.log('  date:', result.frontmatter.date);
  console.log('  url:', result.frontmatter.url);
  console.log('  tags:', result.frontmatter.tags.join(', '));
  console.log('');
  console.log('Content Preview:');
  console.log(result.content);

  return result;
}

export function generateSourceSummaryDocumentationExample() {
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();
  
  const useCase = new GenerateSourceSummaryUseCase(
    markdownAdapter,
    frontmatterAdapter
  );

  const documentationOptions: SourceSummaryOptions = {
    title: 'Angular ARIA Guide',
    date: '2024-05-10',
    url: 'https://angular.dev/best-practices/a11y',
    sourceType: 'article',
    rawSourcePath: 'docs/angular-aria-guide.md',
    keyPoints: [
      'ARIA attributes enhance accessibility for screen readers',
      'Use semantic HTML elements before adding ARIA',
      'CDK provides accessibility utilities for custom components',
      'Live regions announce dynamic content changes'
    ],
    insights: 'The guide demonstrates Angular\'s commitment to accessibility by providing built-in tools and clear patterns for creating accessible applications. The CDK accessibility module offers production-ready utilities that handle complex ARIA patterns correctly.',
    relevantEntities: [
      'Angular CDK',
      'Angular',
      'Web Accessibility'
    ],
    relevantConcepts: [
      'ARIA',
      'Semantic HTML',
      'Screen Reader Support'
    ],
    tags: ['accessibility', 'angular', 'aria', 'documentation'],
    created: '2024-05-10'
  };

  const result = useCase.execute(documentationOptions);

  console.log('Generated Source Summary (Documentation):');
  console.log('Filename:', result.filename);
  console.log('');
  console.log('Content:');
  console.log(result.content);

  return result;
}

export function generateSourceSummaryWithMinimalOptions() {
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();
  
  const useCase = new GenerateSourceSummaryUseCase(
    markdownAdapter,
    frontmatterAdapter
  );

  const minimalOptions: SourceSummaryOptions = {
    title: 'TypeScript Best Practices',
    keyPoints: [
      'Use strict mode for better type safety',
      'Prefer interfaces over type aliases for objects',
      'Avoid using any type',
      'Enable all strict compiler options'
    ],
    tags: ['typescript', 'best-practices']
  };

  const result = useCase.execute(minimalOptions);

  console.log('Generated Minimal Source Summary:');
  console.log('Filename:', result.filename);
  console.log('');
  console.log('Content:');
  console.log(result.content);

  return result;
}

export function generateSourceSummaryForResearchPaper() {
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();
  
  const useCase = new GenerateSourceSummaryUseCase(
    markdownAdapter,
    frontmatterAdapter
  );

  const paperOptions: SourceSummaryOptions = {
    title: 'The Reactive Manifesto',
    author: 'Jonas Bonér, Dave Farley, Roland Kuhn, Martin Thompson',
    date: '2014-09-16',
    url: 'https://www.reactivemanifesto.org/',
    sourceType: 'paper',
    keyPoints: [
      'Reactive systems are responsive, resilient, elastic, and message-driven',
      'Message-driven architecture enables loose coupling and isolation',
      'Resilience is achieved through replication and containment',
      'Elasticity allows systems to scale up and down based on demand'
    ],
    insights: 'The manifesto defines foundational principles for building distributed systems that remain responsive under varying conditions. These principles influenced modern frameworks and libraries that embrace reactive programming paradigms.',
    relevantEntities: [
      'Akka',
      'RxJava',
      'RxJS'
    ],
    relevantConcepts: [
      'Reactive Streams',
      'Event-Driven Architecture',
      'Asynchronous Programming',
      'Distributed Systems'
    ],
    quotes: [
      'Reactive Systems are: Responsive, Resilient, Elastic and Message Driven.',
      'The driving force behind Reactive Systems is to remain responsive under all conditions.'
    ],
    tags: ['reactive', 'distributed-systems', 'architecture', 'manifesto'],
    created: '2024-03-01'
  };

  const result = useCase.execute(paperOptions);

  return result;
}

export function generateSourceSummaryForCodeExample() {
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();
  
  const useCase = new GenerateSourceSummaryUseCase(
    markdownAdapter,
    frontmatterAdapter
  );

  const codeOptions: SourceSummaryOptions = {
    title: 'Angular Signals Implementation Pattern',
    date: '2024-06-20',
    sourceType: 'code',
    rawSourcePath: 'code/angular-signals-pattern.ts',
    keyPoints: [
      'Signals provide fine-grained reactivity without zone.js',
      'Computed signals derive values from other signals',
      'Effects run side effects when signal values change',
      'Signal-based components can use OnPush change detection'
    ],
    insights: 'This implementation demonstrates best practices for using Angular signals in real applications. The pattern separates state management from view logic while maintaining reactivity.',
    relevantEntities: [
      'Angular',
      'TypeScript'
    ],
    relevantConcepts: [
      'Reactive Programming',
      'Fine-Grained Reactivity',
      'Component-Based Architecture'
    ],
    tags: ['angular', 'signals', 'reactive', 'code-example'],
    created: '2024-06-20'
  };

  const result = useCase.execute(codeOptions);

  return result;
}
