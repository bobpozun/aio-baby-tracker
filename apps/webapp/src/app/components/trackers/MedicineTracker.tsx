import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../utils/apiClient';
import { useTrackerLogic } from '../../hooks/useTrackerLogic'; // Import the custom hook
// Import date utils
import {
  getCurrentDateTimeLocal,
  formatDateTimeLocalInput,
} from '../../utils/dateUtils';

// Interface remains specific to this tracker
interface MedicineEntry {
  entryId: string;
  time: string;
  medicineName: string;
  dosage?: string;
  notes?: string;
  babyId: string;
}

// Define the structure for the data part of a new entry
type NewMedicineEntryData = Omit<MedicineEntry, 'entryId' | 'babyId'>;

const MedicineTracker: React.FC = () => {
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
  } = useTrackerLogic<MedicineEntry>({ trackerType: 'medicine' });

  // Keep component-specific form state
  const [time, setTime] = useState(getCurrentDateTimeLocal());
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Local state for submit loading
  const [formError, setFormError] = useState<string | null>(null); // Local error state specifically for the form

  // Function to reset form fields
  const resetForm = useCallback(() => {
    console.log('MedicineTracker: resetForm called');
    setTime(getCurrentDateTimeLocal());
    setMedicineName('');
    setDosage('');
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
    if (selectedProfile && !isLoading) {
      console.log(`MedicineTracker: Fetching entries for profile ${selectedProfile.id}`);
      fetchEntries();
    }
  }, [selectedProfile?.id, isLoading, fetchEntries]);


  // Function to set the form state for editing an entry
  const handleEditClick = (entry: MedicineEntry) => {
    setEditingEntryId(entry.entryId); // Use setter from hook
    setTime(formatDateTimeLocalInput(entry.time));
    setMedicineName(entry.medicineName);
    setDosage(entry.dosage || '');
    setNotes(entry.notes || '');
    setFormError(null);
  };

  // Component-specific submit logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !time || !medicineName) return; // Check selectedProfile from hook
    setFormError(null);

    const entryData: NewMedicineEntryData = {
      time: new Date(time).toISOString(),
      medicineName: medicineName,
      dosage: dosage || undefined,
      notes: notes || undefined,
    };

    setIsSubmitting(true);

    try {
      const endpoint = `/profiles/${selectedProfile.id}/trackers/medicine`;
      if (editingEntryId) {
        await apiClient.put<MedicineEntry>(`${endpoint}/${editingEntryId}`, entryData);
        console.log(`Updated medicine entry ${editingEntryId}`);
      } else {
        await apiClient.post<MedicineEntry>(endpoint, entryData);
        console.log('Added new medicine entry');
      }
      await fetchEntries(); // Refetch using function from hook
      resetForm();
    } catch (err: any) {
      const action = editingEntryId ? 'update' : 'save';
      console.error(`Failed to ${action} medicine entry:`, err);
      setFormError(err.message || `Failed to ${action} medicine entry.`);
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
        Medicine Tracker {profileName ? `for ${profileName}` : '(Select Profile...)'}
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
              {editingEntryId ? 'Edit Medicine Dose' : 'Add New Medicine Dose'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="medicineTime">Time:</label>
                <input
                  type="datetime-local"
                  id="medicineTime"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="medicineName">Medicine Name:</label>
                <input
                  type="text"
                  id="medicineName"
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="medicineDosage">Dosage (Optional):</label>
                <input
                  type="text"
                  id="medicineDosage"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="medicineNotes">Notes:</label>
                <textarea
                  id="medicineNotes"
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
                  : 'Add Medicine Entry'}
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
              Medicine Log {profileName ? `for ${profileName}` : ''}
            </h3>
            {/* Use combined isLoading for log loading state */}
            {isLoading && entries.length === 0 ? (
              <p>Loading log...</p>
            ) : entries.length === 0 ? (
              <p>No medicine doses recorded for this profile yet.</p>
            ) : (
              <ul>
                {entries.map((entry) => {
                    const entryDate = new Date(entry.time);
                    const isDateValid = !isNaN(entryDate.getTime());
                    return (
                      <li key={entry.entryId}>
                        <strong>{entry.medicineName}</strong>{' '}
                        {entry.dosage ? `(${entry.dosage})` : ''}
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

export default MedicineTracker;
