const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

const settingsSource = readFileSync(join(__dirname, '..', 'app', 'tabs', 'settings.js'), 'utf8');
const scheduleSource = readFileSync(join(__dirname, '..', 'app', 'tabs', '(bottom)', 'schedule.js'), 'utf8');

test('mobile settings expose only functional notification preferences', () => {
  assert.doesNotMatch(settingsSource, /Push Notifications|push_available|push_notifications/);
  assert.doesNotMatch(settingsSource, /label="Email Notifications"/);

  for (const label of [
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
    'sms_notifications',
    'report_updates',
    'schedule_reminders',
    'system',
  ]) {
    assert.match(settingsSource, new RegExp(`${key}: data\\.notifications\\.${key}`));
    assert.match(settingsSource, new RegExp(`${key}: notifications\\.${key}`));
  }
});

test('hidden email preference remains in the settings state and save payload', () => {
  assert.match(settingsSource, /email_notifications: data\.notifications\.email_notifications/);
  assert.match(settingsSource, /email_notifications: notifications\.email_notifications/);
});

test('mobile schedule reminder copy does not expose the hidden email preference', () => {
  assert.doesNotMatch(scheduleSource, /email_notifications|remind you by email/i);
  assert.match(scheduleSource, /Schedule reminders are enabled/);
});
