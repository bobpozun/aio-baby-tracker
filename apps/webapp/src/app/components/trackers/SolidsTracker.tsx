import React, { useState, useRef, useEffect, useCallback } from 'react';
import { apiClient } from '../../utils/apiClient';
import { uploadData, getUrl, remove } from 'aws-amplify/storage'; // Import Storage functions
import { useTrackerLogic } from '../../hooks/useTrackerLogic'; // Import the custom hook
// Import date utils
import {
  getCurrentDateTimeLocal,
  formatDateTimeLocalInput,
} from '../../utils/dateUtils';

// Interface remains specific to this tracker
interface SolidsEntry {
  entryId: string;
  time: string;
  food: string;
  amount?: string;
  reaction?: 'liked' | 'disliked' | 'neutral' | 'allergic';
  notes?: string;
  imageKey?: string; // S3 key
  babyId: string;
}

// Define the structure for the data part of a new entry
type NewSolidsEntryData = Omit<SolidsEntry, 'entryId' | 'babyId'>;

const SolidsTracker: React.FC = () => {
  // Use the custom hook for shared logic
  const {
    entries,
    isLoading, // Combined loading state from hook
    error: displayError, // Combined error state from hook
    editingEntryId,
    setEditingEntryId,
    selectedProfile, // Get the actual profile object
    profileName,
    fetchEntries, // Get fetch function from hook
    handleDeleteEntry: handleDeleteEntryFromHook, // Get delete function from hook (rename to avoid conflict)
  } = useTrackerLogic<SolidsEntry>({ trackerType: 'solids' });

  // Keep component-specific form state
  const [time, setTime] = useState(getCurrentDateTimeLocal());
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
  const [isSubmitting, setIsSubmitting] = useState(false); // Local state for submit loading
  const [formError, setFormError] = useState<string | null>(null); // Local error state specifically for the form

  // Function to reset form fields
  const resetForm = useCallback(() => {
    console.log('SolidsTracker: resetForm called');
    setTime(getCurrentDateTimeLocal());
    setFood('');
    setAmount('');
    setReaction('');
    setNotes('');
    setSelectedFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setEditingEntryId(null); // Use setter from hook
    setFormError(null);
  }, [setEditingEntryId]);

  // Fetch image URLs for the log when entries change
  useEffect(() => {
    const fetchLogImageUrls = async () => {
      const urls: Record<string, string> = {};
      const promises = entries
        .filter(entry => entry.imageKey && !logImageUrls[entry.entryId])
        .map(async (entry) => {
          try {
            const getUrlResult = await getUrl({ key: entry.imageKey! });
            urls[entry.entryId] = getUrlResult.url.toString();
          } catch (storageError) {
            console.error(`Error fetching URL for image key ${entry.imageKey}:`, storageError);
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

  // Effect to reset form when selected profile changes (after loading)
   useEffect(() => {
    if (!isLoading && selectedProfile) {
        resetForm();
    }
     if (!isLoading && !selectedProfile) {
        resetForm();
    }
  }, [selectedProfile?.id, isLoading, resetForm]);

   // Effect to fetch entries when selected profile changes (after loading)
   useEffect(() => {
    if (selectedProfile && !isLoading) {
      console.log(`SolidsTracker: Fetching entries for profile ${selectedProfile.id}`);
      fetchEntries();
    }
  }, [selectedProfile?.id, isLoading, fetchEntries]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
    setImagePreviewUrl(null);
  };

  // Function to set the form state for editing an entry
  const handleEditClick = async (entry: SolidsEntry) => {
    setEditingEntryId(entry.entryId); // Use setter from hook
    setTime(formatDateTimeLocalInput(entry.time));
    setFood(entry.food);
    setAmount(entry.amount || '');
    setReaction(entry.reaction || '');
    setNotes(entry.notes || '');
    setSelectedFile(null);
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

  // Override delete handler to include S3 object deletion
  const handleDeleteEntry = async (entryId: string) => {
    if (!selectedProfile) return;
    const entryToDelete = entries.find((e) => e.entryId === entryId);
    const imageKeyToDelete = entryToDelete?.imageKey;

    // Call the hook's delete function first (handles optimistic UI and DB delete)
    await handleDeleteEntryFromHook(entryId);

    // If DB delete was likely successful (no immediate error rollback), delete S3 object
    if (imageKeyToDelete) {
      try {
        await remove({ key: imageKeyToDelete });
        console.log(`Deleted S3 object: ${imageKeyToDelete}`);
      } catch (storageError) {
        console.error(`Failed to delete S3 object ${imageKeyToDelete}:`, storageError);
        alert(`Entry deleted, but failed to remove associated image: ${storageError}`);
      }
    }
  };


  // Component-specific submit logic including image upload
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !time || !food) return; // Check selectedProfile from hook
    setFormError(null);
    setIsSubmitting(true);

    let imageKey: string | undefined = undefined;
    const entryToUpdate = editingEntryId
      ? entries.find((e) => e.entryId === editingEntryId)
      : undefined;

    if (selectedFile) {
      const key = `solids/${selectedProfile.id}/${Date.now()}-${selectedFile.name}`;
      try {
        console.log(`Uploading ${key}...`);
        const uploadResult = await uploadData({ key: key, data: selectedFile }).result;
        imageKey = uploadResult.key;
        console.log(`Successfully uploaded ${imageKey}`);
        if (entryToUpdate?.imageKey && entryToUpdate.imageKey !== imageKey) {
          try {
            console.log(`Deleting old image: ${entryToUpdate.imageKey}`);
            await remove({ key: entryToUpdate.imageKey });
          } catch (removeError) {
            console.error(`Failed to delete old S3 object ${entryToUpdate.imageKey}:`, removeError);
          }
        }
      } catch (uploadError) {
        console.error('Failed to upload image:', uploadError);
        setFormError('Failed to upload image. Please try again.');
        setIsSubmitting(false);
        return;
      }
    } else if (editingEntryId && entryToUpdate) {
      imageKey = entryToUpdate.imageKey;
    }

    const entryData: NewSolidsEntryData = {
      time: new Date(time).toISOString(),
      food: food,
      amount: amount || undefined,
      reaction: reaction || undefined,
      notes: notes || undefined,
      imageKey: imageKey,
    };

    try {
      const endpoint = `/profiles/${selectedProfile.id}/trackers/solids`;
      if (editingEntryId) {
        await apiClient.put<SolidsEntry>(`${endpoint}/${editingEntryId}`, entryData);
        console.log(`Updated solids entry ${editingEntryId}`);
      } else {
        await apiClient.post<SolidsEntry>(endpoint, entryData);
        console.log('Added new solids entry');
      }
      await fetchEntries(); // Refetch using function from hook
      resetForm();
    } catch (err: any) {
      const action = editingEntryId ? 'update' : 'save';
      console.error(`Failed to ${action} solids entry:`, err);
      setFormError(err.message || `Failed to ${action} solids entry.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use combined loading state from hook for initial loading display
  if (isLoading && !selectedProfile) {
    return <div>Loading profile data...</div>;
  }

  // Use combined error state from hook for context errors
  if (displayError && !selectedProfile) {
     return <div style={{ color: 'red' }}>Error loading profiles: {displayError}</div>;
  }

  return (
    <div>
      <h2>
        Solids Tracker {profileName ? `for ${profileName}` : '(Select Profile...)'}
      </h2>

      {/* Display form-specific errors */}
      {formError && <p style={{ color: 'red' }}>Error: {formError}</p>}
      {/* Display context/fetch errors if not form-related */}
      {displayError && !formError && <p style={{ color: 'red' }}>Error: {displayError}</p>}

      {/* Render sections only if a profile is selected */}
      {selectedProfile ? (
        <>
          <section>
            <h3>
              {editingEntryId
                ? 'Edit Solid Food Entry'
                : 'Add New Solid Food Entry'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="solidsTime">Time:</label>
                <input
                  type="datetime-local"
                  id="solidsTime"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
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
                />
                {editingEntryId && imagePreviewUrl && !selectedFile && (
                  <div style={{ marginTop: '5px' }}>
                    <p>Current Image:</p>
                    <img
                      src={imagePreviewUrl}
                      alt="Current food"
                      style={{ maxWidth: '100px', maxHeight: '100px' }}
                    />
                    {/* Add a button to remove image? */}
                  </div>
                )}
                {selectedFile && (
                  <p style={{ marginTop: '5px' }}>
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
                  style={{ marginLeft: '10px' }}
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </section>

          <hr />

          <section>
            <h3>
              Solids Log {profileName ? `for ${profileName}` : ''}
            </h3>
             {/* Use combined isLoading for log loading state */}
            {isLoading && entries.length === 0 ? (
              <p>Loading log...</p>
            ) : entries.length === 0 ? (
              <p>No solid food entries recorded for this profile yet.</p>
            ) : (
              <ul>
                {entries.map((entry) => {
                    const entryDate = new Date(entry.time);
                    const isDateValid = !isNaN(entryDate.getTime());
                    // Safely format reaction
                    const formattedReaction = entry.reaction ? ` - Reaction: ${entry.reaction}` : '';
                    return (
                      <li key={entry.entryId}>
                        <strong>{entry.food}</strong>{' '}
                        {entry.amount ? `(${entry.amount})` : ''}
                        {formattedReaction}
                        <br />
                        Time: {isDateValid ? entryDate.toLocaleString() : 'Invalid Date'}
                        {entry.imageKey && (
                          <div style={{ marginTop: '5px' }}>
                            {logImageUrls[entry.entryId] ? (
                              <img
                                src={logImageUrls[entry.entryId]}
                                alt={`Food entry ${entry.food}`}
                                style={{
                                  maxWidth: '100px',
                                  maxHeight: '100px',
                                  display: 'block',
                                }}
                              />
                            ) : (
                              <span>[Loading image...]</span>
                            )}
                          </div>
                        )}
                        {entry.notes && (
                          <>
                            <br />
                            Notes: {entry.notes}
                          </>
                        )}
                        <div style={{ marginTop: '5px' }}>
                          <button
                            onClick={() => handleEditClick(entry)}
                            disabled={isLoading || isSubmitting || !!editingEntryId}
                            style={{
                              marginRight: '10px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px 5px',
                              color: 'var(--primary-color)',
                            }}
                            title="Edit entry"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.entryId)}
                            disabled={isLoading || isSubmitting || !!editingEntryId}
                            style={{
                              marginLeft: '10px',
                              color: 'red',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px 5px',
                            }}
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
         // Message when no profile is selected (after loading is complete)
         <p style={{ color: 'orange' }}>Please select a baby profile first.</p>
      )}
    </div>
  );
};

export default SolidsTracker;
