import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../utils/apiClient';
import { useTrackerLogic } from '../../hooks/useTrackerLogic';
import { useTrackerForm } from '../../hooks/useTrackerForm';
// Import date utils
import {
  getCurrentDateTimeLocal,
  formatDateTimeLocalInput,
} from '../../utils/dateUtils';

// Interface remains specific to this tracker
interface PottyEntry {
  entryId: string;
  time: string;
  type: 'pee' | 'poop' | 'both';
  location: 'potty' | 'diaper' | 'other';
  notes?: string;
  babyId: string;
}

// Define the structure for the data part of a new entry
type NewPottyEntryData = Omit<PottyEntry, 'entryId' | 'babyId'>;

const PottyTracker: React.FC = () => {
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
  } = useTrackerLogic<PottyEntry>({ trackerType: 'potty' });

  // Keep component-specific form state
  const [time, setTime] = useState(getCurrentDateTimeLocal());
  const [type, setType] = useState<'pee' | 'poop' | 'both'>('pee');
  const [location, setLocation] = useState<'potty' | 'diaper' | 'other'>(
    'potty'
  );
  const [notes, setNotes] = useState('');
  // useTrackerForm handles isSubmitting and formError now

  // Function to reset form fields
  const resetForm = useCallback(() => {
    console.log('PottyTracker: resetForm called');
    setTime(getCurrentDateTimeLocal());
    setType('pee');
    setLocation('potty');
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
      console.log(`PottyTracker: Fetching entries for profile ${selectedProfile.id}`);
      fetchEntries();
    }
  }, [selectedProfile?.id, isLoading, fetchEntries, hasFetchedEmptyData]);


  // Function to set the form state for editing an entry
  const handleEditClick = (entry: PottyEntry) => {
    setEditingEntryId(entry.entryId); // Use setter from hook
    setTime(formatDateTimeLocalInput(entry.time));
    setType(entry.type);
    setLocation(entry.location);
    setNotes(entry.notes || '');
    setFormError(null);
  };

  // useTrackerForm handles submit logic
  const validate = () => {
    if (!selectedProfile) return 'No profile selected.';
    if (!time) return 'Time is required.';
    return null;
  };
  const buildEntryData = () => {
    if (!time) return null;
    return {
      time: new Date(time).toISOString(),
      type,
      location,
      notes: notes || undefined,
    };
  };
  const {
    isSubmitting,
    formError,
    handleSubmit,
    setFormError,
  } = useTrackerForm<NewPottyEntryData>({
    editingEntryId,
    setEditingEntryId,
    selectedProfileId: selectedProfile?.id,
    trackerType: 'potty',
    fetchEntries,
    buildEntryData,
    validate,
    resetForm,
    apiClient,
  });

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
        Potty Tracker {profileName ? `for ${profileName}` : '(Select Profile...)'}
      </h2>

      {/* Display form-specific errors */}
      {formError && <p style={{ color: 'red' }}>Error: {formError}</p>}
      {/* Display context/fetch errors if not form-related */}
      {displayError && !formError && <p style={{ color: 'red' }}>Error: {displayError}</p>}

      {/* Render sections only if a profile is selected */}
      {selectedProfile ? (
        <>
          <section>
            <h3>{editingEntryId ? 'Edit Potty Event' : 'Add New Potty Event'}</h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="pottyTime">Time:</label>
                <input
                  type="datetime-local"
                  id="pottyTime"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Type:</label>
                <div>
                  <input
                    type="radio"
                    id="pee"
                    name="pottyType"
                    value="pee"
                    checked={type === 'pee'}
                    onChange={() => setType('pee')}
                  />
                  <label htmlFor="pee">Pee</label>
                </div>
                <div>
                  <input
                    type="radio"
                    id="poop"
                    name="pottyType"
                    value="poop"
                    checked={type === 'poop'}
                    onChange={() => setType('poop')}
                  />
                  <label htmlFor="poop">Poop</label>
                </div>
                <div>
                  <input
                    type="radio"
                    id="both"
                    name="pottyType"
                    value="both"
                    checked={type === 'both'}
                    onChange={() => setType('both')}
                  />
                  <label htmlFor="both">Both</label>
                </div>
              </div>
              <div>
                <label>Location:</label>
                <div>
                  <input
                    type="radio"
                    id="potty"
                    name="pottyLocation"
                    value="potty"
                    checked={location === 'potty'}
                    onChange={() => setLocation('potty')}
                  />
                  <label htmlFor="potty">Potty</label>
                </div>
                <div>
                  <input
                    type="radio"
                    id="diaper"
                    name="pottyLocation"
                    value="diaper"
                    checked={location === 'diaper'}
                    onChange={() => setLocation('diaper')}
                  />
                  <label htmlFor="diaper">Diaper</label>
                </div>
                <div>
                  <input
                    type="radio"
                    id="other"
                    name="pottyLocation"
                    value="other"
                    checked={location === 'other'}
                    onChange={() => setLocation('other')}
                  />
                  <label htmlFor="other">Other</label>
                </div>
              </div>
              <div>
                <label htmlFor="pottyNotes">Notes:</label>
                <textarea
                  id="pottyNotes"
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
                  : 'Add Potty Entry'}
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
              Potty Log {profileName ? `for ${profileName}` : ''}
            </h3>
            {/* Use combined isLoading for log loading state */}
            {isLoading && entries.length === 0 ? (
              <p>Loading log...</p>
            ) : entries.length === 0 && hasFetchedEmptyData ? (
              <p>No potty events recorded for this profile yet.</p>
            ) : entries.length === 0 ? (
              <p>Loading log...</p>
            ) : (
              <ul>
                {entries.map((entry) => {
                    const entryDate = new Date(entry.time);
                    const isDateValid = !isNaN(entryDate.getTime());
                    // Safely format type
                    const formattedType = typeof entry.type === 'string' ? entry.type.charAt(0).toUpperCase() + entry.type.slice(1) : 'N/A';
                    return (
                      <li key={entry.entryId}>
                        <strong>
                          {formattedType} {/* Use safe formatted type */}
                        </strong>{' '}
                        in {entry.location}
                        <br />
                        Time: {isDateValid ? entryDate.toLocaleString() : 'Invalid Date'}
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

export default PottyTracker;
