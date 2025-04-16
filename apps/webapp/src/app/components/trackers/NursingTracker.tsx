import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../utils/apiClient';
import { useTrackerLogic } from '../../hooks/useTrackerLogic';
// Import date utils
import {
  getCurrentDateTimeLocal,
  formatDateTimeLocalInput,
} from '../../utils/dateUtils';

// Interface remains specific to this tracker
interface NursingEntry {
  entryId: string;
  startTime: string;
  durationLeft?: number; // minutes
  durationRight?: number; // minutes
  lastSide?: 'left' | 'right';
  notes?: string;
  babyId: string;
}

// Define the structure for the data part of a new entry (excluding babyId/entryId)
type NewNursingEntryData = Omit<NursingEntry, 'entryId' | 'babyId'>;

const NursingTracker: React.FC = () => {
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
    handleDeleteEntry, // Get delete function from hook
    hasFetchedEmptyData,
  } = useTrackerLogic<NursingEntry>({ trackerType: 'nursing' });

  // Keep component-specific form state
  const [startTime, setStartTime] = useState(getCurrentDateTimeLocal());
  const [durationLeft, setDurationLeft] = useState('');
  const [durationRight, setDurationRight] = useState('');
  const [lastSide, setLastSide] = useState<'left' | 'right' | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Local state for submit loading
  const [formError, setFormError] = useState<string | null>(null); // Local error state specifically for the form

  // Function to reset form fields
  const resetForm = useCallback(() => {
    console.log('NursingTracker: resetForm called');
    setStartTime(getCurrentDateTimeLocal());
    setDurationLeft('');
    setDurationRight('');
    setLastSide('');
    setNotes('');
    setEditingEntryId(null); // Use setter from hook
    setFormError(null);
  }, [setEditingEntryId]);

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
    if (selectedProfile && !isLoading && !hasFetchedEmptyData) {
      console.log(`NursingTracker: Fetching entries for profile ${selectedProfile.id}`);
      fetchEntries();
    }
  }, [selectedProfile?.id, isLoading, fetchEntries, hasFetchedEmptyData]);


  // Function to set the form state for editing an entry
  const handleEditClick = (entry: NursingEntry) => {
    setEditingEntryId(entry.entryId); // Use setter from hook
    setStartTime(formatDateTimeLocalInput(entry.startTime));
    setDurationLeft(entry.durationLeft?.toString() || '');
    setDurationRight(entry.durationRight?.toString() || '');
    setLastSide(entry.lastSide || '');
    setNotes(entry.notes || '');
    setFormError(null);
  };

  // Component-specific submit logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !startTime || (!durationLeft && !durationRight))
      return;
    setFormError(null);

    const entryData: NewNursingEntryData = {
      startTime: new Date(startTime).toISOString(),
      durationLeft: durationLeft ? parseInt(durationLeft, 10) : undefined,
      durationRight: durationRight ? parseInt(durationRight, 10) : undefined,
      lastSide: lastSide || undefined,
      notes: notes || undefined,
    };

    setIsSubmitting(true);

    try {
      const endpoint = `/profiles/${selectedProfile.id}/trackers/nursing`;
      if (editingEntryId) {
        await apiClient.put<NursingEntry>(`${endpoint}/${editingEntryId}`, entryData);
        console.log(`Updated nursing entry ${editingEntryId}`);
      } else {
        await apiClient.post<NursingEntry>(endpoint, entryData);
        console.log('Added new nursing entry');
      }
      await fetchEntries(); // Refetch using function from hook
      resetForm();
    } catch (err: any) {
      const action = editingEntryId ? 'update' : 'save';
      console.error(`Failed to ${action} nursing entry:`, err);
      setFormError(err.message || `Failed to ${action} nursing entry.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalDuration = (entry: NursingEntry): number => {
    return (entry.durationLeft || 0) + (entry.durationRight || 0);
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
        Nursing Tracker {profileName ? `for ${profileName}` : '(Select Profile...)'}
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
              {editingEntryId ? 'Edit Nursing Session' : 'Add New Nursing Session'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="nursingStartTime">Start Time:</label>
                <input
                  type="datetime-local"
                  id="nursingStartTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="durationLeft">Duration Left (mins):</label>
                <input
                  type="number"
                  id="durationLeft"
                  min="0"
                  value={durationLeft}
                  onChange={(e) => setDurationLeft(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="durationRight">Duration Right (mins):</label>
                <input
                  type="number"
                  id="durationRight"
                  min="0"
                  value={durationRight}
                  onChange={(e) => setDurationRight(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="lastSide">Last Side Nursed:</label>
                <select
                  id="lastSide"
                  value={lastSide}
                  onChange={(e) =>
                    setLastSide(e.target.value as 'left' | 'right' | '')
                  }
                >
                  <option value="">N/A</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div>
                <label htmlFor="nursingNotes">Notes:</label>
                <textarea
                  id="nursingNotes"
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
                  ? 'Update Session'
                  : 'Add Nursing Session'}
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
              Nursing Log {profileName ? `for ${profileName}` : ''}
            </h3>
             {/* Use combined isLoading for log loading state */}
            {isLoading && entries.length === 0 ? (
              <p>Loading log...</p>
            ) : entries.length === 0 ? (
              <p>No nursing sessions recorded for this profile yet.</p>
            ) : (
              <ul>
                {entries.map((entry) => {
                    const startDate = new Date(entry.startTime);
                    const isDateValid = !isNaN(startDate.getTime());

                    return (
                      <li key={entry.entryId}>
                        <strong>Total Duration:</strong> {getTotalDuration(entry)} mins
                        {entry.durationLeft && ` (L: ${entry.durationLeft}m)`}
                        {entry.durationRight && ` (R: ${entry.durationRight}m)`}
                        {entry.lastSide && ` (Last: ${entry.lastSide})`}
                        <br />
                        Start: {isDateValid ? startDate.toLocaleString() : 'Invalid Date'}
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

export default NursingTracker;
