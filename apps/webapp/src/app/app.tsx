import React from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import { Authenticator, useAuthenticator, Button } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import BabyProfiles from './components/BabyProfiles';
import PregnancyGuide from './components/PregnancyGuide';
import PregnancyChecklist from './components/PregnancyChecklist';
import SleepTracker from './components/trackers/SleepTracker';
import NursingTracker from './components/trackers/NursingTracker';
import BottleTracker from './components/trackers/BottleTracker';
import SolidsTracker from './components/trackers/SolidsTracker';
import DiaperTracker from './components/trackers/DiaperTracker';
import MedicineTracker from './components/trackers/MedicineTracker';
import GrowthTracker from './components/trackers/GrowthTracker';
import TemperatureTracker from './components/trackers/TemperatureTracker';
import PottyTracker from './components/trackers/PottyTracker';
import CentralNotes from './components/CentralNotes';
import { AuthUser } from 'aws-amplify/auth';
import ReportsDashboard from './components/ReportsDashboard';

interface AppContentProps {
  user?: AuthUser;
  signOut?: () => void;
}

const Home = ({ user, signOut }: AppContentProps) => {
  return (
    <div>
      <h2>Home Page</h2>
      <p>Welcome, {user?.signInDetails?.loginId || 'User'}!</p>
      {signOut && <Button onClick={signOut}>Sign Out</Button>}
    </div>
  );
};


const Settings = () => {
  return (
    <div>
      <h2>Settings</h2>
      <p>Manage your account and preferences.</p>

      <section>
        <h3>User Profile</h3>
        <p>Profile editing coming soon...</p>
      </section>

      <section>
        <h3>Payment Information (Placeholders)</h3>
        <p>Securely manage your payment methods.</p>
        <div>
          <h4>PayPal</h4>
          <button disabled>Connect PayPal (Requires Setup)</button>
        </div>
        <div>
          <h4>Stripe (Credit/Debit Card)</h4>
          <p>Card details form placeholder (Requires Setup)</p>
        </div>
        <div>
          <h4>Apple Pay / Google Pay</h4>
          <button disabled>Setup Apple/Google Pay (Requires Setup)</button>
        </div>
        <div>
          <h4>ACH / Bank Transfer</h4>
          <p>Bank account connection placeholder (Requires Setup)</p>
        </div>
      </section>

      <section>
        <h3>App Preferences</h3>
        <p>Notification settings, theme, etc. coming soon...</p>
      </section>
    </div>
  );
};

function AppContent({ user, signOut }: AppContentProps) {
  return (
    <div className="app-container">
      <nav className="app-nav">
        <h2>Navigation</h2>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/profiles">Baby Profiles</Link></li>
          <li><Link to="/guide">Pregnancy Guide</Link></li>
          <li><Link to="/checklist">Pregnancy Checklist</Link></li>
          <li><Link to="/trackers/sleep">Sleep Tracker</Link></li>
          <li><Link to="/trackers/nursing">Nursing Tracker</Link></li>
          <li><Link to="/trackers/bottle">Bottle Tracker</Link></li>
          <li><Link to="/trackers/solids">Solids Tracker</Link></li>
          <li><Link to="/trackers/diaper">Diaper Tracker</Link></li>
          <li><Link to="/trackers/medicine">Medicine Tracker</Link></li>
          <li><Link to="/trackers/growth">Growth Tracker</Link></li>
          <li><Link to="/trackers/temperature">Temperature Tracker</Link></li>
          <li><Link to="/trackers/potty">Potty Tracker</Link></li>
          <li><Link to="/notes">Central Notes</Link></li>
          <li><Link to="/reports">Reports</Link></li>
          <li><Link to="/settings">Settings</Link></li>
        </ul>
      </nav>
      <div className="app-main-content">
        <h1>AIO Baby Tracker</h1>
        <Routes>
          <Route path="/" element={<Home user={user} signOut={signOut} />} />
        <Route path="/profiles" element={<BabyProfiles />} />
        <Route path="/guide" element={<PregnancyGuide />} />
        <Route path="/checklist" element={<PregnancyChecklist />} />
        <Route path="/trackers/sleep" element={<SleepTracker />} />
        <Route path="/trackers/nursing" element={<NursingTracker />} />
        <Route path="/trackers/bottle" element={<BottleTracker />} />
        <Route path="/trackers/solids" element={<SolidsTracker />} />
        <Route path="/trackers/diaper" element={<DiaperTracker />} />
        <Route path="/trackers/medicine" element={<MedicineTracker />} />
        <Route path="/trackers/growth" element={<GrowthTracker />} />
        <Route path="/trackers/temperature" element={<TemperatureTracker />} />
        <Route path="/trackers/potty" element={<PottyTracker />} />
        <Route path="/notes" element={<CentralNotes />} />
        <Route path="/reports" element={<ReportsDashboard />} />
        <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  const skipAuth = import.meta.env.VITE_DEV_SKIP_AUTH === 'true';

  if (skipAuth) {
    console.warn('!!! AUTHENTICATION BYPASSED FOR DEVELOPMENT !!!');
    return (
      <main>
        <AppContent />
      </main>
    );
  }

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main>
          <AppContent user={user} signOut={signOut} />
        </main>
      )}
    </Authenticator>
  );
}


export default App;
