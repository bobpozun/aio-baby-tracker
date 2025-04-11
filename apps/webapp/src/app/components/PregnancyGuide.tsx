import React, { useState, useEffect } from 'react';

// TODO: Replace with actual type from shared-logic
interface WeeklyInfo {
  week: number;
  babySizeText: string;
  babyImagePlaceholder: string; // Image ref/URL
  developmentDetails: string[];
}

// TODO: Replace with actual data source (API, JSON file, etc.)
const pregnancyData: WeeklyInfo[] = [
  { week: 4, babySizeText: 'poppy seed', babyImagePlaceholder: 'poppy_seed.png', developmentDetails: ['Neural tube forming.', 'Heart begins to beat.'] },
  { week: 8, babySizeText: 'raspberry', babyImagePlaceholder: 'raspberry.png', developmentDetails: ['Fingers and toes developing.', 'Facial features becoming distinct.'] },
  { week: 12, babySizeText: 'lime', babyImagePlaceholder: 'lime.png', developmentDetails: ['Vital organs fully formed.', 'Can make fists.'] },
  { week: 16, babySizeText: 'avocado', babyImagePlaceholder: 'avocado.png', developmentDetails: ['Skeleton hardening.', 'Eyes can move.'] },
  { week: 20, babySizeText: 'banana', babyImagePlaceholder: 'banana.png', developmentDetails: ['Can hear sounds.', 'Covered in vernix.'] },
  // Add more weeks up to 40+
  { week: 40, babySizeText: 'small pumpkin', babyImagePlaceholder: 'pumpkin.png', developmentDetails: ['Fully developed.', 'Ready for birth!'] },
];

// TODO: Replace with actual calculation based on expectedDueDate
const getCurrentWeek = (expectedDueDate: string | null): number => {
  console.log('Expected Due Date (placeholder):', expectedDueDate);
  return 16; // Using placeholder week for now
};

const PregnancyGuide: React.FC = () => {
  // TODO: Get expectedDueDate from the selected baby profile state
  const expectedDueDate = '2025-09-01'; // Using placeholder for now
  const [currentWeek, setCurrentWeek] = useState<number>(4);
  const [selectedWeekData, setSelectedWeekData] = useState<WeeklyInfo | null>(null);

  useEffect(() => {
    const calculatedWeek = getCurrentWeek(expectedDueDate);
    setCurrentWeek(calculatedWeek);
  }, [expectedDueDate]);

  useEffect(() => {
    const data = pregnancyData.find(item => item.week === currentWeek);
    setSelectedWeekData(data || null);
  }, [currentWeek]);

  const handleWeekChange = (change: number) => {
    const newWeek = currentWeek + change;
    // TODO: Potentially fetch data dynamically if not all loaded initially
    if (newWeek >= 4 && newWeek <= 40) { // Basic bounds check
      setCurrentWeek(newWeek);
    }
  };


  return (
    <div>
      <h2>Pregnancy Week-by-Week Guide</h2>

      {selectedWeekData ? (
        <div>
          <h3>Week {selectedWeekData.week}</h3>
          <p><strong>Baby is about the size of a {selectedWeekData.babySizeText}.</strong></p>
          <p>[Image Placeholder: {selectedWeekData.babyImagePlaceholder}]</p>

          <h4>Development This Week:</h4>
          <ul>
            {selectedWeekData.developmentDetails.map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>

          <div>
            <button onClick={() => handleWeekChange(-1)} disabled={currentWeek <= 4}>
              {'< Previous Week'}
            </button>
            <span> Week {currentWeek} </span>
            <button onClick={() => handleWeekChange(1)} disabled={currentWeek >= 40}>
              {'Next Week >'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p>Loading week {currentWeek} information...</p>
          {/* Consider adding navigation buttons here too */}
        </div>
      )}
    </div>
  );
};

export default PregnancyGuide;
