'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { canUploadProfileImage, subscriptionLabels } from '@/lib/rules';
import { formatNumber } from '@/lib/format';

export default function ProfilePage() {
  const { currentUser, updateCurrentUser } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarError, setAvatarError] = useState('');

  if (!currentUser) return <AppShell><div /></AppShell>;

  const profileImageAllowed = canUploadProfileImage(currentUser.subscription);

  const handleAvatarFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setAvatarError('');
    setAvatarPreview('');
    if (!file) return;

    if (!profileImageAllowed) {
      event.target.value = '';
      setAvatarError('Base users cannot change their profile image. Upgrade to Silver or Gold first.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      event.target.value = '';
      setAvatarError('Please choose a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(String(reader.result));
    reader.onerror = () => setAvatarError('The selected image could not be read.');
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!profileImageAllowed && avatarPreview) {
      setAvatarError('Base users cannot change their profile image.');
      return;
    }
    updateCurrentUser({
      displayName: String(form.get('displayName')),
      birthDate: String(form.get('birthDate')),
      gender: String(form.get('gender')),
      avatarUrl: profileImageAllowed && avatarPreview ? avatarPreview : currentUser.avatarUrl
    });
    setAvatarPreview('');
    setAvatarError('');
    setEditOpen(false);
  };

  return (
    <AppShell>
      <PageHeader title="User Profile" description="Personal information, system username, profile image, subscription type, and listening stats are shown here." />
      <section className="card profile-hero">
        <img src={currentUser.avatarUrl} alt={currentUser.displayName} />
        <div>
          <h2>{currentUser.displayName}</h2>
          <p className="muted">@{currentUser.username}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge">Subscription: {subscriptionLabels[currentUser.subscription]}</span>
            <span className="badge">Role: {currentUser.role}</span>
            {currentUser.verifiedArtist ? <span className="badge success">Verified artist</span> : null}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          <button className="btn primary" onClick={() => setEditOpen(true)}>Edit profile</button>
        </div>
      </section>

      <section className="stats" style={{ marginTop: 18 }}>
        <div className="stat"><strong>{formatNumber(currentUser.followers)}</strong><span className="muted">Followers</span></div>
        <div className="stat"><strong>{formatNumber(currentUser.following)}</strong><span className="muted">Following</span></div>
        <div className="stat"><strong>{formatNumber(currentUser.dailyStreams)}</strong><span className="muted">Daily streams</span></div>
        <div className="stat"><strong>{currentUser.birthDate || '—'}</strong><span className="muted">Birth date</span></div>
      </section>

      {!profileImageAllowed ? (
        <div className="card" style={{ marginTop: 18 }}>
          <span className="badge warning">Base subscription limit</span>
          <p className="muted">Base users cannot change their profile image. The file chooser is available in edit mode, but saving a new profile image is blocked unless the account is Silver or Gold.</p>
        </div>
      ) : null}

      {editOpen ? (
        <Modal title="Edit profile" onClose={() => { setEditOpen(false); setAvatarPreview(''); setAvatarError(''); }}>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-row"><label className="label">Display name</label><input className="input" name="displayName" defaultValue={currentUser.displayName} required /></div>
            <div className="form-grid">
              <div className="form-row"><label className="label">Birth date</label><input className="input" name="birthDate" type="date" defaultValue={currentUser.birthDate} /></div>
              <div className="form-row"><label className="label">Gender</label><input className="input" name="gender" defaultValue={currentUser.gender} /></div>
            </div>
            <div className="form-row">
              <label className="label">Choose profile image from computer</label>
              <input className="input" name="avatarFile" type="file" accept="image/*" onChange={handleAvatarFile} />
              <small className="muted">Only Silver and Gold users can save a selected profile image.</small>
              {avatarError ? <span className="badge danger">{avatarError}</span> : null}
              {avatarPreview ? <img src={avatarPreview} alt="Selected profile preview" className="avatar-preview" /> : null}
            </div>
            <button className="btn primary">Save changes</button>
          </form>
        </Modal>
      ) : null}
    </AppShell>
  );
}
