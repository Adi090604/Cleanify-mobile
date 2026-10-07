import { Stack } from 'expo-router';

import { CleanifyAlertProvider } from '../src/components/CleanifyAlert';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  return (
    <CleanifyAlertProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </CleanifyAlertProvider>
  );
}
