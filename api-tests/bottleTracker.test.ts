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

interface BottleEntry {
  entryId: string;
  time: string;
  amount: number;
  unit: 'ml' | 'oz';
  type: 'formula' | 'breast_milk' | 'other';
  notes?: string;
  babyId: string;
  trackerType: 'bottle';
  createdAt: string;
}

describe('Bottle Tracker API Endpoints', () => {
  let testProfileId: string | null = null;
  let createdEntryId: string | null = null;

  beforeAll(async () => {
    clearAuthToken();
    const profileData = {
      name: `BottleTest Baby ${Date.now()}`,
      birthday: '2025-02-03',
    };
    try {
      const response: BabyProfile = await apiPost('/profiles', profileData);
      testProfileId = response.id;
      console.log(`Created test profile for bottle tests: ${testProfileId}`);
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

  test('POST /profiles/{profileId}/trackers/bottle - should create a new bottle entry', async () => {
    if (!testProfileId)
      throw new Error('Test setup failed: testProfileId is null.');

    const entryData = {
      time: new Date().toISOString(),
      amount: 120,
      unit: 'ml',
      type: 'formula',
      notes: 'Mixed with cereal',
    };

    const response: BottleEntry = await apiPost(
      `/profiles/${testProfileId}/trackers/bottle`,
      entryData
    );

    expect(response).toBeDefined();
    expect(response.entryId).toMatch(/^bottle_/);
    expect(response.babyId).toBe(testProfileId);
    expect(response.trackerType).toBe('bottle');
    expect(response.time).toBe(entryData.time);
    expect(response.amount).toBe(entryData.amount);
    expect(response.unit).toBe(entryData.unit);
    expect(response.type).toBe(entryData.type);
    expect(response.notes).toBe(entryData.notes);
    expect(response.createdAt).toBeDefined();

    createdEntryId = response.entryId;
  });

  test('GET /profiles/{profileId}/trackers/bottle - should retrieve bottle entries for the profile', async () => {
    if (!testProfileId || !createdEntryId)
      throw new Error(
        'Test setup failed: testProfileId or createdEntryId is null.'
      );

    const response: BottleEntry[] = await apiGet(
      `/profiles/${testProfileId}/trackers/bottle`
    );

    expect(response).toBeDefined();
    expect(Array.isArray(response)).toBe(true);
    expect(response.length).toBeGreaterThanOrEqual(1);

    const foundEntry = response.find((e) => e.entryId === createdEntryId);
    expect(foundEntry).toBeDefined();
    expect(foundEntry?.babyId).toBe(testProfileId);
    expect(foundEntry?.trackerType).toBe('bottle');
    expect(foundEntry?.amount).toBe(120);
    expect(foundEntry?.type).toBe('formula');
  });

  // TODO: Add PUT test for updating an entry if needed

  test('DELETE /profiles/{profileId}/trackers/bottle/{entryId} - should delete the bottle entry', async () => {
    if (!testProfileId || !createdEntryId)
      throw new Error(
        'Test setup failed: testProfileId or createdEntryId is null.'
      );

    await apiDelete(
      `/profiles/${testProfileId}/trackers/bottle/${createdEntryId}`
    );

    const getResponse: BottleEntry[] = await apiGet(
      `/profiles/${testProfileId}/trackers/bottle`
    );
    const deletedEntry = getResponse.find((e) => e.entryId === createdEntryId);
    expect(deletedEntry).toBeUndefined();

    createdEntryId = null;
  });
});
