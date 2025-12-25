import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      <Stack.Screen name="login" options={{ title: "Connexion", headerShown: false }} />
      <Stack.Screen name="forgotPassword" options={{ title: "Mot de passe oublié", headerShown: false, presentation: 'modal' }} />

      <Stack.Screen name="register" options={{ title: "Inscription", headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}
