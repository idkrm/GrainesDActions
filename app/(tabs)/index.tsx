import { COLORS } from '@/constants/colors';
import { Link, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

// IMPORTS FIREBASE
import { auth, db } from "@/firebaseBD/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  Timestamp
} from "firebase/firestore";

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

// Helpers dates (Lundi=0..Dimanche=6)
const mondayStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Lundi=0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const toKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export default function HomeScreen() {
  const router = useRouter();
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const [loadingDefis, setLoadingDefis] = useState(true);
  const [defisEnCours, setDefisEnCours] = useState<DefiCard[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // stockage des statistiques
  const [stats, setStats] = useState({ co2: 0, arbres: 0, dons: 0 });

  // ✅ semaine affichée (0 = semaine actuelle, -1 précédente, +1 suivante)
  const [weekOffset, setWeekOffset] = useState(0);

  // ✅ jours verts: Set<"YYYY-MM-DD"> où l'user a un défi validé
  const [greenDays, setGreenDays] = useState<Set<string>>(new Set());

  // ✅ calcule la semaine affichée (7 dates)
  const weekDates = useMemo(() => {
    const today = new Date();
    const base = new Date(today);
    base.setDate(base.getDate() + weekOffset * 7);

    const start = mondayStartOfWeek(base);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  // ✅ libellé du header semaine (ex: "10–16 Février")
  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];

    const startDay = start.getDate();
    const endDay = end.getDate();

    const monthName = (d: Date) =>
        d.toLocaleDateString('fr-FR', { month: 'long' });

    const startMonth = monthName(start);
    const endMonth = monthName(end);

    if (start.getMonth() !== end.getMonth()) {
      return `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
    }
    return `${startDay}–${endDay} ${startMonth}`;
  }, [weekDates]);

  // ✅ Charger les jours "verts" depuis HistoriqueDefis (défis validés)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setGreenDays(new Set());
      return;
    }

    const qWeek = query(
        collection(db, "HistoriqueDefis"),
        where("UserID", "==", user.uid),
        where("State", "==", "Valide") // 🔁 si tu veux: "Terminé"
    );

    const unsub = onSnapshot(qWeek, (snapshot) => {
      const set = new Set<string>();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const ts: Timestamp | undefined = data?.DateValidation;
        if (!ts) return;

        set.add(toKey(ts.toDate())); // "YYYY-MM-DD"
      });

      setGreenDays(set);
    });

    return () => unsub();
  }, []);

  // chargement des defis
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

  // calcul des stats
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // ✅ co2: uniquement défis VALIDÉS (admin)
    const qDefisValides = query(
        collection(db, "HistoriqueDefis"),
        where("UserID", "==", user.uid),
        where("State", "==", "Valide")
    );

    const unsubCo2 = onSnapshot(qDefisValides, async (snapshot) => {
      try {
        let totalCo2 = 0;

        // ids des défis validés
        const defisIds = snapshot.docs
            .map((d) => d.data()?.DefisID)
            .filter(Boolean) as string[];

        // récupérer chaque défi et additionner son co2
        await Promise.all(
            defisIds.map(async (id) => {
              const defiSnap = await getDoc(doc(db, "Defis", String(id)));
              if (defiSnap.exists()) {
                const data = defiSnap.data() as any;
                const val = data?.co2;

                // ⚠️ important: co2 peut être 0, donc on teste number
                if (typeof val === "number" && !Number.isNaN(val)) {
                  totalCo2 += val;
                } else if (val !== undefined && val !== null) {
                  // au cas où co2 serait stocké en string
                  const parsed = Number(val);
                  if (!Number.isNaN(parsed)) totalCo2 += parsed;
                }
              }
            })
        );

        setStats((prev) => ({ ...prev, co2: Math.round(totalCo2 * 10) / 10 }));
      } catch (e) {
        console.log("STAT CO2 ERROR =>", e);
        setStats((prev) => ({ ...prev, co2: 0 }));
      }
    });

    // arbres et dons
    const qReco = query(
        collection(db, "RecompenseUser"),
        where("id_user", "==", user.uid)
    );

    const unsubArbreDon = onSnapshot(qReco, (snapshot) => {
      let totalArbres = 0;
      let totalDons = 0;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        // arbres
        if (data.id_recompense == 2) totalArbres += 1;

        // dons
        if (data.id_asso && data.montant) totalDons += Number(data.montant);
      });

      setStats((prev) => ({ ...prev, arbres: totalArbres, dons: totalDons }));
    });

    return () => {
      unsubCo2();
      unsubArbreDon();
    };
  }, []);


  // chargement des defis en cours
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

        {/* SECTION 1 : DÉFIS EN COURS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Défis relevés</Text>

          {loadingDefis ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={COLORS.primaryGreen} />
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

        {/* SECTION 2 : TA SEMAINE */}
        <View style={styles.section}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Ta semaine</Text>
            <Link href="../history" asChild>
              <Pressable>
                <Text style={styles.linkText}>Voir plus {'>'}</Text>
              </Pressable>
            </Link>
          </View>

          {/* NAV SEMAINE */}
          <View style={styles.weekHeader}>
            <Pressable onPress={() => setWeekOffset((w) => w - 1)} hitSlop={10}>
              <Text style={styles.weekArrow}>{'<'}</Text>
            </Pressable>

            <Text style={styles.weekLabel}>{weekLabel}</Text>

            <Pressable onPress={() => setWeekOffset((w) => w + 1)} hitSlop={10}>
              <Text style={styles.weekArrow}>{'>'}</Text>
            </Pressable>
          </View>

          {/* JOURS + NUMÉRO + VERT SI DÉFI */}
          <View style={styles.weekContainer}>
            {days.map((day, index) => {
              const date = weekDates[index];
              const key = toKey(date);
              const isGreen = greenDays.has(key);

              return (
                  <View key={index} style={styles.dayColumn}>
                    <Text style={styles.dayText}>{day}</Text>

                    <View style={[styles.dayCircle, isGreen && styles.dayCircleGreen]}>
                      <Text style={[styles.dayNumber, isGreen && styles.dayNumberGreen]}>
                        {date.getDate()}
                      </Text>
                    </View>
                  </View>
              );
            })}
          </View>
        </View>

        {/* SECTION 3 : TES STATISTIQUES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tes statistiques</Text>

          <StatCard
              value={`${stats.co2} kg`}
              label="de CO2 évités"
              borderColor={COLORS.primaryBlue}
          />
          <StatCard
              value={`${stats.arbres}`}
              label="arbres plantés"
              borderColor={COLORS.primaryGreen}
          />
          <StatCard
              value={`${stats.dons}€`}
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

  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  weekArrow: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  weekLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleGreen: {
    backgroundColor: '#65B369',
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  dayNumberGreen: {
    color: '#fff',
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
