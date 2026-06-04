import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@clerk/expo";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Poppins, Spacing } from "@/constants/theme";
import { stopLocationUpdates } from "@/tasks/location";

export default function PerfilScreen() {
    const { signOut } = useAuth();
    const [isSigningOut, setIsSigningOut] = useState(false);

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            // Stop sending location updates before dropping the session.
            await stopLocationUpdates();
            await signOut();
        } catch (err) {
            console.warn("[Perfil] Sign out failed:", err);
            setIsSigningOut(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.inner}>
                <ThemedText type="title">Perfil del boomer</ThemedText>

                <TouchableOpacity
                    style={[styles.button, isSigningOut && styles.buttonDisabled]}
                    onPress={handleSignOut}
                    disabled={isSigningOut}
                >
                    {isSigningOut ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Cerrar sesión</Text>
                    )}
                </TouchableOpacity>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    inner: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: Spacing.four,
        gap: Spacing.four,
    },
    button: {
        backgroundColor: "#d9534f",
        paddingVertical: Spacing.three,
        paddingHorizontal: Spacing.five,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        minWidth: 200,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontFamily: Poppins.semibold,
    },
});
