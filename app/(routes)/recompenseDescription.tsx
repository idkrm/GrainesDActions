import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { database } from "../firebaseConfig"; // adapte si ton export = db

interface Recompense {
    nom?: string;
    description?: string;
    nb_points?: number;
    logo_url?: string; // On utilise logo_url comme vu précédemment
    conditions?: string; // Optionnel : si tu as ajouté des conditions
}

export default function RewardPreview() {
    // Récupération de l'ID passé en paramètre de navigation
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

                // ✅ Changement ici : Collection "Recompenses"
                const ref = doc(database, "Recompenses", String(rewardId));
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

    // Gestion de l'image (soit logo_url, soit une image par défaut locale si tu en as une)
    const imageUrl = recompense.logo_url && recompense.logo_url.trim() !== "" 
        ? { uri: recompense.logo_url } 
        : null; // Tu pourrais mettre un require('../../assets/images/default.png') ici

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* ✅ Image du magasin ou de la récompense */}
            {imageUrl && (
                <Image source={imageUrl} style={styles.image} resizeMode="contain" />
            )}

            {/* ✅ Nom de la récompense */}
            <Text style={styles.title}>{recompense.nom ?? "Récompense sans nom"}</Text>

            {/* ✅ Coût en points */}
            <View style={styles.badgeRow}>
                <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>
                        {recompense.nb_points ?? 0} points
                    </Text>
                </View>
                
                {/* Exemple d'un autre badge si besoin */}
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>Dispo</Text>
                </View>
            </View>

            {/* ✅ Description */}
            <Text style={styles.label}>Détails de l'offre</Text>
            <Text style={styles.text}>{recompense.description ?? "Aucune description fournie."}</Text>

            {/* ✅ Conditions (Optionnel, si tu as ce champ dans ta BD) */}
            {recompense.conditions && (
                <>
                    <Text style={styles.label}>Conditions</Text>
                    <Text style={styles.text}>{recompense.conditions}</Text>
                </>
            )}

            {/* Ici, tu pourras ajouter un bouton "Acheter" plus tard */}
            
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1, // Important pour le ScrollView
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
        backgroundColor: "#fafafa", // Gris très clair si l'image charge mal
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
        backgroundColor: "#E8F5E9", // Fond Vert clair
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#C8E6C9",
    },
    pointsText: {
        color: "#2E7D32", // Texte Vert foncé
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