import React, { useState, useEffect, useCallback } from 'react';
import { useProfiles } from '../context/ProfileContext'; // Import context
import { apiClient } from '../utils/apiClient'; // Import API client

// Placeholder type for report data - replace with actual structure
interface ReportData {
  sleepSummary?: { totalHours: number; avgDuration: number; chartData?: any };
  feedingSummary?: {
    totalFeedings: number;
    avgVolume?: number;
    chartData?: any;
  };
  diaperSummary?: { wetCount: number; dirtyCount: number; chartData?: any };
  // Add other tracker summaries as needed
}

const ReportsDashboard: React.FC = () => {
  const { selectedProfileId } = useProfiles(); // Get selected profile
  const [selectedTrackers, setSelectedTrackers] = useState<string[]>([
    'sleep',
    'nursing',
    'diaper',
  ]);
  const [timeRange, setTimeRange] = useState<string>('last7days');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch report data when dependencies change
  const fetchReportData = useCallback(async () => {
    if (!selectedProfileId) {
      setReportData(null); // Clear data if no profile selected
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Assume API endpoint: /reports?profileId=...&trackers=...&timeRange=...
      const queryParams = {
        profileId: selectedProfileId,
        trackers: selectedTrackers.join(','), // Send as comma-separated string
        timeRange: timeRange,
      };
      const fetchedData = await apiClient.get<ReportData>(
        '/reports',
        queryParams
      );
      setReportData(fetchedData);
      console.log('Fetched report data:', fetchedData);
    } catch (err: any) {
      console.error('Failed to fetch report data:', err);
      setError(err.message || 'Failed to load report data.');
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProfileId, selectedTrackers, timeRange]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]); // Dependency array includes the callback

  return (
    <div>
      {' '}
      {/* Outer div */}
      <h2>Reports Dashboard</h2> {/* Title outside section */}
      <section>
        {' '}
        {/* Section for content */}
        <p>View summaries and trends across your tracked data.</p>
        <div>
          {' '}
          {/* Changed inner section to div */}
          <h3>Customization (Placeholders)</h3>
          <div>
            <label>Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="last24hours">Last 24 Hours</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              {/* Add custom range option */}
            </select>
          </div>
          <div>
            <label>Trackers to Include:</label>
            {/* Replace with actual multi-select UI */}
            <p>
              Selected: {selectedTrackers.join(', ')} (Checkbox UI coming soon)
            </p>
          </div>
        </div>
        <hr />
        <div>
          {' '}
          {/* Changed inner section to div */}
          <h3>Summary Data</h3>
          {isLoading && <p>Loading report data...</p>}
          {error && (
            <p style={{ color: 'red' }}>Error loading report: {error}</p>
          )}
          {!isLoading && !error && !reportData && selectedProfileId && (
            <p>No report data available for the selected criteria.</p>
          )}
          {!isLoading && !error && !selectedProfileId && (
            <p>Please select a profile to view reports.</p>
          )}
          {reportData && (
            <>
              {reportData.sleepSummary && (
                <div>
                  <h4>Sleep Summary</h4>
                  <p>
                    Total Sleep:{' '}
                    {reportData.sleepSummary.totalHours?.toFixed(1) ?? 'N/A'}{' '}
                    hours
                  </p>
                  <p>
                    Average Sleep Duration:{' '}
                    {reportData.sleepSummary.avgDuration?.toFixed(1) ?? 'N/A'}{' '}
                    hours
                  </p>
                  <p>[Sleep Chart Placeholder]</p>{' '}
                  {/* TODO: Add charting libraries later */}
                </div>
              )}
              {reportData.feedingSummary && (
                <div>
                  <h4>Feeding Summary (Nursing/Bottle)</h4>
                  <p>
                    Total Feedings:{' '}
                    {reportData.feedingSummary.totalFeedings ?? 'N/A'}
                  </p>
                  <p>
                    Average Volume (Bottle):{' '}
                    {reportData.feedingSummary.avgVolume?.toFixed(1) ?? 'N/A'}{' '}
                    ml/oz
                  </p>
                  <p>[Feeding Chart Placeholder]</p>{' '}
                  {/* TODO: Add charting libraries later */}
                </div>
              )}
              {reportData.diaperSummary && (
                <div>
                  <h4>Diaper Summary</h4>
                  <p>
                    Wet Diapers: {reportData.diaperSummary.wetCount ?? 'N/A'}
                  </p>
                  <p>
                    Dirty Diapers:{' '}
                    {reportData.diaperSummary.dirtyCount ?? 'N/A'}
                  </p>
                  <p>[Diaper Chart Placeholder]</p>{' '}
                  {/* TODO: Add charting libraries later */}
                </div>
              )}
              {/* Add rendering for other tracker summaries based on reportData structure */}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default ReportsDashboard;
