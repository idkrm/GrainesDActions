import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { database } from "../firebaseConfig";

interface Defi {
    categorie?: string[];
    co2?: number;
    nom?: string;
    description?: string;
    validation?: boolean;
    difficulte?: number;
    image?: string;
}

export default function ChallengeDescription() {
    const { id } = useLocalSearchParams<{ id?: string | string[] }>();
    const defiId = Array.isArray(id) ? id[0] : id;
    const router = useRouter();

    const [defi, setDefi] = useState<Defi | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                if (!defiId) return;
                const ref = doc(database, "Defis", String(defiId));
                const snap = await getDoc(ref);
                if (snap.exists()) setDefi(snap.data() as Defi);
            } catch (e) {
                console.log(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [defiId]);

    const handleAccept = () => {
        console.log("Défi accepté !");
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#65B369" /></View>;
    if (!defi) return <View style={styles.center}><Text>Défi introuvable.</Text></View>;

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

                {/* INFO (Points / Difficulté / Catégorie) */}
                <View style={styles.rewardContainer}>
                    <View style={styles.rewardBadge}>
                        <MaterialCommunityIcons name="trophy-outline" size={20} color="#F57C00" />
                        <Text style={styles.rewardText}>
                            Gain : +{defi.co2 ?? 0} points
                        </Text>
                    </View>
                </View>

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
                <Text style={styles.descriptionText}>
                    {defi.description ?? "Pas de description."}
                </Text>

                <Text style={styles.sectionTitle}>Pourquoi est-ce important ?</Text>
                <Text style={styles.descriptionText}>
                    {defi.description ?? "Pas de description."}
                </Text>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* BOUTON ACCEPTER */}
            <View style={styles.footer}>
                <Pressable style={styles.acceptButton} onPress={handleAccept}>
                    <Text style={styles.acceptButtonText}>Accepter ce défi</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 70,
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
    },

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

    // --- STYLE RÉCOMPENSE ---
    rewardContainer: {
        flexDirection: 'row',
        marginBottom: 15,
    },
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

    // --- CHIPS ---
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
        marginBottom: 40
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