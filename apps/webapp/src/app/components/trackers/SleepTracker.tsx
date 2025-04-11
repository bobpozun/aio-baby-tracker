import React, { useState } from 'react';

interface SleepEntry {
  id: string;
  startTime: string;
  endTime: string;
  notes?: string;
  babyId?: string; // Added for future use
}

const SleepTracker: React.FC = () => {
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');

  // Note: formatDateTimeLocal function removed as it wasn't used in the form

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) return;

    const newEntry: SleepEntry = {
      id: Date.now().toString(),
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      notes: notes || undefined,
    };

    console.log('Adding sleep entry (placeholder):', newEntry);
    // API call to save entry would go here
    setEntries(prev => [...prev, newEntry].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
    // Reset form fields
    setStartTime('');
    setEndTime('');
    setNotes('');
  };

  const calculateDuration = (start: string, end: string): string => {
    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    if (durationMs < 0) return 'Invalid Dates';
    const hours = Math.floor(durationMs / 3600000); // (1000 * 60 * 60)
    const minutes = Math.floor((durationMs % 3600000) / 60000); // (1000 * 60)
    return `${hours}h ${minutes}m`;
  };

  return (
    <div>
      <h2>Sleep Tracker</h2>

      <section>
        <h3>Add New Sleep Entry</h3>
        <form onSubmit={handleAddEntry}>
          <div>
            <label htmlFor="startTime">Start Time:</label>
            <input
              type="datetime-local"
              id="startTime"
              value={startTime}
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
            <textarea
              id="sleepNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <button type="submit">Add Sleep Entry</button>
        </form>
      </section>

      <hr />

      <section>
        <h3>Sleep Log</h3>
        {entries.length === 0 ? (
          <p>No sleep entries recorded yet.</p>
        ) : (
          <ul>
            {entries.map((entry) => (
              <li key={entry.id}>
                <strong>Duration:</strong> {calculateDuration(entry.startTime, entry.endTime)}
                <br />
                Start: {new Date(entry.startTime).toLocaleString()}
                <br />
                End: {new Date(entry.endTime).toLocaleString()}
                {entry.notes && <><br />Notes: {entry.notes}</>}
                {/* Add Edit/Delete buttons later */}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default SleepTracker;
