#!/usr/bin/env node
/**
 * Close Concepts Initialization Script
 *
 * Generates 4 concept pages from the same domain (Web Accessibility) demonstrating
 * close relationships and high interconnection:
 * - Focus Management: Controlling keyboard focus within components
 * - Keyboard Navigation: Enabling keyboard-only interface interaction
 * - Screen Reader Support: Making content accessible to assistive technologies
 * - ARIA Attributes: Semantic HTML attributes for accessibility
 *
 * Run with: npm run init:close-concepts
 * or: node libs/wiki/examples/src/scripts/init-close-concepts.mjs
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import { getTargetWordCount, expandItemsArray, countWords } from './content-length-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = join(__dirname, '../../../../..');
const wikiDir = join(workspaceRoot, 'wiki');
const conceptsDir = join(wikiDir, 'concepts');

/**
 * Converts a title to a kebab-case filename
 */
function generateFilename(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '.md';
}

/**
 * Generates markdown content for a concept page
 */
function generateConceptPage(options) {
  const {
    name,
    explanation,
    principles = [],
    applications = [],
    relatedConcepts = [],
    examples = [],
    tags = [],
    sources = [],
  } = options;

  const today = new Date().toISOString().split('T')[0];
  
  const frontmatter = {
    title: name,
    type: 'concept',
    tags,
    ...(sources.length > 0 ? { sources } : {}),
    created: today,
    updated: today,
  };

  let content = '---\n';
  content += yaml.stringify(frontmatter);
  content += '---\n\n';
  content += `# ${name}\n\n`;
  content += `## Explanation\n\n${explanation}\n\n`;

  if (principles.length > 0) {
    content += `## Key Principles\n\n`;
    principles.forEach(principle => {
      content += `- ${principle}\n`;
    });
    content += '\n';
  }

  if (applications.length > 0) {
    content += `## Applications\n\n`;
    applications.forEach(app => {
      content += `- ${app}\n`;
    });
    content += '\n';
  }

  if (relatedConcepts.length > 0) {
    content += `## Related Concepts\n\n`;
    relatedConcepts.forEach(concept => {
      content += `- [[${concept}]]\n`;
    });
    content += '\n';
  }

  if (examples.length > 0) {
    content += `## Examples\n\n`;
    examples.forEach(example => {
      content += `${example}\n\n`;
    });
  }

  if (sources.length > 0) {
    content += `## References\n\n`;
    sources.forEach(source => {
      content += `- [[${source}]]\n`;
    });
    content += '\n';
  }

  return {
    content: content.trim() + '\n',
    filename: generateFilename(name),
  };
}

const CLOSE_CONCEPTS = [
  {
    name: 'Focus Management',
    explanation: 'Focus management involves controlling where keyboard focus is directed within a user interface, ensuring that users navigating with keyboards or assistive technologies can efficiently interact with interactive elements. Proper focus management prevents focus traps, maintains logical tab order, and provides visual indicators of the currently focused element.',
    principles: [
      'Focus should follow a logical reading order that matches visual layout',
      'Focus must be visible at all times with clear visual indicators',
      'Focus traps should be intentional (like modals) and escapable',
      'Programmatic focus changes must be announced to assistive technologies'
    ],
    applications: [
      'Modal dialogs that trap focus within the dialog until dismissed',
      'Skip links that allow keyboard users to bypass repetitive navigation',
      'Form validation that moves focus to the first error field',
      'Custom widgets like comboboxes that manage focus between input and options list'
    ],
    relatedConcepts: [
      'Keyboard Navigation',
      'Screen Reader Support',
      'ARIA Attributes'
    ],
    examples: [
      'When a modal dialog opens, focus moves to the first interactive element inside the modal, and Tab/Shift+Tab cycles only through elements within the modal until it is closed.',
      'A FocusTrap component wraps a modal and ensures focus cannot escape to background content by intercepting Tab key presses at the boundaries and looping focus back to the start or end.'
    ],
    tags: ['accessibility', 'web-development', 'user-experience']
  },
  {
    name: 'Keyboard Navigation',
    explanation: 'Keyboard navigation enables users to interact with web interfaces using only keyboard input, without relying on a mouse or other pointing device. This is essential for accessibility, as many users with motor impairments, vision impairments, or other disabilities rely exclusively on keyboard controls. Effective keyboard navigation requires proper tab order, keyboard shortcuts, and interactive element support.',
    principles: [
      'All interactive elements must be reachable via keyboard',
      'Tab order should follow a logical sequence matching visual layout',
      'Standard keyboard shortcuts should behave predictably (Enter, Space, Escape, Arrow keys)',
      'Custom keyboard shortcuts should not conflict with browser or assistive technology shortcuts'
    ],
    applications: [
      'Navigation menus that can be operated entirely with Tab, Enter, and Arrow keys',
      'Data grids where Arrow keys navigate cells and Enter activates cell editing',
      'Autocomplete widgets where Arrow keys select suggestions and Enter confirms',
      'Toolbars where Arrow keys move between buttons and Enter activates them'
    ],
    relatedConcepts: [
      'Focus Management',
      'ARIA Attributes',
      'Screen Reader Support'
    ],
    examples: [
      'A dropdown menu opens with Space or Enter, Arrow keys navigate menu items, Enter selects an item, and Escape closes the menu without selection.',
      'A listbox supports Arrow Up/Down to highlight options, Home/End to jump to first/last option, and Space to toggle selection in multi-select mode.'
    ],
    tags: ['accessibility', 'web-development', 'user-experience']
  },
  {
    name: 'Screen Reader Support',
    explanation: 'Screen reader support ensures that web content is accessible to blind and low-vision users who rely on assistive technologies that read page content aloud or output it to a refreshable Braille display. Supporting screen readers requires semantic HTML, ARIA attributes, proper labeling, and announcements of dynamic content changes. Screen readers interpret the accessibility tree constructed from HTML and ARIA to provide a non-visual representation of the interface.',
    principles: [
      'Use semantic HTML elements to convey meaning and structure',
      'Provide text alternatives for non-text content like images and icons',
      'Announce dynamic content changes with ARIA live regions',
      'Ensure all interactive elements have accessible names and roles'
    ],
    applications: [
      'Image alt text that describes the content and purpose of images',
      'Live regions that announce form validation errors without moving focus',
      'Landmark roles that allow quick navigation to page regions',
      'Button labels that clearly describe the action they perform'
    ],
    relatedConcepts: [
      'ARIA Attributes',
      'Focus Management',
      'Keyboard Navigation'
    ],
    examples: [
      'An icon-only button includes aria-label="Delete" so screen readers announce "Delete button" instead of just "button".',
      'A status message <div role="status" aria-live="polite">Item added to cart</div> is announced by screen readers without interrupting the user\'s current task.'
    ],
    tags: ['accessibility', 'web-development', 'assistive-technology']
  },
  {
    name: 'ARIA Attributes',
    explanation: 'ARIA (Accessible Rich Internet Applications) attributes are a set of HTML attributes that provide semantic information to assistive technologies when native HTML elements are insufficient. ARIA roles define what an element is (button, menu, dialog), ARIA properties describe characteristics (required, disabled, expanded), and ARIA states convey dynamic changes (checked, selected, hidden). ARIA enhances accessibility but should be used as a supplement to semantic HTML, not a replacement.',
    principles: [
      'Prefer semantic HTML over ARIA when possible (button element vs div with role="button")',
      'ARIA does not change browser behavior, only affects assistive technology interpretation',
      'ARIA roles must match the actual behavior and keyboard interactions of the element',
      'ARIA state and property values must be kept synchronized with actual element state'
    ],
    applications: [
      'role="dialog" with aria-modal="true" to identify modal dialogs',
      'aria-expanded to indicate whether a collapsible section is open or closed',
      'aria-describedby to associate help text or error messages with form inputs',
      'role="tablist", role="tab", and role="tabpanel" to create accessible tab interfaces'
    ],
    relatedConcepts: [
      'Screen Reader Support',
      'Keyboard Navigation',
      'Focus Management'
    ],
    examples: [
      'A custom checkbox uses <div role="checkbox" aria-checked="true" tabindex="0"> and JavaScript to toggle aria-checked when Space is pressed.',
      'A button that controls a collapsible panel uses aria-expanded="false" initially, then updates to aria-expanded="true" when the panel is shown.'
    ],
    tags: ['accessibility', 'web-development', 'html', 'standards']
  }
];

async function main() {
  console.log('Close Concepts (Web Accessibility) Initialization');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Ensure concepts directory exists
  if (!existsSync(conceptsDir)) {
    mkdirSync(conceptsDir, { recursive: true });
  }

  let successCount = 0;
  let errorCount = 0;

  for (const conceptOptions of CLOSE_CONCEPTS) {
    try {
      const result = generateConceptPage(conceptOptions);
      const outputPath = join(conceptsDir, result.filename);
      writeFileSync(outputPath, result.content, 'utf-8');
      console.log(`✓ Created: wiki/concepts/${result.filename}`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to create ${conceptOptions.name}:`, error.message);
      errorCount++;
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Created:  ${successCount} concepts`);
  if (errorCount > 0) {
    console.log(`Failed:   ${errorCount} concepts`);
    console.error('\nCompleted with errors');
    process.exit(1);
  } else {
    console.log('\n✓ Successfully created all close concepts');
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
