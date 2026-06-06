import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from "react";
export const RediNotification = () => {
    const router = useRouter();

    useEffect(() => {
        // Redirection lorsque l'utilisateur clique sur la notification
        const click = Notifications.addNotificationResponseReceivedListener(response => {
            const screen = response?.notification?.request?.content?.data?.screen;

            if(screen === "index") {
                router.push("/(tabs)/challenge")
            }
        })

        return () => click.remove();
    })

    return null;
}
 