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
