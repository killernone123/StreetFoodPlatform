import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import API from "../services/api";

type Order = {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    landmark?: string;
  };
  items: {
    foodId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    customizations?: any[];
    addOns?: any[];
  }[];
  subtotal: number;
  deliveryCharge: number;
  grandTotal: number;
  paymentMethod: "COD" | "ONLINE";
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
};

export default function MyOrdersScreen() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const token =
        await AsyncStorage.getItem("customerToken");

      if (!token) {
        Alert.alert(
          "Login Required",
          "Please login to view your orders.",
          [
            {
              text: "Login",
              onPress: () =>
                router.replace("/login"),
            },
          ]
        );

        return;
      }

      const response = await API.get(
        "/orders/my-orders"
      );

      console.log(
        "MY ORDERS:",
        response.data
      );

      setOrders(
        response.data?.orders || []
      );
    } catch (error: any) {
      console.log(
        "MY ORDERS ERROR:",
        error
      );

      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem(
          "customerToken"
        );

        Alert.alert(
          "Session Expired",
          "Please login again.",
          [
            {
              text: "Login",
              onPress: () =>
                router.replace("/login"),
            },
          ]
        );

        return;
      }

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Unable to load orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders();
    }, [])
  );

  const refreshOrders = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (
    status: string
  ) => {
    switch (status) {
      case "PLACED":
        return "#E65100";

      case "CONFIRMED":
        return "#1565C0";

      case "PREPARING":
        return "#6A1B9A";

      case "READY":
        return "#00897B";

      case "OUT_FOR_DELIVERY":
        return "#EF6C00";

      case "DELIVERED":
        return "#2E7D32";

      case "CANCELLED":
        return "#C62828";

      default:
        return "#555";
    }
  };

  const formatStatus = (
    status: string
  ) => {
    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const formatDate = (
    date: string
  ) => {
    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  /*
   * ORDER DETAILS OPEN
   */
  const openOrderDetails = (
    orderId: string
  ) => {
    router.push({
      pathname: "/order-details",
      params: {
        id: orderId,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#E65100"
        />

        <Text style={styles.loadingText}>
          Loading your orders...
        </Text>
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
          My Orders
        </Text>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshOrders}
            colors={["#E65100"]}
          />
        }
        contentContainerStyle={
          orders.length === 0
            ? styles.emptyScroll
            : styles.content
        }
      >
        {/* NO ORDERS */}

        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              🛍️
            </Text>

            <Text style={styles.emptyTitle}>
              No Orders Yet
            </Text>

            <Text style={styles.emptySubtitle}>
              Your placed orders will appear here.
            </Text>

            <TouchableOpacity
              style={styles.shopButton}
              onPress={() =>
                router.replace("/")
              }
            >
              <Text style={styles.shopButtonText}>
                Start Ordering
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.orderCount}>
              {orders.length}{" "}
              {orders.length === 1
                ? "Order"
                : "Orders"}
            </Text>

            {orders.map((order) => (
              <TouchableOpacity
                key={order._id}
                style={styles.orderCard}
                activeOpacity={0.8}
                onPress={() =>
                  openOrderDetails(order._id)
                }
              >
                {/* ORDER HEADER */}

                <View
                  style={styles.orderHeader}
                >
                  <View>
                    <Text
                      style={styles.orderNumber}
                    >
                      #{order.orderNumber}
                    </Text>

                    <Text
                      style={styles.orderDate}
                    >
                      {formatDate(
                        order.createdAt
                      )}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          getStatusColor(
                            order.orderStatus
                          ),
                      },
                    ]}
                  >
                    <Text
                      style={
                        styles.statusText
                      }
                    >
                      {formatStatus(
                        order.orderStatus
                      )}
                    </Text>
                  </View>
                </View>

                <View
                  style={styles.divider}
                />

                {/* ITEMS */}

                {order.items.map(
                  (item, index) => (
                    <View
                      key={`${order._id}-${index}`}
                      style={styles.itemRow}
                    >
                      <Text
                        style={styles.itemName}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>

                      <Text
                        style={styles.itemQty}
                      >
                        × {item.quantity}
                      </Text>

                      <Text
                        style={styles.itemPrice}
                      >
                        ₹
                        {item.unitPrice *
                          item.quantity}
                      </Text>
                    </View>
                  )
                )}

                <View
                  style={styles.divider}
                />

                {/* TOTAL */}

                <View
                  style={styles.totalRow}
                >
                  <View>
                    <Text
                      style={
                        styles.paymentMethod
                      }
                    >
                      {order.paymentMethod ===
                      "COD"
                        ? "Cash on Delivery"
                        : "Online Payment"}
                    </Text>

                    <Text
                      style={
                        styles.paymentStatus
                      }
                    >
                      Payment:{" "}
                      {order.paymentStatus}
                    </Text>
                  </View>

                  <View
                    style={styles.totalRight}
                  >
                    <Text
                      style={styles.totalLabel}
                    >
                      Total
                    </Text>

                    <Text
                      style={styles.totalAmount}
                    >
                      ₹{order.grandTotal}
                    </Text>
                  </View>
                </View>

                {/* VIEW DETAILS */}

                <View
                  style={styles.viewDetails}
                >
                  <Text
                    style={
                      styles.viewDetailsText
                    }
                  >
                    View Order Details →
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
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

  headerTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#222",
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  orderCount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#555",
    marginBottom: 12,
  },

  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },

  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  orderNumber: {
    fontSize: 16,
    fontWeight: "900",
    color: "#222",
  },

  orderDate: {
    fontSize: 11,
    color: "#888",
    marginTop: 5,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 13,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  itemName: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },

  itemQty: {
    width: 45,
    fontSize: 13,
    color: "#777",
  },

  itemPrice: {
    width: 65,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  paymentMethod: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
  },

  paymentStatus: {
    fontSize: 10,
    color: "#888",
    marginTop: 4,
  },

  totalRight: {
    alignItems: "flex-end",
  },

  totalLabel: {
    fontSize: 11,
    color: "#888",
  },

  totalAmount: {
    fontSize: 20,
    fontWeight: "900",
    color: "#E65100",
    marginTop: 2,
  },

  viewDetails: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    alignItems: "center",
  },

  viewDetailsText: {
    color: "#E65100",
    fontSize: 13,
    fontWeight: "800",
  },

  emptyScroll: {
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    fontSize: 65,
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#222",
  },

  emptySubtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginTop: 7,
  },

  shopButton: {
    backgroundColor: "#E65100",
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 22,
  },

  shopButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});