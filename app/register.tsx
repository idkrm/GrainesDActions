import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AuthButton from './components/auth/AuthButton';
import AuthContainer from './components/auth/AuthContainer';
import AuthInput from './components/auth/AuthInput';
import { COLORS } from './constants/colors';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebaseBD/firebaseConfig";

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptData, setAcceptData] = useState(false);
  const [acceptNotifs, setAcceptNotifs] = useState(false);

  const [errors, setErrors] = useState<{
    username?: string;
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

  const handleRegister = async () => {
    const newErrors: typeof errors = {};

    if (!username.trim()) newErrors.username = "Le nom d'utilisateur est requis.";
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
      const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim().toLowerCase(),
          password
      );

      const uid = cred.user.uid;

      console.log("CURRENT USER UID:", auth.currentUser?.uid);
      console.log("CREATED UID:", uid);

      await setDoc(doc(db, "Users", uid), {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        acceptData,
        acceptNotifs,
        createdAt: serverTimestamp(),
      });

      router.replace("/(tabs)");
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
      } else {
        firebaseErrors.general = `Erreur: ${code ?? "inconnue"} | ${error?.message ?? ""}`;
      }

      setErrors(firebaseErrors);
    }

  };

  const clearFieldError = (field: keyof typeof errors) => {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  return (
      <AuthContainer>
        <Text style={styles.title}>Création de compte</Text>

        <AuthInput
            label="Nom d'utilisateur"
            value={username}
            onChangeText={(v: string) => {
              setUsername(v);
              clearFieldError("username");
            }}
        />
        {!!errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

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

        {/* ✅ Erreur générale (optionnel) */}
        {!!errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

        {/* Bouton s'inscrire */}
        <AuthButton title="S'inscrire" onPress={handleRegister} />

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Déjà inscrit ? </Text>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.footerText, styles.linkText]}>Se connecter</Text>
          </Pressable>
        </View>
      </AuthContainer>
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

  // ✅ style erreurs sous les champs
  errorText: {
    color: "#D32F2F",
    fontSize: 12,
    marginTop: 6,
    marginBottom: 10,
  },

  // ✅ style checklist live
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
