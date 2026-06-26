'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/format';
import { getCollection } from '@/lib/storage';
import { displaySubscriptionLabel, subscriptionLabels } from '@/lib/rules';
import type { SubscriptionPricing, SubscriptionTier } from '@/types/domain';

export default function SettingsPage() {
  const router = useRouter();
  const { currentUser, updatePreferences, changeSubscription, deleteCurrentAccount } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const pricing = getCollection('pricing') as SubscriptionPricing;

  if (!currentUser) return <AppShell><div /></AppShell>;
  const language = currentUser.preferences.language;

  const saveSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextLanguage = form.get('language') as 'fa' | 'en';
    updatePreferences({
      notificationLimit: Number(form.get('notificationLimit')),
      systemSound: form.get('systemSound') as 'soft' | 'classic' | 'off',
      language: nextLanguage
    });
    setSavedMessage(nextLanguage === 'fa' ? 'تنظیمات ذخیره شد و زبان برنامه تغییر کرد.' : 'Settings saved and app language updated.');
  };

  const handleUpgrade = (tier: SubscriptionTier) => {
    changeSubscription(tier);
    setUpgradeOpen(false);
  };

  const deleteAccount = () => {
    if (window.confirm('Delete the current account?')) {
      deleteCurrentAccount();
      router.push('/login');
    }
  };

  return (
    <AppShell>
      <PageHeader title="App Settings" description="Manage notification limits, system sound, language, account deletion, and subscription changes." />
      <div className="grid cols-2">
        <section className="card">
          <h2>User preferences</h2>
          <form className="form" onSubmit={saveSettings} key={language}>
            <div className="form-row"><label className="label">Daily notification limit</label><input className="input" name="notificationLimit" type="number" defaultValue={currentUser.preferences.notificationLimit} min={0} max={100} /></div>
            <div className="form-row"><label className="label">System sound</label><select className="select" name="systemSound" defaultValue={currentUser.preferences.systemSound}><option value="soft">Soft</option><option value="classic">Classic</option><option value="off">Off</option></select></div>
            <div className="form-row"><label className="label">Language</label><select className="select" name="language" defaultValue={language}><option value="fa">Persian / فارسی</option><option value="en">English</option></select></div>
            <button className="btn primary">Save Settings</button>
            {savedMessage ? <span className="badge success">{savedMessage}</span> : null}
          </form>
        </section>
        <section className="card highlight">
          <h2>Current Subscription</h2>
          <p className="page-title" style={{ fontSize: 34 }}>{displaySubscriptionLabel(currentUser.subscription, language)}</p>
          <p className="muted">In Phase 1, the payment path is only visual; in Phase 2, it will connect to a payment gateway.</p>
          <button className="btn primary" onClick={() => setUpgradeOpen(true)}>Upgrade or change subscription</button>
        </section>
      </div>
      <section className="card" style={{ marginTop: 18 }}>
        <h2>Delete Account</h2>
        <p className="muted">In the mock version, this only deletes the current user data from LocalStorage.</p>
        <button className="btn danger" onClick={deleteAccount}>Delete user account</button>
      </section>

      {upgradeOpen ? (
        <Modal title="Choose Subscription" onClose={() => setUpgradeOpen(false)}>
          <div className="grid cols-3">
            <button className="card" onClick={() => handleUpgrade('base')}><h3>{subscriptionLabels.base}</h3><p className="muted">Free, 60 daily streams, 6 playlists</p></button>
            <button className="card" onClick={() => handleUpgrade('silver')}><h3>{subscriptionLabels.silver}</h3><p className="muted">{formatCurrency(pricing.silver)} / month, downloads and profile image</p></button>
            <button className="card highlight" onClick={() => handleUpgrade('gold')}><h3>{subscriptionLabels.gold}</h3><p className="muted">{formatCurrency(pricing.gold)} / month, early access and analytics</p></button>
          </div>
        </Modal>
      ) : null}
    </AppShell>
  );
}
