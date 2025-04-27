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

interface PottyEntry {
  entryId: string;
  time: string;
  type: 'pee' | 'poop' | 'both';

  notes?: string;
  babyId: string;
  trackerType: 'potty';
  createdAt: string;
}

describe('Potty Tracker API Endpoints', () => {
  let testProfileId: string | null = null;
  let createdEntryId: string | null = null;

  beforeAll(async () => {
    clearAuthToken();
    const profileData = {
      name: `PottyTest Baby ${Date.now()}`,
      birthday: '2025-02-09',
    };
    try {
      const response: BabyProfile = await apiPost('/profiles', profileData);
      testProfileId = response.id;
      console.log(`Created test profile for potty tests: ${testProfileId}`);
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

  test('POST /profiles/{profileId}/trackers/potty - should create a new potty entry', async () => {
    if (!testProfileId)
      throw new Error('Test setup failed: testProfileId is null.');

    const entryData = {
      time: new Date().toISOString(),
      type: 'poop',

      notes: 'Successful trip!',
    };

    const response: PottyEntry = await apiPost(
      `/profiles/${testProfileId}/trackers/potty`,
      entryData
    );

    expect(response).toBeDefined();
    expect(response.entryId).toMatch(/^potty_/);
    expect(response.babyId).toBe(testProfileId);
    expect(response.trackerType).toBe('potty');
    expect(response.time).toBe(entryData.time);
    expect(response.type).toBe(entryData.type);

    expect(response.notes).toBe(entryData.notes);
    expect(response.createdAt).toBeDefined();

    createdEntryId = response.entryId;
  });

  test('GET /profiles/{profileId}/trackers/potty - should retrieve potty entries for the profile', async () => {
    if (!testProfileId || !createdEntryId)
      throw new Error(
        'Test setup failed: testProfileId or createdEntryId is null.'
      );

    const response: PottyEntry[] = await apiGet(
      `/profiles/${testProfileId}/trackers/potty`
    );

    expect(response).toBeDefined();
    expect(Array.isArray(response)).toBe(true);
    expect(response.length).toBeGreaterThanOrEqual(1);

    const foundEntry = response.find((e) => e.entryId === createdEntryId);
    expect(foundEntry).toBeDefined();
    expect(foundEntry?.babyId).toBe(testProfileId);
    expect(foundEntry?.trackerType).toBe('potty');
    expect(foundEntry?.type).toBe('poop');
  });

  // TODO: Add PUT test for updating an entry if needed

  test('DELETE /profiles/{profileId}/trackers/potty/{entryId} - should delete the potty entry', async () => {
    if (!testProfileId || !createdEntryId)
      throw new Error(
        'Test setup failed: testProfileId or createdEntryId is null.'
      );

    await apiDelete(
      `/profiles/${testProfileId}/trackers/potty/${createdEntryId}`
    );

    const getResponse: PottyEntry[] = await apiGet(
      `/profiles/${testProfileId}/trackers/potty`
    );
    const deletedEntry = getResponse.find((e) => e.entryId === createdEntryId);
    expect(deletedEntry).toBeUndefined();

    createdEntryId = null;
  });
});
