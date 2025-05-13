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

interface SleepChartData {
  date: string;
  startDateTime?: string;
  hours?: number;
}
interface NursingChartData {
  date: string;
  startDateTime?: string;
  side?: string;
  duration?: number;
}
interface BottleChartData {
  date: string;
  startDateTime?: string;
  volume?: number;
}
interface DiaperChartData {
  date: string;
  startDateTime?: string;
  wet?: number;
  dirty?: number;
}
interface SolidsChartData {
  date: string;
  startDateTime?: string;
  amount?: number;
}
interface MedicineChartData {
  date: string;
  startDateTime?: string;
  medicineName?: string;
}
interface GrowthChartData {
  date: string;
  startDateTime?: string;
  weight?: number;
  height?: number;
}
interface PottyChartData {
  date: string;
  startDateTime?: string;
  pee?: number;
  poop?: number;
}
interface TemperatureChartData {
  date: string;
  startDateTime?: string;
  temperature?: number;
}

// Placeholder type for report data - replace with actual structure
interface ReportData {
  sleepSummary?: {
    totalHours: number;
    avgDuration: number;
    chartData?: unknown;
  };
  nursingSummary?: {
    totalSessions: number;
    avgDuration?: number;
    avgVolume?: number;
    chartData?: Array<{
      date: string;
      side?: string;
      duration?: number;
      volume?: number;
      startDateTime?: string;
      createdAt?: string;
    }>;
  };

  bottleSummary?: {
    totalBottles: number;
    avgVolume?: number;
    chartData?: unknown;
  };
  diaperSummary?: { wetCount: number; dirtyCount: number; chartData?: unknown };
  solidsSummary?: {
    totalFeedings: number;
    avgAmount?: number;
    chartData?: unknown;
  };
  medicineSummary?: {
    totalDoses: number;
    medicinesGiven: string[];
    chartData?: unknown;
  };
  growthSummary?: {
    latestWeight?: number;
    latestHeight?: number;
    chartData?: unknown;
  };
  pottySummary?: { peeCount: number; poopCount: number; chartData?: unknown };
  temperatureSummary?: {
    readingsCount: number;
    avgTemp?: number;
    chartData?: unknown;
  };
}

function normalizeChartData<T extends Record<string, any>>(data: T[]): T[] {
  return data.map((entry) => ({
    ...entry,
    startDateTime: entry.startDateTime ?? entry.createdAt,
  }));
}

const warningLog: string[] = [];
const ReportsDashboard: React.FC = () => {
  const { selectedProfileId } = useProfiles();

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

  const fetchReportData = useCallback(async () => {
    if (!selectedProfileId) {
      setReportData(null);
      return;
    }
    if (!selectedTrackers || selectedTrackers.length === 0) {
      setReportData(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const queryParams: Record<string, string> = {
        trackers: selectedTrackers.join(','),
        timeRange: timeRange,
      };
      if (timeRange === 'custom' && customStartDate && customEndDate) {
        queryParams.startDate = customStartDate;
        queryParams.endDate = customEndDate;
      }
      const fetchedData = await apiClient.get<ReportData>(
        `/profiles/${selectedProfileId}/reports`,
        queryParams
      );
      console.log('Fetched report data:', fetchedData);

      const chartValidators = [
        {
          key: 'sleepSummary',
          label: 'Sleep',
          data: fetchedData.sleepSummary?.chartData,
          required: ['date', 'startDateTime', 'hours'],
        },
        {
          key: 'nursingSummary',
          label: 'Nursing',
          data: fetchedData.nursingSummary?.chartData,
          required: ['date', 'startDateTime', 'side', 'duration'],
        },
        {
          key: 'bottleSummary',
          label: 'Bottle',
          data: fetchedData.bottleSummary?.chartData,
          required: ['date', 'startDateTime', 'volume'],
        },
        {
          key: 'diaperSummary',
          label: 'Diaper',
          data: fetchedData.diaperSummary?.chartData,
          required: ['date', 'startDateTime', 'wet', 'dirty'],
        },
        {
          key: 'solidsSummary',
          label: 'Solids',
          data: fetchedData.solidsSummary?.chartData,
          required: ['date', 'startDateTime', 'amount'],
        },
        {
          key: 'medicineSummary',
          label: 'Medicine',
          data: fetchedData.medicineSummary?.chartData,
          required: ['date', 'startDateTime', 'medicineName'],
        },
        {
          key: 'growthSummary',
          label: 'Growth',
          data: fetchedData.growthSummary?.chartData,
          required: ['date', 'startDateTime', 'weight', 'height'],
        },
        {
          key: 'pottySummary',
          label: 'Potty',
          data: fetchedData.pottySummary?.chartData,
          required: ['date', 'startDateTime', 'pee', 'poop'],
        },
        {
          key: 'temperatureSummary',
          label: 'Temperature',
          data: fetchedData.temperatureSummary?.chartData,
          required: ['date', 'startDateTime', 'temperature'],
        },
      ];

      chartValidators.forEach(({ label, data, required }) => {
        if (data !== undefined) {
          if (!Array.isArray(data)) {
            console.error(
              `[ReportsDashboard] ${label} chartData is not an array`,
              data
            );
            return;
          }
          data.forEach((entry: any, idx: number) => {
            required.forEach((field) => {
              if (!(field in entry)) {
                console.error(
                  `[ReportsDashboard] ${label} chartData entry missing field '${field}' at index ${idx}:`,
                  entry
                );
              }
            });
          });
        }
      });
      setReportData(fetchedData);
    } catch (err: unknown) {
      let errorMsg = 'Unknown error';
      if (err instanceof Error) errorMsg = err.message;
      else if (typeof err === 'string') errorMsg = err;
      else
        try {
          errorMsg = JSON.stringify(err);
        } catch {}
      console.error('Failed to fetch report data:', errorMsg);
      setError(errorMsg || 'Failed to load report data.');
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProfileId, selectedTrackers, timeRange]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const noTrackersSelected = !selectedTrackers || selectedTrackers.length === 0;

  return (
    <div className="main-container">
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
              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
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
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1em',
                marginTop: 4,
              }}
            >
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
                onClick={() =>
                  setSelectedTrackers(allTrackers.map((t) => t.key))
                }
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
            <div
              style={{
                margin: '2em 0',
                color: '#777',
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              Please select at least one tracker to view reports.
            </div>
          ) : (
            <div>
              {warningLog.length > 0 && (
                <div
                  style={{
                    color: 'orange',
                    background: '#fffbe6',
                    border: '1px solid #ffe58f',
                    padding: '8px',
                    marginBottom: '1em',
                  }}
                >
                  <b>Warning:</b> Some summary values are not numbers and may be
                  incorrect. Check console for details.
                  <br />
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {warningLog.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
              <h3>Summary Data</h3>
              {isLoading && <p>Loading report data...</p>}
              {error && (
                <p style={{ color: 'red' }}>Error loading report: {error}</p>
              )}
              {!isLoading && !error && reportData && (
                <div>
                  {}
                  {selectedTrackers.includes('sleep') &&
                    reportData.sleepSummary && (
                      <div>
                        <h4>Sleep Summary</h4>
                        <p>
                          Total Hours:{' '}
                          {(() => {
                            const val = reportData.sleepSummary.totalHours;
                            if (typeof val === 'number') return val.toFixed(1);
                            if (typeof val === 'string') {
                              const num = Number(val);
                              if (isNaN(num)) {
                                window.console.warn(
                                  '[ReportsDashboard] sleepSummary.totalHours is string but not a valid number:',
                                  val
                                );
                                warningLog.push(
                                  'sleepSummary.totalHours: ' + String(val)
                                );
                                return val;
                              }
                              return num.toFixed(1);
                            }
                            if (val !== undefined && val !== null) {
                              window.console.warn(
                                '[ReportsDashboard] sleepSummary.totalHours is unexpected type:',
                                typeof val,
                                val
                              );
                              warningLog.push(
                                'sleepSummary.totalHours: ' + String(val)
                              );
                              return val;
                            }
                            return 'N/A';
                          })()}
                        </p>
                        <p>
                          Average Duration:{' '}
                          {(() => {
                            const val = reportData.sleepSummary.avgDuration;
                            if (typeof val === 'number') return val.toFixed(1);
                            if (typeof val === 'string') {
                              const num = Number(val);
                              if (isNaN(num)) {
                                window.console.warn(
                                  '[ReportsDashboard] sleepSummary.avgDuration is string but not a valid number:',
                                  val
                                );
                                warningLog.push(
                                  'sleepSummary.avgDuration: ' + String(val)
                                );
                                return val;
                              }
                              return num.toFixed(1);
                            }
                            if (val !== undefined && val !== null) {
                              window.console.warn(
                                '[ReportsDashboard] sleepSummary.avgDuration is unexpected type:',
                                typeof val,
                                val
                              );
                              warningLog.push(
                                'sleepSummary.avgDuration: ' + String(val)
                              );
                              return val;
                            }
                            return 'N/A';
                          })()}{' '}
                          hrs
                        </p>
                        {Array.isArray(reportData.sleepSummary.chartData) &&
                          reportData.sleepSummary.chartData.length > 0 && (
                            <SleepChart
                              data={normalizeChartData(
                                reportData.sleepSummary.chartData
                              )}
                              avg={reportData.sleepSummary.avgDuration}
                            />
                          )}
                      </div>
                    )}
                  {}
                  {selectedTrackers.includes('nursing') &&
                    reportData.nursingSummary && (
                      <div>
                        <h4>Nursing Summary</h4>
                        <p>
                          Total Sessions:{' '}
                          {reportData.nursingSummary.totalSessions ?? 'N/A'}
                        </p>
                        <p>
                          Average Duration:{' '}
                          {(() => {
                            const val = reportData.nursingSummary.avgDuration;
                            if (typeof val === 'number') return val.toFixed(1);
                            if (typeof val === 'string') {
                              const num = Number(val);
                              if (isNaN(num)) {
                                window.console.warn(
                                  '[ReportsDashboard] nursingSummary.avgDuration is string but not a valid number:',
                                  val
                                );
                                warningLog.push(
                                  'nursingSummary.avgDuration: ' + String(val)
                                );
                                return val;
                              }
                              return num.toFixed(1);
                            }
                            if (val !== undefined && val !== null) {
                              window.console.warn(
                                '[ReportsDashboard] nursingSummary.avgDuration is unexpected type:',
                                typeof val,
                                val
                              );
                              warningLog.push(
                                'nursingSummary.avgDuration: ' + String(val)
                              );
                              return val;
                            }
                            return 'N/A';
                          })()}{' '}
                          min
                        </p>
                        {Array.isArray(reportData.nursingSummary.chartData) &&
                          reportData.nursingSummary.chartData.length > 0 && (
                            <NursingChart
                              data={normalizeChartData(
                                reportData.nursingSummary.chartData
                              )}
                            />
                          )}
                      </div>
                    )}
                  {selectedTrackers.includes('bottle') &&
                    reportData.bottleSummary && (
                      <div>
                        <h4>Bottle Summary</h4>
                        <p>
                          Total Bottles:{' '}
                          {reportData.bottleSummary.totalBottles ?? 'N/A'}
                        </p>
                        <p>
                          Average Volume:{' '}
                          {(() => {
                            const val = reportData.bottleSummary.avgVolume;
                            if (typeof val === 'number') return val.toFixed(1);
                            if (typeof val === 'string') {
                              const num = Number(val);
                              if (isNaN(num)) {
                                window.console.warn(
                                  '[ReportsDashboard] bottleSummary.avgVolume is string but not a valid number:',
                                  val
                                );
                                warningLog.push(
                                  'bottleSummary.avgVolume: ' + String(val)
                                );
                                return val;
                              }
                              return num.toFixed(1);
                            }
                            if (val !== undefined && val !== null) {
                              window.console.warn(
                                '[ReportsDashboard] bottleSummary.avgVolume is unexpected type:',
                                typeof val,
                                val
                              );
                              warningLog.push(
                                'bottleSummary.avgVolume: ' + String(val)
                              );
                              return val;
                            }
                            return 'N/A';
                          })()}{' '}
                          mL
                        </p>
                        {Array.isArray(reportData.bottleSummary.chartData) &&
                          reportData.bottleSummary.chartData.length > 0 && (
                            <BottleChart
                              data={normalizeChartData(
                                reportData.bottleSummary.chartData
                              )}
                              avg={reportData.bottleSummary.avgVolume}
                            />
                          )}
                      </div>
                    )}
                  {}
                  {reportData.diaperSummary && (
                    <div>
                      <h4>Diaper Summary</h4>
                      <p>
                        Wet Diapers:{' '}
                        {reportData.diaperSummary.wetCount ?? 'N/A'}
                      </p>
                      <p>
                        Dirty Diapers:{' '}
                        {reportData.diaperSummary.dirtyCount ?? 'N/A'}
                      </p>
                      {Array.isArray(reportData.diaperSummary.chartData) &&
                        reportData.diaperSummary.chartData.length > 0 && (
                          <DiaperChart
                            data={normalizeChartData(
                              reportData.diaperSummary.chartData
                            )}
                          />
                        )}
                    </div>
                  )}
                  {}
                  {reportData.solidsSummary && (
                    <div>
                      <h4>Solids Summary</h4>
                      <p>
                        Total Feedings:{' '}
                        {reportData.solidsSummary.totalFeedings ?? 'N/A'}
                      </p>
                      <p>
                        Average Amount:{' '}
                        {(() => {
                          const val = reportData.solidsSummary.avgAmount;
                          if (typeof val === 'number') return val.toFixed(1);
                          if (typeof val === 'string') {
                            const num = Number(val);
                            if (isNaN(num)) {
                              window.console.warn(
                                '[ReportsDashboard] solidsSummary.avgAmount is string but not a valid number:',
                                val
                              );
                              warningLog.push(
                                'solidsSummary.avgAmount: ' + String(val)
                              );
                              return val;
                            }
                            return num.toFixed(1);
                          }
                          if (val !== undefined && val !== null) {
                            window.console.warn(
                              '[ReportsDashboard] solidsSummary.avgAmount is unexpected type:',
                              typeof val,
                              val
                            );
                            warningLog.push(
                              'solidsSummary.avgAmount: ' + String(val)
                            );
                            return val;
                          }
                          return 'N/A';
                        })()}
                      </p>
                      {Array.isArray(reportData.solidsSummary.chartData) &&
                        reportData.solidsSummary.chartData.length > 0 && (
                          <SolidsChart
                            data={normalizeChartData(
                              reportData.solidsSummary.chartData
                            )}
                          />
                        )}
                    </div>
                  )}
                  {}
                  {reportData.medicineSummary && (
                    <div>
                      <h4>Medicine Summary</h4>
                      <p>
                        Total Doses:{' '}
                        {reportData.medicineSummary.totalDoses ?? 'N/A'}
                      </p>
                      <p>
                        Medicines Given:{' '}
                        {reportData.medicineSummary.medicinesGiven?.join(
                          ', '
                        ) ?? 'N/A'}
                      </p>
                      {Array.isArray(reportData.medicineSummary.chartData) &&
                        reportData.medicineSummary.chartData.length > 0 && (
                          <MedicineChart
                            data={normalizeChartData(
                              reportData.medicineSummary.chartData
                            )}
                          />
                        )}
                    </div>
                  )}

                  {reportData.growthSummary && (
                    <div>
                      <h4>Growth Summary</h4>
                      <p>
                        Latest Weight:{' '}
                        {reportData.growthSummary.latestWeight ?? 'N/A'}
                      </p>
                      <p>
                        Latest Height:{' '}
                        {reportData.growthSummary.latestHeight ?? 'N/A'}
                      </p>
                      {Array.isArray(reportData.growthSummary.chartData) &&
                        reportData.growthSummary.chartData.length > 0 && (
                          <GrowthChart
                            data={normalizeChartData(
                              reportData.growthSummary.chartData
                            )}
                          />
                        )}
                    </div>
                  )}
                  {reportData.pottySummary && (
                    <div>
                      <h4>Potty Summary</h4>
                      <p>
                        Pee Count: {reportData.pottySummary.peeCount ?? 'N/A'}
                      </p>
                      <p>
                        Poop Count: {reportData.pottySummary.poopCount ?? 'N/A'}
                      </p>
                      {Array.isArray(reportData.pottySummary.chartData) &&
                        reportData.pottySummary.chartData.length > 0 && (
                          <PottyChart
                            data={normalizeChartData(
                              reportData.pottySummary.chartData
                            )}
                          />
                        )}
                    </div>
                  )}
                  {reportData.temperatureSummary && (
                    <div>
                      <h4>Temperature Summary</h4>
                      <p>
                        Readings:{' '}
                        {reportData.temperatureSummary.readingsCount ?? 'N/A'}
                      </p>
                      <p>
                        Average Temp:{' '}
                        {(() => {
                          const val = reportData.temperatureSummary.avgTemp;
                          if (typeof val === 'number') return val.toFixed(1);
                          if (typeof val === 'string') {
                            const num = Number(val);
                            if (isNaN(num)) {
                              window.console.warn(
                                '[ReportsDashboard] temperatureSummary.avgTemp is string but not a valid number:',
                                val
                              );
                              warningLog.push(
                                'temperatureSummary.avgTemp: ' + String(val)
                              );
                              return val;
                            }
                            return num.toFixed(1);
                          }
                          if (val !== undefined && val !== null) {
                            window.console.warn(
                              '[ReportsDashboard] temperatureSummary.avgTemp is unexpected type:',
                              typeof val,
                              val
                            );
                            warningLog.push(
                              'temperatureSummary.avgTemp: ' + String(val)
                            );
                            return val;
                          }
                          return 'N/A';
                        })()}
                      </p>
                      {Array.isArray(reportData.temperatureSummary.chartData) &&
                        reportData.temperatureSummary.chartData.length > 0 && (
                          <TemperatureChart
                            data={normalizeChartData(
                              reportData.temperatureSummary.chartData
                            )}
                          />
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
