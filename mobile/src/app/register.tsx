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
import API from "../services/api";

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter your name.");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Required", "Please enter your email.");
      return;
    }

    if (!phone.trim() || phone.length !== 10) {
      Alert.alert(
        "Invalid Phone",
        "Please enter a valid 10 digit phone number."
      );
      return;
    }

    if (!password.trim()) {
      Alert.alert(
        "Required",
        "Please enter a password."
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Password Error",
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await API.post(
        "/users/register",
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
        }
      );

      console.log(
        "REGISTER RESPONSE:",
        response.data
      );

      Alert.alert(
        "Registration Successful 🎉",
        "Your account has been created successfully.",
        [
          {
            text: "Login",
            onPress: () => {
              router.replace("/login");
            },
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "REGISTER ERROR:",
        error
      );

      console.log(
        "REGISTER ERROR RESPONSE:",
        error?.response?.data
      );

      Alert.alert(
        "Registration Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to create account."
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
        {/* HEADER */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>
              ←
            </Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Create Account
          </Text>

          <View style={{ width: 42 }} />
        </View>

        {/* LOGO */}

        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>
            🍔
          </Text>

          <Text style={styles.logo}>
            Street Food
          </Text>

          <Text style={styles.subtitle}>
            Create your account and start ordering
          </Text>
        </View>

        {/* FORM */}

        <View style={styles.card}>
          <Text style={styles.title}>
            Register 👋
          </Text>

          <Text style={styles.description}>
            Enter your details to create an account
          </Text>

          {/* NAME */}

          <Text style={styles.label}>
            Full Name
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

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

          {/* PHONE */}

          <Text style={styles.label}>
            Mobile Number
          </Text>

          <TextInput
            style={styles.input}
            placeholder="10 digit mobile number"
            placeholderTextColor="#999"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
          />

          {/* PASSWORD */}

          <Text style={styles.label}>
            Password
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Create password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {/* CONFIRM PASSWORD */}

          <Text style={styles.label}>
            Confirm Password
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Re-enter password"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {/* REGISTER */}

          <TouchableOpacity
            style={[
              styles.registerButton,
              loading &&
                styles.disabledButton,
            ]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={styles.registerButtonText}
              >
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          {/* LOGIN */}

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() =>
              router.replace("/login")
            }
            activeOpacity={0.7}
          >
            <Text style={styles.loginText}>
              Already have an account?{" "}
              <Text style={styles.loginLink}>
                Login
              </Text>
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
    backgroundColor: "#F8F9FA",
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    fontSize: 27,
    color: "#222",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222",
  },

  logoContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 25,
  },

  logoEmoji: {
    fontSize: 60,
    marginBottom: 8,
  },

  logo: {
    fontSize: 28,
    fontWeight: "900",
    color: "#E65100",
  },

  subtitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 6,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
  },

  title: {
    fontSize: 23,
    fontWeight: "900",
    color: "#222",
  },

  description: {
    fontSize: 13,
    color: "#777",
    marginTop: 5,
    marginBottom: 10,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
    marginTop: 12,
    marginBottom: 7,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#E2E2E2",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#222",
    backgroundColor: "#FAFAFA",
  },

  registerButton: {
    height: 54,
    backgroundColor: "#E65100",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },

  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.7,
  },

  loginButton: {
    alignItems: "center",
    marginTop: 18,
    paddingVertical: 10,
  },

  loginText: {
    color: "#777",
    fontSize: 13,
  },

  loginLink: {
    color: "#E65100",
    fontWeight: "900",
  },
});