#!/usr/bin/env node
/**
 * Cross-Domain Initialization Script
 *
 * Generates entities and concepts spanning 3 distinct domains:
 * - Web Development (2 entities, 2 concepts)
 * - Data Science (2 entities, 2 concepts)
 * - Infrastructure (2 entities, 2 concepts)
 *
 * Includes minimum 3 cross-domain WikiLink references demonstrating
 * interconnections between different knowledge areas.
 *
 * Run with: npm run init:cross-domain
 * or: node libs/wiki/examples/src/scripts/init-cross-domain.mjs
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
const entitiesDir = join(wikiDir, 'entities');
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
 * Generates markdown content for an entity page
 */
function generateEntityPage(options) {
  const {
    name,
    definition,
    properties = [],
    relationships = [],
    examples = [],
    tags = [],
    sources = [],
  } = options;

  const today = new Date().toISOString().split('T')[0];
  
  const frontmatter = {
    title: name,
    type: 'entity',
    tags,
    ...(sources.length > 0 ? { sources } : {}),
    created: today,
    updated: today,
  };

  let content = '---\n';
  content += yaml.stringify(frontmatter);
  content += '---\n\n';
  content += `# ${name}\n\n`;
  content += `## Definition\n\n${definition}\n\n`;

  if (properties.length > 0) {
    content += `## Properties\n\n`;
    properties.forEach(prop => {
      content += `- ${prop}\n`;
    });
    content += '\n';
  }

  if (relationships.length > 0) {
    content += `## Relationships\n\n`;
    relationships.forEach(rel => {
      content += `- ${rel.description} [[${rel.target}]]\n`;
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

// ============================================================================
// Domain: Web Development
// ============================================================================

const WEB_DEVELOPMENT_ENTITIES = [
  {
    name: 'Webpack',
    definition: 'A static module bundler for modern JavaScript applications that processes and bundles assets for deployment',
    properties: [
      'Module bundling with dependency resolution',
      'Code splitting for optimized loading',
      'Loaders for transforming non-JavaScript assets',
      'Plugin system for extending functionality'
    ],
    relationships: [
      { target: 'Build Automation', description: 'Implements' },
      { target: 'Module Bundling', description: 'Provides' },
      { target: 'Data Pipeline Orchestration', description: 'Shares concepts with' }
    ],
    examples: [
      'webpack.config.js defines entry points, output paths, and loader rules for asset transformation',
      'Code splitting with dynamic imports reduces initial bundle size by loading modules on demand'
    ],
    tags: ['web-development', 'build-tool', 'bundler', 'javascript']
  },
  {
    name: 'Storybook',
    definition: 'An open-source tool for building UI components and pages in isolation, enabling component-driven development',
    properties: [
      'Isolated component development environment',
      'Interactive component documentation',
      'Visual testing capabilities',
      'Supports multiple frameworks (React, Vue, Angular, Svelte)'
    ],
    relationships: [
      { target: 'Component-Driven Development', description: 'Enables' },
      { target: 'Documentation as Code', description: 'Implements' },
      { target: 'Reproducible Research', description: 'Shares principles with' }
    ],
    examples: [
      'Stories define component states and variations: export const Primary: Story = { args: { label: "Button" } }',
      'Addons extend functionality with accessibility checks, responsive viewport testing, and interaction testing'
    ],
    tags: ['web-development', 'ui-tool', 'component-library', 'javascript']
  }
];

const WEB_DEVELOPMENT_CONCEPTS = [
  {
    name: 'Module Bundling',
    explanation: 'The process of combining multiple JavaScript modules and their dependencies into optimized bundles for browser delivery. Module bundlers resolve import statements, eliminate dead code, and apply transformations to produce production-ready assets.',
    principles: [
      'Dependency resolution follows module import statements',
      'Dead code elimination removes unused exports',
      'Code splitting enables on-demand loading'
    ],
    applications: [
      'Reducing network requests by combining multiple files',
      'Enabling code splitting for lazy loading',
      'Tree shaking to eliminate unused code',
      'Transforming modern JavaScript for browser compatibility'
    ],
    relatedConcepts: [
      'Build Automation',
      'Component-Driven Development',
      'Data Pipeline Orchestration'
    ],
    examples: [
      'Webpack bundles React components with CSS and images into optimized chunks',
      'Rollup produces ES module bundles for library distribution with minimal overhead'
    ],
    tags: ['web-development', 'build-process', 'optimization']
  },
  {
    name: 'Component-Driven Development',
    explanation: 'A development methodology that builds user interfaces from isolated, reusable components before assembling them into complete pages or applications. This approach emphasizes composability, testability, and documentation of individual UI elements.',
    principles: [
      'Components should be isolated and self-contained',
      'Props define component interfaces and contracts',
      'Documentation is generated from component definitions',
      'Visual testing validates component appearance'
    ],
    applications: [
      'Building design systems with reusable components',
      'Visual regression testing of component states',
      'Living documentation for UI patterns',
      'Parallel development of frontend and backend'
    ],
    relatedConcepts: [
      'Module Bundling',
      'Documentation as Code',
      'Containerization'
    ],
    examples: [
      'Storybook stories document Button component variants (primary, secondary, disabled)',
      'Atomic design methodology structures components from atoms to organisms to templates'
    ],
    tags: ['web-development', 'methodology', 'ui-design']
  }
];

// ============================================================================
// Domain: Data Science
// ============================================================================

const DATA_SCIENCE_ENTITIES = [
  {
    name: 'Pandas',
    definition: 'A Python library providing high-performance data structures and analysis tools for working with structured tabular data',
    properties: [
      'DataFrame and Series data structures for tabular data',
      'Vectorized operations for efficient computation',
      'Built-in time series functionality',
      'Integration with NumPy and Matplotlib'
    ],
    relationships: [
      { target: 'Data Transformation', description: 'Enables' },
      { target: 'Reproducible Research', description: 'Supports' },
      { target: 'Module Bundling', description: 'Shares packaging concepts with' }
    ],
    examples: [
      'df.groupby("category").agg({"revenue": "sum"}) performs aggregation on grouped data',
      'pd.read_csv() and df.to_csv() provide seamless file I/O for tabular data'
    ],
    tags: ['data-science', 'python', 'data-analysis', 'library']
  },
  {
    name: 'Apache Airflow',
    definition: 'A platform for programmatically authoring, scheduling, and monitoring data pipelines as directed acyclic graphs (DAGs)',
    properties: [
      'DAG-based workflow definition in Python',
      'Distributed task execution with executors',
      'Extensive operator library for integrations',
      'Web-based UI for monitoring and troubleshooting'
    ],
    relationships: [
      { target: 'Data Pipeline Orchestration', description: 'Implements' },
      { target: 'Infrastructure as Code', description: 'Follows principles of' },
      { target: 'Build Automation', description: 'Shares orchestration patterns with' }
    ],
    examples: [
      'DAGs define task dependencies: task_b.set_upstream(task_a) ensures sequential execution',
      'Sensors wait for external conditions before proceeding: S3KeySensor checks for file existence'
    ],
    tags: ['data-science', 'workflow', 'orchestration', 'python']
  }
];

const DATA_SCIENCE_CONCEPTS = [
  {
    name: 'Data Transformation',
    explanation: 'The process of converting data from one format or structure to another, including cleaning, aggregating, filtering, and enriching operations. Data transformation ensures data quality and prepares datasets for analysis or downstream consumption.',
    principles: [
      'Transformations should be idempotent and repeatable',
      'Data lineage tracks transformation history',
      'Validation catches quality issues early'
    ],
    applications: [
      'Cleaning and normalizing raw data',
      'Aggregating data for reporting and visualization',
      'Feature engineering for machine learning models',
      'Converting between data formats (CSV, JSON, Parquet)'
    ],
    relatedConcepts: [
      'Data Pipeline Orchestration',
      'Reproducible Research',
      'Configuration Management'
    ],
    examples: [
      'Pandas applies vectorized operations to transform millions of rows efficiently',
      'SQL queries join tables and aggregate metrics for business intelligence dashboards'
    ],
    tags: ['data-science', 'data-engineering', 'etl']
  },
  {
    name: 'Reproducible Research',
    explanation: 'The practice of documenting data analysis workflows, code, and computational environments to enable others to reproduce results exactly. This principle ensures transparency, verifiability, and collaboration in scientific and data-driven work.',
    principles: [
      'Version control tracks all changes to analysis code',
      'Dependencies must be explicitly declared',
      'Random seeds ensure deterministic results',
      'Documentation explains assumptions and methodology'
    ],
    applications: [
      'Version controlling analysis scripts and notebooks',
      'Documenting data sources and preprocessing steps',
      'Containerizing analysis environments',
      'Sharing computational notebooks with executable code'
    ],
    relatedConcepts: [
      'Data Transformation',
      'Documentation as Code',
      'Containerization'
    ],
    examples: [
      'Jupyter notebooks combine narrative text, code, and visualizations in a reproducible format',
      'Docker containers package analysis environments with exact dependency versions'
    ],
    tags: ['data-science', 'methodology', 'best-practices']
  }
];

// ============================================================================
// Domain: Infrastructure
// ============================================================================

const INFRASTRUCTURE_ENTITIES = [
  {
    name: 'Terraform',
    definition: 'An infrastructure as code tool for building, changing, and versioning cloud infrastructure safely and efficiently',
    properties: [
      'Declarative configuration language (HCL)',
      'Provider ecosystem for multiple cloud platforms',
      'State management for tracking infrastructure',
      'Plan and apply workflow for safe changes'
    ],
    relationships: [
      { target: 'Infrastructure as Code', description: 'Implements' },
      { target: 'Configuration Management', description: 'Provides' },
      { target: 'Data Pipeline Orchestration', description: 'Shares declarative patterns with' }
    ],
    examples: [
      'resource "aws_instance" "web" defines EC2 instances with declarative syntax',
      'terraform plan previews infrastructure changes before applying them'
    ],
    tags: ['infrastructure', 'iac', 'devops', 'cloud']
  },
  {
    name: 'Docker',
    definition: 'A platform for developing, shipping, and running applications in lightweight, portable containers',
    properties: [
      'Container runtime and image format',
      'Layered filesystem for efficient storage',
      'Isolation using Linux kernel features',
      'Docker Hub registry for image distribution'
    ],
    relationships: [
      { target: 'Containerization', description: 'Implements' },
      { target: 'Build Automation', description: 'Enables' },
      { target: 'Component-Driven Development', description: 'Shares isolation principles with' }
    ],
    examples: [
      'Dockerfile defines build steps: FROM, RUN, COPY, and CMD instructions',
      'docker-compose.yml orchestrates multi-container applications with service dependencies'
    ],
    tags: ['infrastructure', 'containers', 'devops', 'deployment']
  }
];

const INFRASTRUCTURE_CONCEPTS = [
  {
    name: 'Infrastructure as Code',
    explanation: 'The practice of managing and provisioning computing infrastructure through machine-readable definition files rather than manual configuration. Infrastructure as Code enables version control, automated deployment, and reproducible environments.',
    principles: [
      'Infrastructure definitions are version controlled',
      'Changes are applied through automated processes',
      'State is tracked and drift is detected',
      'Environments are reproducible from definitions'
    ],
    applications: [
      'Version controlling infrastructure definitions',
      'Automated provisioning of cloud resources',
      'Consistent environment configuration across stages',
      'Disaster recovery through infrastructure recreation'
    ],
    relatedConcepts: [
      'Configuration Management',
      'Containerization',
      'Documentation as Code'
    ],
    examples: [
      'Terraform configurations define AWS resources with declarative HCL syntax',
      'CloudFormation templates provision entire application stacks with JSON or YAML'
    ],
    tags: ['infrastructure', 'devops', 'automation', 'iac']
  },
  {
    name: 'Containerization',
    explanation: 'A lightweight virtualization approach that packages applications with their dependencies into isolated, portable units called containers. Containers share the host OS kernel while maintaining process and filesystem isolation.',
    principles: [
      'Each container runs a single process or service',
      'Containers are immutable and stateless',
      'Dependencies are packaged with the application',
      'Host OS kernel is shared across containers'
    ],
    applications: [
      'Consistent application deployment across environments',
      'Microservices architecture with isolated services',
      'Reproducible development environments',
      'Efficient resource utilization compared to VMs'
    ],
    relatedConcepts: [
      'Infrastructure as Code',
      'Build Automation',
      'Reproducible Research'
    ],
    examples: [
      'Docker containers package web applications with Node.js runtime and dependencies',
      'Kubernetes orchestrates containerized services with auto-scaling and load balancing'
    ],
    tags: ['infrastructure', 'containers', 'deployment', 'virtualization']
  }
];

// ============================================================================
// Shared Concepts (Cross-Domain)
// ============================================================================

const SHARED_CONCEPTS = [
  {
    name: 'Build Automation',
    explanation: 'The process of automating the creation of software builds, including compiling source code, running tests, and packaging artifacts for deployment. Build automation reduces manual errors, ensures consistency, and accelerates development workflows.',
    principles: [
      'Builds must be repeatable and deterministic',
      'Failures are detected and reported immediately',
      'Dependencies are resolved automatically'
    ],
    applications: [
      'Continuous integration pipelines',
      'Asset compilation and bundling for web applications',
      'Library packaging and distribution',
      'Infrastructure provisioning workflows'
    ],
    relatedConcepts: [
      'Module Bundling',
      'Data Pipeline Orchestration',
      'Configuration Management'
    ],
    examples: [
      'Webpack automates frontend asset bundling with loaders and plugins',
      'GitHub Actions runs automated tests and deploys applications on code push'
    ],
    tags: ['automation', 'devops', 'build-process', 'cross-domain']
  },
  {
    name: 'Documentation as Code',
    explanation: 'The practice of writing and maintaining documentation in the same version control system as source code, using markup languages and automated generation tools. This approach treats documentation as a first-class artifact with the same rigor as code.',
    principles: [
      'Documentation lives alongside code in version control',
      'Changes are reviewed through the same process as code',
      'Generation is automated from structured sources',
      'Documentation is validated and tested'
    ],
    applications: [
      'API documentation generated from source code annotations',
      'Component documentation in UI development tools',
      'Infrastructure documentation from IaC templates',
      'Analysis documentation in computational notebooks'
    ],
    relatedConcepts: [
      'Component-Driven Development',
      'Infrastructure as Code',
      'Reproducible Research'
    ],
    examples: [
      'Storybook generates interactive component documentation from story files',
      'OpenAPI specifications document REST APIs and generate client SDKs'
    ],
    tags: ['documentation', 'best-practices', 'automation', 'cross-domain']
  },
  {
    name: 'Data Pipeline Orchestration',
    explanation: 'The coordination and management of data workflows involving multiple tasks, dependencies, and systems. Orchestration tools schedule tasks, handle failures, and ensure data flows correctly through transformation and loading stages.',
    principles: [
      'Tasks are declaratively defined with dependencies',
      'Failures trigger retries or notifications',
      'State is tracked throughout execution'
    ],
    applications: [
      'ETL workflows for data warehousing',
      'Machine learning pipeline automation',
      'Batch processing job scheduling',
      'Event-driven data processing'
    ],
    relatedConcepts: [
      'Data Transformation',
      'Build Automation',
      'Infrastructure as Code'
    ],
    examples: [
      'Apache Airflow defines DAGs with task dependencies and retry logic',
      'AWS Step Functions orchestrates serverless workflows with state machines'
    ],
    tags: ['data-engineering', 'workflow', 'automation', 'cross-domain']
  },
  {
    name: 'Configuration Management',
    explanation: 'The systematic handling of system configuration changes to maintain consistency, traceability, and control across environments. Configuration management tools automate the deployment and maintenance of system settings, software, and infrastructure state.',
    principles: [
      'Configuration is declared rather than imperatively applied',
      'Drift from desired state is automatically detected',
      'Changes are auditable and reversible',
      'Environments converge to desired state'
    ],
    applications: [
      'Managing server configurations at scale',
      'Enforcing security policies across systems',
      'Environment-specific application settings',
      'Infrastructure drift detection and remediation'
    ],
    relatedConcepts: [
      'Infrastructure as Code',
      'Data Transformation',
      'Build Automation'
    ],
    examples: [
      'Ansible playbooks configure servers with declarative YAML tasks',
      'Terraform state files track infrastructure configuration and detect drift'
    ],
    tags: ['infrastructure', 'devops', 'configuration', 'cross-domain']
  }
];

async function main() {
  console.log('Cross-Domain Initialization');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Ensure directories exist
  if (!existsSync(entitiesDir)) {
    mkdirSync(entitiesDir, { recursive: true });
  }
  if (!existsSync(conceptsDir)) {
    mkdirSync(conceptsDir, { recursive: true });
  }

  let successCount = 0;
  let errorCount = 0;
  const domainStats = {
    'web-development': { entities: 0, concepts: 0 },
    'data-science': { entities: 0, concepts: 0 },
    'infrastructure': { entities: 0, concepts: 0 },
    'cross-domain': { entities: 0, concepts: 0 }
  };

  // Generate Web Development entities
  console.log('Creating Web Development entities...');
  for (const entityOptions of WEB_DEVELOPMENT_ENTITIES) {
    try {
      const result = generateEntityPage(entityOptions);
      const outputPath = join(entitiesDir, result.filename);
      writeFileSync(outputPath, result.content, 'utf-8');
      console.log(`✓ Created: wiki/entities/${result.filename}`);
      successCount++;
      domainStats['web-development'].entities++;
    } catch (error) {
      console.error(`✗ Failed to create ${entityOptions.name}:`, error.message);
      errorCount++;
    }
  }

  // Generate Data Science entities
  console.log('Creating Data Science entities...');
  for (const entityOptions of DATA_SCIENCE_ENTITIES) {
    try {
      const result = generateEntityPage(entityOptions);
      const outputPath = join(entitiesDir, result.filename);
      writeFileSync(outputPath, result.content, 'utf-8');
      console.log(`✓ Created: wiki/entities/${result.filename}`);
      successCount++;
      domainStats['data-science'].entities++;
    } catch (error) {
      console.error(`✗ Failed to create ${entityOptions.name}:`, error.message);
      errorCount++;
    }
  }

  // Generate Infrastructure entities
  console.log('Creating Infrastructure entities...');
  for (const entityOptions of INFRASTRUCTURE_ENTITIES) {
    try {
      const result = generateEntityPage(entityOptions);
      const outputPath = join(entitiesDir, result.filename);
      writeFileSync(outputPath, result.content, 'utf-8');
      console.log(`✓ Created: wiki/entities/${result.filename}`);
      successCount++;
      domainStats['infrastructure'].entities++;
    } catch (error) {
      console.error(`✗ Failed to create ${entityOptions.name}:`, error.message);
      errorCount++;
    }
  }

  // Generate Web Development concepts
  console.log('Creating Web Development concepts...');
  for (const conceptOptions of WEB_DEVELOPMENT_CONCEPTS) {
    try {
      const result = generateConceptPage(conceptOptions);
      const outputPath = join(conceptsDir, result.filename);
      writeFileSync(outputPath, result.content, 'utf-8');
      console.log(`✓ Created: wiki/concepts/${result.filename}`);
      successCount++;
      domainStats['web-development'].concepts++;
    } catch (error) {
      console.error(`✗ Failed to create ${conceptOptions.name}:`, error.message);
      errorCount++;
    }
  }

  // Generate Data Science concepts
  console.log('Creating Data Science concepts...');
  for (const conceptOptions of DATA_SCIENCE_CONCEPTS) {
    try {
      const result = generateConceptPage(conceptOptions);
      const outputPath = join(conceptsDir, result.filename);
      writeFileSync(outputPath, result.content, 'utf-8');
      console.log(`✓ Created: wiki/concepts/${result.filename}`);
      successCount++;
      domainStats['data-science'].concepts++;
    } catch (error) {
      console.error(`✗ Failed to create ${conceptOptions.name}:`, error.message);
      errorCount++;
    }
  }

  // Generate Infrastructure concepts
  console.log('Creating Infrastructure concepts...');
  for (const conceptOptions of INFRASTRUCTURE_CONCEPTS) {
    try {
      const result = generateConceptPage(conceptOptions);
      const outputPath = join(conceptsDir, result.filename);
      writeFileSync(outputPath, result.content, 'utf-8');
      console.log(`✓ Created: wiki/concepts/${result.filename}`);
      successCount++;
      domainStats['infrastructure'].concepts++;
    } catch (error) {
      console.error(`✗ Failed to create ${conceptOptions.name}:`, error.message);
      errorCount++;
    }
  }

  // Generate Shared (Cross-Domain) concepts
  console.log('Creating Cross-Domain concepts...');
  for (const conceptOptions of SHARED_CONCEPTS) {
    try {
      const result = generateConceptPage(conceptOptions);
      const outputPath = join(conceptsDir, result.filename);
      writeFileSync(outputPath, result.content, 'utf-8');
      console.log(`✓ Created: wiki/concepts/${result.filename}`);
      successCount++;
      domainStats['cross-domain'].concepts++;
    } catch (error) {
      console.error(`✗ Failed to create ${conceptOptions.name}:`, error.message);
      errorCount++;
    }
  }

  // Print summary
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Domain Statistics:');
  console.log('');
  console.log('Web Development:');
  console.log(`  Entities:  ${domainStats['web-development'].entities}`);
  console.log(`  Concepts:  ${domainStats['web-development'].concepts}`);
  console.log('');
  console.log('Data Science:');
  console.log(`  Entities:  ${domainStats['data-science'].entities}`);
  console.log(`  Concepts:  ${domainStats['data-science'].concepts}`);
  console.log('');
  console.log('Infrastructure:');
  console.log(`  Entities:  ${domainStats['infrastructure'].entities}`);
  console.log(`  Concepts:  ${domainStats['infrastructure'].concepts}`);
  console.log('');
  console.log('Cross-Domain:');
  console.log(`  Concepts:  ${domainStats['cross-domain'].concepts}`);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total Created:  ${successCount} pages`);
  if (errorCount > 0) {
    console.log(`Total Failed:   ${errorCount} pages`);
    console.error('\nCompleted with errors');
    process.exit(1);
  } else {
    console.log('\n✓ Successfully created all cross-domain pages');
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
