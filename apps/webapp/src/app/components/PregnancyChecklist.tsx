import React, { useState } from 'react'; // Removed useEffect as it wasn't used after initial load simulation

// TODO: Replace with actual type from shared-logic
interface ChecklistItem {
  id: string;
  week: number;
  text: string;
  completed: boolean;
}

// TODO: Replace with actual data source (API, JSON file, etc.)
const checklistData: ChecklistItem[] = [
  { id: 'c1', week: 8, text: 'Schedule first prenatal appointment', completed: false },
  { id: 'c2', week: 10, text: 'Consider genetic screening options', completed: false },
  { id: 'c3', week: 12, text: 'Start thinking about baby names', completed: false },
  { id: 'c4', week: 16, text: 'Feel baby\'s first movements (quickening)?', completed: false },
  { id: 'c5', week: 16, text: 'Schedule mid-pregnancy ultrasound', completed: false },
  { id: 'c6', week: 20, text: 'Start researching childcare options', completed: false },
  // Add more items for different weeks
];

// TODO: Replace with actual calculation based on expectedDueDate from profile
const getCurrentPregnancyWeek = (): number => {
  return 16; // Using placeholder week for now
};

const PregnancyChecklist: React.FC = () => {
  const [items, setItems] = useState<ChecklistItem[]>(checklistData);
  const currentWeek = getCurrentPregnancyWeek();

  // Filter items relevant up to the current week
  const relevantItems = items.filter(item => item.week <= currentWeek);

  const handleToggleComplete = (itemId: string) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
    // API call to persist change would go here
    console.log(`Toggled item ${itemId}`);
  };


  return (
    <div>
      <h2>Pregnancy Checklist</h2>
      <p>Relevant tasks up to Week {currentWeek}:</p>

      {relevantItems.length === 0 ? (
        <p>No checklist items for the current stage.</p>
      ) : (
        <ul>
          {relevantItems.map((item) => (
            <li key={item.id} style={{ textDecoration: item.completed ? 'line-through' : 'none' }}>
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => handleToggleComplete(item.id)}
                id={`item-${item.id}`}
              />
              <label htmlFor={`item-${item.id}`}>
                (Week {item.week}) {item.text}
              </label>
            </li>
          ))}
        </ul>
      )}
      {/* Optionally show upcoming items later */}
    </div>
  );
};

export default PregnancyChecklist;
