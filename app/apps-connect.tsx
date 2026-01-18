import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function ConnectAppsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </Pressable>
        <Text style={styles.headerTitle}>Connexion</Text>
      </View>

      <View style={styles.content}>
        
        {/* BOUTON STRAVA */}
        <Pressable style={styles.appButton}>
          {/* Remplacer cette View par ton Image Strava */}
          <View style={[styles.logoPlaceholder, { backgroundColor: '#FC4C02' }]}>
             <MaterialCommunityIcons name="dots-grid" size={24} color="white" />
          </View>
          
          <Text style={styles.appText}>Strava</Text>
        </Pressable>

        {/* BOUTON FITBIT */}
        <Pressable style={styles.appButton}>
          {/* Remplacer cette View par ton Image Fitbit */}
          <View style={[styles.logoPlaceholder, { backgroundColor: '#fff' }]}>
            {/* Simulation du logo points turquoises */}
            <MaterialCommunityIcons name="dots-grid" size={28} color="#00B0B9" />
          </View>
          
          <Text style={styles.appText}>fitbit</Text>
        </Pressable>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 50,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
    gap: 20, // Espace entre les boutons
  },
  
  // STYLE BOUTONS
  appButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  appText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, 
  },
});