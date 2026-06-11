/**
 * Content Length Distribution Utilities
 * 
 * Provides functions to generate content with specific word count ranges
 * to satisfy requirement 8.9: content length distribution.
 * 
 * Distribution target:
 * - 30% of pages: 100-200 words
 * - 30% of pages: 200-400 words
 * - 30% of pages: 400-800 words
 */

/**
 * Expands text content to reach a target word count range
 * @param {string} baseText - The base text content
 * @param {number} minWords - Minimum word count
 * @param {number} maxWords - Maximum word count
 * @param {string} expansionType - Type of expansion ('properties'|'examples'|'principles'|'keypoints')
 * @returns {string} Expanded text
 */
export function expandToWordCount(baseText, minWords, maxWords, expansionType = 'general') {
  const currentWords = countWords(baseText);
  
  if (currentWords >= minWords && currentWords <= maxWords) {
    return baseText;
  }
  
  if (currentWords >= maxWords) {
    // Already within or above range, return as-is
    return baseText;
  }
  
  // Need to expand
  const targetWords = Math.floor((minWords + maxWords) / 2);
  const wordsNeeded = targetWords - currentWords;
  
  const expansionText = generateExpansionText(wordsNeeded, expansionType);
  return baseText + '\n\n' + expansionText;
}

/**
 * Counts words in a text string
 * @param {string} text - Text to count words in
 * @returns {number} Word count
 */
export function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Generates expansion text based on type and word count needed
 * @param {number} wordsNeeded - Number of words to generate
 * @param {string} type - Type of expansion
 * @returns {string} Generated expansion text
 */
function generateExpansionText(wordsNeeded, type) {
  const expansions = {
    properties: [
      'The architecture emphasizes modularity and separation of concerns, allowing developers to organize code into distinct, manageable units that can be independently developed, tested, and maintained.',
      'Built-in tooling support includes development servers, build optimization, code splitting, and bundling capabilities that streamline the development workflow and improve production performance.',
      'The ecosystem provides extensive plugin and extension systems, enabling developers to customize and extend functionality according to specific project requirements and use cases.',
      'Type safety and static analysis capabilities help catch errors during development, reducing runtime bugs and improving code quality through compile-time validation and intelligent code completion.',
      'Performance optimization features include lazy loading, tree shaking, code splitting, and runtime performance monitoring to ensure applications remain fast and responsive even as they scale.',
      'Developer experience enhancements include hot module replacement, fast refresh, detailed error messages, and debugging tools that accelerate development and reduce time spent troubleshooting.',
      'The documentation includes comprehensive guides, API references, tutorials, and real-world examples that help developers quickly understand concepts and implement solutions effectively.',
      'Community support spans forums, chat platforms, conference presentations, blog posts, and video tutorials, providing multiple channels for learning and problem-solving.',
      'Testing utilities and frameworks integrate seamlessly, offering unit testing, integration testing, end-to-end testing capabilities with mocking, stubbing, and assertion libraries.',
      'Backward compatibility considerations and migration guides help teams upgrade to newer versions while minimizing breaking changes and maintaining existing functionality.',
    ],
    examples: [
      'Advanced patterns demonstrate how to structure complex applications using proven architectural approaches that scale well as codebases grow and requirements evolve over time.',
      'Real-world use cases showcase implementations in production environments, highlighting best practices, common pitfalls to avoid, and optimization strategies that improve application performance.',
      'Integration examples illustrate how to connect with third-party services, APIs, databases, and other systems, demonstrating authentication flows, data synchronization, and error handling patterns.',
      'Performance benchmarks compare different implementation approaches, showing memory usage, execution time, bundle size impact, and runtime characteristics across various scenarios.',
      'Accessibility implementations ensure applications work with screen readers, keyboard navigation, focus management, and ARIA attributes, making content available to users with diverse abilities.',
      'State management patterns show how to handle application state reactively, with predictable updates, time-travel debugging, and clear data flow from sources to UI components.',
      'Form handling approaches demonstrate validation, error display, submission handling, field dependencies, and dynamic form generation based on schemas or runtime conditions.',
      'Routing configurations illustrate navigation management, route guards, lazy loading strategies, nested routes, and deep linking support for single-page applications.',
      'Animation and transition effects enhance user experience through smooth visual feedback, loading states, page transitions, and micro-interactions that communicate system status.',
      'Error boundary implementations provide graceful degradation when unexpected errors occur, displaying user-friendly messages while logging detailed diagnostic information for developers.',
    ],
    principles: [
      'Separation of concerns advocates for dividing functionality into distinct layers, with clear responsibilities and minimal coupling between components, promoting maintainability and testability.',
      'Composition over inheritance encourages building complex functionality by combining simpler, reusable pieces rather than creating deep class hierarchies that become difficult to understand and modify.',
      'Single responsibility principle states that each module, class, or function should have one clear purpose, making code easier to understand, test, and modify without unintended side effects.',
      'Open-closed principle suggests that software entities should be open for extension but closed for modification, allowing new functionality to be added without changing existing code.',
      'Dependency inversion emphasizes depending on abstractions rather than concrete implementations, enabling flexible architecture that adapts to changing requirements and facilitates testing.',
      'Interface segregation promotes creating focused, specific interfaces rather than large, general-purpose ones, preventing clients from depending on methods they do not use.',
      'Least knowledge principle encourages components to interact only with closely related components, reducing coupling and dependencies across the system architecture.',
      'Convention over configuration reduces the number of decisions developers must make by providing sensible defaults while still allowing customization when needed.',
      'Declarative programming expresses the logic of computation without describing its control flow, making code more readable and easier to reason about.',
      'Progressive enhancement builds core functionality first, then adds enhanced features for environments that support them, ensuring basic usability for all users.',
    ],
    keypoints: [
      'The approach emphasizes developer productivity through intuitive APIs, clear documentation, helpful error messages, and tooling that automates repetitive tasks and catches common mistakes early.',
      'Performance considerations include optimizing bundle sizes through tree shaking and code splitting, minimizing runtime overhead, and leveraging browser caching strategies effectively.',
      'Security features protect against common vulnerabilities like cross-site scripting, SQL injection, and cross-site request forgery through input sanitization and output encoding.',
      'Scalability characteristics enable applications to handle growing user bases, increasing data volumes, and evolving feature requirements without requiring complete architectural rewrites.',
      'Maintainability benefits from consistent code organization, comprehensive testing coverage, clear separation of concerns, and documentation that explains both what code does and why.',
      'Accessibility compliance ensures interfaces work with assistive technologies, follow WCAG guidelines, provide keyboard navigation, and include appropriate ARIA labels for dynamic content.',
      'Internationalization support facilitates translating applications into multiple languages, handling different locales, date formats, number formats, and right-to-left text layouts.',
      'Browser compatibility targets ensure functionality works consistently across modern browsers while providing graceful degradation for older versions that lack certain features.',
      'Mobile responsiveness adapts layouts, interactions, and performance characteristics to work well on devices with varying screen sizes, input methods, and network conditions.',
      'Debugging capabilities include detailed error messages, source maps for production code, performance profiling tools, and integration with browser developer tools.',
    ],
    general: [
      'Additional context and background information helps developers understand the motivation behind design decisions, historical evolution, and future roadmap of the technology.',
      'Best practices and recommended patterns emerge from community experience, documenting approaches that have proven effective in real-world production environments.',
      'Common pitfalls and anti-patterns highlight mistakes to avoid, explaining why certain approaches seem appealing but lead to maintenance problems or performance issues.',
      'Migration strategies provide guidance for adopting new technologies incrementally, minimizing risk and disruption while modernizing existing systems.',
      'Ecosystem integration demonstrates how technologies work together, sharing data and functionality while maintaining clear boundaries and responsibilities.',
    ],
  };
  
  const pool = expansions[type] || expansions.general;
  let result = '';
  let wordCount = 0;
  let index = 0;
  
  while (wordCount < wordsNeeded && index < pool.length) {
    const sentence = pool[index];
    result += (result ? ' ' : '') + sentence;
    wordCount = countWords(result);
    index++;
  }
  
  // If we still need more words, cycle through again
  if (wordCount < wordsNeeded) {
    const additionalText = pool.slice(0, Math.ceil(pool.length / 2)).join(' ');
    result += ' ' + additionalText;
  }
  
  return result;
}

/**
 * Determines target word count range for a page based on distribution strategy
 * @param {number} pageIndex - Index of the page (0-based)
 * @param {number} totalPages - Total number of pages
 * @returns {{min: number, max: number}} Word count range
 */
export function getTargetWordCount(pageIndex, totalPages) {
  // Distribution: 30% short (100-200), 30% medium (200-400), 30% long (400-800), 10% variable
  const shortCount = Math.ceil(totalPages * 0.3);
  const mediumCount = Math.ceil(totalPages * 0.3);
  const longCount = Math.ceil(totalPages * 0.3);
  
  if (pageIndex < shortCount) {
    return { min: 100, max: 200 };
  } else if (pageIndex < shortCount + mediumCount) {
    return { min: 200, max: 400 };
  } else if (pageIndex < shortCount + mediumCount + longCount) {
    return { min: 400, max: 800 };
  } else {
    // Remaining 10% - use medium length as default
    return { min: 200, max: 400 };
  }
}

/**
 * Expands an array of items (properties, examples, etc.) to meet word count target
 * @param {string[]} items - Array of text items
 * @param {number} targetMin - Minimum total word count
 * @param {number} targetMax - Maximum total word count
 * @param {string} expansionType - Type of expansion
 * @returns {string[]} Expanded array of items
 */
export function expandItemsArray(items, targetMin, targetMax, expansionType = 'general') {
  const currentTotal = items.join(' ').split(/\s+/).filter(w => w.length > 0).length;
  
  if (currentTotal >= targetMin && currentTotal <= targetMax) {
    return items;
  }
  
  if (currentTotal >= targetMax) {
    return items;
  }
  
  // Need to expand
  const expanded = [...items];
  const wordsNeeded = Math.floor((targetMin + targetMax) / 2) - currentTotal;
  
  // Add detailed sentences to existing items
  const expansionText = generateExpansionText(wordsNeeded, expansionType);
  const expansionSentences = expansionText.split(/\.\s+/).filter(s => s.length > 0);
  
  expansionSentences.forEach((sentence, idx) => {
    if (idx < expanded.length) {
      expanded[idx] = expanded[idx] + '. ' + sentence + '.';
    } else {
      expanded.push(sentence + '.');
    }
  });
  
  return expanded;
}
