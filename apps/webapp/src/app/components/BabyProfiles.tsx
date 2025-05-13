import React, { useState } from 'react';
import { useProfiles, BabyProfile } from '../context/ProfileContext';

const EditProfileForm: React.FC<{
  profile: BabyProfile;
  onSave: (id: string, name: string, birthday: string) => void;
  onCancel: () => void;
}> = ({ profile, onSave, onCancel }) => {
  const [name, setName] = useState(profile.name);
  const [birthday, setBirthday] = useState(profile.birthday);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !birthday) return;
    onSave(profile.id, name, birthday);
  };

  return (
    <form onSubmit={handleSave} className="section-card">
      <h4>Edit Profile</h4>
      <div>
        <label htmlFor={`editName-${profile.id}`}>Name:</label>
        <input
          type="text"
          id={`editName-${profile.id}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor={`editBirthday-${profile.id}`}>Birthday:</label>
        <input
          type="date"
          id={`editBirthday-${profile.id}`}
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          required
        />
      </div>
      <button type="submit" style={{ marginRight: '10px' }}>
        Save Changes
      </button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
};

const BabyProfiles: React.FC = () => {
  const { profiles, addProfile, editProfile, deleteProfile } = useProfiles();
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileBirthday, setNewProfileBirthday] = useState('');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  const handleAddProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProfile(newProfileName, newProfileBirthday);
    setNewProfileName('');
    setNewProfileBirthday('');
  };

  const handleEditSave = (id: string, name: string, birthday: string) => {
    editProfile(id, name, birthday);
    setEditingProfileId(null);
  };

  const handleDeleteClick = (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the profile for ${name}? This action cannot be undone.`
      )
    ) {
      deleteProfile(id);
    }
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
                {editingProfileId === profile.id ? (
                  <EditProfileForm
                    profile={profile}
                    onSave={handleEditSave}
                    onCancel={() => setEditingProfileId(null)}
                  />
                ) : (
                  <>
                    <strong>{profile.name}</strong> - Birthday:{' '}
                    {profile.birthday}
                    <button
                      onClick={() => setEditingProfileId(profile.id)}
                      style={{
                        marginLeft: '10px',
                        padding: '2px 6px',
                        fontSize: '0.8em',
                      }}
                    >
                      Edit
                    </button>
                    {}
                    <button
                      onClick={() =>
                        handleDeleteClick(profile.id, profile.name)
                      }
                      style={{
                        marginLeft: '5px',
                        padding: '2px 6px',
                        fontSize: '0.8em',
                        backgroundColor: '#dc3545',
                        color: 'white',
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <hr />

      <section>
        <h3>Add New Profile</h3>
        <form onSubmit={handleAddProfileSubmit}>
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
