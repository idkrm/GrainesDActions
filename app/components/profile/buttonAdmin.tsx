import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import { auth } from "@/firebaseBD/firebaseConfig";
import { database } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { COLORS } from '../../../constants/colors';

export default function buttonAdmin() {
    const [admin, setAdmin] = useState<boolean>(false);
    
    useEffect (() => {
        const verifAdmin = async () => {
        const userCurrent = auth.currentUser; // Utilisateur connecté
            if(userCurrent) { // Si l'utilisateur est connecté alors ...
                try {
                    const docUser = doc(database, "Users", userCurrent.uid)
                    const docSnap = await getDoc(docUser)
                    const docData = docSnap.data()

                    if(docData?.admin == true) {
                        setAdmin(true);
                    }
                } catch(error){
                    console.error("Erreur Firebase: ", error)
                }
                
            }
        };

        verifAdmin();

    }, []);
    
    return (
        <View style={{ flex: 1, justifyContent: 'center' }}>
        {admin && (
            <Pressable
                onPress={() => console.log("Accès Autorisé !")}>
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