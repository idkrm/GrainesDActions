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
        <View>
        {admin && (
            <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={styles.sectionTitle}>Administrateur</Text>
            <Pressable style={styles.button}
                onPress={() => console.log("Accès Autorisé !")}>
                <Text style={styles.text}>Gérer les défis</Text>
            </Pressable>
            </View>
        )}
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: COLORS.primaryGreen,
        borderWidth: 2,
        borderRadius: 25,
        paddingVertical: 12,
        width: '100%',
        borderColor: COLORS.primaryGreen,
        alignItems: 'center',
        justifyContent:'center',
        marginTop: 10,
        marginBottom: 15,
    },
    text: {
    color: '#fff',
    fontSize: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600"
    },
})