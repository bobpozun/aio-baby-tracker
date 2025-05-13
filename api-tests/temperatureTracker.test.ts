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

interface TemperatureEntry {
  entryId: string;
  time: string;
  temperature: number;
  unit: 'C' | 'F';
  notes?: string;
  babyId: string;
  trackerType: 'temperature';
  createdAt: string;
}

describe('Temperature Tracker API Endpoints', () => {
  let testProfileId: string | null = null;
  let createdEntryId: string | null = null;

  beforeAll(async () => {
    clearAuthToken();
    const profileData = {
      name: `TempTest Baby ${Date.now()}`,
      birthday: '2025-02-08',
    };
    try {
      const response: BabyProfile = await apiPost('/profiles', profileData);
      testProfileId = response.id;
      console.log(
        `Created test profile for temperature tests: ${testProfileId}`
      );
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

  test('POST /profiles/{profileId}/trackers/temperature - should create a new temperature entry', async () => {
    if (!testProfileId)
      throw new Error('Test setup failed: testProfileId is null.');

    const entryData = {
      time: new Date().toISOString(),
      temperature: 37.1,
      unit: 'C',
      notes: 'Slightly warm',
    };

    const response: TemperatureEntry = await apiPost(
      `/profiles/${testProfileId}/trackers/temperature`,
      entryData
    );

    expect(response).toBeDefined();
    expect(response.entryId).toMatch(/^temperature_/);
    expect(response.babyId).toBe(testProfileId);
    expect(response.trackerType).toBe('temperature');
    expect(response.time).toBe(entryData.time);
    expect(response.temperature).toBe(entryData.temperature);
    expect(response.unit).toBe(entryData.unit);
    expect(response.notes).toBe(entryData.notes);
    expect(response.createdAt).toBeDefined();

    createdEntryId = response.entryId;
  });

  test('GET /profiles/{profileId}/trackers/temperature - should retrieve temperature entries for the profile', async () => {
    if (!testProfileId || !createdEntryId)
      throw new Error(
        'Test setup failed: testProfileId or createdEntryId is null.'
      );

    const response: TemperatureEntry[] = await apiGet(
      `/profiles/${testProfileId}/trackers/temperature`
    );

    expect(response).toBeDefined();
    expect(Array.isArray(response)).toBe(true);
    expect(response.length).toBeGreaterThanOrEqual(1);

    const foundEntry = response.find((e) => e.entryId === createdEntryId);
    expect(foundEntry).toBeDefined();
    expect(foundEntry?.babyId).toBe(testProfileId);
    expect(foundEntry?.trackerType).toBe('temperature');
    expect(foundEntry?.temperature).toBe(37.1);
    expect(foundEntry?.unit).toBe('C');
  });

  // TODO: Add PUT test for updating an entry if needed

  test('DELETE /profiles/{profileId}/trackers/temperature/{entryId} - should delete the temperature entry', async () => {
    if (!testProfileId || !createdEntryId)
      throw new Error(
        'Test setup failed: testProfileId or createdEntryId is null.'
      );

    await apiDelete(
      `/profiles/${testProfileId}/trackers/temperature/${createdEntryId}`
    );

    const getResponse: TemperatureEntry[] = await apiGet(
      `/profiles/${testProfileId}/trackers/temperature`
    );
    const deletedEntry = getResponse.find((e) => e.entryId === createdEntryId);
    expect(deletedEntry).toBeUndefined();

    createdEntryId = null;
  });
});
