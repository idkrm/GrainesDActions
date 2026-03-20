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

// CORRECTION DE L'IMPORT : On utilise le même fichier pour auth et database
import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    runTransaction,
} from "firebase/firestore";
import { auth, db } from "@/firebaseBD/firebaseConfig";

const IMAGES_LOCALES: Record<string, any> = {
  "covoiturage.png": require("@/assets/images/covoiturage.png"),
  "composte.png": require("@/assets/images/composte.png"),
  "repas.png": require("@/assets/images/repas.png"),
  "gourde.png": require("@/assets/images/gourde.png"),
  "recuperateur.png": require("@/assets/images/recuperateur.png"),
  "occasion.png": require("@/assets/images/occasion.png"),
  "produit.png": require("@/assets/images/produit.png"),
  "linge.png": require("@/assets/images/linge.png"),
  "local.png": require("@/assets/images/local.png"),
  "mail.png": require("@/assets/images/mail.png"),
  "sac.png": require("@/assets/images/sac.png"),
  "marche.png": require("@/assets/images/marche.png"),
  "bocal.png": require("@/assets/images/bocal.png"),
  "sansviande.png": require("@/assets/images/sansviande.png"),
  "trier.png": require("@/assets/images/trier.png"),
  "pas.png": require("@/assets/images/pas.png"),
  "nettoyage.png": require("@/assets/images/nettoyage.png"),
  "appareil.png": require("@/assets/images/appareil.png"),
  "dechet.png": require("@/assets/images/dechet.png"),
  "papier.png": require("@/assets/images/papier.png"),
};

interface Defi {
    categorie?: number[];
    co2?: number;
    nom?: string;
    description?: string;
    pourquoi?: string;
    defiEnCours?: boolean;
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
    const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});

    const [checkingUser, setCheckingUser] = useState(true);
    const [alreadyAccepted, setAlreadyAccepted] = useState(false);
    const [accepting, setAccepting] = useState(false);

    // 1) Charger les noms des catégories pour l'affichage des badges
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const snap = await getDocs(collection(db, "Categories"));
                const mapping: Record<number, string> = {};
                snap.forEach(docSnap => {
                    mapping[Number(docSnap.id)] = docSnap.data().nom;
                });
                setCategoryMap(mapping);
            } catch (e) {
                console.error("Erreur catégories :", e);
            }
        };
        fetchCategories();
    }, []);

    // 2) Charger le détail du défi
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

    // 3) Vérifier si l'utilisateur a déjà accepté ce défi
    useEffect(() => {
        const checkAlreadyAccepted = async () => {
            try {
                setCheckingUser(true);
                const user = auth.currentUser;
                if (!user || !defiId) return;

                const userSnap = await getDoc(doc(db, "Users", user.uid));
                if (userSnap.exists()) {
                    const defiEnCoursRaw = (userSnap.data()?.defi_en_cours ?? []) as any[];
                    const hasDefi = defiEnCoursRaw.some((v) => String(v) === String(defiId));
                    setAlreadyAccepted(hasDefi);
                }
            } catch (e) {
                console.log("Error check accepted", e);
            } finally {
                setCheckingUser(false);
            }
        };

        checkAlreadyAccepted();
    }, [defiId]);

    // 4) Accepter un défi (Transaction Firestore)
    const handleAccept = async () => {
        try {
            if (!defiId) return;
            const user = auth.currentUser;
            if (!user) {
                Alert.alert("Connexion requise", "Connecte-toi pour accepter un défi.");
                return;
            }

            setAccepting(true);
            const userRef = doc(db, "Users", user.uid);

            await runTransaction(db, async (transaction) => {
                const userSnap = await transaction.get(userRef);
                if (!userSnap.exists()) throw new Error("Utilisateur introuvable.");

                const defiEnCoursRaw = (userSnap.data()?.defi_en_cours ?? []) as any[];
                if (defiEnCoursRaw.length >= MAX_DEFIS) {
                    throw new Error(`Tu as déjà ${MAX_DEFIS} défis en cours.`);
                }

                transaction.update(userRef, {
                    defi_en_cours: arrayUnion(String(defiId)),
                });
            });

            setAlreadyAccepted(true);
            Alert.alert("Défi accepté !", "Le défi a été ajouté à tes défis en cours.");
        } catch (e: any) {
            Alert.alert("Impossible", e?.message ?? "Erreur lors de l'acceptation.");
        } finally {
            setAccepting(false);
        }
    };

    // 5) Abandonner un défi
    const handleCancel = async () => {
        if (!defiId) return;
        const user = auth.currentUser;
        if (!user) return;

        setAccepting(true);
        try {
            const userRef = doc(db, "Users", user.uid);
            await runTransaction(db, async (transaction) => {
                transaction.update(userRef, {
                    defi_en_cours: arrayRemove(String(defiId)),
                });
            });
            setAlreadyAccepted(false);
            Alert.alert("Annulé", "Tu as abandonné ce défi.");
        } catch (e) {
            Alert.alert("Erreur", "Impossible d'annuler pour le moment.");
        } finally {
            setAccepting(false);
        }
    };

    const handleValidate = () => {
        router.push({ pathname: "/(routes)/validationDefi", params: { id: defiId } });
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
                <Ionicons name="alert-circle-outline" size={50} color="#ccc" />
                <Text style={{ color: '#888', marginTop: 10 }}>Défi introuvable.</Text>
            </View>
        );
    }

    // Image
    const imageSource = defi.image && IMAGES_LOCALES[defi.image] 
        ? IMAGES_LOCALES[defi.image] 
        : (defi.image?.startsWith('http') ? { uri: defi.image } : null);

    return (
        <View style={styles.mainContainer}>
            
            {/* HEADER TOP (Bouton retour) */}
            <View style={styles.headerTop}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="#1A1A1A" />
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* TITRES */}
                <View style={styles.headerTitles}>
                    <Text style={styles.title}>Détail du défi</Text>
                </View>

                <View style={styles.imageContainer}>
                    {imageSource ? (
                        <Image source={imageSource} style={styles.image} />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Ionicons name="leaf-outline" size={40} color="#81C784" />
                        </View>
                    )}
                </View>

                <Text style={styles.defiName}>{defi.nom}</Text>

                {/* BADGE DE RÉCOMPENSE */}
                <View style={styles.rewardBadge}>
                    <MaterialCommunityIcons name="star-circle" size={24} color="#F57C00" />
                    <Text style={styles.rewardText}>+{((defi.difficulte ?? 0) * 10)} pts à gagner</Text>
                </View>

                {/* CHIPS (CATÉGORIES & DIFFICULTÉ) */}
                <View style={styles.badgeRow}>
                    <View style={styles.badge}>
                        <Ionicons name="bar-chart-outline" size={14} color="#666" />
                        <Text style={styles.badgeText}> Difficulté : {defi.difficulte}/5</Text>
                    </View>
                    
                    {defi.co2 && (
                        <View style={[styles.badge, { backgroundColor: '#E1F5FE' }]}>
                            <Ionicons name="cloudy-outline" size={14} color="#0288D1" />
                            <Text style={[styles.badgeText, { color: '#0288D1' }]}> {defi.co2} kg CO2</Text>
                        </View>
                    )}

                    {/* Affichage des noms de catégories au lieu des IDs */}
                    {defi.categorie?.map((catId, index) => (
                        <View key={index} style={styles.badge}>
                            <Text style={styles.badgeText}>{categoryMap[catId] || "Catégorie"}</Text>
                        </View>
                    ))}
                </View>

                {/* SECTIONS DE TEXTE */}
                <View style={styles.textCard}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>{defi.description}</Text>
                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Pourquoi c'est important ?</Text>
                    <Text style={styles.descriptionText}>{defi.pourquoi || "Pour protéger notre planète au quotidien."}</Text>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* FOOTER ACTIONS FLOATING */}
            {!checkingUser && (
                <View style={styles.footerContainer}>
                    {!alreadyAccepted ? (
                        <Pressable style={styles.mainButton} onPress={handleAccept} disabled={accepting}>
                            {accepting ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainButtonText}>Relever le défi</Text>}
                        </Pressable>
                    ) : (
                        <View style={styles.activeButtonsRow}>
                            <Pressable style={styles.cancelButton} onPress={handleCancel} disabled={accepting}>
                                <Ionicons name="close" size={24} color="#E57373" />
                            </Pressable>
                            <Pressable style={styles.validateButton} onPress={() => router.push({ pathname: "/(routes)/validationDefi", params: { id: defiId } })}>
                                <Text style={styles.mainButtonText}>J'ai réussi !</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#FAFAFA', paddingTop: 50 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    scrollContent: { paddingHorizontal: 20 },
    headerTop: { paddingHorizontal: 20, marginBottom: 10 },
    backButton: { alignSelf: 'flex-start' },
    headerTitles: { marginBottom: 20 },
    title: { fontSize: 28, fontWeight: '900', color: '#1A1A1A' },
    imageContainer: { width: "100%", height: 220, borderRadius: 24, marginBottom: 20, overflow: 'hidden', backgroundColor: '#fff' },
    image: { width: "100%", height: "100%", resizeMode: 'cover' },
    placeholderImage: { flex: 1, backgroundColor: "#E8F5E9", justifyContent: 'center', alignItems: 'center' },
    defiName: { fontSize: 24, fontWeight: "800", color: "#1A1A1A", marginBottom: 15 },
    rewardBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', padding: 12, borderRadius: 16, marginBottom: 20, alignSelf: 'flex-start' },
    rewardText: { color: '#E65100', fontWeight: '900', fontSize: 15, marginLeft: 8 },
    badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 25 },
    badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: "#fff", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: "#EEE" },
    badgeText: { fontWeight: "600", color: "#666", fontSize: 13 },
    textCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1A1A1A", marginBottom: 8 },
    descriptionText: { fontSize: 15, color: "#555", lineHeight: 22 },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 20 },
    footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#EEE' },
    mainButton: { backgroundColor: "#65B369", padding: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    mainButtonText: { fontSize: 16, fontWeight: "800", color: "#fff" },
    activeButtonsRow: { flexDirection: 'row', gap: 12 },
    cancelButton: { width: 56, height: 56, backgroundColor: "#FFEBEE", borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFCDD2' },
    validateButton: { flex: 1, backgroundColor: "#65B369", borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
});