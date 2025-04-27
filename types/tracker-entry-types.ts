// Shared tracker entry types for backend, scripts, and frontend

export type SleepEntry = {
  trackerType: 'sleep';
  startDateTime: string;
  endDateTime: string;
  duration: number;
  notes: string;
  createdAt: string;
};

export type NursingEntry = {
  trackerType: 'nursing';
  startDateTime: string;
  endDateTime: string | null;
  duration: number;
  durationLeft: number | null;
  durationRight: number | null;
  side: 'left' | 'right' | null;
  volume: number | null;
  notes: string;
  createdAt: string;
};

export type BottleEntry = {
  trackerType: 'bottle';
  startDateTime: string;
  endDateTime: string | null;
  volume: number;
  unit: 'ml' | 'oz';
  type: 'formula' | 'breast_milk' | 'other';
  notes: string;
  createdAt: string;
};

export type DiaperEntry = {
  trackerType: 'diaper';
  startDateTime: string;
  endDateTime: string | null;
  type: 'wet' | 'dirty' | 'mixed' | 'other';
  wet: boolean;
  dirty: boolean;
  notes: string;
  createdAt: string;
};

export type SolidsEntry = {
  trackerType: 'solids';
  startDateTime: string;
  endDateTime: string | null;
  amount: number;
  notes: string;
  createdAt: string;
};

export type MedicineEntry = {
  trackerType: 'medicine';
  startDateTime: string;
  endDateTime: string | null;
  medicineName: string;
  dose: number;
  notes: string;
  createdAt: string;
};

export type GrowthEntry = {
  trackerType: 'growth';
  startDateTime: string;
  endDateTime: string | null;
  weight: number;
  height: number;
  notes: string;
  createdAt: string;
};

export type PottyEntry = {
  trackerType: 'potty';
  startDateTime: string;
  endDateTime: string | null;
  type: 'pee' | 'poop' | 'both' | 'other';
  pee: boolean;
  poop: boolean;
  notes: string;
  createdAt: string;
};

export type TemperatureEntry = {
  trackerType: 'temperature';
  startDateTime: string;
  endDateTime: string | null;
  temperature: number;
  unit: 'F';
  notes: string;
  createdAt: string;
};

export type TrackerEntry =
  | SleepEntry
  | NursingEntry
  | BottleEntry
  | DiaperEntry
  | SolidsEntry
  | MedicineEntry
  | GrowthEntry
  | PottyEntry
  | TemperatureEntry;
