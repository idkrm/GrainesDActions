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
      
      {/* HEADER TOP (Bouton retour) */}
      <View style={styles.headerTop}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={15}>
          <Ionicons name="arrow-back" size={28} color="#1A1A1A" />
        </Pressable>
      </View>

      <View style={styles.content}>
        
        {/* TITRES */}
        <View style={styles.headerTitles}>
          <Text style={styles.title}>Applications</Text>
          <Text style={styles.subtitle}>Synchronise tes activités sportives</Text>
        </View>

        {/* ENCART D'INFORMATION */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#65B369" style={{ marginRight: 10 }} />
          <Text style={styles.infoText}>
            Connecte tes applications pour valider automatiquement tes défis de marche, course ou vélo !
          </Text>
        </View>

        {/* BOUTON STRAVA */}
        <Pressable 
            style={[styles.appCard, loading && { opacity: 0.7 }]} 
            disabled={!request || loading}
            onPress={() => promptAsync()}
        >
          <View style={[styles.logoWrapper, { backgroundColor: '#FFF3E0' }]}>
            <Image
              style={styles.logoImage}
              source={{ uri: 'https://images.icon-icons.com/2429/PNG/512/strava_logo_icon_147232.png' }}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.appTexts}>
            <Text style={styles.appName}>Strava</Text>
            <Text style={styles.appStatus}>Appuyer pour connecter</Text>
          </View>

          {loading ? (
            <ActivityIndicator color="#FC4C02" />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          )}
        </Pressable>

        {/* BOUTON FITBIT */}
        <Pressable 
          style={styles.appCard} 
          onPress={() => Alert.alert("Patience...", "L'intégration Fitbit arrive très bientôt !")}
        >
          <View style={[styles.logoWrapper, { backgroundColor: '#E0F7FA' }]}>
            <Image
              style={[styles.logoImage, { width: 24, height: 24 }]} // Légèrement réduit pour fitbit
              source={{ uri: 'https://companieslogo.com/img/orig/FIT.defunct-1627f32e.png?t=1720244491' }}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.appTexts}>
            <Text style={styles.appName}>Fitbit</Text>
            <Text style={styles.appStatus}>Bientôt disponible</Text>
          </View>

          <Ionicons name="time-outline" size={20} color="#ccc" />
        </Pressable>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FAFAFA', // Fond Soft UI 
    paddingTop: 50,
  },
  content: { 
    paddingHorizontal: 20, 
  },
  
  // --- HEADER ---
  headerTop: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 5,
    marginLeft: -5,
  },
  headerTitles: {
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },

  // --- ENCART INFO ---
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9', // Vert très clair
    padding: 15,
    borderRadius: 16,
    marginBottom: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },

  // --- CARTES APPLICATIONS ---
  appCard: {
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    // Ombres Soft UI
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  logoWrapper: {
    width: 50, 
    height: 50, 
    borderRadius: 14,
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15,
  },
  logoImage: {
    width: 30, 
    height: 30, 
  },
  appTexts: {
    flex: 1,
    justifyContent: 'center',
  },
  appName: {
    fontSize: 17, 
    fontWeight: '700', 
    color: '#1A1A1A',
    marginBottom: 2,
  },
  appStatus: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
});