import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { database } from "../firebaseConfig"; // adapte si ton export = db

interface Defi {
    categorie?: string[];
    co2?: number;
    nom?: string;
    description?: string;
    validation?: boolean;
    difficulte?: number; // ✅ champ présent dans ton Firestore (difficulté)
    image?: string;      // ✅ si tu as une URL ou un path
}

export default function ChallengePreview() {
    const { id } = useLocalSearchParams<{ id?: string | string[] }>();
    const defiId = Array.isArray(id) ? id[0] : id;

    const [defi, setDefi] = useState<Defi | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setNotFound(false);

                if (!defiId) {
                    setDefi(null);
                    setNotFound(true);
                    return;
                }

                // ✅ Collection "Defis" (comme dans ta console)
                const ref = doc(database, "Defis", String(defiId));
                const snap = await getDoc(ref);

                if (!snap.exists()) {
                    setDefi(null);
                    setNotFound(true);
                    return;
                }

                setDefi(snap.data() as Defi);
            } catch (e) {
                console.log("Erreur chargement défi =>", e);
                setDefi(null);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [defiId]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
                <Text style={{ marginTop: 10 }}>Chargement...</Text>
            </View>
        );
    }

    if (notFound || !defi) {
        return (
            <View style={styles.center}>
                <Text>Défi introuvable.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* ✅ Image (si tu as une URL) */}
            {!!defi.image && true && defi.image.trim() !== "" && (
                <Image source={{ uri: defi.image }} style={styles.image} resizeMode="cover" />
            )}

            {/* ✅ Nom */}
            <Text style={styles.title}>{defi.nom ?? "Sans titre"}</Text>

            {/* ✅ Difficulté */}
            <View style={styles.badgeRow}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        Difficulté : {defi.difficulte ?? "—"}
                    </Text>
                </View>

                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        CO2 : {typeof defi.co2 === "number" ? `${defi.co2}` : "—"}
                    </Text>
                </View>
            </View>

            {/* ✅ Description */}
            <Text style={styles.label}>Description</Text>
            <Text style={styles.text}>{defi.description ?? "—"}</Text>

            {/* ✅ Catégories */}
            <Text style={styles.label}>Catégories</Text>
            <Text style={styles.text}>
                {Array.isArray(defi.categorie) && defi.categorie.length > 0
                    ? defi.categorie.join(", ")
                    : "—"}
            </Text>

            {/* ✅ Validation */}
            <Text style={styles.label}>Validation</Text>
            <Text style={styles.text}>{defi.validation ? "Oui" : "Non"}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
    },
    image: {
        width: "100%",
        height: 180,
        borderRadius: 14,
        marginBottom: 14,
        backgroundColor: "#eee",
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 12,
    },
    badgeRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 12,
    },
    badge: {
        borderWidth: 1,
        borderColor: "#ddd",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: "#fafafa",
    },
    badgeText: {
        fontWeight: "600",
        color: "#222",
    },
    label: {
        marginTop: 14,
        fontWeight: "700",
        fontSize: 14,
    },
    text: {
        marginTop: 6,
        color: "#333",
        lineHeight: 20,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
