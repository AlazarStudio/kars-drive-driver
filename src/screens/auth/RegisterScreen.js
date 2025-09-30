import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

export default function RegisterScreen({ navigation }) {
    const [form, setForm] = useState({
        fullName: "",
        phone: "",
        email: "",
        password: "",
        confirm: "",
    });

    const handleChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleRegister = () => {
        // Пока просто лог
        console.log("Регистрация:", form);
        // В будущем тут вызов API
        navigation.replace("Tabs"); // после успешной регистрации кидаем в приложение
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Регистрация</Text>

            <TextInput
                placeholder="ФИО"
                style={styles.input}
                value={form.fullName}
                onChangeText={(t) => handleChange("fullName", t)}
            />
            <TextInput
                placeholder="Телефон"
                style={styles.input}
                value={form.phone}
                keyboardType="phone-pad"
                onChangeText={(t) => handleChange("phone", t)}
            />
            <TextInput
                placeholder="Email"
                style={styles.input}
                value={form.email}
                keyboardType="email-address"
                onChangeText={(t) => handleChange("email", t)}
            />
            <TextInput
                placeholder="Пароль"
                style={styles.input}
                secureTextEntry
                value={form.password}
                onChangeText={(t) => handleChange("password", t)}
            />
            <TextInput
                placeholder="Повторите пароль"
                style={styles.input}
                secureTextEntry
                value={form.confirm}
                onChangeText={(t) => handleChange("confirm", t)}
            />

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Зарегистрироваться</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.replace("Login")}>
                <Text style={styles.link}>Уже зарегистрированы? Войти</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: "center", backgroundColor: "#fff" },
    title: { fontSize: 24, fontWeight: "700", marginBottom: 20, textAlign: "center" },
    input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 12, marginBottom: 12 },
    button: { backgroundColor: "#2563eb", padding: 14, borderRadius: 12, marginTop: 10 },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" },
    link: { marginTop: 12, textAlign: "center", color: "#2563eb" },
});
