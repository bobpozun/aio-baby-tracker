import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../utils/apiClient';
import { useTrackerLogic } from '../../hooks/useTrackerLogic';
import { useTrackerForm } from '../../hooks/useTrackerForm';

import {
  getCurrentDateTimeLocal,
  formatDateTimeLocalInput,
} from '../../utils/dateUtils';

interface NursingEntry {
  createdAt?: string;
  startDateTime?: string;
  entryId: string;

  durationLeft?: number;
  durationRight?: number;
  lastSide?: 'left' | 'right';
  notes?: string;
  babyId: string;
}

type NewNursingEntryData = Omit<NursingEntry, 'entryId' | 'babyId'>;

const NursingTracker: React.FC = () => {
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
  } = useTrackerLogic<NursingEntry>({ trackerType: 'nursing' });

  const [startDateTime, setStartDateTime] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  });
  const [durationLeft, setDurationLeft] = useState('');
  const [durationRight, setDurationRight] = useState('');
  const [lastSide, setLastSide] = useState<'left' | 'right' | ''>('');
  const [notes, setNotes] = useState('');

  const resetForm = useCallback(() => {
    console.log('NursingTracker: resetForm called');
    setDurationLeft('');
    setDurationRight('');
    setLastSide('');
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
        `NursingTracker: Fetching entries for profile ${selectedProfile.id}`
      );
      fetchEntries();
    }
  }, [selectedProfile?.id, isLoading]);

  const handleEditClick = (entry: NursingEntry) => {
    setEditingEntryId(entry.entryId);
    setStartDateTime(
      formatDateTimeLocalInput(entry.startDateTime ?? entry.createdAt)
    );
    setDurationLeft(entry.durationLeft?.toString() || '');
    setDurationRight(entry.durationRight?.toString() || '');
    setLastSide(entry.lastSide || '');
    setNotes(entry.notes || '');
    setFormError(null);
  };

  const validate = () => {
    if (!selectedProfile) return 'No profile selected.';
    if (!startDateTime || (!durationLeft && !durationRight))
      return 'Date and at least one duration are required.';
    if (
      durationLeft &&
      (isNaN(Number(durationLeft)) || Number(durationLeft) < 0)
    )
      return 'Left duration must be a non-negative number.';
    if (
      durationRight &&
      (isNaN(Number(durationRight)) || Number(durationRight) < 0)
    )
      return 'Right duration must be a non-negative number.';
    return null;
  };
  const buildEntryData = () => {
    if (!durationLeft && !durationRight) return null;
    return {
      startDateTime: startDateTime,
      durationLeft: durationLeft ? parseInt(durationLeft, 10) : undefined,
      durationRight: durationRight ? parseInt(durationRight, 10) : undefined,
      lastSide: lastSide || undefined,
      notes: notes || undefined,
    };
  };
  const { isSubmitting, formError, handleSubmit, setFormError } =
    useTrackerForm<NewNursingEntryData>({
      editingEntryId,
      setEditingEntryId,
      selectedProfileId: selectedProfile?.id,
      trackerType: 'nursing',
      fetchEntries,
      buildEntryData,
      validate,
      resetForm,
      apiClient,
    });

  const getTotalDuration = (entry: NursingEntry): number => {
    return (entry.durationLeft || 0) + (entry.durationRight || 0);
  };

  if (isLoading && !selectedProfile) {
    return <div>Loading profile data...</div>;
  }

  if (displayError && !selectedProfile) {
    return (
      <div style={{ color: 'red' }}>Error loading profiles: {displayError}</div>
    );
  }

  return (
    <div className="main-container">
      <h2>
        Nursing Tracker{' '}
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
          <section>
            <h3>
              {editingEntryId
                ? 'Edit Nursing Session'
                : 'Add New Nursing Session'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="nursingDate">Date:</label>
                <input
                  type="datetime-local"
                  id="nursingDate"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
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
            <h3>Nursing Log {profileName ? `for ${profileName}` : ''}</h3>
            {}
            {isLoading && entries.length === 0 ? (
              <p>Loading log...</p>
            ) : entries.length === 0 && hasFetchedEmptyData ? (
              <p>No nursing sessions recorded for this profile yet.</p>
            ) : entries.length === 0 ? (
              <p>Loading log...</p>
            ) : (
              <ul>
                {entries.map((entry) => {
                  const startDate = new Date(
                    entry.startDateTime ?? entry.createdAt ?? ''
                  );
                  const isDateValid = !isNaN(startDate.getTime());

                  return (
                    <li key={entry.entryId}>
                      <div>
                        <strong>Total Duration:</strong>{' '}
                        {getTotalDuration(entry)} mins
                      </div>
                      <div style={{ marginTop: '2px' }}>
                        {typeof entry.durationLeft === 'number' &&
                          entry.durationLeft > 0 && (
                            <span style={{ marginRight: '10px' }}>
                              Left: <strong>{entry.durationLeft} min</strong>
                            </span>
                          )}
                        {typeof entry.durationRight === 'number' &&
                          entry.durationRight > 0 && (
                            <span style={{ marginRight: '10px' }}>
                              Right: <strong>{entry.durationRight} min</strong>
                            </span>
                          )}
                        {entry.lastSide && (
                          <span style={{ color: '#888' }}>
                            (Last Side: {entry.lastSide})
                          </span>
                        )}
                      </div>
                      Start:{' '}
                      {isDateValid
                        ? startDate.toLocaleString(undefined, {
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
                      <div style={{ marginTop: '5px' }}>
                        <button
                          onClick={() => handleEditClick(entry)}
                          disabled={
                            isLoading || isSubmitting || !!editingEntryId
                          }
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
                          disabled={
                            isLoading || isSubmitting || !!editingEntryId
                          }
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

export default NursingTracker;
