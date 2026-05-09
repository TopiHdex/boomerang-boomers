import React, { useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const POLICIES = [
    { key: "helmet", label: "Estoy usando casco" },
    { key: "vehicleGoodCondition", label: "Mi vehículo está en buen estado" },
    {
        key: "noSymptoms",
        label: "No tengo síntomas de ninguna enfermedad",
    },
    { key: "noMedication", label: "No estoy tomando medicamentos" },
    {
        key: "noStress",
        label: "No estoy bajo presión o estrés de alguna situación personal",
    },
    {
        key: "noAlcoholLast24",
        label: "No tomé alcohol en las últimas 24 horas",
    },
    { key: "goodRest", label: "He descansado bien" },
    { key: "goodNutrition", label: "Me he alimentado correctamente" },
    {
        key: "trafficRegulations",
        label: "Conozco y respeto el reglamento vial",
    },
] as const;

type PolicyKey = (typeof POLICIES)[number]["key"];

type CheckedState = Record<PolicyKey, boolean>;

const initialChecked = Object.fromEntries(POLICIES.map((p) => [p.key, false])) as CheckedState;

interface Props {
    visible: boolean;
    onAccept: () => void;
    onClose: () => void;
    isLoading?: boolean;
}

export function PoliticasProteccionModal({ visible, onAccept, onClose, isLoading }: Props) {
    const colors = useTheme();
    const [checked, setChecked] = useState<CheckedState>(initialChecked);

    const allChecked = Object.values(checked).every(Boolean);

    const toggle = (key: PolicyKey) => {
        setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleAccept = () => {
        if (!allChecked || isLoading) return;
        onAccept();
        setChecked(initialChecked);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        Políticas de Protección
                    </Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Asegúrate de cumplir con los siguientes parámetros para cuidar la integridad de
                    los usuarios y de ti mismo.
                </Text>

                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                    {POLICIES.map((policy) => (
                        <TouchableOpacity
                            key={policy.key}
                            style={styles.row}
                            onPress={() => toggle(policy.key)}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.checkbox,
                                    { borderColor: colors.accent },
                                    checked[policy.key] && {
                                        backgroundColor: colors.accent,
                                    },
                                ]}
                            >
                                {checked[policy.key] && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={[styles.label, { color: colors.text }]}>
                                {policy.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <TouchableOpacity
                    style={[
                        styles.acceptButton,
                        { backgroundColor: colors.accent },
                        (!allChecked || isLoading) && styles.disabledButton,
                    ]}
                    onPress={handleAccept}
                    disabled={!allChecked || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.acceptText}>Aceptar</Text>
                    )}
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Spacing.four,
        paddingHorizontal: Spacing.four,
        paddingBottom: Spacing.five,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: Spacing.three,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
    },
    closeButton: {
        padding: Spacing.two,
    },
    closeText: {
        fontSize: 18,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: Spacing.three,
        lineHeight: 20,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        gap: Spacing.three,
        paddingBottom: Spacing.three,
    },
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: Spacing.two,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 4,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: 1,
    },
    checkmark: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "700",
    },
    label: {
        fontSize: 15,
        flex: 1,
        lineHeight: 22,
    },
    acceptButton: {
        paddingVertical: Spacing.three,
        borderRadius: 12,
        alignItems: "center",
        marginTop: Spacing.three,
    },
    disabledButton: {
        opacity: 0.4,
    },
    acceptText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});
