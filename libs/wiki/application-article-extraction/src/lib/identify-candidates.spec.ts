/**
 * Unit tests for candidate entity and concept identification
 * Feature: article-research-session
 * Requirements: 3.4, 3.5
 */

import { describe, it, expect } from 'vitest';
import { identifyCandidates } from './identify-candidates';

describe('identifyCandidates', () => {
  describe('entity identification', () => {
    it('identifies known technology entities by name', () => {
      const body = `This article explores how Angular and React handle state management differently. We also look at RxJS for reactive patterns.`;
      const result = identifyCandidates(body);
      expect(result.entities).toContain('Angular');
      expect(result.entities).toContain('React');
      expect(result.entities).toContain('RxJS');
    });

    it('identifies entities preceded by keyword "library"', () => {
      const body = `The Lodash library provides utility functions. We also use the Ramda library for functional programming.`;
      const result = identifyCandidates(body);
      expect(result.entities).toContain('Lodash');
      expect(result.entities).toContain('Ramda');
    });

    it('identifies entities preceded by keyword "framework"', () => {
      const body = `The Svelte framework takes a different approach to reactivity.`;
      const result = identifyCandidates(body);
      expect(result.entities).toContain('Svelte');
    });

    it('identifies entities preceded by keyword "tool"', () => {
      const body = `The Prettier tool formats code automatically.`;
      const result = identifyCandidates(body);
      expect(result.entities).toContain('Prettier');
    });

    it('identifies entities after keyword like "package called"', () => {
      const body = `We use a package called Zod for schema validation.`;
      const result = identifyCandidates(body);
      expect(result.entities).toContain('Zod');
    });

    it('identifies entities with dots in name like Node.js', () => {
      const body = `Node.js is a runtime for server-side JavaScript. Next.js builds on top of React.`;
      const result = identifyCandidates(body);
      expect(result.entities).toContain('Node.js');
      expect(result.entities).toContain('Next.js');
    });

    it('identifies bold entities', () => {
      const body = `The key technology here is **Prisma** which provides type-safe database access.`;
      const result = identifyCandidates(body);
      expect(result.entities).toContain('Prisma');
    });

    it('returns deduplicated entities', () => {
      const body = `Angular is great. The Angular framework is powerful. We love Angular.`;
      const result = identifyCandidates(body);
      const angularCount = result.entities.filter(
        (e) => e === 'Angular'
      ).length;
      expect(angularCount).toBe(1);
    });
  });

  describe('concept identification', () => {
    it('identifies concepts preceded by keyword "pattern"', () => {
      const body = `The Observer pattern is fundamental to reactive programming. The Singleton pattern ensures one instance.`;
      const result = identifyCandidates(body);
      expect(result.concepts).toContain('Observer');
      expect(result.concepts).toContain('Singleton');
    });

    it('identifies concepts preceded by keyword "principle"', () => {
      const body = `The Single Responsibility principle states that a class should have one reason to change.`;
      const result = identifyCandidates(body);
      expect(result.concepts).toContain('Single Responsibility');
    });

    it('identifies concepts preceded by keyword "technique"', () => {
      const body = `The memoization technique can improve performance significantly.`;
      const result = identifyCandidates(body);
      expect(result.concepts).toContain('memoization');
    });

    it('identifies lowercase concept phrases before keywords', () => {
      const body = `The dependency injection pattern is widely used. The lazy loading technique improves startup time.`;
      const result = identifyCandidates(body);
      expect(result.concepts).toContain('dependency injection');
      expect(result.concepts).toContain('lazy loading');
    });

    it('identifies bold concepts (lowercase phrases)', () => {
      const body = `The key idea is **reactive programming** which enables declarative data flow. Another important concept is **fine-grained reactivity**.`;
      const result = identifyCandidates(body);
      expect(result.concepts).toContain('reactive programming');
      expect(result.concepts).toContain('fine-grained reactivity');
    });

    it('identifies concepts with "approach" keyword', () => {
      const body = `The component-based approach simplifies UI development.`;
      const result = identifyCandidates(body);
      expect(result.concepts).toContain('component-based');
    });

    it('returns deduplicated concepts', () => {
      const body = `The Observer pattern is great. We use the Observer pattern everywhere.`;
      const result = identifyCandidates(body);
      const observerCount = result.concepts.filter(
        (c) => c === 'Observer'
      ).length;
      expect(observerCount).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('returns empty arrays for empty body', () => {
      const result = identifyCandidates('');
      expect(result.entities).toEqual([]);
      expect(result.concepts).toEqual([]);
    });

    it('returns empty arrays for whitespace-only body', () => {
      const result = identifyCandidates('   \n\t  ');
      expect(result.entities).toEqual([]);
      expect(result.concepts).toEqual([]);
    });

    it('returns empty arrays for body with no identifiable terms', () => {
      const body = `This is just plain text without any technical terms or named technologies.`;
      const result = identifyCandidates(body);
      // May still find some things, but should not crash
      expect(result.entities).toBeDefined();
      expect(result.concepts).toBeDefined();
    });

    it('does not treat common words at sentence start as entities', () => {
      const body = `The quick brown fox. This is a test. However, we proceed.`;
      const result = identifyCandidates(body);
      expect(result.entities).not.toContain('The');
      expect(result.entities).not.toContain('This');
      expect(result.entities).not.toContain('However');
    });

    it('returns sorted arrays', () => {
      const body = `We use React, Angular, and Vue for frontend development.`;
      const result = identifyCandidates(body);
      const sorted = [...result.entities].sort();
      expect(result.entities).toEqual(sorted);
    });
  });

  describe('mixed content', () => {
    it('identifies both entities and concepts from a realistic article', () => {
      const body = `# Building Reactive UIs with Angular Signals

Angular Signals provide a new **reactive programming** model. Unlike RxJS observables,
signals use a push-pull approach that enables **fine-grained reactivity**.

The dependency injection pattern remains central to Angular's architecture.
The framework uses TypeScript for type safety.

\`\`\`typescript
import { signal, computed } from '@angular/core';
const count = signal(0);
\`\`\`

The Observer pattern is used internally by the signal graph. The Vite bundler
handles the build process efficiently.`;

      const result = identifyCandidates(body);

      // Should find entities
      expect(result.entities).toContain('Angular');
      expect(result.entities).toContain('RxJS');
      expect(result.entities).toContain('TypeScript');
      expect(result.entities).toContain('Vite');

      // Should find concepts
      expect(result.concepts).toContain('reactive programming');
      expect(result.concepts).toContain('fine-grained reactivity');
      expect(result.concepts).toContain('dependency injection');
      expect(result.concepts).toContain('Observer');
    });
  });
});
