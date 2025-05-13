import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../utils/apiClient';
import { useTrackerLogic } from '../../hooks/useTrackerLogic';
import { useTrackerForm } from '../../hooks/useTrackerForm';

import {
  getCurrentDateTimeLocal,
  formatDateTimeLocalInput,
  calculateDuration,
  formatDateTimeDisplay,
} from '../../utils/dateUtils';

interface SleepEntry {
  entryId: string;
  createdAt?: string;
  startDateTime?: string;
  endTime: string;
  endDateTime?: string;
  notes?: string;
  babyId: string;
}

type NewSleepEntryData = Omit<SleepEntry, 'entryId' | 'babyId'>;

const SleepTracker: React.FC = () => {
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
  } = useTrackerLogic<SleepEntry>({ trackerType: 'sleep' });

  const [startDateTime, setStartDateTime] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  });
  const [endDateTime, setEndDateTime] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = useCallback(() => {
    console.log('SleepTracker: resetForm called');
    setStartDateTime(getCurrentDateTimeLocal());
    setEndDateTime('');
    setNotes('');
    setEditingEntryId(null);
    setFormError(null);
  }, [setEditingEntryId]);

  useEffect(() => {
    if (!isLoading) {
      console.log(
        `SleepTracker: Profile or loading changed (isLoading: ${isLoading}, selectedProfile: ${selectedProfile?.id}). Resetting form.`
      );
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
        `SleepTracker: Fetching entries for profile ${selectedProfile.id}`
      );
      fetchEntries();
    } else if (!isLoading) {
      console.log(
        'SleepTracker: No profile selected or still loading, ensuring entries are clear (hook handles this).'
      );
    }
  }, [selectedProfile?.id, isLoading]);

  const handleEditClick = (entry: SleepEntry) => {
    setEditingEntryId(entry.entryId);
    setStartDateTime(
      formatDateTimeLocalInput(entry.startDateTime || entry.createdAt)
    );
    setEndDateTime(
      formatDateTimeLocalInput(entry.endDateTime || entry.endTime)
    );
    setNotes(entry.notes || '');
    setFormError(null);
  };

  const validate = () => {
    if (!selectedProfile) return 'No profile selected.';
    if (!startDateTime || !endDateTime)
      return 'Both start and end date/time are required.';
    if (new Date(endDateTime) <= new Date(startDateTime))
      return 'End time must be after start time.';
    return null;
  };
  const buildEntryData = () => {
    if (!startDateTime || !endDateTime) return null;
    const startISO = new Date(startDateTime).toISOString();
    const endISO = new Date(endDateTime).toISOString();
    return {
      startDateTime: startISO,
      endDateTime: endISO,
      endTime: endISO,
      notes: notes || undefined,
    };
  };
  const { isSubmitting, formError, handleSubmit, setFormError } =
    useTrackerForm<NewSleepEntryData>({
      editingEntryId,
      setEditingEntryId,
      selectedProfileId: selectedProfile?.id,
      trackerType: 'sleep',
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
        Sleep Tracker{' '}
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
              {editingEntryId ? 'Edit Sleep Entry' : 'Add New Sleep Entry'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="startDateTime">Date:</label>
                <input
                  type="datetime-local"
                  id="startDateTime"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="endDateTime">Date:</label>
                <input
                  type="datetime-local"
                  id="endDateTime"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="sleepNotes">Notes:</label>
                <textarea
                  id="sleepNotes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              {}
              <button type="submit" disabled={isSubmitting || !selectedProfile}>
                {isSubmitting
                  ? editingEntryId
                    ? 'Updating...'
                    : 'Adding...'
                  : editingEntryId
                  ? 'Update Entry'
                  : 'Add Sleep Entry'}
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
            <h3>Sleep Log {profileName ? `for ${profileName}` : ''}</h3>
            {}
            {isLoading && entries.length === 0 ? (
              <p>Loading log...</p>
            ) : entries.length === 0 && hasFetchedEmptyData ? (
              <p>No sleep entries recorded for this profile yet.</p>
            ) : entries.length === 0 ? (
              <p>Loading log...</p>
            ) : (
              <ul>
                {entries.map((entry) => {
                  const start = entry.startDateTime || entry.createdAt;
                  const end = entry.endDateTime || entry.endTime;
                  const startDate = start ? new Date(start) : null;
                  const endDate = end ? new Date(end) : null;
                  const formattedStart =
                    startDate && !isNaN(startDate.getTime())
                      ? startDate.toLocaleString(undefined, {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Invalid Date';
                  const formattedEnd =
                    endDate && !isNaN(endDate.getTime())
                      ? endDate.toLocaleString(undefined, {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Invalid Date';
                  return (
                    <li key={entry.entryId}>
                      <strong>Duration:</strong> {calculateDuration(start, end)}
                      <br />
                      Start: {formattedStart}
                      <br />
                      End: {formattedEnd}
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

export default SleepTracker;
