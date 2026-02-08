import { COLORS } from '@/constants/colors';
import { auth, db } from "@/firebaseBD/firebaseConfig";
import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, deleteUser, signOut } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AuthButton from '../../components/auth/AuthButton';
import AuthContainer from '../../components/auth/AuthContainer';
import AuthInput from '../../components/auth/AuthInput';

export default function RegisterScreen() {
  const router = useRouter();

  // Champs formulaire
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptData, setAcceptData] = useState(false);
  const [acceptNotifs, setAcceptNotifs] = useState(false);

  const [errors, setErrors] = useState<{
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
      newErrors.acceptData = "Tu dois accepter la collecte des données.";
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
      // ✅ On crée exactement les champs visibles dans ta capture (sauf mdp)
      // ⚠️ Collection "users" en minuscule (doit matcher tes rules)
      try {
        await setDoc(doc(db, "Users", uid), {
          admin: false,
          email: email.trim().toLowerCase(),
          pseudo: pseudo.trim(),
          nb_points: 0,
          defi_en_cours: [],
          defi_realise: {},
          recompense: [],
          acceptData,
          acceptNotifs,
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
        firebaseErrors.general = `Erreur: ${code ?? "inconnue"} | ${error?.message ?? ""}`;
      }

      setErrors(firebaseErrors);
    }
  };

  return (
      <ScrollView>
        <AuthContainer>
          <Text style={styles.title}>Création de compte</Text>

          <AuthInput
              label="Pseudo"
              value={pseudo}
              onChangeText={(v: string) => {
                setPseudo(v);
                clearFieldError("pseudo");
              }}
          />
          {!!errors.pseudo && <Text style={styles.errorText}>{errors.pseudo}</Text>}

          <AuthInput
              label="Adresse mail"
              value={email}
              onChangeText={(v: string) => {
                setEmail(v);
                clearFieldError("email");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
          />
          {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <AuthInput
              label="Mot de passe"
              value={password}
              onChangeText={(v: string) => {
                setPassword(v);
                clearFieldError("password");
              }}
              secureTextEntry
          />

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

          <AuthInput
              label="Confirmation mot de passe"
              value={confirmPassword}
              onChangeText={(v: string) => {
                setConfirmPassword(v);
                clearFieldError("confirmPassword");
              }}
              secureTextEntry
          />
          {!!errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

          {/* Checkbox 1 OBLIGATOIRE (collecte des données) */}
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
            <Text style={styles.checkboxLabel}>
              J'accepte que mes données soient récupérées et utilisées pour le bon fonctionnement de l'application*
            </Text>
          </View>
          {!!errors.acceptData && <Text style={styles.errorText}>{errors.acceptData}</Text>}

          {/* Checkbox 2 facultatif (notifications) */}
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
        </AuthContainer>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: 'bold',
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
    flex: 1,
    fontSize: 13,
    color: COLORS.textDark,
    lineHeight: 18,
  },
  linkText: {
    color: COLORS.primaryGreen,
    textDecorationLine: 'underline',
  },
  footerContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 20,
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
});
