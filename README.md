# 🚖 KarsAvia Driver App

Мобильное приложение для водителей системы **KarsAvia**  
(экосистема автоматизации размещения и трансфера авиакомпаний).  
Создано на **React Native (Expo)** с использованием карт **OpenStreetMap (MapTiler)**.

---

## 📱 Функционал

- Авторизация водителя  
- Просмотр и принятие заявок  
- Отображение маршрута поездки  
- Показ текущего местоположения  
- Карта на основе **OpenStreetMap / MapTiler**  
- Совместимость с **iOS и Android**

---

## 🗺️ Используемая карта

Карта отображается через компонент `react-native-maps`  
с источником тайлов **MapTiler (OSM)**.

### Подключение тайлов
```jsx
<UrlTile
  urlTemplate="https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=8HWaIwB79iEATnrrvKVH"
  maximumZ={19}
  zIndex={-1}
/>
```

### Особенности:
- На Android отключена подложка Google (`mapType="none"`)
- На iOS используется стандартный провайдер (`mapType="standard"`)
- Атрибуция:
  ```
  © OpenStreetMap contributors · MapTiler
  ```

---

## 🧩 Общий компонент карты

Для единообразного отображения карты во всех экранах создан компонент  
`src/components/MapTilerMap.js`:

```jsx
import React from "react";
import { View, Text, Platform, StyleSheet } from "react-native";
import MapView, { UrlTile, PROVIDER_DEFAULT } from "react-native-maps";

const MAPTILER_KEY = "8HWaIwB79iEATnrrvKVH";
const TILE_URL = `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`;

export default function MapTilerMap({ children, ...props }) {
  return (
    <View style={{ flex: 1 }}>
      <MapView
        provider={PROVIDER_DEFAULT}
        mapType={Platform.OS === "android" ? "none" : "standard"}
        style={{ flex: 1 }}
        {...props}
      >
        <UrlTile urlTemplate={TILE_URL} maximumZ={19} zIndex={-1} />
        {children}
      </MapView>

      <View style={styles.attribution}>
        <Text style={styles.attrText}>
          © OpenStreetMap contributors · MapTiler
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  attribution: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  attrText: { fontSize: 12, color: "#333" },
});
```

Использование:
```jsx
<MapTilerMap initialRegion={region} showsUserLocation>
  <Marker coordinate={region} />
</MapTilerMap>
```

---

## ⚙️ Установка и запуск

### 1. Установка зависимостей
```bash
npm install
# или
yarn install
```

### 2. Запуск локально
```bash
expo start
```
После этого:
- Отсканируй QR в Expo Go (iOS/Android)
- или открой в эмуляторе

### 3. Очистка кэша (при изменениях в картах)
```bash
expo start -c
```

---

## 🧱 Сборка APK / AAB

Проект собирается через **EAS Build**.

### Быстрая сборка APK
```bash
eas build -p android --profile preview
```

### Продакшн (AAB для Google Play)
```bash
eas build -p android --profile production
```

> Первый раз выбери “Let EAS handle credentials” — Expo сам создаст ключи.

---

## 🔐 Разрешения и конфигурация

### `app.json`
```json
{
  "expo": {
    "plugins": [
      ["expo-location", { "isAndroidBackgroundLocationEnabled": false }]
    ],
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Нужен доступ к вашей геопозиции для показа карты рядом с вами."
      }
    },
    "android": {
      "permissions": ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"]
    }
  }
}
```

---

## 💡 Советы

- `UrlTile` должен быть **первым элементом внутри MapView**  
  (иначе тайлы могут перекрываться маркерами).
- Для всех экранов добавь `provider={PROVIDER_DEFAULT}` и `mapType="none"` на Android.
- После редактирования ключей и конфигов очищай Metro cache.
- Храни MapTiler API key в `.env` или `app.json → extra` при продакшне.

---

## 🧭 Лицензия карт

Карта использует данные © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)  
и визуальные тайлы от [MapTiler](https://www.maptiler.com/).

Использование тайлов требует соблюдения [MapTiler Terms of Service](https://www.maptiler.com/terms/).

---

## 🧑‍💻 Авторы

**KarsAvia Software Team**  
Разработка — Алим Джатдоев  
React Native / Expo / GraphQL / SaaS / CRM Development

---
