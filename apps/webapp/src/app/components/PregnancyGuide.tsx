import React, { useState, useEffect, useMemo } from 'react';
import { useProfiles } from '../context/ProfileContext';
import pregnancyData from '../data/pregnancyGuideData.json';

function sanitizeCloudfrontDomain(raw: string | undefined): string {
  if (!raw) return '';
  let sanitized = raw.trim();
  sanitized = sanitized.replace(/^(https?:)?\/\//, '');
  sanitized = sanitized.replace(/\/+$/, '');
  return 'https://' + sanitized;
}

const PREG_GUIDE_IMAGES_BASE_URL = sanitizeCloudfrontDomain(
  import.meta.env.VITE_PREG_GUIDE_IMAGES_CLOUDFRONT_DOMAIN
);

function getPregGuideImageUrl(placeholder: string): string {
  if (/^https?:\/\//.test(placeholder)) {
    return placeholder;
  }
  return `${PREG_GUIDE_IMAGES_BASE_URL}/${placeholder}`;
}

interface WeeklyInfo {
  week: number;
  babySizeText: string;
  babyImagePlaceholder: string;
  developmentDetails: string[];
}

import { calculatePregnancyWeek } from '../utils/dateUtils';

const PregnancyGuide: React.FC = () => {
  useEffect(() => {
    console.log('import.meta.env:', import.meta.env);
  }, []);
  const { selectedProfileId, getProfileById } = useProfiles();

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

  const [currentWeek, setCurrentWeek] = useState<number>(minWeek);
  const [selectedWeekData, setSelectedWeekData] = useState<WeeklyInfo | null>(
    null
  );

  useEffect(() => {
    const profile = getProfileById(selectedProfileId);
    // TODO: Determine if profile is 'pregnancy' type if model changes
    const dueDate = profile?.birthday;
    const calculatedWeek = calculatePregnancyWeek(dueDate);

    if (
      calculatedWeek !== null &&
      calculatedWeek >= minWeek &&
      calculatedWeek <= maxWeek
    ) {
      setCurrentWeek(calculatedWeek);
    } else {
      setCurrentWeek(minWeek);
    }
  }, [selectedProfileId, getProfileById, minWeek, maxWeek]);

  useEffect(() => {
    const data = pregnancyData.find((item) => item.week === currentWeek);
    setSelectedWeekData(data || null);
  }, [currentWeek]);

  const handleWeekChange = (change: number) => {
    const newWeek = currentWeek + change;

    if (newWeek >= minWeek && newWeek <= maxWeek) {
      setCurrentWeek(newWeek);
    }
  };

  // Debug: Log image base URL and placeholder
  React.useEffect(() => {
    if (selectedWeekData) {
      console.log('PREG_GUIDE_IMAGES_BASE_URL:', PREG_GUIDE_IMAGES_BASE_URL);
      console.log(
        'babyImagePlaceholder:',
        selectedWeekData.babyImagePlaceholder
      );
    }
  }, [selectedWeekData]);

  return (
    <div className="main-container">
      <h2>Pregnancy Guide</h2>
      <section className="section-card">
        {selectedWeekData ? (
          <div>
            <h3>Week {selectedWeekData.week}</h3>
            <p style={{ textAlign: 'center', marginBottom: 12 }}>
              <strong>
                Baby is about the size of a {selectedWeekData.babySizeText}.
              </strong>
            </p>
            <div style={{ margin: '18px 0' }}>
              <img
                src={getPregGuideImageUrl(
                  selectedWeekData.babyImagePlaceholder
                )}
                alt={selectedWeekData.babySizeText}
                style={{
                  maxWidth: 160,
                  maxHeight: 160,
                  display: 'block',
                  margin: '0 auto 8px auto',
                }}
              />
            </div>

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
            {}
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
