import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { db } from "@/firebaseBD/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  Timestamp,
  where,
} from "firebase/firestore";

interface ValidationItem {
  id: string;                
  defiId: string;            
  userId: string;            
  points: number;            
  defiNom: string;
  username: string;
  dateSoumission: string;
  imageUri?: string;
}

export default function ValidationDefisScreen() {
  const router = useRouter();

  const [validations, setValidations] = useState<ValidationItem[]>([]);
  const [chargement, setChargement] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedItem, setSelectedItem] = useState<ValidationItem | null>(null);

  // 🔥 CHARGEMENT FIRESTORE (State == "En cours")
  useEffect(() => {
    const q = query(
        collection(db, "HistoriqueDefis"),
        where("State", "==", "En cours")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const items: ValidationItem[] = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data() as any;

          const defiId = String(data?.DefisID ?? "");
          const userId = String(data?.UserID ?? "");
          const ts: Timestamp | undefined = data?.DateValidation;

          let defiNom = "Défi inconnu";
          let points = 0;

          if (defiId) {
            const defiSnap = await getDoc(doc(db, "Defis", defiId));
            if (defiSnap.exists()) {
              const defiData = defiSnap.data() as any;
              defiNom = defiData?.nom ?? "Défi sans nom";

              const difficulte = Number(defiData?.difficulte ?? 0);
              points = Math.max(0, difficulte) * 10;
            }
          }

          let username = "Utilisateur";
          if (userId) {
            const userSnap = await getDoc(doc(db, "Users", userId));
            if (userSnap.exists()) {
              const userData = userSnap.data() as any;
              username = userData?.pseudo ?? "Utilisateur";
            }
          }

          const formattedDate = ts
              ? ts.toDate().toLocaleDateString("fr-FR")
              : "Date inconnue";

          items.push({
            id: docSnap.id,
            defiId,
            userId,
            points,
            defiNom,
            username,
            dateSoumission: formattedDate,
            imageUri: data?.PreuveUri || undefined,
          });
        }

        setValidations(items);
      } catch (e) {
        console.log("SNAPSHOT LOAD ERROR =>", e);
        setValidations([]);
      } finally {
        setChargement(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔎 FILTRAGE
  const filteredValidations = validations.filter(
      (v) =>
          v.defiNom.toLowerCase().includes(searchText.toLowerCase()) ||
          v.username.toLowerCase().includes(searchText.toLowerCase())
  );

  // ✅ VALIDER : State => Valide + ajouter points au user
  const handleValidate = async () => {
    if (!selectedItem) return;

    try {
      const histoRef = doc(db, "HistoriqueDefis", selectedItem.id);
      const userRef = doc(db, "Users", selectedItem.userId);

      await runTransaction(db, async (transaction) => {
        const histoSnap = await transaction.get(histoRef);
        if (!histoSnap.exists()) throw new Error("Historique introuvable.");

        const currentState = String(histoSnap.data()?.State ?? "");
        if (currentState !== "En cours") {
          throw new Error("Ce défi n'est plus en attente (déjà traité).");
        }

        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("Utilisateur introuvable.");

        const currentPoints = Number(userSnap.data()?.nb_points ?? 0);
        const add = Number(selectedItem.points ?? 0);

        transaction.update(histoRef, { State: "Valide" });
        transaction.update(userRef, { nb_points: currentPoints + add });
      });

      Alert.alert("Succès", `Défi validé ! +${selectedItem.points} points pour ${selectedItem.username}`);
      setSelectedItem(null);
    } catch (e: any) {
      console.log("VALIDATE ERROR =>", e);
      Alert.alert("Erreur", "Impossible de valider le défi.");
    }
  };

  // ❌ REFUSER : juste changer State
  const handleReject = async () => {
    if (!selectedItem) return;

    try {
      const histoRef = doc(db, "HistoriqueDefis", selectedItem.id);

      await runTransaction(db, async (transaction) => {
        const histoSnap = await transaction.get(histoRef);
        if (!histoSnap.exists()) throw new Error("Historique introuvable.");

        const currentState = String(histoSnap.data()?.State ?? "");
        if (currentState !== "En cours") {
          throw new Error("Ce défi n'est plus en attente (déjà traité).");
        }

        transaction.update(histoRef, { State: "Refusé" });
      });

      Alert.alert("Refusé", "Le défi a été refusé.");
      setSelectedItem(null);
    } catch (e: any) {
      console.log("REJECT ERROR =>", e);
      Alert.alert("Erreur", "Impossible de refuser le défi.");
    }
  };

  const renderItem = ({ item }: { item: ValidationItem }) => (
      <Pressable style={styles.listItem} onPress={() => setSelectedItem(item)}>
        
        {/* Avatar Icon */}
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.defiNom}</Text>
          <Text style={styles.itemSubtitle}>
            par <Text style={{fontWeight: '700', color: '#555'}}>{item.username}</Text>
          </Text>
        </View>

        {/* Info Right */}
        <View style={styles.itemRight}>
           <Text style={styles.dateText}>{item.dateSoumission}</Text>
           <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>+{item.points}</Text>
           </View>
        </View>

      </Pressable>
  );

  return (
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="black" />
          </Pressable>
          
        </View>

        {/* BARRE DE RECHERCHE */}
        <Text style={styles.headerTitle}>Validation</Text>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
            <TextInput
                placeholder="Rechercher un utilisateur ou un défi..."
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholderTextColor="#888"
            />
            {searchText.length > 0 && (
                <Pressable onPress={() => setSearchText("")} hitSlop={10}>
                  <Ionicons name="close-circle" size={18} color="#888" />
                </Pressable>
            )}
          </View>
        </View>

        {/* LISTE */}
        {chargement ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#65B369" />
            </View>
        ) : (
            <FlatList
                data={filteredValidations}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={renderItem}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="checkmark-done-circle-outline" size={50} color="#C8E6C9" style={{marginBottom: 10}}/>
                    <Text style={styles.emptyText}>Aucun défi en attente de validation.</Text>
                    <Text style={styles.emptySubText}>Vous êtes à jour !</Text>
                  </View>
                }
            />
        )}

        {/* MODAL DE VALIDATION */}
        <Modal
            animationType="fade"
            transparent
            visible={!!selectedItem}
            onRequestClose={() => setSelectedItem(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedItem(null)}>
            <Pressable style={styles.modalContent} onPress={() => {}}>
              
              {/* Header Modal */}
              <View style={styles.modalHeader}>
                 <Text style={styles.modalTitle} numberOfLines={1}>{selectedItem?.defiNom}</Text>
                 <Pressable style={styles.closeButton} onPress={() => setSelectedItem(null)} hitSlop={10}>
                    <Ionicons name="close" size={24} color="#555" />
                 </Pressable>
              </View>

              {/* Info Modal */}
              <View style={styles.modalInfoRow}>
                 <View style={styles.modalUserBox}>
                    <Ionicons name="person-outline" size={16} color="#666" style={{marginRight: 6}} />
                    <Text style={styles.modalSubtitle}>{selectedItem?.username}</Text>
                 </View>
                 <View style={styles.modalPointsBox}>
                    <Ionicons name="star" size={14} color="#F57C00" style={{marginRight: 4}} />
                    <Text style={styles.modalPointsText}>+{selectedItem?.points} pts</Text>
                 </View>
              </View>

              {/* IMAGE SÉLECTIONNÉE */}
              <View style={styles.modalImageContainer}>
                {selectedItem?.imageUri ? (
                  <Image source={{ uri: selectedItem.imageUri }} style={styles.modalImage} resizeMode="cover" />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons name="document-text-outline" size={50} color="#aaa" />
                    <Text style={{color: '#888', marginTop: 10, fontWeight: '500'}}>Preuve documentaire (PDF)</Text>
                  </View>
                )}
              </View>

              {/* BOUTONS ACTIONS */}
              <View style={styles.actionButtonsRow}>
                <Pressable style={[styles.actionButton, styles.buttonReject]} onPress={handleReject}>
                  <Ionicons name="close-circle-outline" size={20} color="#E53935" style={{marginRight: 6}} />
                  <Text style={styles.buttonRejectText}>Refuser</Text>
                </Pressable>

                <Pressable style={[styles.actionButton, styles.buttonValidate]} onPress={handleValidate}>
                  <Text style={styles.buttonValidateText}>Valider</Text>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{marginLeft: 6}} />
                </Pressable>
              </View>

            </Pressable>
          </Pressable>
        </Modal>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA", // Fond Soft UI
    paddingTop: 50,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // --- HEADER ---
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: { marginRight: 15 },
  headerTitle: {
    fontSize: 26,
    paddingHorizontal: 20,
    paddingBottom: 10,
    fontWeight: "900",
    color: "#1A1A1A",
  },

  // --- BARRE DE RECHERCHE ---
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },

  // --- LISTE ---
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2E7D32',
  },
  itemInfo: {
    flex: 1,
    paddingRight: 10,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 13,
    color: "#888",
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 6,
    fontWeight: '500',
  },
  pointsBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointsText: {
    color: '#E65100',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // --- EMPTY STATE ---
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  emptySubText: {
    color: '#888',
    fontSize: 14,
  },

  // --- MODAL ---
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 24,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    color: "#1A1A1A",
    marginRight: 10,
  },
  closeButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 6,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  modalUserBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#555",
    fontWeight: '600',
  },
  modalPointsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalPointsText: {
    color: '#E65100',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalImageContainer: {
    width: '100%',
    aspectRatio: 1, 
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 25,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Boutons du modal
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonValidate: {
    backgroundColor: "#65B369",
    shadowColor: "#65B369",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonReject: {
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  buttonValidateText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  buttonRejectText: {
    color: "#D32F2F",
    fontSize: 16,
    fontWeight: "700",
  },
});