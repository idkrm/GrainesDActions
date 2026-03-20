import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Affiche la notif
    shouldPlaySound: false, 
    shouldSetBadge: true, // Affiche l'icône au dessus de l'app
    shouldShowBanner: true, // Affiche la notif en haut de l'écran
    shouldShowList: false, 
  }),
});

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(routes)" options={{ headerShown: false }} />
    </Stack>
  );
}
