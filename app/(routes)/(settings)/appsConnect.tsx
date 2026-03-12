import { auth, db } from "@/firebaseBD/firebaseConfig";
import { Ionicons } from '@expo/vector-icons';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { doc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const stravaEndpoints = {
  authorizationEndpoint: 'https://www.strava.com/oauth/mobile/authorize',
  tokenEndpoint: 'https://www.strava.com/oauth/token',
};

export default function ConnectAppsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const redirectUri = makeRedirectUri({
    scheme: 'grainesdactions', 
    path: 'connect-apps'
  });
  
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID as string,
      scopes: ['activity:read_all'], 
      redirectUri: redirectUri,
    },
    stravaEndpoints
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      console.log("Code d'autorisation reçu :", code);

      exchangeCodeForToken(code);
      
    } else if (response?.type === 'error') {
      Alert.alert("Erreur", "La connexion à Strava a été annulée ou a échoué.");
    }
  }, [response]);

  const exchangeCodeForToken = async (code: string) => {
    setLoading(true);
    try {
      const tokenResponse = await fetch(stravaEndpoints.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID,
          client_secret: process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
        }),
      });

      const data = await tokenResponse.json();

      if (data.access_token) {
        console.log("Token récupéré avec succès !");

        const user = auth.currentUser;
        if (user) {
          const userRef = doc(db, "Users", user.uid);
          
          await updateDoc(userRef, {
            apps_connectees: {
              strava: {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: data.expires_at, 
                athleteId: data.athlete.id
              }
            }
          });

          Alert.alert("Succès ! 🚴", "Ton compte Strava est maintenant connecté à Graines d'Actions !");
        } else {
          Alert.alert("Erreur", "Aucun utilisateur connecté.");
        }
      } else {
        Alert.alert("Erreur", "Strava n'a pas renvoyé de Token valide.");
        console.log("Erreur Strava:", data);
      }
    } catch (error) {
      console.error("Erreur lors de l'échange du token: ", error);
      Alert.alert("Erreur", "Impossible de finaliser la connexion à Strava.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </Pressable>
        <Text style={styles.headerTitle}>Connexion</Text>
      </View>

      <View style={styles.content}>
        
        {/* BOUTON STRAVA */}
        <Pressable 
            style={[styles.appButton, loading && { opacity: 0.7 }]} 
            disabled={!request || loading}
            onPress={() => promptAsync()}
        >
            <Image
              style={styles.logoPlaceholder}
              source={{
                uri: 'https://images.icon-icons.com/2429/PNG/512/strava_logo_icon_147232.png',
              }}
            />
          <Text style={styles.appText}>Strava</Text>
          {loading && <ActivityIndicator color="#FC4C02" />}
        </Pressable>

        {/* BOUTON FITBIT */}
        <Pressable style={styles.appButton} onPress={() => Alert.alert("Patience...", "L'intégration Fitbit arrive bientôt !")}>
          <Image
              style={styles.logoPlaceholder}
              source={{
                uri: 'https://companieslogo.com/img/orig/FIT.defunct-1627f32e.png?t=1720244491',
              }}
            />
          <Text style={styles.appText}>Fitbit</Text>
        </Pressable>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 20, marginBottom: 50 },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  content: { paddingHorizontal: 20, gap: 20 },
  
  appButton: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#333', borderRadius: 12,
    paddingVertical: 15, paddingHorizontal: 20, backgroundColor: '#fff',
  },
  logoPlaceholder: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginRight: 20,
  },
  appText: {
    fontSize: 16, fontWeight: '500', color: '#000',
    flex: 1, textAlign: 'left', 
  },
});