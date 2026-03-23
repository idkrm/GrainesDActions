import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

export const envoyerNotification = async () => {
    // Attendre que l'utilisateur donne la permission
    const { status } = await Notifications.getPermissionsAsync();

    if (status !== 'granted') {
        Alert.alert("Les permission des notifications ont été désactivées !");
        return;
    }

    console.log("Tentative d'envoi...")

    // Infos de la notif
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Vous n'avez pas de défis en cours ! ⏰",
            body: "Contribuez à la planète en participant aux défis 🌱",
            data: { screen: 'index'}
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 60,
            repeats: true
        }
    })

}