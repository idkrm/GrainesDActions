import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
} from 'react-native';
import EditModal from '../../components/profile/EditProfileModal';

// IMPORTS FIREBASE
import { onAuthStateChanged, updateEmail, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from "../../firebaseConfig";

import * as Notifications from "expo-notifications";


export default function EditProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  
  // États des switchs
  const [publicEnabled, setPublicEnabled] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(false);

  // Données utilisateur
  const [userData, setUserData] = useState({
    pseudo: '',
    email: '',
    password: '••••••••',
  });

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [activeField, setActiveField] = useState<'pseudo' | 'email' | 'password' | null>(null);

    // --- CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUserData(prev => ({
          ...prev,
          email: currentUser.email || '',
        }));

        try {
          const docRef = doc(db, "Users", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(prev => ({
              ...prev,
              pseudo: data.pseudo || 'Utilisateur',
            }));

            if (data.is_public !== undefined) setPublicEnabled(data.is_public);
            
            if (data.notifications_enabled !== undefined) {
               setNotifEnabled(data.notifications_enabled);
            }
          }
        } catch (error) {
          // console.error("Erreur lecture Firestore:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubAuth();
  }, []);

  const openEditModal = (field: 'pseudo' | 'email' | 'password') => {
    setActiveField(field);
    setModalVisible(true);
  };

  // --- SAUVEGARDE DES DONNEES (MODAL) ---
  const handleSaveField = async (newValue: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !activeField) return;

    try {
      const userRef = doc(db, "Users", currentUser.uid);

      if (activeField === 'pseudo') {
        await updateDoc(userRef, { pseudo: newValue });
        setUserData(prev => ({ ...prev, pseudo: newValue }));
      } 
      else if (activeField === 'email') {
         await updateEmail(currentUser, newValue); 
         await updateDoc(userRef, { email: newValue });
         setUserData(prev => ({ ...prev, email: newValue }));
         Alert.alert("Succès", "Email modifié avec succès !");
      }
      else if (activeField === 'password') {
        await updatePassword(currentUser, newValue); 
        Alert.alert("Succès", "Votre mot de passe a été modifié.");
      }

    } catch (error: any) {
      // console.error("ERREUR UPDATE :", error.code, error.message);
      if (error.code === "auth/requires-recent-login") {
        Alert.alert("Reconnexion requise", "Veuillez vous déconnecter et vous reconnecter pour modifier cette information.");
      } else {
        Alert.alert("Erreur", "Une erreur est survenue lors de la modification.");
      }
    }
  };

  // --- SAUVEGARDE DU SWITCH ---
  const toggleSwitch = async (value: boolean) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    // 1. Mise à jour immédiate de l'interface (optimiste)
    setPublicEnabled(value);

    // 2. Envoi à Firebase
    try {
      const userRef = doc(db, "Users", currentUser.uid);
      await updateDoc(userRef, { is_public: value });
    } catch (error) {
      setPublicEnabled(!value);
      Alert.alert("Erreur", "Impossible de sauvegarder vos préférences.");
    }
  };

  // --- ACTIVATION DES NOTIFICATIONS ---
  const activateSwitch = async (value: boolean) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setNotifEnabled(value);

    try {
      const userRef = doc(db, "Users", currentUser.uid);

      if (value) {
        // L'utilisateur veut ACTIVER
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus === 'granted') {
          // Tout est bon, on enregistre dans Firebase
          await updateDoc(userRef, { notifications_enabled: true });
        } else {
          // L'utilisateur a refusé les permissions systèmes
          setNotifEnabled(false); // On annule visuellement
          Alert.alert(
            "Permissions requises",
            "Vous devez autoriser les notifications dans les réglages de votre téléphone.",
            [
              { text: "Annuler", style: "cancel" },
              { text: "Ouvrir les réglages", onPress: () => Linking.openSettings() }
            ]
          );
        }
      } else {
        // L'utilisateur veut DÉSACTIVER
        await updateDoc(userRef, { notifications_enabled: false });
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
    } catch (error) {
      // Rollback en cas de crash réseau
      setNotifEnabled(!value);
      Alert.alert("Erreur", "Impossible de mettre à jour vos préférences.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.mainContainer, styles.center]}>
        <ActivityIndicator size="large" color="#65B369" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>

      {/* HEADER AVEC BOUTON RETOUR */}
      <View style={styles.headerTop}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={15}>
          <Ionicons name="arrow-back" size={28} color="#1A1A1A" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* TITRES */}
        <View style={styles.headerTitles}>
          <Text style={styles.title}>Mon profil</Text>
          <Text style={styles.subtitle}>Gère tes informations personnelles</Text>
        </View>

        {/* SECTION PROFIL (CARTE BLANCHE) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Général</Text>
          <View style={styles.card}>

            {/* Ligne Pseudo */}
            <Pressable style={styles.fieldRow} onPress={() => openEditModal('pseudo')}>
              <View style={[styles.iconWrapper, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="person-outline" size={20} color="#65B369" />
              </View>
              <View style={styles.fieldTexts}>
                <Text style={styles.fieldLabel}>Pseudo</Text>
                <Text style={styles.fieldValue} numberOfLines={1}>{userData.pseudo}</Text>
              </View>
              <Ionicons name="pencil" size={20} color="#ccc" />
            </Pressable>

            <View style={styles.divider} />

            {/* Ligne Email */}
            <Pressable style={styles.fieldRow} onPress={() => openEditModal('email')}>
              <View style={[styles.iconWrapper, { backgroundColor: '#E1F5FE' }]}>
                <Ionicons name="mail-outline" size={20} color="#4FC3F7" />
              </View>
              <View style={styles.fieldTexts}>
                <Text style={styles.fieldLabel}>Adresse mail</Text>
                <Text style={styles.fieldValue} numberOfLines={1}>{userData.email}</Text>
              </View>
              <Ionicons name="pencil" size={20} color="#ccc" />
            </Pressable>

            <View style={styles.divider} />

            {/* Ligne Mot de passe */}
            <Pressable style={[styles.fieldRow, { borderBottomWidth: 0 }]} onPress={() => openEditModal('password')}>
              <View style={[styles.iconWrapper, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="lock-closed-outline" size={20} color="#F57C00" />
              </View>
              <View style={styles.fieldTexts}>
                <Text style={styles.fieldLabel}>Mot de passe</Text>
                <Text style={styles.fieldValue}>{userData.password}</Text>
              </View>
              <Ionicons name="pencil" size={20} color="#ccc" />
            </Pressable>

          </View>
        </View>

        {/* SECTION CONFIDENTIALITÉ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confidentialité</Text>
          <View style={styles.card}>
            
            <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.iconWrapper, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="earth-outline" size={20} color="#BA68C8" />
              </View>
              
              <View style={styles.fieldTexts}>
                <Text style={styles.fieldLabel}>Profil public</Text>
                <Text style={styles.switchDescription}>Apparaître dans le classement</Text>
              </View>

              <Switch
                trackColor={{ false: "#E0E0E0", true: "#65B369" }}
                thumbColor={"#fff"}
                ios_backgroundColor="#E0E0E0"
                onValueChange={toggleSwitch}
                value={publicEnabled}
              />
            </View>

          </View>
        </View>

        {/* SECTION NOTIFICATIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.iconWrapper, { backgroundColor: '#fffbaf' }]}>
                <Ionicons name="notifications-outline" size={20} color="#9a9818" />
              </View>
              
              <View style={styles.fieldTexts}>
                <Text style={styles.fieldLabel}>Activer les notifications</Text>
                <Text style={styles.switchDescription}>Recevoir des rappels de défis quotidiennements</Text>
              </View>

              <Switch
                trackColor={{ false: "#E0E0E0", true: "#65B369" }}
                thumbColor={"#fff"}
                ios_backgroundColor="#E0E0E0"
                onValueChange={activateSwitch}
                value={notifEnabled}
              />
            </View>
          </View>
        </View>

      </ScrollView>

      {/* MODAL EXISTANT */}
      <EditModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveField}
        field={activeField}
        currentValue={activeField === 'password' ? '' : (activeField ? userData[activeField] : '')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA', // Fond Soft UI
    paddingTop: 50,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // --- HEADER ---
  headerTop: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 5,
    marginLeft: -5,
  },
  headerTitles: {
    marginBottom: 35,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },

  // --- SECTIONS & CARTES ---
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
    paddingLeft: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    // Soft UI Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // --- LIGNES DE CHAMP (ROWS) ---
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  fieldTexts: {
    flex: 1,
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '700',
  },
  switchDescription: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 57, // Aligné avec le texte (largeur icone + marge)
  },
});