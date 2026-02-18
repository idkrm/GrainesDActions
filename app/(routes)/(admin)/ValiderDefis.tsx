import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
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
  id: string;                // id du doc HistoriqueDefis
  defiId: string;            // DefisID
  userId: string;            // UserID
  points: number;            // points à ajouter

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

          // 🔹 Récupérer le défi (nom + points)
          let defiNom = "Défi inconnu";
          let points = 0;

          if (defiId) {
            const defiSnap = await getDoc(doc(db, "Defis", defiId));
            if (defiSnap.exists()) {
              const defiData = defiSnap.data() as any;
              defiNom = defiData?.nom ?? "Défi sans nom";

              // ✅ points calculés à partir de la difficulté (comme dans ton écran défi)
              const difficulte = Number(defiData?.difficulte ?? 0);
              points = Math.max(0, difficulte) * 10;
            }
          }

          // 🔹 Récupérer le pseudo utilisateur
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

        // ⚠️ sécurité : si déjà validé / refusé, on ne refait pas l'opération
        const currentState = String(histoSnap.data()?.State ?? "");
        if (currentState !== "En cours") {
          throw new Error("Ce défi n'est plus en attente (déjà traité).");
        }

        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("Utilisateur introuvable.");

        const currentPoints = Number(userSnap.data()?.nb_points ?? 0);
        const add = Number(selectedItem.points ?? 0);

        // 1) passer l'historique en "Valide"
        transaction.update(histoRef, { State: "Valide" });

        // 2) ajouter les points à l'utilisateur
        transaction.update(userRef, { nb_points: currentPoints + add });
      });

      Alert.alert("Succès", `Défi validé ! +${selectedItem.points} points`);
      setSelectedItem(null);
    } catch (e: any) {
      console.log("VALIDATE ERROR =>", e);
      Alert.alert(
          "Erreur",
          `${e?.code ?? "unknown"}\n${e?.message ?? "Impossible de valider le défi."}`
      );
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
      Alert.alert(
          "Erreur",
          `${e?.code ?? "unknown"}\n${e?.message ?? "Impossible de refuser le défi."}`
      );
    }
  };

  const renderItem = ({ item }: { item: ValidationItem }) => (
      <View style={styles.listItem}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.defiNom}
          </Text>
          <Text style={styles.itemSubtitle}>
            par {item.username} le {item.dateSoumission} • +{item.points} pts
          </Text>
        </View>

        <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.5 }]}
            onPress={() => setSelectedItem(item)}
        >
          <Ionicons name="eye-outline" size={26} color="#333" />
        </Pressable>
      </View>
  );

  return (
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="black" />
          </Pressable>
          <Text style={styles.headerTitle}>Validation de défi</Text>
        </View>

        {/* BARRE DE RECHERCHE */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
            <TextInput
                placeholder="Rechercher un défi ou utilisateur..."
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholderTextColor="#888"
            />
            {searchText.length > 0 && (
                <Pressable onPress={() => setSearchText("")}>
                  <Ionicons name="close-circle" size={18} color="#888" />
                </Pressable>
            )}
          </View>
        </View>

        {/* LISTE */}
        {chargement ? (
            <View style={styles.center}>
              <Text>Chargement...</Text>
            </View>
        ) : (
            <FlatList
                data={filteredValidations}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={renderItem}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Aucun défi en attente de validation.</Text>
                }
            />
        )}

        {/* MODAL */}
        <Modal
            animationType="fade"
            transparent
            visible={!!selectedItem}
            onRequestClose={() => setSelectedItem(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedItem(null)}>
            <Pressable style={styles.modalContent} onPress={() => {}}>
              <Pressable style={styles.closeButton} onPress={() => setSelectedItem(null)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>

              <Text style={styles.modalTitle}>{selectedItem?.defiNom}</Text>
              <Text style={styles.modalSubtitle}>
                par <Text style={{ fontWeight: "bold" }}>{selectedItem?.username}</Text> le{" "}
                <Text style={{ fontWeight: "bold" }}>{selectedItem?.dateSoumission}</Text>
                {"  "}•{"  "}
                <Text style={{ fontWeight: "bold" }}>+{selectedItem?.points} pts</Text>
              </Text>

              {/* --- IMAGE SÉLECTIONNÉE --- */}
              <View style={styles.modalImageContainer}>
                {selectedItem?.imageUri ? (
                  <Image source={{ uri: selectedItem.imageUri }} style={styles.modalImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.modalImage, styles.placeholderImage]}>
                    <Ionicons name="image-outline" size={40} color="#aaa" />
                    <Text style={{color: '#aaa', marginTop: 10}}>Aucune image</Text>
                  </View>
                )}
              </View>

              <View style={styles.actionButtonsRow}>
                <Pressable style={[styles.actionButton, styles.buttonValidate]} onPress={handleValidate}>
                  <Text style={styles.buttonText}>Valider le défi</Text>
                </Pressable>

                <Pressable style={[styles.actionButton, styles.buttonReject]} onPress={handleReject}>
                  <Text style={styles.buttonText}>Refuser</Text>
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
    backgroundColor: "#fff",
    paddingTop: 70,
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },

  // --- BARRE DE RECHERCHE ---
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
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
    justifyContent: "space-between",
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 15,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 13,
    color: "#666",
  },
  iconButton: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
  },
  emptyText: {
    marginTop: 30,
    textAlign: "center",
    color: "#888",
    fontStyle: "italic",
  },

  // --- MODAL ---
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    paddingTop: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 10,
    padding: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
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
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonValidate: {
    backgroundColor: "#81C784",
  },
  buttonReject: {
    backgroundColor: "#E57373",
  },
  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },
  modalImageContainer: {
    width: '100%',
    aspectRatio: 1, 
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 25,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
