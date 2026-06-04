import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { useMutation } from "@tanstack/react-query";
import Svg, { Circle } from "react-native-svg";

import { Spacing } from "@/constants/theme";
import { useApiClient } from "@/hooks/use-api";
import { useTheme } from "@/hooks/use-theme";
import type { OrderOffer } from "@/types/order";

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

interface Props {
    offer: OrderOffer;
    onResponded: () => void;
}

export function OrderOfferSheet({ offer, onResponded }: Props) {
    const colors = useTheme();
    const request = useApiClient();

    const respondMutation = useMutation({
        mutationFn: (action: "accept" | "reject") =>
            request({ method: "POST", path: `/driver/offers/${offer.id}/`, data: { action } }),
        onSuccess: () => onResponded(),
        onError: () => Alert.alert("Error", "Error al responder. Inténtalo nuevamente."),
    });
    const isResponding = respondMutation.isPending;

    const expiresAt = new Date(offer.expires_at).getTime();
    const initialTime = useRef(Math.max(1, Math.floor((expiresAt - Date.now()) / 1000)));
    const [timeLeft, setTimeLeft] = useState(() =>
        Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)),
    );

    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
            setTimeLeft(remaining);
            if (remaining === 0) {
                clearInterval(interval);
                onResponded();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [expiresAt, onResponded]);

    const ratio = timeLeft / initialTime.current;
    const dashOffset = RING_C * (1 - ratio);
    const ringColor = ratio > 0.5 ? colors.accent : ratio > 0.25 ? "#f97316" : "#ef4444";

    const respond = (action: "accept" | "reject") => respondMutation.mutate(action);

    return (
        <Modal
            visible
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => {}}
        >
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.badge}>
                    <View style={[styles.badgeDot, { backgroundColor: colors.accent }]} />
                    <Text style={[styles.badgeText, { color: colors.accent }]}>NUEVO PEDIDO</Text>
                </View>

                <View style={styles.topRow}>
                    <View style={styles.businessInfo}>
                        <Text style={[styles.fromLabel, { color: colors.textSecondary }]}>
                            Desde
                        </Text>
                        <Text style={[styles.businessName, { color: colors.text }]}>
                            {offer.business_name}
                        </Text>
                    </View>

                    <View style={styles.ringWrap}>
                        <Svg width={120} height={120}>
                            <Circle
                                cx={60}
                                cy={60}
                                r={RING_R}
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth={8}
                            />
                            <Circle
                                cx={60}
                                cy={60}
                                r={RING_R}
                                fill="none"
                                stroke={ringColor}
                                strokeWidth={8}
                                strokeLinecap="round"
                                strokeDasharray={RING_C}
                                strokeDashoffset={dashOffset}
                                transform="rotate(-90 60 60)"
                            />
                        </Svg>
                        <View style={styles.ringCenter}>
                            <Text style={[styles.ringNum, { color: ringColor }]}>{timeLeft}</Text>
                            <Text style={[styles.ringSec, { color: colors.textSecondary }]}>
                                seg
                            </Text>
                        </View>
                    </View>
                </View>

                {(offer.business_address ?? offer.delivery_address) && (
                    <View style={styles.route}>
                        {offer.business_address && (
                            <View style={styles.routeStop}>
                                <View
                                    style={[styles.stopDot, { backgroundColor: colors.accent }]}
                                />
                                <View style={styles.stopText}>
                                    <Text
                                        style={[styles.stopLabel, { color: colors.textSecondary }]}
                                    >
                                        Recoge en
                                    </Text>
                                    <Text style={[styles.stopAddr, { color: colors.text }]}>
                                        {offer.business_address}
                                    </Text>
                                </View>
                            </View>
                        )}
                        {offer.business_address && offer.delivery_address && (
                            <View
                                style={[
                                    styles.routeConnector,
                                    {
                                        backgroundColor: colors.backgroundElement,
                                    },
                                ]}
                            />
                        )}
                        {offer.delivery_address && (
                            <View style={styles.routeStop}>
                                <View style={[styles.stopDot, { backgroundColor: "#f97316" }]} />
                                <View style={styles.stopText}>
                                    <Text
                                        style={[styles.stopLabel, { color: colors.textSecondary }]}
                                    >
                                        Entrega en
                                    </Text>
                                    <Text style={[styles.stopAddr, { color: colors.text }]}>
                                        {offer.delivery_address}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.stats}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statVal, { color: colors.text }]}>
                            ${offer.order_total}
                        </Text>
                        <Text style={[styles.statKey, { color: colors.textSecondary }]}>Total</Text>
                    </View>
                    <View style={[styles.statSep, { backgroundColor: colors.backgroundElement }]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statVal, { color: colors.text }]}>
                            {offer.distance_km} km
                        </Text>
                        <Text style={[styles.statKey, { color: colors.textSecondary }]}>
                            Distancia
                        </Text>
                    </View>
                    {offer.estimated_time_minutes != null && (
                        <>
                            <View
                                style={[
                                    styles.statSep,
                                    {
                                        backgroundColor: colors.backgroundElement,
                                    },
                                ]}
                            />
                            <View style={styles.statItem}>
                                <Text style={[styles.statVal, { color: colors.text }]}>
                                    {offer.estimated_time_minutes} min
                                </Text>
                                <Text style={[styles.statKey, { color: colors.textSecondary }]}>
                                    Tiempo est.
                                </Text>
                            </View>
                        </>
                    )}
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[
                            styles.rejectBtn,
                            { borderColor: "#ef4444" },
                            isResponding && styles.disabledBtn,
                        ]}
                        onPress={() => respond("reject")}
                        disabled={isResponding}
                    >
                        <Text style={styles.rejectText}>Rechazar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.acceptBtn,
                            { backgroundColor: colors.accent },
                            isResponding && styles.disabledBtn,
                        ]}
                        onPress={() => respond("accept")}
                        disabled={isResponding}
                    >
                        {isResponding ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.acceptText}>Aceptar</Text>
                        )}
                    </TouchableOpacity>
                </View>
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
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.one,
        marginBottom: Spacing.three,
    },
    badgeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: Spacing.three,
    },
    businessInfo: {
        flex: 1,
        paddingRight: Spacing.two,
    },
    fromLabel: {
        fontSize: 13,
        marginBottom: Spacing.one,
    },
    businessName: {
        fontSize: 22,
        fontWeight: "700",
    },
    ringWrap: {
        width: 120,
        height: 120,
        alignItems: "center",
        justifyContent: "center",
    },
    ringCenter: {
        position: "absolute",
        alignItems: "center",
    },
    ringNum: {
        fontSize: 28,
        fontWeight: "700",
    },
    ringSec: {
        fontSize: 12,
    },
    route: {
        marginBottom: Spacing.three,
        gap: Spacing.two,
    },
    routeStop: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: Spacing.two,
    },
    stopDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 4,
        flexShrink: 0,
    },
    stopText: {
        flex: 1,
    },
    stopLabel: {
        fontSize: 12,
    },
    stopAddr: {
        fontSize: 14,
        fontWeight: "500",
    },
    routeConnector: {
        width: 2,
        height: 12,
        marginLeft: 4,
        borderRadius: 1,
    },
    stats: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        paddingVertical: Spacing.three,
        paddingHorizontal: Spacing.three,
        marginBottom: Spacing.four,
        backgroundColor: "transparent",
        gap: Spacing.two,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
    },
    statVal: {
        fontSize: 18,
        fontWeight: "700",
    },
    statKey: {
        fontSize: 12,
        marginTop: 2,
    },
    statSep: {
        width: 1,
        height: 32,
        borderRadius: 1,
    },
    actions: {
        flexDirection: "row",
        gap: Spacing.three,
        marginTop: "auto",
    },
    rejectBtn: {
        flex: 1,
        paddingVertical: Spacing.three,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: "center",
    },
    rejectText: {
        color: "#ef4444",
        fontSize: 16,
        fontWeight: "600",
    },
    acceptBtn: {
        flex: 1,
        paddingVertical: Spacing.three,
        borderRadius: 12,
        alignItems: "center",
    },
    acceptText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    disabledBtn: {
        opacity: 0.6,
    },
});
