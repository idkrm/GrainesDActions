import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<'week' | 'month'>('week');

  // TO DO récupérer les données des users
  const data = [
    { id: 1, name: 'User1', points: 1250, rank: 1 },
    { id: 2, name: 'User2', points: 980, rank: 2 },
    { id: 3, name: 'User3', points: 850, rank: 3 },
    { id: 4, name: 'User4', points: 720, rank: 4 },
    { id: 5, name: 'User5', points: 650, rank: 5 },
    { id: 6, name: 'User6', points: 500, rank: 6 },
    { id: 7, name: 'User7', points: 430, rank: 7 },
  ];

  // On sépare le podium (top 3) du reste de la liste
  const topThree = data.slice(0, 3);
  const restOfList = data.slice(3);

  return (
    <View style={styles.container}>
      
      {/* 1. LE SÉLECTEUR (par semaine ou mois) */}
      <View style={styles.toggleContainer}>
        <Pressable 
          style={[styles.toggleButton, activeTab === 'week' && styles.activeToggle]}
          onPress={() => setActiveTab('week')}
        >
          <Text style={[styles.toggleText, activeTab === 'week' ? styles.activeText : styles.inactiveText]}>
            Cette semaine
          </Text>
        </Pressable>

        <Pressable 
          style={[styles.toggleButton, activeTab === 'month' && styles.activeToggle]}
          onPress={() => setActiveTab('month')}
        >
          <Text style={[styles.toggleText, activeTab === 'month' ? styles.activeText : styles.inactiveText]}>
            Ce mois
          </Text>
        </Pressable>
      </View>

      {/* 2. LE PODIUM */}
      <View style={styles.podiumContainer}>
        {/* RANK 2 */}
        <PodiumBar 
          rank={2} 
          points={topThree[1].points} 
          color={COLORS.primaryGreen} 
          height={160} 
        />

        {/* RANK 1 */}
        <PodiumBar 
          rank={1} 
          points={topThree[0].points} 
          color={COLORS.primaryBlue}
          height={220} 
          isFirst
        />

        {/* RANK 3 */}
        <PodiumBar 
          rank={3} 
          points={topThree[2].points} 
          color={COLORS.primaryYellow} 
          height={120} 
        />
      </View>

      {/* 3. LA LISTE (Reste du classement) */}
      <View style={styles.listContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {restOfList.map((item, index) => (
            <View key={item.id} style={styles.listItem}>
              <Text style={styles.rankText}>#{item.rank}</Text>
              <View style={{flex: 1}} /> 
              <Text style={styles.pointsText}>[{item.points} points]</Text>
            </View>
          ))}
          <View style={{height: 20}} />
        </ScrollView>
      </View>

    </View>
  );
}

// composant pour les barres du podium
const PodiumBar = ({ rank, points, color, height, isFirst }: any) => (
  <View style={styles.barWrapper}>
    <View style={[styles.bar, { backgroundColor: color, height: height }]}>
      <Text style={styles.barRank}>{rank}</Text>
    </View>
    <Text style={styles.barPoints}>[{points} pts]</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', 
    paddingTop: 20,
  },
  
  // --- TOGGLE ---
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFE0B2',
    borderRadius: 25,
    marginHorizontal: 40,
    marginBottom: 30,
    padding: 4,
    height: 40,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000', 
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeText: {
    color: '#333',
    fontWeight: 'bold',
  },
  inactiveText: {
    color: '#888',
  },

  // --- PODIUM ---
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end', 
    gap: 15, 
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 80, 
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 5,
  },
  barRank: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  barPoints: {
    fontSize: 12,
    color: '#666',
  },

  // --- LISTE ---
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 5,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  rankText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
  },
  pointsText: {
    fontSize: 14,
    color: '#666',
  },
});