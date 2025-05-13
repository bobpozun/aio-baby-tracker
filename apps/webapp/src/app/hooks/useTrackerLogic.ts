import { useState, useEffect, useCallback } from 'react';
import { useProfiles, BabyProfile } from '../context/ProfileContext';
import { apiClient } from '../utils/apiClient';

interface BaseTrackerEntry {
  createdAt?: string;
  startDateTime?: string;
  entryId: string;

  date?: string;
}

interface UseTrackerLogicProps {
  trackerType: string;
}

interface UseTrackerLogicReturn<T extends BaseTrackerEntry> {
  entries: T[];
  isLoading: boolean;
  error: string | null;
  editingEntryId: string | null;
  setEditingEntryId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedProfile: BabyProfile | undefined;
  profileName: string | undefined;
  fetchEntries: () => Promise<void>;
  handleDeleteEntry: (entryId: string) => Promise<void>;
  hasFetchedEmptyData: boolean;
}

export function useTrackerLogic<T extends BaseTrackerEntry>({
  trackerType,
}: UseTrackerLogicProps): UseTrackerLogicReturn<T> {
  const {
    selectedProfileId,
    getProfileById,
    isLoading: isContextLoading,
    error: contextError,
  } = useProfiles();

  const [entries, setEntries] = useState<T[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [hasFetchedEmptyData, setHasFetchedEmptyData] =
    useState<boolean>(false);

  const fetchEntries = useCallback(async () => {
    if (!selectedProfileId || isContextLoading) {
      setEntries([]);
      return;
    }
    setIsLoadingEntries(true);
    setLocalError(null);
    try {
      const fetchedEntries = await apiClient.get<T[]>(
        `/profiles/${selectedProfileId}/trackers/${trackerType}`
      );

      const filteredEntries = (fetchedEntries || []).filter(
        (entry) =>
          !('trackerType' in entry) || entry.trackerType === trackerType
      );
      console.log(
        `Fetched ${trackerType} Entries (filtered):`,
        filteredEntries
      );

      const normalizedEntries = (filteredEntries || []).map((entry) => {
        switch (trackerType) {
          case 'nursing':
            if ('durationLeft' in entry || 'durationRight' in entry) {
              return {
                ...entry,
                durationLeft:
                  (entry as any).durationLeft !== undefined
                    ? Number((entry as any).durationLeft)
                    : undefined,
                durationRight:
                  (entry as any).durationRight !== undefined
                    ? Number((entry as any).durationRight)
                    : undefined,
              };
            }
            return entry;
          default:
            return entry;
        }
      });

      const sortedEntries = normalizedEntries.sort((a, b) => {
        const dateA = new Date(
          a.startDateTime ?? a.createdAt ?? a.date ?? 0
        ).getTime();
        const dateB = new Date(
          b.startDateTime ?? b.createdAt ?? b.date ?? 0
        ).getTime();
        return dateB - dateA;
      });

      setEntries(sortedEntries);
      if (sortedEntries.length === 0) {
        setHasFetchedEmptyData(true);
      } else {
        setHasFetchedEmptyData(false);
      }
    } catch (err: unknown) {
      console.error(`Failed to fetch ${trackerType} entries:`, err);
      let errorMsg = 'Unknown error';
      if (err instanceof Error) errorMsg = err.message;
      else if (typeof err === 'string') errorMsg = err;
      else
        try {
          errorMsg = JSON.stringify(err);
        } catch {}
      setLocalError(errorMsg || `Failed to load ${trackerType} entries.`);
      setEntries([]);
      setHasFetchedEmptyData(false);
    } finally {
      setIsLoadingEntries(false);
    }
  }, [selectedProfileId, trackerType, isContextLoading]);

  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      if (!selectedProfileId) return;

      const originalEntries = [...entries];
      setEntries((prevEntries) =>
        prevEntries.filter((entry) => entry.entryId !== entryId)
      );
      setLocalError(null);
      setIsLoadingEntries(true);

      try {
        await apiClient.del(
          `/profiles/${selectedProfileId}/trackers/${trackerType}/${entryId}`
        );
        console.log(`Deleted ${trackerType} entry ${entryId}`);
      } catch (err: unknown) {
        console.error(`Failed to delete ${trackerType} entry ${entryId}:`, err);
        let errorMsg = 'Unknown error';
        if (err instanceof Error) errorMsg = err.message;
        else if (typeof err === 'string') errorMsg = err;
        else
          try {
            errorMsg = JSON.stringify(err);
          } catch {}
        setLocalError(errorMsg || `Failed to delete ${trackerType} entry.`);
        setEntries(originalEntries);
      } finally {
        setIsLoadingEntries(false);
      }
    },
    [selectedProfileId, trackerType, entries]
  );

  const isLoading = isContextLoading || isLoadingEntries;
  const error = localError || contextError;
  const selectedProfile = selectedProfileId
    ? getProfileById(selectedProfileId)
    : undefined;
  const profileName = selectedProfile?.name;

  return {
    entries,
    isLoading,
    error,
    editingEntryId,
    setEditingEntryId,
    selectedProfile,
    profileName,
    fetchEntries,
    handleDeleteEntry,
    hasFetchedEmptyData,
  };
}
