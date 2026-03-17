import { auth, db } from "@/firebaseBD/firebaseConfig";
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
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

// --- INTERFACES ---
interface Defi {
  nom?: string;
  co2?: number;
  difficulte?: number;
  categorie?: number[]; // IDs numériques maintenant
}

type DefiCard = {
  id: string;
  nom: string;
  categorieId: number | null;
};

// --- HELPERS ---
const mondayStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; 
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
  
  // Mapping pour transformer l'ID (int) en Nom (string)
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});

  const [stats, setStats] = useState({ co2: 0, arbres: 0, dons: 0 });
  const [weekOffset, setWeekOffset] = useState(0);
  const [greenDays, setGreenDays] = useState<Set<string>>(new Set());

  // --- 1. CHARGEMENT DES NOMS DE CATÉGORIES ---
  useEffect(() => {
    const fetchCategoryNames = async () => {
      try {
        const snap = await getDocs(collection(db, "Categories"));
        const mapping: Record<number, string> = {};
        snap.forEach(docSnap => {
          const data = docSnap.data();
          // On utilise l'ID du document comme clé numérique
          mapping[Number(docSnap.id)] = data.nom;
        });
        setCategoryMap(mapping);
      } catch (e) {
        console.error("Erreur mapping catégories:", e);
      }
    };
    fetchCategoryNames();
  }, []);

  // --- 2. LOGIQUE CALENDRIER ---
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

  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    const monthName = (d: Date) => d.toLocaleDateString('fr-FR', { month: 'long' });
    if (start.getMonth() !== end.getMonth()) {
      return `${start.getDate()} ${monthName(start)} – ${end.getDate()} ${monthName(end)}`;
    }
    return `${start.getDate()}–${end.getDate()} ${monthName(start)}`;
  }, [weekDates]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const qWeek = query(
        collection(db, "HistoriqueDefis"),
        where("UserID", "==", user.uid),
        where("State", "==", "Valide")
    );
    return onSnapshot(qWeek, (snapshot) => {
      const set = new Set<string>();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data?.DateValidation) set.add(toKey(data.DateValidation.toDate()));
      });
      setGreenDays(set);
    });
  }, []);

  // --- 3. CHARGEMENT DÉFIS EN COURS ---
  const loadDefisEnCours = useCallback(async () => {
    try {
      setLoadingDefis(true);
      const user = auth.currentUser;
      if (!user) return;

      const userSnap = await getDoc(doc(db, "Users", user.uid));
      if (!userSnap.exists()) return;

      setPseudo(userSnap.data()?.pseudo || "Éco-citoyen");
      const defiIds = (userSnap.data()?.defi_en_cours ?? []) as string[];

      if (defiIds.length === 0) {
        setDefisEnCours([]);
        return;
      }

      const snaps = await Promise.all(
          defiIds.map((id) => getDoc(doc(db, "Defis", String(id))))
      );

      const cards: DefiCard[] = snaps
          .filter((s) => s.exists())
          .map((s) => {
            const data = s.data() as Defi;
            return {
              id: s.id,
              nom: data.nom ?? "Défi sans nom",
              categorieId: data.categorie && data.categorie.length > 0 ? data.categorie[0] : null,
            };
          });

      setDefisEnCours(cards);
    } catch (e) {
      console.log("Erreur chargement défis:", e);
    } finally {
      setLoadingDefis(false);
    }
  }, []);

  // --- 4. CALCUL DES STATISTIQUES ---
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // CO2
    const qDefisValides = query(collection(db, "HistoriqueDefis"), where("UserID", "==", user.uid), where("State", "==", "Valide"));
    const unsubCo2 = onSnapshot(qDefisValides, async (snapshot) => {
        let totalCo2 = 0;
        for (const d of snapshot.docs) {
            const defiSnap = await getDoc(doc(db, "Defis", String(d.data().DefisID)));
            if (defiSnap.exists()) totalCo2 += Number(defiSnap.data().co2 || 0);
        }
        setStats(prev => ({ ...prev, co2: Math.round(totalCo2 * 10) / 10 }));
    });

    // Arbres et Dons
    const qReco = query(collection(db, "RecompenseUser"), where("id_user", "==", user.uid));
    const unsubArbreDon = onSnapshot(qReco, (snapshot) => {
      let totalArbres = 0;
      let totalDons = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.id_recompense == 2) totalArbres += 1;
        const m = data.montant_euros || data.montant;
        if (data.id_asso && m) totalDons += Number(m);
      });
      setStats(prev => ({ ...prev, arbres: totalArbres, dons: totalDons }));
    });

    return () => { unsubCo2(); unsubArbreDon(); };
  }, []);

  useEffect(() => { loadDefisEnCours(); }, [loadDefisEnCours]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDefisEnCours();
    setRefreshing(false);
  }, [loadDefisEnCours]);

  const goToDefi = (defiId: string) => {
    router.push({ pathname: "/(routes)/challengeDescription", params: { id: defiId } });
  };

  return (
      <ScrollView 
        style={styles.container} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* HEADER DE BIENVENUE */}
        <View style={styles.welcomeHeader}>
          <View>
            <Text style={styles.greetingText}>Bonjour,</Text>
            <Text style={styles.pseudoText}>{pseudo} 🌱</Text>
          </View>
          <Pressable onPress={() => router.push('/profile')}>
            <View style={styles.avatarPlaceholder}><Ionicons name="person" size={24} color="#65B369" /></View>
          </Pressable>
        </View>

        {/* SECTION 1 : DÉFIS EN COURS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Défis relevés</Text>

          {loadingDefis ? (
              <ActivityIndicator color="#65B369" size="large" />
          ) : defisEnCours.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="leaf-outline" size={40} color="#65B369" />
                <Text style={styles.cardTitle}>Prêt à agir ?</Text>
              </View>
          ) : (
              // ✅ LISTE VERTICALE AU LIEU DU SCROLL HORIZONTAL
              <View style={styles.verticalList}>
                {defisEnCours.map((d) => {
                  // On récupère le nom textuel via l'ID
                  const catName = d.categorieId !== null ? categoryMap[d.categorieId] : "Général";
                  const config = getCategoryConfig(catName?.toLowerCase() || 'default');

                  return (
                      <Pressable key={d.id} style={styles.defiCardRow} onPress={() => goToDefi(d.id)}>
                        <View style={[styles.defiCardIcon, { backgroundColor: config.bg }]}>
                          <Ionicons name={config.icon as any} size={22} color={config.color} />
                        </View>
                        
                        <View style={styles.defiCardTexts}>
                          <Text style={styles.cardTitle} numberOfLines={1}>{d.nom}</Text>
                          <Text style={styles.tapHint}>{catName || "Défi"}</Text>
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
            <Link href="../history" asChild><Pressable><Text style={styles.linkText}>Voir plus</Text></Pressable></Link>
          </View>

          <View style={styles.weekCard}>
            <View style={styles.weekHeader}>
              <Pressable onPress={() => setWeekOffset(w => w - 1)}><Ionicons name="chevron-back" size={24} color="#65B369" /></Pressable>
              <Text style={styles.weekLabel}>{weekLabel}</Text>
              <Pressable onPress={() => setWeekOffset(w => w + 1)}><Ionicons name="chevron-forward" size={24} color="#65B369" /></Pressable>
            </View>

            <View style={styles.weekContainer}>
              {days.map((day, i) => {
                const date = weekDates[i];
                const isGreen = greenDays.has(toKey(date));
                return (
                  <View key={i} style={styles.dayColumn}>
                    <Text style={styles.dayText}>{day}</Text>
                    <View style={[styles.dayCircle, isGreen && styles.dayCircleGreen]}>
                      {isGreen ? <Ionicons name="checkmark" size={18} color="#fff" /> : <Text style={styles.dayNumber}>{date.getDate()}</Text>}
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
          <StatCard value={`${stats.co2} kg`} label="CO2 évités" icon="cloudy-outline" iconColor="#4FC3F7" bgColor="#E1F5FE" />
          <StatCard value={`${stats.arbres}`} label="Arbres plantés" icon="leaf-outline" iconColor="#81C784" bgColor="#E8F5E9" />
          <StatCard value={`${stats.dons} €`} label="Dons réalisés" icon="heart-outline" iconColor="#E57373" bgColor="#FFEBEE" />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
  );
}

// --- NOUVEAU COMPOSANT STATCARD ---
const StatCard = ({ value, label, icon, iconColor, bgColor }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.iconWrapper, { backgroundColor: bgColor }]}><Ionicons name={icon} size={28} color={iconColor} /></View>
      <View style={styles.statTexts}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', paddingHorizontal: 20, paddingTop: 10 },
  welcomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 35 },
  greetingText: { fontSize: 16, color: '#666' },
  pseudoText: { fontSize: 26, fontWeight: '900', color: '#000' },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  section: { marginBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 15 },
  emptyBox: { height: 120, borderRadius: 24, backgroundColor: '#E8F5E9', justifyContent: "center", alignItems: "center" },
  verticalList: { gap: 12 },
  defiCardRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 5 },
  defiCardIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  defiCardTexts: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  tapHint: { fontSize: 12, color: "#65B369", fontWeight: '600' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 15 },
  linkText: { color: '#65B369', fontWeight: '600' },
  weekCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, elevation: 2 },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  weekLabel: { fontSize: 16, fontWeight: '700' },
  weekContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  dayColumn: { alignItems: 'center', gap: 8 },
  dayText: { color: '#888', fontSize: 12 },
  dayCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  dayCircleGreen: { backgroundColor: '#65B369' },
  dayNumber: { fontSize: 13, fontWeight: '700' },
  statCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 15, backgroundColor: '#fff', elevation: 2 },
  iconWrapper: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  statTexts: { flex: 1 },
  statValue: { fontWeight: '900', fontSize: 22 },
  statLabel: { fontSize: 14, color: '#666' },
});