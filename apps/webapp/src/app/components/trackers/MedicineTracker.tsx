import React, { useState } from 'react';

interface MedicineEntry {
  id: string;
  time: string;
  medicineName: string;
  dosage?: string;
  notes?: string;
  babyId?: string; // Added for future use
}

const MedicineTracker: React.FC = () => {
  const [entries, setEntries] = useState<MedicineEntry[]>([]);
  const [time, setTime] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!time || !medicineName) return;

    const newEntry: MedicineEntry = {
      id: Date.now().toString(),
      time: new Date(time).toISOString(),
      medicineName: medicineName,
      dosage: dosage || undefined,
      notes: notes || undefined,
    };

    console.log('Adding medicine entry (placeholder):', newEntry);
    // API call to save entry would go here
    setEntries(prev => [...prev, newEntry].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
    // Reset form fields
    setTime('');
    setMedicineName('');
    setDosage('');
    setNotes('');
  };


  return (
    <div>
      <h2>Medicine Tracker</h2>

      <section>
        <h3>Add New Medicine Dose</h3>
        <form onSubmit={handleAddEntry}>
          <div>
            <label htmlFor="medicineTime">Time:</label>
            <input
              type="datetime-local"
              id="medicineTime"
              value={time}
              onChange={(e) => setTime(e.target.value)}
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
          <button type="submit">Add Medicine Entry</button>
        </form>
      </section>

      <hr />

      <section>
        <h3>Medicine Log</h3>
        {entries.length === 0 ? (
          <p>No medicine doses recorded yet.</p>
        ) : (
          <ul>
            {entries.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.medicineName}</strong> {entry.dosage ? `(${entry.dosage})` : ''}
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

export default MedicineTracker;
