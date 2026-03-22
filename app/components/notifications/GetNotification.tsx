import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

export const nvoyerNotification = async () => {
    // Attendre que l'utilisateur donne la permission
    const { status } = await Notifications.requestPermissionsAsync();

    if (status !== 'granted') {
        Alert.alert("Les permission des notifications ont été désactivées !");
        return;
    }

    // Infos de la notif
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Un nouveau défi vous attend ! ⏰",
            body: "Contribuez à la planète en participant aux défis 🌱",
            data: { screen: 'index'}
        },
        trigger: { seconds: 500, } as Notifications.NotificationTriggerInput,
    })

}