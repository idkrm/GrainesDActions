import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from "../../firebaseConfig";

export const envoyerNotification = async () => {
    // Attendre que l'utilisateur donne la permission
    const { status } = await Notifications.getPermissionsAsync();

    if (status !== 'granted') {
        Alert.alert("Les permission des notifications ont été désactivées !");
        return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userRef = doc(db, "Users", currentUser.uid);
    await updateDoc(userRef, { notifications_enabled: true });

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