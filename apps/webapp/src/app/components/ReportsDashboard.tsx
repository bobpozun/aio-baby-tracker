import React, { useState, useEffect, useCallback } from 'react';
import { useProfiles } from '../context/ProfileContext';
import { apiClient } from '../utils/apiClient';
import {
  SleepChart,
  DiaperChart,
  NursingChart,
  BottleChart,
  GrowthChart,
  PottyChart,
  SolidsChart,
  MedicineChart,
  TemperatureChart,
} from './ReportsCharts';

// Placeholder type for report data - replace with actual structure
interface ReportData {
  sleepSummary?: { totalHours: number; avgDuration: number; chartData?: any };
  nursingSummary?: {
    totalSessions: number;
    avgDuration?: number;
    avgVolume?: number;
    chartData?: Array<{
      date: string;
      side?: string;
      duration?: number;
      volume?: number;
    }>;
  };

  bottleSummary?: {
    totalBottles: number;
    avgVolume?: number;
    chartData?: any;
  };
  diaperSummary?: { wetCount: number; dirtyCount: number; chartData?: any };
  solidsSummary?: { totalFeedings: number; avgAmount?: number; chartData?: any };
  medicineSummary?: { totalDoses: number; medicinesGiven: string[]; chartData?: any };
  growthSummary?: { latestWeight?: number; latestHeight?: number; chartData?: any };
  pottySummary?: { peeCount: number; poopCount: number; chartData?: any };
  temperatureSummary?: { readingsCount: number; avgTemp?: number; chartData?: any };
}


const ReportsDashboard: React.FC = () => {
  const { selectedProfileId } = useProfiles(); // Get selected profile
  // List of all available trackers
  const allTrackers = [
    { key: 'sleep', label: 'Sleep' },
    { key: 'nursing', label: 'Nursing' },
    { key: 'bottle', label: 'Bottle' },
    { key: 'diaper', label: 'Diaper' },
    { key: 'solids', label: 'Solids' },
    { key: 'medicine', label: 'Medicine' },
    { key: 'growth', label: 'Growth' },
    { key: 'potty', label: 'Potty' },
    { key: 'temperature', label: 'Temperature' },
  ];
  const [selectedTrackers, setSelectedTrackers] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<string>('last7days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch report data when dependencies change
  const fetchReportData = useCallback(async () => {
    if (!selectedProfileId) {
      setReportData(null); // Clear data if no profile selected
      return;
    }
    if (!selectedTrackers || selectedTrackers.length === 0) {
      setReportData(null); // Clear data if no trackers selected
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Assume API endpoint: /reports?profileId=...&trackers=...&timeRange=...
      const queryParams: any = {
        profileId: selectedProfileId,
        trackers: selectedTrackers.join(','), // Send as comma-separated string
        timeRange: timeRange,
      };
      if (timeRange === 'custom' && customStartDate && customEndDate) {
        queryParams.startDate = customStartDate;
        queryParams.endDate = customEndDate;
      }
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

  // Show prompt if no trackers selected
  const noTrackersSelected = !selectedTrackers || selectedTrackers.length === 0;

  return (
    <div>
      <h2>Reports Dashboard</h2>
      <section>
        <p>View summaries and trends across your tracked data.</p>
        <div>
          <h3>Report Filters</h3>
          <div>
            <label>Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="last24hours">Last 24 Hours</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            {timeRange === 'custom' && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <label>
                  Start:
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    style={{ marginLeft: 4 }}
                  />
                </label>
                <label>
                  End:
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    style={{ marginLeft: 4 }}
                  />
                </label>
              </div>
            )}
          </div>
          <div>
            <label>Trackers to Include:</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1em', marginTop: 4 }}>
              {allTrackers.map((tracker) => (
                <label key={tracker.key} style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedTrackers.includes(tracker.key)}
                    onChange={(e) => {
                      setSelectedTrackers((prev) =>
                        e.target.checked
                          ? [...prev, tracker.key]
                          : prev.filter((t) => t !== tracker.key)
                      );
                    }}
                  />
                  {tracker.label}
                </label>
              ))}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
              <button
                type="button"
                style={{
                  padding: '6px 18px',
                  borderRadius: 6,
                  border: '1px solid #1976d2',
                  background: '#1976d2',
                  color: 'white',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onClick={() => setSelectedTrackers(allTrackers.map(t => t.key))}
              >
                Select All
              </button>
              <button
                type="button"
                style={{
                  padding: '6px 18px',
                  borderRadius: 6,
                  border: '1px solid #888',
                  background: '#fff',
                  color: '#333',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onClick={() => setSelectedTrackers([])}
              >
                Deselect All
              </button>
            </div>
          </div>
        </div>
        <hr />
        <div>
          {noTrackersSelected ? (
            <div style={{ margin: '2em 0', color: '#777', fontStyle: 'italic', textAlign: 'center' }}>
              Please select at least one tracker to view reports.
            </div>
          ) : (
            <div>
              <h3>Summary Data</h3>
              {isLoading && <p>Loading report data...</p>}
              {error && (
                <p style={{ color: 'red' }}>Error loading report: {error}</p>
              )}
              {!isLoading && !error && reportData && (
                <div>
                  {/* SLEEP */}
                  {selectedTrackers.includes('sleep') && reportData.sleepSummary && (
                    <div>
                      <h4>Sleep Summary</h4>
                      <p>
                        Total Sleep: {reportData.sleepSummary.totalHours?.toFixed(1) ?? 'N/A'} hours
                      </p>
                      <p>
                        Average Sleep Duration: {reportData.sleepSummary.avgDuration?.toFixed(1) ?? 'N/A'} hours
                      </p>
                      {Array.isArray(reportData.sleepSummary.chartData) && reportData.sleepSummary.chartData.length > 0 && (
                        <SleepChart data={reportData.sleepSummary.chartData} avg={reportData.sleepSummary.avgDuration} />
                      )}
                    </div>
                  )}
                  {/* FEEDING */}
                  {selectedTrackers.includes('nursing') && reportData.nursingSummary && (
  <div>
    <h4>Nursing Summary</h4>
    <p>
      Total Sessions: {reportData.nursingSummary.totalSessions ?? 'N/A'}
    </p>
    <p>
      Average Duration: {reportData.nursingSummary.avgDuration?.toFixed(1) ?? 'N/A'} min
    </p>
    <p>
      Average Volume: {reportData.nursingSummary.avgVolume?.toFixed(1) ?? 'N/A'} ml/oz
    </p>
    {Array.isArray(reportData.nursingSummary.chartData) && reportData.nursingSummary.chartData.length > 0 && (
      <NursingChart data={reportData.nursingSummary.chartData} />
    )}
  </div>
)}
                  {/* BOTTLE */}
                  {selectedTrackers.includes('bottle') && reportData.bottleSummary && (
                    <div>
                      <h4>Bottle Summary</h4>
                      <p>
                        Total Bottles: {reportData.bottleSummary.totalBottles ?? 'N/A'}
                      </p>
                      <p>
                        Average Volume: {reportData.bottleSummary.avgVolume?.toFixed(1) ?? 'N/A'} ml/oz
                      </p>
                      {Array.isArray(reportData.bottleSummary.chartData) && reportData.bottleSummary.chartData.length > 0 && (
                        <BottleChart data={reportData.bottleSummary.chartData} avg={reportData.bottleSummary.avgVolume} />
                      )}
                    </div>
                  )}
                  {/* DIAPER */}
                  {reportData.diaperSummary && (
                    <div>
                      <h4>Diaper Summary</h4>
                      <p>Wet Diapers: {reportData.diaperSummary.wetCount ?? 'N/A'}</p>
                      <p>Dirty Diapers: {reportData.diaperSummary.dirtyCount ?? 'N/A'}</p>
                      {Array.isArray(reportData.diaperSummary.chartData) && reportData.diaperSummary.chartData.length > 0 && (
                        <DiaperChart data={reportData.diaperSummary.chartData} />
                      )}
                    </div>
                  )}
                  {/* SOLIDS */}
                  {reportData.solidsSummary && (
                    <div>
                      <h4>Solids Summary</h4>
                      <p>Total Feedings: {reportData.solidsSummary.totalFeedings ?? 'N/A'}</p>
                      <p>Average Amount: {reportData.solidsSummary.avgAmount?.toFixed(1) ?? 'N/A'}</p>
                      {Array.isArray(reportData.solidsSummary.chartData) && reportData.solidsSummary.chartData.length > 0 && (
                        <SolidsChart data={reportData.solidsSummary.chartData} />
                      )}
                    </div>
                  )}
                  {/* MEDICINE */}
                  {reportData.medicineSummary && (
                    <div>
                      <h4>Medicine Summary</h4>
                      <p>Total Doses: {reportData.medicineSummary.totalDoses ?? 'N/A'}</p>
                      <p>Medicines Given: {reportData.medicineSummary.medicinesGiven?.join(', ') ?? 'N/A'}</p>
                      {Array.isArray(reportData.medicineSummary.chartData) && reportData.medicineSummary.chartData.length > 0 && (
                        <MedicineChart data={reportData.medicineSummary.chartData} />
                      )}
                    </div>
                  )}
                  {/* GROWTH */}
                  {reportData.growthSummary && (
                    <div>
                      <h4>Growth Summary</h4>
                      <p>Latest Weight: {reportData.growthSummary.latestWeight ?? 'N/A'}</p>
                      <p>Latest Height: {reportData.growthSummary.latestHeight ?? 'N/A'}</p>
                      {Array.isArray(reportData.growthSummary.chartData) && reportData.growthSummary.chartData.length > 0 && (
                        <GrowthChart data={reportData.growthSummary.chartData} />
                      )}
                    </div>
                  )}
                  {/* POTTY */}
                  {reportData.pottySummary && (
                    <div>
                      <h4>Potty Summary</h4>
                      <p>Pee Count: {reportData.pottySummary.peeCount ?? 'N/A'}</p>
                      <p>Poop Count: {reportData.pottySummary.poopCount ?? 'N/A'}</p>
                      {Array.isArray(reportData.pottySummary.chartData) && reportData.pottySummary.chartData.length > 0 && (
                        <PottyChart data={reportData.pottySummary.chartData} />
                      )}
                    </div>
                  )}
                  {/* TEMPERATURE */}
                  {reportData.temperatureSummary && (
                    <div>
                      <h4>Temperature Summary</h4>
                      <p>Readings: {reportData.temperatureSummary.readingsCount ?? 'N/A'}</p>
                      <p>Average Temp: {reportData.temperatureSummary.avgTemp?.toFixed(1) ?? 'N/A'}</p>
                      {Array.isArray(reportData.temperatureSummary.chartData) && reportData.temperatureSummary.chartData.length > 0 && (
                        <TemperatureChart data={reportData.temperatureSummary.chartData} />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ReportsDashboard;
