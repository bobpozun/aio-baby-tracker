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

interface NursingEntry {
  entryId: string;
  startTime: string;
  durationLeft?: number;
  durationRight?: number;
  lastSide?: 'left' | 'right';
  notes?: string;
  babyId: string;
  trackerType: 'nursing';
  createdAt: string;
}

describe('Nursing Tracker API Endpoints', () => {
  let testProfileId: string | null = null;
  let createdEntryId: string | null = null;

  beforeAll(async () => {
    clearAuthToken();
    const profileData = {
      name: `NursingTest Baby ${Date.now()}`,
      birthday: '2025-02-02',
    };
    try {
      const response: BabyProfile = await apiPost('/profiles', profileData);
      testProfileId = response.id;
      console.log(`Created test profile for nursing tests: ${testProfileId}`);
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

  test('POST /profiles/{profileId}/trackers/nursing - should create a new nursing entry', async () => {
    if (!testProfileId)
      throw new Error('Test setup failed: testProfileId is null.');

    const entryData = {
      startTime: new Date().toISOString(),
      durationLeft: 10,
      durationRight: 15,
      lastSide: 'right',
      notes: 'Good latch',
    };

    const response: NursingEntry = await apiPost(
      `/profiles/${testProfileId}/trackers/nursing`,
      entryData
    );

    expect(response).toBeDefined();
    expect(response.entryId).toMatch(/^nursing_/);
    expect(response.babyId).toBe(testProfileId);
    expect(response.trackerType).toBe('nursing');
    expect(response.startTime).toBe(entryData.startTime);
    expect(response.durationLeft).toBe(entryData.durationLeft);
    expect(response.durationRight).toBe(entryData.durationRight);
    expect(response.lastSide).toBe(entryData.lastSide);
    expect(response.notes).toBe(entryData.notes);
    expect(response.createdAt).toBeDefined();

    createdEntryId = response.entryId;
  });

  test('GET /profiles/{profileId}/trackers/nursing - should retrieve nursing entries for the profile', async () => {
    if (!testProfileId || !createdEntryId)
      throw new Error(
        'Test setup failed: testProfileId or createdEntryId is null.'
      );

    const response: NursingEntry[] = await apiGet(
      `/profiles/${testProfileId}/trackers/nursing`
    );

    expect(response).toBeDefined();
    expect(Array.isArray(response)).toBe(true);
    expect(response.length).toBeGreaterThanOrEqual(1);

    const foundEntry = response.find((e) => e.entryId === createdEntryId);
    expect(foundEntry).toBeDefined();
    expect(foundEntry?.babyId).toBe(testProfileId);
    expect(foundEntry?.trackerType).toBe('nursing');
    expect(foundEntry?.durationLeft).toBe(10);
    expect(foundEntry?.lastSide).toBe('right');
  });

  // TODO: Add PUT test for updating an entry if needed

  test('DELETE /profiles/{profileId}/trackers/nursing/{entryId} - should delete the nursing entry', async () => {
    if (!testProfileId || !createdEntryId)
      throw new Error(
        'Test setup failed: testProfileId or createdEntryId is null.'
      );

    await apiDelete(
      `/profiles/${testProfileId}/trackers/nursing/${createdEntryId}`
    );

    const getResponse: NursingEntry[] = await apiGet(
      `/profiles/${testProfileId}/trackers/nursing`
    );
    const deletedEntry = getResponse.find((e) => e.entryId === createdEntryId);
    expect(deletedEntry).toBeUndefined();

    createdEntryId = null;
  });
});
