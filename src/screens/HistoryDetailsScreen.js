// src/screens/HistoryDetailsScreen.js
import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const fmt = (iso) =>
    iso
        ? new Date(iso).toLocaleString("ru-RU", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "—";

function Stars({ value = 0 }) {
    return (
        <View style={{ flexDirection: "row", marginVertical: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
                <Ionicons
                    key={n}
                    name="star"
                    size={22}
                    color={n <= (value || 0) ? "#F5B000" : "#D2D8DE"}
                />
            ))}
        </View>
    );
}

function Row({ label, value, disabled }) {
    return (
        <View style={[styles.row, disabled && { opacity: 0.6 }]}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
        </View>
    );
}

export default function HistoryDetailsScreen({ navigation, route }) {
    const order = route?.params?.order || {};

    const passengerName = order?.driver?.name || "Пассажир";
    const passengerRating = order?.ratings?.passenger ?? null;

    const createdAt = order?.timeline?.createdAt || order?.date;
    const finishedAt =
        order?.timeline?.finishedAt || order?.timeline?.cancelledAt || null;
    const travelMin = useMemo(() => {
        const start = order?.timeline?.departedAt;
        const end = order?.timeline?.arrivedAtDropoff;
        if (!start || !end) return null;
        const ms = new Date(end) - new Date(start);
        if (Number.isNaN(ms) || ms <= 0) return null;
        return Math.round(ms / 60000);
    }, [order]);

    return (
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={26} color="#0D1220" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Детали заказа</Text>
                <View style={{ width: 26 }} />
            </View>

            <View style={{ flex: 1, padding: 16 }}>
                {/* Пассажир, рейтинг, действия */}
                <View style={styles.personRow}>
                    <View style={styles.avatar} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.personName}>{passengerName}</Text>
                        {typeof passengerRating === "number" && (
                            <Stars value={passengerRating} />
                        )}
                    </View>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity style={styles.roundBtn}>
                            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#0D1220" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Маршрут */}
                <View style={styles.routeCard}>
                    <View style={styles.routeRow}>
                        <View style={[styles.circle, { borderColor: "#1A73E8" }]} />
                        <Text style={styles.addr} numberOfLines={2}>{order?.from || "—"}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.routeRow}>
                        <View style={[styles.circleFill, { backgroundColor: "#1A73E8" }]} />
                        <Text style={styles.addr} numberOfLines={2}>{order?.to || "—"}</Text>
                    </View>
                </View>

                {/* Время и длительность */}
                <Row label="Время заказа" value={fmt(createdAt)} />
                <Row
                    label={
                        order?.status === "cancelled" ? "Время отмены заказа" : "Время завершения заказа"
                    }
                    value={fmt(finishedAt)}
                />
                <Row
                    label="Длительность поездки"
                    value={
                        travelMin != null
                            ? `${Math.floor(travelMin / 60)} часа ${String(travelMin % 60).padStart(2, "0")} мин`
                            : "—"
                    }
                    disabled={order?.status === "cancelled"}
                />

                {/* Комментарий */}
                <Text style={styles.grayLabel}>Комментарий</Text>
                <View style={styles.grayBox}>
                    <Text style={styles.grayText}>
                        {order?.requirements?.notes || order?.comment || "—"}
                    </Text>
                </View>

                {/* Багаж */}
                <Text style={styles.grayLabel}>Информация о багаже</Text>
                <View style={styles.grayBox}>
                    <Text style={styles.grayText}>{order?.baggage || "—"}</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#fff" },
    header: {
        height: 48,
        paddingHorizontal: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#E6EAF0",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#0D1220" },

    personRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#E9EEF5", marginRight: 10 },
    personName: { fontWeight: "700", color: "#0D1220" },
    roundBtn: {
        width: 36, height: 36, borderRadius: 8,
        borderWidth: 1, borderColor: "#E6EAF0",
        alignItems: "center", justifyContent: "center", backgroundColor: "#fff",
    },

    routeCard: {
        borderWidth: 1, borderColor: "#E6EAF0",
        borderRadius: 12, padding: 12, backgroundColor: "#fff", marginBottom: 12,
    },
    routeRow: { flexDirection: "row", alignItems: "center" },
    addr: { color: "#0D1220", flex: 1 },
    circle: {
        width: 12, height: 12, borderRadius: 6,
        borderWidth: 2, marginRight: 8,
    },
    circleFill: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
    divider: { height: 1, backgroundColor: "#E6EAF0", marginVertical: 10 },

    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
    rowLabel: { color: "#6E7781" },
    rowValue: { color: "#0D1220", marginLeft: 12 },

    grayLabel: { color: "#8E98A3", fontSize: 12, fontWeight: "700", marginTop: 14, marginBottom: 6 },
    grayBox: {
        backgroundColor: "#F4F6FA", borderRadius: 10, borderWidth: 1, borderColor: "#E6EAF0",
        minHeight: 44, paddingHorizontal: 12, justifyContent: "center",
    },
    grayText: { color: "#6E7781" },
});
