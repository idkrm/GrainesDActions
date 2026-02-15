import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { addDoc, collection, doc, getDoc, increment, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { auth, database } from "../firebaseConfig";

// --- INTERFACES ---
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

  // --- RECUPERATION DES DONNEES ---
  useEffect(() => {
    // recompenses
    const unsubRecompenses = onSnapshot(collection(database, "Recompenses"),
        (snapshot) => {
          const data = snapshot.docs.map((d) => {
            const rawData = d.data();
            let options: MontantDon[] = [];
            if (rawData.montant) {
                Object.keys(rawData.montant).forEach(key => {
                    options.push({ montant: parseInt(key), points: rawData.montant[key] });
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
    const unsubAssos = onSnapshot(collection(database, "Assos"),
        (snapshot) => {
          const data = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Association, "id">) }));
          setAssociations(data as Association[]);
        },
        (error) => console.error(error)
    );

    // magasins
    const unsubMagasins = onSnapshot(collection(database, "Magasins"),
        (snapshot) => {
          const data = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Magasin, "id">) }));
          setMagasins(data as Magasin[]);
        },
        (error) => console.error(error)
    );

    return () => { unsubRecompenses(); unsubAssos(); unsubMagasins(); };
  }, []);

  // --- MODALE ---
  const openModal = (item: Recompense) => {
      setSelectedReward(item);
      if (item.optionsCalculees && item.optionsCalculees.length > 0) {
          setSelectedOption(item.optionsCalculees[0]);
      } else {
          setSelectedOption(null);
      }
  };

  // --- PREPARATION DES LISTES ---
  // configuration montant possible (don et bon)
  const optionDon = recompenses.find(r => r.nom.toLowerCase().includes('don') && r.optionsCalculees && r.optionsCalculees.length > 0);
  const allDonationOption = optionDon ? optionDon.optionsCalculees : [];

  const optionBon = recompenses.find(r => r.nom.toLowerCase().includes('bon d\'achat') && r.optionsCalculees && r.optionsCalculees.length > 0);
  const allVoucherOption = optionBon ? optionBon.optionsCalculees : [];

  // agir pour la planète
  const actionsArbres = recompenses.filter(r => {
      const lower = r.nom.toLowerCase();
      return (lower.includes('arbre') || lower.includes('plantation')) && !r.id_asso && !r.id_magasin;
  });

  // tous les magasins
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

  // toutes les associations
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

  // liste les plus populaires
  const populaires = [
      actionsArbres[0],
      cartesAssociations[0],
      cartesMagasins[0]
  ].filter(item => item !== undefined);

  // --- ACHAT ---
const handleBuy = async () => {
    // verif user
    if (!auth.currentUser) {
        Alert.alert("Erreur", "Vous devez être connecté pour échanger vos points.");
        return;
    }
    const uid = auth.currentUser.uid;

    // nb pts de la recompense
    const coutFinal = (selectedOption ? selectedOption.points : selectedReward?.nb_points) || 0;

    
    const userRef = doc(database, "Users", uid);
    
    try {
        const userSnap = await getDoc(userRef);
        // recup nb pts user
        const userData = userSnap.data();
        const currentPoints = userData?.nb_points;

        // verif solde
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
            dataToSave.id_asso = parseInt(selectedReward.id_asso);
            dataToSave.montant = selectedOption ? selectedOption.montant : 0;
        }
        
        if (typeId === 3 && selectedReward?.id_magasin) {
            dataToSave.id_magasin = parseInt(selectedReward.id_magasin);
            dataToSave.date_utilisation = "";
            dataToSave.montant = selectedOption ? selectedOption.montant : 0;
        }

        // creation doc pour la table recompenseUser
        await addDoc(collection(database, "RecompenseUser"), dataToSave);

        await updateDoc(userRef, {
            nb_points: increment(-coutFinal)
        });

        Alert.alert("Félicitations ! ", "Achat validé avec succès.");
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
            resizeMode="contain"
          />
        ) : <View style={{flex: 1, backgroundColor: '#E0E0E0'}} />}
        
        <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>
                {item.optionsCalculees && item.optionsCalculees.length > 0 
                    ? `Dès ${item.optionsCalculees[0].points} pts`
                    : `${item.nb_points} pts`}
            </Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.nom}</Text>
    </Pressable>
  );

  if (chargement) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#65B369" /></View>;
  }

  const currentCost = selectedOption ? selectedOption.points : selectedReward?.nb_points;
  const getActionLabel = () => {
      if (selectedReward?.id_asso) return "Donner";
      if (selectedReward?.id_magasin) return "Obtenir le bon";
      return "Obtenir";
  };

  return (
      <View style={{flex: 1, backgroundColor: "#fff"}}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            
            {/* les plus populaires */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Les plus populaires</Text>
                <FlatList 
                    horizontal 
                    data={populaires} 
                    keyExtractor={item => item.id} 
                    contentContainerStyle={styles.horizontalList} 
                    renderItem={({ item }) => <RewardCard item={item} />} 
                    ListEmptyComponent={<Text style={styles.emptyText}>Bientôt disponible</Text>}
                />
            </View>

            {/* bon d'achat*/}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bons d’achat</Text>
                <FlatList 
                    horizontal 
                    data={cartesMagasins} 
                    keyExtractor={item => item.id} 
                    contentContainerStyle={styles.horizontalList} 
                    renderItem={({ item }) => <RewardCard item={item} />} 
                    ListEmptyComponent={<Text style={styles.emptyText}>Aucun magasin disponible</Text>} 
                />
            </View>

            {/* dons aux associations */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dons aux associations</Text>
                <FlatList 
                    horizontal 
                    data={cartesAssociations} 
                    keyExtractor={item => item.id} 
                    contentContainerStyle={styles.horizontalList} 
                    renderItem={({ item }) => <RewardCard item={item} />} 
                />
            </View>

            {/* agir pour la planète */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Agir pour la planète</Text>
                <FlatList 
                    horizontal 
                    data={actionsArbres} 
                    keyExtractor={item => item.id} 
                    contentContainerStyle={styles.horizontalList} 
                    renderItem={({ item }) => <RewardCard item={item} />} 
                    ListEmptyComponent={<Text style={styles.emptyText}>Aucune action disponible</Text>}
                />
            </View>

            <View style={{height: 40}} />
        </ScrollView>

        {/* --- MODALE --- */}
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
                        ) : <View style={[styles.modalImage, {backgroundColor: '#eee'}]} />}
                    </View>

                    <Text style={styles.modalTitle}>{selectedReward?.nom}</Text>
                    <Text style={styles.modalDescription}>{selectedReward?.description || "Aucune description."}</Text>

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

                    <Pressable style={styles.buyButton} onPress={handleBuy}>
                        <Text style={styles.buyButtonText}>
                            {getActionLabel()} pour {currentCost} points
                        </Text>
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
    backgroundColor: "#FFFFFF", 
    borderWidth: 1,           
    borderColor: "#F0F0F0",
    borderRadius: 12,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
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

  // --- STYLES DU MODAL CENTRE ---
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
    aspectRatio: 1,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
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
  donationContainer: { width: '100%', marginBottom: 20, alignItems: 'center' },
  donationLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10, color: '#333' },
  donationOptions: { flexDirection: 'row', gap: 10, marginBottom: 10, flexWrap: 'wrap', justifyContent: 'center' },
  amountChip: { 
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f9f9f9', minWidth: 60, alignItems: 'center' 
  },
  amountChipSelected: { backgroundColor: '#65B369', borderColor: '#65B369' },
  amountText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  amountTextSelected: { color: 'white' },
});