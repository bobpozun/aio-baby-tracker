import React, { useState, useEffect, useMemo } from 'react';
import { useProfiles } from '../context/ProfileContext'; // Import context hook
import pregnancyData from '../data/pregnancyGuideData.json'; // Import data

// Interface for the weekly info structure
interface WeeklyInfo {
  week: number;
  babySizeText: string;
  babyImagePlaceholder: string; // Image ref/URL
  developmentDetails: string[];
}

import { calculatePregnancyWeek, getProfileAgeOrDue } from '../utils/dateUtils';

const PregnancyGuide: React.FC = () => {
  const { selectedProfileId, getProfileById } = useProfiles();

  // Determine min/max weeks dynamically from data
  const minWeek = useMemo(
    () =>
      pregnancyData.reduce(
        (min, p) => (p.week < min ? p.week : min),
        pregnancyData[0]?.week || 1
      ),
    []
  );
  const maxWeek = useMemo(
    () =>
      pregnancyData.reduce(
        (max, p) => (p.week > max ? p.week : max),
        pregnancyData[pregnancyData.length - 1]?.week || 40
      ),
    []
  );

  const [currentWeek, setCurrentWeek] = useState<number>(minWeek); // Default to earliest week in data
  const [selectedWeekData, setSelectedWeekData] = useState<WeeklyInfo | null>(
    null
  );

  // Effect to update currentWeek based on selected profile's due date
  useEffect(() => {
    const profile = getProfileById(selectedProfileId);
    // TODO: Determine if profile is 'pregnancy' type if model changes
    const dueDate = profile?.birthday; // Assuming 'birthday' holds due date for now
    const calculatedWeek = calculatePregnancyWeek(dueDate);

    if (
      calculatedWeek !== null &&
      calculatedWeek >= minWeek &&
      calculatedWeek <= maxWeek
    ) {
      setCurrentWeek(calculatedWeek);
    } else {
      // If no profile, no due date, or calculated week is out of bounds, default to minWeek
      setCurrentWeek(minWeek);
    }
  }, [selectedProfileId, getProfileById, minWeek, maxWeek]); // Re-run when profile changes

  // Effect to load the data for the currentWeek
  useEffect(() => {
    const data = pregnancyData.find((item) => item.week === currentWeek);
    setSelectedWeekData(data || null); // Find data matching the current week
  }, [currentWeek]); // Re-run when currentWeek changes

  const handleWeekChange = (change: number) => {
    const newWeek = currentWeek + change;
    // Use dynamic min/max weeks for bounds check
    if (newWeek >= minWeek && newWeek <= maxWeek) {
      setCurrentWeek(newWeek);
    }
  };

  return (
    <div>
      <h2>Pregnancy Week-by-Week Guide</h2>
      <section>
        {selectedWeekData ? (
          <div>
            <h3>Week {selectedWeekData.week}</h3>
            <p>
              <strong>
                Baby is about the size of a {selectedWeekData.babySizeText}.
              </strong>
            </p>
            <p>[Image Placeholder: {selectedWeekData.babyImagePlaceholder}]</p>

            <h4>Development This Week:</h4>
            <ul>
              {selectedWeekData.developmentDetails.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>

            <div style={{ marginTop: '20px' }}>
              <button
                onClick={() => handleWeekChange(-1)}
                disabled={currentWeek <= minWeek}
              >
                {'< Previous Week'}
              </button>
              <span style={{ margin: '0 15px', fontWeight: 'bold' }}>
                {' '}
                Week {currentWeek}{' '}
              </span>
              <button
                onClick={() => handleWeekChange(1)}
                disabled={currentWeek >= maxWeek}
              >
                {'Next Week >'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Show appropriate message based on whether a week is being loaded or if data is missing */}
            <p>
              Loading week {currentWeek} information or data not available...
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default PregnancyGuide;
