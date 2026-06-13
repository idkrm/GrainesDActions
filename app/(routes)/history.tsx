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

import { auth, db } from '@/firebaseBD/firebaseConfig';
import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
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
            set.add(toKey(dt)); 
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
      <View style={styles.mainContainer}>
        
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={15}>
            <Ionicons name="arrow-back" size={28} color="#1A1A1A" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerTitles}>
            <Text style={styles.title}>Mon historique</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.iconWrapper, { backgroundColor: '#FFF8E1' }]}>
                <Ionicons name="calendar-outline" size={24} color="#FBC02D" />
              </View>
              <Text style={styles.cardTitle}>Ce mois-ci</Text>
              {loading ? (
                  <ActivityIndicator color="#FBC02D" />
              ) : (
                  <Text style={styles.cardValue}>{moisValide} <Text style={styles.cardLabel}>défis</Text></Text>
              )}
            </View>

            <View style={styles.statCard}>
              <View style={[styles.iconWrapper, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="flame-outline" size={24} color="#E53935" />
              </View>
              <Text style={styles.cardTitle}>Total</Text>
              {loading ? (
                  <ActivityIndicator color="#E53935" />
              ) : (
                  <Text style={styles.cardValue}>{totalValide} <Text style={styles.cardLabel}>défis</Text></Text>
              )}
            </View>
          </View>

          <View style={styles.calendarCard}>
            
            <View style={styles.monthSelector}>
              <Pressable onPress={goPrevMonth} hitSlop={15} style={styles.arrowButton}>
                <Ionicons name="chevron-back" size={20} color="#555" />
              </Pressable>

              <Text style={styles.monthText}>
                {monthNamesFR[currentMonth]} {currentYear}
              </Text>

              <Pressable onPress={goNextMonth} hitSlop={15} style={styles.arrowButton}>
                <Ionicons name="chevron-forward" size={20} color="#555" />
              </Pressable>
            </View>

            <View style={styles.daysHeader}>
              {daysOfWeek.map((day, index) => (
                  <Text key={index} style={styles.dayHeaderText}>{day}</Text>
              ))}
            </View>

            {loadingCalendar ? (
                <View style={styles.loadingCalendarBox}>
                  <ActivityIndicator size="large" color="#65B369" />
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
                                <Text style={[styles.dayNumber, isGreen && styles.dayNumberGreen]}>
                                  {cell.day}
                                </Text>
                            )}
                          </View>
                        </View>
                    );
                  })}
                </View>
            )}
          </View>
          
        </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 50,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  headerTop: {
    marginLeft: 15,
    marginBottom: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 5,
    marginLeft: -5,
  },
  headerTitles: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 35,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888',
  },

  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    textTransform: 'capitalize',
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dayHeaderText: {
    width: 40,
    textAlign: 'center',
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingCalendarBox: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#F5F5F5', 
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleEmpty: {
    backgroundColor: 'transparent',
  },
  dayCircleGreen: {
    backgroundColor: '#65B369',
    shadowColor: "#65B369",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  dayNumberGreen: {
    color: '#fff',
    fontWeight: '800',
  },
});