import React, { useState } from 'react';

interface PottyEntry {
  id: string;
  time: string;
  type: 'pee' | 'poop' | 'both';
  location: 'potty' | 'diaper' | 'other';
  notes?: string;
  babyId?: string; // Added for future use
}

const PottyTracker: React.FC = () => {
  const [entries, setEntries] = useState<PottyEntry[]>([]);
  const [time, setTime] = useState('');
  const [type, setType] = useState<'pee' | 'poop' | 'both'>('pee');
  const [location, setLocation] = useState<'potty' | 'diaper' | 'other'>('potty');
  const [notes, setNotes] = useState('');

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!time) return;

    const newEntry: PottyEntry = {
      id: Date.now().toString(),
      time: new Date(time).toISOString(),
      type: type,
      location: location,
      notes: notes || undefined,
    };

    console.log('Adding potty entry (placeholder):', newEntry);
    // API call to save entry would go here
    setEntries(prev => [...prev, newEntry].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
    // Reset form fields
    setTime('');
    setType('pee');
    setLocation('potty');
    setNotes('');
  };


  return (
    <div>
      <h2>Potty Tracker</h2>

      <section>
        <h3>Add New Potty Event</h3>
        <form onSubmit={handleAddEntry}>
          <div>
            <label htmlFor="pottyTime">Time:</label>
            <input
              type="datetime-local"
              id="pottyTime"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Type:</label>
            <div>
              <input type="radio" id="pee" name="pottyType" value="pee" checked={type === 'pee'} onChange={() => setType('pee')} />
              <label htmlFor="pee">Pee</label>
            </div>
            <div>
              <input type="radio" id="poop" name="pottyType" value="poop" checked={type === 'poop'} onChange={() => setType('poop')} />
              <label htmlFor="poop">Poop</label>
            </div>
            <div>
              <input type="radio" id="both" name="pottyType" value="both" checked={type === 'both'} onChange={() => setType('both')} />
              <label htmlFor="both">Both</label>
            </div>
          </div>
           <div>
            <label>Location:</label>
            <div>
              <input type="radio" id="potty" name="pottyLocation" value="potty" checked={location === 'potty'} onChange={() => setLocation('potty')} />
              <label htmlFor="potty">Potty</label>
            </div>
            <div>
              <input type="radio" id="diaper" name="pottyLocation" value="diaper" checked={location === 'diaper'} onChange={() => setLocation('diaper')} />
              <label htmlFor="diaper">Diaper</label>
            </div>
             <div>
              <input type="radio" id="other" name="pottyLocation" value="other" checked={location === 'other'} onChange={() => setLocation('other')} />
              <label htmlFor="other">Other</label>
            </div>
          </div>
          <div>
            <label htmlFor="pottyNotes">Notes:</label>
            <textarea
              id="pottyNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <button type="submit">Add Potty Entry</button>
        </form>
      </section>

      <hr />

      <section>
        <h3>Potty Log</h3>
        {entries.length === 0 ? (
          <p>No potty events recorded yet.</p>
        ) : (
          <ul>
            {entries.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}</strong> in {entry.location}
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

export default PottyTracker;
