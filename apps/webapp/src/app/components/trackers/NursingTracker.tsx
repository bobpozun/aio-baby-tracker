import React, { useState } from 'react';

interface NursingEntry {
  id: string;
  startTime: string;
  durationLeft?: number; // minutes
  durationRight?: number; // minutes
  lastSide?: 'left' | 'right';
  notes?: string;
  babyId?: string; // Added for future use
}

const NursingTracker: React.FC = () => {
  const [entries, setEntries] = useState<NursingEntry[]>([]);
  const [startTime, setStartTime] = useState('');
  const [durationLeft, setDurationLeft] = useState('');
  const [durationRight, setDurationRight] = useState('');
  const [lastSide, setLastSide] = useState<'left' | 'right' | ''>('');
  const [notes, setNotes] = useState('');

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || (!durationLeft && !durationRight)) return;

    const newEntry: NursingEntry = {
      id: Date.now().toString(),
      startTime: new Date(startTime).toISOString(),
      durationLeft: durationLeft ? parseInt(durationLeft, 10) : undefined,
      durationRight: durationRight ? parseInt(durationRight, 10) : undefined,
      lastSide: lastSide || undefined,
      notes: notes || undefined,
    };

    console.log('Adding nursing entry (placeholder):', newEntry);
    // API call to save entry would go here
    setEntries(prev => [...prev, newEntry].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
    // Reset form fields
    setStartTime('');
    setDurationLeft('');
    setDurationRight('');
    setLastSide('');
    setNotes('');
  };


  const getTotalDuration = (entry: NursingEntry): number => {
    return (entry.durationLeft || 0) + (entry.durationRight || 0);
  };

  return (
    <div>
      <h2>Nursing Tracker</h2>

      <section>
        <h3>Add New Nursing Session</h3>
        <form onSubmit={handleAddEntry}>
          <div>
            <label htmlFor="nursingStartTime">Start Time:</label>
            <input
              type="datetime-local"
              id="nursingStartTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
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
                onChange={(e) => setLastSide(e.target.value as 'left' | 'right' | '')}
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
          <button type="submit">Add Nursing Session</button>
        </form>
      </section>

      <hr />

      <section>
        <h3>Nursing Log</h3>
        {entries.length === 0 ? (
          <p>No nursing sessions recorded yet.</p>
        ) : (
          <ul>
            {entries.map((entry) => (
              <li key={entry.id}>
                <strong>Total Duration:</strong> {getTotalDuration(entry)} mins
                {entry.durationLeft && ` (L: ${entry.durationLeft}m)`}
                {entry.durationRight && ` (R: ${entry.durationRight}m)`}
                {entry.lastSide && ` (Last: ${entry.lastSide})`}
                <br />
                Start: {new Date(entry.startTime).toLocaleString()}
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

export default NursingTracker;
