import { COLORS } from '@/constants/colors';
import { auth, db } from "@/firebaseBD/firebaseConfig";
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  Timestamp,
  where
} from "firebase/firestore";
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
import { getCategoryConfig } from '../components/SharedComponents';

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
  const [pseudo, setPseudo] = useState("Éco-citoyen");

  // stockage des statistiques
  const [stats, setStats] = useState({ co2: 0, arbres: 0, dons: 0 });

  // semaine affichée (0 = semaine actuelle, -1 précédente, +1 suivante)
  const [weekOffset, setWeekOffset] = useState(0);
  const [greenDays, setGreenDays] = useState<Set<string>>(new Set());

  // calcule la semaine affichée (7 dates)
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

  // libellé du header semaine (ex: "10–16 Février")
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

  // Charger les jours "verts" depuis HistoriqueDefis
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setGreenDays(new Set());
      return;
    }

    const qWeek = query(
        collection(db, "HistoriqueDefis"),
        where("UserID", "==", user.uid),
        where("State", "==", "Valide")
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

      setPseudo(userSnap.data()?.pseudo || "Éco-citoyen");

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
              categorie: data.categorie ?? [],
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

    const qDefisValides = query(
        collection(db, "HistoriqueDefis"),
        where("UserID", "==", user.uid),
        where("State", "==", "Valide")
    );

    const unsubCo2 = onSnapshot(qDefisValides, async (snapshot) => {
      try {
        let totalCo2 = 0;
        const defisIds = snapshot.docs
            .map((d) => d.data()?.DefisID)
            .filter(Boolean) as string[];

        await Promise.all(
            defisIds.map(async (id) => {
              const defiSnap = await getDoc(doc(db, "Defis", String(id)));
              if (defiSnap.exists()) {
                const data = defiSnap.data() as any;
                const val = data?.co2;
                if (typeof val === "number" && !Number.isNaN(val)) {
                  totalCo2 += val;
                } else if (val !== undefined && val !== null) {
                  const parsed = Number(val);
                  if (!Number.isNaN(parsed)) totalCo2 += parsed;
                }
              }
            })
        );
        setStats((prev) => ({ ...prev, co2: Math.round(totalCo2 * 10) / 10 }));
      } catch (e) {
        setStats((prev) => ({ ...prev, co2: 0 }));
      }
    });

    const qReco = query(
        collection(db, "RecompenseUser"),
        where("id_user", "==", user.uid)
    );

    const unsubArbreDon = onSnapshot(qReco, (snapshot) => {
      let totalArbres = 0;
      let totalDons = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.id_recompense == 2) totalArbres += 1;
        if (data.id_asso && data.montant) totalDons += Number(data.montant);
      });
      setStats((prev) => ({ ...prev, arbres: totalArbres, dons: totalDons }));
    });

    return () => {
      unsubCo2();
      unsubArbreDon();
    };
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* HEADER DE BIENVENUE */}
        <View style={styles.welcomeHeader}>
          <View>
            <Text style={styles.greetingText}>Bonjour,</Text>
            <Text style={styles.pseudoText}>{pseudo} 🌱</Text>
          </View>
          <Pressable onPress={() => router.push('/profile')}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color="#65B369" />
            </View>
          </Pressable>
        </View>

        {/* SECTION 1 : DÉFIS EN COURS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Défis relevés</Text>

          {loadingDefis ? (
              <View style={styles.emptyBox}>
                <ActivityIndicator color={COLORS.primaryGreen} size="large" />
              </View>
          ) : defisEnCours.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="leaf-outline" size={40} color="#65B369" style={{marginBottom: 10}} />
                <Text style={styles.cardTitle}>Prêt à agir ?</Text>
                <Text style={styles.cardLabel}>Accepte un défi pour le voir ici 🙂</Text>
              </View>
          ) : (
              // ✅ LISTE VERTICALE AU LIEU DU SCROLL HORIZONTAL
              <View style={styles.verticalList}>
                {defisEnCours.map((d) => {
                  // On récupère la première catégorie pour l'icône principale (ou 'default')
                  const mainCategory = d.categorie && d.categorie.length > 0 ? d.categorie[0] : 'default';
                  const config = getCategoryConfig(mainCategory);

                  return (
                      <Pressable
                          key={d.id}
                          style={styles.defiCardRow}
                          onPress={() => goToDefi(d.id)}
                      >
                        {/* On applique la couleur et l'icône dynamiquement ! */}
                        <View style={[styles.defiCardIcon, { backgroundColor: config.bg }]}>
                          <Ionicons name={config.icon as any} size={22} color={config.color} />
                        </View>
                        
                        <View style={styles.defiCardTexts}>
                          <Text style={styles.cardTitle} numberOfLines={2}>{d.nom}</Text>
                          <Text style={styles.tapHint}>Voir le détail</Text>
                        </View>

                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                      </Pressable>
                  );
                })}
              </View>
          )}
        </View>

        {/* SECTION 2 : TA SEMAINE */}
        <View style={styles.section}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Ta semaine</Text>
            <Link href="../history" asChild>
              <Pressable>
                <Text style={styles.linkText}>Voir plus</Text>
              </Pressable>
            </Link>
          </View>

          <View style={styles.weekCard}>
            <View style={styles.weekHeader}>
              <Pressable onPress={() => setWeekOffset((w) => w - 1)} hitSlop={10}>
                <Ionicons name="chevron-back" size={24} color="#65B369" />
              </Pressable>
              <Text style={styles.weekLabel}>{weekLabel}</Text>
              <Pressable onPress={() => setWeekOffset((w) => w + 1)} hitSlop={10}>
                <Ionicons name="chevron-forward" size={24} color="#65B369" />
              </Pressable>
            </View>

            <View style={styles.weekContainer}>
              {days.map((day, index) => {
                const date = weekDates[index];
                const key = toKey(date);
                const isGreen = greenDays.has(key);

                return (
                    <View key={index} style={styles.dayColumn}>
                      <Text style={styles.dayText}>{day}</Text>
                      <View style={[styles.dayCircle, isGreen && styles.dayCircleGreen]}>
                        {isGreen ? (
                          <Ionicons name="checkmark-bold" size={18} color="#fff" />
                        ) : (
                          <Text style={styles.dayNumber}>{date.getDate()}</Text>
                        )}
                      </View>
                    </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* SECTION 3 : TES STATISTIQUES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ton impact écologique</Text>

          <StatCard
              value={`${stats.co2} kg`}
              label="CO2 évités"
              icon="cloudy-outline"
              iconColor="#4FC3F7"
              bgColor="#E1F5FE"
          />
          <StatCard
              value={`${stats.arbres}`}
              label="Arbres plantés"
              icon="leaf-outline"
              iconColor="#81C784"
              bgColor="#E8F5E9"
          />
          <StatCard
              value={`${stats.dons} €`}
              label="Dons réalisés"
              icon="heart-outline"
              iconColor="#E57373"
              bgColor="#FFEBEE"
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
  );
}

// --- NOUVEAU COMPOSANT STATCARD ---
const StatCard = ({ value, label, icon, iconColor, bgColor }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.iconWrapper, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={28} color={iconColor} />
      </View>
      <View style={styles.statTexts}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  
  // --- HEADER BIENVENUE ---
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 35,
  },
  greetingText: {
    fontSize: 16,
    color: '#666',
  },
  pseudoText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#000',
    marginTop: 2,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- SECTIONS ---
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 15,
  },

  // --- CARTES DÉFIS (LISTE VERTICALE) ---
  emptyBox: {
    height: 160,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  verticalList: {
    gap: 12, // Espace entre chaque défi de la liste
  },
  defiCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    // Ombres
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  defiCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  defiCardTexts: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
    lineHeight: 22,
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tapHint: {
    fontSize: 13,
    color: "#65B369",
    fontWeight: '600',
  },

  // --- SEMAINE CALENDRIER ---
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 15,
  },
  linkText: {
    color: '#65B369',
    fontSize: 15,
    fontWeight: '600',
  },
  weekCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  weekLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '700',
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    gap: 10,
  },
  dayText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleGreen: {
    backgroundColor: '#65B369',
    shadowColor: "#65B369",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
  },

  // --- STATISTIQUES ---
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 15,
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  statTexts: {
    flex: 1,
  },
  statValue: {
    fontWeight: '900',
    fontSize: 22,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
});