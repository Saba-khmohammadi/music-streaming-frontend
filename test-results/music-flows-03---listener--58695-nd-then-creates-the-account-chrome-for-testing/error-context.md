# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: music-flows.spec.ts >> 03 - listener signup requires privacy acceptance and then creates the account
- Location: tests\e2e\music-flows.spec.ts:71:5

# Error details

```
TimeoutError: locator.click: Timeout 20000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Listener Signup' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - complementary [ref=e4]:
        - generic [ref=e5]:
          - heading "Music Streaming Service" [level=1] [ref=e7]:
            - text: Music
            - text: Streaming
            - text: Service
          - generic [ref=e8]:
            - generic [ref=e9]:
              - img "Arash Band" [ref=e10]
              - img "Nila Wave" [ref=e11]
              - img "Sepehr Off" [ref=e12]
            - generic [ref=e13]:
              - strong [ref=e14]: Join the movement
              - generic [ref=e15]: Connect with top artists & listeners worldwide.
      - generic [ref=e16]:
        - generic [ref=e17]:
          - button "" [ref=e18] [cursor=pointer]:
            - generic [ref=e19]: 
          - button "" [ref=e20] [cursor=pointer]:
            - generic [ref=e21]: 
          - button "" [ref=e22] [cursor=pointer]:
            - generic [ref=e23]: 
        - generic [ref=e24]:
          - generic [ref=e25]:
            - generic [ref=e26]: Email
            - textbox [ref=e27]: gold@example.com
          - generic [ref=e28]:
            - generic [ref=e29]: Password
            - textbox [ref=e30]: gold123
          - button "Enter the app" [ref=e31] [cursor=pointer]
          - button "Forgot password" [ref=e32] [cursor=pointer]
          - generic [ref=e33]:
            - strong [ref=e34]:
              - generic [ref=e35]: 
              - text: Quick Auto-Fill Login
            - generic [ref=e36]:
              - button " Admin" [ref=e37] [cursor=pointer]:
                - generic [ref=e38]: 
                - strong [ref=e39]: Admin
              - button " Support" [ref=e40] [cursor=pointer]:
                - generic [ref=e41]: 
                - strong [ref=e42]: Support
              - button " Artist" [ref=e43] [cursor=pointer]:
                - generic [ref=e44]: 
                - strong [ref=e45]: Artist
  - alert [ref=e46]
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test';
  2   | 
  3   | const APP_STORAGE_PREFIX = 'phase1-music-en:';
  4   | 
  5   | const accounts = {
  6   |   listener: { email: 'listener@example.com', password: 'listener123', userId: 'u-listener' },
  7   |   silver: { email: 'silver@example.com', password: 'silver123', userId: 'u-silver' },
  8   |   gold: { email: 'gold@example.com', password: 'gold123', userId: 'u-gold' },
  9   |   artist: { email: 'artist@example.com', password: 'artist123', userId: 'u-artist' },
  10  |   support: { email: 'support@example.com', password: 'support123', userId: 'u-support' },
  11  |   admin: { email: 'admin@example.com', password: 'admin123', userId: 'u-admin' }
  12  | } as const;
  13  | 
  14  | async function resetMockStorage(page: Page) {
  15  |   await page.goto('/login');
  16  |   await page.evaluate((prefix) => {
  17  |     for (const key of Object.keys(window.localStorage)) {
  18  |       if (key.startsWith(prefix)) window.localStorage.removeItem(key);
  19  |     }
  20  |   }, APP_STORAGE_PREFIX);
  21  | }
  22  | 
  23  | async function loginAs(page: Page, account: { email: string; password: string; userId: string }) {
  24  |   await page.goto('/login');
  25  |   await page.evaluate(
  26  |     ({ prefix, userId }) => {
  27  |       window.localStorage.setItem(prefix + 'currentUserId', JSON.stringify(userId));
  28  |     },
  29  |     { prefix: APP_STORAGE_PREFIX, userId: account.userId }
  30  |   );
  31  | 
  32  |   await page.goto('/home');
  33  |   await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });
  34  |   await expect(page.locator('.premium-app-layout')).toBeVisible({ timeout: 15_000 });
  35  | }
  36  | 
  37  | async function logout(page: Page) {
  38  |   await page.evaluate((prefix) => {
  39  |     window.localStorage.removeItem(prefix + 'currentUserId');
  40  |   }, APP_STORAGE_PREFIX);
  41  | 
  42  |   await page.goto('/login');
  43  |   await expect(page).toHaveURL(/\/login$/);
  44  | }
  45  | 
  46  | test.beforeEach(async ({ page }) => {
  47  |   await resetMockStorage(page);
  48  | });
  49  | 
  50  | test('01 - invalid login shows an authentication error', async ({ page }) => {
  51  |   await page.locator('input[name="email"]').fill('wrong@example.com');
  52  |   await page.locator('input[name="password"]').fill('wrong-password');
  53  |   await page.getByRole('button', { name: 'Enter the app' }).click({ timeout: 20_000 });
  54  | 
  55  |   await expect(page.getByText('Invalid email or password')).toBeVisible();
  56  |   await expect(page).toHaveURL(/\/login$/);
  57  | });
  58  | 
  59  | test('02 - login always opens Home, even after the user previously visited Support', async ({ page }) => {
  60  |   await loginAs(page, accounts.listener);
  61  |   await page.goto('/support');
  62  |   await expect(page).toHaveURL(/\/support$/);
  63  | 
  64  |   await logout(page);
  65  |   await loginAs(page, accounts.listener);
  66  | 
  67  |   await expect(page).toHaveURL(/\/home$/);
  68  |   await expect(page.getByText('Hello, Listener Base')).toBeVisible();
  69  | });
  70  | 
  71  | test('03 - listener signup requires privacy acceptance and then creates the account', async ({ page }) => {
  72  |   const displayName = `QA Listener ${Date.now()}`;
  73  |   const email = `qa-listener-${Date.now()}@example.com`;
  74  | 
> 75  |   await page.getByRole('button', { name: 'Listener Signup' }).click();
      |                                                               ^ TimeoutError: locator.click: Timeout 20000ms exceeded.
  76  |   await page.locator('input[name="displayName"]').fill(displayName);
  77  |   await page.locator('input[name="email"]').fill(email);
  78  |   await page.locator('input[name="password"]').fill('Password123!');
  79  |   await page.locator('input[name="confirm"]').fill('Password123!');
  80  |   await page.locator('input[name="birthDate"]').fill('2000-01-01');
  81  |   await page.locator('select[name="gender"]').selectOption('Prefer not to say');
  82  | 
  83  |   await page.getByRole('button', { name: 'Sign up and enter' }).click();
  84  |   await expect(page.getByText('You must accept the privacy policy.')).toBeVisible();
  85  | 
  86  |   await page.locator('input[name="privacy"]').check();
  87  |   await page.getByRole('button', { name: 'Sign up and enter' }).click();
  88  | 
  89  |   await expect(page).toHaveURL(/\/home$/);
  90  |   await expect(page.locator('h1.page-title').filter({ hasText: displayName })).toBeVisible();
  91  | });
  92  | 
  93  | test('04 - library search filters public tracks and keeps the selected sort mode', async ({ page }) => {
  94  |   await loginAs(page, accounts.gold);
  95  |   await page.goto('/library');
  96  | 
  97  |   await page.locator('input[placeholder="Track, album, or artist name"]').fill('Cafe Rain');
  98  |   await expect(page.locator('.premium-track-card').filter({ hasText: 'Cafe Rain' })).toBeVisible();
  99  |   await expect(page.locator('.premium-track-card').filter({ hasText: 'White Line' })).toHaveCount(0);
  100 | 
  101 |   await page.locator('select').selectOption('releaseDate');
  102 |   await expect(page.locator('select')).toHaveValue('releaseDate');
  103 | });
  104 | 
  105 | test('05 - user can create, rename, and delete a playlist', async ({ page }) => {
  106 |   await loginAs(page, accounts.listener);
  107 |   await page.goto('/playlists');
  108 | 
  109 |   const title = `QA Playlist ${Date.now()}`;
  110 |   const renamedTitle = `${title} Renamed`;
  111 | 
  112 |   await page.locator('input[name="title"]').fill(title);
  113 |   await page.getByRole('button', { name: 'Create playlist' }).click();
  114 |   await expect(page.locator('.premium-playlist-card').filter({ hasText: title })).toBeVisible();
  115 | 
  116 |   await page.locator('.premium-playlist-card').filter({ hasText: title }).locator('.rename-btn').click();
  117 |   const renameDialog = page.getByRole('dialog');
  118 |   await renameDialog.locator('input[name="title"]').fill(renamedTitle);
  119 |   await renameDialog.getByRole('button', { name: 'Save Changes' }).click();
  120 | 
  121 |   const renamedCard = page.locator('.premium-playlist-card').filter({ hasText: renamedTitle });
  122 |   await expect(renamedCard).toBeVisible();
  123 |   await renamedCard.locator('.delete-btn').click();
  124 |   await expect(page.locator('.premium-playlist-card').filter({ hasText: renamedTitle })).toHaveCount(0);
  125 | });
  126 | 
  127 | test('06 - user can add a library track to an existing playlist', async ({ page }) => {
  128 |   await loginAs(page, accounts.gold);
  129 |   await page.goto('/library');
  130 | 
  131 |   await page.locator('input[placeholder="Track, album, or artist name"]').fill('White Line');
  132 |   const trackCard = page.locator('.premium-track-card').filter({ hasText: 'White Line' });
  133 |   await expect(trackCard).toBeVisible();
  134 | 
  135 |   await trackCard.locator('button.icon-btn').click();
  136 |   await trackCard.getByRole('button', { name: 'Add to playlist' }).click();
  137 | 
  138 |   const addDialog = page.getByRole('dialog');
  139 |   await addDialog.locator('input[name="playlistIds"][value="playlist-2"]').check({ force: true });
  140 |   await addDialog.getByRole('button', { name: 'Save' }).click();
  141 | 
  142 |   await page.goto('/playlists');
  143 |   await expect(page.locator('.premium-playlist-card').filter({ hasText: 'Favorite Tracks' })).toContainText('White Line');
  144 | });
  145 | 
  146 | test('07 - listener can upgrade to Gold and save preferences', async ({ page }) => {
  147 |   await loginAs(page, accounts.listener);
  148 |   await page.goto('/settings');
  149 | 
  150 |   await page.getByRole('button', { name: 'Upgrade or change subscription' }).click();
  151 |   await page.getByRole('dialog').getByRole('button', { name: /Gold/ }).click();
  152 |   await expect(page.locator('section.card.highlight')).toContainText('Gold');
  153 | 
  154 |   await page.locator('input[name="notificationLimit"]').fill('35');
  155 |   await page.locator('select[name="systemSound"]').selectOption('off');
  156 |   await page.locator('select[name="language"]').selectOption('en');
  157 |   await page.getByRole('button', { name: 'Save Settings' }).click();
  158 | 
  159 |   await expect(page.getByText('Settings saved and app language updated.')).toBeVisible();
  160 | });
  161 | 
  162 | test('08 - listener creates a support ticket and support replies to it', async ({ page }) => {
  163 |   const subject = `QA support flow ${Date.now()}`;
  164 |   const message = 'Playback stops after opening the mini player.';
  165 |   const reply = 'Support checked this ticket and replied from dashboard.';
  166 | 
  167 |   await loginAs(page, accounts.listener);
  168 |   await page.goto('/support');
  169 |   await page.locator('input[name="subject"]').fill(subject);
  170 |   await page.locator('textarea[name="message"]').fill(message);
  171 |   await page.getByRole('button', { name: 'Send message to support' }).click();
  172 | 
  173 |   await expect(page.getByText(subject).first()).toBeVisible();
  174 |   await expect(page.getByText(message)).toBeVisible();
  175 | 
```