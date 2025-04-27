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

interface GrowthEntry {
  entryId: string;
  date: string;
  weight?: number;
  weightUnit?: 'kg' | 'lb';
  height?: number;
  heightUnit?: 'cm' | 'in';
  headCircumference?: number;
  headCircumferenceUnit?: 'cm' | 'in';
  notes?: string;
  babyId: string;
  trackerType: 'growth';
  createdAt: string;
}

describe('Growth Tracker API Endpoints', () => {
  let testProfileId: string | null = null;
  let createdEntryId: string | null = null;

  beforeAll(async () => {
    clearAuthToken();
    const profileData = {
      name: `GrowthTest Baby ${Date.now()}`,
      birthday: '2025-02-07',
    };
    try {
      const response: BabyProfile = await apiPost('/profiles', profileData);
      testProfileId = response.id;
      console.log(`Created test profile for growth tests: ${testProfileId}`);
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

  test('POST /profiles/{profileId}/trackers/growth - should create a new growth entry', async () => {
    if (!testProfileId)
      throw new Error('Test setup failed: testProfileId is null.');

    const entryData = {
      date: new Date().toISOString().split('T')[0],
      weight: 5.5,
      weightUnit: 'kg',
      height: 58,
      heightUnit: 'cm',
      notes: 'Checkup measurement',
    };

    const response: GrowthEntry = await apiPost(
      `/profiles/${testProfileId}/trackers/growth`,
      entryData
    );

    expect(response).toBeDefined();
    expect(response.entryId).toMatch(/^growth_/);
    expect(response.babyId).toBe(testProfileId);
    expect(response.trackerType).toBe('growth');
    expect(response.date).toBe(entryData.date);
    expect(response.weight).toBe(entryData.weight);
    expect(response.weightUnit).toBe(entryData.weightUnit);
    expect(response.height).toBe(entryData.height);
    expect(response.heightUnit).toBe(entryData.heightUnit);
    expect(response.headCircumference).toBeUndefined();
    expect(response.notes).toBe(entryData.notes);
    expect(response.createdAt).toBeDefined();

    createdEntryId = response.entryId;
  });

  test('GET /profiles/{profileId}/trackers/growth - should retrieve growth entries for the profile', async () => {
    if (!testProfileId || !createdEntryId)
      throw new Error(
        'Test setup failed: testProfileId or createdEntryId is null.'
      );

    const response: GrowthEntry[] = await apiGet(
      `/profiles/${testProfileId}/trackers/growth`
    );

    expect(response).toBeDefined();
    expect(Array.isArray(response)).toBe(true);
    expect(response.length).toBeGreaterThanOrEqual(1);

    const foundEntry = response.find((e) => e.entryId === createdEntryId);
    expect(foundEntry).toBeDefined();
    expect(foundEntry?.babyId).toBe(testProfileId);
    expect(foundEntry?.trackerType).toBe('growth');
    expect(foundEntry?.weight).toBe(5.5);
    expect(foundEntry?.heightUnit).toBe('cm');
  });

  // TODO: Add PUT test for updating an entry if needed

  test('DELETE /profiles/{profileId}/trackers/growth/{entryId} - should delete the growth entry', async () => {
    if (!testProfileId || !createdEntryId)
      throw new Error(
        'Test setup failed: testProfileId or createdEntryId is null.'
      );

    await apiDelete(
      `/profiles/${testProfileId}/trackers/growth/${createdEntryId}`
    );

    const getResponse: GrowthEntry[] = await apiGet(
      `/profiles/${testProfileId}/trackers/growth`
    );
    const deletedEntry = getResponse.find((e) => e.entryId === createdEntryId);
    expect(deletedEntry).toBeUndefined();

    createdEntryId = null;
  });
});
