import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../utils/apiClient';
import { useTrackerLogic } from '../../hooks/useTrackerLogic';
import { useTrackerForm } from '../../hooks/useTrackerForm';

import {
  getCurrentDateLocal, 
} from '../../utils/dateUtils';


interface GrowthEntry {
  entryId: string;
  time: string; // ISO string
  weight?: number;
  weightUnit?: 'kg' | 'lb';
  height?: number;
  heightUnit?: 'cm' | 'in';
  headCircumference?: number;
  headCircumferenceUnit?: 'cm' | 'in';
  notes?: string;
  babyId: string;
}


type NewGrowthEntryData = Omit<GrowthEntry, 'entryId' | 'babyId'>;

const GrowthTracker: React.FC = () => {
  
  const {
    entries,
    isLoading, 
    error: displayError, 
    editingEntryId,
    setEditingEntryId,
    selectedProfile, 
    profileName,
    fetchEntries, 
    handleDeleteEntry, 
    hasFetchedEmptyData,
  } = useTrackerLogic<GrowthEntry>({ trackerType: 'growth' });

  
  const [time, setTime] = useState(getCurrentDateLocal());
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [height, setHeight] = useState('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'in'>('cm');
  const [headCircumference, setHeadCircumference] = useState('');
  const [headCircumferenceUnit, setHeadCircumferenceUnit] = useState<
    'cm' | 'in'
  >('cm');
  const [notes, setNotes] = useState('');
  

  
  const resetForm = useCallback(() => {
    console.log('GrowthTracker: resetForm called');
    setTime(getCurrentDateLocal());
    setWeight('');
    setWeightUnit('kg');
    setHeight('');
    setHeightUnit('cm');
    setHeadCircumference('');
    setHeadCircumferenceUnit('cm');
    setNotes('');
    setEditingEntryId(null); 
    setFormError(null);
  }, [setEditingEntryId]);

  
   useEffect(() => {
    if (!isLoading && selectedProfile) {
        resetForm();
    }
     if (!isLoading && !selectedProfile) {
        resetForm();
    }
  }, [entries, isLoading]);

   
   useEffect(() => {
    if (selectedProfile && !isLoading && entries.length === 0 && !hasFetchedEmptyData) {
      console.log(`GrowthTracker: Fetching entries for profile ${selectedProfile.id}`);
      fetchEntries();
    }
  }, [selectedProfile?.id, isLoading]);


  
  const handleEditClick = (entry: GrowthEntry) => {
    setEditingEntryId(entry.entryId); 
    setTime(entry.time); 
    setWeight(entry.weight?.toString() || '');
    setWeightUnit(entry.weightUnit || 'kg');
    setHeight(entry.height?.toString() || '');
    setHeightUnit(entry.heightUnit || 'cm');
    setHeadCircumference(entry.headCircumference?.toString() || '');
    setHeadCircumferenceUnit(entry.headCircumferenceUnit || 'cm');
    setNotes(entry.notes || '');
  };

  
  const validate = () => {
    if (!selectedProfile) return 'No profile selected.';
    if (!time) return 'Time is required.';
    if (!weight && !height && !headCircumference) {
      return 'Please enter at least one measurement (Weight, Height, or Head Circumference).';
    }
    if (weight && (isNaN(Number(weight)) || Number(weight) <= 0)) return 'Weight must be a positive number.';
    if (height && (isNaN(Number(height)) || Number(height) <= 0)) return 'Height must be a positive number.';
    if (headCircumference && (isNaN(Number(headCircumference)) || Number(headCircumference) <= 0)) return 'Head circumference must be a positive number.';
    return null;
  };
  const buildEntryData = () => {
    if (!time) return null;
    return {
      time,
      weight: weight ? parseFloat(weight) : undefined,
      weightUnit: weight ? weightUnit : undefined,
      height: height ? parseFloat(height) : undefined,
      heightUnit: height ? heightUnit : undefined,
      headCircumference: headCircumference ? parseFloat(headCircumference) : undefined,
      headCircumferenceUnit: headCircumference ? headCircumferenceUnit : undefined,
      notes: notes || undefined,
    };
  };
  const {
    isSubmitting,
    formError,
    handleSubmit,
    setFormError,
  } = useTrackerForm<NewGrowthEntryData>({
    editingEntryId,
    setEditingEntryId,
    selectedProfileId: selectedProfile?.id,
    trackerType: 'growth',
    fetchEntries,
    buildEntryData,
    validate,
    resetForm,
    apiClient,
  });

  
  if (isLoading && !selectedProfile) {
    return <div>Loading profile data...</div>;
  }

  
  if (displayError && !selectedProfile) {
     return <div style={{ color: 'red' }}>Error loading profiles: {displayError}</div>;
  }

  return (
    <div>
      <h2>
        Growth Tracker {profileName ? `for ${profileName}` : '(Select Profile...)'}
      </h2>

      {}
      {formError && <p style={{ color: 'red' }}>Error: {formError}</p>}
      {}
      {displayError && !formError && <p style={{ color: 'red' }}>Error: {displayError}</p>}

      {}
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
                <label htmlFor="growthTime">Time:</label>
                <input
                  type="datetime-local"
                  id="growthTime"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
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
            {}
            {isLoading && entries.length === 0 ? (
              <p>Loading log...</p>
            ) : entries.length === 0 && hasFetchedEmptyData ? (
              <p>No growth measurements recorded for this profile yet.</p>
            ) : (
              <ul>
                {entries.map((entry) => {
                  let entryTime: Date;
                  if (entry.time.includes('T')) {
                    entryTime = new Date(entry.time);
                  } else {
                    entryTime = new Date(entry.time + 'T00:00:00');
                  }
                  const isTimeValid = !isNaN(entryTime.getTime());
                  return (
                    <li key={entry.entryId}>
                      <strong>Time:</strong> {isTimeValid ? entryTime.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Invalid Time'}
                      {entry.weight && (
                        <>
                          <br /> Weight: {entry.weight} {entry.weightUnit}
                        </>
                      )}
                      {entry.height && (
                        <>
                          <br /> Height: {entry.height} {entry.heightUnit}
                        </>
                      )}
                      {entry.headCircumference && (
                        <>
                          <br /> Head: {entry.headCircumference} {entry.headCircumferenceUnit}
                        </>
                      )}
                      {entry.notes && (
                        <>
                          <br />Notes: {entry.notes}
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
         
         <p style={{ color: 'orange' }}>Please select a baby profile first.</p>
      )}
    </div>
  );
};

export default GrowthTracker;
