import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@clerk/expo";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { useTheme } from "@/hooks/use-theme";
import { apiRequest } from "@/lib/api";
import type { Order, OrderStatus } from "@/types/order";
import { Spacing } from "@/constants/theme";

// ── Types ──────────────────────────────────────────────────────────────────

interface Business {
    id: number;
    name: string;
    street: string;
    number: string;
    neighborhood: string;
    latitude: number | null;
    longitude: number | null;
}

interface UserPublicInfo {
    display_name: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<OrderStatus, string> = {
    EE: "En espera",
    CO: "Confirmado",
    EP: "En preparación",
    ER: "Listo para recoger",
    T: "En trayecto",
    N: "Entregado",
};

const STATUS_COLOR: Record<OrderStatus, { bg: string; text: string }> = {
    EE: { bg: "#FFF3CD", text: "#856404" },
    CO: { bg: "#D1ECF1", text: "#0C5460" },
    EP: { bg: "#FFE2CC", text: "#CC5200" },
    ER: { bg: "#E1D5F4", text: "#59318F" },
    T:  { bg: "#CCF0F7", text: "#00838F" },
    N:  { bg: "#D4EDDA", text: "#155724" },
};

type MapApp = "google" | "apple" | "waze";

const MAP_APPS: Array<{ value: MapApp; label: string }> = [
    { value: "google", label: "Google Maps" },
    { value: "apple", label: "Apple Maps" },
    { value: "waze", label: "Waze" },
];

function buildMapUrl(app: MapApp, lat: number, lng: number): string {
    switch (app) {
        case "google": return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        case "apple":  return `maps://?daddr=${lat},${lng}&dirflg=d`;
        case "waze":   return `waze://?ll=${lat},${lng}&navigate=yes`;
    }
}

// ── MapAppSelector ─────────────────────────────────────────────────────────

function MapAppSelector({ lat, lng }: { lat: number; lng: number }) {
    const colors = useTheme();
    const [selected, setSelected] = useState<MapApp>("google");

    const openMap = () => {
        const url = buildMapUrl(selected, lat, lng);
        Linking.openURL(url).catch(() =>
            Alert.alert("Error", "No se pudo abrir la aplicación de mapas."),
        );
    };

    return (
        <View style={mapStyles.container}>
            <View style={mapStyles.appRow}>
                {MAP_APPS.map((app) => (
                    <TouchableOpacity
                        key={app.value}
                        style={[
                            mapStyles.appBtn,
                            { borderColor: colors.backgroundSelected },
                            selected === app.value && {
                                backgroundColor: colors.accent,
                                borderColor: colors.accent,
                            },
                        ]}
                        onPress={() => setSelected(app.value)}
                    >
                        <Text
                            style={[
                                mapStyles.appBtnText,
                                { color: selected === app.value ? "#fff" : colors.text },
                            ]}
                        >
                            {app.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity
                style={[mapStyles.openBtn, { backgroundColor: colors.accent }]}
                onPress={openMap}
            >
                <Text style={mapStyles.openBtnText}>
                    Abrir en {MAP_APPS.find((a) => a.value === selected)?.label}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const mapStyles = StyleSheet.create({
    container: { gap: 8, marginTop: 8 },
    appRow: { flexDirection: "row", gap: 6 },
    appBtn: {
        flex: 1,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: "center",
    },
    appBtnText: { fontSize: 12, fontWeight: "500" },
    openBtn: { borderRadius: 10, paddingVertical: 10, alignItems: "center" },
    openBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});

// ── StatusBadge (header right) ─────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
    const color = STATUS_COLOR[status];
    return (
        <View style={[badgeStyles.badge, { backgroundColor: color.bg }]}>
            <Text style={[badgeStyles.text, { color: color.text }]}>
                {STATUS_LABELS[status]}
            </Text>
        </View>
    );
}

const badgeStyles = StyleSheet.create({
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginRight: 4 },
    text: { fontSize: 12, fontWeight: "600" },
});

// ── Main screen ────────────────────────────────────────────────────────────

export default function PedidoDetalleScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const orderId = Number(id);
    const router = useRouter();
    const colors = useTheme();
    const { getToken } = useAuth();
    const getTokenRef = useRef(getToken);
    getTokenRef.current = getToken;

    const [order, setOrder] = useState<Order | null>(null);
    const [business, setBusiness] = useState<Business | null>(null);
    const [client, setClient] = useState<UserPublicInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchDetail = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getTokenRef.current();
            if (!token) return;
            const fetchedOrder = await apiRequest<Order>({
                method: "GET",
                path: `/order/${orderId}/`,
                token,
            });
            setOrder(fetchedOrder);
            const [fetchedBusiness, fetchedClient] = await Promise.all([
                apiRequest<Business>({
                    method: "GET",
                    path: `/business/${fetchedOrder.business}/`,
                    token,
                }),
                apiRequest<UserPublicInfo>({
                    method: "GET",
                    path: `/users/${fetchedOrder.client}/public/`,
                    token,
                }),
            ]);
            setBusiness(fetchedBusiness);
            setClient(fetchedClient);
        } catch {
            Alert.alert("Error", "No se pudo cargar el pedido.");
        } finally {
            setIsLoading(false);
        }
    }, [orderId]);

    useEffect(() => { fetchDetail(); }, [fetchDetail]);

    const updateStatus = async (status: OrderStatus) => {
        const token = await getTokenRef.current();
        if (!token || !order) return;
        setIsUpdating(true);
        try {
            const updated = await apiRequest<Order>({
                method: "PATCH",
                path: `/order/${orderId}/`,
                token,
                data: { status },
            });
            setOrder(updated);
        } catch {
            Alert.alert("Error", "Error al actualizar el estado.");
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <>
                <Stack.Screen options={{ title: "Cargando..." }} />
                <View style={[styles.center, { backgroundColor: colors.background }]}>
                    <ActivityIndicator color={colors.accent} size="large" />
                </View>
            </>
        );
    }

    if (!order) return null;

    const businessAddress = business
        ? `${business.street} ${business.number}, ${business.neighborhood}`
        : "";
    const canPickUp = order.status === "ER";
    const canDeliver = order.status === "T";
    const isDelivered = order.status === "N";

    return (
        <>
            <Stack.Screen
                options={{
                    title: `Pedido #${order.id}`,
                    headerRight: () => <StatusBadge status={order.status} />,
                }}
            />

            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                    {/* Client */}
                    <View style={[styles.section, { backgroundColor: colors.backgroundElement }]}>
                        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Cliente</Text>
                        <View style={styles.clientRow}>
                            <View style={[styles.avatar, { backgroundColor: colors.backgroundSelected }]}>
                                <Text style={styles.avatarText}>👤</Text>
                            </View>
                            <Text style={[styles.clientName, { color: colors.text }]}>
                                {client?.display_name ?? "—"}
                            </Text>
                        </View>
                    </View>

                    {/* Business */}
                    {business && (
                        <View style={[styles.section, { backgroundColor: colors.backgroundElement }]}>
                            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Restaurante</Text>
                            <Text style={[styles.businessName, { color: colors.text }]}>{business.name}</Text>
                            <Text style={[styles.businessAddr, { color: colors.textSecondary }]}>{businessAddress}</Text>
                            {business.latitude != null && business.longitude != null && (
                                <MapAppSelector lat={business.latitude} lng={business.longitude} />
                            )}
                        </View>
                    )}

                    {/* Delivery address — only when en trayecto */}
                    {order.status === "T" && order.delivery_address?.address_detail && (
                        <View style={[styles.section, { backgroundColor: colors.backgroundElement }]}>
                            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                                Dirección de entrega
                            </Text>
                            <Text style={[styles.businessAddr, { color: colors.text }]}>
                                {order.delivery_address.address_detail.address_line},{" "}
                                {order.delivery_address.address_detail.city}
                            </Text>
                            {order.delivery_address.address_detail.latitude != null &&
                                order.delivery_address.address_detail.longitude != null && (
                                    <MapAppSelector
                                        lat={Number(order.delivery_address.address_detail.latitude)}
                                        lng={Number(order.delivery_address.address_detail.longitude)}
                                    />
                                )}
                        </View>
                    )}

                    {/* Order items */}
                    {order.order_items.length > 0 && (
                        <View style={[styles.section, { backgroundColor: colors.backgroundElement }]}>
                            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                                Detalles del pedido
                            </Text>
                            {order.order_items.map((item) => (
                                <View key={item.id} style={styles.lineItem}>
                                    <Text style={[styles.itemQty, { color: colors.textSecondary }]}>
                                        {item.quantity}x
                                    </Text>
                                    <Text style={[styles.itemName, { color: colors.text }]}>
                                        {item.product.name}
                                    </Text>
                                    <Text style={[styles.itemPrice, { color: colors.text }]}>
                                        ${parseFloat(item.product.price).toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                            <View style={[styles.totalRow, { borderTopColor: colors.backgroundSelected }]}>
                                <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                                <Text style={[styles.totalVal, { color: colors.text }]}>
                                    ${parseFloat(order.total).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Bottom actions */}
                <SafeAreaView
                    edges={["bottom"]}
                    style={[styles.actionsContainer, { borderTopColor: colors.backgroundElement }]}
                >
                    {canPickUp && (
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: colors.accent }, isUpdating && styles.disabled]}
                            onPress={() => updateStatus("T")}
                            disabled={isUpdating}
                        >
                            {isUpdating
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.actionBtnText}>He recogido el pedido</Text>
                            }
                        </TouchableOpacity>
                    )}
                    {canDeliver && (
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: "#22c55e" }, isUpdating && styles.disabled]}
                            onPress={() => updateStatus("N")}
                            disabled={isUpdating}
                        >
                            {isUpdating
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.actionBtnText}>He entregado el pedido</Text>
                            }
                        </TouchableOpacity>
                    )}
                    {isDelivered && (
                        <View style={styles.completedBanner}>
                            <Text style={styles.completedText}>Pedido entregado</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={[styles.reportBtn, { borderColor: colors.backgroundSelected }]}
                        onPress={() => router.push(`/pedido/report-problem?orderId=${orderId}` as never)}
                    >
                        <Text style={[styles.reportBtnText, { color: colors.textSecondary }]}>
                            ⚠️ Informar sobre un problema
                        </Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.three, gap: Spacing.three },
    section: { borderRadius: 14, padding: Spacing.three, gap: Spacing.two },
    sectionHeader: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
    clientRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
    avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    avatarText: { fontSize: 18 },
    clientName: { fontSize: 15, fontWeight: "500" },
    businessName: { fontSize: 16, fontWeight: "700" },
    businessAddr: { fontSize: 13 },
    lineItem: { flexDirection: "row", alignItems: "center", gap: 8 },
    itemQty: { fontSize: 13, minWidth: 28 },
    itemName: { flex: 1, fontSize: 13 },
    itemPrice: { fontSize: 13, fontWeight: "500" },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderTopWidth: 1,
        paddingTop: Spacing.two,
        marginTop: 4,
    },
    totalLabel: { fontSize: 15, fontWeight: "700" },
    totalVal: { fontSize: 15, fontWeight: "700" },
    actionsContainer: { padding: Spacing.three, gap: Spacing.two, borderTopWidth: 1 },
    actionBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
    actionBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    disabled: { opacity: 0.6 },
    completedBanner: { borderRadius: 12, paddingVertical: 14, alignItems: "center", backgroundColor: "#D4EDDA" },
    completedText: { fontSize: 16, fontWeight: "600", color: "#155724" },
    reportBtn: { borderRadius: 10, paddingVertical: 10, alignItems: "center", borderWidth: 1 },
    reportBtnText: { fontSize: 14 },
});
