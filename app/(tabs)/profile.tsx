import { COLORS } from '@/constants/colors';
import { auth, db } from "@/firebaseBD/firebaseConfig";
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { deleteUser, signOut } from "firebase/auth";
import { deleteDoc, doc, getDoc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();

  // --- STOCKER LES INFOS ---
  const [userData, setUserData] = useState({
    pseudo: 'Chargement...',
    email: 'Chargement...'
  });

  // --- RÉCUPÉRATION DES DONNÉES ---
  useEffect(() => {
    const user = auth.currentUser;

    if (user) {
      setUserData(prev => ({ ...prev, email: user.email || '' }));

      // Ref au document sur Firestore
      const userDocRef = doc(db, "Users", user.uid);

      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({
            pseudo: data.pseudo || 'Chargement...', 
            email: data.email || user.email || ''
          });
        }
      }, (error) => {
        console.log("Erreur récupération profil:", error);
      });

      return () => unsubscribe();
    }
  }, []);

  // --- VÉRIFICATION UTILISATEUR ADMIN ---
  const [admin, setAdmin] = useState<boolean>(false);
  
    useEffect (() => {
        const verifAdmin = async () => {
        const userCurrent = auth.currentUser; // Utilisateur connecté
            if(userCurrent) { // Si l'utilisateur est connecté alors ...
                try {
                    const docUser = doc(db, "Users", userCurrent.uid)
                    const docSnap = await getDoc(docUser)
                    const docData = docSnap.data()

                    if(docData?.admin == true) {
                        setAdmin(true);
                    }
                } catch(error){
                    console.error("Erreur Firebase: ", error)
                }
                
            }
        };

        verifAdmin();

    }, []);

  const doLogout = async () => {
    try {
      console.log("BEFORE signOut, currentUser =", auth.currentUser?.uid);
      await signOut(auth); //
      console.log("AFTER signOut, currentUser =", auth.currentUser?.uid);
      router.replace("/login"); 
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
    const doDelete = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          Alert.alert("Erreur", "Aucun utilisateur connecté.");
          router.replace("/login");
          return;
        }

        const uid = user.uid;

        // 1) Supprimer le document Firestore
        await deleteDoc(doc(db, "Users", uid)); //

        // 2) Supprimer le compte Auth
        await deleteUser(user); //

        // 3) Redirection
        router.replace("/login");
      } catch (e: any) {
        console.log("DELETE ACCOUNT ERROR =>", e?.code, e?.message);

        // Cas fréquent : Firebase exige une reconnexion récente
        if (e?.code === "auth/requires-recent-login") {
          Alert.alert(
              "Reconnexion requise",
              "Pour des raisons de sécurité, reconnecte-toi puis réessaie de supprimer ton compte."
          );
          // Option : rediriger vers login pour se reconnecter
          router.replace("/login");
          return;
        }

        Alert.alert("Erreur", "Impossible de supprimer le compte. Réessaie.");
      }
    };

    // ✅ Sur Web, Alert.alert peut être instable → confirm
    if (Platform.OS === "web") {
      const ok = window.confirm(
          "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible !"
      );
      if (ok) void doDelete();
      return;
    }

    Alert.alert(
        "Attention",
        "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible !",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Supprimer", style: "destructive", onPress: () => void doDelete() },
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
            {/* ✅ AFFICHAGE DES INFOS RÉCUPÉRÉES */}
            <Text style={styles.infoText}>Pseudo : {userData.pseudo}</Text>
            <Text style={styles.infoText}>Adresse mail : {userData.email}</Text>
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

      {/* SECTION BIS : ADMIN */}
      <View>
          {admin && (
              <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={styles.sectionTitle}>Administrateur</Text>
              <Pressable style={styles.button}
                  onPress={() => console.log("Accès Autorisé !")}>
                  <Text style={styles.text}>Gérer les défis</Text>
              </Pressable>
              </View>
          )}
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
    fontWeight: '500', // Correction : '500' en string ou number, mais 500 number marche sur RN récent
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