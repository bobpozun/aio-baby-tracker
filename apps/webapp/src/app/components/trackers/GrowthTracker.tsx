import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../utils/apiClient';
import { useTrackerLogic } from '../../hooks/useTrackerLogic';
import { useTrackerForm } from '../../hooks/useTrackerForm';

import { getCurrentDateLocal } from '../../utils/dateUtils';

interface GrowthEntry {
  entryId: string;
  createdAt?: string
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

  const [createdAt, setCreatedAt] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  });
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
    setCreatedAt(getCurrentDateLocal());
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
    if (
      selectedProfile &&
      !isLoading &&
      entries.length === 0 &&
      !hasFetchedEmptyData
    ) {
      console.log(
        `GrowthTracker: Fetching entries for profile ${selectedProfile.id}`
      );
      fetchEntries();
    }
  }, [selectedProfile?.id, isLoading]);

  const handleEditClick = (entry: GrowthEntry) => {
    setEditingEntryId(entry.entryId);
    setCreatedAt(entry?.createdAt ?? '');
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
    if (!createdAt) return 'Time is required.';
    if (!weight && !height && !headCircumference) {
      return 'Please enter at least one measurement (Weight, Height, or Head Circumference).';
    }
    if (weight && (isNaN(Number(weight)) || Number(weight) <= 0))
      return 'Weight must be a positive number.';
    if (height && (isNaN(Number(height)) || Number(height) <= 0))
      return 'Height must be a positive number.';
    if (
      headCircumference &&
      (isNaN(Number(headCircumference)) || Number(headCircumference) <= 0)
    )
      return 'Head circumference must be a positive number.';
    return null;
  };
  const buildEntryData = () => {
    if (!createdAt) return null;
    return {
      createdAt: createdAt,
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
  };
  const { isSubmitting, formError, handleSubmit, setFormError } =
    useTrackerForm<NewGrowthEntryData>({
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
    return (
      <div className="error-message">
        Error loading profiles: {displayError}
      </div>
    );
  }

  return (
    <div className="main-container">
      <h2 className="tracker-title">
        Growth Tracker{' '}
        {profileName ? `for ${profileName}` : '(Select Profile...)'}
      </h2>

      {}
      {formError && <p className="error-message">Error: {formError}</p>}
      {}
      {displayError && !formError && (
        <p className="error-message">Error: {displayError}</p>
      )}

      {}
      {selectedProfile ? (
        <>
          <section className="section-card">
            <h3>
              {editingEntryId
                ? 'Edit Growth Measurement'
                : 'Add New Growth Measurement'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="growthDate">Date:</label>
                <input
                  type="datetime-local"
                  id="growthDate"
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
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
                <label htmlFor="growthHead">
                  Head Circumference (Optional):
                </label>
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
                  className="tracker-cancel-btn"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </section>

          <hr />

          <section className="section-card">
            <h3>Growth Log {profileName ? `for ${profileName}` : ''}</h3>
            {}
            {isLoading && entries.length === 0 ? (
              <p>Loading log...</p>
            ) : entries.length === 0 && hasFetchedEmptyData ? (
              <p>No growth measurements recorded for this profile yet.</p>
            ) : (
              <ul>
                {entries.map((entry) => {
                  let entryDate: Date | null = null;
                  let isTimeValid = false;
                  if (entry.createdAt) {
                    if (entry.createdAt.includes('T')) {
                      entryDate = new Date(entry.createdAt);
                    } else {
                      entryDate = new Date(entry.createdAt + 'T00:00:00');
                    }
                    isTimeValid = !isNaN(entryDate.getTime());
                  }
                  return (
                    <li key={entry.entryId}>
                      <strong>Date:</strong>{' '}
                      {isTimeValid && entryDate
                        ? entryDate.toLocaleString(undefined, {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Invalid Time'}
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
                          <br /> Head: {entry.headCircumference}{' '}
                          {entry.headCircumferenceUnit}
                        </>
                      )}
                      {entry.notes && (
                        <>
                          <br />
                          Notes: {entry.notes}
                        </>
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

export default GrowthTracker;
