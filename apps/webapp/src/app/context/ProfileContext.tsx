import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
} from 'react';
import { apiClient } from '../utils/apiClient';

// TODO: Replace with actual type from shared-logic later
export interface BabyProfile {
  id: string;
  name: string;
  birthday: string;
}

interface ProfileContextType {
  profiles: BabyProfile[];
  selectedProfileId: string | null;
  addProfile: (name: string, birthday: string) => Promise<void>;
  editProfile: (id: string, name: string, birthday: string) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  selectProfile: (id: string | null) => void;
  getProfileById: (id: string | null) => BabyProfile | undefined;
  isLoading: boolean;
  error: string | null;
  fetchProfiles: () => Promise<void>;
}

export const ProfileContext = createContext<ProfileContextType | undefined>(
  undefined
);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [profiles, setProfiles] = useState<BabyProfile[]>([]);

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const selectProfile = useCallback((id: string | null) => {
    console.log('[ProfileContext selectProfile] Setting selected ID to:', id);
    setSelectedProfileId(id);

    if (id) {
      localStorage.setItem('selectedProfileId', id);
    } else {
      localStorage.removeItem('selectedProfileId');
    }
  }, []);

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log('[ProfileContext fetchProfiles] Starting fetch...');
    let newSelectedId: string | null = null;
    let profilesData: BabyProfile[] = [];

    try {
      const fetchedProfiles = await apiClient.get<BabyProfile[]>('/profiles');
      profilesData = fetchedProfiles || [];
      console.log(
        '[ProfileContext fetchProfiles] Fetched profiles:',
        profilesData
      );

      const persistedId = localStorage.getItem('selectedProfileId');
      console.log(
        '[ProfileContext fetchProfiles] Persisted ID from localStorage:',
        persistedId
      );

      if (persistedId && profilesData.some((p) => p.id === persistedId)) {
        newSelectedId = persistedId;
        console.log(
          '[ProfileContext fetchProfiles] Using valid persisted ID:',
          newSelectedId
        );
      } else if (profilesData.length > 0) {
        newSelectedId = profilesData[0].id;
        console.log(
          '[ProfileContext fetchProfiles] Persisted ID invalid/missing, falling back to first:',
          newSelectedId
        );
        localStorage.setItem('selectedProfileId', newSelectedId);
      } else {
        console.log(
          '[ProfileContext fetchProfiles] No profiles fetched, clearing persisted ID.'
        );
        localStorage.removeItem('selectedProfileId');
        newSelectedId = null;
      }

      console.log('[ProfileContext fetchProfiles] Setting profiles state...');
      setProfiles(profilesData);
      console.log(
        '[ProfileContext fetchProfiles] Setting selectedProfileId state to:',
        newSelectedId
      );
      setSelectedProfileId(newSelectedId);
    } catch (err: unknown) {
      console.error('[ProfileContext fetchProfiles] Failed:', err);
      let errorMsg = 'Unknown error';
      if (err instanceof Error) errorMsg = err.message;
      else if (typeof err === 'string') errorMsg = err;
      else
        try {
          errorMsg = JSON.stringify(err);
        } catch {}
      setError(errorMsg || 'Failed to load profiles.');
      setProfiles([]);
      setSelectedProfileId(null);
      localStorage.removeItem('selectedProfileId');
    } finally {
      setIsLoading(false);
      console.log(
        '[ProfileContext fetchProfiles] Finished, isLoading set to false.'
      );
    }
  }, [selectProfile]);

  useEffect(() => {
    console.log('[ProfileContext useEffect] Mounting, calling fetchProfiles.');
    fetchProfiles();
  }, [fetchProfiles]);

  const addProfile = useCallback(
    async (name: string, birthday: string) => {
      setError(null);
      setIsLoading(true);
      const newProfileData = { name, birthday };

      try {
        const createdProfile = await apiClient.post<BabyProfile>(
          '/profiles',
          newProfileData
        );
        console.log('Added profile via API:', createdProfile);

        await fetchProfiles();

        selectProfile(createdProfile.id);
      } catch (err: unknown) {
        let errorMsg = 'Unknown error';
        if (err instanceof Error) errorMsg = err.message;
        else if (typeof err === 'string') errorMsg = err;
        else
          try {
            errorMsg = JSON.stringify(err);
          } catch {}
        console.error('Failed to add profile:', errorMsg);
        setError(errorMsg || 'Failed to add profile.');
        setIsLoading(false);
      }
    },
    [fetchProfiles, selectProfile]
  );

  const editProfile = useCallback(
    async (id: string, name: string, birthday: string) => {
      setError(null);
      setIsLoading(true);
      const originalProfiles = [...profiles];
      const updatedProfileData = { name, birthday };

      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updatedProfileData } : p))
      );

      try {
        await apiClient.put<BabyProfile>(`/profiles/${id}`, updatedProfileData);
        console.log(`Edited profile ${id} via API`);

        await fetchProfiles();
      } catch (err: unknown) {
        let errorMsg = 'Unknown error';
        if (err instanceof Error) errorMsg = err.message;
        else if (typeof err === 'string') errorMsg = err;
        else
          try {
            errorMsg = JSON.stringify(err);
          } catch {}
        console.error(`Failed to edit profile ${id}:`, errorMsg);
        setError(errorMsg || `Failed to edit profile ${name}.`);

        setProfiles(originalProfiles);
        setIsLoading(false);
      }
    },
    [profiles, fetchProfiles]
  );

  const deleteProfile = useCallback(
    async (id: string) => {
      setError(null);
      setIsLoading(true);
      const originalProfiles = [...profiles];
      const originalSelectedId = selectedProfileId;
      const profileToDelete = profiles.find((p) => p.id === id);

      const remainingProfiles = originalProfiles.filter((p) => p.id !== id);
      setProfiles(remainingProfiles);

      if (originalSelectedId === id) {
        const newSelectedId = remainingProfiles[0]?.id || null;
        selectProfile(newSelectedId);
      }

      try {
        await apiClient.del(`/profiles/${id}`);
        console.log(`Deleted profile ${id} via API`);

        await fetchProfiles();
      } catch (err: unknown) {
        let errorMsg = 'Unknown error';
        if (err instanceof Error) errorMsg = err.message;
        else if (typeof err === 'string') errorMsg = err;
        else
          try {
            errorMsg = JSON.stringify(err);
          } catch {}
        console.error(`Failed to delete profile ${id}:`, errorMsg);
        setError(
          errorMsg ||
            `Failed to delete profile "${profileToDelete?.name}". Try again.`
        );

        setProfiles(originalProfiles);
        selectProfile(originalSelectedId);
        setIsLoading(false);
      }
    },
    [profiles, selectedProfileId, fetchProfiles, selectProfile]
  );

  const getProfileById = useCallback(
    (id: string | null): BabyProfile | undefined => {
      console.log(
        `[ProfileContext getProfileById] Looking for ID: ${id} in profiles:`,
        profiles
      );
      if (!id) return undefined;

      const profile = profiles.find((p) => p.id === id);
      console.log(`[ProfileContext getProfileById] Found profile:`, profile);
      return profile;
    },
    [profiles]
  );

  const value = {
    profiles,
    selectedProfileId,
    addProfile,
    editProfile,
    deleteProfile,
    selectProfile,
    getProfileById,
    isLoading,
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
