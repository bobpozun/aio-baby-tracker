import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../utils/apiClient';
import { useTrackerLogic } from '../../hooks/useTrackerLogic';
import { useTrackerForm } from '../../hooks/useTrackerForm';

import {
  getCurrentDateTimeLocal,
  formatDateTimeLocalInput,
} from '../../utils/dateUtils';

interface PottyEntry {
  entryId: string;
  createdAt?: string;
  type: 'pee' | 'poop' | 'both';

  notes?: string;
  babyId: string;
}

type NewPottyEntryData = Omit<PottyEntry, 'entryId' | 'babyId'>;

const PottyTracker: React.FC = () => {
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
  } = useTrackerLogic<PottyEntry>({ trackerType: 'potty' });

  const [createdAt, setCreatedAt] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  });
  const [type, setType] = useState<'pee' | 'poop' | 'both'>('pee');

  const [notes, setNotes] = useState('');

  const resetForm = useCallback(() => {
    console.log('PottyTracker: resetForm called');
    setCreatedAt(getCurrentDateTimeLocal());
    setType('pee');

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
      fetchEntries();
    }
  }, [selectedProfile?.id, isLoading]);

  const handleEditClick = (entry: PottyEntry) => {
    setEditingEntryId(entry.entryId);
    setCreatedAt(formatDateTimeLocalInput(entry.createdAt));
    setType(entry.type);

    setNotes(entry.notes || '');
    setFormError(null);
  };

  const validate = () => {
    if (!selectedProfile) return 'No profile selected.';
    if (!createdAt) return 'Time is required.';
    return null;
  };
  const buildEntryData = () => {
    if (!createdAt) return null;
    return {
      createdAt,
      type,

      notes: notes || undefined,
    };
  };
  const { isSubmitting, formError, handleSubmit, setFormError } =
    useTrackerForm<NewPottyEntryData>({
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

  if (isLoading && !selectedProfile) {
    return <div>Loading profile data...</div>;
  }

  if (displayError && !selectedProfile) {
    return (
      <div style={{ color: 'red' }}>Error loading profiles: {displayError}</div>
    );
  }

  return (
    <div>
      <h2 className="tracker-title">
        Potty Tracker{' '}
        {profileName ? `for ${profileName}` : '(Select Profile...)'}
      </h2>

      {}
      {formError && <p style={{ color: 'red' }}>Error: {formError}</p>}
      {}
      {displayError && !formError && (
        <p style={{ color: 'red' }}>Error: {displayError}</p>
      )}

      {}
      {selectedProfile ? (
        <>
          <section className="section-card">
            <h3>
              {editingEntryId ? 'Edit Potty Event' : 'Add New Potty Event'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="pottyDate">Date:</label>
                <input
                  type="datetime-local"
                  id="pottyTime"
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
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
                  className="tracker-cancel-btn"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </section>

          <hr />

          <section className="section-card">
            <h3>Potty Log {profileName ? `for ${profileName}` : ''}</h3>
            {}
            {isLoading && entries.length === 0 ? (
              <p>Loading log...</p>
            ) : entries.length === 0 && hasFetchedEmptyData ? (
              <p>No potty events recorded for this profile yet.</p>
            ) : entries.length === 0 ? (
              <p>Loading log...</p>
            ) : (
              <ul>
                {entries.map((entry) => {
                  let entryDate: Date | null = null;
                  let isDateValid = false;
                  if (entry.createdAt) {
                    entryDate = new Date(entry.createdAt);
                    isDateValid = !isNaN(entryDate.getTime());
                  }
                  const formattedType =
                    entry.type === 'pee'
                      ? 'Pee'
                      : entry.type === 'poop'
                      ? 'Poop'
                      : 'Both';
                  return (
                    <li key={entry.entryId}>
                      <strong>Type:</strong> {formattedType}
                      <br />
                      <strong>Time:</strong>{' '}
                      {isDateValid && entryDate
                        ? entryDate.toLocaleString(undefined, {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Invalid Time'}
                      {entry.notes && (
                        <>
                          <br />
                          <strong>Notes:</strong> {entry.notes}
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

export default PottyTracker;
