import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
} from 'react';
import { apiClient } from '../utils/apiClient'; // Import the API client

// TODO: Replace with actual type from shared-logic later
export interface BabyProfile {
  id: string;
  name: string;
  birthday: string; // YYYY-MM-DD
}

interface ProfileContextType {
  profiles: BabyProfile[];
  selectedProfileId: string | null;
  addProfile: (name: string, birthday: string) => Promise<void>; // Return promise
  editProfile: (id: string, name: string, birthday: string) => Promise<void>; // Return promise
  deleteProfile: (id: string) => Promise<void>; // Return promise
  selectProfile: (id: string | null) => void;
  getProfileById: (id: string | null) => BabyProfile | undefined;
  isLoading: boolean; // Add loading state
  error: string | null; // Add error state
  fetchProfiles: () => Promise<void>; // Add explicit fetch function
}

export const ProfileContext = createContext<ProfileContextType | undefined>(
  undefined
); // Export the context

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [profiles, setProfiles] = useState<BabyProfile[]>([]);
  // Initialize selectedProfileId to null, it will be set after fetching
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading initially
  const [error, setError] = useState<string | null>(null);

  // Define selectProfile first as other callbacks might use it
   const selectProfile = useCallback((id: string | null) => {
    console.log('[ProfileContext selectProfile] Setting selected ID to:', id);
    setSelectedProfileId(id); // Update state
    // Persist selection to localStorage
    if (id) {
      localStorage.setItem('selectedProfileId', id);
    } else {
      localStorage.removeItem('selectedProfileId');
    }
  }, []); // Empty dependency array means this function reference is stable

  const fetchProfiles = useCallback(async () => {
    // Don't reset selectedProfileId here initially
    setIsLoading(true); // Set loading true at the very start
    setError(null);
    console.log('[ProfileContext fetchProfiles] Starting fetch...');
    let newSelectedId: string | null = null;
    let profilesData: BabyProfile[] = []; // Define profilesData outside try block

    try {
      const fetchedProfiles = await apiClient.get<BabyProfile[]>('/profiles');
      profilesData = fetchedProfiles || []; // Assign fetched data
      console.log('[ProfileContext fetchProfiles] Fetched profiles:', profilesData);

      // Determine selected ID *after* fetching
      const persistedId = localStorage.getItem('selectedProfileId');
      console.log('[ProfileContext fetchProfiles] Persisted ID from localStorage:', persistedId);

      if (persistedId && profilesData.some(p => p.id === persistedId)) {
        newSelectedId = persistedId;
        console.log('[ProfileContext fetchProfiles] Using valid persisted ID:', newSelectedId);
      } else if (profilesData.length > 0) {
        newSelectedId = profilesData[0].id;
        console.log('[ProfileContext fetchProfiles] Persisted ID invalid/missing, falling back to first:', newSelectedId);
        localStorage.setItem('selectedProfileId', newSelectedId); // Update storage with new default
      } else {
         console.log('[ProfileContext fetchProfiles] No profiles fetched, clearing persisted ID.');
         localStorage.removeItem('selectedProfileId');
         newSelectedId = null;
      }

      // Set state *after* all logic is done
      console.log('[ProfileContext fetchProfiles] Setting profiles state...');
      setProfiles(profilesData);
      console.log('[ProfileContext fetchProfiles] Setting selectedProfileId state to:', newSelectedId);
      setSelectedProfileId(newSelectedId);

    } catch (err: any) {
      console.error('[ProfileContext fetchProfiles] Failed:', err);
      setError(err.message || 'Failed to load profiles.');
      setProfiles([]); // Clear profiles on error
      setSelectedProfileId(null); // Clear selection on error
      localStorage.removeItem('selectedProfileId'); // Clear storage on error
    } finally {
      // Set loading false as the very last step
      setIsLoading(false);
      console.log('[ProfileContext fetchProfiles] Finished, isLoading set to false.');
    }
  }, [selectProfile]); // Add selectProfile dependency here? No, selectProfile is stable.

  // Fetch profiles on initial mount
  useEffect(() => {
    console.log('[ProfileContext useEffect] Mounting, calling fetchProfiles.');
    fetchProfiles();
  }, [fetchProfiles]); // fetchProfiles is stable due to useCallback([])

  const addProfile = useCallback(
    async (name: string, birthday: string) => {
      setError(null);
      setIsLoading(true); // Indicate loading
      const newProfileData = { name, birthday };

      try {
        const createdProfile = await apiClient.post<BabyProfile>(
          '/profiles',
          newProfileData
        );
        console.log('Added profile via API:', createdProfile);
        // Refetch profiles to get the updated list and handle selection logic
        // fetchProfiles will set isLoading=false in its finally block
        await fetchProfiles();
        // Explicitly select the newly added profile *after* refetching
        selectProfile(createdProfile.id); // This updates state and localStorage
      } catch (err: any) {
        console.error('Failed to add profile:', err);
        setError(err.message || 'Failed to add profile.');
        setIsLoading(false); // Ensure loading stops on error if fetchProfiles wasn't called/completed
      }
    },
    [fetchProfiles, selectProfile] // Depend on fetchProfiles and selectProfile
  );

  const editProfile = useCallback(
    async (id: string, name: string, birthday: string) => {
      setError(null);
      setIsLoading(true); // Indicate loading for the whole operation
      const originalProfiles = [...profiles]; // Create a shallow copy for rollback
      const updatedProfileData = { name, birthday };

      // Optimistic UI update (optional but improves UX)
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updatedProfileData } : p))
      );

      try {
        await apiClient.put<BabyProfile>(
          `/profiles/${id}`,
          updatedProfileData
        );
        console.log(`Edited profile ${id} via API`);
        // Refetch to confirm update and ensure consistency
        await fetchProfiles(); // This will set loading false in its finally block
      } catch (err: any) {
        console.error(`Failed to edit profile ${id}:`, err);
        setError(err.message || `Failed to edit profile ${name}.`);
        // Rollback optimistic update
        setProfiles(originalProfiles);
        setIsLoading(false); // Stop loading on error
      }
    },
    [profiles, fetchProfiles] // Depend on profiles for rollback, fetchProfiles for update
  );

  const deleteProfile = useCallback(
    async (id: string) => {
      setError(null);
      setIsLoading(true); // Indicate loading for the whole operation
      const originalProfiles = [...profiles]; // Shallow copy for rollback
      const originalSelectedId = selectedProfileId; // Store original selection
      const profileToDelete = profiles.find((p) => p.id === id);

      // Optimistic UI update
      const remainingProfiles = originalProfiles.filter((p) => p.id !== id);
      setProfiles(remainingProfiles);

      // Optimistically update selection if the deleted one was selected
      if (originalSelectedId === id) {
        const newSelectedId = remainingProfiles[0]?.id || null;
        selectProfile(newSelectedId); // Use selectProfile to update state & localStorage
      }

      try {
        await apiClient.del(`/profiles/${id}`);
        console.log(`Deleted profile ${id} via API`);
        // If successful, the optimistic update is correct. Refetch for absolute consistency.
        await fetchProfiles(); // This will set loading false in its finally block
      } catch (err: any) {
        console.error(`Failed to delete profile ${id}:`, err);
        setError(
          err.message ||
            `Failed to delete profile ${profileToDelete?.name || id}.`
        );
        // Rollback optimistic update requires restoring profiles *and* selection
        setProfiles(originalProfiles);
        selectProfile(originalSelectedId); // Restore original selection state & localStorage
        setIsLoading(false); // Stop loading on error
      }
    },
    [profiles, selectedProfileId, fetchProfiles, selectProfile] // Add selectProfile dependency
  );

  const getProfileById = useCallback(
    (id: string | null): BabyProfile | undefined => {
      console.log(`[ProfileContext getProfileById] Looking for ID: ${id} in profiles:`, profiles);
      if (!id) return undefined;
      // Ensure profiles array is used for lookup
      const profile = profiles.find((p) => p.id === id);
      console.log(`[ProfileContext getProfileById] Found profile:`, profile);
      return profile;
    },
    [profiles] // Depend only on profiles array
  );

  const value = {
    profiles,
    selectedProfileId,
    addProfile,
    editProfile,
    deleteProfile,
    selectProfile,
    getProfileById,
    isLoading, // Use the main isLoading state
    error,
    fetchProfiles,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};

export const useProfiles = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfiles must be used within a ProfileProvider');
  }
  return context;
};
