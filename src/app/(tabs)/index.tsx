import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PoliticasProteccionModal } from "@/components/politicas-proteccion";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useDriverAvailability } from "@/hooks/use-driver-availability";
import { useTheme } from "@/hooks/use-theme";

export default function PedidosScreen() {
    const colors = useTheme();
    const { isAvailable, isLoading, isToggling, toggleAvailability } = useDriverAvailability();
    const [showPolicies, setShowPolicies] = useState(false);

    const handleToggle = () => {
        if (isAvailable) {
            toggleAvailability(false).catch(() => {
                Alert.alert("Error", "Error al actualizar disponibilidad. Inténtelo nuevamente.");
            });
        } else {
            setShowPolicies(true);
        }
    };

    const handlePoliciesAccepted = () => {
        setShowPolicies(false);
        toggleAvailability(true).catch(() => {
            Alert.alert("Error", "Error al actualizar disponibilidad. Inténtelo nuevamente.");
        });
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.inner}>
                <ThemedText type="title">Administrador de pedidos</ThemedText>

                <View style={styles.statusRow}>
                    {isLoading ? (
                        <ActivityIndicator color={colors.accent} />
                    ) : (
                        <>
                            <View
                                style={[
                                    styles.statusDot,
                                    {
                                        backgroundColor: isAvailable
                                            ? colors.accent
                                            : colors.textSecondary,
                                    },
                                ]}
                            />
                            <ThemedText style={styles.statusText}>
                                {isAvailable ? "¡Estás conectado!" : "¡Estás desconectado!"}
                            </ThemedText>
                        </>
                    )}
                </View>

                <TouchableOpacity
                    style={[
                        styles.button,
                        {
                            backgroundColor: isAvailable ? "#d9534f" : colors.accent,
                        },
                        (isToggling || isLoading) && styles.buttonDisabled,
                    ]}
                    onPress={handleToggle}
                    disabled={isToggling || isLoading}
                >
                    {isToggling ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>
                            {isAvailable ? "Detener Operaciones" : "Iniciar Operaciones"}
                        </Text>
                    )}
                </TouchableOpacity>
            </SafeAreaView>

            <PoliticasProteccionModal
                visible={showPolicies}
                onClose={() => setShowPolicies(false)}
                onAccept={handlePoliciesAccepted}
                isLoading={isToggling}
            />
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
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.two,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    statusText: {
        fontSize: 16,
    },
    button: {
        paddingVertical: Spacing.three,
        paddingHorizontal: Spacing.five,
        borderRadius: 12,
        alignItems: "center",
        minWidth: 220,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});
