import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  clearAuthToken,
} from './apiTestClient';

interface BabyProfile {
  id: string;
  name: string;
  birthday: string;
}

interface SleepEntry {
  entryId: string;
  startTime: string;
  endTime: string;
  notes?: string;
  babyId: string;
  trackerType: 'sleep';
  createdAt: string;
}

describe('Sleep Tracker API Endpoints', () => {
  let testProfileId: string | null = null;
  let createdEntryId: string | null = null;

  beforeAll(async () => {
    clearAuthToken();

    const profileData = {
      name: `SleepTest Baby ${Date.now()}`,
      birthday: '2025-02-01',
    };
    try {
      const response: BabyProfile = await apiPost('/profiles', profileData);
      testProfileId = response.id;
      console.log(`Created test profile for sleep tests: ${testProfileId}`);
    } catch (error) {
      console.error('Failed to create test profile in beforeAll:', error);
      throw new Error('Test setup failed: Could not create profile.');
    }
  });

  afterAll(async () => {
    if (testProfileId) {
      try {
        console.log(`Cleaning up test profile: ${testProfileId}`);
        await apiDelete(`/profiles/${testProfileId}`);
        console.log(`Cleaned up test profile: ${testProfileId}`);
      } catch (error) {
        console.error(
          `Failed to clean up test profile ${testProfileId}:`,
          error
        );
      }
    }
  });

  test('POST /profiles/{profileId}/trackers/sleep - should create a new sleep entry', async () => {
    if (!testProfileId) {
      throw new Error('Test setup failed: testProfileId is null.');
    }
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const entryData = {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      notes: 'Test sleep notes',
    };

    const response: SleepEntry = await apiPost(
      `/profiles/${testProfileId}/trackers/sleep`,
      entryData
    );

    expect(response).toBeDefined();
    expect(response.entryId).toMatch(/^sleep_/);
    expect(response.babyId).toBe(testProfileId);
    expect(response.trackerType).toBe('sleep');
    expect(response.startTime).toBe(entryData.startTime);
    expect(response.endTime).toBe(entryData.endTime);
    expect(response.notes).toBe(entryData.notes);
    expect(response.createdAt).toBeDefined();

    createdEntryId = response.entryId;
  });

  test('GET /profiles/{profileId}/trackers/sleep - should retrieve sleep entries for the profile', async () => {
    if (!testProfileId || !createdEntryId) {
      throw new Error(
        'Test setup failed: testProfileId or createdEntryId is null.'
      );
    }

    const response: SleepEntry[] = await apiGet(
      `/profiles/${testProfileId}/trackers/sleep`
    );

    expect(response).toBeDefined();
    expect(Array.isArray(response)).toBe(true);
    expect(response.length).toBeGreaterThanOrEqual(1);

    const foundEntry = response.find((e) => e.entryId === createdEntryId);
    expect(foundEntry).toBeDefined();
    expect(foundEntry?.babyId).toBe(testProfileId);
    expect(foundEntry?.trackerType).toBe('sleep');
    expect(foundEntry?.notes).toBe('Test sleep notes');
  });

  // TODO: Add PUT test for updating an entry if needed

  test('DELETE /profiles/{profileId}/trackers/sleep/{entryId} - should delete the sleep entry', async () => {
    if (!testProfileId || !createdEntryId) {
      throw new Error(
        'Test setup failed: testProfileId or createdEntryId is null.'
      );
    }

    const response = await apiDelete(
      `/profiles/${testProfileId}/trackers/sleep/${createdEntryId}`
    );

    const getResponse: SleepEntry[] = await apiGet(
      `/profiles/${testProfileId}/trackers/sleep`
    );
    const deletedEntry = getResponse.find((e) => e.entryId === createdEntryId);
    expect(deletedEntry).toBeUndefined();

    createdEntryId = null;
  });
});
