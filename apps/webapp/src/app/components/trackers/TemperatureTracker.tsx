import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../utils/apiClient';
import { useTrackerLogic } from '../../hooks/useTrackerLogic';
import { useTrackerForm } from '../../hooks/useTrackerForm';

import { getCurrentDateTimeLocal, formatDateTimeLocalInput } from '../../utils/dateUtils';


interface TemperatureEntry {
  entryId: string;
  time: string;
  temperature: number;
  unit: 'C' | 'F';
  notes?: string;
  babyId: string;
}


type NewTemperatureEntryData = Omit<TemperatureEntry, 'entryId' | 'babyId'>;

const TemperatureTracker: React.FC = () => {
  
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
  } = useTrackerLogic<TemperatureEntry>({ trackerType: 'temperature' });

  
  const [time, setTime] = useState(getCurrentDateTimeLocal());
  const [temperature, setTemperature] = useState('');
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [notes, setNotes] = useState('');
  

  
  const resetForm = useCallback(() => {
    console.log('TemperatureTracker: resetForm called');
    setTime(getCurrentDateTimeLocal());
    setTemperature('');
    setUnit('C');
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
      fetchEntries();
    }
  }, [selectedProfile?.id, isLoading]);

  
  const handleEditClick = (entry: TemperatureEntry) => {
    setEditingEntryId(entry.entryId); 
    setTime(formatDateTimeLocalInput(entry.time));
    setTemperature(entry.temperature.toString());
    setUnit(entry.unit);
    setNotes(entry.notes || '');
    setFormError(null);
  };

  
  const validate = () => {
    if (!selectedProfile) return 'No profile selected.';
    if (!time || !temperature) return 'Time and temperature are required.';
    if (isNaN(Number(temperature))) return 'Temperature must be a number.';
    return null;
  };
  const buildEntryData = () => {
    if (!time || !temperature) return null;
    return {
      time, // Use ISO string directly
      temperature: parseFloat(temperature),
      unit,
      notes: notes || undefined,
    };
  };
  const { isSubmitting, formError, handleSubmit, setFormError } = useTrackerForm<NewTemperatureEntryData>({
    editingEntryId,
    setEditingEntryId,
    selectedProfileId: selectedProfile?.id,
    trackerType: 'temperature',
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
      <h2>Temperature Tracker {profileName ? `for ${profileName}` : '(Select Profile...)'}</h2>

      {}
      {formError && <p style={{ color: 'red' }}>Error: {formError}</p>}
      {}
      {displayError && !formError && <p style={{ color: 'red' }}>Error: {displayError}</p>}

      {}
      {selectedProfile ? (
        <>
          <section>
            <h3>{editingEntryId ? 'Edit Temperature Reading' : 'Add New Temperature Reading'}</h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="tempTime">Time:</label>
                <input
                  type="datetime-local"
                  id="tempTime"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="tempValue">Temperature:</label>
                <input
                  type="number"
                  id="tempValue"
                  step="0.1" 
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  required
                />
                <select value={unit} onChange={(e) => setUnit(e.target.value as 'C' | 'F')}>
                  <option value="C">°C</option>
                  <option value="F">°F</option>
                </select>
              </div>
              <div>
                <label htmlFor="tempNotes">Notes:</label>
                <textarea id="tempNotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <button type="submit" disabled={isSubmitting || !selectedProfile}>
                {isSubmitting
                  ? editingEntryId
                    ? 'Updating...'
                    : 'Adding...'
                  : editingEntryId
                  ? 'Update Entry'
                  : 'Add Temperature Entry'}
              </button>
              {editingEntryId && (
                <button type="button" onClick={resetForm} disabled={isSubmitting} style={{ marginLeft: '10px' }}>
                  Cancel Edit
                </button>
              )}
            </form>
          </section>

          <hr />

          <section>
            <h3>Temperature Log {profileName ? `for ${profileName}` : ''}</h3>
            {}
            {isLoading && entries.length === 0 ? (
              <p>Loading log...</p>
            ) : entries.length === 0 && hasFetchedEmptyData ? (
              <p>No temperature readings recorded for this profile yet.</p>
            ) : entries.length === 0 ? (
              <p>Loading log...</p>
            ) : (
              <ul>
                {entries.map((entry) => {
                  const entryDate = new Date(entry.time);
                  const isDateValid = !isNaN(entryDate.getTime());
                  return (
                    <li key={entry.entryId}>
                      <strong>
                        {entry.temperature}°{entry.unit}
                      </strong>
                      <br />
                      Time:{' '}
                      {isDateValid
                        ? entryDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
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

export default TemperatureTracker;
