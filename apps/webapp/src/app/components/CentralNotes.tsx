import React, { useState, useEffect } from 'react';

// TODO: Replace with actual type from shared-logic
interface NoteEntry {
  id: string;
  trackerType: string;
  time: string;
  notes: string;
  babyId?: string; // Added for future use
}

// TODO: Replace with actual API query
const placeholderNotes: NoteEntry[] = [
    { id: 'note1', trackerType: 'Sleep', time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), notes: 'Seemed restless during the first hour.' },
    { id: 'note2', trackerType: 'Diaper', time: new Date(Date.now() - 1000 * 60 * 30).toISOString(), notes: 'Slight rash observed.' },
    { id: 'note3', trackerType: 'Nursing', time: new Date(Date.now() - 1000 * 60 * 10).toISOString(), notes: 'Fed well on the left side.' },
    { id: 'note4', trackerType: 'Solids', time: new Date(Date.now() - 1000 * 60 * 120).toISOString(), notes: 'Loved the sweet potato puree!' },
];

const CentralNotes: React.FC = () => {
  const [allNotes, setAllNotes] = useState<NoteEntry[]>([]);

  useEffect(() => {
    // Simulate fetching notes - replace with API call later
    const sortedNotes = placeholderNotes.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setAllNotes(sortedNotes);
  }, []);


  return (
    <div>
      <h2>Central Notes Log</h2>
      <p>All notes recorded across different trackers, sorted chronologically.</p>

      {/* Add filtering options later */}

      {allNotes.length === 0 ? (
        <p>No notes recorded yet.</p>
      ) : (
        <ul>
          {allNotes.map((note) => (
            <li key={note.id}>
              <strong>[{note.trackerType}]</strong> - {new Date(note.time).toLocaleString()}
              <p style={{ margin: '5px 0 10px 15px', fontStyle: 'italic' }}>{note.notes}</p>
              {/* Add link back to the original tracker entry later */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CentralNotes;
