// src/screens/HomeScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, Image, Modal, Pressable
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ---- MOCK (как у тебя)
const MOCK = [
  {
    id: "1",
    status: "pending",
    from: "г. Черкесск, Ленина, 57В",
    to: "г. Черкесск, Кавказская, 86",
    date: "2025-03-11T12:12:00+03:00",
    fromCoords: { lat: 44.2265, lng: 42.0461 },
    driver: { name: "Александр Александров", rating: 5.0, badge: "КВС", avatar: null },
    baggage: "2 чемодана и клетка 40x50",
    requirements: {
      pax: 3, vehicleType: "sedan", vehicleClass: "comfort",
      luggage: { items: 2, bulky: true }, pets: true,
      childSeats: { total: 1, infant: 0, toddler: 1, booster: 0 },
      accessibility: { wheelchair: false }, nonSmoking: true,
      airConditioner: true, languages: ["ru"], payment: "cash",
      notes: "Нужна машина на 2 места и питомца",
    },
  },
  {
    id: "2",
    status: "pending",
    from: "г. Черкесск, Ленина, 57В",
    to: "г. Минеральные воды, Ленина, 51",
    date: "2025-03-11T12:12:00+03:00",
    fromCoords: { lat: 44.2365, lng: 42.0561 },
    driver: { name: "Александр Александров", rating: 5.0, badge: "КВС", avatar: null },
    baggage: "2 чемодана и клетка 40x50",
    requirements: {
      pax: 12, vehicleType: "minibus", vehicleClass: "economy",
      luggage: { items: 4, bulky: false }, pets: false,
      childSeats: { total: 0, infant: 0, toddler: 0, booster: 0 },
      accessibility: { wheelchair: false }, nonSmoking: true,
      airConditioner: true, languages: ["ru", "en"], payment: "invoice", notes: "",
    },
  },
];

const isActiveStatus = (s) => s === "assigned" || s === "active";

export default function HomeScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [orders] = useState(MOCK);

  // статус смены
  const [isOnShift, setIsOnShift] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);

  // при первом заходе проверяем, вышел ли уже на смену
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("driver:isOnShift");
        const on = saved === "1";
        setIsOnShift(on);
        if (!on) setShowShiftModal(true);
      } catch {
        setShowShiftModal(true);
      }
    })();
  }, []);

  const goOnline = async () => {
    try {
      // TODO: api.goOnline()
      setIsOnShift(true);
      await AsyncStorage.setItem("driver:isOnShift", "1");
    } finally {
      setShowShiftModal(false);
    }
  };
  const later = () => setShowShiftModal(false);

  const activeOrder = useMemo(
    () => orders.find((o) => isActiveStatus(o.status)),
    [orders]
  );

  const otherOrders = useMemo(() => {
    const rest = orders.filter((o) => !isActiveStatus(o.status));
    if (!query.trim()) return rest;
    const q = query.toLowerCase();
    return rest.filter((o) => o.from.toLowerCase().includes(q) || o.to.toLowerCase().includes(q));
  }, [orders, query]);

  const renderOrder = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.card}
      onPress={() => navigation.navigate("OrderDetails", { order: item })}
    >
      <View style={styles.row}>
        <Ionicons name="ellipse-outline" size={14} color="#111827" />
        <Text style={styles.addrFrom} numberOfLines={1}>{item.from}</Text>
      </View>

      <View style={[styles.row, { marginTop: 6 }]}>
        <Ionicons name="ellipse" size={14} color="#2563eb" />
        <Text style={styles.addrTo} numberOfLines={1}>{item.to}</Text>
      </View>

      <View style={[styles.row, { marginTop: 10 }]}>
        {item.driver?.avatar ? (
          <Image source={{ uri: item.driver.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={16} color="#9CA3AF" />
          </View>
        )}
        <Text style={styles.driverName} numberOfLines={1}>{item.driver?.name ?? "—"}</Text>
        {!!item.driver?.badge && <Text style={styles.badge} numberOfLines={1}>{item.driver.badge}</Text>}
        {typeof item.driver?.rating === "number" && (
          <>
            <Ionicons name="star" size={14} color="#F5B000" style={{ marginLeft: 6 }} />
            <Text style={styles.rating}>{item.driver.rating.toFixed(1)}</Text>
          </>
        )}
      </View>

      <Text style={styles.meta} numberOfLines={1}>
        {formatDate(item.date)} / {statusLabel(item.status)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        {/* шапка */}
        <View style={styles.header}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color="#9AA4AD" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Поиск"
              placeholderTextColor="#9AA4AD"
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={22} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* активная заявка */}
        {activeOrder && (
          <View style={styles.activeCard}>
            <Text style={styles.activeEta}>{etaFromDate(activeOrder.date)}</Text>

            <View style={styles.row}>
              <Ionicons name="ellipse-outline" size={14} color="#fff" />
              <Text style={styles.activeFrom} numberOfLines={1}>{activeOrder.from}</Text>
            </View>

            <View style={[styles.row, { marginTop: 6 }]}>
              <Ionicons name="ellipse" size={14} color="#fff" />
              <Text style={styles.activeTo} numberOfLines={1}>{activeOrder.to}</Text>
            </View>

            <TouchableOpacity
              style={styles.activeBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("OrderDetails", { order: activeOrder })}
            >
              <Text style={styles.activeBtnText}>На месте</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* заявки */}
        <FlatList
          data={otherOrders}
          keyExtractor={(i) => i.id}
          renderItem={renderOrder}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        />
      </View>

      {/* Модалка «Выйти на смену» */}
      <Modal transparent visible={showShiftModal} animationType="fade" onRequestClose={later}>
        <Pressable style={styles.backdrop} onPress={later} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Выйти на смену?</Text>
          <Text style={styles.sheetText}>
            Нажмите «Выйти на смену», чтобы стать видимым для диспетчеров и получать заказы.
          </Text>

          {!isOnShift && (
            <TouchableOpacity style={[styles.fullBtn, styles.primary]} onPress={goOnline} activeOpacity={0.9}>
              <Text style={styles.primaryText}>Выйти на смену</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.fullBtn, styles.secondary]} onPress={later} activeOpacity={0.8}>
            <Text style={styles.secondaryText}>Позже</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function statusLabel(s) {
  switch (s) {
    case "pending": return "Ожидает принятия";
    case "assigned": return "Назначен водитель";
    case "active": return "Активная";
    case "done": return "Завершена";
    case "canceled": return "Отменена";
    default: return "—";
  }
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function etaFromDate(iso) {
  if (!iso) return "Скоро";
  const now = Date.now();
  const t = +new Date(iso);
  const diffMin = Math.round((t - now) / 60000);
  if (isNaN(diffMin)) return "Скоро";
  if (diffMin <= 0) return "Скоро";
  return `Через ${diffMin} мин.`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1 },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 8, paddingTop: 8, backgroundColor: "#FFFFFF",
  },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#F4F6FA", borderRadius: 12, paddingHorizontal: 12, height: 40,
    borderWidth: 1, borderColor: "#E6EAF0",
  },
  searchInput: { flex: 1, paddingVertical: 0, color: "#0D1220" },
  bellBtn: { marginLeft: 10, padding: 6, borderRadius: 10 },

  activeCard: {
    marginTop: 8, marginBottom: 12, marginHorizontal: 16,
    backgroundColor: "#2563eb", borderRadius: 16, padding: 16,
  },
  activeEta: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center" },
  activeFrom: { color: "#FFFFFF", fontSize: 15, fontWeight: "600", marginLeft: 8, flex: 1 },
  activeTo: { color: "#E9F0FF", fontSize: 15, marginLeft: 8, flex: 1 },
  activeBtn: { marginTop: 12, backgroundColor: "#FFFFFF", paddingVertical: 10, borderRadius: 20 },
  activeBtnText: { textAlign: "center", color: "#2563eb", fontWeight: "700", fontSize: 15 },

  card: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "#E6EAF0",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  addrFrom: { color: "#0D1220", fontSize: 15, fontWeight: "600", marginLeft: 8, flex: 1 },
  addrTo: { color: "#374151", fontSize: 15, marginLeft: 8, flex: 1 },
  avatar: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
  avatarPlaceholder: { backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  driverName: { color: "#0D1220", fontWeight: "600" },
  badge: { color: "#2F6BFF", fontWeight: "700", marginLeft: 6 },
  rating: { color: "#0D1220", marginLeft: 2 },
  meta: { color: "#8E98A3", fontSize: 12, marginTop: 10 },

  // Модалка смены
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    position: "absolute", left: 16, right: 16, bottom: 24,
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#0D1220", textAlign: "center", marginBottom: 6 },
  sheetText: { color: "#6E7781", textAlign: "center", marginBottom: 12 },

  fullBtn: { height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  primary: { backgroundColor: "#2F6BFF", marginTop: 4 },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondary: { backgroundColor: "#EEF2F7", marginTop: 8 },
  secondaryText: { color: "#0D1220", fontSize: 16, fontWeight: "700" },
});
