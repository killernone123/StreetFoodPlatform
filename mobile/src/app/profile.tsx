import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Customer = {
  name?: string;
  email?: string;
  phone?: string;
};

export default function ProfileScreen() {
  const router = useRouter();

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadCustomer();
  }, []);

  const loadCustomer = async () => {
    try {
      const token =
        await AsyncStorage.getItem(
          "customerToken"
        );

      const customerData =
        await AsyncStorage.getItem(
          "customerData"
        );

      if (!token) {
        setCustomer(null);
        return;
      }

      if (customerData) {
        const data =
          JSON.parse(customerData);

        setCustomer(data);
      }
    } catch (error) {
      console.log(
        "PROFILE LOAD ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(
                "customerToken"
              );

              await AsyncStorage.removeItem(
                "customerData"
              );

              setCustomer(null);

              router.replace("/login");
            } catch (error) {
              console.log(
                "LOGOUT ERROR:",
                error
              );

              Alert.alert(
                "Error",
                "Unable to logout."
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#E65100"
        />

        <Text style={styles.loadingText}>
          Loading profile...
        </Text>
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.container}>
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
            My Account
          </Text>

          <View style={{ width: 42 }} />
        </View>

        <View style={styles.loginContainer}>
          <Text style={styles.loginIcon}>
            👤
          </Text>

          <Text style={styles.loginTitle}>
            Login Required
          </Text>

          <Text style={styles.loginSubtitle}>
            Login or create an account to
            manage your orders.
          </Text>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() =>
              router.replace("/login")
            }
          >
            <Text style={styles.loginButtonText}>
              Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() =>
              router.push("/register")
            }
          >
            <Text style={styles.registerButtonText}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          My Account
        </Text>

        <View style={{ width: 42 }} />
      </View>

      {/* PROFILE */}

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {customer.name
                ?.charAt(0)
                .toUpperCase() || "U"}
            </Text>
          </View>

          <Text style={styles.name}>
            {customer.name || "Customer"}
          </Text>

          <Text style={styles.email}>
            {customer.email ||
              "Email not available"}
          </Text>
        </View>

        {/* CUSTOMER INFO */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Personal Information
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>
              👤
            </Text>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                Name
              </Text>

              <Text style={styles.infoValue}>
                {customer.name || "-"}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>
              📧
            </Text>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                Email
              </Text>

              <Text style={styles.infoValue}>
                {customer.email || "-"}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>
              📱
            </Text>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                Phone
              </Text>

              <Text style={styles.infoValue}>
                {customer.phone || "-"}
              </Text>
            </View>
          </View>
        </View>

        {/* MY ORDERS */}

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() =>
            router.push("/my-orders")
          }
        >
          <Text style={styles.menuIcon}>
            📦
          </Text>

          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>
              My Orders
            </Text>

            <Text style={styles.menuSubtitle}>
              View your order history
            </Text>
          </View>

          <Text style={styles.arrow}>
            →
          </Text>
        </TouchableOpacity>

        {/* LOGOUT */}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutIcon}>
            🚪
          </Text>

          <Text style={styles.logoutText}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#777",
    fontSize: 14,
  },

  header: {
    height: 65,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#222",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F2F2F2",
    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    fontSize: 27,
    color: "#222",
  },

  content: {
    padding: 16,
  },

  profileCard: {
    backgroundColor: "#E65100",
    borderRadius: 22,
    padding: 25,
    alignItems: "center",
    marginBottom: 16,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  avatarText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#E65100",
  },

  name: {
    fontSize: 23,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  email: {
    fontSize: 13,
    color: "#FFE5D0",
    marginTop: 5,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222",
    marginBottom: 15,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  infoIcon: {
    fontSize: 21,
    width: 40,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    color: "#999",
  },

  infoValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    marginTop: 3,
  },

  menuButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  menuIcon: {
    fontSize: 25,
    width: 45,
  },

  menuContent: {
    flex: 1,
  },

  menuTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
  },

  menuSubtitle: {
    fontSize: 12,
    color: "#888",
    marginTop: 3,
  },

  arrow: {
    fontSize: 22,
    color: "#E65100",
    fontWeight: "800",
  },

  logoutButton: {
    height: 54,
    borderRadius: 15,
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: "#FFD5D5",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },

  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },

  logoutText: {
    color: "#D32F2F",
    fontSize: 15,
    fontWeight: "900",
  },

  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  loginIcon: {
    fontSize: 65,
    marginBottom: 15,
  },

  loginTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#222",
  },

  loginSubtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 22,
  },

  loginButton: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    backgroundColor: "#E65100",
    justifyContent: "center",
    alignItems: "center",
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  registerButton: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E65100",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },

  registerButtonText: {
    color: "#E65100",
    fontSize: 15,
    fontWeight: "900",
  },
});