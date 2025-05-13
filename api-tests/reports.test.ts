import {
  apiGet,
  apiPost,
  apiDelete,
  clearAuthToken,
  signOutAndClearAuth,
} from './apiTestClient';

describe('Reports API - Chart Data Structure', () => {
  let testProfileId: string | null = null;

  beforeAll(async () => {
    await signOutAndClearAuth();
    clearAuthToken();
    const profileData = {
      name: `ReportsTest Baby ${Date.now()}`,
      birthday: '2025-02-10',
    };
    const response = await apiPost('/profiles', profileData);
    testProfileId = response.id;
  });

  afterAll(async () => {
    if (testProfileId) await apiDelete(`/profiles/${testProfileId}`);
  });

  it('should return consistent chartData for all summaries', async () => {
    if (!testProfileId)
      throw new Error('Test setup failed: testProfileId is null.');

    await apiPost(`/profiles/${testProfileId}/trackers/nursing`, {
      startTime: new Date().toISOString(),
      durationLeft: 8,
      durationRight: 12,
      lastSide: 'right',
      side: 'right',
    });

    await apiPost(`/profiles/${testProfileId}/trackers/bottle`, {
      time: new Date().toISOString(),
      amount: 150,
      unit: 'ml',
      type: 'formula',
    });

    await apiPost(`/profiles/${testProfileId}/trackers/diaper`, {
      time: new Date().toISOString(),
      type: 'mixed',
    });

    await apiPost(`/profiles/${testProfileId}/trackers/medicine`, {
      time: new Date().toISOString(),
      medicineName: 'TestMed',
      dosage: '2ml',
    });

    await apiPost(`/profiles/${testProfileId}/trackers/potty`, {
      time: new Date().toISOString(),
      type: 'both',
    });

    const trackerTypes = ['nursing', 'bottle', 'diaper', 'medicine', 'potty'];
    const report = await apiGet(
      `/profiles/${testProfileId}/reports?trackers=${trackerTypes.join(
        ','
      )}&timeRange=last7days`
    );

    console.log('REPORT RESPONSE:', JSON.stringify(report, null, 2));
    for (const entry of report.nursingSummary.chartData) {
      console.log('NURSING ENTRY:', JSON.stringify(entry, null, 2));
    }
    expect(report.nursingSummary.chartData.length).toBeGreaterThan(0);
    for (const entry of report.nursingSummary.chartData) {
      expect(typeof entry.date).toBe('string');
      expect(typeof entry.startDateTime).toBe('string');
      expect(['left', 'right']).toContain(entry.side);
      expect(typeof entry.duration).toBe('number');
      expect(() => new Date(entry.date)).not.toThrow();
    }

    expect(report.bottleSummary.chartData.length).toBeGreaterThan(0);
    for (const entry of report.bottleSummary.chartData) {
      expect(typeof entry.date).toBe('string');
      expect(typeof entry.startDateTime).toBe('string');
      expect(typeof entry.volume).toBe('number');
      expect(() => new Date(entry.date)).not.toThrow();
    }

    expect(report.diaperSummary.chartData.length).toBeGreaterThan(0);
    for (const entry of report.diaperSummary.chartData) {
      expect(typeof entry.date).toBe('string');
      expect(typeof entry.startDateTime).toBe('string');
      expect(typeof entry.wet).toBe('number');
      expect(typeof entry.dirty).toBe('number');
      expect(() => new Date(entry.date)).not.toThrow();
    }

    expect(report.medicineSummary.chartData.length).toBeGreaterThan(0);
    for (const entry of report.medicineSummary.chartData) {
      expect(typeof entry.date).toBe('string');
      expect(typeof entry.startDateTime).toBe('string');
      expect(typeof entry.medicineName).toBe('string');
      expect(typeof entry.doses).toBe('number');
      expect(() => new Date(entry.date)).not.toThrow();
    }

    expect(report.pottySummary.chartData.length).toBeGreaterThan(0);
    for (const entry of report.pottySummary.chartData) {
      expect(typeof entry.date).toBe('string');
      expect(typeof entry.startDateTime).toBe('string');
      expect(typeof entry.pee).toBe('number');
      expect(typeof entry.poop).toBe('number');
      expect(() => new Date(entry.date)).not.toThrow();
    }
  });
});
