
export const PROGRESS_ENTRY_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['conceptId', 'conceptTitle', 'state', 'lastAssessed', 'assessmentCount', 'version'],
  properties: {
    conceptId: {
      type: 'string',
      minLength: 1,
      pattern: '^[a-z0-9-]+$',
      description: 'Kebab-case identifier matching wiki entity/concept'
    },
    conceptTitle: {
      type: 'string',
      minLength: 1,
      description: 'Human-readable concept title'
    },
    state: {
      type: 'string',
      enum: ['Not_Started', 'In_Progress', 'Understood', 'Mastered'],
      description: 'Current learning state'
    },
    lastAssessed: {
      type: 'string',
      format: 'date-time',
      description: 'ISO 8601 timestamp of last assessment'
    },
    assessmentCount: {
      type: 'integer',
      minimum: 0,
      description: 'Number of times this concept has been assessed'
    },
    version: {
      type: 'string',
      const: '1.0.0',
      description: 'Schema version for migration support'
    }
  },
  additionalProperties: false
} as const;

export const PROGRESS_INDEX_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['version', 'lastUpdated', 'totalConcepts', 'conceptIds'],
  properties: {
    version: {
      type: 'string',
      const: '1.0.0',
      description: 'Schema version'
    },
    lastUpdated: {
      type: 'string',
      format: 'date-time',
      description: 'ISO 8601 timestamp of last update'
    },
    totalConcepts: {
      type: 'integer',
      minimum: 0,
      description: 'Total number of concepts tracked'
    },
    conceptIds: {
      type: 'array',
      items: {
        type: 'string',
        pattern: '^[a-z0-9-]+$'
      },
      uniqueItems: true,
      description: 'List of all concept IDs with progress data'
    }
  },
  additionalProperties: false
} as const;

export const SCHEMA_VERSION = '1.0.0';
