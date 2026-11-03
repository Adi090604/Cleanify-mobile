const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

const settingsSource = readFileSync(join(__dirname, '..', 'app', 'tabs', 'settings.js'), 'utf8');

test('mobile settings expose only functional notification preferences', () => {
  assert.doesNotMatch(settingsSource, /Push Notifications|push_available|push_notifications/);

  for (const label of [
    'Email Notifications',
    'SMS Notifications',
    'Report Updates',
    'Schedule Reminders',
    'System Notifications',
  ]) {
    assert.match(settingsSource, new RegExp(`label="${label}"`));
  }
});

test('mobile settings continue loading and saving each functional preference', () => {
  for (const key of [
    'email_notifications',
    'sms_notifications',
    'report_updates',
    'schedule_reminders',
    'system',
  ]) {
    assert.match(settingsSource, new RegExp(`${key}: data\\.notifications\\.${key}`));
    assert.match(settingsSource, new RegExp(`${key}: notifications\\.${key}`));
  }
});
