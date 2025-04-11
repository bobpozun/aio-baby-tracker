import React, { useState } from 'react';

interface TemperatureEntry {
  id: string;
  time: string;
  temperature: number;
  unit: 'C' | 'F';
  notes?: string;
  babyId?: string; // Added for future use
}

const TemperatureTracker: React.FC = () => {
  const [entries, setEntries] = useState<TemperatureEntry[]>([]);
  const [time, setTime] = useState('');
  const [temperature, setTemperature] = useState('');
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [notes, setNotes] = useState('');

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!time || !temperature) return;

    const newEntry: TemperatureEntry = {
      id: Date.now().toString(),
      time: new Date(time).toISOString(),
      temperature: parseFloat(temperature),
      unit: unit,
      notes: notes || undefined,
    };

    console.log('Adding temperature entry (placeholder):', newEntry);
    // API call to save entry would go here
    setEntries(prev => [...prev, newEntry].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
    // Reset form fields
    setTime('');
    setTemperature('');
    setUnit('C');
    setNotes('');
  };


  return (
    <div>
      <h2>Temperature Tracker</h2>

      <section>
        <h3>Add New Temperature Reading</h3>
        <form onSubmit={handleAddEntry}>
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
              step="0.1" // Allow decimal for temperature
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
            <textarea
              id="tempNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <button type="submit">Add Temperature Entry</button>
        </form>
      </section>

      <hr />

      <section>
        <h3>Temperature Log</h3>
        {entries.length === 0 ? (
          <p>No temperature readings recorded yet.</p>
        ) : (
          <ul>
            {entries.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.temperature}°{entry.unit}</strong>
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

export default TemperatureTracker;
