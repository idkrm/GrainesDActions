import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

import { auth, db } from "@/firebaseBD/firebaseConfig";
import {
    arrayRemove,
    arrayUnion,
    doc,
    getDoc,
    runTransaction,
    serverTimestamp
} from "firebase/firestore";


interface Defi {
    categorie?: string[];
    co2?: number;
    nom?: string;
    description?: string;
    pourquoi?:string;
    defiEnCours?:boolean;
    validation?: boolean;
    difficulte?: number;
    image?: string;
}

const MAX_DEFIS = 3;

export default function ChallengeDescription() {
    const { id } = useLocalSearchParams<{ id?: string | string[] }>();
    const defiId = Array.isArray(id) ? id[0] : id;
    const router = useRouter();

    const [defi, setDefi] = useState<Defi | null>(null);
    const [loadingDefi, setLoadingDefi] = useState(true);

    const [checkingUser, setCheckingUser] = useState(true);
    const [alreadyAccepted, setAlreadyAccepted] = useState(false);

    const [accepting, setAccepting] = useState(false);

    // 1) Charger le défi
    useEffect(() => {
        const loadDefi = async () => {
            try {
                setLoadingDefi(true);
                if (!defiId) return;

                const ref = doc(db, "Defis", String(defiId));
                const snap = await getDoc(ref);

                if (snap.exists()) setDefi(snap.data() as Defi);
                else setDefi(null);
            } catch (e) {
                console.log(e);
                setDefi(null);
            } finally {
                setLoadingDefi(false);
            }
        };

        loadDefi();
    }, [defiId]);

    // 2) Vérifier côté user si déjà accepté (défi présent dans defi_en_cours)
    useEffect(() => {
        const checkAlreadyAccepted = async () => {
            try {
                setCheckingUser(true);

                const user = auth.currentUser;
                if (!user || !defiId) {
                    setAlreadyAccepted(false);
                    return;
                }

                const userSnap = await getDoc(doc(db, "Users", user.uid));
                if (!userSnap.exists()) {
                    setAlreadyAccepted(false);
                    return;
                }

                const defiEnCours = (userSnap.data()?.defi_en_cours ?? []) as string[];
                setAlreadyAccepted(defiEnCours.includes(String(defiId)));
            } catch (e) {
                console.log("CHECK ACCEPTED ERROR =>", e);
                setAlreadyAccepted(false);
            } finally {
                setCheckingUser(false);
            }
        };

        checkAlreadyAccepted();
    }, [defiId]);

    // 3) Accepter un défi (béton) : transaction + règles
    const handleAccept = async () => {
        try {
            if (!defiId) return;

            const user = auth.currentUser;
            if (!user) {
                Alert.alert("Connexion requise", "Tu dois être connecté(e) pour accepter un défi.");
                // @ts-ignore
                router.replace("/(routes)/login");
                return;
            }

            setAccepting(true);

            const userRef = doc(db, "Users", user.uid);
            const currentId = Number(defiId);

            await runTransaction(db, async (transaction) => {
                const userSnap = await transaction.get(userRef);
                if (!userSnap.exists()) throw new Error("Utilisateur introuvable.");

                const defiEnCours = (userSnap.data()?.defi_en_cours ?? []) as number[];

                //  Règle 1 : pas 2 fois le même défi
                if (defiEnCours.includes(currentId)) {
                    throw new Error("Tu as déjà accepté ce défi !");
                }

                //  Règle 2 : max 3 défis en cours
                if (defiEnCours.length >= MAX_DEFIS) {
                    throw new Error(`Tu as déjà ${MAX_DEFIS} défis en cours. Termine-en un avant d'en accepter un autre.`);
                }

                //  Ajout
                transaction.update(userRef, {
                    defi_en_cours: arrayUnion(currentId),
                });
            });

            setAlreadyAccepted(true); // pour cacher le bouton sans attendre un refresh
            Alert.alert("Défi accepté ✅", "Le défi a été ajouté à tes défis en cours.");
            // tu peux router.back() si tu veux revenir automatiquement
            // router.back();
        } catch (e: any) {
            Alert.alert("Impossible", e?.message ?? "Erreur lors de l'acceptation du défi.");
        } finally {
            setAccepting(false);
        }
    };

    const handleValidate = async () => {
        try {
            if (!defiId) return;

            const user = auth.currentUser;
            if (!user) {
                Alert.alert("Connexion requise", "Tu dois être connecté(e) pour valider un défi.");
                // @ts-ignore
                router.replace("/(routes)/login");
                return;
            }

            setAccepting(true);

            const userRef = doc(db, "Users", user.uid);

            // 🔥 Document compteur (à créer automatiquement si absent)
            const counterRef = doc(db, "Counters", "HistoriqueDefis");

            await runTransaction(db, async (transaction) => {
                // 1) Lire user
                const userSnap = await transaction.get(userRef);
                if (!userSnap.exists()) throw new Error("Utilisateur introuvable.");

                const defiEnCours = (userSnap.data()?.defi_en_cours ?? []) as string[];
                const currentId = String(defiId);

                // Le défi doit être dans la liste pour pouvoir être validé
                if (!defiEnCours.includes(currentId)) {
                    throw new Error("Ce défi n'est pas dans tes défis en cours.");
                }

                // 2) Lire / init compteur
                const counterSnap = await transaction.get(counterRef);

                let nextId: number;

                if (!counterSnap.exists()) {
                    // Si le compteur n'existe pas encore : on le crée à 1
                    nextId = 1;
                    transaction.set(counterRef, { nextId: 2 });
                } else {
                    const currentNextId = Number(counterSnap.data()?.nextId ?? 1);
                    nextId = currentNextId;
                    transaction.update(counterRef, { nextId: currentNextId + 1 });
                }

                // 3) Créer l'historique avec ID incrémental
                const historiqueRef = doc(db, "HistoriqueDefis", String(nextId));
                transaction.set(historiqueRef, {
                    DefisID: currentId,
                    UserID: user.uid,
                    DateValidation: serverTimestamp(),
                    State: "En cours", // ✅ par défaut
                });

                // 4) Retirer le défi de defi_en_cours
                transaction.update(userRef, {
                    defi_en_cours: arrayRemove(currentId),
                });
            });

            // UI : on met à jour l'état local
            setAlreadyAccepted(false);

            Alert.alert("Validation envoyée ✅", "Ton défi est passé dans l'historique (État : En cours).");
            router.back();
        } catch (e: any) {
            Alert.alert("Erreur", e?.message ?? "Impossible de valider le défi.");
        } finally {
            setAccepting(false);
        }
    };


    if (loadingDefi) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#65B369" />
            </View>
        );
    }

    if (!defi) {
        return (
            <View style={styles.center}>
                <Text>Défi introuvable.</Text>
            </View>
        );
    }
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="black" />
                </Pressable>
                <Text style={styles.headerTitle}>Défi</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* IMAGE */}
                {defi.image && defi.image.trim() !== "" ? (
                    <Image source={{ uri: defi.image }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={[styles.image, styles.placeholderImage]}>
                        <Text style={{ color: '#556', opacity: 0.5 }}>[image]</Text>
                    </View>
                )}

                {/* TITRE */}
                <Text style={styles.title}>{defi.nom ?? "Nom du défi"}</Text>

                {/* BADGE REWARD */}
                <View style={styles.rewardContainer}>
                    <View style={styles.rewardBadge}>
                        <MaterialCommunityIcons name="trophy-outline" size={20} color="#F57C00" />
                        <Text style={styles.rewardText}>Gain : +{((defi.difficulte ?? 0) * 10)} points</Text>
                    </View>
                </View>

                {/* CHIPS */}
                <View style={styles.badgeRow}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Difficulté : {defi.difficulte ?? 1}/5</Text>
                    </View>
                    {Array.isArray(defi.categorie) && defi.categorie.map((cat, index) => (
                        <View key={index} style={styles.badge}>
                            <Text style={styles.badgeText}>{cat}</Text>
                        </View>
                    ))}
                </View>

                {/* DESCRIPTION */}
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{defi.description ?? "Pas de description."}</Text>

                <Text style={styles.sectionTitle}>Pourquoi est-ce important ?</Text>
                <Text style={styles.descriptionText}>{defi.pourquoi ?? "Pas de description."}</Text>

                {/* petit badge si déjà accepté */}
                {alreadyAccepted && (
                    <View style={styles.acceptedInfo}>
                        <Text style={styles.acceptedText}>✅ Défi déjà accepté</Text>
                    </View>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* FOOTER : soit Accepter, soit Valider */}
            {!checkingUser && (
                <View style={styles.footer}>
                    {!alreadyAccepted ? (
                        <Pressable
                            style={[styles.acceptButton, accepting && { opacity: 0.6 }]}
                            onPress={handleAccept}
                            disabled={accepting}
                        >
                            {accepting ? (
                                <ActivityIndicator />
                            ) : (
                                <Text style={styles.acceptButtonText}>Accepter ce défi</Text>
                            )}
                        </Pressable>
                    ) : (
                        <Pressable
                            style={styles.acceptButton} // ✅ même style
                            onPress={handleValidate}
                        >
                            <Text style={styles.acceptButtonText}>Valider le défi</Text>
                        </Pressable>
                    )}
                </View>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 70,
    },
    backButton: { marginRight: 15 },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },

    scrollContent: { padding: 20 },

    image: {
        width: "100%",
        height: 220,
        borderRadius: 12,
        marginBottom: 15,
        backgroundColor: "#eee",
    },
    placeholderImage: {
        backgroundColor: "#C5E1C5",
        justifyContent: 'center',
        alignItems: 'center',
    },

    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 10,
    },

    rewardContainer: { flexDirection: 'row', marginBottom: 15 },
    rewardBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFE0B2',
    },
    rewardText: {
        color: '#E65100',
        fontWeight: 'bold',
        marginLeft: 6,
        fontSize: 14,
    },

    badgeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 25,
    },
    badge: {
        borderWidth: 1,
        borderColor: "#E0E0E0",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: "#FAFAFA",
    },
    badgeText: { fontWeight: "500", color: "#666", fontSize: 13 },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#000",
    },
    descriptionText: {
        fontSize: 15,
        color: "#333",
        lineHeight: 24,
        textAlign: 'justify',
        marginBottom: 30
    },

    acceptedInfo: {
        alignSelf: "flex-start",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: "#E8F5E9",
        borderWidth: 1,
        borderColor: "#C8E6C9",
    },
    acceptedText: {
        color: "#2E7D32",
        fontWeight: "600",
    },

    footer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
    },
    acceptButton: {
        backgroundColor: "#C5E1C5",
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        elevation: 3,
    },
    acceptButtonText: { fontSize: 16, fontWeight: "600", color: "#000" },
});
