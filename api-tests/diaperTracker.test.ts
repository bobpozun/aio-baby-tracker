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

interface DiaperEntry {
  entryId: string;
  time: string;
  type: 'wet' | 'dirty' | 'mixed';
  notes?: string;
  babyId: string;
  trackerType: 'diaper';
  createdAt: string;
}

describe('Diaper Tracker API Endpoints', () => {
  let testProfileId: string | null = null;
  let createdEntryId: string | null = null;

  beforeAll(async () => {
    clearAuthToken();
    const profileData = {
      name: `DiaperTest Baby ${Date.now()}`,
      birthday: '2025-02-05',
    };
    try {
      const response: BabyProfile = await apiPost('/profiles', profileData);
      testProfileId = response.id;
      console.log(`Created test profile for diaper tests: ${testProfileId}`);
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

  test('POST /profiles/{profileId}/trackers/diaper - should create a new diaper entry', async () => {
    if (!testProfileId)
      throw new Error('Test setup failed: testProfileId is null.');

    const entryData = {
      time: new Date().toISOString(),
      type: 'mixed',
      notes: 'Slightly runny',
    };

    const response: DiaperEntry = await apiPost(
      `/profiles/${testProfileId}/trackers/diaper`,
      entryData
    );

    expect(response).toBeDefined();
    expect(response.entryId).toMatch(/^diaper_/);
    expect(response.babyId).toBe(testProfileId);
    expect(response.trackerType).toBe('diaper');
    expect(response.time).toBe(entryData.time);
    expect(response.type).toBe(entryData.type);
    expect(response.notes).toBe(entryData.notes);
    expect(response.createdAt).toBeDefined();

    createdEntryId = response.entryId;
  });

  test('GET /profiles/{profileId}/trackers/diaper - should retrieve diaper entries for the profile', async () => {
    if (!testProfileId || !createdEntryId)
      throw new Error(
        'Test setup failed: testProfileId or createdEntryId is null.'
      );

    const response: DiaperEntry[] = await apiGet(
      `/profiles/${testProfileId}/trackers/diaper`
    );

    expect(response).toBeDefined();
    expect(Array.isArray(response)).toBe(true);
    expect(response.length).toBeGreaterThanOrEqual(1);

    const foundEntry = response.find((e) => e.entryId === createdEntryId);
    expect(foundEntry).toBeDefined();
    expect(foundEntry?.babyId).toBe(testProfileId);
    expect(foundEntry?.trackerType).toBe('diaper');
    expect(foundEntry?.type).toBe('mixed');
    expect(foundEntry?.notes).toBe('Slightly runny');
  });

  // TODO: Add PUT test for updating an entry if needed

  test('DELETE /profiles/{profileId}/trackers/diaper/{entryId} - should delete the diaper entry', async () => {
    if (!testProfileId || !createdEntryId)
      throw new Error(
        'Test setup failed: testProfileId or createdEntryId is null.'
      );

    await apiDelete(
      `/profiles/${testProfileId}/trackers/diaper/${createdEntryId}`
    );

    const getResponse: DiaperEntry[] = await apiGet(
      `/profiles/${testProfileId}/trackers/diaper`
    );
    const deletedEntry = getResponse.find((e) => e.entryId === createdEntryId);
    expect(deletedEntry).toBeUndefined();

    createdEntryId = null;
  });
});
