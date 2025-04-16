import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../utils/apiClient';
import { useTrackerLogic } from '../../hooks/useTrackerLogic'; // Import the custom hook
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
const [isSubmitting, setIsSubmitting] = useState(false);
const [formError, setFormError] = useState<string | null>(null);

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
  }, [selectedProfile?.id, isLoading, resetForm]);

   // Effect to fetch entries when selected profile changes (after loading)
   useEffect(() => {
    if (selectedProfile && !isLoading && !hasFetchedEmptyData) {
      console.log(`BottleTracker: Fetching entries for profile ${selectedProfile.id}`);
      fetchEntries();
    }
  }, [selectedProfile?.id, isLoading, fetchEntries, hasFetchedEmptyData]);


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

  // Component-specific submit logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !time || !amount) return; // Check selectedProfile from hook
    setFormError(null);

    const entryData: NewBottleEntryData = {
      time: new Date(time).toISOString(),
      amount: parseFloat(amount),
      unit: unit,
      type: type,
      notes: notes || undefined,
    };

    setIsSubmitting(true);

    try {
      const endpoint = `/profiles/${selectedProfile.id}/trackers/bottle`;
      if (editingEntryId) {
        await apiClient.put<BottleEntry>(`${endpoint}/${editingEntryId}`, entryData);
        console.log(`Updated bottle entry ${editingEntryId}`);
      } else {
        await apiClient.post<BottleEntry>(endpoint, entryData);
        console.log('Added new bottle entry');
      }
      await fetchEntries(); // Refetch using function from hook
      resetForm();
    } catch (err: any) {
      const action = editingEntryId ? 'update' : 'save';
      console.error(`Failed to ${action} bottle entry:`, err);
      setFormError(err.message || `Failed to ${action} bottle entry.`);
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
            ) : entries.length === 0 ? (
              <p>No bottle feedings recorded for this profile yet.</p>
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
