const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

const reportSource = readFileSync(join(__dirname, '..', 'app', 'tabs', '(bottom)', 'report.js'), 'utf8');
const settingsSource = readFileSync(join(__dirname, '..', 'app', 'tabs', 'settings.js'), 'utf8');

test('community reports require selected coordinates and send both values', () => {
  assert.match(reportSource, /Report Location Required/);
  assert.match(reportSource, /Please select the report location before submitting\./);
  assert.match(reportSource, /form\.append\('latitude', coordinate\.latitude\.toFixed\(8\)\)/);
  assert.match(reportSource, /form\.append\('longitude', coordinate\.longitude\.toFixed\(8\)\)/);
  assert.match(reportSource, /Report Location \*/);
  assert.match(reportSource, /Tap or drag the marker|tap and drag the marker/i);
});

test('service area requests require selected coordinates and send both values', () => {
  assert.match(settingsSource, /errors\.latitude = 'Please select the requested service location\.'/);
  assert.match(settingsSource, /latitude: coordinate\?\.latitude \?\? null/);
  assert.match(settingsSource, /longitude: coordinate\?\.longitude \?\? null/);
  assert.match(settingsSource, /Requested Service Location \*/);
  assert.match(settingsSource, /Choose Location on Map/);
});

test('permission denial keeps manual map selection available', () => {
  assert.match(reportSource, /Location access was denied\. You can select the report location manually on the map\./);
  assert.match(settingsSource, /Location access was denied\. You can select the requested service location manually on the map\./);
  assert.match(settingsSource, /setLocationMapVisible\(true\)/);
});

test('mobile coordinate validators reject invalid ranges and the zero placeholder', () => {
  for (const source of [reportSource, settingsSource]) {
    assert.match(source, /latitude >= -90/);
    assert.match(source, /longitude >= -180/);
    assert.match(source, /!\(latitude === 0 && longitude === 0\)/);
  }
});
