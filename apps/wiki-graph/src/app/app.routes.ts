import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'wiki-graph',
    loadComponent: () =>
      import('./wiki-graph-page.component').then(
        (m) => m.WikiGraphPageComponent
      ),
  },
  { path: '', redirectTo: 'wiki-graph', pathMatch: 'full' },
];
