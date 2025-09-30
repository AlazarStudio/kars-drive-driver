import React, { useMemo, useState, useCallback } from "react";
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const STATUS_TABS = [
    { key: "all", label: "Все" },
    { key: "finished", label: "Завершённые" },
    { key: "cancelled", label: "Отменённые" },
    { key: "assigned", label: "Назначен водитель" },
    { key: "pending", label: "Новые" },
];

const statusPill = (s) => {
    switch (s) {
        case "finished": return { text: "Завершена", bg: "#E8F7EF", brd: "#CBEBD7", color: "#1B9E55" };
        case "cancelled": return { text: "Отменена", bg: "#FDEEEF", brd: "#F6CDD0", color: "#E53935" };
        case "assigned": return { text: "Водитель назначен", bg: "#EEF6FF", brd: "#CFE1FF", color: "#2F6BFF" };
        case "pending": return { text: "Новая", bg: "#FFF7E6", brd: "#FFE2B8", color: "#B36B00" };
        default: return { text: s, bg: "#F4F6FA", brd: "#E6EAF0", color: "#0D1220" };
    }
};

const fmtDateTime = (iso) =>
    new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });

/** Пример моков — замени на загрузку из API при необходимости */
// src/temp/historyMock.js
export const MOCK = [
    {
        id: "52134",
        status: "finished",                          // finished | cancelled
        from: "Минеральные Воды (а/п), терминал B",
        to: "г. Черкесск, Ленина, 57В",
        date: "2025-03-05T11:40:00+03:00",           // время заказа
        fromCoords: { lat: 44.2265, lng: 42.0461 },
        toCoords: { lat: 44.2091, lng: 42.0487 },

        driver: { id: "e2", name: "Александр", rating: 5.0, avatar: null },

        // хронология
        timeline: {
            createdAt: "2025-03-05T11:40:00+03:00",
            acceptedAt: "2025-03-05T11:45:00+03:00",
            arrivedAtPickup: "2025-03-05T12:00:00+03:00",
            departedAt: "2025-03-05T12:10:00+03:00",
            arrivedAtDropoff: "2025-03-05T14:34:00+03:00",
            finishedAt: "2025-03-05T14:35:00+03:00",
            travelTimeSec: 8640, // 2ч 24м
        },

        // требование/заметки
        requirements: {
            pax: 3,
            vehicleType: "sedan",
            vehicleClass: "comfort",
            luggage: { items: 2, bulky: true },
            pets: true,
            childSeats: { total: 1, infant: 0, toddler: 1, booster: 0 },
            nonSmoking: true,
            airConditioner: true,
            languages: ["ru"],
            payment: "cash",
            notes: "Нужна машина на 2 места и питомца",
        },
        baggage: "2 чемодана и клетка 40x50",

        ratings: { driver: 5, passenger: 5 }, // кто кому поставил (для истории достаточно passenger)
    },

    {
        id: "52135",
        status: "cancelled",
        from: "г. Черкесск, Ленина, 57Б",
        to: "г. Минеральные Воды, Ленина, 51К1",
        date: "2025-03-08T10:15:00+03:00",
        fromCoords: { lat: 44.2266, lng: 42.0465 },
        toCoords: { lat: 44.2093, lng: 42.0480 },
        driver: { id: "e2", name: "Александр", rating: 5.0, avatar: null },
        timeline: {
            createdAt: "2025-03-08T10:15:00+03:00",
            cancelledAt: "2025-03-08T10:40:00+03:00",
            reason: "Не удалось связаться с клиентом",
        },
        requirements: { pax: 1, vehicleType: "sedan", vehicleClass: "economy", payment: "cash", notes: "" },
        baggage: "—",
        ratings: { driver: null, passenger: null },
    },

    {
        id: "52136",
        status: "finished",
        from: "г. Черкесск, Ленина, 57В",
        to: "г. Минеральные Воды, Ленина, 51К1",
        date: "2025-03-11T12:12:00+03:00",
        fromCoords: { lat: 44.2265, lng: 42.0461 },
        toCoords: { lat: 44.2091, lng: 42.0487 },
        driver: { id: "e3", name: "Иван", rating: 4.7, avatar: null },
        timeline: {
            createdAt: "2025-03-11T12:12:00+03:00",
            arrivedAtPickup: "2025-03-11T12:45:00+03:00",
            departedAt: "2025-03-11T12:56:00+03:00",
            arrivedAtDropoff: "2025-03-11T14:20:00+03:00",
            finishedAt: "2025-03-11T14:21:00+03:00",
            travelTimeSec: 5040, // 1ч 24м
        },
        requirements: { pax: 2, vehicleType: "sedan", vehicleClass: "comfort", payment: "invoice", notes: "Безнал" },
        baggage: "1 чемодан",
        ratings: { driver: 4, passenger: 4 },
    },
];


export default function OrdersHistoryScreen() {
    const navigation = useNavigation();
    const [q, setQ] = useState("");
    const [tab, setTab] = useState("all");
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState(MOCK);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // имитация обновления
        setTimeout(() => setRefreshing(false), 700);
    }, []);

    const filtered = useMemo(() => {
        const ql = q.trim().toLowerCase();
        return data.filter((o) => {
            const okStatus = tab === "all" ? true : o.status === tab;
            if (!okStatus) return false;
            if (!ql) return true;
            // поиск по id, из/в, сотрудникам
            const inText =
                o.id.includes(ql) ||
                o.from.toLowerCase().includes(ql) ||
                o.to.toLowerCase().includes(ql) ||
                (o.employees || []).some((e) => e.name.toLowerCase().includes(ql));
            return inText;
        });
    }, [q, tab, data]);

    const openDetails = (order) => {
        navigation.navigate("HistoryDetails", { order });
    };

    const renderItem = ({ item }) => {
        const pill = statusPill(item.status);
        return (
            <TouchableOpacity style={s.card} onPress={() => openDetails(item)} activeOpacity={0.9}>
                <View style={s.rowBetween}>
                    <Text style={s.idText}>#{item.id}</Text>
                    <View style={[s.pill, { backgroundColor: pill.bg, borderColor: pill.brd }]}>
                        <Text style={[s.pillText, { color: pill.color }]}>{pill.text}</Text>
                    </View>
                </View>

                <View style={{ marginTop: 8 }}>
                    <View style={s.routeRow}>
                        <Ionicons name="radio-button-on" size={14} color="#1B9E55" />
                        <Text style={s.routeText} numberOfLines={1}>{item.from}</Text>
                    </View>
                    <View style={s.routeDivider} />
                    <View style={s.routeRow}>
                        <Ionicons name="location" size={14} color="#E53935" />
                        <Text style={s.routeText} numberOfLines={1}>{item.to}</Text>
                    </View>
                </View>

                <View style={[s.rowBetween, { marginTop: 10 }]}>
                    <View style={s.metaRow}>
                        <Ionicons name="calendar-outline" size={16} color="#6E7781" />
                        <Text style={s.metaText}>{fmtDateTime(item.date)}</Text>
                    </View>
                    
                </View>
            </TouchableOpacity>
        );
    };

    const Header = (
        <View>
            {/* Поиск */}
            <View style={s.searchRow}>
                <Ionicons name="search" size={16} color="#6E7781" />
                <TextInput
                    value={q}
                    onChangeText={setQ}
                    placeholder="Поиск по №, адресу или сотруднику"
                    placeholderTextColor="#9AA4AD"
                    style={s.searchInput}
                    returnKeyType="search"
                />
                {!!q && (
                    <TouchableOpacity onPress={() => setQ("")}>
                        <Ionicons name="close-circle" size={18} color="#9AA4AD" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Табы статусов */}
            <View style={s.tabsWrap}>
                <FlatList
                    data={STATUS_TABS}
                    keyExtractor={(i) => i.key}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 8 }}
                    renderItem={({ item }) => {
                        const on = tab === item.key;
                        return (
                            <TouchableOpacity
                                onPress={() => setTab(item.key)}
                                style={[s.tabBtn, on && s.tabOn]}
                                activeOpacity={0.9}
                            >
                                <Text style={[s.tabText, on && s.tabTextOn]}>{item.label}</Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={s.safe} edges={["top"]}>
            <View style={s.header}>
                <Text style={s.headerTitle}>История заявок</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                ListHeaderComponent={Header}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#fff" },
    header: {
        height: 48, paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E6EAF0",
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#0D1220" },

    searchRow: {
        height: 44, borderRadius: 12, borderWidth: 1, borderColor: "#E6EAF0",
        backgroundColor: "#F4F6FA",
        paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8,
    },
    searchInput: { flex: 1, color: "#0D1220", padding: 0, paddingVertical: 0 },

    tabsWrap: { marginTop: 10, marginBottom: 8 },
    tabBtn: {
        height: 36, paddingHorizontal: 12, marginRight: 8,
        borderRadius: 10, borderWidth: 1, borderColor: "#E6EAF0",
        backgroundColor: "#F4F6FA", alignItems: "center", justifyContent: "center",
    },
    tabOn: { backgroundColor: "#2F6BFF20", borderColor: "#B9C7FF" },
    tabText: { color: "#0D1220" },
    tabTextOn: { color: "#2F6BFF", fontWeight: "700" },

    card: {
        borderRadius: 14, backgroundColor: "#fff",
        borderWidth: 1, borderColor: "#E6EAF0",
        padding: 12,
    },
    idText: { fontWeight: "700", color: "#0D1220" },
    pill: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
    pillText: { fontSize: 12, fontWeight: "700" },

    routeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    routeText: { color: "#0D1220", flexShrink: 1 },
    routeDivider: { height: 10, width: 1, marginLeft: 6, backgroundColor: "transparent" },

    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    metaText: { color: "#6E7781" },
});
