import { CancelablePromise } from '@/config/api/CancelablePromise';
import { HttpClient, type APIConfig } from '@/config/api/types';

import type { UserPreference } from '@/context/preference/types';

/**
 * In the POC template we avoid calling the backend for user preferences. Keep the service
 * methods but return resolved values so any callers (including tests) keep working.
 */
export class UserService extends HttpClient {
  constructor(readonly config: APIConfig) {
    super(config);
  }

  getUserPreferences(): CancelablePromise<UserPreference> {
    return new CancelablePromise<UserPreference>((resolve) =>
      resolve({ theme: 'g10' } as UserPreference),
    );
  }

  updateUserPreferences(preferences: UserPreference): CancelablePromise<void> {
    return new CancelablePromise<void>((resolve) => {
      void preferences;
      resolve();
    });
  }
}
