import { COLORS } from '@/constants/colors';
import { auth, db } from "@/firebaseBD/firebaseConfig";
import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, deleteUser, signOut } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useMemo, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AuthButton from '../../components/auth/AuthButton';
import AuthContainer from '../../components/auth/AuthContainer';
import AuthInput from '../../components/auth/AuthInput';

export default function RegisterScreen() {
  const router = useRouter();

  // Champs formulaire
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [adresse, setAdresse] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [acceptData, setAcceptData] = useState(false);
  const [acceptNotifs, setAcceptNotifs] = useState(false);
  
  const [passwordHidden, setPasswordHidden] = useState(true);
  const [passwordHiddenBis, setPasswordHiddenBis] = useState(true);

  // État pour la modale de confidentialité
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  const [errors, setErrors] = useState<{
    nom?: string;
    prenom?: string;
    adresse?: string;
    pseudo?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    acceptData?: string;
    general?: string;
  }>({});

  const passwordChecks = useMemo(() => {
    const hasMinLength = password.length >= 6;
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\\/]/.test(password);
    return { hasMinLength, hasNumber, hasSpecialChar };
  }, [password]);

  const clearFieldError = (field: keyof typeof errors) => {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const handleRegister = async () => {
    const newErrors: typeof errors = {};

    // Validations
    if (!nom.trim()) newErrors.nom = "Le nom est requis.";
    if (!prenom.trim()) newErrors.prenom = "Le prénom est requis.";
    if (!adresse.trim()) newErrors.adresse = "L'adresse postale est requise.";
    if (!pseudo.trim()) newErrors.pseudo = "Le pseudo est requis.";
    if (!email.trim()) newErrors.email = "L'adresse mail est requise.";
    if (!password) newErrors.password = "Le mot de passe est requis.";
    if (!confirmPassword) newErrors.confirmPassword = "La confirmation est requise.";

    if (password && confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }

    if (password) {
      if (!passwordChecks.hasMinLength) {
        newErrors.password = "Mot de passe trop court (min 6 caractères).";
      } else if (!passwordChecks.hasNumber) {
        newErrors.password = "Le mot de passe doit contenir au moins un chiffre.";
      } else if (!passwordChecks.hasSpecialChar) {
        newErrors.password = "Le mot de passe doit contenir au moins un caractère spécial.";
      }
    }

    if (!acceptData) {
      newErrors.acceptData = "Veuillez accepter la politique de confidentialité.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // 1) Création du compte dans Firebase Auth (connecte automatiquement l’utilisateur)
      const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim().toLowerCase(),
          password
      );

      const uid = cred.user.uid;

      // 2) Création du document utilisateur dans Firestore
      try {
        // Activation des notifications selon le choix de l'utilisateur
        let notifStatus = false;

        if(acceptNotifs) {
          const { status } = await Notifications.requestPermissionsAsync();
          if(status === 'granted'){
            notifStatus = true;
          } else {
            setAcceptNotifs(false)
            notifStatus = false

            Alert.alert("Ouvrir les réglages", "Veuillez activez les notifications dans les réglages pour en recevoir ⚙️",
              [
                {text: "Annuler", onPress: () => {setAcceptNotifs(false); notifStatus = false}, style: "cancel"},
                {text: "Accéder aux réglages", onPress: () => { Linking.openSettings() }}
              ]
            )
          }
        } else {
          notifStatus = false;
        }

        // Ajout des nouveaux champs dans Firestore
        await setDoc(doc(db, "Users", uid), {
          nom: nom.trim(),
          prenom: prenom.trim(),
          adresse: adresse.trim(),
          admin: false,
          email: email.trim().toLowerCase(),
          pseudo: pseudo.trim(),
          nb_points: 0,
          defi_en_cours: [],
          defi_realise: {},
          recompense: [],
          is_public: false,
          notifications_enabled: notifStatus,
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        // rollback: si Firestore échoue, on supprime le compte Auth créé
        await deleteUser(cred.user);
        throw e;
      }
        
      await signOut(auth);
      router.replace("/login");
    } catch (error: any) {
      console.log("REGISTER ERROR RAW =>", error);
      console.log("REGISTER ERROR CODE =>", error?.code);
      console.log("REGISTER ERROR MESSAGE =>", error?.message);

      const code = error?.code;
      const firebaseErrors: typeof errors = {};

      if (code === "auth/email-already-in-use") {
        firebaseErrors.email = "Cet email est déjà utilisé.";
      } else if (code === "auth/invalid-email") {
        firebaseErrors.email = "Email invalide.";
      } else if (code === "auth/weak-password") {
        firebaseErrors.password = "Mot de passe trop faible.";
      } else if (code === "permission-denied") {
        firebaseErrors.general = "Permissions Firestore insuffisantes (vérifie les Rules et la collection 'users').";
      } else {
        firebaseErrors.general = `Erreur: ${code ?? "inconnue"}`;
      }

      setErrors(firebaseErrors);
    }
  };

  return (
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AuthContainer>
          <Text style={styles.title}>Création de compte</Text>
          <Text style={styles.subtitle}>* Champs obligatoires</Text>
          <AuthInput
              label="Nom *"
              value={nom}
              onChangeText={(v: string) => {
                setNom(v);
                clearFieldError("nom");
              }}
          />
          {!!errors.nom && <Text style={styles.errorText}>{errors.nom}</Text>}

          <AuthInput
              label="Prénom *"
              value={prenom}
              onChangeText={(v: string) => {
                setPrenom(v);
                clearFieldError("prenom");
              }}
          />
          {!!errors.prenom && <Text style={styles.errorText}>{errors.prenom}</Text>}

          <AuthInput
              label="Adresse postale *"
              value={adresse}
              onChangeText={(v: string) => {
                setAdresse(v);
                clearFieldError("adresse");
              }}
          />
          {!!errors.adresse && <Text style={styles.errorText}>{errors.adresse}</Text>}

          <AuthInput
              label="Pseudo *"
              value={pseudo}
              onChangeText={(v: string) => {
                setPseudo(v);
                clearFieldError("pseudo");
              }}
          />
          {!!errors.pseudo && <Text style={styles.errorText}>{errors.pseudo}</Text>}

          <AuthInput
              label="Adresse mail *"
              value={email}
              onChangeText={(v: string) => {
                setEmail(v);
                clearFieldError("email");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
          />
          {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          
          <View style={styles.inputContainer}>
            <AuthInput
                label="Mot de passe *"
                value={password}
                onChangeText={(v: string) => {
                  setPassword(v);
                  clearFieldError("password");
                }}
                secureTextEntry={passwordHidden}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setPasswordHidden(!passwordHidden)}
            >
            <Ionicons 
              name={passwordHidden ? "eye-off" : "eye"} 
              size={24} 
              color="#4cb05b"
            />
            </TouchableOpacity>
          </View>

          {/* ✅ Checklist live mot de passe */}
          <View style={styles.checklistContainer}>
            <Text style={[styles.checkItem, passwordChecks.hasMinLength ? styles.checkOk : styles.checkKo]}>
              {passwordChecks.hasMinLength ? "✓" : "•"} 6 caractères minimum
            </Text>
            <Text style={[styles.checkItem, passwordChecks.hasNumber ? styles.checkOk : styles.checkKo]}>
              {passwordChecks.hasNumber ? "✓" : "•"} Au moins un chiffre
            </Text>
            <Text style={[styles.checkItem, passwordChecks.hasSpecialChar ? styles.checkOk : styles.checkKo]}>
              {passwordChecks.hasSpecialChar ? "✓" : "•"} Au moins un caractère spécial
            </Text>
          </View>

          {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <View style={styles.inputContainer}>
            <AuthInput
                label="Confirmation mot de passe *"
                value={confirmPassword}
                onChangeText={(v: string) => {
                  setConfirmPassword(v);
                  clearFieldError("confirmPassword");
                }}
                secureTextEntry={passwordHiddenBis}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setPasswordHiddenBis(!passwordHiddenBis)}
            >
            <Ionicons 
              name={passwordHiddenBis ? "eye-off" : "eye"} 
              size={24} 
              color="#4cb05b"
            />
            </TouchableOpacity>
          </View>
          {!!errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

          {/* Checkbox 1 OBLIGATOIRE (collecte des données) avec Pop-up */}
          <View style={styles.checkboxContainer}>
            <Checkbox
                style={styles.checkbox}
                value={acceptData}
                onValueChange={(v: boolean) => {
                  setAcceptData(v);
                  clearFieldError("acceptData");
                }}
                color={acceptData ? COLORS.primaryGreen : undefined}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.checkboxLabel}>
                J'accepte que mes données soient récupérées et utilisées pour le bon fonctionnement de l'application *
              </Text>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(true)}>
                <Text style={styles.privacyLink}>En savoir plus sur la politique de confidentialité</Text>
              </TouchableOpacity>
            </View>
          </View>
          {!!errors.acceptData && <Text style={styles.errorText}>{errors.acceptData}</Text>}

          {/* Checkbox 2 facultatif (notifications)*/}
          <View style={styles.checkboxContainer}>
            <Checkbox
                style={styles.checkbox}
                value={acceptNotifs}
                onValueChange={setAcceptNotifs}
                color={acceptNotifs ? COLORS.primaryGreen : undefined}
            />
            <Text style={styles.checkboxLabel}>
              Je souhaite activer les notifications de défis quotidiens
            </Text>
          </View> 

          {!!errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

          <AuthButton title="S'inscrire" onPress={handleRegister} />

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Déjà inscrit ? </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={[styles.footerText, styles.linkText]}>Se connecter</Text>
            </Pressable>
          </View>

          {/* MODAL POUR LA POLITIQUE DE CONFIDENTIALITÉ */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={privacyModalVisible}
            onRequestClose={() => setPrivacyModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Politique de Confidentialité</Text>
                
                <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                  <Text style={styles.modalText}>
                    En créant un compte, vous acceptez de nous confier certaines informations personnelles (Nom, Prénom, Adresse postale, Adresse mail et Pseudo).
                    {"\n\n"}
                    <Text style={{ fontWeight: 'bold' }}>1. Utilisation des données</Text>{"\n"}
                    Vos données sont collectées exclusivement pour vous permettre d'utiliser les fonctionnalités de l'application (validation de défis, classement, etc.).
                    {"\n\n"}
                    <Text style={{ fontWeight: 'bold' }}>2. Protection et Partage</Text>{"\n"}
                    Vos informations sont stockées de manière sécurisée et ne seront jamais revendues ou partagées à des tiers à des fins commerciales sans votre consentement explicite.
                    {"\n\n"}
                    <Text style={{ fontWeight: 'bold' }}>3. Vos droits</Text>{"\n"}
                    Conformément à la réglementation (RGPD), vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles à tout moment depuis les paramètres de votre compte ou en nous contactant.
                  </Text>
                </ScrollView>

                <TouchableOpacity 
                  style={styles.modalButton} 
                  onPress={() => setPrivacyModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>J'ai compris</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

        </AuthContainer>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,           
    justifyContent: 'center', 
    paddingVertical: 40,   
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 25,
    textAlign: 'center',
  },
    subtitle: {
    fontSize: 13,
    color: COLORS.textDark,
    marginBottom: 25,
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
    width: '100%',
  },
  checkbox: {
    marginRight: 10,
    marginTop: 2,
    borderColor: COLORS.primaryGreen,
    borderRadius: 5,
  },
  checkboxLabel: {
    fontSize: 13,
    color: COLORS.textDark,
    lineHeight: 18,
  },
  privacyLink: {
    fontSize: 13,
    color: COLORS.primaryGreen,
    textDecorationLine: 'underline',
    marginTop: 4,
    fontWeight: '600',
  },
  linkText: {
    color: COLORS.primaryGreen,
    textDecorationLine: 'underline',
  },
  footerContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 20,
    alignSelf: 'center',
  },
  footerText: {
    color: COLORS.textDark,
    fontSize: 16,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 12,
    marginTop: 6,
    marginBottom: 10,
  },
  checklistContainer: {
    width: "100%",
    marginTop: 8,
    marginBottom: 8,
  },
  checkItem: {
    fontSize: 12,
    marginBottom: 4,
  },
  checkOk: {
    color: "#2E7D32",
  },
  checkKo: {
    color: "#757575",
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    height: '95%',
    top: 6,
    justifyContent: 'center',
  },
  inputContainer: {
    position: 'relative',
    width: '100%',
    alignSelf: 'center'
  },
  // --- STYLES MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalScroll: {
    marginBottom: 20,
  },
  modalText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: COLORS.primaryGreen,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});