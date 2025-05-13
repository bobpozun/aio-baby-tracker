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

interface SolidsEntry {
  entryId: string;
  time: string;
  food: string;
  amount?: string;
  reaction?: 'liked' | 'disliked' | 'neutral' | 'allergic';
  notes?: string;
  imageKey?: string;
  babyId: string;
  trackerType: 'solids';
  createdAt: string;
}

describe('Solids Tracker API Endpoints', () => {
  let testProfileId: string | null = null;
  let createdEntryId: string | null = null;

  beforeAll(async () => {
    clearAuthToken();
    const profileData = {
      name: `SolidsTest Baby ${Date.now()}`,
      birthday: '2025-02-04',
    };
    try {
      const response: BabyProfile = await apiPost('/profiles', profileData);
      testProfileId = response.id;
      console.log(`Created test profile for solids tests: ${testProfileId}`);
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

  test('POST /profiles/{profileId}/trackers/solids - should create a new solids entry', async () => {
    if (!testProfileId)
      throw new Error('Test setup failed: testProfileId is null.');

    const entryData = {
      time: new Date().toISOString(),
      food: 'Carrots',
      amount: '2 tbsp',
      reaction: 'liked',
      notes: 'First time trying!',
    };

    const response: SolidsEntry = await apiPost(
      `/profiles/${testProfileId}/trackers/solids`,
      entryData
    );

    expect(response).toBeDefined();
    expect(response.entryId).toMatch(/^solids_/);
    expect(response.babyId).toBe(testProfileId);
    expect(response.trackerType).toBe('solids');
    expect(response.time).toBe(entryData.time);
    expect(response.food).toBe(entryData.food);
    expect(response.amount).toBe(entryData.amount);
    expect(response.reaction).toBe(entryData.reaction);
    expect(response.notes).toBe(entryData.notes);
    expect(response.createdAt).toBeDefined();

    createdEntryId = response.entryId;
  });

  test('GET /profiles/{profileId}/trackers/solids - should retrieve solids entries for the profile', async () => {
    if (!testProfileId || !createdEntryId)
      throw new Error(
        'Test setup failed: testProfileId or createdEntryId is null.'
      );

    const response: SolidsEntry[] = await apiGet(
      `/profiles/${testProfileId}/trackers/solids`
    );

    expect(response).toBeDefined();
    expect(Array.isArray(response)).toBe(true);
    expect(response.length).toBeGreaterThanOrEqual(1);

    const foundEntry = response.find((e) => e.entryId === createdEntryId);
    expect(foundEntry).toBeDefined();
    expect(foundEntry?.babyId).toBe(testProfileId);
    expect(foundEntry?.trackerType).toBe('solids');
    expect(foundEntry?.food).toBe('Carrots');
    expect(foundEntry?.reaction).toBe('liked');
  });

  // TODO: Add PUT test for updating an entry if needed

  test('DELETE /profiles/{profileId}/trackers/solids/{entryId} - should delete the solids entry', async () => {
    if (!testProfileId || !createdEntryId)
      throw new Error(
        'Test setup failed: testProfileId or createdEntryId is null.'
      );

    await apiDelete(
      `/profiles/${testProfileId}/trackers/solids/${createdEntryId}`
    );

    const getResponse: SolidsEntry[] = await apiGet(
      `/profiles/${testProfileId}/trackers/solids`
    );
    const deletedEntry = getResponse.find((e) => e.entryId === createdEntryId);
    expect(deletedEntry).toBeUndefined();

    createdEntryId = null;
  });
});
