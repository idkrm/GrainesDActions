import { auth, db } from "@/firebaseBD/firebaseConfig";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { deleteUser, signOut } from "firebase/auth";
import { deleteDoc, doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();

  const [userData, setUserData] = useState({
    pseudo: 'Chargement...',
    email: 'Chargement...'
  });
  const [admin, setAdmin] = useState<boolean>(false);

  // --- RÉCUPÉRATION DES DONNÉES ---
  useEffect(() => {
    const user = auth.currentUser;

    if (user) {
      setUserData(prev => ({ ...prev, email: user.email || '' }));

      const userDocRef = doc(db, "Users", user.uid);

      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({
            pseudo: data.pseudo || 'Éco-citoyen', 
            email: data.email || user.email || ''
          });
          
          if (data?.admin === true) {
            setAdmin(true);
          }
        }
      }, (error) => {
        console.log("Erreur récupération profil:", error);
      });

      return () => unsubscribe();
    }
  }, []);

  // --- ACTIONS (Déconnexion & Suppression) ---
  const doLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login"); 
    } catch (e) {
      Alert.alert("Erreur", "Impossible de se déconnecter.");
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      const ok = window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?");
      if (ok) void doLogout();
      return;
    }
    Alert.alert("Se déconnecter", "Êtes-vous sûr de vouloir vous déconnecter ?", [
        { text: "Annuler", style: "cancel" },
        { text: "Se déconnecter", style: "destructive", onPress: () => void doLogout() },
    ]);
  };

  const handleDeleteAccount = () => {
    const doDelete = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return router.replace("/login");

        await deleteDoc(doc(db, "Users", user.uid));
        await deleteUser(user);
        router.replace("/login");
      } catch (e: any) {
        if (e?.code === "auth/requires-recent-login") {
          Alert.alert("Reconnexion requise", "Pour des raisons de sécurité, reconnecte-toi puis réessaie.");
          router.replace("/login");
          return;
        }
        Alert.alert("Erreur", "Impossible de supprimer le compte. Réessaie.");
      }
    };

    if (Platform.OS === "web") {
      const ok = window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible !");
      if (ok) void doDelete();
      return;
    }
    Alert.alert("Attention", "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible !", [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => void doDelete() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

      {/* EN-TÊTE DU PROFIL (AVATAR) */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{userData.pseudo.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.pseudoTitle}>{userData.pseudo}</Text>
        <Text style={styles.emailSubtitle}>{userData.email}</Text>
      </View>

      {/* SECTION 1 : MES INFORMATIONS */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Général</Text>
        
        {/* Navigation via router.push() au lieu de <Link> */}
        <Pressable style={styles.menuRow} onPress={() => router.push('/editProfile')}>
          <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="person-outline" size={20} color="#65B369" />
          </View>
          <Text style={styles.menuText}>Modifier mon profil</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </Pressable>

        <Pressable style={[styles.menuRow, styles.noBorder]} onPress={() => router.push('/appsConnect')}>
          <View style={[styles.menuIcon, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="link-outline" size={20} color="#4FC3F7" />
          </View>
          <Text style={styles.menuText}>Applications connectées</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </Pressable>
      </View>

      {/* SECTION 2 : MON ACTIVITÉ */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mon activité</Text>
        
        <Pressable style={styles.menuRow} onPress={() => router.push('/bonsAchats')}>
          <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="ticket-outline" size={20} color="#F57C00" />
          </View>
          <Text style={styles.menuText}>Mes bons d'achats</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </Pressable>

        <Pressable style={[styles.menuRow, styles.noBorder]} onPress={() => router.push('/transactionsHistory')}>
          <View style={[styles.menuIcon, { backgroundColor: '#F3E5F5' }]}>
            <Ionicons name="time-outline" size={20} color="#BA68C8" />
          </View>
          <Text style={styles.menuText}>Historique des échanges</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </Pressable>
      </View>

      {/* SECTION 3 : ADMIN */}
      {admin && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Administration</Text>
          
          <Pressable style={styles.menuRow} onPress={() => router.push('/GererDefis')}>
            <View style={[styles.menuIcon, { backgroundColor: '#ECEFF1' }]}>
              <Ionicons name="settings-outline" size={20} color="#607D8B" />
            </View>
            <Text style={styles.menuText}>Gestion des défis</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>

          <Pressable style={[styles.menuRow, styles.noBorder]} onPress={() => router.push('/ValiderDefis')}>
            <View style={[styles.menuIcon, { backgroundColor: '#ECEFF1' }]}>
              <Ionicons name="checkmark-done-outline" size={20} color="#607D8B" />
            </View>
            <Text style={styles.menuText}>Validation des défis</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>
        </View>
      )}

      {/* SECTION 4 : ZONE DE DANGER */}
      <View style={styles.dangerZone}>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#555" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </Pressable>

        <Pressable style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Supprimer mon compte</Text>
        </Pressable>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA', 
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 100,
  },

  // --- EN-TÊTE AVATAR ---
  profileHeader: {
    alignItems: 'center',
    marginBottom: 35,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: "#65B369",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#65B369',
  },
  pseudoTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  emailSubtitle: {
    fontSize: 15,
    color: '#888',
  },

  // --- CARTES DE MENU ---
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 10,
    marginBottom: 5,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },

  // --- ZONE DE DANGER ---
  dangerZone: {
    marginTop: 20,
    alignItems: 'center',
    gap: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 20,
    width: '100%',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  deleteButton: {
    paddingVertical: 10,
  },
  deleteText: {
    color: '#E57373',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});