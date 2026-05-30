/**
 * Candidate entity and concept identification for the Content_Extractor subsystem
 * Feature: article-research-session
 * Requirements: 3.4, 3.5
 *
 * Identifies candidate entities (named libraries, tools, APIs, components)
 * and candidate concepts (named patterns, principles, techniques) from
 * article body text using heuristic pattern matching.
 */

/**
 * Keywords that precede entity names in article text.
 * When these words appear before a capitalized term, the term is likely an entity.
 */
const ENTITY_KEYWORDS = [
  'library',
  'framework',
  'tool',
  'api',
  'component',
  'package',
  'module',
  'plugin',
  'sdk',
  'cli',
  'platform',
  'runtime',
  'engine',
  'compiler',
  'bundler',
  'linter',
  'service',
];

/**
 * Keywords that precede concept names in article text.
 * When these words appear before a term, the term is likely a concept.
 */
const CONCEPT_KEYWORDS = [
  'pattern',
  'principle',
  'technique',
  'approach',
  'methodology',
  'paradigm',
  'architecture',
  'strategy',
  'design pattern',
  'anti-pattern',
  'best practice',
  'practice',
  'method',
  'model',
  'concept',
];

/**
 * Well-known technology entities that should be recognized by name alone.
 * These are common libraries, frameworks, tools, and platforms that appear
 * frequently in technical articles.
 */
const KNOWN_ENTITIES = [
  'Angular',
  'React',
  'Vue',
  'Svelte',
  'Next.js',
  'Nuxt',
  'Remix',
  'Astro',
  'SolidJS',
  'Preact',
  'Ember',
  'Backbone',
  'jQuery',
  'Node.js',
  'Deno',
  'Bun',
  'TypeScript',
  'JavaScript',
  'RxJS',
  'NgRx',
  'Redux',
  'MobX',
  'Zustand',
  'Jotai',
  'Recoil',
  'Vite',
  'Webpack',
  'Rollup',
  'esbuild',
  'Parcel',
  'Turbopack',
  'Babel',
  'SWC',
  'ESLint',
  'Prettier',
  'Jest',
  'Vitest',
  'Cypress',
  'Playwright',
  'Storybook',
  'Tailwind CSS',
  'Bootstrap',
  'Material UI',
  'Chakra UI',
  'Docker',
  'Kubernetes',
  'Terraform',
  'AWS',
  'Azure',
  'GCP',
  'Firebase',
  'Supabase',
  'PostgreSQL',
  'MongoDB',
  'Redis',
  'GraphQL',
  'REST',
  'gRPC',
  'Express',
  'Fastify',
  'NestJS',
  'Spring Boot',
  'Django',
  'Flask',
  'Rails',
  'Laravel',
  'Prisma',
  'Drizzle',
  'Sequelize',
  'Git',
  'GitHub',
  'GitLab',
  'npm',
  'yarn',
  'pnpm',
  'Nx',
  'Turborepo',
  'Lerna',
  'Sass',
  'Less',
  'PostCSS',
  'Zod',
  'Yup',
  'Ajv',
];

/**
 * Identifies candidate entities and concepts from article body text.
 *
 * Uses three heuristic strategies:
 * 1. Keyword-preceded terms: "the X library", "Y framework", "Z pattern"
 * 2. Known entity recognition: matches against a list of well-known tech names
 * 3. Bold text extraction: **Term** often indicates important named things
 *
 * @param body - The article body text to analyze
 * @returns Object with deduplicated arrays of entity and concept names
 */
export function identifyCandidates(body: string): {
  entities: string[];
  concepts: string[];
} {
  if (!body || body.trim().length === 0) {
    return { entities: [], concepts: [] };
  }

  const entitySet = new Set<string>();
  const conceptSet = new Set<string>();

  // Strategy 1: Keyword-preceded entity identification
  identifyKeywordPreceded(body, ENTITY_KEYWORDS, entitySet);

  // Strategy 2: Keyword-preceded concept identification
  identifyKeywordPreceded(body, CONCEPT_KEYWORDS, conceptSet);

  // Strategy 3: Known entity recognition
  identifyKnownEntities(body, entitySet);

  // Strategy 4: Bold text extraction (heuristic classification)
  identifyBoldTerms(body, entitySet, conceptSet);

  // Convert sets to sorted, deduplicated arrays
  return {
    entities: [...entitySet].sort(),
    concepts: [...conceptSet].sort(),
  };
}

/**
 * Identifies terms preceded by specific keywords.
 * Matches patterns like "the Angular framework" or "reactive programming pattern".
 *
 * For entity keywords: captures the capitalized term(s) AFTER the keyword
 *   e.g., "the React library" → "React"
 *
 * For concept keywords: captures the term(s) BEFORE the keyword
 *   e.g., "dependency injection pattern" → "dependency injection"
 */
function identifyKeywordPreceded(
  body: string,
  keywords: string[],
  resultSet: Set<string>
): void {
  for (const keyword of keywords) {
    // Pattern: [optional article] + Capitalized term(s) + keyword
    // e.g., "The Lodash library", "The Single Responsibility principle"
    // The non-capturing group for articles ensures "The" is not part of the captured term
    const beforePattern = new RegExp(
      `(?:^|[.!?]\\s+|,\\s+|;\\s+|\\b(?:the|a|an|use|using|with)\\s+)([A-Z][a-zA-Z]*(?:[\\s-][A-Za-z]+){0,3})\\s+${escapeRegex(keyword)}\\b`,
      'gi'
    );
    let match: RegExpExecArray | null;
    while ((match = beforePattern.exec(body)) !== null) {
      let term = match[1].trim();
      // Strip any leading articles that slipped through
      term = term.replace(/^(?:the|a|an)\s+/i, '');
      if (term.length > 0 && isValidCandidate(term)) {
        resultSet.add(normalizeCandidate(term));
      }
    }

    // Pattern: keyword followed by term(s)
    // e.g., "library called Lodash", "framework Angular"
    const afterPattern = new RegExp(
      `\\b${escapeRegex(keyword)}\\s+(?:called\\s+|named\\s+|like\\s+)?([A-Z][a-zA-Z]*(?:[\\s.-][A-Za-z]+){0,3})\\b`,
      'g'
    );
    while ((match = afterPattern.exec(body)) !== null) {
      const term = match[1].trim();
      if (isValidCandidate(term)) {
        resultSet.add(normalizeCandidate(term));
      }
    }

    // Pattern for lowercase concept terms before keyword
    // e.g., "dependency injection pattern", "lazy loading technique"
    if (CONCEPT_KEYWORDS.includes(keyword)) {
      const lowerBeforePattern = new RegExp(
        `(?:^|[.!?]\\s+|,\\s+|;\\s+|\\b(?:the|a|an)\\s+)([a-z][a-z]+(?:[\\s-][a-z]+){0,3})\\s+${escapeRegex(keyword)}\\b`,
        'gi'
      );
      while ((match = lowerBeforePattern.exec(body)) !== null) {
        let term = match[1].trim();
        term = term.replace(/^(?:the|a|an)\s+/i, '');
        if (term.length > 0 && isValidConceptCandidate(term)) {
          resultSet.add(normalizeCandidate(term));
        }
      }
    }
  }
}

/**
 * Identifies known technology entities by scanning the body for their names.
 * Uses word boundary matching to avoid false positives.
 */
function identifyKnownEntities(body: string, entitySet: Set<string>): void {
  for (const entity of KNOWN_ENTITIES) {
    // Use word boundary for most entities, special handling for names with dots/special chars
    const escapedEntity = escapeRegex(entity);
    const pattern = new RegExp(`\\b${escapedEntity}\\b`, 'g');
    if (pattern.test(body)) {
      entitySet.add(entity);
    }
  }
}

/**
 * Identifies bold terms (**Term**) from the article body.
 * Bold terms are classified as entities if they look like proper nouns (capitalized)
 * or as concepts if they look like descriptive phrases (lowercase).
 */
function identifyBoldTerms(
  body: string,
  entitySet: Set<string>,
  conceptSet: Set<string>
): void {
  const boldPattern = /\*\*([^*]+)\*\*/g;
  let match: RegExpExecArray | null;

  while ((match = boldPattern.exec(body)) !== null) {
    const term = match[1].trim();

    // Skip terms that are too short or too long
    if (term.length < 2 || term.length > 60) continue;

    // Skip terms that look like sentences (contain common sentence patterns)
    if (term.includes(':') || term.split(' ').length > 5) continue;

    // Classify: capitalized terms → entities, lowercase phrases → concepts
    if (/^[A-Z]/.test(term) && !isCommonWord(term)) {
      entitySet.add(normalizeCandidate(term));
    } else if (/^[a-z]/.test(term) && isValidConceptCandidate(term)) {
      conceptSet.add(normalizeCandidate(term));
    }
  }
}

/**
 * Validates that a candidate term is meaningful enough to include.
 */
function isValidCandidate(term: string): boolean {
  // Must be at least 2 characters
  if (term.length < 2) return false;
  // Must not be a common English word that happens to be capitalized
  if (isCommonWord(term)) return false;
  // Must not be just whitespace
  if (term.trim().length === 0) return false;
  return true;
}

/**
 * Validates that a lowercase term is a valid concept candidate.
 */
function isValidConceptCandidate(term: string): boolean {
  if (term.length < 3) return false;
  if (term.trim().length === 0) return false;
  // Filter out very common words that aren't concepts
  if (STOP_WORDS.has(term.toLowerCase())) return false;
  return true;
}

/**
 * Normalizes a candidate term by trimming and collapsing whitespace.
 */
function normalizeCandidate(term: string): string {
  return term.trim().replace(/\s+/g, ' ');
}

/**
 * Checks if a term is a common English word that shouldn't be treated as an entity.
 */
function isCommonWord(term: string): boolean {
  return COMMON_WORDS.has(term.toLowerCase());
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Common English words that should not be treated as entities even when capitalized
 * (e.g., at the start of a sentence).
 */
const COMMON_WORDS = new Set([
  'the',
  'this',
  'that',
  'these',
  'those',
  'here',
  'there',
  'where',
  'when',
  'what',
  'which',
  'who',
  'how',
  'why',
  'all',
  'each',
  'every',
  'both',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'only',
  'same',
  'than',
  'also',
  'very',
  'just',
  'because',
  'but',
  'and',
  'for',
  'not',
  'with',
  'from',
  'into',
  'about',
  'between',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'since',
  'until',
  'while',
  'although',
  'however',
  'therefore',
  'furthermore',
  'moreover',
  'nevertheless',
  'note',
  'important',
  'example',
  'first',
  'second',
  'third',
  'next',
  'last',
  'new',
  'old',
  'good',
  'bad',
  'great',
  'small',
  'large',
  'long',
  'short',
  'high',
  'low',
  'many',
  'much',
  'well',
  'still',
  'already',
  'always',
  'never',
  'often',
  'sometimes',
  'usually',
  'now',
  'then',
  'today',
  'tomorrow',
  'yesterday',
  'see',
  'use',
  'make',
  'take',
  'get',
  'let',
  'say',
  'know',
  'think',
  'come',
  'want',
  'look',
  'give',
  'find',
  'tell',
  'ask',
  'work',
  'call',
  'try',
  'need',
  'feel',
  'become',
  'leave',
  'put',
  'mean',
  'keep',
  'begin',
  'seem',
  'help',
  'show',
  'hear',
  'play',
  'run',
  'move',
  'live',
  'believe',
  'hold',
  'bring',
  'happen',
  'write',
  'provide',
  'sit',
  'stand',
  'lose',
  'pay',
  'meet',
  'include',
  'continue',
  'set',
  'learn',
  'change',
  'lead',
  'understand',
  'watch',
  'follow',
  'stop',
  'create',
  'speak',
  'read',
  'allow',
  'add',
  'spend',
  'grow',
  'open',
  'walk',
  'win',
  'offer',
  'remember',
  'love',
  'consider',
  'appear',
  'buy',
  'wait',
  'serve',
  'die',
  'send',
  'expect',
  'build',
  'stay',
  'fall',
  'cut',
  'reach',
  'kill',
  'remain',
  'summary',
  'conclusion',
  'introduction',
  'overview',
  'background',
  'references',
  'section',
  'chapter',
  'figure',
  'table',
]);

/**
 * Stop words that should not be treated as concept candidates.
 */
const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'shall',
  'can',
  'it',
  'its',
  'this',
  'that',
  'these',
  'those',
  'i',
  'you',
  'he',
  'she',
  'we',
  'they',
  'me',
  'him',
  'her',
  'us',
  'them',
  'my',
  'your',
  'his',
  'our',
  'their',
  'and',
  'or',
  'but',
  'not',
  'so',
  'if',
  'then',
  'else',
  'when',
  'where',
  'how',
  'what',
  'which',
  'who',
  'whom',
  'why',
  'all',
  'each',
  'every',
  'both',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'no',
  'nor',
  'too',
  'very',
  'just',
  'also',
  'than',
  'of',
  'in',
  'on',
  'at',
  'to',
  'for',
  'with',
  'from',
  'by',
  'about',
  'as',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'between',
  'under',
  'over',
  'out',
  'up',
  'down',
  'off',
  'here',
  'there',
  'now',
  'then',
  'once',
  'only',
  'same',
  'own',
  'still',
  'already',
  'even',
]);
