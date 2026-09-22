# Cleanify Mobile

## Overview

Cleanify Mobile is the Expo and React Native client for the Cleanify Laravel application. It gives authenticated community members mobile access to collection schedules, community reports, notifications, truck tracking, profile information, and account settings.

Laravel remains the source of truth for authentication, reports, schedules, notifications, truck data, settings, profile data, authorization, and validation. This repository does not contain a separate mobile backend.

## Tech Stack

- Expo SDK `~57.0.22`
- React Native `0.86.3`
- React `19.2.3`
- Expo Router `~57.0.21`
- JavaScript
- Axios `^1.20.0`
- Expo SecureStore `~57.0.4`
- React Native WebView `13.16.1`
- Leaflet `1.9.4` loaded inside WebViews
- OpenStreetMap tiles
- Expo Location `~57.0.17`
- Expo Image Picker `~57.0.17`
- Font Awesome icons through `@expo/vector-icons`

See `package.json` for the complete dependency list.

## Requirements

- Node.js and npm
- Expo Go or an Android emulator/device
- A running Cleanify Laravel backend
- For LAN development, a phone and development PC that can reach each other on the same network

The repository does not specify an exact Node.js version.

## Installation

```powershell
cd cleanify-mobile
npm install
```

Use Expo's installer when adding an Expo module so it selects a version compatible with the installed SDK:

```powershell
npx expo install <package>
```

## Running the App

Start the Expo development server:

```powershell
npx expo start
```

Clear Metro's cache when diagnosing stale bundles:

```powershell
npx expo start --clear
```

LAN mode is the normal development setup. If the phone cannot reach Metro over the local network, Expo tunnel mode is also available:

```powershell
npx expo start --tunnel
```

Expo tunnel mode exposes the Expo development connection only. It does not expose the Laravel API; the phone still needs a reachable backend URL.

## Laravel API Connection

The shared Axios client reads `EXPO_PUBLIC_API_URL`. Create a local `.env.local` file and use a Laravel address the phone can reach:

```text
EXPO_PUBLIC_API_URL=http://<YOUR-PC-IP>:8000/api/v1
```

When the development PC's LAN address changes, update this one value and fully reload the app in Expo Go. `.env.local` is ignored by Git and should not contain secrets; `EXPO_PUBLIC_` values are embedded in the client application.

On a physical phone, `127.0.0.1` and `localhost` refer to the phone, not the development PC. Start Laravel so it accepts connections from the local network:

```powershell
php artisan serve --host=0.0.0.0 --port=8000
```

The phone and PC must normally be connected to the same reachable network, and the operating-system firewall must allow the development connection to port `8000`.

## Project Structure

The active mobile route structure is:

```text
app/
  _layout.js                    Root stack
  index.js                      Landing and saved-session restoration
  login.js                      Login
  signup.js                     Account creation
  forgot-password.js            Password-reset email request
  tabs/
    _layout.js                  Authenticated drawer layout
    settings.js                 Drawer-only Settings screen
    (bottom)/
      _layout.js                Bottom tab layout
      index.js                  Home
      schedule.js               Garbage Schedule
      report.js                 Community Reports
      tracker.js                Truck Tracker
      notifications.js          Notifications
      profile.js                Drawer-accessible Profile route
src/
  api/
    client.js                   Axios client and SecureStore token helpers
  notifications/
    NotificationBadgeContext.js Shared unread-count state
```

`app/tabs/_layout.js` wraps the authenticated area with the drawer. `app/tabs/(bottom)/_layout.js` provides the bottom navigation inside that drawer. Expo Router route groups such as `(bottom)` organize layouts without adding that group name to public route URLs.

## Authentication

Cleanify Mobile uses Laravel Sanctum bearer tokens.

- Login obtains a mobile API token and stores it in Expo SecureStore.
- Create Account registers through Laravel and saves the returned token.
- The landing screen restores a saved session by validating it with `/api/v1/me`.
- Authenticated Axios requests attach the stored bearer token.
- Logout calls Laravel and removes the local token even if the server request fails.
- Unauthorized API responses return the user to Login on authenticated screens.

Forgot Password submits the email address to Laravel's mobile API entry point. Laravel sends its existing reset notification, and the email opens the existing Laravel web reset page. Password entry and reset completion are not implemented as a native mobile screen; after resetting in the browser, the user returns to the app and signs in with the new password.

## Bottom Navigation

The authenticated bottom tabs are:

- Home
- Schedule
- Report
- Tracker
- Notifications

Profile has a route in the bottom route group but is hidden from the tab bar and remains accessible from the drawer.

## Drawer Navigation

The authenticated drawer contains:

- Home
- Garbage Schedule
- Notifications
- Community Reports
- Truck Tracker
- Profile
- Settings
- Logout

The drawer profile area uses the current Laravel profile photo when available and falls back to the user's initial.

## Notifications

The Notifications screen displays real Laravel database notifications with title, message, category, read state, and relative creation time supplied by the API. It supports:

- All and unread filters
- Backend-provided category filters
- Mark as read
- Mark all as read
- Dismiss
- Pull to refresh and screen-focus refresh
- Pagination

The Laravel unread count drives the red badge on both the Notifications bottom-tab icon and drawer item through `NotificationBadgeContext`. The shared count also refreshes when the app returns to the foreground. The app does not currently implement device push-notification reception.

## Community Reports

The Community Reports screen uses the existing Laravel report API to:

- Submit a description
- Include optional location or barangay text
- Submit latitude and longitude selected from the map
- Upload an optional photo as multipart form data
- Display the real community report feed
- Display report status and existing likes/comments counts
- Paginate the feed

The report map runs Leaflet in a React Native WebView with OpenStreetMap tiles and attribution. Users can tap the map to place the report marker or drag the existing marker. Profile's **My Posts** section loads the authenticated user's reports from Laravel.

Laravel determines report validation and public-feed visibility. The mobile client does not run its own report-retention timer.

## Use My Location

The report form can place its existing marker using the phone's current position:

- Requests foreground location permission only
- Performs one current-position lookup after the user taps **Use My Location**
- Uses the result to update the same latitude and longitude state used by manual map selection
- Moves the existing Leaflet marker and centers the map without reloading the WebView
- Preserves a previously selected position if permission or location retrieval fails

There is no location watcher, background permission, background task, continuous monitoring, or reverse geocoding.

## Schedule

The Garbage Schedule screen loads real schedule data calculated by Laravel. It displays:

- The authenticated user's service area
- The next collection date, time, area, truck, and status
- Later upcoming pickups
- Loading, error, no-schedule, and no-additional-pickups states
- Pull-to-refresh and focus refresh

The first pickup used for **Next Collection** is excluded from **Upcoming Pickups** by matching its `schedule_id` and `collection_at`. Laravel remains responsible for recurrence calculation, active-schedule filtering, and service-area validity.

## Truck Tracker

The Truck Tracker loads real truck and service-zone data from Laravel. Its Leaflet/OpenStreetMap WebView supports:

- Valid truck markers and selected-marker styling
- Marker selection with a compact popup
- Real truck code, formatted status, driver, route, and last-update information
- Search and status filtering
- Service-zone circle highlighting
- **Focus**, which centers the selected truck at zoom level `15` and opens its popup
- **Route**, which requests and draws route history only when selected
- A normal-marker fallback if optional clustering is unavailable
- A retry state with surfaced WebView/Leaflet errors
- Coordinate validation and safe handling of trucks without a location
- Refresh on focus, manual refresh, and polling every 30 seconds while the screen is focused

The tracker does not generate fake truck positions and does not display ETA or speed.

## Profile

Profile loads real user, account, and report data from Laravel. It includes:

- Name, email, phone, and service area
- Profile photo with initial fallback
- Add, change, and remove profile photo actions
- **My Posts** with report status, images, and likes/comments counts
- An **Edit Profile** action that opens Settings
- Pull to refresh and logout

## Settings

Settings uses backend-provided values and validation for:

- Account email
- Phone number
- Active service-area selection
- Password change using the current password, new password, and confirmation
- Email, SMS, and push preference values
- Report update, schedule reminder, community post, and truck tracking category preferences

The push setting is a persisted preference; it does not mean this mobile client currently receives device push notifications.

## Network Notes and Troubleshooting

- If the app stays loading after switching Wi-Fi, confirm whether the PC's LAN address changed.
- Keep the shared API base URL and the Login endpoint pointed at the same reachable Laravel host.
- Ensure Laravel listens on `0.0.0.0:8000` rather than only the loopback interface.
- Windows Firewall or network isolation can block port `8000`.
- Expo's Metro connection and the Laravel API are separate connections. Fixing one does not automatically expose the other.
- Expo commonly serves Metro on port `8081`; this project's Laravel development command uses port `8000`.
- Run `npx expo start --clear` when a stale Metro cache is suspected.
- Leaflet maps also require internet access to load their HTTPS assets and OpenStreetMap tiles.

## Useful Commands

```powershell
npm install
npx expo start
npx expo start --clear
npx expo start --tunnel
npx expo install <package>
npx expo install --check
npx expo-doctor@latest
```

## Testing and Validation

Useful local validation includes:

- `npx expo install --check` for Expo dependency compatibility
- `npx expo-doctor@latest` for Expo project diagnostics
- `npx expo export --platform android --output-dir dist` to verify Android bundling
- Physical-device smoke tests for navigation, permissions, photo selection, maps, and API connectivity
- Backend API and Laravel tests in the separate Laravel project

Physical-device results should be reported only after testing on an actual device.

## Security Notes

- Never commit authentication tokens, API keys, passwords, mail credentials, database credentials, or other secrets.
- Authentication tokens are stored with Expo SecureStore rather than application source code.
- The mobile app should contain only a reachable API base address, never Laravel application secrets.
- Laravel remains responsible for authorization, validation, password-reset tokens, and business rules.
