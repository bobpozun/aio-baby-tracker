import React from 'react';
import { Route, Routes, Link, useNavigate } from 'react-router-dom';
import { Authenticator, Button } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useProfiles } from './context/ProfileContext';

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
import AppLogo from '../../assets/aio-app-logo.png';
import AppHeaderImg from '../../assets/aio-app-header.png';
import { getProfileAgeOrDue } from './utils/dateUtils';

const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="nav-icon">{children}</span>
);
const HomeIcon = () => (
  <IconWrapper>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  </IconWrapper>
);
const BabyIcon = () => (
  <IconWrapper>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 18v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"></path>
      <path d="M20 18v1a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h6v4c0 1.1.9 2 2 2Z"></path>
      <path d="M10 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"></path>
      <path d="M16 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"></path>
    </svg>
  </IconWrapper>
);
const PregnancyIcon = () => (
  <IconWrapper>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.5 2.5c3.66 0 7 2.34 7 5.2V17.5c0 .83.67 1.5 1.5 1.5H17c2.21 0 4-1.79 4-4 0-3.86-3.58-7-8-7a9 9 0 0 0-8 7 4.5 4.5 0 0 0 4.5 4.5c1.93 0 3.5-1.57 3.5-3.5V6.5c0-1.38 1.12-2.5 2.5-2.5Z"></path>
    </svg>
  </IconWrapper>
);
const ChecklistIcon = () => (
  <IconWrapper>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 6v12a3 3 0 0 0 3-3H6a3 3 0 0 0 3 3V6a3 3 0 0 0-3 3h12a3 3 0 0 0-3-3Z"></path>
      <path d="m10 12 2 2 4-4"></path>
    </svg>
  </IconWrapper>
);
const SleepIcon = () => (
  <IconWrapper>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
    </svg>
  </IconWrapper>
);
const NursingIcon = () => (
  <IconWrapper>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12h18"></path>
      <path d="m19 16-4-4 4-4"></path>
      <path d="m5 8 4 4-4 4"></path>
    </svg>
  </IconWrapper>
);
const BottleIcon = () => (
  <IconWrapper>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2h8"></path>
      <path d="M9 2v1.5A2.5 2.5 0 0 1 6.5 6V7"></path>
      <path d="M15 2v1.5A2.5 2.5 0 0 0 17.5 6V7"></path>
      <path d="M6 7h12"></path>
      <path d="M6 7v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7"></path>
      <path d="M10 11h4"></path>
      <path d="M10 15h4"></path>
    </svg>
  </IconWrapper>
);
const SolidsIcon = () => (
  <IconWrapper>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
      <path d="M12 6a6 6 0 0 1 0 12 6 6 0 0 1 0-12"></path>
    </svg>
  </IconWrapper>
);
const DiaperIcon = () => (
  <IconWrapper>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {}
      <path
        d="M4 8 Q6 20 12 20 Q18 20 20 8 Q16 10 12 10 Q8 10 4 8 Z"
        fill="none"
      />
      {}
      <path d="M4 8 Q2 12 6 12" />
      {}
      <path d="M20 8 Q22 12 18 12" />
      {}
      <path d="M12 10 Q12 15 12 20" />
    </svg>
  </IconWrapper>
);
const MedicineIcon = () => (
  <IconWrapper>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform="rotate(45 9 9)">
        {}
        <ellipse cx="9" cy="4" rx="4" ry="2.5" />
        {}
        <rect x="7.25" y="6" width="3.5" height="7" rx="1.2" />
        {}
        <path d="M9 14 Q10.2 16 9 18 Q7.8 16 9 14 Z" />
      </g>
    </svg>
  </IconWrapper>
);
const GrowthIcon = () => (
  <IconWrapper>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18"></path>
      <path d="m19 9-5 5-4-4-3 3"></path>
    </svg>
  </IconWrapper>
);
const TempIcon = () => (
  <IconWrapper>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"></path>
    </svg>
  </IconWrapper>
);
const PottyIcon = () => (
  <IconWrapper>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {}
      <ellipse cx="9" cy="12" rx="5.5" ry="3.5" />
      {}
      <ellipse cx="9" cy="12" rx="6.5" ry="4.2" strokeWidth="1" />
      {}
      <rect x="4" y="3" width="10" height="4" rx="1.5" />
      {}
      <rect x="7" y="15" width="4" height="2" rx="1" />
      {}
      <line x1="12.5" y1="4.5" x2="14" y2="3.2" strokeWidth="1" />
    </svg>
  </IconWrapper>
);
const NotesIcon = () => (
  <IconWrapper>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"></path>
      <path d="M15 3v6h6"></path>
      <path d="M10 16s-1 1-4 1"></path>
      <path d="M10 12s-2 1-4 1"></path>
    </svg>
  </IconWrapper>
);
const ReportsIcon = () => (
  <IconWrapper>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18"></path>
      <path d="M18 17V9"></path>
      <path d="M13 17V5"></path>
      <path d="M8 17v-3"></path>
    </svg>
  </IconWrapper>
);
const SettingsIcon = () => (
  <IconWrapper>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  </IconWrapper>
);

interface AppContentProps {
  user?: AuthUser;
  signOut?: () => void;
}

const Home = ({ user, signOut }: AppContentProps) => {
  return (
    <div>
      {' '}
      {}
      <h2>Home Page</h2> {}
      <section>
        {' '}
        {}
        <p>Welcome, {user?.signInDetails?.loginId || 'User'}!</p>
        {}
        {signOut && (
          <Button
            onClick={signOut}
            style={{ display: 'block', margin: '20px auto 0 auto' }}
          >
            Sign Out
          </Button>
        )}
      </section>
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

const ProfileSelector: React.FC = () => {
  const { profiles, selectedProfileId, selectProfile } = useProfiles();
  const navigate = useNavigate();

  const handleSelectionChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value;
    if (value === 'add_new') {
      navigate('/profiles');
    } else if (value) {
      // Ensure a profile was actually selected (not the disabled placeholder)
      selectProfile(value);
    }
  };

  return (
    <div
      className="profile-selector-container"
      style={{
        marginLeft: 'auto',
        alignSelf: 'center',
      }}
    >
      {}
      <select
        id="profile-select"
        value={selectedProfileId || ''}
        onChange={handleSelectionChange}
        style={{
          padding: '5px 25px 5px 8px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: 'white',
          fontSize: '0.9em',
        }}
      >
        {profiles.length === 0 ? (
          // NEW LOGIC: Show disabled placeholder and active Add option
          (<>
            <option value="" disabled>
              -- No profiles yet --
            </option>
            <option
              value="add_new"
              style={{ fontStyle: 'italic', color: '#555' }}
            >
              + Add Profile
            </option>
          </>)
        ) : (
          <>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
            <option
              value="add_new"
              style={{
                fontStyle: 'italic',
                color: '#555',
                borderTop: '1px dashed #ccc',
                paddingTop: '5px',
              }}
            >
              + Add Profile
            </option>
          </>
        )}
      </select>
    </div>
  );
};

function AppContent({ user, signOut }: AppContentProps) {
  const { selectedProfileId, getProfileById } = useProfiles();
  const profile = selectedProfileId ? getProfileById(selectedProfileId) : null;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleBackdropClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {' '}
      {}
      <div className="app-header-container">
        <header className="app-header">
          {}
          <button
            className="hamburger-btn md:hidden mr-4 p-2 rounded-md"
            aria-label={
              isMobileMenuOpen
                ? 'Close navigation menu'
                : 'Open navigation menu'
            }
            aria-expanded={isMobileMenuOpen}
            aria-controls="main-nav"
            onClick={toggleMobileMenu}
            style={{ display: 'block' }}
          >
            {isMobileMenuOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
          <img
            src={AppHeaderImg}
            alt="AIO Baby Tracker Header"
            className="app-header-image"
          />
          <ProfileSelector /> {}
        </header>
      </div>
      <div
        className={`app-body-container ${isMobileMenuOpen ? 'menu-open' : ''}`}
        onClick={isMobileMenuOpen ? handleBackdropClick : undefined}
      >
        {}
        {isMobileMenuOpen && (
          <div className="mobile-nav-backdrop" onClick={handleBackdropClick} />
        )}

        {}
        <nav
          className={`app-nav${isMobileMenuOpen ? ' nav-open' : ''}`}
          id="main-nav"
          aria-labelledby="nav-heading"
          tabIndex={-1}
        >
          <h2 id="nav-heading" className="sr-only">
            Main Navigation
          </h2>
          <ul>
            <li>
              <HomeIcon /> <Link to="/">Home</Link>
            </li>
            <li>
              <BabyIcon /> <Link to="/profiles">Baby Profiles</Link>
            </li>
            <li>
              <PregnancyIcon /> <Link to="/guide">Pregnancy Guide</Link>
            </li>
            <li>
              <ChecklistIcon /> <Link to="/checklist">Pregnancy Checklist</Link>
            </li>
          </ul>
          <br />
          <ul>
            <li>
              <SleepIcon /> <Link to="/trackers/sleep">Sleep</Link>
            </li>
            <li>
              <NursingIcon /> <Link to="/trackers/nursing">Nursing</Link>
            </li>
            <li>
              <BottleIcon /> <Link to="/trackers/bottle">Bottle</Link>
            </li>
            <li>
              <SolidsIcon /> <Link to="/trackers/solids">Solids</Link>
            </li>
            <li>
              <DiaperIcon /> <Link to="/trackers/diaper">Diaper</Link>
            </li>
            <li>
              <MedicineIcon /> <Link to="/trackers/medicine">Medicine</Link>
            </li>
            <li>
              <GrowthIcon /> <Link to="/trackers/growth">Growth</Link>
            </li>
            <li>
              <TempIcon /> <Link to="/trackers/temperature">Temperature</Link>
            </li>
            <li>
              <PottyIcon /> <Link to="/trackers/potty">Potty</Link>
            </li>
          </ul>
          <br />
          <ul>
            <li>
              <NotesIcon /> <Link to="/notes">Central Notes</Link>
            </li>
            <li>
              <ReportsIcon /> <Link to="/reports">Reports</Link>
            </li>
            <li>
              <SettingsIcon /> <Link to="/settings">Settings</Link>
            </li>
          </ul>
        </nav>
        <div className="app-main-content">
          {}
          {selectedProfileId && profile && (
            <div
              style={{
                background: 'var(--accent-light-color)',
                color: 'var(--text-color)',
                padding: '8px 18px',
                borderRadius: '8px',
                margin: '10px 0 18px 0',
                fontWeight: 500,
                fontSize: '1.08em',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '1.15em' }}>
                {profile.name}
              </span>
              <span style={{ color: 'var(--primary-color)' }}>
                {getProfileAgeOrDue(profile.birthday)}
              </span>
            </div>
          )}
          {}
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
            <Route
              path="/trackers/temperature"
              element={<TemperatureTracker />}
            />
            <Route path="/trackers/potty" element={<PottyTracker />} />
            <Route path="/notes" element={<CentralNotes />} />
            <Route path="/reports" element={<ReportsDashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

function App() {
  const authComponents = {
    Header() {
      return (
        <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
          <img
            src={AppLogo}
            alt="AIO Baby Tracker Logo"
            style={{ maxWidth: '380px', marginBottom: '10px' }}
          />
        </div>
      );
    },
  };

  return (
    <Authenticator
      components={authComponents}
      formFields={{
        signUp: {
          username: {
            label: 'Email',
            placeholder: 'Enter your email',
            order: 1,
          },
          given_name: {
            label: 'First Name',
            placeholder: 'Enter your first name',
            order: 2,
            isRequired: true,
          },
          family_name: {
            label: 'Last Name',
            placeholder: 'Enter your last name',
            order: 3,
            isRequired: true,
          },
          password: {
            label: 'Password',
            placeholder: 'Enter your password',
            order: 4,
          },
          confirm_password: {
            label: 'Confirm Password',
            placeholder: 'Confirm your password',
            order: 5,
          },
        },
      }}
    >
      {({ signOut, user }) => (
        <main>
          <AppContent user={user} signOut={signOut} />
        </main>
      )}
    </Authenticator>
  );
}

export default App;
