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

import { onAuthStateChanged, updateEmail, updatePassword } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from "../../firebaseConfig";

import * as Notifications from "expo-notifications";


export default function EditProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  
  // États des switchs
  const [publicEnabled, setPublicEnabled] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(false);

  const [userData, setUserData] = useState({
    nom: '',
    prenom: '',
    adresse: '',
    pseudo: '',
    email: '',
    password: '••••••••',
    last_address_update: null as any, 
  });

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [activeField, setActiveField] = useState<'pseudo' | 'email' | 'password' | 'adresse' | null>(null);

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
              nom: data.nom || '',
              prenom: data.prenom || '',
              adresse: data.adresse || 'Non renseignée',
              pseudo: data.pseudo || 'Utilisateur',
              last_address_update: data.last_address_update || null,
            }));

            if (data.is_public !== undefined) setPublicEnabled(data.is_public);
            
            if (data.notifications_enabled !== undefined) {
               setNotifEnabled(data.notifications_enabled);
            }
          }
        } catch (error) {
          console.error("Erreur lecture Firestore:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubAuth();
  }, []);

  const openEditModal = (field: 'pseudo' | 'email' | 'password' | 'adresse') => {
    setActiveField(field);
    setModalVisible(true);
  };

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
      else if (activeField === 'adresse') {
        if (userData.last_address_update) {
          const lastUpdateDate = userData.last_address_update.toDate ? userData.last_address_update.toDate() : new Date(userData.last_address_update);
          const now = new Date();
          const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
          
          if (now.getTime() - lastUpdateDate.getTime() < oneYearInMs) {
            Alert.alert("Modification refusée", "Vous avez déjà modifié votre adresse au cours des 12 derniers mois.");
            return;
          }
        }

        await updateDoc(userRef, { 
            adresse: newValue, 
            last_address_update: serverTimestamp() 
        });
        // Met à jour l'affichage et force un faux timestamp pour éviter de spammer juste après
        setUserData(prev => ({ 
            ...prev, 
            adresse: newValue, 
            last_address_update: { toDate: () => new Date() } 
        }));
        Alert.alert("Succès", "Ton adresse postale a bien été mise à jour.");
      }

    } catch (error: any) {
      if (error.code === "auth/requires-recent-login") {
        Alert.alert("Reconnexion requise", "Veuillez vous déconnecter et vous reconnecter pour modifier cette information.");
      } else {
        Alert.alert("Erreur", "Une erreur est survenue lors de la modification.");
      }
    }
  };

  const toggleSwitch = async (value: boolean) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    setPublicEnabled(value);

    try {
      const userRef = doc(db, "Users", currentUser.uid);
      await updateDoc(userRef, { is_public: value });
    } catch (error) {
      setPublicEnabled(!value);
      console.error("Erreur lors de la sauvegarde des préférences", error);
      Alert.alert("Erreur", "Impossible de sauvegarder vos préférences.");
    }
  };

  const activateSwitch = async (value: boolean) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setNotifEnabled(value);

    try {
      const userRef = doc(db, "Users", currentUser.uid);

      if (value) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus === 'granted') {
          await updateDoc(userRef, { notifications_enabled: true });
        } else {
          setNotifEnabled(false); 
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
        await updateDoc(userRef, { notifications_enabled: false });
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
    } catch (error) {
      setNotifEnabled(!value);
      console.error("Erreur lors de la mise à jour vos préférences.", error);
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

      <View style={styles.headerTop}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={15}>
          <Ionicons name="arrow-back" size={28} color="#1A1A1A" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerTitles}>
          <Text style={styles.title}>Mon profil</Text>
          <Text style={styles.subtitle}>Gère tes informations personnelles</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identité & Contact</Text>
          <View style={styles.card}>

            <View style={styles.fieldRow}>
              <View style={[styles.iconWrapper, { backgroundColor: '#ECEFF1' }]}>
                <Ionicons name="person" size={20} color="#78909C" />
              </View>
              <View style={styles.fieldTexts}>
                <Text style={styles.fieldLabel}>Nom</Text>
                <Text style={[styles.fieldValue, { color: '#757575' }]} numberOfLines={1}>{userData.nom}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldRow}>
              <View style={[styles.iconWrapper, { backgroundColor: '#ECEFF1' }]}>
                <Ionicons name="person" size={20} color="#78909C" />
              </View>
              <View style={styles.fieldTexts}>
                <Text style={styles.fieldLabel}>Prénom</Text>
                <Text style={[styles.fieldValue, { color: '#757575' }]} numberOfLines={1}>{userData.prenom}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Pressable style={styles.fieldRow} onPress={() => openEditModal('adresse')}>
              <View style={[styles.iconWrapper, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="home-outline" size={20} color="#8E24AA" />
              </View>
              <View style={styles.fieldTexts}>
                <Text style={styles.fieldLabel}>Adresse postale</Text>
                <Text style={styles.fieldValue} numberOfLines={1}>{userData.adresse}</Text>
              </View>
              <Ionicons name="pencil" size={20} color="#ccc" />
            </Pressable>

          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Données du compte</Text>
          <View style={styles.card}>

            <Pressable style={styles.fieldRow} onPress={() => openEditModal('pseudo')}>
              <View style={[styles.iconWrapper, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="at-outline" size={20} color="#65B369" />
              </View>
              <View style={styles.fieldTexts}>
                <Text style={styles.fieldLabel}>Pseudo</Text>
                <Text style={styles.fieldValue} numberOfLines={1}>{userData.pseudo}</Text>
              </View>
              <Ionicons name="pencil" size={20} color="#ccc" />
            </Pressable>

            <View style={styles.divider} />

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confidentialité</Text>
          <View style={styles.card}>
            
            <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.iconWrapper, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="earth-outline" size={20} color="#1976D2" />
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
    backgroundColor: '#FAFAFA', 
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
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
    marginLeft: 57, 
  },
});