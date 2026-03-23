import { Stack } from 'expo-router';
import { LogBox } from 'react-native';

LogBox.ignoreAllLogs(true);
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(routes)" options={{ headerShown: false }} />
    </Stack>
  );
}
