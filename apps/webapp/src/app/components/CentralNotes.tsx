import React, { useState, useEffect, useContext } from 'react';
import { apiClient } from '../utils/apiClient';
import { ProfileContext } from '../context/ProfileContext';

interface NoteEntry {
  createdAt?: string;
  startDateTime?: string;
  id: string;
  trackerType: string;
  startTime?: string;
  notes: string;
  profileId: string;
}

const NOTES_PER_TYPE_DEFAULT = 10;

const CentralNotes: React.FC = () => {
  const [allNotes, setAllNotes] = useState<NoteEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCounts, setExpandedCounts] = useState<Record<string, number>>(
    {}
  );
  const profileContext = useContext(ProfileContext);

  if (!profileContext) {
    return <p>Error: Notes component must be used within a ProfileProvider.</p>;
  }
  const { selectedProfileId } = profileContext;

  useEffect(() => {
    const fetchNotes = async () => {
      if (!selectedProfileId) {
        setAllNotes([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const fetchedNotes = await apiClient.get<NoteEntry[]>('/notes', {
          profileId: selectedProfileId,
        });

        const getNoteDate = (note: any) =>
          note.time || note.startTime || note.createdAt;
        const sortedNotes = (fetchedNotes || []).sort(
          (a, b) =>
            new Date(getNoteDate(b)).getTime() -
            new Date(getNoteDate(a)).getTime()
        );
        setAllNotes(sortedNotes);
      } catch (err: any) {
        console.error('Failed to fetch notes:', err);
        setError(err.message || 'Failed to load notes.');
        setAllNotes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, [selectedProfileId]);

  return (
    <div className="main-container">
      <h2>Central Notes Log</h2>
      <section className="section-card">
        {' '}
        {}
        <p>
          All notes recorded across different trackers, sorted chronologically.
        </p>
        {}
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
            ).map(([trackerType, notes]) => {
              const sortedNotes = notes.slice().sort((a, b) => {
                const dateA =
                  typeof a.startDateTime === 'string'
                    ? new Date(a.startDateTime)
                    : typeof a.createdAt === 'string'
                    ? new Date(a.createdAt)
                    : new Date(0);
                const dateB =
                  typeof b.startDateTime === 'string'
                    ? new Date(b.startDateTime)
                    : typeof b.createdAt === 'string'
                    ? new Date(b.createdAt)
                    : new Date(0);
                return dateB.getTime() - dateA.getTime();
              });
              const countToShow =
                expandedCounts[trackerType] ?? NOTES_PER_TYPE_DEFAULT;
              const isTruncated = sortedNotes.length > countToShow;
              const visibleNotes = sortedNotes.slice(0, countToShow);

              return (
                <div key={trackerType} style={{ marginBottom: '2em' }}>
                  <h3
                    style={{
                      textTransform: 'capitalize',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    {trackerType} Notes
                  </h3>
                  <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
                    {visibleNotes.map((note) => (
                      <li
                        key={note.id}
                        style={{
                          marginBottom: '1em',
                          background: '#fafbfc',
                          borderRadius: 6,
                          padding: '0.5em 1em',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        }}
                      >
                        <div style={{ fontSize: '0.95em', color: '#666' }}>
                          {(() => {
                            const dateStr =
                              note.startDateTime ||
                              note.createdAt ||
                              note.startTime;
                            if (typeof dateStr === 'string') {
                              const dateObj = new Date(dateStr);
                              return !isNaN(dateObj.getTime())
                                ? dateObj.toLocaleString(undefined, {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Invalid Date';
                            } else {
                              return 'Invalid Date';
                            }
                          })()}
                        </div>
                        <div
                          style={{ margin: '5px 0 0 0', fontStyle: 'italic' }}
                        >
                          {note.notes}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {isTruncated && (
                    <div style={{ marginTop: 8 }}>
                      <button
                        style={{ marginRight: 8 }}
                        onClick={() =>
                          setExpandedCounts((prev) => ({
                            ...prev,
                            [trackerType]:
                              (prev[trackerType] ?? NOTES_PER_TYPE_DEFAULT) +
                              NOTES_PER_TYPE_DEFAULT,
                          }))
                        }
                      >
                        Show More
                      </button>
                      <button
                        onClick={() =>
                          setExpandedCounts((prev) => ({
                            ...prev,
                            [trackerType]: sortedNotes.length,
                          }))
                        }
                      >
                        Show All
                      </button>
                    </div>
                  )}
                  {countToShow > NOTES_PER_TYPE_DEFAULT && (
                    <div style={{ marginTop: 8 }}>
                      <button
                        onClick={() =>
                          setExpandedCounts((prev) => ({
                            ...prev,
                            [trackerType]: NOTES_PER_TYPE_DEFAULT,
                          }))
                        }
                      >
                        Show Less
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default CentralNotes;
