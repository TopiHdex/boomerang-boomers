import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useRouter } from "expo-router";

import { Poppins } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Order, OrderStatus } from "@/types/order";

const STATUS_LABEL: Record<OrderStatus, string> = {
    EE: "En espera",
    CO: "Confirmado",
    EP: "En preparación",
    ER: "Esperando recolección",
    T: "En trayecto",
    N: "Entregado",
};

const STATUS_COLOR: Record<OrderStatus, { bg: string; text: string }> = {
    EE: { bg: "#FFF3CD", text: "#856404" },
    CO: { bg: "#D1ECF1", text: "#0C5460" },
    EP: { bg: "#FFE2CC", text: "#CC5200" },
    ER: { bg: "#E1D5F4", text: "#59318F" },
    T: { bg: "#CCF0F7", text: "#00838F" },
    N: { bg: "#D4EDDA", text: "#155724" },
};

function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatTotal(order: Order) {
    return parseFloat(order.total).toFixed(2);
}

interface OrderItemCardProps {
    order: Order;
    isActive: boolean;
}

function OrderItemCard({ order, isActive }: OrderItemCardProps) {
    const colors = useTheme();
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);
    const statusColor = STATUS_COLOR[order.status];

    return (
        <View
            style={[
                styles.orderCard,
                { borderColor: isActive ? colors.accent : colors.backgroundElement },
                { backgroundColor: colors.backgroundElement },
            ]}
        >
            <TouchableOpacity
                style={styles.orderHeader}
                onPress={() => setExpanded((v) => !v)}
                activeOpacity={0.7}
            >
                <View style={styles.headerContent}>
                    <Text style={[styles.orderTitle, { color: colors.text }]}>
                        Pedido #{order.id}
                    </Text>
                    <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                        {formatDate(order.created_at)}
                    </Text>
                </View>
                <Text style={[styles.chevron, { color: colors.textSecondary }]}>
                    {expanded ? "▲" : "▼"}
                </Text>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.orderDetails}>
                    <View style={styles.detailRow}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Estado:</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                            <Text style={[styles.statusText, { color: statusColor.text }]}>
                                {STATUS_LABEL[order.status]}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Total:</Text>
                        <Text style={[styles.value, { color: colors.text }]}>
                            ${formatTotal(order)}
                        </Text>
                    </View>

                    {order.order_items.length > 0 && (
                        <View style={styles.itemsSection}>
                            <Text style={[styles.itemsTitle, { color: colors.text }]}>
                                Artículos:
                            </Text>
                            {order.order_items.map((item) => (
                                <View key={item.id} style={styles.lineItem}>
                                    <Text
                                        style={[styles.itemName, { color: colors.text }]}
                                        numberOfLines={1}
                                    >
                                        {item.product.name}
                                    </Text>
                                    <Text style={[styles.itemQty, { color: colors.textSecondary }]}>
                                        x{item.quantity}
                                    </Text>
                                    <Text style={[styles.itemPrice, { color: colors.text }]}>
                                        ${parseFloat(item.product.price).toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.detailBtn,
                            {
                                backgroundColor: isActive
                                    ? colors.accent
                                    : colors.backgroundSelected,
                            },
                        ]}
                        onPress={() => router.push(`/pedido/${order.id}` as never)}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.detailBtnText,
                                { color: isActive ? "#fff" : colors.text },
                            ]}
                        >
                            Ver detalle
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

interface OrdersListProps {
    activeOrders?: Order[];
    orderHistory?: Order[];
    isLoading?: boolean;
}

export function OrdersList({
    activeOrders = [],
    orderHistory = [],
    isLoading = false,
}: OrdersListProps) {
    const colors = useTheme();

    if (isLoading) {
        return (
            <View style={styles.emptyState}>
                <ActivityIndicator color={colors.accent} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    Cargando pedidos...
                </Text>
            </View>
        );
    }

    if (activeOrders.length === 0 && orderHistory.length === 0) {
        return (
            <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No hay pedidos disponibles
                </Text>
            </View>
        );
    }

    const historySlice = orderHistory.slice(0, 5);
    const remaining = orderHistory.length - 5;

    return (
        <View style={styles.container}>
            {activeOrders.length > 0 && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Pedidos Activos
                    </Text>
                    {activeOrders.map((order) => (
                        <OrderItemCard key={order.id} order={order} isActive />
                    ))}
                </View>
            )}

            {orderHistory.length > 0 && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Historial de Pedidos
                    </Text>
                    {historySlice.map((order) => (
                        <OrderItemCard key={order.id} order={order} isActive={false} />
                    ))}
                    {remaining > 0 && (
                        <Text style={[styles.moreOrders, { color: colors.textSecondary }]}>
                            +{remaining} más...
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: 16 },
    section: { gap: 8 },
    sectionTitle: { fontSize: 16, fontFamily: Poppins.bold, marginBottom: 4 },
    emptyState: { alignItems: "center", gap: 8, paddingVertical: 24 },
    emptyText: { fontSize: 14 },
    orderCard: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: "hidden",
    },
    orderHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
    },
    headerContent: { flex: 1, gap: 2 },
    orderTitle: { fontSize: 15, fontFamily: Poppins.semibold },
    orderDate: { fontSize: 12 },
    chevron: { fontSize: 12, paddingLeft: 8 },
    orderDetails: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
    detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    label: { fontSize: 13, flex: 1 },
    value: { fontSize: 13, fontFamily: Poppins.medium, textAlign: "right" },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    statusText: { fontSize: 12, fontFamily: Poppins.medium },
    itemsSection: { gap: 4 },
    itemsTitle: { fontSize: 13, fontFamily: Poppins.semibold },
    lineItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    itemName: { flex: 1, fontSize: 13 },
    itemQty: { fontSize: 13 },
    itemPrice: { fontSize: 13, fontFamily: Poppins.medium },
    detailBtn: { marginTop: 4, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
    detailBtnText: { fontSize: 14, fontFamily: Poppins.semibold },
    moreOrders: { fontSize: 13, textAlign: "center", paddingTop: 4 },
});
