import { db } from '@/firebaseBD/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

interface Users {
  id: string;
  nb_points: number;
  pseudo: string;
  is_public?: boolean;
}

export default function LeaderboardScreen() {
  const [classement, setClassement] = useState<Users[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = collection(db, 'Users');

    const req = query(
        usersRef,
        where("is_public", "==", true),
        orderBy("nb_points", "desc"),
        limit(15)
    );

    const unsub = onSnapshot(
        req,
        (snapshot) => {
          const users: Users[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              pseudo: data.pseudo || "Éco-citoyen",
              nb_points: Number(data.nb_points || 0),
              is_public: data.is_public ?? false,
            };
          });

          setClassement(users);
          setLoading(false);
        },
        (error) => {
          console.error("Erreur lors du chargement du classement :", error);
          setLoading(false);
        }
    );

    return () => unsub();
  }, []);

  const first = classement[0];
  const second = classement[1];
  const third = classement[2];
  const restOfList = classement.slice(3);

  return (
      <View style={styles.container}>
        {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#65B369" />
            </View>
        ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {classement.length > 0 && (
                  <View style={styles.podiumContainer}>
                    <PodiumBar
                        rank={2}
                        username={second?.pseudo}
                        points={second?.nb_points}
                        color="#81C784"
                        height={120}
                    />

                    <PodiumBar
                        rank={1}
                        username={first?.pseudo}
                        points={first?.nb_points}
                        color="#4FC3F7"
                        height={160}
                        isFirst
                    />

                    <PodiumBar
                        rank={3}
                        username={third?.pseudo}
                        points={third?.nb_points}
                        color="#FFD54F"
                        height={90}
                    />
                  </View>
              )}

              <View style={styles.listContainer}>
                {restOfList.map((item, index) => (
                    <View key={item.id} style={styles.listItemCard}>
                      <View style={styles.rankCircle}>
                        <Text style={styles.rankText}>{index + 4}</Text>
                      </View>

                      <Text style={styles.listPseudo} numberOfLines={1}>
                        {item.pseudo}
                      </Text>

                      <View style={styles.pointsBadge}>
                        <Ionicons name="star" size={12} color="#F57C00" style={{ marginRight: 4 }} />
                        <Text style={styles.pointsText}>{item.nb_points} pts</Text>
                      </View>
                    </View>
                ))}

                {classement.length === 0 && (
                    <Text style={styles.emptyText}>
                      Aucun utilisateur public classé pour le moment.
                    </Text>
                )}
              </View>
            </ScrollView>
        )}
      </View>
  );
}

const PodiumBar = ({ rank, points, color, height, username, isFirst }: any) => {
  if (!username) {
    return <View style={{ width: 90 }} />;
  }

  return (
      <View style={styles.barWrapper}>
        {isFirst && (
            <Ionicons name="crown" size={32} color="#FFD700" style={styles.crown} />
        )}

        <View style={[styles.avatar, { borderColor: color }]}>
          <Ionicons name="person" size={24} color={color} />
        </View>

        <View style={[styles.bar, { backgroundColor: color, height }]}>
          <Text style={styles.barRank}>{rank}</Text>
        </View>

        <Text style={styles.podiumPseudo} numberOfLines={1}>
          {username}
        </Text>

        <View style={styles.podiumPointsBadge}>
          <Text style={styles.podiumPointsText}>{points || 0} pts</Text>
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 50,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 90,
  },
  crown: {
    position: 'absolute',
    top: -45,
    zIndex: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -15,
    zIndex: 2,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  barRank: {
    fontSize: 32,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.7)',
  },
  podiumPseudo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  podiumPointsBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  podiumPointsText: {
    fontSize: 11,
    color: '#666',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  listItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  rankCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#888',
  },
  listPseudo: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#E65100',
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    marginTop: 20,
    fontStyle: 'italic',
  },
});