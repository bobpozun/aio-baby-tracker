import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../utils/apiClient';
import { useTrackerLogic } from '../../hooks/useTrackerLogic'; // Import the custom hook
// Import date utils
import {
  getCurrentDateTimeLocal,
  formatDateTimeLocalInput,
  calculateDuration,
} from '../../utils/dateUtils';

// Interface remains specific to this tracker
interface SleepEntry {
  entryId: string;
  startTime: string;
  endTime: string;
  notes?: string;
  babyId: string;
}

// Define the structure for the data part of a new entry
type NewSleepEntryData = Omit<SleepEntry, 'entryId' | 'babyId'>;


const SleepTracker: React.FC = () => {
  // Use the custom hook for shared logic
  const {
    entries,
    isLoading, // Combined loading state from hook
    error: displayError, // Combined error state from hook (renamed to avoid conflict)
    editingEntryId,
    setEditingEntryId,
    selectedProfile, // Get the actual profile object
    profileName,
    fetchEntries, // Get fetch function from hook
    handleDeleteEntry, // Get delete function from hook
    hasFetchedEmptyData,
  } = useTrackerLogic<SleepEntry>({ trackerType: 'sleep' });

  // Keep component-specific form state
  const [startTime, setStartTime] = useState(getCurrentDateTimeLocal());
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Local state for submit loading
  const [formError, setFormError] = useState<string | null>(null); // Local error state specifically for the form

  // Function to reset form fields (still needed locally)
  const resetForm = useCallback(() => {
    console.log('SleepTracker: resetForm called');
    setStartTime(getCurrentDateTimeLocal());
    setEndTime('');
    setNotes('');
    setEditingEntryId(null); // Use setter from hook
    setFormError(null); // Clear form error on reset
  }, [setEditingEntryId]); // setEditingEntryId is stable

  // Effect to reset form when selected profile changes (after loading)
   useEffect(() => {
    // Only reset form if the context is not loading and a profile is selected or becomes null
    if (!isLoading) {
        console.log(`SleepTracker: Profile or loading changed (isLoading: ${isLoading}, selectedProfile: ${selectedProfile?.id}). Resetting form.`);
        resetForm();
    }
  }, [selectedProfile?.id, isLoading, resetForm]); // Depend on profile ID and context loading state

  // Effect to fetch entries when selected profile changes (after loading)
  useEffect(() => {
    if (selectedProfile && !isLoading && !hasFetchedEmptyData) {
      console.log(`SleepTracker: Fetching entries for profile ${selectedProfile.id}`);
      fetchEntries();
    } else if (!isLoading) {
      // Clear entries if no profile selected after loading finishes
      // setEntries([]); // This is handled within the hook now
      console.log('SleepTracker: No profile selected or still loading, ensuring entries are clear (hook handles this).');
    }
  }, [selectedProfile?.id, isLoading, fetchEntries, hasFetchedEmptyData]);


  // Function to set the form state for editing an entry (still needed locally)
  const handleEditClick = (entry: SleepEntry) => {
    setEditingEntryId(entry.entryId); // Use setter from hook
    setStartTime(formatDateTimeLocalInput(entry.startTime));
    setEndTime(formatDateTimeLocalInput(entry.endTime));
    setNotes(entry.notes || '');
    setFormError(null); // Clear form error when starting edit
  };

  // Component-specific submit logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !startTime || !endTime) return; // Check selectedProfile from hook
    if (new Date(endTime) <= new Date(startTime)) {
      setFormError('End time must be after start time.'); // Set local form error
      return;
    }
    setFormError(null); // Clear form error

    const entryData: NewSleepEntryData = {
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      notes: notes || undefined,
    };

    setIsSubmitting(true); // Use local submitting state

    try {
      const endpoint = `/profiles/${selectedProfile.id}/trackers/sleep`;
      if (editingEntryId) {
        await apiClient.put<SleepEntry>(`${endpoint}/${editingEntryId}`, entryData);
        console.log(`Updated sleep entry ${editingEntryId}`);
      } else {
        await apiClient.post<SleepEntry>(endpoint, entryData);
        console.log('Added new sleep entry');
      }
      await fetchEntries(); // Refetch using function from hook
      resetForm();
    } catch (err: any) {
      const action = editingEntryId ? 'update' : 'save';
      console.error(`Failed to ${action} sleep entry:`, err);
      setFormError(err.message || `Failed to ${action} sleep entry.`); // Set local form error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use combined loading state from hook for initial loading display
  if (isLoading && !selectedProfile) { // Show loading only if profile isn't loaded yet
    return <div>Loading profile data...</div>;
  }

  // Use combined error state from hook for context errors
  if (displayError && !selectedProfile) { // Show context error prominently if it prevented profile loading/selection
     return <div style={{ color: 'red' }}>Error loading profiles: {displayError}</div>;
  }

  return (
    <div>
      <h2>
        Sleep Tracker {profileName ? `for ${profileName}` : '(Select Profile...)'}
      </h2>

      {/* Display form-specific errors */}
      {formError && <p style={{ color: 'red' }}>Error: {formError}</p>}
      {/* Display context/fetch errors if not form-related */}
      {displayError && !formError && <p style={{ color: 'red' }}>Error: {displayError}</p>}


      {/* Render sections only if a profile is selected */}
      {selectedProfile ? (
        <>
          <section>
            <h3>{editingEntryId ? 'Edit Sleep Entry' : 'Add New Sleep Entry'}</h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="startTime">Start Time:</label>
                <input
                  type="datetime-local"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="endTime">End Time:</label>
                <input
                  type="datetime-local"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="sleepNotes">Notes:</label>
                <textarea
                  id="sleepNotes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              {/* Use local isSubmitting state for submit button */}
              <button type="submit" disabled={isSubmitting || !selectedProfile}>
                {isSubmitting
                  ? editingEntryId
                    ? 'Updating...'
                    : 'Adding...'
                  : editingEntryId
                  ? 'Update Entry'
                  : 'Add Sleep Entry'}
              </button>
              {editingEntryId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting} // Disable during submission
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
              Sleep Log {profileName ? `for ${profileName}` : ''}
            </h3>
            {/* Use combined isLoading for log loading state */}
            {isLoading && entries.length === 0 ? (
              <p>Loading log...</p>
            ) : entries.length === 0 ? (
              <p>No sleep entries recorded for this profile yet.</p>
            ) : (
              <ul>
                {entries.map((entry) => {
                   const startDate = new Date(entry.startTime);
                   const endDate = new Date(entry.endTime);
                   const areDatesValid = !isNaN(startDate.getTime()) && !isNaN(endDate.getTime());

                   return (
                      <li key={entry.entryId}>
                        <strong>Duration:</strong>{' '}
                        {areDatesValid ? calculateDuration(entry.startTime, entry.endTime) : 'Invalid Dates'}
                        <br />
                        Start: {areDatesValid ? startDate.toLocaleString() : 'Invalid Date'}
                        <br />
                        End: {areDatesValid ? endDate.toLocaleString() : 'Invalid Date'}
                        {entry.notes && (
                          <>
                            <br />
                            Notes: {entry.notes}
                          </>
                        )}
                        <div style={{ marginTop: '5px' }}>
                          <button
                            onClick={() => handleEditClick(entry)}
                            disabled={isLoading || isSubmitting || !!editingEntryId} // Disable if loading/submitting/editing another
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
                            disabled={isLoading || isSubmitting || !!editingEntryId} // Disable if loading/submitting/editing another
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

export default SleepTracker;
