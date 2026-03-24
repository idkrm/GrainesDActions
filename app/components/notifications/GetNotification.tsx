import * as Notifications from 'expo-notifications';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from "../../firebaseConfig";

export const envoyerNotification = async () => {
    // Attendre que l'utilisateur donne la permission
    const { status } = await Notifications.getPermissionsAsync();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userRef = doc(db, "Users", currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const userData = userSnap.data();
        
        if (userData.notifications_enabled !== true) {
            console.log("Envoi annulé : L'utilisateur a désactivé les notifications dans son profil.");
            return; 
        }
    }

    console.log("Tentative d'envoi de la notification...");

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
    });
}