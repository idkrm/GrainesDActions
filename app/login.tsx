import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AuthButton from './components/auth/AuthButton';
import AuthContainer from './components/auth/AuthContainer';
import AuthInput from './components/auth/AuthInput';
import { COLORS } from './constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log("Connexion avec:", username, password);
    // Vérifier que l'email et le mdp correspond à ce qu'on a dans le BDD firebase
    // Si ok :
    router.replace('/(tabs)');

    // Si non : afficher un msg d'erreur
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