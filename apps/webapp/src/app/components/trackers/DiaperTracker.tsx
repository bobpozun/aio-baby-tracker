import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../utils/apiClient';
import { useTrackerLogic } from '../../hooks/useTrackerLogic';
import { useTrackerForm } from '../../hooks/useTrackerForm';

import { formatDateTimeLocalInput } from '../../utils/dateUtils';

interface DiaperEntry {
  createdAt?: string;
  startDateTime?: string;
  entryId: string;
  type?: 'wet' | 'dirty' | 'mixed';
  wet?: boolean;
  dirty?: boolean;
  notes?: string;
  babyId: string;
}

type NewDiaperEntryData = Omit<DiaperEntry, 'entryId' | 'babyId'>;

const DiaperTracker: React.FC = () => {
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
  } = useTrackerLogic<DiaperEntry>({ trackerType: 'diaper' });

  const [createdAt, setCreatedAt] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  });
  const [type, setType] = useState<'wet' | 'dirty' | 'mixed'>('wet');
  const [notes, setNotes] = useState('');

  const resetForm = useCallback(() => {
    console.log('DiaperTracker: resetForm called');
    setType('wet');
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
        `DiaperTracker: Fetching entries for profile ${selectedProfile.id}`
      );
      fetchEntries();
    }
  }, [selectedProfile?.id, isLoading]);

  const handleEditClick = (entry: DiaperEntry) => {
    setEditingEntryId(entry.entryId);
    setCreatedAt(
      formatDateTimeLocalInput(entry.startDateTime ?? entry.createdAt)
    );
    setType(entry.type ?? 'wet');
    setNotes(entry.notes || '');
    setFormError(null);
  };

  const validate = () => {
    if (!selectedProfile) return 'No profile selected.';
    if (!createdAt) return 'Time is required.';
    return null;
  };
  const buildEntryData = () => {
    return {
      createdAt,
      type,
      notes: notes || undefined,
    };
  };
  const { isSubmitting, formError, handleSubmit, setFormError } =
    useTrackerForm<NewDiaperEntryData>({
      editingEntryId,
      setEditingEntryId,
      selectedProfileId: selectedProfile?.id,
      trackerType: 'diaper',
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
        Diaper Tracker{' '}
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
              {editingEntryId ? 'Edit Diaper Change' : 'Add New Diaper Change'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="diaperDate">Date:</label>
                <input
                  type="datetime-local"
                  id="diaperDate"
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
                    id="wet"
                    name="diaperType"
                    value="wet"
                    checked={type === 'wet'}
                    onChange={() => setType('wet')}
                  />
                  <label htmlFor="wet">Wet</label>
                </div>
                <div>
                  <input
                    type="radio"
                    id="dirty"
                    name="diaperType"
                    value="dirty"
                    checked={type === 'dirty'}
                    onChange={() => setType('dirty')}
                  />
                  <label htmlFor="dirty">Dirty</label>
                </div>
                <div>
                  <input
                    type="radio"
                    id="mixed"
                    name="diaperType"
                    value="mixed"
                    checked={type === 'mixed'}
                    onChange={() => setType('mixed')}
                  />
                  <label htmlFor="mixed">Mixed</label>
                </div>
              </div>
              <div>
                <label htmlFor="diaperNotes">Notes:</label>
                <textarea
                  id="diaperNotes"
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
                  : 'Add Diaper Entry'}
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
            <h3>Diaper Log {profileName ? `for ${profileName}` : ''}</h3>
            {}
            {isLoading && entries.length === 0 ? (
              <p>Loading log...</p>
            ) : entries.length === 0 && hasFetchedEmptyData ? (
              <p>No diaper changes recorded for this profile yet.</p>
            ) : entries.length === 0 ? (
              <p>Loading log...</p>
            ) : (
              <ul>
                {entries.map((entry) => {
                  const entryDate = new Date(
                    entry.startDateTime ?? entry.createdAt ?? ''
                  );
                  const isDateValid = !isNaN(entryDate.getTime());

                  let inferredType = '(Unknown)';
                  if (entry.type) {
                    inferredType =
                      entry.type.charAt(0).toUpperCase() + entry.type.slice(1);
                  } else if (entry.wet && entry.dirty) {
                    inferredType = 'Mixed';
                  } else if (entry.wet) {
                    inferredType = 'Wet';
                  } else if (entry.dirty) {
                    inferredType = 'Dirty';
                  }
                  return (
                    <li key={entry.entryId}>
                      <strong>Type: {inferredType}</strong>
                      <br />
                      Time:{' '}
                      {isDateValid
                        ? entryDate.toLocaleString(undefined, {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Invalid Date'}
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

export default DiaperTracker;
