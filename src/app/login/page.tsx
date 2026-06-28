'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';

function LoginContent() {
  const router = useRouter();
  const { login, registerListener, registerArtist } = useAuth();
  const [tab, setTab] = useState<'login' | 'listener' | 'artist' | 'reset'>('login');
  const [error, setError] = useState('');
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const ok = login(String(form.get('email')), String(form.get('password')));
    if (!ok) {
      setError('Invalid email or password. Use the sample accounts in the README.');
      return;
    }
    router.push('/home');
  };

  const handleListener = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password'));
    const confirm = String(form.get('confirm'));
    if (password !== confirm) {
      setError('Password and confirmation do not match.');
      return;
    }
    if (form.get('privacy') !== 'on') {
      setError('You must accept the privacy policy.');
      return;
    }
    registerListener({
      displayName: String(form.get('displayName')),
      email: String(form.get('email')),
      password,
      birthDate: String(form.get('birthDate')),
      gender: String(form.get('gender')),
      privacyAccepted: true
    });
    router.push('/home');
  };

  const handleArtist = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const uploadedSamples = form
      .getAll('sampleFiles')
      .filter((item): item is File => item instanceof File && Boolean(item.name))
      .map((file) => file.name);
    const typedSamples = String(form.get('sampleWorks'))
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const sampleWorks = [...uploadedSamples, ...typedSamples];

    if (!sampleWorks.length) {
      setError('Artist signup requires at least one MP3 sample file or one sample link/name.');
      return;
    }

    registerArtist({
      email: String(form.get('email')),
      password: String(form.get('password')),
      artistName: String(form.get('artistName')),
      sampleWorks
    });
    router.push('/home');
  };

  const handleReset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('Password recovery link is mocked; no email will be sent.');
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <aside className="auth-hero">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          width: '100%', 
          marginBottom: '24px', 
          padding: '0 8px',
          gap: '16px' 
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            
            <div className="brand-logo-box">
              <i className="fas fa-music main-note"></i>
              <i className="fas fa-circle-notch wave-ring"></i>
            </div>
            
            <h1 className="page-title" style={{ margin: 0 }}>
              Music Streaming Service
            </h1>
          </div>

        </div>
          
        </aside>
        <div className="auth-body">
          <div className="tabs">
            <button className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Login</button>
            <button className={`tab ${tab === 'listener' ? 'active' : ''}`} onClick={() => setTab('listener')}>Listener Signup</button>
            <button className={`tab ${tab === 'artist' ? 'active' : ''}`} onClick={() => setTab('artist')}>Artist Signup</button>
          </div>

          {error ? <div className="card" style={{ borderColor: 'rgba(245,158,11,.4)', marginBottom: 14 }}>{error}</div> : null}

          {tab === 'login' ? (
            <form className="form" onSubmit={handleLogin}>
              <div className="form-row"><label className="label">Email</label><input className="input" name="email" type="email" defaultValue="gold@example.com" required /></div>
              <div className="form-row"><label className="label">Password</label><input className="input" name="password" type="password" defaultValue="gold123" required /></div>
              <button className="btn primary block">Enter the app</button>
              <button type="button" className="btn ghost block" onClick={() => setTab('reset')}>Forgot password</button>
              <div className="card" style={{ marginTop: 14 }}>
                <strong style={{ display: 'block', marginBottom: 12, fontSize: '13px', color: 'var(--muted)' }}>
                  <i className="fas fa-magic" style={{ marginRight: '6px', color: '#6366f1' }}></i> 
                  Quick Auto-Fill Login
                </strong>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  
                  <button 
                    type="button"
                    className="btn ghost" 
                    style={{ fontSize: '12px', padding: '10px 6px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => {
                      const emailInput = document.getElementsByName('email')[0] as HTMLInputElement;
                      const passwordInput = document.getElementsByName('password')[0] as HTMLInputElement;
                      if (emailInput && passwordInput) {
                        emailInput.value = 'admin@example.com';
                        passwordInput.value = 'admin123';
                      }
                    }}
                  >
                    <i className="fas fa-user-shield" style={{ fontSize: '16px', color: '#f43f5e' }}></i>
                    <strong>Admin</strong>
                  </button>

                  <button 
                    type="button"
                    className="btn ghost" 
                    style={{ fontSize: '12px', padding: '10px 6px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => {
                      const emailInput = document.getElementsByName('email')[0] as HTMLInputElement;
                      const passwordInput = document.getElementsByName('password')[0] as HTMLInputElement;
                      if (emailInput && passwordInput) {
                        emailInput.value = 'support@example.com';
                        passwordInput.value = 'support123';
                      }
                    }}
                  >
                    <i className="fas fa-headset" style={{ fontSize: '16px', color: '#3b82f6' }}></i>
                    <strong>Support</strong>
                  </button>

                  <button 
                    type="button"
                    className="btn ghost" 
                    style={{ fontSize: '12px', padding: '10px 6px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => {
                      const emailInput = document.getElementsByName('email')[0] as HTMLInputElement;
                      const passwordInput = document.getElementsByName('password')[0] as HTMLInputElement;
                      if (emailInput && passwordInput) {
                        emailInput.value = 'artist@example.com';
                        passwordInput.value = 'artist123';
                      }
                    }}
                  >
                    <i className="fas fa-music" style={{ fontSize: '16px', color: '#10b981' }}></i>
                    <strong>Artist</strong>
                  </button>

                </div>
              </div>
            </form>
          ) : null}

          {tab === 'listener' ? (
            <form className="form" onSubmit={handleListener}>
              <div className="form-grid">
                <div className="form-row"><label className="label">Display name</label><input className="input" name="displayName" required /></div>
                <div className="form-row"><label className="label">Email</label><input className="input" name="email" type="email" required /></div>
                <div className="form-row"><label className="label">Password</label><input className="input" name="password" type="password" required /></div>
                <div className="form-row"><label className="label">Confirm password</label><input className="input" name="confirm" type="password" required /></div>
                <div className="form-row"><label className="label">Birth date</label><input className="input" name="birthDate" type="date" required /></div>
                <div className="form-row"><label className="label">Gender</label><select className="select" name="gender"><option>Female</option><option>Male</option><option>Prefer not to say</option></select></div>
              </div>

              <label className="muted" style={{ display: 'block', margin: '14px 0', cursor: 'pointer' }}>
                <input name="privacy" type="checkbox" style={{ marginRight: '6px' }} /> 
                I accept the{' '}
                <button 
                  type="button" 
                  onClick={() => setPrivacyOpen(true)} 
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#3b82f6', 
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    font: 'inherit',
                    display: 'inline'
                  }}
                >
                  Privacy Policy
                </button>.
              </label>

              <button className="btn primary block">Sign up and enter</button>
            </form>
          ) : null}

          {tab === 'artist' ? (
            <form className="form" onSubmit={handleArtist}>
              <div className="form-row"><label className="label">Stage name</label><input className="input" name="artistName" required /></div>
              <div className="form-row"><label className="label">Email</label><input className="input" name="email" type="email" required /></div>
              <div className="form-row"><label className="label">Password</label><input className="input" name="password" type="password" required /></div>
              <div className="form-row">
                <label className="label">Sample MP3 file</label>
                <input className="input" name="sampleFiles" type="file" accept=".mp3,audio/mpeg" multiple />
                <small className="muted">Choose one or more MP3 samples from your computer. The mock frontend stores the selected file names.</small>
              </div>
              <div className="form-row"><label className="label">Extra sample links or names</label><textarea className="textarea" name="sampleWorks" placeholder="Optional: separate extra sample file names or links with commas" /></div>
              <button className="btn primary block">Submit artist account request</button>
              <p className="muted">After submission, the account will be marked as pending approval.</p>
            </form>
          ) : null}

          {tab === 'reset' ? (
            <form className="form" onSubmit={handleReset}>
              <div className="form-row"><label className="label">Account email</label><input className="input" name="email" type="email" required /></div>
              <button className="btn primary block">Get recovery link</button>
              <button type="button" className="btn ghost block" onClick={() => setTab('login')}>Back to login</button>
            </form>
          ) : null}
        </div>
      </section>
      {privacyOpen ? (
        <Modal title="Privacy Policy" onClose={() => setPrivacyOpen(false)}>
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '560px' }}>
            <p className="page-description" style={{ fontSize: '13px', margin: 0 }}>
              This policy explains how Music Streaming Service handles your account details, listening activity, artist profiles, and app preferences while you use this demo music platform.
            </p>

            <div>
              <h4 style={{ margin: '0 0 4px 0', color: 'inherit', fontSize: '15px', fontWeight: 'bold' }}>1. Information we collect</h4>
              <p className="page-description" style={{ fontSize: '13px' }}>
                We may store the details you add to the app, including your name, email address, password, birth date, gender, selected role, followed artists, playlists, library items, notifications, and artist sample file names or links.
              </p>
            </div>

            <div>
              <h4 style={{ margin: '0 0 4px 0', color: 'inherit', fontSize: '15px', fontWeight: 'bold' }}>2. How we use information</h4>
              <p className="page-description" style={{ fontSize: '13px' }}>
                Your information is used to personalize the app experience, keep you signed in, show your library and following list, display artist followers, manage artist account requests, and make the demo features work correctly.
              </p>
            </div>

            <div>
              <h4 style={{ margin: '0 0 4px 0', color: 'inherit', fontSize: '15px', fontWeight: 'bold' }}>3. Storage and security</h4>
              <p className="page-description" style={{ fontSize: '13px' }}>
                This project stores data in your browser's <strong>LocalStorage</strong>. It does not send your data to an external server, cloud database, analytics provider, or advertising network. Because this is a frontend demo, do not use a real password or sensitive personal information.
              </p>
            </div>

            <div>
              <h4 style={{ margin: '0 0 4px 0', color: 'inherit', fontSize: '15px', fontWeight: 'bold' }}>4. Sharing and visibility</h4>
              <p className="page-description" style={{ fontSize: '13px' }}>
                Profile and artist information may be visible inside the app where the feature requires it, such as artist pages, follower counts, playlists, and dashboard sections. We do not sell, rent, or share your demo data with third parties.
              </p>
            </div>

            <div>
              <h4 style={{ margin: '0 0 4px 0', color: 'inherit', fontSize: '15px', fontWeight: 'bold' }}>5. Your choices and control</h4>
              <p className="page-description" style={{ fontSize: '13px' }}>
                You can update your activity inside the app by following or unfollowing artists and changing your library actions. You can remove all stored demo data at any time by clearing this website's browser storage or site data.
              </p>
            </div>

            <div>
              <h4 style={{ margin: '0 0 4px 0', color: 'inherit', fontSize: '15px', fontWeight: 'bold' }}>6. Policy updates</h4>
              <p className="page-description" style={{ fontSize: '13px' }}>
                If this project adds real backend services, payments, messaging, analytics, or public uploads in the future, this policy should be updated before those features are used.
              </p>
            </div>
          </div>
        </Modal>
      ) : null}
    </main>
  );
}


export default function LoginPage() {
  return (
    <Suspense fallback={<main className="auth-page"><div className="card">Preparing...</div></main>}>
      <LoginContent />
    </Suspense>
  );
}
