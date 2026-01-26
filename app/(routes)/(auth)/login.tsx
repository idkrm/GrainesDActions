import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import AuthButton from '../../components/auth/AuthButton';
import AuthContainer from '../../components/auth/AuthContainer';
import AuthInput from '../../components/auth/AuthInput';
import { auth } from "@/firebaseBD/firebaseConfig";


export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const email = username.trim().toLowerCase();
      const pwd = password;

      const userCred = await signInWithEmailAndPassword(auth, email, pwd);

      console.log("Connecté:", userCred.user.uid);
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Erreur login:", error?.code, error?.message);

      if (error.code === "auth/user-not-found") {
        // afficher "Compte introuvable"
      } else if (error.code === "auth/wrong-password") {
        // afficher "Mot de passe incorrect"
      } else if (error.code === "auth/invalid-email") {
        // afficher "Email invalide"
      } else if (error.code === "auth/invalid-credential") {
        // souvent: email ou mdp incorrect
      } else {
        // afficher "Erreur de connexion"
      }
    }
  };

  return (
    <AuthContainer>
      <Text style={styles.title}>Connexion</Text>

      <AuthInput
          label="Adresse mail"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          keyboardType="email-address"
      />


      <AuthInput
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry // Pour cacher le mot de passe
      />

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
});