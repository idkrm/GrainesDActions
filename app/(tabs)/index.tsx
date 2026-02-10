import { Link, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { COLORS } from '@/constants/colors';

import { auth, db } from "@/firebaseBD/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

interface Defi {
  nom?: string;
  co2?: number;
  difficulte?: number;
  categorie?: string[];
}

type DefiCard = {
  id: string;
  nom: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const [loadingDefis, setLoadingDefis] = useState(true);
  const [defisEnCours, setDefisEnCours] = useState<DefiCard[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadDefisEnCours = useCallback(async () => {
    try {
      setLoadingDefis(true);

      const user = auth.currentUser;
      if (!user) {
        setDefisEnCours([]);
        return;
      }

      const userSnap = await getDoc(doc(db, "Users", user.uid));
      if (!userSnap.exists()) {
        setDefisEnCours([]);
        return;
      }

      const defiIds = (userSnap.data()?.defi_en_cours ?? []) as string[];

      if (!defiIds || defiIds.length === 0) {
        setDefisEnCours([]);
        return;
      }

      const snaps = await Promise.all(
          defiIds.map((defiId) => getDoc(doc(db, "Defis", String(defiId))))
      );

      const cards: DefiCard[] = snaps
          .filter((s) => s.exists())
          .map((s) => {
            const data = s.data() as Defi;
            return {
              id: s.id,
              nom: data.nom ?? "Défi sans nom",
            };
          });

      setDefisEnCours(cards);
    } catch (e) {
      console.log("HOME LOAD DEFIS ERROR =>", e);
      setDefisEnCours([]);
    } finally {
      setLoadingDefis(false);
    }
  }, []);

  useEffect(() => {
    loadDefisEnCours();
  }, [loadDefisEnCours]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDefisEnCours();
    setRefreshing(false);
  }, [loadDefisEnCours]);

  const goToDefi = (defiId: string) => {
    router.push({
      pathname: "/(routes)/challengeDescription",
      params: { id: defiId },
    });
  };

  return (
      <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
      >

        {/* SECTION 1 : DÉFIS EN COURS (scroll horizontal) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Défis relevés</Text>

          {loadingDefis ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator />
              </View>
          ) : defisEnCours.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.cardLabel}>Aucun défi en cours</Text>
                <Text style={styles.cardTitle}>Accepte un défi pour le voir ici 🙂</Text>
              </View>
          ) : (
              <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
              >
                {defisEnCours.map((d) => (
                    <Pressable
                        key={d.id}
                        style={styles.defiCard}
                        onPress={() => goToDefi(d.id)}
                    >
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {d.nom}
                      </Text>

                      <Text style={styles.tapHint}>Appuie pour voir le détail</Text>
                    </Pressable>
                ))}
              </ScrollView>
          )}
        </View>

        {/* SECTION 2 : "TA SEMAINE" */}
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
                  <View style={styles.dayCircle} />
                </View>
            ))}
          </View>
        </View>

        {/* SECTION 3 : "TES STATISTIQUES" */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tes statistiques</Text>

          <StatCard
              value="XX kg"
              label="de CO2 évités"
              borderColor={COLORS.primaryBlue}
          />
          <StatCard
              value="XX"
              label="arbres plantés"
              borderColor={COLORS.primaryGreen}
          />
          <StatCard
              value="XX€"
              label="de dons réalisés"
              borderColor={COLORS.primaryYellow}
          />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
  );
}

const StatCard = ({ value, label, borderColor }: { value: string, label: string, borderColor: string }) => (
    <View style={[styles.statCard, { borderColor: borderColor }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
);

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

  loadingBox: {
    height: 140,
    borderRadius: 20,
    backgroundColor: COLORS.lightGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    height: 140,
    borderRadius: 20,
    backgroundColor: COLORS.lightGreen,
    padding: 16,
    justifyContent: "center",
    gap: 6,
  },
  horizontalList: {
    paddingVertical: 2,
  },
  defiCard: {
    backgroundColor: COLORS.lightGreen,
    height: 140,
    width: 260,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'center',
    marginRight: 12,
  },
  cardLabel: {
    fontSize: 13,
    color: '#2D3A2D',
    opacity: 0.8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  tapHint: {
    marginTop: 10,
    fontSize: 12,
    color: "#2D3A2D",
    opacity: 0.7,
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
