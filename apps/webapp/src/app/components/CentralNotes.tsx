import React, { useState, useEffect, useContext } from 'react';
import { apiClient } from '../utils/apiClient'; // Import the API client
import { ProfileContext } from '../context/ProfileContext'; // Import ProfileContext

// Interface for Note Entry (assuming structure from API)
interface NoteEntry {
  id: string; // Or noteId, depending on backend
  trackerType: string;
  time: string; // ISO string format expected
  notes: string;
  profileId: string; // Link note to a profile
}

const CentralNotes: React.FC = () => {
  const [allNotes, setAllNotes] = useState<NoteEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state
  const profileContext = useContext(ProfileContext); // Get context

  // Handle case where context might be undefined
  if (!profileContext) {
    // This should ideally not happen if used within ProfileProvider
    return <p>Error: Notes component must be used within a ProfileProvider.</p>;
    // Or return null; or a loading indicator
  }
  const { selectedProfileId } = profileContext; // Destructure after checking context exists

  useEffect(() => {
    const fetchNotes = async () => {
      if (!selectedProfileId) {
        setAllNotes([]); // Clear notes if no profile is selected
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        // Fetch notes for the selected profile
        // Assuming endpoint /notes?profileId={selectedProfileId}
        const fetchedNotes = await apiClient.get<NoteEntry[]>('/notes', {
          profileId: selectedProfileId,
        });
        // Sort notes chronologically (newest first)
        const sortedNotes = (fetchedNotes || []).sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
        );
        setAllNotes(sortedNotes);
      } catch (err: any) {
        console.error('Failed to fetch notes:', err);
        setError(err.message || 'Failed to load notes.');
        setAllNotes([]); // Clear notes on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, [selectedProfileId]); // Re-fetch when selectedProfileId changes

  return (
    <div>
      {' '}
      {/* Outer div */}
      <h2>Central Notes Log</h2> {/* Title outside section */}
      <section>
        {' '}
        {/* Section for content */}
        <p>
          All notes recorded across different trackers, sorted chronologically.
        </p>
        {/* Add filtering options later */}
        {isLoading && <p>Loading notes...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {!isLoading && !error && allNotes.length === 0 && (
          <p>No notes recorded for this profile yet.</p>
        )}
        {!isLoading && !error && allNotes.length > 0 && (
          <div>
            {Object.entries(
              allNotes.reduce((acc, note) => {
                if (!acc[note.trackerType]) acc[note.trackerType] = [];
                acc[note.trackerType].push(note);
                return acc;
              }, {} as Record<string, NoteEntry[]>)
            ).map(([trackerType, notes]) => (
              <div key={trackerType} style={{ marginBottom: '2em' }}>
                <h3 style={{ textTransform: 'capitalize', borderBottom: '1px solid #eee' }}>{trackerType} Notes</h3>
                <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
                  {notes
                    .slice()
                    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                    .map((note) => (
                      <li key={note.id} style={{ marginBottom: '1em', background: '#fafbfc', borderRadius: 6, padding: '0.5em 1em', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                        <div style={{ fontSize: '0.95em', color: '#666' }}>{new Date(note.time).toLocaleString()}</div>
                        <div style={{ margin: '5px 0 0 0', fontStyle: 'italic' }}>{note.notes}</div>
                        {/* Add link back to the original tracker entry later */}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CentralNotes;
