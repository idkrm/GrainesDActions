import { COLORS } from '@/constants/colors';
import { auth } from "@/firebaseBD/firebaseConfig";
import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthButton from '../../components/auth/AuthButton';
import AuthContainer from '../../components/auth/AuthContainer';
import AuthInput from '../../components/auth/AuthInput';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordHidden, setPasswordHidden] = useState(true);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const clearFieldError = (field: keyof typeof errors) => {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const handleLogin = async () => {
    // reset erreurs
    const newErrors: typeof errors = {};

    const cleanEmail = email.trim().toLowerCase();
    const pwd = password;

    if (!cleanEmail) newErrors.email = "L'adresse mail est requise.";
    if (!pwd) newErrors.password = "Le mot de passe est requis.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setErrors({}); // clear anciennes erreurs

      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, pwd);

      console.log("Connecté:", userCred.user.uid);
      router.replace("/(tabs)");
    } catch (error: any) {
      // console.error("Erreur login:", error?.code, error?.message);

      const code = error?.code;
      const firebaseErrors: typeof errors = {};

      // ✅ Affichage sous le bon champ
      if (code === "auth/invalid-email") {
        firebaseErrors.email = "Email invalide.";
      } else if (code === "auth/user-not-found") {
        firebaseErrors.email = "Aucun compte n'est associé à cet email.";
      } else if (code === "auth/wrong-password") {
        firebaseErrors.password = "Mot de passe incorrect.";
      } else if (code === "auth/invalid-credential") {
        // cas le plus fréquent : email ou mot de passe incorrect
        firebaseErrors.general = "Email ou mot de passe incorrect.";
      } else if (code === "auth/too-many-requests") {
        firebaseErrors.general = "Trop de tentatives. Réessaie plus tard.";
      } else {
        firebaseErrors.general = `Erreur: ${code ?? "inconnue"} | ${error?.message ?? ""}`;
      }

      setErrors(firebaseErrors);
    }
  };

  return (
      <AuthContainer>
        <Text style={styles.title}>Connexion</Text>
        <AuthInput
            label="Adresse mail"
            value={email}
            onChangeText={(v: string) => {
              setEmail(v);
              clearFieldError("email");
              clearFieldError("general");
            }}
            autoCapitalize="none"
            keyboardType="email-address"
        />
        {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      
        <View style={styles.inputContainer}>
        <AuthInput
            label="Mot de passe"
            value={password}
            onChangeText={(v: string) => {
              setPassword(v);
              clearFieldError("password");
              clearFieldError("general");
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
        {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

        {/* ✅ Erreur générale (ex: email+mdp incorrect, trop de tentatives, etc.) */}
        {!!errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

        <Link href="/forgotPassword" asChild>
          <Pressable style={styles.forgotPasswordContainer}>
            <Text style={styles.linkText}>Mot de passe oublié</Text>
          </Pressable>
        </Link>

        <AuthButton title="Se connecter" onPress={handleLogin} />

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Pas encore de compte ? </Text>
          <Link href="/register" asChild>
            <Pressable>
              <Text style={[styles.footerText, styles.linkText]}>S’inscrire</Text>
            </Pressable>
          </Link>
        </View>
      </AuthContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 30,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  linkText: {
    color: COLORS.primaryGreen,
    textDecorationLine: 'underline',
  },
  footerContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  footerText: {
    color: COLORS.textDark,
    fontSize: 16,
  },
  // ✅ même style que register
  errorText: {
    color: "#D32F2F",
    fontSize: 12,
    marginTop: 6,
    marginBottom: 10,
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
  }
});
