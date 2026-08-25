import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: 'hexagonal:domain',
              onlyDependOnLibsWithTags: ['hexagonal:domain'],
            },
            {
              sourceTag: 'hexagonal:application',
              onlyDependOnLibsWithTags: ['hexagonal:domain', 'hexagonal:application'],
            },
            {
              sourceTag: 'hexagonal:infrastructure',
              onlyDependOnLibsWithTags: [
                'hexagonal:domain',
                'hexagonal:application',
                'hexagonal:infrastructure',
              ],
            },
            {
              sourceTag: 'hexagonal:presentation',
              onlyDependOnLibsWithTags: [
                'hexagonal:domain',
                'hexagonal:application',
                'hexagonal:infrastructure',
                'hexagonal:presentation',
              ],
            },
            {
              sourceTag: 'scope:wiki',
              onlyDependOnLibsWithTags: ['scope:wiki', 'scope:shared'],
            },
            {
              sourceTag: 'scope:character',
              onlyDependOnLibsWithTags: ['scope:character', 'scope:wiki', 'scope:shared'],
            },
            {
              sourceTag: 'scope:life-forge',
              onlyDependOnLibsWithTags: [
                'scope:life-forge',
                'scope:character',
                'scope:wiki',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            {
              sourceTag: 'layer:feature',
              onlyDependOnLibsWithTags: [
                'layer:feature',
                'layer:ui',
                'layer:data-access',
                'layer:domain',
                'type:feature',
                'type:ui',
                'type:data-access',
                'type:util',
              ],
            },
            {
              sourceTag: 'layer:ui',
              onlyDependOnLibsWithTags: [
                'layer:ui',
                'layer:domain',
                'type:ui',
                'type:util',
              ],
            },
            {
              sourceTag: 'layer:data-access',
              onlyDependOnLibsWithTags: [
                'layer:data-access',
                'layer:domain',
                'type:data-access',
                'type:util',
              ],
            },
            {
              sourceTag: 'layer:domain',
              onlyDependOnLibsWithTags: ['layer:domain', 'type:util'],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:ui',
                'type:data-access',
                'type:util',
              ],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:util'],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: ['type:data-access', 'type:util'],
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util'],
            },
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
