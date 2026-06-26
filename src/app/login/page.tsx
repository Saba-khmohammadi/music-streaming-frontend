'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Modal from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/home';
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
    router.push(next);
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
          <div>
            <div className="brand-logo">♫</div>
            <h1 className="page-title">Music Streaming Service</h1>
            <p className="page-description">Project Phase 1: mock UI for listener, artist, support, and system admin roles.</p>
          </div>
          <div className="grid">
            <span className="badge">React / Next.js</span>
            <span className="badge">LocalStorage Mock Data</span>
            <span className="badge warning">Responsive LTR UI</span>
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
              <div className="card">
                <strong>Quick accounts</strong>
                <p className="muted">admin@example.com / admin123 — support@example.com / support123 — artist@example.com / artist123</p>
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
              <label className="muted"><input name="privacy" type="checkbox" /> I accept the <button type="button" className="btn ghost" onClick={() => setPrivacyOpen(true)}>Privacy Policy</button>.</label>
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
          <p className="page-description">This Phase 1 version uses mock data. Entered information is stored only in the browser LocalStorage and is not sent to a server.</p>
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
