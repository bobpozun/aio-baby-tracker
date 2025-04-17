import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useProfiles } from '../context/ProfileContext'; // Corrected path
import { apiClient } from '../utils/apiClient'; // Corrected path
import checklistData from '../data/pregnancyChecklistData.json'; // Base checklist items
import { calculatePregnancyWeek } from '../utils/dateUtils';

// Interface for the base checklist item structure
interface ChecklistItemBase {
  id: string;
  week: number;
  text: string;
}

// Interface for the data fetched/stored in the backend (user-specific completion)
interface UserChecklistItemStatus {
  itemId: string; // Corresponds to ChecklistItemBase.id
  completed: boolean;
  // userId would likely be handled by the backend based on authentication
}

// Combined type for display
interface DisplayChecklistItem extends ChecklistItemBase {
  completed: boolean;
  isCustom?: boolean; // Flag for custom items
  profileId?: string; // Ensure custom items have profileId if needed for API
}

const PregnancyChecklist: React.FC = () => {
  const { selectedProfileId, getProfileById } = useProfiles(); // Use context hook
  const [items, setItems] = useState<DisplayChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate current pregnancy week based on selected profile's due date
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

  // Fetch user's checklist status and merge with base data
  // Fetch user's checklist status and merge with base data
  const fetchChecklistStatus = useCallback(async () => {
    if (!selectedProfileId) {
      setItems([]); // Clear items if no profile selected
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Fetch standard item statuses for the selected profile
      const userStatuses = await apiClient.get<UserChecklistItemStatus[]>(
        '\/checklist/status',
        {
          profileId: selectedProfileId,
        }
      );
      const statusMap = new Map(
        (userStatuses || []).map((item) => [item.itemId, item.completed])
      );

      // Merge base data with user status
      const mergedItems = checklistData.map((baseItem) => ({
        ...baseItem,
        completed: statusMap.get(baseItem.id) || false, // Default to false if no status saved
        isCustom: false, // Mark as not custom
      }));

      // Fetch custom checklist items for the selected profile
      const customItems = await apiClient.get<DisplayChecklistItem[]>(
        '\/checklist',
        {
          profileId: selectedProfileId,
        }
      );

      // Combine standard and custom items
      const allItems = [
        ...mergedItems,
        ...(customItems || []).map((item) => ({ ...item, isCustom: true })), // Ensure custom flag is set
      ];

      setItems(allItems);
    } catch (err: any) {
      console.error('Failed to fetch checklist status:', err);
      setError(err.message || 'Failed to load checklist.');
      setItems([]); // Clear items on error
    } finally {
      setIsLoading(false);
    }
  }, [selectedProfileId]); // Add selectedProfileId dependency

  useEffect(() => {
    fetchChecklistStatus();
  }, [fetchChecklistStatus]); // fetchChecklistStatus already depends on selectedProfileId

  // Group items by week for rendering
  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      const week = item.week;
      if (!acc[week]) {
        acc[week] = [];
      }
      acc[week].push(item);
      // Sort items within the week if needed (e.g., by text or id)
      // acc[week].sort((a, b) => a.text.localeCompare(b.text));
      return acc;
    }, {} as Record<number, DisplayChecklistItem[]>);
  }, [items]);

  const handleToggleComplete = useCallback(
    async (itemId: string, isCustom: boolean | undefined) => {
      if (!selectedProfileId) return; // Need profile context

      const originalItems = items;
      const currentStatus =
        items.find((item) => item.id === itemId)?.completed || false;
      const newStatus = !currentStatus;

      // Optimistic UI update
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, completed: newStatus } : item
        )
      );

      try {
        // Adjust API endpoint based on whether it's a custom item
        const endpoint = isCustom
          ? `/checklist/status/${itemId}`
          : `/checklist/status/${itemId}`;
        // Pass profileId in the body or query params if needed by backend
        await apiClient.put<{ success: boolean }>(endpoint, {
          completed: newStatus,
          profileId: selectedProfileId, // Assuming backend needs this for authorization/update
        });
        console.log(
          `Toggled item ${itemId} for profile ${selectedProfileId} to ${newStatus}`
        );
      } catch (err: any) {
        console.error(`Failed to update checklist item ${itemId}:`, err);
        setError(err.message || `Failed to update item status.`);
        // Rollback optimistic update
        setItems(originalItems);
      }
    },
    [items, selectedProfileId]
  ); // Add dependencies

  const handleAddCustomTodo = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTodoText.trim() || !selectedProfileId) return;

      const weekToAdd = currentWeek; // Add to current week by default, or make selectable
      const newItemData = {
        text: newTodoText,
        week: weekToAdd, // Add week if applicable
        profileId: selectedProfileId,
        completed: false, // Default completion status
      };

      setIsLoading(true); // Indicate loading during add
      setError(null);

      try {
        // Call API to add custom todo (now POST /checklist/status)
        // Assuming API returns the created item with its new ID
        const createdItem = await apiClient.post<DisplayChecklistItem>(
          '\/checklist',
          newItemData
        );

        // Optimistically add to state or refetch
        // Refetching is simpler to ensure consistency
        await fetchChecklistStatus(); // Refetch the entire list

        console.log('Added custom todo:', createdItem);
        setNewTodoText(''); // Reset form
      } catch (err: any) {
        console.error('Failed to add custom todo:', err);
        setError(err.message || 'Failed to add custom task.');
      } finally {
        setIsLoading(false);
      }
    },
    [newTodoText, selectedProfileId, currentWeek, fetchChecklistStatus]
  ); // Add dependencies

  return (
    <div>
      <h2>Pregnancy Checklist</h2>
      {error && (
        <p style={{ color: 'red' }}>
          Error loading or updating checklist: {error}
        </p>
      )}

      <section
        style={{
          marginBottom: '20px',
          padding: '15px',
          border: '1px solid var(--border-color)',
          borderRadius: '5px',
        }}
      >
        <h3 style={{ marginTop: '0' }}>Add Custom Task</h3>
        <form
          onSubmit={handleAddCustomTodo}
          style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
        >
          {/* Optional: Week selector for custom task */}
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
        {isLoading && !items.length ? ( // Show loading only if list is empty initially
          <p>Loading checklist...</p>
        ) : !isLoading && !error && items.length === 0 && selectedProfileId ? (
          <p>
            No checklist items found for this profile. Add some custom tasks or
            check back later!
          </p>
        ) : !selectedProfileId ? (
          <p>Please select a profile to view the checklist.</p>
        ) : (
          // Sort weeks numerically and render groups
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
                          }} // Ensure inline display
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
