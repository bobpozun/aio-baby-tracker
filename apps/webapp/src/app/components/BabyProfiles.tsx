import React, { useState } from 'react';

// TODO: Replace with actual type from shared-logic
interface BabyProfile {
  id: string;
  name: string;
  birthday: string; // YYYY-MM-DD
}

const BabyProfiles: React.FC = () => {
  // TODO: Replace with data fetched from API
  const [profiles, setProfiles] = useState<BabyProfile[]>([
    { id: '1', name: 'Baby Smith', birthday: '2024-01-15' },
  ]);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileBirthday, setNewProfileBirthday] = useState('');

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName || !newProfileBirthday) return;

    const newProfile: BabyProfile = {
      id: Date.now().toString(), // Replace with proper ID generation
      name: newProfileName,
      birthday: newProfileBirthday,
    };

    console.log('Adding profile (placeholder):', newProfile);
    // API call to save profile would go here
    setProfiles([...profiles, newProfile]);
    // Reset form fields
    setNewProfileName('');
    setNewProfileBirthday('');
  };


  return (
    <div>
      <h2>Baby Profiles</h2>

      <section>
        <h3>Current Profiles</h3>
        {profiles.length === 0 ? (
          <p>No baby profiles added yet.</p>
        ) : (
          <ul>
            {profiles.map((profile) => (
              <li key={profile.id}>
                <strong>{profile.name}</strong> - Birthday: {profile.birthday}
                {/* Add Edit/Delete buttons later */}
              </li>
            ))}
          </ul>
        )}
      </section>

      <hr />

      <section>
        <h3>Add New Profile</h3>
        <form onSubmit={handleAddProfile}>
          <div>
            <label htmlFor="babyName">Name:</label>
            <input
              type="text"
              id="babyName"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="babyBirthday">Birthday (Actual or Expected):</label>
            <input
              type="date"
              id="babyBirthday"
              value={newProfileBirthday}
              onChange={(e) => setNewProfileBirthday(e.target.value)}
              required
            />
          </div>
          <button type="submit">Add Profile</button>
        </form>
      </section>
    </div>
  );
};

export default BabyProfiles;
