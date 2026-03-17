import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
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
} from "firebase/firestore";

interface Defi {
    categorie?: string[];
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

    // 2) Vérifier côté user si déjà accepté
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

                const defiEnCoursRaw = (userSnap.data()?.defi_en_cours ?? []) as any[];
                const currentId = String(defiId);

                const hasDefi = defiEnCoursRaw.some((v) => String(v) === currentId);
                setAlreadyAccepted(hasDefi);
            } catch (e) {
                console.log("CHECK ACCEPTED ERROR =>", e);
                setAlreadyAccepted(false);
            } finally {
                setCheckingUser(false);
            }
        };

        checkAlreadyAccepted();
    }, [defiId]);

    // 3) Accepter un défi
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
            const currentId = String(defiId);

            await runTransaction(db, async (transaction) => {
                const userSnap = await transaction.get(userRef);
                if (!userSnap.exists()) throw new Error("Utilisateur introuvable.");

                const defiEnCoursRaw = (userSnap.data()?.defi_en_cours ?? []) as any[];
                const already = defiEnCoursRaw.some((v) => String(v) === currentId);

                if (already) {
                    throw new Error("Tu as déjà accepté ce défi !");
                }

                if (defiEnCoursRaw.length >= MAX_DEFIS) {
                    throw new Error(`Tu as déjà ${MAX_DEFIS} défis en cours. Termine-en un avant d'en accepter un autre.`);
                }

                transaction.update(userRef, {
                    defi_en_cours: arrayUnion(currentId),
                });
            });

            setAlreadyAccepted(true);
            Alert.alert("Défi accepté ✅", "Le défi a été ajouté à tes défis en cours.");
        } catch (e: any) {
            Alert.alert("Impossible", e?.message ?? "Erreur lors de l'acceptation du défi.");
        } finally {
            setAccepting(false);
        }
    };

    // 4) Valider un défi
    const handleValidate = () => {
        if (!defiId) return;

        const user = auth.currentUser;
        if (!user) {
            Alert.alert("Connexion requise", "Tu dois être connecté(e) pour valider un défi.");
            // @ts-ignore
            router.replace("/(routes)/login");
            return;
        }

        router.push({
            pathname: "/(routes)/validationDefi",
            params: { id: defiId }
        });
    };

    // 5) Annuler un défi
    const handleCancel = async () => {
        if(!defiId) return;

        const user = auth.currentUser;
        if (!user) {
            Alert.alert("Connexion requise", "Tu dois être connecté(e) pour annuler un défi.");
            // @ts-ignore
            router.replace("/(routes)/login");
            return;
        }

        setAccepting(true);
        const userRef = doc(db, "Users", user.uid);
        const currentId = String(defiId);
        
        try {
            await runTransaction(db, async (transaction) => {
                const userSnap = await transaction.get(userRef);
                if (!userSnap.exists()) throw new Error("Utilisateur introuvable.");

                transaction.update(userRef, {
                    defi_en_cours: arrayRemove(currentId),
                });
            });
            Alert.alert("Annulé", "Tu as abandonné ce défi."); 
            setAlreadyAccepted(false);
        } catch(error){
            Alert.alert("Erreur", "Impossible d'annuler le défi pour le moment.");
        } finally {
            setAccepting(false);
        }
    }

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
                <Ionicons name="alert-circle-outline" size={50} color="#ccc" style={{marginBottom: 10}}/>
                <Text style={{color: '#888', fontSize: 16}}>Défi introuvable.</Text>
            </View>
        );
    }

    return (
        <View style={styles.mainContainer}>
            
            {/* HEADER TOP (Bouton retour) */}
            <View style={styles.headerTop}>
                <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={15}>
                <Ionicons name="arrow-back" size={28} color="#1A1A1A" />
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* TITRES */}
                <View style={styles.headerTitles}>
                    <Text style={styles.title}>Détail du défi</Text>
                </View>

                {/* IMAGE */}
                <View style={styles.imageContainer}>
                    {defi.image && defi.image.trim() !== "" ? (
                        <Image source={{ uri: defi.image }} style={styles.image} resizeMode="cover" />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Ionicons name="leaf-outline" size={40} color="#81C784" />
                        </View>
                    )}
                </View>

                {/* TITRE DU DÉFI */}
                <Text style={styles.defiName}>{defi.nom ?? "Nom du défi"}</Text>

                {/* BADGE DE RÉCOMPENSE */}
                <View style={styles.rewardBadge}>
                    <MaterialCommunityIcons name="star-circle" size={24} color="#F57C00" />
                    <Text style={styles.rewardText}>+{((defi.difficulte ?? 0) * 10)} points à gagner</Text>
                </View>

                {/* CHIPS (CATÉGORIES & DIFFICULTÉ) */}
                <View style={styles.badgeRow}>
                    <View style={styles.badge}>
                        <Ionicons name="bar-chart-outline" size={14} color="#666" style={{marginRight: 4}}/>
                        <Text style={styles.badgeText}>Difficulte : {defi.difficulte ?? 1}/5</Text>
                    </View>
                    
                    {/* Badge CO2 (ajouté car présent dans ton interface) */}
                    {defi.co2 !== undefined && (
                        <View style={[styles.badge, {backgroundColor: '#E1F5FE', borderColor: '#B3E5FC'}]}>
                            <Ionicons name="cloudy-outline" size={14} color="#0288D1" style={{marginRight: 4}}/>
                            <Text style={[styles.badgeText, {color: '#0288D1'}]}>{defi.co2} kg CO2</Text>
                        </View>
                    )}

                    {Array.isArray(defi.categorie) && defi.categorie.map((cat, index) => (
                        <View key={index} style={styles.badge}>
                            <Text style={styles.badgeText}>{cat}</Text>
                        </View>
                    ))}
                </View>

                {/* SECTIONS DE TEXTE */}
                <View style={styles.textCard}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>{defi.description ?? "Aucune description fournie pour ce défi."}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Pourquoi c'est important ?</Text>
                    <Text style={styles.descriptionText}>{defi.pourquoi ?? "Chaque petite action compte pour la planète !"}</Text>
                </View>

                {/* ESPACE POUR FOOTER */}
                <View style={{ height: 130 }} />
            </ScrollView>

            {/* FOOTER ACTIONS FLOATING */}
            {!checkingUser && (
                <View style={styles.footerContainer}>
                    {!alreadyAccepted ? (
                        <Pressable
                            style={[styles.mainButton, accepting && { opacity: 0.6 }]}
                            onPress={handleAccept}
                            disabled={accepting}
                        >
                            {accepting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                  <Text style={styles.mainButtonText}>Relever le défi</Text>
                                  <Ionicons name="flag-outline" size={20} color="#fff" style={{marginLeft: 8}} />
                                </>
                            )}
                        </Pressable>
                    ) : (
                        <View style={styles.activeButtonsRow}>
                            <Pressable 
                                style={[styles.cancelButton, accepting && { opacity: 0.6 }]}
                                onPress={handleCancel} 
                                disabled={accepting}
                            >
                                <Ionicons name="close" size={24} color="#E57373" />
                            </Pressable>

                            <Pressable
                                style={[styles.validateButton, accepting && { opacity: 0.6 }]}
                                onPress={handleValidate} 
                                disabled={accepting}
                            >
                                {accepting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                      <Text style={styles.mainButtonText}>J'ai réussi !</Text>
                                      <Ionicons name="checkmark-circle-outline" size={22} color="#fff" style={{marginLeft: 8}} />
                                    </>
                                )}
                            </Pressable>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#FAFAFA', 
        paddingTop: 50,
    },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },

    scrollContent: {
        paddingHorizontal: 20,
    },

    // --- HEADER ---
    headerTop: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    backButton: {
        alignSelf: 'flex-start',
        padding: 5,
        marginLeft: -5,
    },
    headerTitles: {
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1A1A1A',
    },

    // --- IMAGE ---
    imageContainer: {
        width: "100%",
        height: 220,
        borderRadius: 24,
        marginBottom: 20,
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
        overflow: 'hidden',
    },
    image: {
        width: "100%",
        height: "100%",
    },
    placeholderImage: {
        flex: 1,
        backgroundColor: "#E8F5E9",
        justifyContent: 'center',
        alignItems: 'center',
    },

    // --- INFOS DÉFI ---
    defiName: {
        fontSize: 26,
        fontWeight: "800",
        color: "#1A1A1A",
        marginBottom: 15,
        lineHeight: 32,
    },
    
    // --- RECOMPENSE ---
    rewardBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#FFF3E0',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginBottom: 20,
    },
    rewardText: {
        color: '#E65100',
        fontWeight: '900',
        fontSize: 15,
        marginLeft: 8,
    },

    // --- TAGS (CHIPS) ---
    badgeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 30,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: "#E0E0E0",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: "#fff",
    },
    badgeText: { 
        fontWeight: "600", 
        color: "#555", 
        fontSize: 13 
    },

    // --- TEXTE DESCRIPTIF ---
    textCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 10,
        color: "#1A1A1A",
    },
    descriptionText: {
        fontSize: 15,
        color: "#555",
        lineHeight: 24,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 20,
    },

    // --- FOOTER FLOATING ---
    footerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 35 : 20,
        paddingTop: 15,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    
    // Bouton principal (Accepter)
    mainButton: {
        flexDirection: 'row',
        backgroundColor: "#65B369",
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#65B369",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    mainButtonText: { 
        fontSize: 17, 
        fontWeight: "800", 
        color: "#fff" 
    },

    // Boutons quand le défi est en cours
    activeButtonsRow: {
        flexDirection: 'row',
        gap: 15,
        justifyContent: 'space-between',
    },
    cancelButton: {
        backgroundColor: "#FFEBEE", 
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    validateButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: "#65B369",
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#65B369",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
});