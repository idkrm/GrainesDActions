import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

export const envoyerNotification = async () => {
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
        trigger: { 
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 60, 
        },
    })

}