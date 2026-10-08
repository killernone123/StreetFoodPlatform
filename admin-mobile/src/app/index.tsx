import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

const API_URL =
  "https://streetfoodplatform-1.onrender.com/api";

/* =========================================================
   PUSH NOTIFICATION HANDLER
========================================================= */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/* =========================================================
   REGISTER ADMIN PUSH NOTIFICATION
========================================================= */

const registerForPushNotificationsAsync = async () => {
  try {
    console.log("🔔 ADMIN PUSH REGISTRATION STARTED");

    // Physical Android/iOS device required
    if (!Device.isDevice) {
      console.log(
        "⚠️ Push notifications ke liye physical device required hai."
      );

      return null;
    }

    // Check current notification permission
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    console.log(
      "🔐 EXISTING NOTIFICATION PERMISSION:",
      existingStatus
    );

    let finalStatus = existingStatus;

    // Ask permission if not already granted
    if (existingStatus !== "granted") {
      const { status } =
        await Notifications.requestPermissionsAsync();

      finalStatus = status;

      console.log(
        "🔐 NEW NOTIFICATION PERMISSION:",
        finalStatus
      );
    }

    // Permission denied
    if (finalStatus !== "granted") {
      console.log(
        "❌ Admin notification permission nahi mili."
      );

      return null;
    }

    // Get Expo EAS project ID
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId;

    console.log(
      "📦 ADMIN EAS PROJECT ID:",
      projectId
    );

    if (!projectId) {
      console.log(
        "❌ Admin EAS projectId nahi mila."
      );

      return null;
    }

    // Generate Expo Push Token
    const pushToken =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    const expoPushToken = pushToken.data;

    console.log(
      "🔔 ADMIN EXPO PUSH TOKEN:",
      expoPushToken
    );

    // Get admin login token
    const adminToken =
      await AsyncStorage.getItem("adminToken");

    console.log(
      "🔑 ADMIN TOKEN AVAILABLE:",
      adminToken ? "YES" : "NO"
    );

    // Get admin data
    const adminDataString =
      await AsyncStorage.getItem("adminData");

    let adminId = null;

    try {
      if (adminDataString) {
        const adminData =
          JSON.parse(adminDataString);

        adminId =
          adminData?._id ||
          adminData?.id ||
          null;
      }
    } catch (error) {
      console.log(
        "⚠️ Admin data parse error:",
        error
      );
    }

    console.log(
      "👤 ADMIN ID:",
      adminId
    );

    // Save push token in backend
    const response = await fetch(
      `${API_URL}/push-notifications/register`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",

          ...(adminToken
            ? {
                Authorization:
                  `Bearer ${adminToken}`,
              }
            : {}),
        },

        body: JSON.stringify({
          token: expoPushToken,

          userType: "admin",

          userId: adminId,

          deviceName:
            "Street Food Admin Android",
        }),
      }
    );

    const data = await response.json();

    console.log(
      "📲 ADMIN PUSH TOKEN REGISTER RESPONSE:",
      data
    );

    if (!response.ok) {
      console.log(
        "❌ Admin push token register failed:",
        response.status
      );

      return null;
    }

    console.log(
      "✅ ADMIN PUSH TOKEN SAVED IN BACKEND"
    );

    return expoPushToken;
  } catch (error) {
    console.log(
      "❌ ADMIN PUSH TOKEN ERROR:",
      error
    );

    return null;
  }
};

/* =========================================================
   LOGIN SCREEN
========================================================= */

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    checkLogin();

    // Register admin device for push notifications
    registerForPushNotificationsAsync();
  }, []);

  /* =======================================================
     CHECK LOGIN
  ======================================================= */

  const checkLogin = async () => {
    try {
      const token =
        await AsyncStorage.getItem("adminToken");

      if (token) {
        router.replace("/dashboard");

        return;
      }
    } catch (error) {
      console.log(
        "Login check error:",
        error
      );
    } finally {
      setChecking(false);
    }
  };

  /* =======================================================
     ADMIN LOGIN
  ======================================================= */

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Missing Details",
        "Please enter email and password."
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/admin/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "ADMIN LOGIN RESPONSE:",
        data
      );

      if (!response.ok) {
        Alert.alert(
          "Login Failed",
          data?.message ||
            "Invalid email or password."
        );

        return;
      }

      const token = data?.token;

      if (!token) {
        Alert.alert(
          "Login Error",
          "Token was not received from server."
        );

        return;
      }

      /* Save admin token */

      await AsyncStorage.setItem(
        "adminToken",
        token
      );

      console.log(
        "ADMIN TOKEN:",
        token
      );

      /* Save admin data */

      await AsyncStorage.setItem(
        "adminData",
        JSON.stringify(
          data?.admin ||
            data?.user ||
            {}
        )
      );

      /*
       * Register push token again after login.
       *
       * This is important because now adminToken
       * and adminData are available.
       */

      await registerForPushNotificationsAsync();

      Alert.alert(
        "Login Successful",
        "Welcome to Admin Dashboard!",
        [
          {
            text: "Continue",

            onPress: () => {
              router.replace("/dashboard");
            },
          },
        ]
      );
    } catch (error) {
      console.log(
        "Login error:",
        error
      );

      Alert.alert(
        "Connection Error",
        "Unable to connect to server."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     CHECKING SCREEN
  ======================================================= */

  if (checking) {
    return (
      <View
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="large"
          color="#ff6b00"
        />

        <Text
          style={styles.loadingText}
        >
          Checking login...
        </Text>
      </View>
    );
  }

  /* =======================================================
     LOGIN UI
  ======================================================= */

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <View style={styles.card}>

        <Text style={styles.logo}>
          🍔
        </Text>

        <Text style={styles.brand}>
          STREET FOOD
        </Text>

        <Text style={styles.title}>
          Admin Login
        </Text>

        <Text style={styles.subtitle}>
          Manage your orders from anywhere
        </Text>

        <Text style={styles.label}>
          Email
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter admin email"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>
          Password
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter password"
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[
            styles.loginButton,
            loading &&
              styles.disabledButton,
          ]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator
              color="#ffffff"
            />
          ) : (
            <Text style={styles.loginText}>
              Login
            </Text>
          )}
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
    justifyContent: "center",
    padding: 20,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#f5f7fb",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#64748b",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 25,

    elevation: 5,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 15,

    shadowOffset: {
      width: 0,
      height: 5,
    },
  },

  logo: {
    fontSize: 48,
    textAlign: "center",
  },

  brand: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#ff6b00",
  },

  title: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 30,
    fontWeight: "900",
    color: "#111827",
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 25,
    textAlign: "center",
    fontSize: 13,
    color: "#64748b",
  },

  label: {
    marginBottom: 7,
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
  },

  input: {
    height: 52,

    borderWidth: 1,
    borderColor: "#e2e8f0",

    borderRadius: 13,

    paddingHorizontal: 15,

    marginBottom: 17,

    fontSize: 15,
    color: "#111827",

    backgroundColor: "#f8fafc",
  },

  loginButton: {
    height: 54,

    marginTop: 5,

    borderRadius: 14,

    backgroundColor: "#ff6b00",

    justifyContent: "center",
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.7,
  },

  loginText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },
});