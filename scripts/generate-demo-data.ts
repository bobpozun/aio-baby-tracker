
import dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/.env' });
import axios from 'axios';
import { CognitoUser, AuthenticationDetails, CognitoUserPool } from 'amazon-cognito-identity-js';


const { API_URL, EMAIL, PASSWORD, USER_POOL_ID, USER_POOL_CLIENT_ID, COGNITO_REGION } = process.env;

if (!API_URL || !EMAIL || !PASSWORD || !USER_POOL_ID || !USER_POOL_CLIENT_ID || !COGNITO_REGION) {
  console.error('Please set API_URL, EMAIL, PASSWORD, USER_POOL_ID, USER_POOL_CLIENT_ID, and COGNITO_REGION in .env');
  process.exit(1);
}


const childrenProfiles = [
  {
    name: 'Baby One', 
    birthday: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  },
  {
    name: 'Baby Two', 
    birthday: new Date(Date.now() + 8 * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  },
  {
    name: 'Baby Three', 
    birthday: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  },
];


async function authenticate(): Promise<string> {
  return new Promise((resolve, reject) => {
    const poolData = {
      UserPoolId: USER_POOL_ID!,
      ClientId: USER_POOL_CLIENT_ID!,
    };
    const userPool = new CognitoUserPool(poolData);
    const userData = {
      Username: EMAIL!,
      Pool: userPool,
    };
    const cognitoUser = new CognitoUser(userData);
    const authDetails = new AuthenticationDetails({
      Username: EMAIL!,
      Password: PASSWORD!,
    });
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (result) => {
        
        const token = result.getIdToken().getJwtToken();
        resolve(token);
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}


async function createProfile(token: string, profile: any) {
  console.log('DEBUG: Using token for createProfile:', token, 'Length:', token?.length);
  const res = await axios.post(`${API_URL}/profiles`, profile, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}


function formatNoSeconds(date: Date|string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

async function createTrackerEntries(token: string, profileId: string, startDate: Date, endDate: Date) {
  async function postEntry(url: string, payload: any, type: string, extraLog = '') {
    try {
      await axios.post(url, payload, { headers: { Authorization: `Bearer ${token}` } });
      console.log(`[${type}] ${extraLog}`);
    } catch (err) {
      console.error(`Failed to create ${type.toLowerCase()} entry:`, err.response?.data || err.message);
    }
    await new Promise((res) => setTimeout(res, 100));
  }
  console.log('DEBUG: Using token for createTrackerEntries:', token, 'Length:', token?.length);
  
  const days: Date[] = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  const limitedDays = days.slice(-100);
  for (const d of limitedDays) {
    
    const isoDay = d.toISOString();
    
    
    const nightStart = new Date(d);
    nightStart.setHours(randomBetween(19, 22), randomBetween(0, 59), 0, 0); 
    nightStart.setDate(nightStart.getDate() - 1); 
    const nightDurationHrs = randomBetween(8, 12);
    const nightDurationMins = nightDurationHrs * 60 + randomBetween(0, 30); 
    const nightEnd = new Date(nightStart.getTime() + nightDurationMins * 60000);
    await postEntry(
      `${API_URL}/profiles/${profileId}/trackers/sleep`,
      {
        startDateTime: nightStart.toISOString(),
        endDateTime: nightEnd.toISOString(),
        duration: nightDurationMins,
        notes: 'Night sleep',
      },
      'Sleep', `Night ${formatNoSeconds(nightStart)} - ${formatNoSeconds(nightEnd)} | Duration: ${nightDurationMins}m`
    );
    
    const napCount = randomBetween(1, 3);
    for (let i = 0; i < napCount; i++) {
      const napStart = new Date(d);
      napStart.setHours(randomBetween(9, 17), randomBetween(0, 59), 0, 0); 
      napStart.setMinutes(napStart.getMinutes() + randomBetween(0, 59)); 
      const napDurationMins = randomBetween(30, 120);
      const napEnd = new Date(napStart.getTime() + napDurationMins * 60000);
      await postEntry(
        `${API_URL}/profiles/${profileId}/trackers/sleep`,
        {
          startDateTime: napStart.toISOString(),
          endDateTime: napEnd.toISOString(),
          duration: napDurationMins,
          notes: `Nap ${i + 1}`,
        },
        'Sleep', `Nap ${i + 1} ${formatNoSeconds(napStart)} - ${formatNoSeconds(napEnd)} | Duration: ${napDurationMins}m`
      );
    }
    
    const nursingSide = Math.random() < 0.5 ? 'left' : 'right';
    const nursingDuration = randomBetween(5, 30);
    
    let durationLeft: number | undefined = undefined;
    let durationRight: number | undefined = undefined;
    let lastSide = nursingSide;
    if (Math.random() < 0.7) {
      
      durationLeft = randomBetween(5, 20);
      durationRight = randomBetween(5, 20);
      lastSide = Math.random() < 0.5 ? 'left' : 'right';
    } else if (Math.random() < 0.5) {
      
      durationLeft = nursingDuration;
      lastSide = 'left';
    } else {
      
      durationRight = nursingDuration;
      lastSide = 'right';
    }
    await postEntry(
      `${API_URL}/profiles/${profileId}/trackers/nursing`,
      {
        durationLeft,
        durationRight,
        lastSide,
        startDateTime: isoDay,
        notes: 'Demo nursing entry',
      },
      'Nursing', `${formatNoSeconds(d)} | Side: ${nursingSide}, Duration: ${nursingDuration}m`
    );
    
    const bottleVolume = randomBetween(60, 180);
    
      const bottleUnits: ('ml' | 'oz')[] = ['ml', 'oz'];
      const bottleTypes: ('formula' | 'breast_milk' | 'other')[] = ['formula', 'breast_milk', 'other'];
      const unit = bottleUnits[Math.floor(Math.random() * bottleUnits.length)];
      const type = bottleTypes[Math.floor(Math.random() * bottleTypes.length)];
      
      let volume = unit === 'ml' ? randomBetween(60, 180) : randomBetween(2, 6);
      await postEntry(
        `${API_URL}/profiles/${profileId}/trackers/bottle`,
        {
          time: isoDay,
          volume,
          unit,
          type,
          notes: 'Demo bottle entry',
        },
        'Bottle', `${formatNoSeconds(d)} | Volume: ${volume}${unit}, Type: ${type}`
      );
    
    const diaperWet = Math.random() < 0.7;
    const diaperDirty = Math.random() < 0.4;
    await postEntry(
      `${API_URL}/profiles/${profileId}/trackers/diaper`,
      {
        startDateTime: isoDay,
        wet: diaperWet,
        dirty: diaperDirty,
        notes: 'Demo diaper entry',
      },
      'Diaper', `${formatNoSeconds(d)} | Wet: ${diaperWet}, Dirty: ${diaperDirty}`
    );
    
    if (Math.random() < 0.6) {
      const solidsAmount = randomBetween(10, 60);
      await postEntry(
        `${API_URL}/profiles/${profileId}/trackers/solids`,
        {
          startDateTime: isoDay,
          amount: solidsAmount,
          notes: 'Demo solids entry',
        },
        'Solids', `${formatNoSeconds(d)} | Amount: ${solidsAmount}g`
      );
    }
    
    if (Math.random() < 0.1) {
      const medDose = randomBetween(1, 3);
      await postEntry(
        `${API_URL}/profiles/${profileId}/trackers/medicine`,
        {
          startDateTime: isoDay,
          medicineName: 'DemoMed',
          dose: medDose,
          notes: 'Demo medicine entry',
        },
        'Medicine', `${formatNoSeconds(d)} | Dose: ${medDose}`
      );
    }
    
    if (d.getDate() === 1) {
      const growthWeight = randomBetween(3, 15);
      const growthHeight = randomBetween(45, 100);
      await postEntry(
        `${API_URL}/profiles/${profileId}/trackers/growth`,
        {
          startDateTime: isoDay,
          weight: growthWeight,
          height: growthHeight,
          notes: 'Demo growth entry',
        },
        'Growth', `${formatNoSeconds(d)} | Weight: ${growthWeight}kg, Height: ${growthHeight}cm`
      );
    }
    
    if (Math.random() < 0.3) {
      const pottyPee = Math.random() < 0.8;
      const pottyPoop = Math.random() < 0.3;
      await postEntry(
        `${API_URL}/profiles/${profileId}/trackers/potty`,
        {
          startDateTime: isoDay,
          pee: pottyPee,
          poop: pottyPoop,
          notes: 'Demo potty entry',
        },
        'Potty', `${formatNoSeconds(d)} | Pee: ${pottyPee}, Poop: ${pottyPoop}`
      );
    }
    
    if (Math.random() < 0.2) {
      const temp = randomBetween(36, 39);
      await postEntry(
        `${API_URL}/profiles/${profileId}/trackers/temperature`,
        {
          startDateTime: isoDay,
          temperature: temp,
          notes: 'Demo temperature entry',
        },
        'Temp', `${formatNoSeconds(d)} | Temp: ${temp}°C`
      );
    }
  }
}


async function deleteAllProfiles(token: string) {
  function isThrottleError(err: any) {
    const msg = err?.response?.data?.message || err?.message || '';
    return msg.includes('throttle') || msg.includes('Rate exceeded') || msg.includes('limit exceeded');
  }

  try {
    const res = await axios.get(`${API_URL}/profiles`, { headers: { Authorization: `Bearer ${token}` } });
    const profiles = res.data;
    for (const profile of profiles) {
      let retries = 0;
      while (retries < 3) {
        try {
          await axios.delete(`${API_URL}/profiles/${profile.id}`, { headers: { Authorization: `Bearer ${token}` } });
          console.log(`Deleted profile: ${profile.name}`);
          break;
        } catch (err) {
          if (isThrottleError(err) && retries < 2) {
            const delay = Math.pow(2, retries) * 250; // 250ms, 500ms, 1000ms
            console.warn(`Throttle error deleting ${profile.name}, retrying in ${delay}ms...`);
            await new Promise(res => setTimeout(res, delay));
            retries++;
          } else {
            try {
  console.error(`Failed to delete profile ${profile.name}:`, err.response?.data || err.message);
  console.error('Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
} catch (logErr) {
  console.error('Error stringifying error:', logErr);
  console.error('Raw error:', err);
}
            break;
          }
        }
      }
      await new Promise(res => setTimeout(res, 200)); // Always wait 200ms between deletes
    }
  } catch (err) {
    console.error('Failed to fetch profiles:', err.response?.data || err.message);
  }
}


async function main() {
  try {
    const token = await authenticate();
    
    await deleteAllProfiles(token);
    for (const child of childrenProfiles) {
      let profile;
      
      try {
        profile = await createProfile(token, { name: child.name, birthday: child.birthday });
      } catch (err) {
        console.error(`Failed to create profile for ${child.name}:`, err.response?.data || err.message);
        continue;
      }
      if (!profile?.id) {
        console.warn(`Could not create profile for ${child.name}`);
        continue;
      }
      
      let startDate: Date, endDate: Date;
      const birthdayDate = new Date(child.birthday);
      if (birthdayDate > new Date()) {
        startDate = new Date();
        endDate = birthdayDate;
      } else {
        endDate = new Date();
        startDate = addDays(endDate, -60);
      }
      await createTrackerEntries(token, profile.id, startDate, endDate);
      console.log(`Generated data for profile: ${profile.name}`);
    }
    console.log('Demo data generation complete.');
  } catch (e) {
    console.error('Demo data generation failed:', e);
    process.exit(1);
  }
}

main();
