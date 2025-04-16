import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../utils/apiClient';
import { useTrackerLogic } from '../../hooks/useTrackerLogic'; // Import the custom hook
// Import date utils
import {
  getCurrentDateLocal, // Use date-only for this tracker
} from '../../utils/dateUtils';

// Interface remains specific to this tracker
interface GrowthEntry {
  entryId: string;
  date: string; // YYYY-MM-DD
  weight?: number;
  weightUnit?: 'kg' | 'lb';
  height?: number;
  heightUnit?: 'cm' | 'in';
  headCircumference?: number;
  headCircumferenceUnit?: 'cm' | 'in';
  notes?: string;
  babyId: string;
}

// Define the structure for the data part of a new entry
type NewGrowthEntryData = Omit<GrowthEntry, 'entryId' | 'babyId'>;

const GrowthTracker: React.FC = () => {
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
  } = useTrackerLogic<GrowthEntry>({ trackerType: 'growth' });

  // Keep component-specific form state
  const [date, setDate] = useState(getCurrentDateLocal());
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [height, setHeight] = useState('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'in'>('cm');
  const [headCircumference, setHeadCircumference] = useState('');
  const [headCircumferenceUnit, setHeadCircumferenceUnit] = useState<
    'cm' | 'in'
  >('cm');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Local state for submit loading
  const [formError, setFormError] = useState<string | null>(null); // Local error state specifically for the form

  // Function to reset form fields
  const resetForm = useCallback(() => {
    console.log('GrowthTracker: resetForm called');
    setDate(getCurrentDateLocal());
    setWeight('');
    setWeightUnit('kg');
    setHeight('');
    setHeightUnit('cm');
    setHeadCircumference('');
    setHeadCircumferenceUnit('cm');
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
      console.log(`GrowthTracker: Fetching entries for profile ${selectedProfile.id}`);
      fetchEntries();
    }
  }, [selectedProfile?.id, isLoading, fetchEntries, hasFetchedEmptyData]);


  // Function to set the form state for editing an entry
  const handleEditClick = (entry: GrowthEntry) => {
    setEditingEntryId(entry.entryId); // Use setter from hook
    setDate(entry.date); // Assumes date is already in YYYY-MM-DD format
    setWeight(entry.weight?.toString() || '');
    setWeightUnit(entry.weightUnit || 'kg');
    setHeight(entry.height?.toString() || '');
    setHeightUnit(entry.heightUnit || 'cm');
    setHeadCircumference(entry.headCircumference?.toString() || '');
    setHeadCircumferenceUnit(entry.headCircumferenceUnit || 'cm');
    setNotes(entry.notes || '');
    setFormError(null);
  };

  // Component-specific submit logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedProfile ||
      !date ||
      (!weight && !height && !headCircumference)
    ) {
      setFormError(
        'Please enter a date and at least one measurement (Weight, Height, or Head Circumference).'
      );
      return;
    }
    setFormError(null);

    const entryData: NewGrowthEntryData = {
      date: date,
      weight: weight ? parseFloat(weight) : undefined,
      weightUnit: weight ? weightUnit : undefined,
      height: height ? parseFloat(height) : undefined,
      heightUnit: height ? heightUnit : undefined,
      headCircumference: headCircumference
        ? parseFloat(headCircumference)
        : undefined,
      headCircumferenceUnit: headCircumference
        ? headCircumferenceUnit
        : undefined,
      notes: notes || undefined,
    };

    setIsSubmitting(true);

    try {
      const endpoint = `/profiles/${selectedProfile.id}/trackers/growth`;
      if (editingEntryId) {
        await apiClient.put<GrowthEntry>(`${endpoint}/${editingEntryId}`, entryData);
        console.log(`Updated growth entry ${editingEntryId}`);
      } else {
        await apiClient.post<GrowthEntry>(endpoint, entryData);
        console.log('Added new growth entry');
      }
      await fetchEntries(); // Refetch using function from hook
      resetForm();
    } catch (err: any) {
      const action = editingEntryId ? 'update' : 'save';
      console.error(`Failed to ${action} growth entry:`, err);
      setFormError(err.message || `Failed to ${action} growth entry.`);
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
        Growth Tracker {profileName ? `for ${profileName}` : '(Select Profile...)'}
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
                ? 'Edit Growth Measurement'
                : 'Add New Growth Measurement'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="growthDate">Date:</label>
                <input
                  type="date"
                  id="growthDate"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="growthWeight">Weight (Optional):</label>
                <input
                  type="number"
                  id="growthWeight"
                  min="0"
                  step="any"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value as 'kg' | 'lb')}
                >
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              </div>
              <div>
                <label htmlFor="growthHeight">Height (Optional):</label>
                <input
                  type="number"
                  id="growthHeight"
                  min="0"
                  step="any"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
                <select
                  value={heightUnit}
                  onChange={(e) => setHeightUnit(e.target.value as 'cm' | 'in')}
                >
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                </select>
              </div>
              <div>
                <label htmlFor="growthHead">Head Circumference (Optional):</label>
                <input
                  type="number"
                  id="growthHead"
                  min="0"
                  step="any"
                  value={headCircumference}
                  onChange={(e) => setHeadCircumference(e.target.value)}
                />
                <select
                  value={headCircumferenceUnit}
                  onChange={(e) =>
                    setHeadCircumferenceUnit(e.target.value as 'cm' | 'in')
                  }
                >
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                </select>
              </div>
              <div>
                <label htmlFor="growthNotes">Notes:</label>
                <textarea
                  id="growthNotes"
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
                  : 'Add Growth Entry'}
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
              Growth Log {profileName ? `for ${profileName}` : ''}
            </h3>
            {/* Use combined isLoading for log loading state */}
            {isLoading && entries.length === 0 ? (
              <p>Loading log...</p>
            ) : entries.length === 0 ? (
              <p>No growth measurements recorded for this profile yet.</p>
            ) : (
              <ul>
                {entries.map((entry) => {
                    // Check date validity before rendering
                    // Add T00:00:00 to treat date string as local timezone for Date object
                    const entryDate = new Date(entry.date + 'T00:00:00');
                    const isDateValid = !isNaN(entryDate.getTime());

                    return (
                      <li key={entry.entryId}>
                        <strong>Date:</strong> {isDateValid ? entryDate.toLocaleDateString() : 'Invalid Date'}
                        {entry.weight && (
                          <>
                            {' '}
                            <br /> Weight: {entry.weight} {entry.weightUnit}{' '}
                          </>
                        )}
                        {entry.height && (
                          <>
                            {' '}
                            <br /> Height: {entry.height} {entry.heightUnit}{' '}
                          </>
                        )}
                        {entry.headCircumference && (
                          <>
                            {' '}
                            <br /> Head: {entry.headCircumference}{' '}
                            {entry.headCircumferenceUnit}{' '}
                          </>
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

export default GrowthTracker;
