import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { COLORS } from '@/constants/colors';
import { signOut } from "firebase/auth";
import { auth } from "@/firebaseBD/firebaseConfig"; // adapte le chemin si besoin

export default function ProfileScreen() {
  const router = useRouter();

  const doLogout = async () => {
    try {
      console.log("BEFORE signOut, currentUser =", auth.currentUser?.uid);
      await signOut(auth);
      console.log("AFTER signOut, currentUser =", auth.currentUser?.uid);
      router.replace("/login"); //
    } catch (e) {
      console.log("LOGOUT ERROR =>", e);
      Alert.alert("Erreur", "Impossible de se déconnecter.");
    }
  };

  const handleLogout = () => {
    // ✅ Web: pas de Alert.alert (souvent instable)
    if (Platform.OS === "web") {
      const ok = window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?");
      if (!ok) return;
      void doLogout();
      return;
    }

    Alert.alert(
        "Se déconnecter",
        "Êtes-vous sûr de vouloir vous déconnecter ?",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Se déconnecter", style: "destructive", onPress: () => void doLogout() },
        ]
    );
  };



  const handleDeleteAccount = () => {
    Alert.alert(
      "Attention",
      "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible !",
      [
        { text: "Annuler", style: "cancel" },
        // TODO supprimer le compte de la bd
        { text: "Supprimer", style: "destructive", onPress: () => router.replace('/login') }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

      {/* SECTION 1 : MES INFORMATIONS */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes informations</Text>
          <Link href="../editProfile" asChild><Ionicons name="chevron-forward" size={20} color="#333" /></Link>
        </View>

        <Link href="../editProfile" asChild>
          <Pressable style={styles.infoBox}>
            {/* TODO récupérer les infos du user */}
            <Text style={styles.infoText}>Pseudo : blabla</Text>
            <Text style={styles.infoText}>Adresse mail : blabla@test.fr</Text>
          </Pressable>
        </Link>
      </View>

      {/* SECTION 2 : APPLIS CONNECTÉES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Applications connectées</Text>
        <Text style={styles.descriptionText}>
          Aucune application n'est connectée à ce compte
        </Text>
        <Link href="../appsConnect" asChild>
          <Pressable style={styles.standardButton}>
            <Text style={styles.buttonText}>Connecter des applications</Text>
          </Pressable>
        </Link>
      </View>

      {/* SECTION 3 : BONS D'ACHATS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bons d'achats</Text>
        <Link href="/bonsAchats" asChild>
          <Pressable style={styles.standardButton}>
            <Text style={styles.buttonText}>Voir de mes bons d'achats</Text>
          </Pressable>
        </Link>
      </View>

      {/* SECTION 4 : HISTORIQUE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historique</Text>
        <Link href="/transactionsHistory" asChild>
          <Pressable style={styles.standardButton}>
            <Text style={styles.buttonText}>Voir l'historique de mes échanges</Text>
          </Pressable>
        </Link>
      </View>

      {/* SECTION 5 : ACTIONS (DANGER) */}
      <View style={styles.dangerZone}>
        <Pressable style={styles.dangerButton} onPress={handleLogout}>
          <Text style={styles.dangerText}>Se déconnecter</Text>
        </Pressable>

        <Pressable style={styles.dangerButton} onPress={handleDeleteAccount}>
          <Text style={styles.dangerText}>Supprimer mon compte</Text>
        </Pressable>
      </View>

      {/* Espace pour ne pas être coupé par la navbar */}
      <View style={{ height: 20 }} />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  section: {
    marginBottom: 45,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },

  // INFORMATIONS UTILISATEUR
  infoBox: {
    borderWidth: 1.5,
    borderColor: COLORS.primaryGreen,
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#fff',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 5,
    fontWeight: 500,
  },

  // BOUTONS STANDARD
  standardButton: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingVertical: 12,
    marginLeft: 20,
    marginRight: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  buttonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '500',
  },

  // BOUTONS DANGER (déconnexion, suppression de compte)
  dangerZone: {
    marginTop: 80,
    gap: 15,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: COLORS.softRed,
    borderRadius: 20,
    paddingVertical: 12,
    marginLeft: 50,
    marginRight: 50,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dangerText: {
    color: COLORS.softRed,
    fontSize: 15,
    fontWeight: '500',
  },
});