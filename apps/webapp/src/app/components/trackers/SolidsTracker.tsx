import React, { useState, useRef, useEffect, useCallback } from 'react';
import { apiClient } from '../../utils/apiClient';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import { useTrackerLogic } from '../../hooks/useTrackerLogic';
import { useTrackerForm } from '../../hooks/useTrackerForm';

import {
  getCurrentDateTimeLocal,
  formatDateTimeLocalInput,
} from '../../utils/dateUtils';

interface SolidsEntry {
  entryId: string;
  createdAt?: string
  food: string;
  amount?: string;
  reaction?: 'liked' | 'disliked' | 'neutral' | 'allergic';
  notes?: string;
  imageKey?: string;
  babyId: string;
}

type NewSolidsEntryData = Omit<SolidsEntry, 'entryId' | 'babyId'>;

const SolidsTracker: React.FC = () => {
  const validate = () => {
    if (!selectedProfile) return 'No profile selected.';
    if (!createdAt) return 'Time is required.';
    if (!food) return 'Food is required.';
    if (amount && (isNaN(Number(amount)) || Number(amount) <= 0))
      return 'Amount must be a positive number.';
    return null;
  };

  const buildEntryData = (imageKeyOverride?: string) => {
    if (!createdAt || !food) return null;
    return {
      createdAt,
      food,
      amount: amount ? amount : undefined,
      reaction: reaction || undefined,
      notes: notes || undefined,
      imageKey: imageKeyOverride || imageKey || undefined,
    };
  };

  const {
    entries,
    isLoading,
    error: displayError,
    editingEntryId,
    setEditingEntryId,
    selectedProfile,
    profileName,
    fetchEntries,
    handleDeleteEntry: handleDeleteEntryFromHook,
    hasFetchedEmptyData,
  } = useTrackerLogic<SolidsEntry>({ trackerType: 'solids' });

  const [createdAt, setCreatedAt] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  });
  const [food, setFood] = useState('');
  const [amount, setAmount] = useState('');
  const [reaction, setReaction] = useState<
    'liked' | 'disliked' | 'neutral' | 'allergic' | ''
  >('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [logImageUrls, setLogImageUrls] = useState<Record<string, string>>({});

  const resetForm = useCallback(() => {
    setCreatedAt(getCurrentDateTimeLocal());
    setFood('');
    setAmount('');
    setReaction('');
    setNotes('');
    setSelectedFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setEditingEntryId(null);
    setFormError(null);
    setImageKey(undefined);
  }, [setEditingEntryId]);

  useEffect(() => {
    const fetchLogImageUrls = async () => {
      const urls: Record<string, string> = {};
      const promises = entries
        .filter((entry) => entry.imageKey && !logImageUrls[entry.entryId])
        .map(async (entry) => {
          try {
            const getUrlResult = await getUrl({ key: entry.imageKey! });
            urls[entry.entryId] = getUrlResult.url.toString();
          } catch (storageError) {
            console.error(
              `Error fetching URL for image key ${entry.imageKey}:`,
              storageError
            );
          }
        });
      await Promise.all(promises);
      if (Object.keys(urls).length > 0) {
        setLogImageUrls((prevUrls) => ({ ...prevUrls, ...urls }));
      }
    };
    if (entries.length > 0 && !isLoading) {
      fetchLogImageUrls();
    }
  }, [entries, isLoading, logImageUrls]);

  useEffect(() => {
    if (!isLoading && selectedProfile) {
      resetForm();
    }
    if (!isLoading && !selectedProfile) {
      resetForm();
    }
  }, [selectedProfile?.id, isLoading, resetForm]);

  useEffect(() => {
    if (
      selectedProfile &&
      !isLoading &&
      entries.length === 0 &&
      !hasFetchedEmptyData
    ) {
      fetchEntries();
    }
  }, [selectedProfile?.id, isLoading]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
    setImagePreviewUrl(null);
  };

  const handleEditClick = async (entry: SolidsEntry) => {
    setEditingEntryId(entry.entryId);
    setCreatedAt(formatDateTimeLocalInput(entry.createdAt));
    setFood(entry.food);
    setAmount(entry.amount || '');
    setReaction(entry.reaction || '');
    setNotes(entry.notes || '');
    setSelectedFile(null);
    setImageKey(entry.imageKey || undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFormError(null);

    setImagePreviewUrl(null);
    if (entry.imageKey) {
      try {
        const getUrlResult = await getUrl({ key: entry.imageKey });
        setImagePreviewUrl(getUrlResult.url.toString());
      } catch (storageError) {
        console.error('Error fetching image preview URL:', storageError);
      }
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!selectedProfile) return;
    const entryToDelete = entries.find((e) => e.entryId === entryId);
    const imageKeyToDelete = entryToDelete?.imageKey;

    await handleDeleteEntryFromHook(entryId);

    if (imageKeyToDelete) {
      try {
        await remove({ key: imageKeyToDelete });
        console.log(`Deleted S3 object: ${imageKeyToDelete}`);
      } catch (storageError) {
        console.error(
          `Failed to delete S3 object ${imageKeyToDelete}:`,
          storageError
        );
        alert(
          `Entry deleted, but failed to remove associated image: ${storageError}`
        );
      }
    }
  };

  const [imageKey, setImageKey] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !createdAt || !food) return;
    setFormError(null);
    setIsSubmitting(true);
    let newImageKey = imageKey;
    if (selectedFile) {
      try {
        const fileName = `${selectedProfile.id}/solids/${Date.now()}_${
          selectedFile.name
        }`;
        await uploadData({ key: fileName, data: selectedFile });
        newImageKey = fileName;
        setImageKey(fileName);
      } catch (err: unknown) {
        let errorMsg = 'Unknown error';
        if (err instanceof Error) errorMsg = err.message;
        else if (typeof err === 'string') errorMsg = err;
        else
          try {
            errorMsg = JSON.stringify(err);
          } catch {}
        setFormError(errorMsg || 'Failed to upload image.');
        setIsSubmitting(false);
        return;
      }
    }

    const customBuildEntryData = () => buildEntryData(newImageKey);
    try {
      await useTrackerForm<NewSolidsEntryData>({
        editingEntryId,
        setEditingEntryId,
        selectedProfileId: selectedProfile.id,
        trackerType: 'solids',
        fetchEntries,
        buildEntryData: customBuildEntryData,
        validate,
        resetForm,
        apiClient,
      }).handleSubmit(e);
    } catch (err: unknown) {
      let errorMsg = 'Unknown error';
      if (err instanceof Error) errorMsg = err.message;
      else if (typeof err === 'string') errorMsg = err;
      else
        try {
          errorMsg = JSON.stringify(err);
        } catch {}
      setFormError(errorMsg || 'Failed to submit entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !selectedProfile) {
    return <div>Loading profile data...</div>;
  }

  if (displayError && !selectedProfile) {
    return (
      <div style={{ color: 'red' }}>Error loading profiles: {displayError}</div>
    );
  }

  return (
    <div>
      <h2 className="tracker-title">
        Solids Tracker{' '}
        {profileName ? `for ${profileName}` : '(Select Profile...)'}
      </h2>

      {}
      {formError && <p style={{ color: 'red' }}>Error: {formError}</p>}
      {}
      {displayError && !formError && (
        <p style={{ color: 'red' }}>Error: {displayError}</p>
      )}

      {}
      {selectedProfile ? (
        <>
          <section className="section-card">
            <h3>
              {editingEntryId
                ? 'Edit Solid Food Entry'
                : 'Add New Solid Food Entry'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="solidsDate">Date:</label>
                <input
                  type="datetime-local"
                  id="solidsDate"
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="foodItem">Food:</label>
                <input
                  type="text"
                  id="foodItem"
                  value={food}
                  onChange={(e) => setFood(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="foodAmount">Amount (Optional):</label>
                <input
                  type="text"
                  id="foodAmount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="foodReaction">Reaction (Optional):</label>
                <select
                  value={reaction}
                  onChange={(e) => setReaction(e.target.value as any)}
                >
                  <option value="">Select...</option>
                  <option value="liked">Liked</option>
                  <option value="disliked">Disliked</option>
                  <option value="neutral">Neutral</option>
                  <option value="allergic">Allergic Reaction</option>
                </select>
              </div>
              <div>
                <label htmlFor="foodImage">Upload Photo (Optional):</label>
                <input
                  type="file"
                  id="foodImage"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'block', marginTop: '5px' }}
                />
                {selectedFile && (
                  <p className="tracker-log-actions">
                    New file selected: {selectedFile.name}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="solidsNotes">Notes:</label>
                <textarea
                  id="solidsNotes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <button type="submit" disabled={isSubmitting || !selectedProfile}>
                {isSubmitting
                  ? editingEntryId
                    ? 'Updating...'
                    : 'Adding...'
                  : editingEntryId
                  ? 'Update Entry'
                  : 'Add Solids Entry'}
              </button>
              {editingEntryId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="tracker-cancel-btn"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </section>

          <hr />

          <section className="section-card">
            <h3>Solids Log {profileName ? `for ${profileName}` : ''}</h3>
            {isLoading && entries.length === 0 ? (
              <p>Loading log...</p>
            ) : entries.length === 0 && hasFetchedEmptyData ? (
              <p>No solid food entries recorded for this profile yet.</p>
            ) : entries.length === 0 ? (
              <p>Loading log...</p>
            ) : (
              <ul>
                {entries.map((entry) => {
                  let createdAt: Date | null = null;
                  let isDateValid = false;
                  if (entry.createdAt) {
                    createdAt = new Date(entry.createdAt);
                    isDateValid = !isNaN(createdAt.getTime());
                  }
                  const formattedReaction = entry.reaction
                    ? ` - Reaction: ${entry.reaction}`
                    : '';
                  return (
                    <li key={entry.entryId}>
                      <strong>Date:</strong>{' '}
                      {isDateValid && createdAt
                        ? createdAt.toLocaleString(undefined, {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Invalid Time'}
                      {entry.amount && (
                        <>
                          <br /> Amount: {entry.amount}
                        </>
                      )}
                      {entry.reaction && (
                        <>
                          <br /> Reaction: {entry.reaction}
                        </>
                      )}
                      {entry.notes && (
                        <>
                          <br /> Notes: {entry.notes}
                        </>
                      )}
                      {entry.imageKey && (
                        <div className="tracker-log-image">
                          {logImageUrls[entry.entryId] ? (
                            <img
                              src={logImageUrls[entry.entryId]}
                              alt={`Food entry ${entry.food}`}
                              className="tracker-log-image"
                            />
                          ) : (
                            <span>[Loading image...]</span>
                          )}
                        </div>
                      )}
                      <div className="tracker-log-actions">
                        <button
                          onClick={() => handleEditClick(entry)}
                          disabled={
                            isLoading || isSubmitting || !!editingEntryId
                          }
                          className="tracker-action-btn tracker-edit-btn"
                          title="Edit entry"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.entryId)}
                          disabled={
                            isLoading || isSubmitting || !!editingEntryId
                          }
                          className="tracker-action-btn tracker-delete-btn"
                          title="Delete entry"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      ) : (
        <p style={{ color: 'orange' }}>Please select a baby profile first.</p>
      )}
    </div>
  );
};

export default SolidsTracker;
