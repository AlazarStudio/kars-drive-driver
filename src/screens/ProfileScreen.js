// src/screens/ProfileScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileScreen({ navigation }) {
  const user = {
    name: "ФИО водителя",
    phone: "+7 (000) 000 00 00",
    email: "example@gmail.com",
    avatar: null,
  };

  // состояние смены
  const [isOnShift, setIsOnShift] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("driver:isOnShift");
        setIsOnShift(saved === "1");
      } catch {}
    })();
  }, []);

  const goOnline = async () => {
    try {
      // TODO: await api.goOnline()
      await AsyncStorage.setItem("driver:isOnShift", "1");
      setIsOnShift(true);
    } catch (e) {
      Alert.alert("Ошибка", "Не удалось выйти на смену");
    }
  };

  const goOffline = async () => {
    try {
      // TODO: await api.goOffline()
      await AsyncStorage.setItem("driver:isOnShift", "0");
      setIsOnShift(false);
    } catch (e) {
      Alert.alert("Ошибка", "Не удалось завершить смену");
    }
  };

  const onSettings = () => navigation.navigate("Settings");
  const onDelete = () => Alert.alert("Удалить аккаунт", "Подтверждаешь удаление?");
  const onLogout = () => Alert.alert("Выход", "Выйти из аккаунта?");

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* header с колокольчиком справа */}
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>Профиль</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => Alert.alert("Уведомления")}>
          <Ionicons name="notifications-outline" size={22} color="#0D1220" />
          <View style={styles.badge} />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {/* Аватар */}
        <View style={styles.avatarWrap}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <Ionicons name="person-circle-outline" size={104} color="#B9C1CA" />
          )}
        </View>

        {/* Имя */}
        <Text style={styles.name}>{user.name}</Text>

        {/* Поля */}
        <Text style={styles.label}>НОМЕР ТЕЛЕФОНА</Text>
        <View style={styles.field}>
          <TextInput editable={false} value={user.phone} style={styles.fieldInput} />
        </View>

        <Text style={[styles.label, { marginTop: 14 }]}>EMAIL</Text>
        <View style={styles.field}>
          <TextInput editable={false} value={user.email} style={styles.fieldInput} />
        </View>

        {/* Управление аккаунтом */}
        <Text style={[styles.sectionTitle, { marginTop: 22 }]}>УПРАВЛЕНИЕ АККАУНТОМ</Text>

        <View style={styles.card}>
          <TouchableOpacity style={styles.rowItem} onPress={onSettings} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <Ionicons name="settings-outline" size={18} color="#6E7781" />
              <Text style={styles.rowText}>Настройки</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.rowItem} onPress={onDelete} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <Ionicons name="trash-outline" size={18} color="#E53935" />
              <Text style={[styles.rowText, { color: "#E53935" }]}>Удалить аккаунт</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.rowItem} onPress={onLogout} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <Ionicons name="log-out-outline" size={18} color="#2F6BFF" />
              <Text style={[styles.rowText, { color: "#2F6BFF" }]}>Выйти из аккаунта</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Нижняя кнопка смены */}
      <View style={styles.bottomBar}>
        {isOnShift ? (
          <TouchableOpacity style={[styles.fullBtn, styles.secondary]} onPress={goOffline} activeOpacity={0.9}>
            <Text style={styles.secondaryText}>Завершить смену</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.fullBtn, styles.primary]} onPress={goOnline} activeOpacity={0.9}>
            <Text style={styles.primaryText}>Выйти на смену</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },

  header: {
    height: 48,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E6EAF0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0D1220" },
  iconBtn: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: 2,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E53935",
  },

  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 90 },

  avatarWrap: { alignItems: "center", marginTop: 6 },
  avatar: { width: 104, height: 104, borderRadius: 52 },
  name: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    color: "#0D1220",
    marginTop: 8,
    marginBottom: 10,
  },

  label: {
    color: "#8E98A3",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  field: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F4F6FA",
    borderWidth: 1,
    borderColor: "#E6EAF0",
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  fieldInput: { color: "#0D1220", padding: 0 },

  sectionTitle: { color: "#8E98A3", fontSize: 12, fontWeight: "700" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E6EAF0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowItem: { paddingHorizontal: 14, height: 48, flexDirection: "row", alignItems: "center" },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowText: { color: "#0D1220", fontSize: 16, fontWeight: "600" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#E6EAF0", marginHorizontal: 12 },

  // нижняя панель с кнопкой
  bottomBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    padding: 16, backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: "#E6EAF0",
  },
  fullBtn: { height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  primary: { backgroundColor: "#2F6BFF" },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondary: { backgroundColor: "#EEF2F7" },
  secondaryText: { color: "#0D1220", fontSize: 16, fontWeight: "700" },
});
