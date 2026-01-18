import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { COLORS } from './constants/colors';

export default function EditProfileScreen() {
  const router = useRouter();
  
  // États pour les switches
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [publicEnabled, setPublicEnabled] = useState(true);

  return (
    <View style={styles.container}>
      
      {/* HEADER PERSONNALISÉ */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </Pressable>
        <Text style={styles.headerTitle}>Modifier mon profil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* SECTION PROFIL (CADRE VERT) */}
        <Text style={styles.sectionLabel}>Profil</Text>
        <View style={styles.greenCard}>
          
          {/* Ligne Pseudo */}
          <View style={styles.row}>
            <View style={{flex: 1}}>
              <Text style={styles.label}>Pseudo : blabla</Text>
            </View>
            <Pressable>
              <Ionicons name="create-outline" size={24} color="#333" />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Ligne Email */}
          <View style={styles.row}>
            <View style={{flex: 1}}>
              <Text style={styles.label}>Adresse mail : blabla@bla.fr</Text>
            </View>
            <Pressable>
              <Ionicons name="create-outline" size={24} color="#333" />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Ligne Mot de passe */}
          <View style={styles.row}>
            <View style={{flex: 1}}>
              <Text style={styles.label}>Mot de passe : ●●●●●●●●</Text>
            </View>
            <Pressable>
              <Ionicons name="create-outline" size={24} color="#333" />
            </Pressable>
          </View>

        </View>

        {/* SECTION NOTIFICATIONS */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Autoriser les notifications de défis</Text>
            <Switch
              trackColor={{ false: "#E0E0E0", true: COLORS.primaryGreen }}
              thumbColor={"#fff"}
              onValueChange={setNotifEnabled}
              value={notifEnabled}
            />
          </View>
        </View>

        {/* SECTION CONFIDENTIALITÉ */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Confidentialité</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              Je souhaite apparaître dans le classement des utilisateurs
            </Text>
            <Switch
              trackColor={{ false: "#E0E0E0", true: COLORS.primaryGreen }}
              thumbColor={"#fff"}
              onValueChange={setPublicEnabled}
              value={publicEnabled}
            />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60, // Marge pour simuler la Safe Area du haut
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
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
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  
  // CADRE VERT
  greenCard: {
    borderWidth: 1,
    borderColor: COLORS.primaryGreen,
    borderRadius: 15,
    padding: 15,
    marginBottom: 30,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  label: {
    fontSize: 15,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },

  // SWITCHES
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    marginRight: 10,
  },
});