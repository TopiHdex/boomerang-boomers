import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocalSearchParams, useRouter } from "expo-router";

import { useTheme } from "@/hooks/use-theme";
import { Spacing } from "@/constants/theme";

const PROBLEMS = [
    "Espera larga",
    "Sin estacionamiento",
    "Personal poco profesional",
    "Pedido incompleto",
    "Pedido incorrecto",
    "Cliente no encontrado",
    "Dirección incorrecta",
    "Sin acceso al domicilio",
];

export default function ReportProblemScreen() {
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const router = useRouter();
    const colors = useTheme();
    const [selected, setSelected] = useState<string[]>([]);

    const toggle = (problem: string) =>
        setSelected((prev) =>
            prev.includes(problem) ? prev.filter((p) => p !== problem) : [...prev, problem],
        );

    const handleSubmit = () => {
        console.log("delivery_problem_reported", { order_id: orderId, problems: selected });
        router.back();
    };

    return (
        <SafeAreaView
            edges={["bottom"]}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.hint, { color: colors.textSecondary }]}>
                    Selecciona todo lo que aplique
                </Text>
                <View style={styles.grid}>
                    {PROBLEMS.map((problem) => {
                        const isSelected = selected.includes(problem);
                        return (
                            <TouchableOpacity
                                key={problem}
                                style={[
                                    styles.problemBtn,
                                    {
                                        backgroundColor: isSelected
                                            ? colors.accent
                                            : colors.backgroundElement,
                                    },
                                ]}
                                onPress={() => toggle(problem)}
                            >
                                <Text
                                    style={[
                                        styles.problemText,
                                        { color: isSelected ? "#fff" : colors.text },
                                    ]}
                                >
                                    {problem}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.submitBtn,
                        { backgroundColor: colors.accent },
                        selected.length === 0 && styles.submitBtnDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={selected.length === 0}
                >
                    <Text style={styles.submitBtnText}>Enviar reporte</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: Spacing.three, paddingVertical: 72, gap: Spacing.three },
    hint: { fontSize: 14 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    problemBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
    problemText: { fontSize: 14 },
    footer: { padding: Spacing.three },
    submitBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
    submitBtnDisabled: { opacity: 0.4 },
    submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
