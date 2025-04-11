import React, { useState } from 'react';

interface BottleEntry {
  id: string;
  time: string;
  amount: number;
  unit: 'ml' | 'oz';
  type: 'formula' | 'breast_milk' | 'other';
  notes?: string;
  babyId?: string; // Added for future use
}

const BottleTracker: React.FC = () => {
  const [entries, setEntries] = useState<BottleEntry[]>([]);
  const [time, setTime] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<'ml' | 'oz'>('ml');
  const [type, setType] = useState<'formula' | 'breast_milk' | 'other'>('formula');
  const [notes, setNotes] = useState('');

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!time || !amount) return;

    const newEntry: BottleEntry = {
      id: Date.now().toString(),
      time: new Date(time).toISOString(),
      amount: parseFloat(amount),
      unit: unit,
      type: type,
      notes: notes || undefined,
    };

    console.log('Adding bottle entry (placeholder):', newEntry);
    // API call to save entry would go here
    setEntries(prev => [...prev, newEntry].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
    // Reset form fields
    setTime('');
    setAmount('');
    setUnit('ml');
    setType('formula');
    setNotes('');
  };


  return (
    <div>
      <h2>Bottle Tracker</h2>

      <section>
        <h3>Add New Bottle Feeding</h3>
        <form onSubmit={handleAddEntry}>
          <div>
            <label htmlFor="bottleTime">Time:</label>
            <input
              type="datetime-local"
              id="bottleTime"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="bottleAmount">Amount:</label>
            <input
              type="number"
              id="bottleAmount"
              min="0"
              step="any" // Allow decimals
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <select value={unit} onChange={(e) => setUnit(e.target.value as 'ml' | 'oz')}>
              <option value="ml">ml</option>
              <option value="oz">oz</option>
            </select>
          </div>
          <div>
            <label htmlFor="bottleType">Type:</label>
            <select value={type} onChange={(e) => setType(e.target.value as 'formula' | 'breast_milk' | 'other')}>
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
          <button type="submit">Add Bottle Entry</button>
        </form>
      </section>

      <hr />

      <section>
        <h3>Bottle Log</h3>
        {entries.length === 0 ? (
          <p>No bottle feedings recorded yet.</p>
        ) : (
          <ul>
            {entries.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.amount} {entry.unit}</strong> ({entry.type.replace('_', ' ')})
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

export default BottleTracker;
