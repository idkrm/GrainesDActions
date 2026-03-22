import * as Notifications from 'expo-notifications';
import { useEffect } from "react";
import { router, useRouter } from 'expo-router';
export const RediNotification = () => {
    const router = useRouter();

    useEffect(() => {
        // Redirection lorsque l'utilisateur clique sur la notification
        const click = Notifications.addNotificationResponseReceivedListener(response => {
            const { screen } = response.notification.request.content.data;

            if(screen === "index") {
                router.push("/(tabs)/challenge")
            }
        })

        return () => click.remove();
    })

    return null;
}
 