import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
} from 'react-native';
import { COLORS } from '../../../constants/colors';
import EditModal from '../../components/profile/EditProfileModal';

// IMPORTS FIREBASE
import { onAuthStateChanged, updateEmail, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, database } from "../../firebaseConfig";

export default function EditProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  
  // États des switchs
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [publicEnabled, setPublicEnabled] = useState(true);

  // Données utilisateur
  const [userData, setUserData] = useState({
    pseudo: '',
    email: '',
    password: '••••••••',
  });

  // pour le modal qui permet de modif les infos du user
  const [modalVisible, setModalVisible] = useState(false);
  const [activeField, setActiveField] = useState<'pseudo' | 'email' | 'password' | null>(null);

  // --- CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Email via Auth
        setUserData(prev => ({
          ...prev,
          email: currentUser.email || '',
        }));

        // Pseudo via Firestore
        try {
          const docRef = doc(database, "Users", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();

            setUserData(prev => ({
              ...prev,
              pseudo: data.pseudo || 'Erreur de chargement',
            }));

            // Préférences
            // if (data.notifications_enabled !== undefined) setNotifEnabled(data.notifications_enabled);
            if (data.is_public !== undefined) setPublicEnabled(data.is_public);
          } else {
            console.error("ERREUR : Le document utilisateur n'existe pas");
          }
        } catch (error) {
          console.error("Erreur lecture Firestore:", error);
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

  // --- SAUVEGARDE DES DONNEES ---
 const handleSaveField = async (newValue: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !activeField) return;

    try {
      const userRef = doc(database, "Users", currentUser.uid);

      //PSEUDO
      if (activeField === 'pseudo') {
        await updateDoc(userRef, { pseudo: newValue });
        setUserData(prev => ({ ...prev, pseudo: newValue }));
      } 
      //EMAIL
      else if (activeField === 'email') {
         await updateEmail(currentUser, newValue); 

         // MAJ Firestore
         await updateDoc(userRef, { email: newValue });

         // MAJ sur l'app
         setUserData(prev => ({ ...prev, email: newValue }));
         Alert.alert("Succès", "Email modifié avec succès !");
      }

      //MOT DE PASSE
      else if (activeField === 'password') {
        await updatePassword(currentUser, newValue); 
        // MAJ Firestore
        //await updateDoc(userRef, { mdp: newValue });

        // MAJ sur l'app
        //setUserData(prev => ({ ...prev, mdp: newValue }));
        
        // Si ça passe, on affiche le succès
        Alert.alert("Succès", "Votre mot de passe a été modifié.");
      }

    } catch (error: any) {
      console.error("ERREUR UPDATE :", error.code, error.message);
    }
  };

  const toggleSwitch = async (type: 'notif' | 'public', value: boolean) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    if (type === 'notif') setNotifEnabled(value);
    else setPublicEnabled(value);

    // try {
    //   const userRef = doc(database, "Users", currentUser.uid);
    //   await updateDoc(userRef, {
    //     [type === 'notif' ? 'notifications_enabled' : 'is_public']: value
    //   });
    // } catch (error) {
    //   if (type === 'notif') setNotifEnabled(!value);
    //   else setPublicEnabled(!value);
    // }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* HEADER PERSONNALISÉ */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </Pressable>
        <Text style={styles.headerTitle}>Modifier mon profil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* SECTION PROFIL (CADRE VERT) */}
        <Text style={styles.sectionLabel}>Profil</Text>
        <View style={styles.greenCard}>

          {/* Pseudo */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Pseudo : {userData.pseudo}</Text>
            </View>
            <Pressable onPress={() => openEditModal('pseudo')}>
              <Ionicons name="create-outline" size={24} color="#333" />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Email */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Adresse mail : {userData.email}</Text>
            </View>
            <Pressable onPress={() => openEditModal('email')}>
              <Ionicons name="create-outline" size={24} color="#333" />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Mdp */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Mot de passe : {userData.password}</Text>
            </View>
            <Pressable onPress={() => openEditModal('password')}>
              <Ionicons name="create-outline" size={24} color="#333" />
            </Pressable>
          </View>

        </View>

        {/* <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Autoriser les notifications de défis</Text>
            <Switch
              trackColor={{ false: "#E0E0E0", true: COLORS.primaryGreen }}
              thumbColor={"#fff"}
              onValueChange={(val) => toggleSwitch('notif', val)}
              value={notifEnabled}
            />
          </View>
        </View> */}

        {/* SECTION CONFIDENTIALITÉ */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Confidentialité</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              Je souhaite apparaître dans le classement des utilisateurs
            </Text>
            <Switch
              trackColor={{ false: "#E0E0E0", true: COLORS.primaryGreen }}
              thumbColor={"#fff"}
              onValueChange={(val) => toggleSwitch('public', val)}
              value={publicEnabled}
            />
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },

  // CADRE VERT
  greenCard: {
    borderWidth: 1,
    borderColor: COLORS.primaryGreen,
    borderRadius: 15,
    padding: 15,
    marginBottom: 30,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  label: {
    fontSize: 15,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },

  // SWITCHES
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    marginRight: 10,
  },
});