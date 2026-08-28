import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  provideAppInitializer,
  inject,
} from '@angular/core';
import { ALLOWLIST_EMAILS, FirestoreCharacterAdapter } from '@wiki/character-data-access';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    {
      provide: ALLOWLIST_EMAILS,
      useValue: environment.allowlist || [],
    },
    provideAppInitializer(() => {
      const firestoreAdapter = inject(FirestoreCharacterAdapter);
      firestoreAdapter.initFirebase({
        ...environment.firebase,
        useEmulators: environment.useFirebaseEmulators,
      });
    }),
  ],
};
