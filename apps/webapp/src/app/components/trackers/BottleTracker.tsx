import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../utils/apiClient';
import { useTrackerLogic } from '../../hooks/useTrackerLogic';
import { useTrackerForm } from '../../hooks/useTrackerForm';

import {
  getCurrentDateTimeLocal,
  formatDateTimeLocalInput,
} from '../../utils/dateUtils';

interface BottleEntry {
  createdAt?: string;
  startDateTime?: string;
  entryId: string;
  amount: number;
  unit: 'ml' | 'oz';
  type: 'formula' | 'breast_milk' | 'other';
  notes?: string;
  babyId: string;
}

type NewBottleEntryData = Omit<BottleEntry, 'entryId' | 'babyId'>;

const BottleTracker: React.FC = () => {
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
  } = useTrackerLogic<BottleEntry>({ trackerType: 'bottle' });

  const [createdAt, setCreatedAt] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  });
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<'ml' | 'oz'>('ml');
  const [type, setType] = useState<'formula' | 'breast_milk' | 'other'>(
    'formula'
  );
  const [notes, setNotes] = useState('');

  const resetForm = useCallback(() => {
    console.log('BottleTracker: resetForm called');
    setCreatedAt(new Date().toISOString());
    setAmount('');
    setUnit('ml');
    setType('formula');
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
        `BottleTracker: Fetching entries for profile ${selectedProfile.id}`
      );
      fetchEntries();
    }
  }, [selectedProfile?.id, isLoading]);

  const handleEditClick = (entry: BottleEntry) => {
    setEditingEntryId(entry.entryId);
    setCreatedAt(
      formatDateTimeLocalInput(entry.startDateTime ?? entry.createdAt)
    );
    setAmount(entry.amount?.toString() || '');
    setUnit(entry.unit);
    setType(entry.type);
    setNotes(entry.notes || '');
    setFormError(null);
  };

  const validate = () => {
    if (!selectedProfile) return 'No profile selected.';
    if (!amount) return 'Amount is required.';
    if (isNaN(Number(amount)) || Number(amount) <= 0)
      return 'Amount must be a positive number.';
    return null;
  };
  const buildEntryData = () => {
    if (!amount) return null;
    return {
      createdAt,
      amount: parseFloat(amount),
      unit,
      type,
      notes: notes || undefined,
    };
  };
  const { isSubmitting, formError, handleSubmit, setFormError } =
    useTrackerForm<NewBottleEntryData>({
      editingEntryId,
      setEditingEntryId,
      selectedProfileId: selectedProfile?.id,
      trackerType: 'bottle',
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
        Bottle Tracker{' '}
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
              {editingEntryId
                ? 'Edit Bottle Feeding'
                : 'Add New Bottle Feeding'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="bottleDate">Date:</label>
                <input
                  type="datetime-local"
                  id="bottleTime"
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="bottleAmount">Amount:</label>
                <input
                  type="number"
                  id="bottleAmount"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as 'ml' | 'oz')}
                >
                  <option value="ml">ml</option>
                  <option value="oz">oz</option>
                </select>
              </div>
              <div>
                <label htmlFor="bottleType">Type:</label>
                <select
                  value={type}
                  onChange={(e) =>
                    setType(
                      e.target.value as 'formula' | 'breast_milk' | 'other'
                    )
                  }
                >
                  <option value="formula">Formula</option>
                  <option value="breast_milk">Breast Milk</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="bottleNotes">Notes:</label>
                <textarea
                  id="bottleNotes"
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
                  : 'Add Bottle Entry'}
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
            <h3>Bottle Log {profileName ? `for ${profileName}` : ''}</h3>
            {}
            {isLoading && entries.length === 0 ? (
              <p>Loading log...</p>
            ) : entries.length === 0 && hasFetchedEmptyData ? (
              <p>No bottle feedings recorded for this profile yet.</p>
            ) : entries.length === 0 ? (
              <p>Loading log...</p>
            ) : (
              <ul>
                {entries.map((entry) => {
                  const entryDate = new Date(entry.createdAt ?? '');
                  const isDateValid = !isNaN(entryDate.getTime());
                  const amount = entry.amount ?? null;
                  const unit = entry.unit ?? (entry.amount ? 'ml' : null);
                  const type = entry.type ?? 'formula';
                  const formattedType =
                    typeof type === 'string' ? type.replace('_', ' ') : 'N/A';
                  return (
                    <li key={entry.entryId}>
                      <strong>
                        {amount !== null && amount !== undefined
                          ? `${amount} ${unit}`
                          : '(N/A)'}
                      </strong>
                      {type ? ` (${formattedType})` : ''}
                      <br />
                      Date:{' '}
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

export default BottleTracker;
