import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { COLORS } from '../../constants/colors';

import { auth, db } from '@/firebaseBD/firebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';

// Helpers date
const pad2 = (n: number) => String(n).padStart(2, '0');
const toKey = (d: Date) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const monthNamesFR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// Lundi=0 ... Dimanche=6
const mondayIndex = (date: Date) => (date.getDay() + 6) % 7;

export default function HistoryScreen() {
  const router = useRouter();

  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const [loading, setLoading] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(true);

  const [totalValide, setTotalValide] = useState(0);
  const [moisValide, setMoisValide] = useState(0);

  // Mois affiché (0..11) + année
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());

  // Set des jours "verts" pour le mois affiché (clé YYYY-MM-DD)
  const [greenDays, setGreenDays] = useState<Set<string>>(new Set());

  const startOfDisplayedMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
  }, [currentYear, currentMonth]);

  const endOfDisplayedMonth = useMemo(() => {
    // dernier ms du mois
    return new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
  }, [currentYear, currentMonth]);

  // ---- Grille calendrier (42 cases = 6 semaines) ----
  const calendarCells = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const offset = mondayIndex(firstDay); // nb cases vides avant le 1er

    // 42 cellules pour une grille stable (6 lignes)
    const cells: Array<{ day: number | null; dateKey?: string }> = [];
    for (let i = 0; i < 42; i++) {
      const dayNum = i - offset + 1;
      if (dayNum < 1 || dayNum > daysInMonth) {
        cells.push({ day: null });
      } else {
        const d = new Date(currentYear, currentMonth, dayNum);
        cells.push({ day: dayNum, dateKey: toKey(d) });
      }
    }
    return cells;
  }, [currentYear, currentMonth]);

  // ---- 1) Charger les stats globales (Total + ce mois affiché) ----
  useEffect(() => {
    const loadCounts = async () => {
      try {
        setLoading(true);

        const user = auth.currentUser;
        if (!user) {
          setTotalValide(0);
          setMoisValide(0);
          return;
        }

        const histoRef = collection(db, 'HistoriqueDefis');

        // Total validé (tous mois)
        const qTotal = query(
            histoRef,
            where('UserID', '==', user.uid),
            where('State', '==', 'Valide')
        );

        const totalSnap = await getDocs(qTotal);
        setTotalValide(totalSnap.size);

        // Ce mois affiché (on filtre côté client pour éviter index si tu n’en as pas)
        // Si tu veux optimiser: je te donne plus bas la version with where DateValidation >= ...
        let monthCount = 0;
        totalSnap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const dateVal: Timestamp | undefined = data?.DateValidation;
          if (!dateVal) return;

          const dt = dateVal.toDate();
          if (dt >= startOfDisplayedMonth && dt <= endOfDisplayedMonth) {
            monthCount += 1;
          }
        });
        setMoisValide(monthCount);
      } catch (e) {
        console.log('LOAD COUNTS ERROR =>', e);
        setTotalValide(0);
        setMoisValide(0);
      } finally {
        setLoading(false);
      }
    };

    loadCounts();
  }, [startOfDisplayedMonth, endOfDisplayedMonth]);

  // ---- 2) Charger les jours verts du mois affiché ----
  useEffect(() => {
    const loadCalendarGreenDays = async () => {
      try {
        setLoadingCalendar(true);

        const user = auth.currentUser;
        if (!user) {
          setGreenDays(new Set());
          return;
        }

        const histoRef = collection(db, 'HistoriqueDefis');

        // On récupère tous les défis validés de l'utilisateur,
        // puis on garde ceux du mois affiché et on marque les jours.
        // (Version simple sans index composite)
        const qValide = query(
            histoRef,
            where('UserID', '==', user.uid),
            where('State', '==', 'Valide')
        );

        const snap = await getDocs(qValide);

        const set = new Set<string>();
        snap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const dateVal: Timestamp | undefined = data?.DateValidation;
          if (!dateVal) return;

          const dt = dateVal.toDate();
          if (dt >= startOfDisplayedMonth && dt <= endOfDisplayedMonth) {
            set.add(toKey(dt)); // ex: "2026-02-10"
          }
        });

        setGreenDays(set);
      } catch (e) {
        console.log('LOAD CALENDAR ERROR =>', e);
        setGreenDays(new Set());
      } finally {
        setLoadingCalendar(false);
      }
    };

    loadCalendarGreenDays();
  }, [startOfDisplayedMonth, endOfDisplayedMonth]);

  const goPrevMonth = () => {
    setCurrentMonth((m) => {
      if (m === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };

  const goNextMonth = () => {
    setCurrentMonth((m) => {
      if (m === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* HEADER PERSONNALISÉ */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="black" />
          </Pressable>
          <Text style={styles.headerTitle}>Historique</Text>
        </View>

        {/* SECTION 1 : LES CARTES STATS */}
        <View style={styles.statsContainer}>
          {/* Carte Jaune (Ce mois-ci) */}
          <View style={[styles.card, { borderColor: COLORS.primaryYellow }]}>
            <Text style={styles.cardTitle}>Ce mois-ci</Text>

            {loading ? (
                <ActivityIndicator />
            ) : (
                <>
                  <Text style={styles.cardValue}>{moisValide}</Text>
                  <Text style={styles.cardLabel}>défis validés</Text>
                </>
            )}
          </View>

          {/* Carte Rouge (Total) */}
          <View style={[styles.card, { borderColor: COLORS.softRed }]}>
            <Text style={styles.cardTitle}>Total</Text>

            {loading ? (
                <ActivityIndicator />
            ) : (
                <>
                  <Text style={styles.cardValue}>{totalValide}</Text>
                  <Text style={styles.cardLabel}>défis validés</Text>
                </>
            )}
          </View>
        </View>

        {/* SECTION 2 : CALENDRIER */}
        <View style={styles.calendarSection}>
          {/* Sélecteur de mois */}
          <View style={styles.monthSelector}>
            <Pressable onPress={goPrevMonth} hitSlop={10}>
              <Text style={styles.arrowText}>{'<'}</Text>
            </Pressable>

            <Text style={styles.monthText}>
              {monthNamesFR[currentMonth]} {currentYear}
            </Text>

            <Pressable onPress={goNextMonth} hitSlop={10}>
              <Text style={styles.arrowText}>{'>'}</Text>
            </Pressable>
          </View>

          {/* Jours de la semaine */}
          <View style={styles.daysHeader}>
            {daysOfWeek.map((day, index) => (
                <Text key={index} style={styles.dayHeaderText}>{day}</Text>
            ))}
          </View>

          {/* Grille des jours */}
          {loadingCalendar ? (
              <View style={{ marginTop: 20 }}>
                <ActivityIndicator />
              </View>
          ) : (
              <View style={styles.daysGrid}>
                {calendarCells.map((cell, index) => {
                  const isEmpty = cell.day === null;
                  const isGreen = !!cell.dateKey && greenDays.has(cell.dateKey);

                  return (
                      <View key={index} style={styles.dayCell}>
                        <View
                            style={[
                              styles.dayCircle,
                              isEmpty && styles.dayCircleEmpty,
                              isGreen && styles.dayCircleGreen,
                            ]}
                        >
                          {!isEmpty && (
                              <Text style={styles.dayNumber}>{cell.day}</Text>
                          )}
                        </View>
                      </View>
                  );
                })}
              </View>
          )}
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
    width: '47%',
    borderWidth: 2,
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
    height: 140,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    alignSelf: 'flex-start',
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
    width: 40,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 15,
  },
  dayCell: {
    width: 40,
    alignItems: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleEmpty: {
    backgroundColor: 'transparent',
  },
  dayCircleGreen: {
    backgroundColor: '#65B369',
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
});
