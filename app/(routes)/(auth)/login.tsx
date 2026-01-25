import { auth } from "@/firebaseBD/firebaseConfig";
import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../../constants/colors';
import AuthButton from '../../components/auth/AuthButton';
import AuthContainer from '../../components/auth/AuthContainer';
import AuthInput from '../../components/auth/AuthInput';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {

      const userCred = await signInWithEmailAndPassword(auth, username, password);

      console.log("Connecté:", userCred.user.uid);
      router.replace("/(tabs)");
    } catch (error: any) {
      console.log("Erreur login:", error.code);

      // Exemples de gestion d'erreur
      if (error.code === "auth/user-not-found") {
        // afficher "Compte introuvable"
      } else if (error.code === "auth/wrong-password") {
        // afficher "Mot de passe incorrect"
      } else if (error.code === "auth/invalid-email") {
        // afficher "Email invalide"
      } else {
        // afficher "Erreur de connexion"
      }
    }
  };

  return (
    <AuthContainer>
      <Text style={styles.title}>Connexion</Text>

      <AuthInput
        label="Nom d'utilisateur"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
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

      <AuthButton title="Se connecter" onPress={() => router.replace('/(tabs)')} />

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