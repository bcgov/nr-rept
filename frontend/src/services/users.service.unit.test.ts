import { describe, it, expect, beforeEach } from 'vitest';

import { UserService } from './users.service';

const mockConfig = { baseURL: 'http://localhost' };
let service: UserService;

beforeEach(() => {
  service = new UserService(mockConfig as any);
});

describe('UserService', () => {
  it('getUserPreferences should return user preferences', async () => {
    const result = await service.getUserPreferences();
    expect(result).toEqual({ theme: 'g10' });
  });

  it('updateUserPreferences should resolve successfully', async () => {
    const prefs = { theme: 'g100' };
    const result = await service.updateUserPreferences(prefs);
    expect(result).toBeUndefined();
  });
});
