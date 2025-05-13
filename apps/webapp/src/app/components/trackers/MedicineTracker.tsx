import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../utils/apiClient';
import { useTrackerLogic } from '../../hooks/useTrackerLogic';
import { useTrackerForm } from '../../hooks/useTrackerForm';

import {
  getCurrentDateTimeLocal,
  formatDateTimeLocalInput,
} from '../../utils/dateUtils';

interface MedicineEntry {
  entryId: string;
  createdAt?: string
  medicineName: string;
  dosage?: string;
  notes?: string;
  babyId: string;
}

type NewMedicineEntryData = Omit<MedicineEntry, 'entryId' | 'babyId'>;

const MedicineTracker: React.FC = () => {
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
  } = useTrackerLogic<MedicineEntry>({ trackerType: 'medicine' });

  const [createdAt, setCreatedAt] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  });
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = useCallback(() => {
    console.log('MedicineTracker: resetForm called');
    setCreatedAt(getCurrentDateTimeLocal());
    setMedicineName('');
    setDosage('');
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

  const handleEditClick = (entry: MedicineEntry) => {
    setEditingEntryId(entry.entryId);
    setCreatedAt(formatDateTimeLocalInput(entry.createdAt));
    setMedicineName(entry.medicineName);
    setDosage(entry.dosage || '');
    setNotes(entry.notes || '');
    setFormError(null);
  };

  const validate = () => {
    if (!selectedProfile) return 'No profile selected.';
    if (!createdAt || !medicineName)
      return 'Time and medicine name are required.';
    return null;
  };
  const buildEntryData = () => {
    if (!createdAt || !medicineName) return null;
    return {
      createdAt,
      medicineName,
      dosage: dosage || undefined,
      notes: notes || undefined,
    };
  };
  const { isSubmitting, formError, handleSubmit, setFormError } =
    useTrackerForm<NewMedicineEntryData>({
      editingEntryId,
      setEditingEntryId,
      selectedProfileId: selectedProfile?.id,
      trackerType: 'medicine',
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
        Medicine Tracker{' '}
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
              {editingEntryId ? 'Edit Medicine Dose' : 'Add New Medicine Dose'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="medicineDate">Date:</label>
                <input
                  type="datetime-local"
                  id="medicineDate"
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
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
                  className="tracker-cancel-btn"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </section>

          <hr />

          <section className="section-card">
            <h3>Medicine Log {profileName ? `for ${profileName}` : ''}</h3>
            {}
            {isLoading && entries.length === 0 ? (
              <p>Loading log...</p>
            ) : entries.length === 0 && hasFetchedEmptyData ? (
              <p>No medicine doses recorded for this profile yet.</p>
            ) : entries.length === 0 ? (
              <p>Loading log...</p>
            ) : (
              <ul>
                {entries.map((entry) => {
                  let entryDate: Date | null = null;
                  let isDateValid = false;
                  if (entry.createdAt) {
                    entryDate = new Date(entry.createdAt ?? '');
                    isDateValid = !isNaN(entryDate.getTime());
                  }
                  return (
                    <li key={entry.entryId}>
                      <strong>Date:</strong>{' '}
                      {isDateValid && entryDate
                        ? entryDate.toLocaleString(undefined, {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Invalid Date'}
                      <br />
                      <strong>{entry.medicineName}</strong>{' '}
                      {entry.dosage ? `(${entry.dosage})` : ''}
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

export default MedicineTracker;
