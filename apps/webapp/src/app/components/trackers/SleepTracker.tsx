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
  time: string;
  endTime: string;
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

  
  const [time, setStartTime] = useState(getCurrentDateTimeLocal());
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  

  
  const resetForm = useCallback(() => {
    console.log('SleepTracker: resetForm called');
    setStartTime(getCurrentDateTimeLocal());
    setEndTime('');
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
    if (selectedProfile && !isLoading && entries.length === 0 && !hasFetchedEmptyData) {
      console.log(`SleepTracker: Fetching entries for profile ${selectedProfile.id}`);
      fetchEntries();
    } else if (!isLoading) {
      
      
      console.log(
        'SleepTracker: No profile selected or still loading, ensuring entries are clear (hook handles this).'
      );
    }
  }, [selectedProfile?.id, isLoading]);

  
  const handleEditClick = (entry: SleepEntry) => {
    setEditingEntryId(entry.entryId); 
    setStartTime(formatDateTimeLocalInput(entry.time));
    setEndTime(formatDateTimeLocalInput(entry.endTime));
    setNotes(entry.notes || '');
    setFormError(null); 
  };

  
  const validate = () => {
    if (!selectedProfile) return 'No profile selected.';
    if (!time || !endTime) return 'Both start and end time are required.';
    if (new Date(endTime) <= new Date(time)) return 'End time must be after start time.';
    return null;
  };
  const buildEntryData = () => {
    if (!time || !endTime) return null;
    return {
      time: new Date(time).toISOString(),
      endTime: new Date(endTime).toISOString(),
      notes: notes || undefined,
    };
  };
  const { isSubmitting, formError, handleSubmit, setFormError } = useTrackerForm<NewSleepEntryData>({
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
    
    return <div style={{ color: 'red' }}>Error loading profiles: {displayError}</div>;
  }

  return (
    <div>
      <h2>Sleep Tracker {profileName ? `for ${profileName}` : '(Select Profile...)'}</h2>

      {}
      {formError && <p style={{ color: 'red' }}>Error: {formError}</p>}
      {}
      {displayError && !formError && <p style={{ color: 'red' }}>Error: {displayError}</p>}

      {}
      {selectedProfile ? (
        <>
          <section>
            <h3>{editingEntryId ? 'Edit Sleep Entry' : 'Add New Sleep Entry'}</h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="time">Start Time:</label>
                <input
                  type="datetime-local"
                  id="time"
                  value={time}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="endTime">End Time:</label>
                <input
                  type="datetime-local"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="sleepNotes">Notes:</label>
                <textarea id="sleepNotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
                  style={{ marginLeft: '10px' }}
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </section>

          <hr />

          <section>
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
                  return (
                    <li key={entry.entryId}>
                      <strong>Duration:</strong> {calculateDuration(entry.time, entry.endTime)}
                      <br />
                      Start: {formatDateTimeDisplay(entry.time)}
                      <br />
                      End: {formatDateTimeDisplay(entry.endTime)}
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
        
        <p style={{ color: 'orange' }}>Please select a baby profile first.</p>
      )}
    </div>
  );
};

export default SleepTracker;
