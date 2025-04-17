import { useState } from 'react';

interface UseTrackerFormOptions<T> {
  editingEntryId: string | null;
  setEditingEntryId: (id: string | null) => void;
  selectedProfileId: string | undefined;
  trackerType: string;
  fetchEntries: () => Promise<void>;
  buildEntryData: () => T | null; // returns null if invalid
  validate: () => string | null; // returns error string if invalid, null if valid
  resetForm: () => void;
  apiClient: {
    post: <R>(url: string, data: any) => Promise<R>;
    put: <R>(url: string, data: any) => Promise<R>;
  };
}

export function useTrackerForm<T>({
  editingEntryId,
  setEditingEntryId,
  selectedProfileId,
  trackerType,
  fetchEntries,
  buildEntryData,
  validate,
  resetForm,
  apiClient,
}: UseTrackerFormOptions<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedProfileId) {
      setFormError('No profile selected.');
      return;
    }
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    const entryData = buildEntryData();
    if (!entryData) {
      setFormError('Invalid form data.');
      return;
    }
    setIsSubmitting(true);
    try {
      const endpoint = `/profiles/${selectedProfileId}/trackers/${trackerType}`;
      if (editingEntryId) {
        await apiClient.put(`${endpoint}/${editingEntryId}`, entryData);
      } else {
        await apiClient.post(endpoint, entryData);
      }
      await fetchEntries();
      resetForm();
      setEditingEntryId(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    formError,
    handleSubmit,
    setFormError,
  };
}
