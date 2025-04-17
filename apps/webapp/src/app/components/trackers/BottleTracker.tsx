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
interface BottleEntry {
  entryId: string;
  time: string;
  amount: number;
  unit: 'ml' | 'oz';
  type: 'formula' | 'breast_milk' | 'other';
  notes?: string;
  babyId: string;
}

// Define the structure for the data part of a new entry
type NewBottleEntryData = Omit<BottleEntry, 'entryId' | 'babyId'>;

const BottleTracker: React.FC = () => {
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
  } = useTrackerLogic<BottleEntry>({ trackerType: 'bottle' });

  // Keep component-specific form state
  const [time, setTime] = useState(getCurrentDateTimeLocal());
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<'ml' | 'oz'>('ml');
const [type, setType] = useState<'formula' | 'breast_milk' | 'other'>('formula');
const [notes, setNotes] = useState('');
// useTrackerForm handles isSubmitting and formError now

  // Function to reset form fields
  const resetForm = useCallback(() => {
    console.log('BottleTracker: resetForm called');
    setTime(getCurrentDateTimeLocal());
    setAmount('');
    setUnit('ml');
    setType('formula');
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
  }, [entries, isLoading]);

   // Effect to fetch entries when selected profile changes (after loading)
   useEffect(() => {
    if (selectedProfile && !isLoading && entries.length === 0 && !hasFetchedEmptyData) {
      console.log(`BottleTracker: Fetching entries for profile ${selectedProfile.id}`);
      fetchEntries();
    }
  }, [selectedProfile?.id, isLoading]);


  // Function to set the form state for editing an entry
  const handleEditClick = (entry: BottleEntry) => {
    setEditingEntryId(entry.entryId); // Use setter from hook
    setTime(formatDateTimeLocalInput(entry.time));
    setAmount(entry.amount.toString());
    setUnit(entry.unit);
    setType(entry.type);
    setNotes(entry.notes || '');
    setFormError(null);
  };

  // useTrackerForm handles submit logic
  const validate = () => {
    if (!selectedProfile) return 'No profile selected.';
    if (!time || !amount) return 'Time and amount are required.';
    if (isNaN(Number(amount)) || Number(amount) <= 0) return 'Amount must be a positive number.';
    return null;
  };
  const buildEntryData = () => {
    if (!time || !amount) return null;
    return {
      time: new Date(time).toISOString(),
      amount: parseFloat(amount),
      unit,
      type,
      notes: notes || undefined,
    };
  };
  const {
    isSubmitting,
    formError,
    handleSubmit,
    setFormError,
  } = useTrackerForm<NewBottleEntryData>({
    editingEntryId,
    setEditingEntryId,
    selectedProfileId: selectedProfile?.id,
    trackerType: 'bottle',
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
        Bottle Tracker {profileName ? `for ${profileName}` : '(Select Profile...)'}
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
              {editingEntryId ? 'Edit Bottle Feeding' : 'Add New Bottle Feeding'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="bottleTime">Time:</label>
                <input
                  type="datetime-local"
                  id="bottleTime"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="bottleAmount">Amount:</label>
                <input
                  type="number"
                  id="bottleAmount"
                  min="0"
                  step="any" // Allow decimals
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as 'ml' | 'oz')}
                >
                  <option value="ml">ml</option>
                  <option value="oz">oz</option>
                </select>
              </div>
              <div>
                <label htmlFor="bottleType">Type:</label>
                <select
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as 'formula' | 'breast_milk' | 'other')
                  }
                >
                  <option value="formula">Formula</option>
                  <option value="breast_milk">Breast Milk</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="bottleNotes">Notes:</label>
                <textarea
                  id="bottleNotes"
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
                  : 'Add Bottle Entry'}
              </button>
              {editingEntryId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  style={{ marginLeft: 10 }}
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </section>

          <hr />

          <section>
            <h3>
              Bottle Log {profileName ? `for ${profileName}` : ''}
            </h3>
            {/* Use combined isLoading for log loading state */}
            {isLoading && entries.length === 0 ? (
              <p>Loading log...</p>
            ) : entries.length === 0 && hasFetchedEmptyData ? (
              <p>No bottle feedings recorded for this profile yet.</p>
            ) : entries.length === 0 ? (
              <p>Loading log...</p>
            ) : (
              <ul>
                {entries.map((entry) => {
                    const entryDate = new Date(entry.time);
                    const isDateValid = !isNaN(entryDate.getTime());
                    // Safely format type - check if it's a string before replacing
                    const formattedType = typeof entry.type === 'string' ? entry.type.replace('_', ' ') : 'N/A';
                    return (
                      <li key={entry.entryId}>
                        <strong>
                          {entry.amount} {entry.unit}
                        </strong>
                        ({formattedType}) {/* Use safe formatted type */}
                        <br />
                        Time: {isDateValid ? entryDate.toLocaleString() : 'Invalid Date'}
                        {entry.notes && (
                          <>
                            <br />
                            Notes: {entry.notes}
                          </>
                        )}
                        <div style={{ marginTop: 5 }}>
                          <button
                            onClick={() => handleEditClick(entry)}
                            disabled={isLoading || isSubmitting || !!editingEntryId}
                            style={{
                              marginRight: 10,
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
                              marginLeft: 10,
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

export default BottleTracker;
