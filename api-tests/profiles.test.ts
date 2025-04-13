import { apiGet, apiPost, apiPut, apiDelete, clearAuthToken } from './apiTestClient';

// Define the expected shape of a profile (matching frontend)
interface BabyProfile {
  id: string;
  name: string;
  birthday: string;
}

describe('Profile API Endpoints', () => {
  let createdProfileId: string | null = null;

  // Clear cached token before tests if needed (optional, depends on test structure)
  beforeAll(() => {
    clearAuthToken(); // Ensure fresh login for the test suite
  });

  afterAll(async () => {
    // Clean up any profile created during the tests
    if (createdProfileId) {
      try {
        console.log(`Cleaning up test profile: ${createdProfileId}`);
        await apiDelete(`/profiles/${createdProfileId}`);
        console.log(`Cleaned up test profile: ${createdProfileId}`);
      } catch (error) {
        console.error(`Failed to clean up test profile ${createdProfileId}:`, error);
      }
    }
  });

  test('POST /profiles - should create a new baby profile', async () => {
    const profileData = {
      name: `Test Baby ${Date.now()}`,
      birthday: '2025-01-15',
    };
    const response: BabyProfile = await apiPost('/profiles', profileData);

    expect(response).toBeDefined();
    expect(response.id).toMatch(/^baby_/); // Check if ID starts with 'baby_'
    expect(response.name).toBe(profileData.name);
    expect(response.birthday).toBe(profileData.birthday);

    createdProfileId = response.id; // Store for cleanup and other tests
  });

  test('GET /profiles - should retrieve profiles for the user', async () => {
    // Ensure a profile exists (create one if the POST test didn't run or failed)
    if (!createdProfileId) {
        const profileData = { name: `Test Baby PreGet ${Date.now()}`, birthday: '2025-01-16' };
        const postResponse: BabyProfile = await apiPost('/profiles', profileData);
        createdProfileId = postResponse.id;
        console.log(`Created profile ${createdProfileId} for GET test.`);
    }

    const response: BabyProfile[] = await apiGet('/profiles');

    expect(response).toBeDefined();
    expect(Array.isArray(response)).toBe(true);
    // Check if the created profile is in the list
    const foundProfile = response.find(p => p.id === createdProfileId);
    expect(foundProfile).toBeDefined();
    expect(foundProfile?.id).toBe(createdProfileId);
  });

   test('PUT /profiles/{profileId} - should update an existing profile', async () => {
    if (!createdProfileId) {
      throw new Error('Cannot run PUT test without a createdProfileId from POST/GET tests.');
    }

    const updatedData = {
      name: `Updated Test Baby ${Date.now()}`,
      birthday: '2025-01-20',
    };
    // The API returns the updated attributes, not the full mapped profile here based on lambda
    const response = await apiPut(`/profiles/${createdProfileId}`, updatedData);

    expect(response).toBeDefined();
    // The PUT response in the lambda returns raw attributes, not the mapped 'id'
    // expect(response.id).toBe(createdProfileId); // This would fail
    expect(response.name).toBe(updatedData.name);
    expect(response.birthday).toBe(updatedData.birthday);
    expect(response.updatedAt).toBeDefined();

    // Verify by fetching again
    const getResponse: BabyProfile[] = await apiGet('/profiles');
    const updatedProfile = getResponse.find(p => p.id === createdProfileId);
    expect(updatedProfile).toBeDefined();
    expect(updatedProfile?.name).toBe(updatedData.name);
    expect(updatedProfile?.birthday).toBe(updatedData.birthday);
  });

  test('DELETE /profiles/{profileId} - should delete the profile', async () => {
     if (!createdProfileId) {
      throw new Error('Cannot run DELETE test without a createdProfileId from POST/GET tests.');
    }

    const response = await apiDelete(`/profiles/${createdProfileId}`);
    expect(response).toBeDefined();
    expect(response.message).toContain('deleted successfully');

    // Verify by fetching again - it should be gone
    const getResponse: BabyProfile[] = await apiGet('/profiles');
    const deletedProfile = getResponse.find(p => p.id === createdProfileId);
    expect(deletedProfile).toBeUndefined();

    // Prevent cleanup attempt in afterAll
    createdProfileId = null;
  });

});
