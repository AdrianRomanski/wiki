import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'wiki-graph',
    loadComponent: () =>
      import('./components/smart/wiki-graph-smart/wiki-graph-smart.component').then(
        (m) => m.WikiGraphPageComponent
      ),
  },
  { path: '', redirectTo: 'wiki-graph', pathMatch: 'full' },
];
