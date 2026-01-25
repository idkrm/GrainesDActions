import { Stack } from 'expo-router';

export default function RoutesLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)/login" options={{ title: "Connexion", headerShown: false }} />
            <Stack.Screen name="(auth)/forgotPassword" options={{ title: "Mot de passe oublié", headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="(auth)/register" options={{ title: "Inscription", headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="history" options={{ headerShown: false }} />
        </Stack>
    );
}