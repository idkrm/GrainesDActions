import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { database } from "../firebaseConfig";

interface Recompense {
  id: string;
  nom: string;
  description: string;
  nb_points: number;
  image?: string;
  type?: string; 
}

export default function ShopScreen() {
  const router = useRouter();

  const [recompenses, setRecompenses] = useState<Recompense[]>([]);
  const [chargement, setChargement] = useState(true);
  const [selectedReward, setSelectedReward] = useState<Recompense | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
        collection(database, "Recompenses"),
        (snapshot) => {
          const data = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Recompense, "id">),
          }));
          setRecompenses(data as Recompense[]);
          setChargement(false);
        },
        (error) => {
          console.error("Erreur lecture récompenses :", error);
          setChargement(false);
        }
    );
    return () => unsub();
  }, []);

  const bonsAchats = recompenses.filter(r => r.type !== 'don'); 
  const donsAsso = recompenses.filter(r => r.type === 'don');
  const populaires = recompenses.slice(0, 3);

  const handleBuy = () => {
    Alert.alert("Succès", "Vous avez échangé vos points !");
    setSelectedReward(null); 
  };

  const RewardCard = ({ item, isPopular = false }: { item: Recompense, isPopular?: boolean }) => (
    <Pressable
      style={styles.card}
      onPress={() => setSelectedReward(item)}
    >
      <View style={styles.imagePlaceholder}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.image} />
        ) : (
          <View /> 
        )}
        <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>{item.nb_points} pts</Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {item.nom}
      </Text>
    </Pressable>
  );

  if (chargement) {
    return (
        <View style={styles.center}>
          <Text>Chargement de la boutique...</Text>
        </View>
    );
  }

  return (
      <View style={{flex: 1}}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Les plus populaires</Text>
                <FlatList
                    horizontal
                    data={populaires}
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    renderItem={({ item }) => <RewardCard item={item} isPopular={true} />}
                />
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Bons d’achat</Text>
                    <Pressable><Text style={styles.seeAll}>Voir tout {'>'}</Text></Pressable>
                </View>
                <FlatList
                    horizontal
                    data={bonsAchats}
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    renderItem={({ item }) => <RewardCard item={item} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>Aucun bon disponible</Text>}
                />
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Don aux associations</Text>
                    <Pressable><Text style={styles.seeAll}>Voir tout {'>'}</Text></Pressable>
                </View>
                <FlatList
                    horizontal
                    data={donsAsso}
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    renderItem={({ item }) => <RewardCard item={item} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>Aucun don disponible</Text>}
                />
            </View>

            <View style={{height: 40}} />
        </ScrollView>

        {/* MODAL CENTRÉ */}
        <Modal animationType="fade" transparent={true} visible={!!selectedReward} onRequestClose={() => setSelectedReward(null)} >
            <Pressable style={styles.modalOverlay} onPress={() => setSelectedReward(null)}>
                <Pressable style={styles.modalContent} onPress={() => {}} >
                    
                    <Pressable style={styles.closeButton} onPress={() => setSelectedReward(null)}>
                        <Ionicons name="close" size={24} color="#333" />
                    </Pressable>

                    <View style={styles.modalImageContainer}>
                        {selectedReward?.image ? (
                             <Image source={{ uri: selectedReward.image }} style={styles.modalImage} resizeMode="cover" />
                        ) : (
                            <View style={[styles.modalImage, {backgroundColor: '#eee'}]} />
                        )}
                    </View>

                    <Text style={styles.modalTitle}>{selectedReward?.nom}</Text>
                    
                    <View style={styles.modalPointsBadge}>
                        <Text style={styles.modalPointsText}>{selectedReward?.nb_points} points</Text>
                    </View>

                    <Text style={styles.modalDescription}>
                        {selectedReward?.description || "Aucune description disponible."}
                    </Text>

                    <Pressable style={styles.buyButton} onPress={handleBuy}>
                        <Text style={styles.buyButtonText}>Obtenir cette récompense</Text>
                    </Pressable>

                </Pressable>
            </Pressable>
        </Modal>

      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  
  // SECTIONS
  section: { marginBottom: 30 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    paddingHorizontal: 20, 
    marginBottom: 10,    
  },
  seeAll: { fontSize: 14, color: "#666" },
  horizontalList: { paddingHorizontal: 20, gap: 15 },

  // CARTES
  card: { width: 140, marginRight: 0 },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  cardTitle: { fontSize: 14, fontWeight: "500", color: "#000" },
  pointsBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    elevation: 2,
  },
  pointsText: { fontSize: 12, fontWeight: "bold", color: "#F57C00" },
  emptyText: { color: '#999', fontStyle: 'italic', marginLeft: 20 },

  // --- STYLES DU MODAL CENTRÉ ---
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%', 
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    padding: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  modalImageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    marginTop: 10,
  },
  modalImage: { width: '100%', height: '100%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalPointsBadge: {
    backgroundColor: '#FFE0B2',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 20,
  },
  modalPointsText: { color: '#E65100', fontWeight: 'bold', fontSize: 16 },
  modalDescription: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  buyButton: {
    backgroundColor: '#65B369',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  buyButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});