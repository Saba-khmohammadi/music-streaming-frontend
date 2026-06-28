import { expect, test, type Page } from '@playwright/test';

const APP_STORAGE_PREFIX = 'phase1-music-en:';

const accounts = {
  listener: { email: 'listener@example.com', password: 'listener123', userId: 'u-listener' },
  silver: { email: 'silver@example.com', password: 'silver123', userId: 'u-silver' },
  gold: { email: 'gold@example.com', password: 'gold123', userId: 'u-gold' },
  artist: { email: 'artist@example.com', password: 'artist123', userId: 'u-artist' },
  support: { email: 'support@example.com', password: 'support123', userId: 'u-support' },
  admin: { email: 'admin@example.com', password: 'admin123', userId: 'u-admin' }
} as const;

async function resetMockStorage(page: Page) {
  await page.goto('/login');
  await page.evaluate((prefix) => {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith(prefix)) window.localStorage.removeItem(key);
    }
  }, APP_STORAGE_PREFIX);
}

async function loginAs(page: Page, account: { email: string; password: string; userId: string }) {
  await page.goto('/login');
  await page.evaluate(
    ({ prefix, userId }) => {
      window.localStorage.setItem(prefix + 'currentUserId', JSON.stringify(userId));
    },
    { prefix: APP_STORAGE_PREFIX, userId: account.userId }
  );

  await page.goto('/home');
  await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });
  await expect(page.locator('.premium-app-layout')).toBeVisible({ timeout: 15_000 });
}

async function logout(page: Page) {
  await page.evaluate((prefix) => {
    window.localStorage.removeItem(prefix + 'currentUserId');
  }, APP_STORAGE_PREFIX);

  await page.goto('/login');
  await expect(page).toHaveURL(/\/login$/);
}

test.beforeEach(async ({ page }) => {
  await resetMockStorage(page);
});

test('01 - invalid login shows an authentication error', async ({ page }) => {
  await page.locator('input[name="email"]').fill('wrong@example.com');
  await page.locator('input[name="password"]').fill('wrong-password');
  await page.getByRole('button', { name: 'Enter the app' }).click({ timeout: 20_000 });

  await expect(page.getByText('Invalid email or password')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test('02 - login always opens Home, even after the user previously visited Support', async ({ page }) => {
  await loginAs(page, accounts.listener);
  await page.goto('/support');
  await expect(page).toHaveURL(/\/support$/);

  await logout(page);
  await loginAs(page, accounts.listener);

  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText('Hello, Listener Base')).toBeVisible();
});

test('03 - listener signup requires privacy acceptance and then creates the account', async ({ page }) => {
  const displayName = `QA Listener ${Date.now()}`;
  const email = `qa-listener-${Date.now()}@example.com`;

  await page.getByRole('button', { name: 'Listener Signup' }).click();
  await page.locator('input[name="displayName"]').fill(displayName);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill('Password123!');
  await page.locator('input[name="confirm"]').fill('Password123!');
  await page.locator('input[name="birthDate"]').fill('2000-01-01');
  await page.locator('select[name="gender"]').selectOption('Prefer not to say');

  await page.getByRole('button', { name: 'Sign up and enter' }).click();
  await expect(page.getByText('You must accept the privacy policy.')).toBeVisible();

  await page.locator('input[name="privacy"]').check();
  await page.getByRole('button', { name: 'Sign up and enter' }).click();

  await expect(page).toHaveURL(/\/home$/);
  await expect(page.locator('h1.page-title').filter({ hasText: displayName })).toBeVisible();
});

test('04 - library search filters public tracks and keeps the selected sort mode', async ({ page }) => {
  await loginAs(page, accounts.gold);
  await page.goto('/library');

  await page.locator('input[placeholder="Track, album, or artist name"]').fill('Cafe Rain');
  await expect(page.locator('.premium-track-card').filter({ hasText: 'Cafe Rain' })).toBeVisible();
  await expect(page.locator('.premium-track-card').filter({ hasText: 'White Line' })).toHaveCount(0);

  await page.locator('select').selectOption('releaseDate');
  await expect(page.locator('select')).toHaveValue('releaseDate');
});

test('05 - user can create, rename, and delete a playlist', async ({ page }) => {
  await loginAs(page, accounts.listener);
  await page.goto('/playlists');

  const title = `QA Playlist ${Date.now()}`;
  const renamedTitle = `${title} Renamed`;

  await page.locator('input[name="title"]').fill(title);
  await page.getByRole('button', { name: 'Create playlist' }).click();
  await expect(page.locator('.premium-playlist-card').filter({ hasText: title })).toBeVisible();

  await page.locator('.premium-playlist-card').filter({ hasText: title }).locator('.rename-btn').click();
  const renameDialog = page.getByRole('dialog');
  await renameDialog.locator('input[name="title"]').fill(renamedTitle);
  await renameDialog.getByRole('button', { name: 'Save Changes' }).click();

  const renamedCard = page.locator('.premium-playlist-card').filter({ hasText: renamedTitle });
  await expect(renamedCard).toBeVisible();
  await renamedCard.locator('.delete-btn').click();
  await expect(page.locator('.premium-playlist-card').filter({ hasText: renamedTitle })).toHaveCount(0);
});

test('06 - user can add a library track to an existing playlist', async ({ page }) => {
  await loginAs(page, accounts.gold);
  await page.goto('/library');

  await page.locator('input[placeholder="Track, album, or artist name"]').fill('White Line');
  const trackCard = page.locator('.premium-track-card').filter({ hasText: 'White Line' });
  await expect(trackCard).toBeVisible();

  await trackCard.locator('button.icon-btn').click();
  await trackCard.getByRole('button', { name: 'Add to playlist' }).click();

  const addDialog = page.getByRole('dialog');
  await addDialog.locator('input[name="playlistIds"][value="playlist-2"]').check({ force: true });
  await addDialog.getByRole('button', { name: 'Save' }).click();

  await page.goto('/playlists');
  await expect(page.locator('.premium-playlist-card').filter({ hasText: 'Favorite Tracks' })).toContainText('White Line');
});

test('07 - listener can upgrade to Gold and save preferences', async ({ page }) => {
  await loginAs(page, accounts.listener);
  await page.goto('/settings');

  await page.getByRole('button', { name: 'Upgrade or change subscription' }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Gold/ }).click();
  await expect(page.locator('section.card.highlight')).toContainText('Gold');

  await page.locator('input[name="notificationLimit"]').fill('35');
  await page.locator('select[name="systemSound"]').selectOption('off');
  await page.locator('select[name="language"]').selectOption('en');
  await page.getByRole('button', { name: 'Save Settings' }).click();

  await expect(page.getByText('Settings saved and app language updated.')).toBeVisible();
});

test('08 - listener creates a support ticket and support replies to it', async ({ page }) => {
  const subject = `QA support flow ${Date.now()}`;
  const message = 'Playback stops after opening the mini player.';
  const reply = 'Support checked this ticket and replied from dashboard.';

  await loginAs(page, accounts.listener);
  await page.goto('/support');
  await page.locator('input[name="subject"]').fill(subject);
  await page.locator('textarea[name="message"]').fill(message);
  await page.getByRole('button', { name: 'Send message to support' }).click();

  await expect(page.getByText(subject).first()).toBeVisible();
  await expect(page.getByText(message)).toBeVisible();

  await logout(page);
  await loginAs(page, accounts.support);
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Support tickets' }).click();
  await expect(page.getByText(subject).first()).toBeVisible();

  await page.locator('textarea[placeholder="Type your reply here..."]').fill(reply);
  await page.getByRole('button', { name: 'Send reply' }).click();
  await expect(page.getByText(reply)).toBeVisible();

  await logout(page);
  await loginAs(page, accounts.listener);
  await page.goto('/support');
  await expect(page.getByText(reply)).toBeVisible();
});

test('09 - admin can update Silver and Gold subscription prices', async ({ page }) => {
  await loginAs(page, accounts.admin);
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Subscriptions and reports' }).click();

  await page.locator('input[name="silver"]').fill('150000');
  await page.locator('input[name="gold"]').fill('275000');
  await page.getByRole('button', { name: 'Update prices' }).click();

  await expect(page.getByText('Prices were updated in the system.')).toBeVisible();
  await expect(page.locator('input[name="silver"]')).toHaveValue('150000');
  await expect(page.locator('input[name="gold"]')).toHaveValue('275000');
});

test('10 - artist publish creates Early Access that is hidden from Base users and visible to Gold users', async ({ page }) => {
  const trackTitle = `QA Early Single ${Date.now()}`;

  await loginAs(page, accounts.artist);
  await page.goto('/artist/manage');
  await page.locator('input[name="title"]').fill(trackTitle);
  await page.locator('input[name="genre"]').fill('QA Pop');
  await page.locator('input[name="releaseDate"]').fill('2026-06-28');
  await page.locator('textarea[name="lyrics"]').fill('Generated for Early Access flow testing.');
  await page.getByRole('button', { name: 'Publish' }).click();

  const artistTrack = page.locator('.premium-track-card').filter({ hasText: trackTitle });
  await expect(artistTrack).toBeVisible();
  await expect(artistTrack).toContainText('Early');

  await logout(page);
  await loginAs(page, accounts.listener);
  await page.goto('/library');
  await page.locator('input[placeholder="Track, album, or artist name"]').fill(trackTitle);
  await expect(page.locator('.premium-track-card').filter({ hasText: trackTitle })).toHaveCount(0);

  await page.goto('/early-access');
  await expect(page.getByText('Gold membership required')).toBeVisible();

  await logout(page);
  await loginAs(page, accounts.gold);
  await page.goto('/early-access');
  await expect(page.locator('.premium-track-card').filter({ hasText: trackTitle })).toBeVisible();
});
