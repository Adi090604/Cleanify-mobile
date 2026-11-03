const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const drawerPath = path.join(projectRoot, 'app', 'tabs', '_layout.js');
const drawerSource = fs.readFileSync(drawerPath, 'utf8');

test('drawer header renders the compact Cleanify brand without resident details', () => {
  assert.match(drawerSource, /require\('\.\.\/\.\.\/assets\/cleanify-logo\.png'\)/);
  assert.match(drawerSource, /resizeMode="contain"/);
  assert.match(drawerSource, /drawerLogo: \{ width: 64, height: 54 \}/);
  assert.match(drawerSource, /<Text style=\{styles\.drawerBrand\}>Cleanify<\/Text>/);
  assert.match(drawerSource, /drawerHeader: \{ height: 104,[^\n]*paddingVertical: 8/);
  assert.match(drawerSource, /drawerBrand: \{ marginTop: 5, color: '#18211c', fontSize: 18, lineHeight: 22, fontWeight: '700', textAlign: 'center' \}/);
  assert.doesNotMatch(drawerSource, /drawerLogo: \{[^\n]*(?:aspectRatio|flex|width: ['"]100%['"]|height: ['"]100%['"])/);
  assert.doesNotMatch(drawerSource, /profile_photo_url|user\.name|user\.email|drawerPhoto|avatarText|userName|userEmail/);
  assert.doesNotMatch(drawerSource, /api\.get\('\/me'\)/);
  assert.ok(fs.existsSync(path.join(projectRoot, 'assets', 'cleanify-logo.png')));
});

test('drawer navigation and notification badge remain available', () => {
  for (const label of ['Home', 'Garbage Schedule', 'Notifications', 'Community Reports', 'Truck Tracker', 'Profile', 'Settings', 'Logout']) {
    assert.match(drawerSource, new RegExp(`['\"]${label}['\"]`));
  }

  assert.match(drawerSource, /unreadCount > 0/);
  assert.match(drawerSource, /notificationBadge/);
});
