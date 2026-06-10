import { GenerateConceptPageUseCase } from '@wiki/application-generators';
import type { ConceptPageOptions } from '@wiki/application-generators';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

export function generateConceptPageExample() {
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();
  
  const useCase = new GenerateConceptPageUseCase(
    markdownAdapter,
    frontmatterAdapter
  );

  const designPatternOptions: ConceptPageOptions = {
    name: 'Dependency Injection',
    explanation: 'A design pattern where objects receive their dependencies from external sources rather than creating them internally. This promotes loose coupling, testability, and flexibility in software design.',
    applications: [
      'Testing: Easily replace real dependencies with mocks or stubs',
      'Configuration: Swap implementations without changing consuming code',
      'Modularity: Create independent, reusable components',
      'Lifecycle management: Framework controls object creation and disposal'
    ],
    relatedConcepts: [
      'Inversion of Control',
      'Service Locator Pattern',
      'Constructor Injection',
      'Factory Pattern'
    ],
    examples: [
      'In Angular, services are injected into components through constructor parameters, allowing the framework to manage their lifecycle.',
      'NestJS uses decorators like `@Injectable()` to mark classes as injectable dependencies that can be provided to other classes.'
    ],
    tags: ['design-pattern', 'architecture', 'testing'],
    sources: ['martin-fowler-dependency-injection-2004'],
    created: '2024-01-20'
  };

  const result = useCase.execute(designPatternOptions);

  console.log('Generated Concept Page:');
  console.log('Filename:', result.filename);
  console.log('');
  console.log('Frontmatter:');
  console.log('  title:', result.frontmatter.title);
  console.log('  type:', result.frontmatter.type);
  console.log('  tags:', result.frontmatter.tags.join(', '));
  console.log('  created:', result.frontmatter.created);
  console.log('');
  console.log('Content Preview:');
  console.log(result.content);

  return result;
}

export function generateConceptPageWithMinimalOptions() {
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();
  
  const useCase = new GenerateConceptPageUseCase(
    markdownAdapter,
    frontmatterAdapter
  );

  const principleOptions: ConceptPageOptions = {
    name: 'Single Responsibility Principle',
    explanation: 'A class should have only one reason to change, meaning it should have only one job or responsibility.',
    tags: ['solid', 'principles', 'design']
  };

  const result = useCase.execute(principleOptions);

  console.log('Generated Minimal Concept Page:');
  console.log('Filename:', result.filename);
  console.log('');
  console.log('Content:');
  console.log(result.content);

  return result;
}

export function generateConceptPageForArchitecturalPrinciple() {
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();
  
  const useCase = new GenerateConceptPageUseCase(
    markdownAdapter,
    frontmatterAdapter
  );

  const principleOptions: ConceptPageOptions = {
    name: 'Progressive Enhancement',
    explanation: 'A web design strategy that emphasizes core content and functionality first, then progressively adds enhanced features for browsers that support them. This ensures basic usability for all users while providing richer experiences where possible.',
    applications: [
      'Accessibility: Core content remains available without JavaScript',
      'Performance: Basic functionality loads quickly on slow connections',
      'Resilience: Application degrades gracefully when features are unavailable',
      'SEO: Search engines can index content without executing JavaScript'
    ],
    relatedConcepts: [
      'Graceful Degradation',
      'Mobile First Design',
      'Web Accessibility',
      'Server-Side Rendering'
    ],
    examples: [
      'A form that submits via standard HTTP POST but enhances with AJAX submission when JavaScript is available.',
      'Navigation that works with anchor links but upgrades to client-side routing in single-page applications.',
      'Images that display with `<img>` tags but lazy-load with Intersection Observer API when supported.'
    ],
    tags: ['web-design', 'accessibility', 'performance', 'architecture'],
    sources: ['a-list-apart-progressive-enhancement-2003'],
    created: '2024-02-10'
  };

  const result = useCase.execute(principleOptions);

  return result;
}

export function generateConceptPageForDataStructure() {
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();
  
  const useCase = new GenerateConceptPageUseCase(
    markdownAdapter,
    frontmatterAdapter
  );

  const dataStructureOptions: ConceptPageOptions = {
    name: 'Reactive Streams',
    explanation: 'A programming paradigm for handling asynchronous data streams with non-blocking backpressure. It models data as streams of values that flow through operators, enabling declarative composition of asynchronous operations.',
    applications: [
      'Event handling: Process user interactions as streams',
      'API communication: Handle HTTP requests and responses reactively',
      'State management: Model application state as observable streams',
      'Real-time data: Process websocket connections and live updates'
    ],
    relatedConcepts: [
      'Observer Pattern',
      'Functional Programming',
      'Asynchronous Programming',
      'Event-Driven Architecture'
    ],
    examples: [
      'RxJS provides operators like `map`, `filter`, and `switchMap` to transform and combine observable streams.',
      'Angular uses observables for HTTP requests, form value changes, and router navigation events.'
    ],
    tags: ['programming-paradigm', 'async', 'reactive'],
    sources: ['rxjs-documentation-2024-01-10', 'reactive-manifesto-2014'],
    created: '2024-02-15'
  };

  const result = useCase.execute(dataStructureOptions);

  return result;
}
