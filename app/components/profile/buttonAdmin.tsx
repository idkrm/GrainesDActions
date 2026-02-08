import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { database } from "../../firebaseConfig";
import { COLORS } from '../../../constants/colors';

export default function buttonAdmin() {
    const [admin, setAdmin] = useState<boolean>(false);
    
    useEffect (() => {
        const verifAdmin = async () => {
        const userCurrent = auth().currentUser; // Utilisateur connecté
            if(userCurrent) { // Si l'utilisateur est connecté alors ...
                firestore()
                .collection('Users')
                .doc(userCurrent.uid)
                .get()
                .then(doc => {
                    if (doc.data()?.admin == true){
                        setAdmin(true);
                    }
                })
            }
        };

        verifAdmin();
    }, []);
    
    return (
        <View style={{ flex: 1, justifyContent: 'center' }}>
        {admin && (
            <Pressable
                onPress={() => console.log("Accès Autorisé !")}
            >
                <Text style={styles.buttonText}>Gérer les défis</Text>
            </Pressable>
        )}
        </View>
    );
}

const styles = StyleSheet.create({
    buttonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    }
})