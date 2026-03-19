import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { db } from "../firebaseConfig"; // adapte si ton export = db

interface Recompense {
    nom?: string;
    description?: string;
    nb_points?: number;
    image?: string;
}

export default function RewardPreview() {
    const { id } = useLocalSearchParams<{ id?: string | string[] }>();
    const rewardId = Array.isArray(id) ? id[0] : id;

    const [recompense, setRecompense] = useState<Recompense | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setNotFound(false);

                if (!rewardId) {
                    setRecompense(null);
                    setNotFound(true);
                    return;
                }

                const ref = doc(db, "Recompenses", String(rewardId));
                const snap = await getDoc(ref);

                if (!snap.exists()) {
                    setRecompense(null);
                    setNotFound(true);
                    return;
                }

                setRecompense(snap.data() as Recompense);
            } catch (e) {
                console.log("Erreur chargement récompense =>", e);
                setRecompense(null);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [rewardId]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2E7D32" />
                <Text style={{ marginTop: 10 }}>Chargement de la récompense...</Text>
            </View>
        );
    }

    if (notFound || !recompense) {
        return (
            <View style={styles.center}>
                <Text>Récompense introuvable.</Text>
            </View>
        );
    }

    const imageUrl = recompense.image && recompense.image.trim() !== "" 
        ? { uri: recompense.image } 
        : null;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Image du magasin ou de la récompense */}
            {imageUrl && (
                <Image source={imageUrl} style={styles.image} resizeMode="contain" />
            )}

            {/* Nom de la récompense */}
            <Text style={styles.title}>{recompense.nom ?? "Récompense sans nom"}</Text>

            {/* Coût en points */}
            <View style={styles.badgeRow}>
                <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>
                        {recompense.nb_points ?? 0} points
                    </Text>
                </View>
                
            </View>

            {/* Description */}
            <Text style={styles.label}>Détails de l'offre</Text>
            <Text style={styles.text}>{recompense.description ?? "Aucune description fournie."}</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: "#fff",
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    image: {
        width: "100%",
        height: 180,
        borderRadius: 14,
        marginBottom: 20,
        backgroundColor: "#fafafa",
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 12,
        color: "#1a1a1a",
        textAlign: "center",
    },
    badgeRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 10,
        marginBottom: 20,
    },
    pointsBadge: {
        backgroundColor: "#E8F5E9",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#C8E6C9",
    },
    pointsText: {
        color: "#2E7D32",
        fontWeight: "700",
        fontSize: 16,
    },
    badge: {
        borderWidth: 1,
        borderColor: "#ddd",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: "#fafafa",
    },
    badgeText: {
        fontWeight: "600",
        color: "#555",
    },
    label: {
        marginTop: 14,
        fontWeight: "700",
        fontSize: 16,
        color: "#333",
        marginBottom: 4,
    },
    text: {
        fontSize: 15,
        color: "#444",
        lineHeight: 22,
    },
});