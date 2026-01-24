import { Link } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';

export default function HomeScreen() {
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* SECTION 1 : DÉFI RELEVÉ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Défi relevé</Text>
        {/* TODO récupérer le défi qu'il a accepté et l'afficher ici */}
        <View style={styles.bigGreenCard} />
      </View>

      {/* SECTION 2 : "TA SEMAINE" A SUPPRIMER ? (trop compliqué à faire pour voir par mois) */}
      {/* TODO récupérer les dates des défis qu'il a réaliser puis changer le rond de couleur (là c gris changer en vert par exemple) 
        A SUPPRIMER ? (compliqué à faire pour voir par mois) */}
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Ta semaine</Text>
          <Link href="../history" asChild>
            <Pressable>
              <Text style={styles.linkText}>Voir plus {'>'}</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.weekContainer}>
          {days.map((day, index) => (
            <View key={index} style={styles.dayColumn}>
              <Text style={styles.dayText}>{day}</Text>
              {/* Le cercle gris (à changer dynamiquement plus tard) */}
              <View style={styles.dayCircle} />
            </View>
          ))}
        </View>
      </View>

      {/* SECTION 3 : "TES STATISTIQUES" */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tes statistiques</Text>

        <StatCard
          value="XX kg" // TODO récupérer sa quantité de co2 évités
          label="de CO2 évités"
          borderColor={COLORS.primaryBlue}
        />
        <StatCard
          value="XX" // TODO récupérer son nombre d'arbre plantés
          label="arbres plantés"
          borderColor={COLORS.primaryGreen}
        />
        <StatCard
          value="XX€" // TODO récupérer combien d'€ de dons il a réalisé
          label="de dons réalisés"
          borderColor={COLORS.primaryYellow}
        />
      </View>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// --- COMPOSANT POUR LES CARTES STATS ---
const StatCard = ({ value, label, borderColor }: { value: string, label: string, borderColor: string }) => (
  <View style={[styles.statCard, { borderColor: borderColor }]}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  section: {
    marginBottom: 50,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },

  bigGreenCard: {
    backgroundColor: COLORS.lightGreen,
    height: 140,
    borderRadius: 20,
    width: '100%',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  linkText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    gap: 8, 
  },
  dayText: {
    color: '#666',
    fontSize: 12,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
  },

  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    borderWidth: 2, 
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 15, 
    minWidth: 60,
  },
  statLabel: {
    fontSize: 16,
    color: '#333',
  },
});