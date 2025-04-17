import { useState, useEffect, useCallback } from 'react';
import { useProfiles, BabyProfile } from '../context/ProfileContext';
import { apiClient } from '../utils/apiClient';

// Generic type for any tracker entry (adjust as needed if common fields differ significantly)
// We might need a more sophisticated generic approach later if entry structures vary widely.
// Define a base interface for common tracker entry properties
interface BaseTrackerEntry {
  entryId: string;
  time?: string; // Used by most trackers for sorting
  date?: string; // Used by Growth tracker for sorting
  // Add other potentially common fields if needed, e.g., babyId
}

interface UseTrackerLogicProps {
  trackerType: string;
}

// Constrain the generic T to ensure it has at least the base properties
interface UseTrackerLogicReturn<T extends BaseTrackerEntry> {
  entries: T[];
  isLoading: boolean; // Combined loading state (context + local fetch)
  error: string | null; // Combined error state
  editingEntryId: string | null;
  setEditingEntryId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedProfile: BabyProfile | undefined;
  profileName: string | undefined;
  fetchEntries: () => Promise<void>;
  handleDeleteEntry: (entryId: string) => Promise<void>;
  hasFetchedEmptyData: boolean;
  // Add generic add/update handlers later if needed
}

export function useTrackerLogic<T extends BaseTrackerEntry>({ // Use BaseTrackerEntry constraint here
  trackerType,
}: UseTrackerLogicProps): UseTrackerLogicReturn<T> {
  const {
    selectedProfileId,
    getProfileById,
    isLoading: isContextLoading,
    error: contextError,
  } = useProfiles();

  const [entries, setEntries] = useState<T[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState<boolean>(false); // Local loading for fetching entries
  const [localError, setLocalError] = useState<string | null>(null); // Local error for component actions
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [hasFetchedEmptyData, setHasFetchedEmptyData] = useState<boolean>(false);

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
      // Filter entries by trackerType if present
      const filteredEntries = (fetchedEntries || []).filter(
        entry => !('trackerType' in entry) || entry.trackerType === trackerType
      );
      console.log(`Fetched ${trackerType} Entries (filtered):`, filteredEntries);

      // Basic sorting assuming a 'time' or 'date' field exists - might need adjustment
      const sortedEntries = (filteredEntries || []).sort((a, b) => {
         const dateA = new Date(a.time || a.date || 0).getTime();
         const dateB = new Date(b.time || b.date || 0).getTime();
         return dateB - dateA; // Descending
      });

      setEntries(sortedEntries);
      if (sortedEntries.length === 0) {
        setHasFetchedEmptyData(true);
      } else {
        setHasFetchedEmptyData(false);
      }
    } catch (err: any) {
      console.error(`Failed to fetch ${trackerType} entries:`, err);
      setLocalError(err.message || `Failed to load ${trackerType} entries.`);
      setEntries([]);
      setHasFetchedEmptyData(false);
    } finally {
      setIsLoadingEntries(false);
    }
  }, [selectedProfileId, trackerType, isContextLoading]); // Only depend on truly relevant values

  const handleDeleteEntry = useCallback(async (entryId: string) => {
    if (!selectedProfileId) return;

    const originalEntries = [...entries]; // Use spread for shallow copy
    setEntries((prevEntries) =>
      prevEntries.filter((entry) => entry.entryId !== entryId)
    );
    setLocalError(null);
    setIsLoadingEntries(true); // Indicate activity might affect the list

    try {
      await apiClient.del(
        `/profiles/${selectedProfileId}/trackers/${trackerType}/${entryId}`
      );
      console.log(`Deleted ${trackerType} entry ${entryId}`);
      // Optimistic update succeeded, no state change needed here
    } catch (err: any) {
      console.error(`Failed to delete ${trackerType} entry ${entryId}:`, err);
      setLocalError(err.message || `Failed to delete ${trackerType} entry.`);
      setEntries(originalEntries); // Rollback
    } finally {
        setIsLoadingEntries(false);
    }
  }, [selectedProfileId, trackerType, entries]); // Need entries for rollback

  // Recalculate derived state based on context and local state
  const isLoading = isContextLoading || isLoadingEntries;
  const error = localError || contextError;
  const selectedProfile = selectedProfileId ? getProfileById(selectedProfileId) : undefined;
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
