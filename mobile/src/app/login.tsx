import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import API from "../services/api";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Required", "Please enter your email.");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Required", "Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/users/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      console.log("LOGIN RESPONSE:", response.data);

      const data = response.data;

      /*
       * Backend response ke different possible formats
       * ko handle kar rahe hain.
       */
      const token =
        data?.token ||
        data?.accessToken ||
        data?.user?.token;

      const customer =
        data?.user ||
        data?.customer ||
        data?.data?.user ||
        data?.data?.customer ||
        null;

      if (!token) {
        console.log("TOKEN NOT FOUND:", data);

        Alert.alert(
          "Login Error",
          "Login successful response mila, lekin token nahi mila."
        );

        return;
      }

      // JWT token save
      await AsyncStorage.setItem(
        "customerToken",
        token
      );

      // Customer information save
      if (customer) {
        await AsyncStorage.setItem(
          "customerData",
          JSON.stringify(customer)
        );
      }

      Alert.alert(
        "Login Successful 🎉",
        "Welcome to Street Food!",
        [
          {
            text: "Continue",
            onPress: () => {
              router.replace("/");
            },
          },
        ]
      );
    } catch (error: any) {
      console.log("LOGIN ERROR:", error);
      console.log(
        "LOGIN ERROR RESPONSE:",
        error?.response?.data
      );

      Alert.alert(
        "Login Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* LOGO */}

        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🍔</Text>

          <Text style={styles.logo}>
            Street Food
          </Text>

          <Text style={styles.subtitle}>
            Delicious food, delivered to you
          </Text>
        </View>

        {/* LOGIN CARD */}

        <View style={styles.card}>
          <Text style={styles.title}>
            Welcome Back 👋
          </Text>

          <Text style={styles.description}>
            Login to continue your order
          </Text>

          {/* EMAIL */}

          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* PASSWORD */}

          <Text style={styles.label}>
            Password
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {/* LOGIN BUTTON */}

          <TouchableOpacity
            style={[
              styles.loginButton,
              loading && styles.disabledButton,
            ]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text style={styles.loginButtonText}>
                Login
              </Text>
            )}
          </TouchableOpacity>

          {/* REGISTER */}

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() =>
              router.push("/register")
            }
            activeOpacity={0.7}
          >
            <Text style={styles.registerText}>
              Don't have an account?{" "}
              <Text style={styles.registerLink}>
                Register
              </Text>
            </Text>
          </TouchableOpacity>

          {/* BACK */}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>
              ← Back
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },

  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 25,
  },

  logoEmoji: {
    fontSize: 60,
    marginBottom: 8,
  },

  logo: {
    fontSize: 30,
    fontWeight: "900",
    color: "#E65100",
  },

  subtitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 5,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 22,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#222",
  },

  description: {
    fontSize: 13,
    color: "#777",
    marginTop: 5,
    marginBottom: 20,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
    marginBottom: 7,
    marginTop: 10,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 13,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#222",
    backgroundColor: "#FAFAFA",
  },

  loginButton: {
    height: 54,
    backgroundColor: "#E65100",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },

  disabledButton: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  registerButton: {
    alignItems: "center",
    marginTop: 20,
  },

  registerText: {
    fontSize: 13,
    color: "#777",
  },

  registerLink: {
    color: "#E65100",
    fontWeight: "900",
  },

  backButton: {
    alignItems: "center",
    marginTop: 18,
  },

  backText: {
    color: "#555",
    fontSize: 14,
    fontWeight: "700",
  },
});