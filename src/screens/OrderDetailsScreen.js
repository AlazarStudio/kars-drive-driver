// src/screens/OrderDetailsScreen.js
import React, { useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Modal,
    Pressable,
    TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const vehicleTypeLabel = { sedan: "Седан", minivan: "Минивен", minibus: "Микроавтобус", bus: "Автобус" };
const vehicleClassLabel = { economy: "Эконом", comfort: "Комфорт", business: "Бизнес" };
const paymentLabel = { cash: "Наличные", card: "Картой", invoice: "Безнал" };

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

const diffMinutes = (fromIso, toIso) => {
    if (!fromIso || !toIso) return null;
    const ms = new Date(toIso) - new Date(fromIso);
    if (Number.isNaN(ms) || ms < 0) return null;
    return Math.round(ms / 60000);
};

function Chip({ children }) {
    return (
        <View style={styles.chip}>
            <Text style={{ color: "#0D1220" }}>{children}</Text>
        </View>
    );
}

function PersonRow({ role, person, onChat }) {
    if (!person) return null;
    return (
        <View style={styles.personRow}>
            {person.avatar ? (
                <Image source={{ uri: person.avatar }} style={styles.personAvatar} />
            ) : (
                <View style={[styles.personAvatar, { backgroundColor: "#E9EEF5" }]} />
            )}
            <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.role}>{role}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                    <Text style={styles.personName}>{person.name ?? "—"}</Text>
                    {typeof person.rating === "number" && (
                        <>
                            <Ionicons name="star" size={14} color="#F5B000" style={{ marginLeft: 6 }} />
                            <Text style={styles.rating}>{person.rating.toFixed(1)}</Text>
                        </>
                    )}
                </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity style={styles.roundBtn} onPress={onChat}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#0D1220" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// НЕинтерактивные звезды для отображения рейтинга
function StarsReadonly({ value = 0 }) {
    const arr = [1, 2, 3, 4, 5];
    return (
        <View style={{ flexDirection: "row" }}>
            {arr.map((n) => (
                <Ionicons key={n} name="star" size={18} color={n <= value ? "#F5B000" : "#D2D8DE"} />
            ))}
        </View>
    );
}

export default function OrderDetailsScreen({ route, navigation }) {
    const order = route?.params?.order;
    const [assignedDriver, setAssignedDriver] = useState(order?.assignedDriver || null);

    // время: изначально только orderedAt (время создания заявки)
    const [times, setTimes] = useState({
        orderedAt: order?.date || null,
        acceptedAt: order?.acceptedAt || null,
        orderAcceptedAt: order?.orderAcceptedAt || null,
        arrivedPickupAt: order?.arrivedPickupAt || null,
        departedAt: order?.departedAt || null,
        arrivedDropoffAt: order?.arrivedDropoffAt || null,
        completedAt: order?.completedAt || null,
    });

    // оценки только для показа (если пришли)
    const ratings = {
        byDriver: order?.ratings?.byDriver ?? null,
        byPassenger: order?.ratings?.byPassenger ?? null,
    };

    const travelMinutes = useMemo(
        () => diffMinutes(times.departedAt, times.arrivedDropoffAt),
        [times.departedAt, times.arrivedDropoffAt]
    );

    // ====== Состояния для отмены ======
    const [cancelVisible, setCancelVisible] = useState(false);
    const [selectedReason, setSelectedReason] = useState(null);
    const [customReason, setCustomReason] = useState("");

    const reasons = [
        { key: "tech", label: "Технические неполадки" },
        { key: "busy", label: "Слишком загружен" },
        { key: "rating", label: "Рейтинг клиента" },
        { key: "nosignal", label: "Не удалось связаться с клиентом" },
        { key: "other", label: "Другое" },
    ];

    const openCancel = () => {
        setSelectedReason(null);
        setCustomReason("");
        setCancelVisible(true);
    };
    const closeCancel = () => setCancelVisible(false);

    const confirmCancel = async () => {
        // TODO: API отмены заказа с передачей причины
        // await api.cancelOrder(order.id, { reason: selectedReason, comment: customReason });
        closeCancel();
        // Переход на главную
        try {
            navigation.navigate("Tabs", { screen: "Home" });
        } catch {
            navigation.goBack();
        }
    };

    const acceptOrder = async () => {
        navigation.navigate("Trip", { order });
        // TODO: API принятия заказа
        // await api.acceptOrder(order.id);
        // Можно обновить times.orderAcceptedAt = now и/или показать тост
    };

    if (!order) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={26} color="#0D1220" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Заявка</Text>
                    <View style={{ width: 26 }} />
                </View>
                <View style={{ padding: 16 }}>
                    <Text>Нет данных заявки.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const showTimelineTail = Boolean(times.acceptedAt); // остальные пункты показываем только после назначения
    const showRatings = ratings.byDriver != null || ratings.byPassenger != null;

    return (
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            {/* header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={26} color="#0D1220" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Заявка #{order.id ?? "—"}</Text>
                <View style={{ width: 26 }} />
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Участники */}
                {assignedDriver && (
                    <PersonRow
                        role="Водитель"
                        person={assignedDriver}
                        onChat={() =>
                            navigation.navigate("Chat", {
                                peer: { title: `Водитель • ${assignedDriver.name}`, id: assignedDriver.id },
                            })
                        }
                    />
                )}
                <PersonRow
                    role="Пассажир"
                    person={order.driver}
                    onChat={() =>
                        navigation.navigate("Chat", {
                            peer: { title: `Пассажир • ${order.driver?.name || ""}` },
                        })
                    }
                />

                {/* Маршрут */}
                <View style={styles.routeCard}>
                    <View style={styles.routeRow}>
                        <View style={[styles.dot, { backgroundColor: "#1A73E8" }]} />
                        <Text style={styles.addr}>{order.from ?? "—"}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.routeRow}>
                        <View style={[styles.dot, { backgroundColor: "#0ABF53" }]} />
                        <Text style={styles.addr}>{order.to ?? "—"}</Text>
                    </View>
                </View>

                {/* Требования */}
                <Text style={styles.sectionTitle}>Требования к поездке</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    <Chip>{`Пассажиров: ${order.requirements?.pax ?? "—"}`}</Chip>
                    {order.requirements?.vehicleType && <Chip>{vehicleTypeLabel[order.requirements.vehicleType]}</Chip>}
                    {order.requirements?.vehicleClass && <Chip>{vehicleClassLabel[order.requirements.vehicleClass]}</Chip>}
                    {order.requirements?.luggage?.items >= 0 && <Chip>{`Багаж: ${order.requirements.luggage.items}`}</Chip>}
                    {order.requirements?.luggage?.bulky && <Chip>Негабарит</Chip>}
                    {order.requirements?.pets && <Chip>С животными</Chip>}
                    {order.requirements?.childSeats?.total > 0 && (
                        <Chip>{`Детк. кресла: ${order.requirements.childSeats.total}`}</Chip>
                    )}
                    {order.requirements?.accessibility?.wheelchair && <Chip>Инвалидная коляска</Chip>}
                    {order.requirements?.nonSmoking && <Chip>Некурящий водитель</Chip>}
                    {order.requirements?.airConditioner && <Chip>Кондиционер</Chip>}
                    {!!order.requirements?.languages?.length && <Chip>{`Язык: ${order.requirements.languages.join(", ")}`}</Chip>}
                    {order.requirements?.payment && <Chip>{paymentLabel[order.requirements.payment]}</Chip>}
                </View>

                {/* Хронология */}
                <Text style={styles.sectionTitle}>Хронология</Text>
                <View style={styles.timeline}>
                    <Row label="Время заказа" value={fmt(times.orderedAt)} />
                    {showTimelineTail && (
                        <>
                            <Row label="Время назначения водителя" value={fmt(times.acceptedAt)} />
                            <Row label="Время принятия заказа" value={fmt(times.orderAcceptedAt)} />
                            <Row label="Время прибытия к пассажиру" value={fmt(times.arrivedPickupAt)} />
                            <Row label="Время выезда" value={fmt(times.departedAt)} />
                            <Row label="Время прибытия" value={fmt(times.arrivedDropoffAt)} />
                            <Row label="Время завершения" value={fmt(times.completedAt)} />
                            <Row label="Время в пути" value={travelMinutes != null ? `${travelMinutes} мин` : "—"} />
                        </>
                    )}
                </View>

                {/* Комментарий и багаж */}
                <Text style={styles.grayLabel}>Комментарий</Text>
                <View style={styles.grayBox}>
                    <Text style={styles.grayText}>{order.requirements?.notes || order.comment || "—"}</Text>
                </View>

                <Text style={styles.grayLabel}>Информация о багаже</Text>
                <View style={styles.grayBox}>
                    <Text style={styles.grayText}>{order.baggage || "—"}</Text>
                </View>

                {/* Оценки поездки — только если есть */}
                {(ratings.byDriver != null || ratings.byPassenger != null) && (
                    <>
                        <Text style={styles.sectionTitle}>Оценки поездки</Text>
                        {ratings.byDriver != null && (
                            <View style={styles.rateRow}>
                                <Text style={styles.rateLabel}>От водителя</Text>
                                <StarsReadonly value={ratings.byDriver} />
                            </View>
                        )}
                        {ratings.byPassenger != null && (
                            <View style={styles.rateRow}>
                                <Text style={styles.rateLabel}>От пассажира</Text>
                                <StarsReadonly value={ratings.byPassenger} />
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Нижняя панель действий */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={[styles.fullBtn, styles.rejectFull]} onPress={openCancel}>
                    <Text style={styles.rejectText}>Отклонить</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.fullBtn, styles.acceptFull]} onPress={acceptOrder}>
                    <Text style={styles.acceptText}>Принять заказ</Text>
                </TouchableOpacity>
            </View>

            {/* Модалка причины отмены */}
            <Modal transparent animationType="fade" visible={cancelVisible} onRequestClose={closeCancel}>
                <Pressable style={styles.backdrop} onPress={closeCancel} />
                <View style={styles.sheet}>
                    <Text style={styles.sheetTitle}>Причина отмены</Text>

                    {reasons.map((r) => {
                        const checked = selectedReason === r.key;
                        return (
                            <TouchableOpacity
                                key={r.key}
                                style={styles.reasonRow}
                                onPress={() => setSelectedReason(r.key)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.reasonText}>{r.label}</Text>
                                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                                    {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    {selectedReason === "other" && (
                        <TextInput
                            placeholder="Опишите причину"
                            placeholderTextColor="#9AA4AD"
                            value={customReason}
                            onChangeText={setCustomReason}
                            style={styles.input}
                            multiline
                        />
                    )}

                    <TouchableOpacity
                        style={[
                            styles.sheetButton,
                            (!selectedReason || (selectedReason === "other" && !customReason.trim())) && { opacity: 0.6 },
                        ]}
                        disabled={!selectedReason || (selectedReason === "other" && !customReason.trim())}
                        onPress={confirmCancel}
                    >
                        <Text style={styles.sheetButtonText}>Готово</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function Row({ label, value }) {
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
        </View>
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

    personRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, marginBottom: 6 },
    role: { color: "#6E7781", fontSize: 12, marginBottom: 2 },
    personAvatar: { width: 40, height: 40, borderRadius: 20 },
    personName: { fontWeight: "700", color: "#0D1220" },
    rating: { marginLeft: 2, color: "#0D1220" },
    roundBtn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E6EAF0",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
    },

    routeCard: {
        borderWidth: 1,
        borderColor: "#E6EAF0",
        borderRadius: 12,
        padding: 12,
        backgroundColor: "#fff",
        marginTop: 8,
    },
    routeRow: { flexDirection: "row", alignItems: "center" },
    addr: { color: "#0D1220", flex: 1 },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    divider: { height: 1, backgroundColor: "#E6EAF0", marginVertical: 10 },

    sectionTitle: { marginTop: 14, marginBottom: 8, fontWeight: "700", color: "#0D1220" },
    chip: {
        paddingHorizontal: 10,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#F1F3F6",
        borderWidth: 1,
        borderColor: "#E6EAF0",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
        marginBottom: 8,
    },

    grayLabel: { color: "#8E98A3", fontSize: 12, fontWeight: "700", marginTop: 14, marginBottom: 6 },
    grayBox: {
        backgroundColor: "#F4F6FA",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E6EAF0",
        minHeight: 44,
        paddingHorizontal: 12,
        justifyContent: "center",
    },
    grayText: { color: "#6E7781" },

    timeline: { marginTop: 4 },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
    rowLabel: { color: "#6E7781" },
    rowValue: { color: "#0D1220", marginLeft: 12 },

    rateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
    rateLabel: { color: "#0D1220" },

    caption: { color: "#8E98A3", fontSize: 12 },
    value: { color: "#0D1220", fontWeight: "600", marginTop: 2 },
    actions: { flexDirection: "row", alignItems: "center", gap: 8 },

    rejectBtn: {
        backgroundColor: "#F3F4F6",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
    },
    rejectText: { color: "#0D1220", fontWeight: "600" },

    acceptBtn: {
        backgroundColor: "#2F6BFF",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 18,
    },
    acceptText: { color: "#fff", fontWeight: "700" },

    // Модалка отмены
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)" },
    sheet: {
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 20,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
        elevation: 8,
    },
    sheetTitle: { fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 8 },
    reasonRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
    },
    reasonText: { color: "#0D1220", fontSize: 16 },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    checkboxChecked: { backgroundColor: "#0B0F10", borderColor: "#0B0F10" },
    input: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: "#E6EAF0",
        borderRadius: 12,
        padding: 10,
        minHeight: 60,
        textAlignVertical: "top",
        color: "#0D1220",
    },
    sheetButton: {
        marginTop: 12,
        backgroundColor: "#2F6BFF",
        paddingVertical: 12,
        borderRadius: 12,
    },
    sheetButtonText: { color: "#fff", textAlign: "center", fontWeight: "700", fontSize: 16 },
    bottomBar: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 16,
        paddingBottom: 32,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#E6EAF0",
    },
    fullBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 4,
    },
    rejectFull: { backgroundColor: "#F3F4F6" },
    acceptFull: { backgroundColor: "#2F6BFF" },

});
