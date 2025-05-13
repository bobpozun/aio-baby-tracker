import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useProfiles } from '../context/ProfileContext';
import { apiClient } from '../utils/apiClient';
import checklistData from '../data/pregnancyChecklistData.json';
import { calculatePregnancyWeek } from '../utils/dateUtils';

interface ChecklistItemBase {
  id: string;
  week: number;
  text: string;
}

interface UserChecklistItemStatus {
  itemId: string;
  completed: boolean;
}

interface DisplayChecklistItem extends ChecklistItemBase {
  completed: boolean;
  isCustom?: boolean;
  profileId?: string;
}

const PregnancyChecklist: React.FC = () => {
  const { selectedProfileId, getProfileById } = useProfiles();
  const [items, setItems] = useState<DisplayChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const currentWeek = useMemo(() => {
    const profile = getProfileById(selectedProfileId);
    if (profile?.birthday) {
      return calculatePregnancyWeek(profile.birthday);
    }
    return null;
  }, [selectedProfileId, getProfileById]);

  // State for adding custom todos
  const [newTodoText, setNewTodoText] = useState('');
  // const [newTodoWeek, setNewTodoWeek] = useState<number | ''>(currentWeek); // Default to current week?

  const fetchChecklistStatus = useCallback(async () => {
    if (!selectedProfileId) {
      setItems([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const userStatuses = await apiClient.get<UserChecklistItemStatus[]>(
        '/checklist/status',
        {
          profileId: selectedProfileId,
        }
      );
      const statusMap = new Map(
        (userStatuses || []).map((item) => [item.itemId, item.completed])
      );

      const mergedItems = checklistData.map((baseItem) => ({
        ...baseItem,
        completed: statusMap.get(baseItem.id) || false,
        isCustom: false,
      }));

      const customItems = await apiClient.get<DisplayChecklistItem[]>(
        '/checklist',
        {
          profileId: selectedProfileId,
        }
      );

      const allItems = [
        ...mergedItems,
        ...(customItems || []).map((item) => ({ ...item, isCustom: true })),
      ];

      setItems(allItems);
    } catch (err: unknown) {
      let errorMsg = 'Unknown error';
      if (err instanceof Error) errorMsg = err.message;
      else if (typeof err === 'string') errorMsg = err;
      else
        try {
          errorMsg = JSON.stringify(err);
        } catch {}

      console.error('Failed to fetch checklist status:', errorMsg);
      setError(errorMsg || 'Failed to load checklist.');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProfileId]);

  useEffect(() => {
    fetchChecklistStatus();
  }, [fetchChecklistStatus]);

  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      const week = item.week;
      if (!acc[week]) {
        acc[week] = [];
      }
      acc[week].push(item);

      return acc;
    }, {} as Record<number, DisplayChecklistItem[]>);
  }, [items]);

  const handleToggleComplete = useCallback(
    async (itemId: string, isCustom: boolean | undefined) => {
      if (!selectedProfileId) return;

      const originalItems = items;
      const currentStatus =
        items.find((item) => item.id === itemId)?.completed || false;
      const newStatus = !currentStatus;

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, completed: newStatus } : item
        )
      );

      try {
        const endpoint = isCustom
          ? `/checklist/status/${itemId}`
          : `/checklist/status/${itemId}`;

        await apiClient.put<{ success: boolean }>(endpoint, {
          completed: newStatus,
          profileId: selectedProfileId,
        });
        console.log(
          `Toggled item ${itemId} for profile ${selectedProfileId} to ${newStatus}`
        );
      } catch (err: unknown) {
        let errorMsg = 'Unknown error';
        if (err instanceof Error) errorMsg = err.message;
        else if (typeof err === 'string') errorMsg = err;
        else
          try {
            errorMsg = JSON.stringify(err);
          } catch {}

        console.error(`Failed to update checklist item ${itemId}:`, errorMsg);
        setError(errorMsg || `Failed to update item status.`);

        setItems(originalItems);
      }
    },
    [items, selectedProfileId]
  );

  const handleAddCustomTodo = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTodoText.trim() || !selectedProfileId) return;

      const weekToAdd = currentWeek;
      const newItemData = {
        text: newTodoText,
        week: weekToAdd,
        profileId: selectedProfileId,
        completed: false,
      };

      setIsLoading(true);
      setError(null);

      try {
        // Call API to add custom todo (now POST /checklist/status)
        const createdItem = await apiClient.post<DisplayChecklistItem>(
          '/checklist',
          newItemData
        );

        await fetchChecklistStatus();

        console.log('Added custom todo:', createdItem);
        setNewTodoText('');
      } catch (err: unknown) {
        let errorMsg = 'Unknown error';
        if (err instanceof Error) errorMsg = err.message;
        else if (typeof err === 'string') errorMsg = err;
        else
          try {
            errorMsg = JSON.stringify(err);
          } catch {}

        console.error('Failed to add custom todo:', errorMsg);
        setError(errorMsg || 'Failed to add custom task.');
      } finally {
        setIsLoading(false);
      }
    },
    [newTodoText, selectedProfileId, currentWeek, fetchChecklistStatus]
  );

  return (
    <div className="main-container">
      <h2>Pregnancy Checklist</h2>
      {error && (
        <p className="text-danger mb-2">
          Error loading or updating checklist: {error}
        </p>
      )}

      <section className="section-card">
        <h3 style={{ marginTop: '0' }}>Add Custom Task</h3>
        <form
          onSubmit={handleAddCustomTodo}
          style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
        >
          {}
          {/* <label htmlFor="customTodoWeek">Week (Optional):</label> */}
          {/* <input type="number" id="customTodoWeek" value={newTodoWeek} onChange={(e) => setNewTodoWeek(parseInt(e.target.value) || '')} min="4" max="42" /> */}
          <div>
            <label htmlFor="customTodoText">Task:</label>
            <input
              type="text"
              id="customTodoText"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="e.g., Buy baby clothes"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !selectedProfileId || !newTodoText.trim()}
          >
            {isLoading ? 'Adding...' : 'Add Task'}
          </button>
        </form>
        {!selectedProfileId && (
          <p style={{ fontSize: '0.9em', color: 'grey', marginTop: '5px' }}>
            Please select a profile to add tasks.
          </p>
        )}
      </section>

      <section>
        <h3>Weekly Tasks</h3>
        {isLoading && !items.length ? (
          <p>Loading checklist...</p>
        ) : !isLoading && !error && items.length === 0 && selectedProfileId ? (
          <p>
            No checklist items found for this profile. Add some custom tasks or
            check back later!
          </p>
        ) : !selectedProfileId ? (
          <p>Please select a profile to view the checklist.</p>
        ) : (
          Object.entries(groupedItems)
            .sort(([weekA], [weekB]) => parseInt(weekA) - parseInt(weekB))
            .map(([week, weekItems]) => {
              const isCurrent =
                currentWeek !== null && parseInt(week) === currentWeek;
              return (
                <div
                  key={week}
                  style={{
                    marginBottom: '20px',
                    padding: '15px',
                    border: isCurrent
                      ? '2px solid var(--primary-color)'
                      : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: isCurrent
                      ? 'var(--accent-light-color)'
                      : 'var(--background-alt-color)',
                  }}
                >
                  <h4
                    style={{
                      marginTop: '0',
                      marginBottom: '10px',
                      borderBottom: '1px solid var(--border-color)',
                      paddingBottom: '5px',
                      color: 'var(--text-color)',
                    }}
                  >
                    Week {week}{' '}
                    {isCurrent ? (
                      <span
                        style={{
                          fontWeight: 'bold',
                          color: 'var(--primary-color)',
                        }}
                      >
                        (Current)
                      </span>
                    ) : (
                      ''
                    )}
                  </h4>
                  <ul
                    style={{ listStyle: 'none', paddingLeft: '0', margin: '0' }}
                  >
                    {weekItems.map((item) => (
                      <li
                        key={item.id}
                        style={{
                          textDecoration: item.completed
                            ? 'line-through'
                            : 'none',
                          opacity: item.completed ? 0.6 : 1,
                          marginBottom: '5px',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() =>
                            handleToggleComplete(item.id, item.isCustom)
                          }
                          id={`item-${item.id}`}
                          style={{
                            marginRight: '10px',
                            verticalAlign: 'middle',
                            cursor: 'pointer',
                          }}
                        />
                        <label
                          htmlFor={`item-${item.id}`}
                          style={{ cursor: 'pointer', verticalAlign: 'middle' }}
                        >
                          {item.text} {item.isCustom ? '(Custom)' : ''}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
        )}
      </section>
    </div>
  );
};

export default PregnancyChecklist;
