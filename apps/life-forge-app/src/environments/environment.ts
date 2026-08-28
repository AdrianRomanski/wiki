import { FirebaseEnvironmentConfig } from '@wiki/character-data-access';

export const environment = {
  production: true,
  useFirebaseEmulators: false,
  allowlist: ['admin@local.dev'],
  firebase: {
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'life-forge-app-demo.firebaseapp.com',
    projectId: 'life-forge-app-demo',
    storageBucket: 'life-forge-app-demo.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef'
  } as FirebaseEnvironmentConfig
};
