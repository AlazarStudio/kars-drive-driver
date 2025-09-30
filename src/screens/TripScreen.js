// src/screens/TripScreen.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

// Геокодер: сначала нативный, затем Nominatim (fallback)
async function geocodeSmart(address) {
  try {
    const r = await Location.geocodeAsync(address);
    if (r && r[0]) {
      return { latitude: r[0].latitude, longitude: r[0].longitude };
    }
  } catch (e) { console.warn("expo geocode failed:", e); }
  try {
    const q = `Россия, ${address}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { "User-Agent": "karsavia-driver-app" } });
    const data = await res.json();
    if (data && data[0]) {
      return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
    }
  } catch (e) { console.warn("nominatim geocode failed:", e); }
  return null;
}

// Маршрут по дорогам (OSRM)
async function fetchOsrmRoute(origin, destination) {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&alternatives=false&steps=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("OSRM request failed");
  const data = await res.json();
  const coords = data.routes?.[0]?.geometry?.coordinates || [];
  return coords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
}

// расстояние между точками (метры)
function distMeters(a, b) {
  if (!a || !b) return Infinity;
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const c = 2 * Math.asin(
    Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon)
  );
  return R * c;
}

// Плотное приближение для «следования»
const FOLLOW_DELTA = 0.01; // меньше — ближе

export default function TripScreen({ navigation, route }) {
  const order = route?.params?.order ?? {};

  const [pickup, setPickup] = useState(null);   // {latitude, longitude}
  const [dropoff, setDropoff] = useState(null); // {latitude, longitude}

  const [stage, setStage] = useState("to_pickup"); // to_pickup → at_pickup → to_dropoff
  const [myPos, setMyPos] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const [ratingVisible, setRatingVisible] = useState(false);
  const [rating, setRating] = useState(0);

  // управление камерой
  const mapRef = useRef(null);
  const watchRef = useRef(null);

  // follow-флаг и ref, чтобы не ловить «устаревшее» значение внутри watchPosition
  const [isFollowing, setIsFollowing] = useState(false);
  const isFollowingRef = useRef(isFollowing);
  useEffect(() => { isFollowingRef.current = isFollowing; }, [isFollowing]);

  // троттлинг перестроения маршрута в движении
  const lastRouteRef = useRef({ t: 0, pos: null });

  // 1) Координаты из заказа / геокодинг по строкам
  useEffect(() => {
    (async () => {
      if (order.fromCoords?.lat && order.fromCoords?.lng) {
        setPickup({ latitude: order.fromCoords.lat, longitude: order.fromCoords.lng });
      } else if (order.from) {
        const p = await geocodeSmart(order.from);
        if (p) setPickup(p);
      }
      if (order.toCoords?.lat && order.toCoords?.lng) {
        setDropoff({ latitude: order.toCoords.lat, longitude: order.toCoords.lng });
      } else if (order.to) {
        const d = await geocodeSmart(order.to);
        if (d) setDropoff(d);
      }
    })();
  }, [order]);

  // 2) Текущее местоположение
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Геолокация", "Нет доступа к геолокации");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setMyPos({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, []);

  // 3) Построение маршрута по этапам:
  // - to_pickup: myPos → pickup
  // - at_pickup: pickup → dropoff (вписываем весь путь)
  // - to_dropoff: myPos → dropoff (актуальная позиция водителя) — с троттлингом
  useEffect(() => {
    let cancelled = false;
    async function buildRoute() {
      if (!pickup) return;
      setLoadingRoute(true);
      try {
        if (stage === "to_pickup") {
          if (!myPos) return;
          const r = await fetchOsrmRoute(myPos, pickup);
          if (!cancelled) setRouteCoords(r);
        } else if (stage === "at_pickup") {
          if (!dropoff) { if (!cancelled) setRouteCoords([]); return; }
          const r = await fetchOsrmRoute(pickup, dropoff);
          if (!cancelled) setRouteCoords(r);
        } else if (stage === "to_dropoff") {
          if (!dropoff || !myPos) { if (!cancelled) setRouteCoords([]); return; }
          const now = Date.now();
          const last = lastRouteRef.current;
          const need =
            now - last.t > 20000 || distMeters(last.pos, myPos) > 200; // не чаще 20с или после 200 м
          if (!need) return;
          const r = await fetchOsrmRoute(myPos, dropoff);
          if (!cancelled) {
            setRouteCoords(r);
            lastRouteRef.current = { t: now, pos: myPos };
          }
        }
      } catch (e) {
        console.warn("Route build error:", e);
        if (!cancelled) setRouteCoords([]);
      } finally {
        if (!cancelled) setLoadingRoute(false);
      }
    }
    buildRoute();
    return () => { cancelled = true; };
  }, [
    stage,
    myPos?.latitude, myPos?.longitude,
    pickup?.latitude, pickup?.longitude,
    dropoff?.latitude, dropoff?.longitude,
  ]);

  // 4) Вписываем маршрут (НЕ во время поездки, чтобы не сбивать зум)
  useEffect(() => {
    if (!mapRef.current || routeCoords.length < 2) return;

    if (stage === "to_pickup" && myPos && pickup) {
      mapRef.current.fitToCoordinates([myPos, pickup], {
        edgePadding: { top: 80, right: 80, bottom: 140, left: 80 },
        animated: true,
      });
    } else if (stage === "at_pickup" && dropoff) {
      mapRef.current.fitToCoordinates(routeCoords, {
        edgePadding: { top: 80, right: 80, bottom: 140, left: 80 },
        animated: true,
      });
    }
    // на "to_dropoff" не вписываем — камерой управляет watchPosition/следование
  }, [routeCoords, stage, myPos?.latitude, myPos?.longitude]);

  // 5) Следим за водителем в поездке (и НЕ мешаем, если пользователь двигает карту)
  useEffect(() => {
    if (stage !== "to_dropoff") {
      if (watchRef.current) { watchRef.current.remove(); watchRef.current = null; }
      return;
    }

    // при входе в to_dropoff один раз включаем follow
    setIsFollowing(true);

    (async () => {
      try {
        // в момент старта — приблизиться к текущей позиции
        if (mapRef.current && myPos) {
          mapRef.current.animateToRegion({
            latitude: myPos.latitude,
            longitude: myPos.longitude,
            latitudeDelta: FOLLOW_DELTA,
            longitudeDelta: FOLLOW_DELTA,
          }, 800);
        }
        // трекинг
        watchRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 10,
          },
          (loc) => {
            const p = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            setMyPos(p);
            if (isFollowingRef.current && mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: p.latitude,
                longitude: p.longitude,
                latitudeDelta: FOLLOW_DELTA,
                longitudeDelta: FOLLOW_DELTA,
              }, 800);
            }
          }
        );
      } catch (e) {
        console.warn("watchPosition error", e);
      }
    })();

    return () => {
      if (watchRef.current) { watchRef.current.remove(); watchRef.current = null; }
    };
  }, [stage]); // ВАЖНО: без зависимости от isFollowing

  // Начальный регион
  const initialRegion = useMemo(() => {
    const lat = pickup?.latitude ?? myPos?.latitude ?? 55.751244;
    const lon = pickup?.longitude ?? myPos?.longitude ?? 37.618423;
    return { latitude: lat, longitude: lon, latitudeDelta: 0.08, longitudeDelta: 0.08 };
  }, [pickup, myPos]);

  const primaryLabel =
    stage === "to_pickup" ? "Я на месте"
    : stage === "at_pickup" ? "Начать поездку"
    : "Завершить поездку";

  const onPrimary = () => {
    if (stage === "to_pickup") {
      if (!dropoff) { Alert.alert("Маршрут", "Не удалось определить точку назначения"); return; }
      setStage("at_pickup"); // впишет pickup→dropoff
    } else if (stage === "at_pickup") {
      setStage("to_dropoff"); // теперь строим myPos→dropoff и следим за водителем
      // мгновенное приближение на старте (если myPos уже есть)
      if (mapRef.current && myPos) {
        mapRef.current.animateToRegion({
          latitude: myPos.latitude,
          longitude: myPos.longitude,
          latitudeDelta: FOLLOW_DELTA,
          longitudeDelta: FOLLOW_DELTA,
        }, 800);
      }
      setIsFollowing(true);
    } else {
      setRatingVisible(true);
    }
  };

  // Пользователь двигает карту → отключаем follow до нажатия «Где я»
  const onMapPan = () => {
    if (stage === "to_dropoff" && isFollowingRef.current) {
      setIsFollowing(false);
      // ref обновится через эффект выше
    }
  };

  // Кнопка «Где я» — возвращаем follow и центрируемся на водителе
  const recenterToMe = () => {
    if (!myPos || !mapRef.current) return;
    setIsFollowing(true);
    mapRef.current.animateToRegion({
      latitude: myPos.latitude,
      longitude: myPos.longitude,
      latitudeDelta: FOLLOW_DELTA,
      longitudeDelta: FOLLOW_DELTA,
    }, 600);
  };

  const showRecenter = stage === "to_dropoff" && !isFollowing;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#0D1220" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Поездка</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false} 
        followsUserLocation={false}
        onPanDrag={onMapPan}              // <-- ручной пан → выключаем follow
      >
        {pickup && <Marker coordinate={pickup} title="Точка подачи" />}
        {dropoff && <Marker coordinate={dropoff} pinColor="green" title="Пункт назначения" />}
        {routeCoords.length >= 2 && (
          <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#2F6BFF" />
        )}
      </MapView>

      {loadingRoute && (
        <View style={styles.loading}>
          <ActivityIndicator />
          <Text style={{ marginTop: 6, color: "#111827" }}>Строим маршрут…</Text>
        </View>
      )}

      {/* Кнопка "Где я" справа по центру — показываем, когда follow выключен */}
      {showRecenter && (
        <TouchableOpacity style={styles.recenterBtn} onPress={recenterToMe} activeOpacity={0.9}>
          <Ionicons name="locate" size={18} color="#0D1220" />
          <Text style={styles.recenterText}>Где я</Text>
        </TouchableOpacity>
      )}

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.fullBtn, styles.primary]} onPress={onPrimary} activeOpacity={0.9}>
          <Text style={styles.primaryText}>{primaryLabel}</Text>
        </TouchableOpacity>
      </View>

      {/* Rating modal */}
      <Modal transparent visible={ratingVisible} animationType="fade" onRequestClose={() => setRatingVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setRatingVisible(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Оцените поездку</Text>
          <View style={{ flexDirection: "row", justifyContent: "center", marginVertical: 10 }}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity key={n} onPress={() => setRating(n)} style={{ padding: 6 }}>
                <Ionicons name="star" size={28} color={n <= rating ? "#F5B000" : "#D2D8DE"} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.fullBtn, styles.primary]}
            onPress={() => {
              // TODO: api.rateTrip(order.id, rating)
              setRatingVisible(false);
              navigation.navigate("Tabs", { screen: "Home" });
            }}
          >
            <Text style={styles.primaryText}>Готово</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
  headerTitle: { fontSize: 18, fontWeight: "700", textAlign: "center", flex: 1, color: "#0D1220" },

  bottomBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    padding: 16, 
    paddingBottom: 32,
    backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: "#E6EAF0",
  },
  fullBtn: { height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  primary: { backgroundColor: "#2F6BFF" },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  loading: {
    position: "absolute", top: 70, left: 0, right: 0, alignItems: "center",
  },

  // Кнопка "Где я"
  recenterBtn: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -24 }],
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    borderWidth: 1,
    borderColor: "#E6EAF0",
  },
  recenterText: { color: "#0D1220", fontWeight: "600" },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)" },
  sheet: {
    position: "absolute", left: 16, right: 16, bottom: 20,
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
});
