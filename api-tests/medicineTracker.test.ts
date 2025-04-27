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

interface MedicineEntry {
  entryId: string;
  time: string;
  medicineName: string;
  dosage?: string;
  notes?: string;
  babyId: string;
  trackerType: 'medicine';
  createdAt: string;
}

describe('Medicine Tracker API Endpoints', () => {
  let testProfileId: string | null = null;
  let createdEntryId: string | null = null;

  beforeAll(async () => {
    clearAuthToken();
    const profileData = {
      name: `MedicineTest Baby ${Date.now()}`,
      birthday: '2025-02-06',
    };
    try {
      const response: BabyProfile = await apiPost('/profiles', profileData);
      testProfileId = response.id;
      console.log(`Created test profile for medicine tests: ${testProfileId}`);
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

  test('POST /profiles/{profileId}/trackers/medicine - should create a new medicine entry', async () => {
    if (!testProfileId)
      throw new Error('Test setup failed: testProfileId is null.');

    const entryData = {
      time: new Date().toISOString(),
      medicineName: 'Infant Tylenol',
      dosage: '1.25 ml',
      notes: 'For teething',
    };

    const response: MedicineEntry = await apiPost(
      `/profiles/${testProfileId}/trackers/medicine`,
      entryData
    );

    expect(response).toBeDefined();
    expect(response.entryId).toMatch(/^medicine_/);
    expect(response.babyId).toBe(testProfileId);
    expect(response.trackerType).toBe('medicine');
    expect(response.time).toBe(entryData.time);
    expect(response.medicineName).toBe(entryData.medicineName);
    expect(response.dosage).toBe(entryData.dosage);
    expect(response.notes).toBe(entryData.notes);
    expect(response.createdAt).toBeDefined();

    createdEntryId = response.entryId;
  });

  test('GET /profiles/{profileId}/trackers/medicine - should retrieve medicine entries for the profile', async () => {
    if (!testProfileId || !createdEntryId)
      throw new Error(
        'Test setup failed: testProfileId or createdEntryId is null.'
      );

    const response: MedicineEntry[] = await apiGet(
      `/profiles/${testProfileId}/trackers/medicine`
    );

    expect(response).toBeDefined();
    expect(Array.isArray(response)).toBe(true);
    expect(response.length).toBeGreaterThanOrEqual(1);

    const foundEntry = response.find((e) => e.entryId === createdEntryId);
    expect(foundEntry).toBeDefined();
    expect(foundEntry?.babyId).toBe(testProfileId);
    expect(foundEntry?.trackerType).toBe('medicine');
    expect(foundEntry?.medicineName).toBe('Infant Tylenol');
    expect(foundEntry?.dosage).toBe('1.25 ml');
  });

  // TODO: Add PUT test for updating an entry if needed

  test('DELETE /profiles/{profileId}/trackers/medicine/{entryId} - should delete the medicine entry', async () => {
    if (!testProfileId || !createdEntryId)
      throw new Error(
        'Test setup failed: testProfileId or createdEntryId is null.'
      );

    await apiDelete(
      `/profiles/${testProfileId}/trackers/medicine/${createdEntryId}`
    );

    const getResponse: MedicineEntry[] = await apiGet(
      `/profiles/${testProfileId}/trackers/medicine`
    );
    const deletedEntry = getResponse.find((e) => e.entryId === createdEntryId);
    expect(deletedEntry).toBeUndefined();

    createdEntryId = null;
  });
});
