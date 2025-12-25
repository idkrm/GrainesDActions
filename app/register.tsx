import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AuthButton from './components/auth/AuthButton';
import AuthContainer from './components/auth/AuthContainer';
import AuthInput from './components/auth/AuthInput';
import { COLORS } from './constants/colors';

export default function RegisterScreen() {
  const router = useRouter();
  // États pour les champs
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptData, setAcceptData] = useState(false);
  const [acceptNotifs, setAcceptNotifs] = useState(false);

  const handleRegister = () => {
    console.log("Inscription...");
    // Vérifiez que l'adresse mail ne fait pas déjà partie de la bd
    // Vérifier que mdp et confirmation mdp match
    // Vérifier que la checkbox 1 est cochée

    // Faire apparaître un msg d'erreur si l'une des trois conditions ne sont pas remplies

    // Si tout est ok : router.replace('/(tabs)'); (ou sinon on l'envoie sur la page de connexion ? route.replace(/login.tsx); )
  };

  return (
    <AuthContainer>
      <Text style={styles.title}>Création de compte</Text>

      <AuthInput label="Nom d'utilisateur" value={username} onChangeText={setUsername} />
      <AuthInput label="Adresse mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <AuthInput label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
      <AuthInput label="Confirmation mot de passe" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

      {/* Checkbox 1 OBLIGATOIRE (collecte des données) */}
      <View style={styles.checkboxContainer}>
        <Checkbox
          style={styles.checkbox}
          value={acceptData}
          onValueChange={setAcceptData}
          color={acceptData ? COLORS.primaryGreen : undefined}
        />
        <Text style={styles.checkboxLabel}>
          J'accepte que mes données soient récupérées et utilisées pour le bon fonctionnement de l'application*
        </Text>
      </View>

      {/* Checkbox 2 facultatif (notifications) */}
      <View style={styles.checkboxContainer}>
        <Checkbox
          style={styles.checkbox}
          value={acceptNotifs}
          onValueChange={setAcceptNotifs}
          color={acceptNotifs ? COLORS.primaryGreen : undefined}
        />
        <Text style={styles.checkboxLabel}>
          Je souhaite activez les notifications de défis quotidiens
        </Text>
      </View>

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
});