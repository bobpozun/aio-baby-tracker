import React, { useState, useRef } from 'react';
// import { Storage } from 'aws-amplify/storage'; // Import when implementing upload

interface SolidsEntry {
  id: string;
  time: string;
  food: string;
  amount?: string;
  reaction?: 'liked' | 'disliked' | 'neutral' | 'allergic';
  notes?: string;
  imageKey?: string; // S3 key
  babyId?: string; // Added for future use
}

const SolidsTracker: React.FC = () => {
  const [entries, setEntries] = useState<SolidsEntry[]>([]);
  const [time, setTime] = useState('');
  const [food, setFood] = useState('');
  const [amount, setAmount] = useState('');
  const [reaction, setReaction] = useState<'liked' | 'disliked' | 'neutral' | 'allergic' | ''>('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!time || !food) return;

    let imageKey: string | undefined = undefined;

    if (selectedFile) {
      console.log('Uploading file (placeholder):', selectedFile.name);
      // // --- Example Amplify Storage Upload ---
      // try {
      //   // Consider adding user identity to the key path if using private level
      //   const key = `solids/${Date.now()}-${selectedFile.name}`;
      //   const result = await Storage.put(key, selectedFile, {
      //     contentType: selectedFile.type,
      //     // level: 'private' // Or 'protected' or 'public'
      //   });
      //   imageKey = result.key;
      //   console.log('Uploaded image key:', imageKey);
      // } catch (error) {
      //   console.error('Error uploading file:', error);
      //   alert(`Error uploading file: ${error}`);
      //   return; // Stop submission if upload fails
      // }
      // --- End Example ---
      imageKey = `placeholder/solids/${Date.now()}-${selectedFile.name}`; // Using placeholder for now
    }

    const newEntry: SolidsEntry = {
      id: Date.now().toString(),
      time: new Date(time).toISOString(),
      food: food,
      amount: amount || undefined,
      reaction: reaction || undefined,
      notes: notes || undefined,
      imageKey: imageKey,
    };

    console.log('Adding solids entry (placeholder):', newEntry);
    // API call to save entry (including imageKey) would go here
    setEntries(prev => [...prev, newEntry].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));

    // Reset form fields
    setTime('');
    setFood('');
    setAmount('');
    setReaction('');
    setNotes('');
    setSelectedFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };


  return (
    <div>
      <h2>Solids Tracker</h2>

      <section>
        <h3>Add New Solid Food Entry</h3>
        <form onSubmit={handleAddEntry}>
          <div>
            <label htmlFor="solidsTime">Time:</label>
            <input
              type="datetime-local"
              id="solidsTime"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="foodItem">Food:</label>
            <input
              type="text"
              id="foodItem"
              value={food}
              onChange={(e) => setFood(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="foodAmount">Amount (Optional):</label>
            <input
              type="text"
              id="foodAmount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="foodReaction">Reaction (Optional):</label>
            <select value={reaction} onChange={(e) => setReaction(e.target.value as any)}>
              <option value="">Select...</option>
              <option value="liked">Liked</option>
              <option value="disliked">Disliked</option>
              <option value="neutral">Neutral</option>
              <option value="allergic">Allergic Reaction</option>
            </select>
          </div>
           <div>
            <label htmlFor="foodImage">Upload Photo (Optional):</label>
            <input
              type="file"
              id="foodImage"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
             {selectedFile && <p>Selected: {selectedFile.name}</p>}
          </div>
          <div>
            <label htmlFor="solidsNotes">Notes:</label>
            <textarea
              id="solidsNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <button type="submit">Add Solids Entry</button>
        </form>
      </section>

      <hr />

      <section>
        <h3>Solids Log</h3>
        {entries.length === 0 ? (
          <p>No solid food entries recorded yet.</p>
        ) : (
          <ul>
            {entries.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.food}</strong> {entry.amount ? `(${entry.amount})` : ''}
                {entry.reaction && ` - Reaction: ${entry.reaction}`}
                <br />
                Time: {new Date(entry.time).toLocaleString()}
                {entry.imageKey && <><br />[Image Placeholder: {entry.imageKey}]</>} {/* Display actual image later */}
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

export default SolidsTracker;
