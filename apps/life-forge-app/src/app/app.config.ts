import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  provideAppInitializer,
  inject,
} from '@angular/core';
import { FirestoreCharacterAdapter } from '@wiki/character-data-access';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideAppInitializer(() => {
      const firestoreAdapter = inject(FirestoreCharacterAdapter);
      firestoreAdapter.initFirebase({
        ...environment.firebase,
        useEmulators: environment.useFirebaseEmulators,
      });
    }),
  ],
};

