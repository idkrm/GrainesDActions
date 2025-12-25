import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AuthButton from './components/auth/AuthButton';
import AuthContainer from './components/auth/AuthContainer';
import AuthInput from './components/auth/AuthInput';
import { COLORS } from './constants/colors';

export default function ForgotPassword() {
    const router = useRouter();
    const [email, getEmail] = useState('');

    const handleForgotPassword = () => {
        // Affiche le msg qu'un mail a été envoyé à l'adresse mail si c'est associé à un compte

        // Si le mail est bien dans la BDD : envoyer un mail
        // Sinon : ne rien faire
    };

    return (
        <AuthContainer>
            <Text style={styles.title}>Mot de passe oublié</Text>

            <AuthInput
                label="Adresse mail"
                value={email}
                onChangeText={getEmail}
                autoCapitalize="none"
                placeholder='adresse@exemple.fr'
            />

            <AuthButton title="Confirmer" onPress={handleForgotPassword} style={{ marginTop: 40 }} />

            <View style={styles.footerContainer}>
                <Text style={styles.footerText}>Revenir à la page de </Text>
                <Pressable onPress={() => router.back()}>
                    <Text style={[styles.footerText, styles.linkText]}>connexion</Text>
                </Pressable>
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