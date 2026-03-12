import { auth } from "@/firebaseBD/firebaseConfig";
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from "firebase/auth";
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../../constants/colors';
import AuthButton from '../../components/auth/AuthButton';
import AuthContainer from '../../components/auth/AuthContainer';
import AuthInput from '../../components/auth/AuthInput';

export default function ForgotPassword() {
    const router = useRouter();
    const [email, setEmail] = useState('');

    const handleForgotPassword = async () => {
        if (!email.trim()) {
            Alert.alert("Oups", "Veuillez entrer une adresse mail.");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email.trim());

            Alert.alert(
                "E-mail envoyé !",
                "Si cette adresse est associée à un compte, tu recevras un lien pour réinitialiser ton mot de passe d'ici quelques minutes.",
                [
                    { 
                        text: "Retour à la connexion", 
                        onPress: () => router.back()
                    }
                ]
            );
        } catch (error: any) {
            console.log("Erreur mot de passe oublié =>", error);
            
            if (error.code === 'auth/invalid-email') {
                Alert.alert("Erreur", "L'adresse mail n'est pas valide.");
            } else {
                Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer plus tard.");
            }
        }
    };

    return (
        <AuthContainer>
            <Text style={styles.title}>Mot de passe oublié</Text>

            <AuthInput
                label="Adresse mail"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
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
        marginBottom: 15,
    },
    instructions: {
        fontSize: 14,
        color: '#666',
        marginBottom: 30,
        lineHeight: 20,
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