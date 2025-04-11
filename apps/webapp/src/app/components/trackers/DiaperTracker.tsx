import React, { useState } from 'react';

interface DiaperEntry {
  id: string;
  time: string;
  type: 'wet' | 'dirty' | 'mixed';
  notes?: string;
  babyId?: string; // Added for future use
}

const DiaperTracker: React.FC = () => {
  const [entries, setEntries] = useState<DiaperEntry[]>([]);
  const [time, setTime] = useState('');
  const [type, setType] = useState<'wet' | 'dirty' | 'mixed'>('wet');
  const [notes, setNotes] = useState('');

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!time) return;

    const newEntry: DiaperEntry = {
      id: Date.now().toString(),
      time: new Date(time).toISOString(),
      type: type,
      notes: notes || undefined,
    };

    console.log('Adding diaper entry (placeholder):', newEntry);
    // API call to save entry would go here
    setEntries(prev => [...prev, newEntry].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
    // Reset form fields
    setTime('');
    setType('wet');
    setNotes('');
  };


  return (
    <div>
      <h2>Diaper Tracker</h2>

      <section>
        <h3>Add New Diaper Change</h3>
        <form onSubmit={handleAddEntry}>
          <div>
            <label htmlFor="diaperTime">Time:</label>
            <input
              type="datetime-local"
              id="diaperTime"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Type:</label>
            <div>
              <input type="radio" id="wet" name="diaperType" value="wet" checked={type === 'wet'} onChange={() => setType('wet')} />
              <label htmlFor="wet">Wet</label>
            </div>
            <div>
              <input type="radio" id="dirty" name="diaperType" value="dirty" checked={type === 'dirty'} onChange={() => setType('dirty')} />
              <label htmlFor="dirty">Dirty</label>
            </div>
            <div>
              <input type="radio" id="mixed" name="diaperType" value="mixed" checked={type === 'mixed'} onChange={() => setType('mixed')} />
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
          <button type="submit">Add Diaper Entry</button>
        </form>
      </section>

      <hr />

      <section>
        <h3>Diaper Log</h3>
        {entries.length === 0 ? (
          <p>No diaper changes recorded yet.</p>
        ) : (
          <ul>
            {entries.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}</strong>
                <br />
                Time: {new Date(entry.time).toLocaleString()}
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

export default DiaperTracker;
