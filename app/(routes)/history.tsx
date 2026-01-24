import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';

export default function HistoryScreen() {
  const router = useRouter();
  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  // On génère 28 cercles pour simuler un mois (4 semaines)
  const daysInMonth = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* HEADER PERSONNALISÉ */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </Pressable>
        <Text style={styles.headerTitle}>Modifier mon profil</Text>
      </View>

      {/* SECTION 1 : LES CARTES STATS */}
      <View style={styles.statsContainer}>
        {/* Carte Jaune (Ce mois-ci) */}
        <View style={[styles.card, { borderColor: COLORS.primaryYellow }]}>
          <Text style={styles.cardTitle}>Ce mois-ci</Text>
          <Text style={styles.cardValue}>XX</Text>
          <Text style={styles.cardLabel}>défis réalisés</Text>
        </View>

        {/* Carte Rouge (Total) */}
        <View style={[styles.card, { borderColor: COLORS.softRed }]}>
          <Text style={styles.cardTitle}>Total</Text>
          <Text style={styles.cardValue}>XX</Text>
          <Text style={styles.cardLabel}>défis réalisés</Text>
        </View>
      </View>

      {/* SECTION 2 : CALENDRIER */}
      <View style={styles.calendarSection}>
        
        {/* Sélecteur de mois */}
        <View style={styles.monthSelector}>
          <Pressable>
            <Text style={styles.arrowText}>{'<'}</Text>
          </Pressable>
          <Text style={styles.monthText}>[Mois]</Text>
          <Pressable>
            <Text style={styles.arrowText}>{'>'}</Text>
          </Pressable>
        </View>

        {/* Jours de la semaine */}
        <View style={styles.daysHeader}>
          {daysOfWeek.map((day, index) => (
            <Text key={index} style={styles.dayHeaderText}>{day}</Text>
          ))}
        </View>

        {/* Grille des cercles */}
        <View style={styles.daysGrid}>
          {daysInMonth.map((day, index) => (
            <View key={index} style={styles.dayCell}>
              {/* Le cercle gris */}
              <View style={styles.dayCircle} />
            </View>
          ))}
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 40,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  // --- STYLE CARTES ---
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    marginTop: 10,
  },
  card: {
    width: '47%', // Pour que les deux tiennent sur la ligne avec un espace
    borderWidth: 2,
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center', // Centre le texte horizontalement
    height: 140,
    justifyContent: 'center', // Centre verticalement
  },
  cardTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    alignSelf: 'flex-start', // Le titre est aligné à gauche dans la carte
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },

  // --- STYLE CALENDRIER ---
  calendarSection: {
    marginTop: 10,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 20,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  arrowText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  dayHeaderText: {
    width: 40, // Largeur fixe pour aligner avec les cercles
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Permet de passer à la ligne automatiquement
    justifyContent: 'space-between',
    rowGap: 15, // Espace vertical entre les lignes
  },
  dayCell: {
    width: 40, // Même largeur que le header
    alignItems: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E0E0', // Gris clair
  },
});