import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { addDoc, collection, doc, getDoc, increment, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { auth, db } from "../firebaseConfig";

interface MontantDon {
  montant: number;
  points: number;
}

interface Recompense {
  id: string;
  nom: string;
  description: string;
  nb_points: number;
  image?: string;
  type?: string; 
  id_asso?: string;
  id_magasin?: string; 
  montant?: { [key: string]: number }; 
  optionsCalculees?: MontantDon[]; 
}

interface Association {
  id: string;
  nom: string;
  description?: string;
  image?: string; 
}

interface Magasin {
  id: string;
  nom: string;
  description?: string;
  image?: string; 
}

export default function ShopScreen() {
  const router = useRouter();

  const [recompenses, setRecompenses] = useState<Recompense[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [chargement, setChargement] = useState(true);
  
  const [selectedReward, setSelectedReward] = useState<Recompense | null>(null);
  const [selectedOption, setSelectedOption] = useState<MontantDon | null>(null);

  useEffect(() => {
    // recompenses
    const unsubRecompenses = onSnapshot(collection(db, "Recompenses"),
        (snapshot) => {
          const data = snapshot.docs.map((d) => {
            const rawData = d.data();
            let options: MontantDon[] = [];
            if (rawData.montant) {
                Object.keys(rawData.montant).forEach(key => {
                    options.push({ montant: Number.parseInt(key), points: rawData.montant[key] });
                });
                options.sort((a, b) => a.montant - b.montant);
            }
            return { id: d.id, ...rawData, optionsCalculees: options } as Recompense;
          });
          setRecompenses(data);
          setChargement(false);
        },
        (error) => { console.error(error); setChargement(false); }
    );

    // associations
    const unsubAssos = onSnapshot(collection(db, "Assos"),
        (snapshot) => {
          const data = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Association, "id">) }));
          setAssociations(data as Association[]);
        },
        // (error) => console.error(error)
    );

    // magasins
    const unsubMagasins = onSnapshot(collection(db, "Magasins"),
        (snapshot) => {
          const data = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Magasin, "id">) }));
          setMagasins(data as Magasin[]);
        },
        // (error) => console.error(error)
    );

    return () => { unsubRecompenses(); unsubAssos(); unsubMagasins(); };
  }, []);

  const openModal = (item: Recompense) => {
      setSelectedReward(item);
      if (item.optionsCalculees && item.optionsCalculees.length > 0) {
          setSelectedOption(item.optionsCalculees[0]);
      } else {
          setSelectedOption(null);
      }
  };

  const optionDon = recompenses.find(r => r.nom.toLowerCase().includes('don') && r.optionsCalculees && r.optionsCalculees.length > 0);
  const allDonationOption = optionDon ? optionDon.optionsCalculees : [];

  const optionBon = recompenses.find(r => r.nom.toLowerCase().includes('bon d\'achat') && r.optionsCalculees && r.optionsCalculees.length > 0);
  const allVoucherOption = optionBon ? optionBon.optionsCalculees : [];

  const actionsArbres = recompenses.filter(r => {
      const lower = r.nom.toLowerCase();
      return (lower.includes('arbre') || lower.includes('plantation')) && !r.id_asso && !r.id_magasin;
  });

  const cartesMagasins = magasins.map(mag => ({
      id: `mag-${mag.id}`,
      nom: mag.nom,
      description: mag.description || "Utilisez vos points pour un bon d'achat.",
      nb_points: 0, 
      image: mag.image,
      type: 'voucher',
      id_magasin: mag.id,
      optionsCalculees: allVoucherOption
  }));

  const cartesAssociations = associations.map(asso => ({
      id: `asso-${asso.id}`,
      nom: asso.nom,
      description: asso.description || "Soutenez cette association avec vos points.",
      nb_points: 0, 
      image: asso.image,
      type: 'don',
      id_asso: asso.id,
      optionsCalculees: allDonationOption 
  }));

  const populaires = [
      actionsArbres[0],
      cartesAssociations[0],
      cartesMagasins[0]
  ].filter(item => item !== undefined);

  const handleBuy = async () => {
    if (!auth.currentUser) {
        Alert.alert("Erreur", "Vous devez être connecté pour échanger vos points.");
        return;
    }
    const uid = auth.currentUser.uid;
    const coutFinal = (selectedOption ? selectedOption.points : selectedReward?.nb_points) || 0;
    const userRef = doc(db, "Users", uid);
    
    try {
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        const currentPoints = userData?.nb_points;

        if (currentPoints < coutFinal) {
            Alert.alert("Solde insuffisant", `Il vous manque ${coutFinal - currentPoints} points.`);
            return;
        }

        let typeId = 0;
        if (selectedReward?.id_asso) typeId = 1;
        else if (selectedReward?.id_magasin) typeId = 3;
        else if (selectedReward?.nom.toLowerCase().includes("arbre")) typeId = 2;

        const dataToSave: any = {
            id_user: uid,
            id_recompense: typeId,
            date_achat: serverTimestamp(),
        };

        if (typeId === 1 && selectedReward?.id_asso) {
            dataToSave.id_asso = Number.parseInt(selectedReward.id_asso);
            dataToSave.montant = selectedOption ? selectedOption.montant : 0;
        }
        
        if (typeId === 3 && selectedReward?.id_magasin) {
            dataToSave.id_magasin = Number.parseInt(selectedReward.id_magasin);
            dataToSave.date_utilisation = "";
            dataToSave.montant = selectedOption ? selectedOption.montant : 0;
        }

        await addDoc(collection(db, "RecompenseUser"), dataToSave);
        await updateDoc(userRef, {
            nb_points: increment(-coutFinal)
        });

        Alert.alert("Félicitations ! 🎉", "Achat validé avec succès.");
        setSelectedReward(null);

    } catch (error) {
        console.error("Erreur", error);
    }
  };

  const RewardCard = ({ item }: { item: Recompense }) => (
    <Pressable style={styles.card} onPress={() => openModal(item)}>
      <View style={styles.imagePlaceholder}>
        {item.image ? (
          <Image 
            source={{ uri: item.image }} 
            style={styles.image} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noImageContainer}>
             <Ionicons name="gift-outline" size={30} color="#aaa" />
          </View>
        )}
        
        <View style={styles.pointsBadge}>
            <Ionicons name="star" size={12} color="#F57C00" style={{ marginRight: 4 }} />
            <Text style={styles.pointsText}>
                {item.optionsCalculees && item.optionsCalculees.length > 0 
                    ? `Dès ${item.optionsCalculees[0].points}`
                    : `${item.nb_points}`} pts
            </Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.nom}</Text>
    </Pressable>
  );

  if (chargement) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#65B369" /></View>;
  }

  const currentCost = selectedOption ? selectedOption.points : selectedReward?.nb_points;
  const getActionLabel = () => {
      if (selectedReward?.id_asso) return "Faire un don";
      if (selectedReward?.id_magasin) return "Obtenir ce bon";
      return "Planter !";
  };

  return (
      <View style={styles.mainContainer}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Les plus populaires</Text>
                <FlatList 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    data={populaires} 
                    keyExtractor={item => item.id} 
                    contentContainerStyle={styles.horizontalList} 
                    renderItem={({ item }) => <RewardCard item={item} />} 
                    ListEmptyComponent={<Text style={styles.emptyText}>Bientôt disponible</Text>}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Agir pour la planète</Text>
                <FlatList 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    data={actionsArbres} 
                    keyExtractor={item => item.id} 
                    contentContainerStyle={styles.horizontalList} 
                    renderItem={({ item }) => <RewardCard item={item} />} 
                    ListEmptyComponent={<Text style={styles.emptyText}>Aucune action disponible</Text>}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dons aux associations</Text>
                <FlatList 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    data={cartesAssociations} 
                    keyExtractor={item => item.id} 
                    contentContainerStyle={styles.horizontalList} 
                    renderItem={({ item }) => <RewardCard item={item} />} 
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bons d’achat</Text>
                <FlatList 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    data={cartesMagasins} 
                    keyExtractor={item => item.id} 
                    contentContainerStyle={styles.horizontalList} 
                    renderItem={({ item }) => <RewardCard item={item} />} 
                    ListEmptyComponent={<Text style={styles.emptyText}>Aucun magasin disponible</Text>} 
                />
            </View>

        </ScrollView>

        <Modal animationType="fade" transparent={true} visible={!!selectedReward} onRequestClose={() => setSelectedReward(null)} >
            <Pressable style={styles.modalOverlay} onPress={() => setSelectedReward(null)}>
                <Pressable style={styles.modalContent} onPress={() => {}} >
                    
                    <Pressable style={styles.closeButton} onPress={() => setSelectedReward(null)}>
                        <Ionicons name="close" size={24} color="#333" />
                    </Pressable>

                    <View style={styles.modalImageContainer}>
                        {selectedReward?.image ? (
                             <Image 
                                source={{ uri: selectedReward.image }} 
                                style={styles.modalImage} 
                                resizeMode={(selectedReward.id_asso || selectedReward.id_magasin) ? "contain" : "cover"} 
                             />
                        ) : (
                          <View style={styles.noImageContainer}>
                             <Ionicons name="image-outline" size={50} color="#ccc" />
                          </View>
                        )}
                    </View>

                    <Text style={styles.modalTitle}>{selectedReward?.nom}</Text>
                    <Text style={styles.modalDescription}>{selectedReward?.description || "Soutenez ce projet grâce à vos points !"}</Text>

                    {selectedReward?.optionsCalculees && selectedReward.optionsCalculees.length > 0 && (
                        <View style={styles.donationContainer}>
                            <Text style={styles.donationLabel}>Choisissez un montant :</Text>
                            <View style={styles.donationOptions}>
                                {selectedReward.optionsCalculees.map((option, index) => (
                                    <Pressable 
                                        key={index} 
                                        style={[
                                            styles.amountChip, 
                                            selectedOption?.montant === option.montant && styles.amountChipSelected
                                        ]}
                                        onPress={() => setSelectedOption(option)}
                                    >
                                        <Text style={[
                                            styles.amountText,
                                            selectedOption?.montant === option.montant && styles.amountTextSelected
                                        ]}>
                                            {option.montant}€
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    )}

                    <View style={styles.modalCostRow}>
                       <Text style={styles.modalCostLabel}>Coût total :</Text>
                       <View style={styles.modalPointsBadge}>
                          <Ionicons name="star" size={16} color="#E65100" style={{marginRight: 6}} />
                          <Text style={styles.modalPointsText}>{currentCost} pts</Text>
                       </View>
                    </View>

                    <Pressable style={styles.buyButton} onPress={handleBuy}>
                        <Text style={styles.buyButtonText}>{getActionLabel()}</Text>
                        <Ionicons name="checkmark-circle-outline" size={20} color="white" style={{marginLeft: 8}} />
                    </Pressable>

                </Pressable>
            </Pressable>
        </Modal>

      </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 100,
  },

  section: {
    marginBottom: 35 
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1A1A1A",
    paddingHorizontal: 20, 
    marginBottom: 15,    
  },
  horizontalList: { 
    paddingHorizontal: 20, 
    gap: 15,
    paddingVertical: 5, 
  },
  emptyText: { color: '#999', fontStyle: 'italic', marginLeft: 20 },

  card: {
    width: 150, 
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginRight: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: "#F9F9F9", 
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: { width: '100%', height: '100%' },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { 
    fontSize: 14, 
    fontWeight: "700", 
    color: "#2C3E50",
    textAlign: 'center',
    lineHeight: 18,
  },
  pointsBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  pointsText: { fontSize: 12, fontWeight: "bold", color: "#F57C00" },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', 
  },
  modalContent: {
    width: '88%', 
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    padding: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  modalImageContainer: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    marginTop: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  modalImage: { width: '100%', height: '100%' },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: '900', 
    color: '#1A1A1A',
    marginBottom: 10, 
    textAlign: 'center' 
  },
  modalDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  
  donationContainer: { width: '100%', marginBottom: 25, alignItems: 'center' },
  donationLabel: { fontSize: 14, fontWeight: '700', marginBottom: 12, color: '#333' },
  donationOptions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  amountChip: { 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    backgroundColor: '#fff', 
    minWidth: 65, 
    alignItems: 'center' 
  },
  amountChipSelected: { 
    backgroundColor: '#65B369', 
    borderColor: '#65B369',
    shadowColor: "#65B369",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  amountText: { fontSize: 15, fontWeight: 'bold', color: '#555' },
  amountTextSelected: { color: 'white' },

  modalCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#FFF8E1', 
    padding: 15,
    borderRadius: 16,
    marginBottom: 20,
  },
  modalCostLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  modalPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalPointsText: { color: '#E65100', fontWeight: '900', fontSize: 18 },

  buyButton: {
    flexDirection: 'row',
    backgroundColor: '#65B369',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#65B369",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buyButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});