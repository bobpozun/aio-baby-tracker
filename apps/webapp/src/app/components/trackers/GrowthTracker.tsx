import React, { useState } from 'react';

interface GrowthEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weight?: number;
  weightUnit?: 'kg' | 'lb';
  height?: number;
  heightUnit?: 'cm' | 'in';
  headCircumference?: number;
  headCircumferenceUnit?: 'cm' | 'in';
  notes?: string;
  babyId?: string; // Added for future use
}

const GrowthTracker: React.FC = () => {
  const [entries, setEntries] = useState<GrowthEntry[]>([]);
  const [date, setDate] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [height, setHeight] = useState('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'in'>('cm');
  const [headCircumference, setHeadCircumference] = useState('');
  const [headCircumferenceUnit, setHeadCircumferenceUnit] = useState<'cm' | 'in'>('cm');
  const [notes, setNotes] = useState('');

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || (!weight && !height && !headCircumference)) {
        alert('Please enter a date and at least one measurement.');
        return;
    }

    const newEntry: GrowthEntry = {
      id: Date.now().toString(),
      date: new Date(date).toISOString().split('T')[0],
      weight: weight ? parseFloat(weight) : undefined,
      weightUnit: weight ? weightUnit : undefined,
      height: height ? parseFloat(height) : undefined,
      heightUnit: height ? heightUnit : undefined,
      headCircumference: headCircumference ? parseFloat(headCircumference) : undefined,
      headCircumferenceUnit: headCircumference ? headCircumferenceUnit : undefined,
      notes: notes || undefined,
    };

    console.log('Adding growth entry (placeholder):', newEntry);
    // API call to save entry would go here
    setEntries(prev => [...prev, newEntry].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    // Reset form fields
    setDate('');
    setWeight('');
    setWeightUnit('kg');
    setHeight('');
    setHeightUnit('cm');
    setHeadCircumference('');
    setHeadCircumferenceUnit('cm');
    setNotes('');
  };


  return (
    <div>
      <h2>Growth Tracker</h2>

      <section>
        <h3>Add New Growth Measurement</h3>
        <form onSubmit={handleAddEntry}>
          <div>
            <label htmlFor="growthDate">Date:</label>
            <input
              type="date"
              id="growthDate"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="growthWeight">Weight (Optional):</label>
            <input
              type="number"
              id="growthWeight"
              min="0"
              step="any"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <select value={weightUnit} onChange={(e) => setWeightUnit(e.target.value as 'kg' | 'lb')}>
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </div>
          <div>
            <label htmlFor="growthHeight">Height (Optional):</label>
            <input
              type="number"
              id="growthHeight"
              min="0"
              step="any"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
            <select value={heightUnit} onChange={(e) => setHeightUnit(e.target.value as 'cm' | 'in')}>
              <option value="cm">cm</option>
              <option value="in">in</option>
            </select>
          </div>
          <div>
            <label htmlFor="growthHead">Head Circumference (Optional):</label>
            <input
              type="number"
              id="growthHead"
              min="0"
              step="any"
              value={headCircumference}
              onChange={(e) => setHeadCircumference(e.target.value)}
            />
            <select value={headCircumferenceUnit} onChange={(e) => setHeadCircumferenceUnit(e.target.value as 'cm' | 'in')}>
              <option value="cm">cm</option>
              <option value="in">in</option>
            </select>
          </div>
          <div>
            <label htmlFor="growthNotes">Notes:</label>
            <textarea
              id="growthNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <button type="submit">Add Growth Entry</button>
        </form>
      </section>

      <hr />

      <section>
        <h3>Growth Log</h3>
        {entries.length === 0 ? (
          <p>No growth measurements recorded yet.</p>
        ) : (
          <ul>
            {entries.map((entry) => (
              <li key={entry.id}>
                <strong>Date:</strong> {entry.date}
                {entry.weight && <> <br /> Weight: {entry.weight} {entry.weightUnit} </>}
                {entry.height && <> <br /> Height: {entry.height} {entry.heightUnit} </>}
                {entry.headCircumference && <> <br /> Head: {entry.headCircumference} {entry.headCircumferenceUnit} </>}
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

export default GrowthTracker;
