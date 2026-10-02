import React, { useEffect, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { io, Socket } from "socket.io-client";

import API from "../services/api";

const SOCKET_URL = "https://streetfoodplatform-1.onrender.com";

type OrderItem = {
  _id?: string;
  foodId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  customizations?: any[];
  addOns?: any[];
};

type Order = {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    landmark?: string;
  };
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
};

const STATUS_STEPS = [
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export default function OrderDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const orderId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : "";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);

  // ==============================
  // FETCH ORDER
  // ==============================

  const fetchOrder = async () => {
    if (!orderId) {
      Alert.alert("Error", "Order ID nahi mila.");
      router.back();
      return;
    }

    try {
      const response = await API.get(`/orders/${orderId}`);

      console.log("ORDER DETAILS:", response.data);

      setOrder(response.data.order || response.data);
    } catch (error: any) {
      console.log(
        "ORDER DETAILS ERROR:",
        error?.response?.data || error
      );

      if (error?.response?.status === 401) {
        Alert.alert(
          "Session Expired",
          "Please login again."
        );

        router.replace("/login");
        return;
      }

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Order details load nahi ho paaye."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==============================
  // NORMAL ORDER FETCH
  // ==============================

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // ==============================
  // LIVE SOCKET CONNECTION
  // ==============================

  useEffect(() => {
    if (!orderId) {
      console.log("❌ Socket: Order ID missing");
      return;
    }

    console.log(
      "🔌 Connecting Socket.IO...",
      SOCKET_URL
    );

    /*
     * IMPORTANT:
     * Render Socket.IO polling handshake
     * successfully working hai.
     *
     * Isliye abhi sirf polling use kar rahe hain.
     * WebSocket upgrade disable kiya gaya hai.
     */

    const socket: Socket = io(SOCKET_URL, {
      transports: ["polling"],
      upgrade: false,

      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,

      timeout: 15000,

      forceNew: true,
    });

    // ===================================
    // SOCKET CONNECTED
    // ===================================

    socket.on("connect", () => {
      console.log(
        "🟢 Socket connected:",
        socket.id
      );

      setLiveConnected(true);

      // Join current order room
      socket.emit(
        "joinOrderRoom",
        orderId
      );

      console.log(
        "📦 Joined order room:",
        `order_${orderId}`
      );
    });

    // ===================================
    // SOCKET DISCONNECTED
    // ===================================

    socket.on("disconnect", (reason) => {
      console.log(
        "🔴 Socket disconnected:",
        reason
      );

      setLiveConnected(false);
    });

    // ===================================
    // SOCKET CONNECTION ERROR
    // ===================================

    socket.on("connect_error", (error) => {
      console.log(
        "❌ Socket connection error:",
        error.message
      );

      console.log(
        "❌ Socket error details:",
        error
      );

      setLiveConnected(false);
    });

    // ===================================
    // RECONNECT ATTEMPT
    // ===================================

    socket.io.on("reconnect_attempt", (attempt) => {
      console.log(
        "🔄 Socket reconnect attempt:",
        attempt
      );
    });

    // ===================================
    // RECONNECTED
    // ===================================

    socket.io.on("reconnect", (attempt) => {
      console.log(
        "🟢 Socket reconnected:",
        attempt
      );

      setLiveConnected(true);

      socket.emit(
        "joinOrderRoom",
        orderId
      );
    });

    // ===================================
    // ORDER STATUS UPDATE LISTENER
    // ===================================

    socket.on(
      "orderStatusUpdated",
      (data) => {
        console.log(
          "🚀 LIVE ORDER UPDATE:",
          data
        );

        if (!data) {
          return;
        }

        /*
         * Backend orderId string ya ObjectId
         * dono cases handle karne ke liye.
         */

        const updatedOrderId =
          data.orderId?.toString?.() ||
          String(data.orderId || "");

        if (
          updatedOrderId ===
          String(orderId)
        ) {
          setOrder((previousOrder) => {
            if (!previousOrder) {
              return previousOrder;
            }

            return {
              ...previousOrder,

              orderStatus:
                data.orderStatus ||
                previousOrder.orderStatus,

              paymentStatus:
                data.paymentStatus ||
                previousOrder.paymentStatus,
            };
          });

          Alert.alert(
            "Order Updated 🎉",
            `Your order is now ${
              data.orderStatus?.replaceAll(
                "_",
                " "
              ) || "updated"
            }`
          );
        }
      }
    );

    // ===================================
    // CLEANUP
    // ===================================

    return () => {
      console.log(
        "🧹 Closing Socket.IO"
      );

      socket.removeAllListeners();

      socket.disconnect();
    };
  }, [orderId]);

  // ==============================
  // REFRESH
  // ==============================

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrder();
  };

  // ==============================
  // STATUS
  // ==============================

  const getStatusIndex = () => {
    if (!order) {
      return -1;
    }

    return STATUS_STEPS.indexOf(
      order.orderStatus
    );
  };

  const currentStatusIndex =
    getStatusIndex();

  const formatStatus = (
    status: string
  ) => {
    return status.replaceAll(
      "_",
      " "
    );
  };

  const formatDate = (
    date: string
  ) => {
    return new Date(
      date
    ).toLocaleString("en-IN");
  };

  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#ff6b00"
        />

        <Text style={styles.loadingText}>
          Loading order...
        </Text>
      </View>
    );
  }

  // ==============================
  // ORDER NOT FOUND
  // ==============================

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>
          Order not found
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      {/* ==============================
          HEADER
      ============================== */}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backCircle}
        >
          <Text style={styles.backArrow}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Order Details
        </Text>

        <View
          style={{ width: 42 }}
        />
      </View>

      {/* ==============================
          LIVE STATUS INDICATOR
      ============================== */}

      <View style={styles.liveBar}>
        <View
          style={[
            styles.liveDot,

            liveConnected
              ? styles.liveDotConnected
              : styles.liveDotDisconnected,
          ]}
        />

        <Text style={styles.liveText}>
          {liveConnected
            ? "Live order tracking connected"
            : "Connecting to live tracking..."}
        </Text>
      </View>

      {/* ==============================
          ORDER NUMBER
      ============================== */}

      <View style={styles.orderCard}>
        <Text style={styles.smallLabel}>
          ORDER NUMBER
        </Text>

        <Text style={styles.orderNumber}>
          #{order.orderNumber}
        </Text>

        <Text style={styles.date}>
          {formatDate(
            order.createdAt
          )}
        </Text>
      </View>

      {/* ==============================
          CURRENT STATUS
      ============================== */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Order Status
        </Text>

        <View
          style={
            styles.currentStatusBox
          }
        >
          <Text
            style={styles.statusEmoji}
          >
            {order.orderStatus ===
            "DELIVERED"
              ? "✅"
              : order.orderStatus ===
                "CANCELLED"
              ? "❌"
              : "🛵"}
          </Text>

          <View
            style={{ flex: 1 }}
          >
            <Text
              style={
                styles.currentStatus
              }
            >
              {formatStatus(
                order.orderStatus
              )}
            </Text>

            <Text
              style={
                styles.statusSubText
              }
            >
              {order.orderStatus ===
              "DELIVERED"
                ? "Your order has been delivered."
                : order.orderStatus ===
                  "CANCELLED"
                ? "This order has been cancelled."
                : "Your order is being processed."}
            </Text>
          </View>
        </View>

        {/* ==============================
            TRACKING STEPS
        ============================== */}

        {order.orderStatus !==
          "CANCELLED" && (
          <View
            style={
              styles.trackingContainer
            }
          >
            {STATUS_STEPS.map(
              (
                status,
                index
              ) => {
                const completed =
                  index <=
                  currentStatusIndex;

                const isLast =
                  index ===
                  STATUS_STEPS.length -
                    1;

                return (
                  <View
                    key={status}
                    style={
                      styles.stepRow
                    }
                  >
                    <View
                      style={
                        styles.stepLeft
                      }
                    >
                      <View
                        style={[
                          styles.dot,
                          completed &&
                            styles.completedDot,
                        ]}
                      >
                        {completed && (
                          <Text
                            style={
                              styles.check
                            }
                          >
                            ✓
                          </Text>
                        )}
                      </View>

                      {!isLast && (
                        <View
                          style={[
                            styles.line,
                            index <
                              currentStatusIndex &&
                              styles.completedLine,
                          ]}
                        />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.stepText,
                        completed &&
                          styles.completedStepText,
                      ]}
                    >
                      {formatStatus(
                        status
                      )}
                    </Text>
                  </View>
                );
              }
            )}
          </View>
        )}
      </View>

      {/* ==============================
          ITEMS
      ============================== */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Your Items
        </Text>

        {order.items.map(
          (item, index) => (
            <View
              key={`${item.foodId || index}`}
              style={styles.itemRow}
            >
              <View
                style={
                  styles.quantityBox
                }
              >
                <Text
                  style={
                    styles.quantity
                  }
                >
                  {item.quantity}x
                </Text>
              </View>

              <View
                style={
                  styles.itemInfo
                }
              >
                <Text
                  style={
                    styles.itemName
                  }
                >
                  {item.name}
                </Text>

                <Text
                  style={
                    styles.itemPrice
                  }
                >
                  ₹{item.unitPrice} ×{" "}
                  {item.quantity}
                </Text>
              </View>

              <Text
                style={
                  styles.itemTotal
                }
              >
                ₹
                {item.unitPrice *
                  item.quantity}
              </Text>
            </View>
          )
        )}
      </View>

      {/* ==============================
          DELIVERY DETAILS
      ============================== */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Delivery Details
        </Text>

        <Text style={styles.infoLabel}>
          Name
        </Text>

        <Text style={styles.infoValue}>
          {order.customer.name}
        </Text>

        <Text style={styles.infoLabel}>
          Phone
        </Text>

        <Text style={styles.infoValue}>
          {order.customer.phone}
        </Text>

        <Text style={styles.infoLabel}>
          Address
        </Text>

        <Text style={styles.infoValue}>
          {order.customer.address}
        </Text>

        {order.customer.landmark ? (
          <>
            <Text
              style={styles.infoLabel}
            >
              Landmark
            </Text>

            <Text
              style={styles.infoValue}
            >
              {
                order.customer
                  .landmark
              }
            </Text>
          </>
        ) : null}
      </View>

      {/* ==============================
          PAYMENT
      ============================== */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Payment
        </Text>

        <View
          style={styles.paymentRow}
        >
          <Text
            style={styles.paymentLabel}
          >
            Method
          </Text>

          <Text
            style={styles.paymentValue}
          >
            {order.paymentMethod}
          </Text>
        </View>

        <View
          style={styles.paymentRow}
        >
          <Text
            style={styles.paymentLabel}
          >
            Payment Status
          </Text>

          <Text
            style={[
              styles.paymentValue,

              order.paymentStatus ===
                "PAID"
                ? styles.paid
                : styles.pending,
            ]}
          >
            {order.paymentStatus}
          </Text>
        </View>
      </View>

      {/* ==============================
          BILL
      ============================== */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Bill Details
        </Text>

        <View
          style={styles.billRow}
        >
          <Text
            style={styles.billLabel}
          >
            Subtotal
          </Text>

          <Text
            style={styles.billValue}
          >
            ₹{order.subtotal}
          </Text>
        </View>

        <View
          style={styles.billRow}
        >
          <Text
            style={styles.billLabel}
          >
            Delivery Charge
          </Text>

          <Text
            style={styles.billValue}
          >
            {order.deliveryCharge ===
            0
              ? "FREE"
              : `₹${order.deliveryCharge}`}
          </Text>
        </View>

        <View
          style={styles.divider}
        />

        <View
          style={styles.billRow}
        >
          <Text
            style={styles.grandLabel}
          >
            Grand Total
          </Text>

          <Text
            style={styles.grandTotal}
          >
            ₹{order.grandTotal}
          </Text>
        </View>
      </View>

      {/* ==============================
          MANUAL REFRESH
      ============================== */}

      <TouchableOpacity
        style={
          styles.refreshButton
        }
        onPress={fetchOrder}
      >
        <Text
          style={styles.refreshText}
        >
          🔄 Refresh Order Status
        </Text>
      </TouchableOpacity>

      <View
        style={{ height: 30 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7fb",
  },

  content: {
    paddingBottom: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f6f7fb",
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#666",
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    marginBottom: 20,
  },

  header: {
    height: 70,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222",
  },

  backCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff3e8",
    justifyContent: "center",
    alignItems: "center",
  },

  backArrow: {
    fontSize: 32,
    color: "#ff6b00",
    marginTop: -4,
  },

  liveBar: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
  },

  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 8,
  },

  liveDotConnected: {
    backgroundColor: "#18a957",
  },

  liveDotDisconnected: {
    backgroundColor: "#e5a000",
  },

  liveText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },

  orderCard: {
    margin: 16,
    marginBottom: 0,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#ff6b00",
  },

  smallLabel: {
    color: "#ffe6d3",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },

  orderNumber: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 5,
  },

  date: {
    color: "#fff",
    marginTop: 6,
    fontSize: 13,
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    padding: 18,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222",
    marginBottom: 16,
  },

  currentStatusBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff7f0",
    padding: 14,
    borderRadius: 14,
  },

  statusEmoji: {
    fontSize: 30,
    marginRight: 12,
  },

  currentStatus: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ff6b00",
  },

  statusSubText: {
    fontSize: 12,
    color: "#777",
    marginTop: 3,
  },

  trackingContainer: {
    marginTop: 22,
  },

  stepRow: {
    flexDirection: "row",
    minHeight: 48,
  },

  stepLeft: {
    width: 32,
    alignItems: "center",
  },

  dot: {
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#d6d6d6",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  completedDot: {
    backgroundColor: "#ff6b00",
    borderColor: "#ff6b00",
  },

  check: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },

  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#ddd",
    marginVertical: 2,
  },

  completedLine: {
    backgroundColor: "#ff6b00",
  },

  stepText: {
    fontSize: 13,
    color: "#999",
    marginLeft: 12,
    marginTop: 4,
    fontWeight: "600",
  },

  completedStepText: {
    color: "#222",
    fontWeight: "800",
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  quantityBox: {
    width: 42,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#fff3e8",
    justifyContent: "center",
    alignItems: "center",
  },

  quantity: {
    color: "#ff6b00",
    fontWeight: "800",
  },

  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },

  itemName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },

  itemPrice: {
    fontSize: 12,
    color: "#888",
    marginTop: 3,
  },

  itemTotal: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222",
  },

  infoLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 10,
  },

  infoValue: {
    fontSize: 15,
    color: "#222",
    fontWeight: "600",
    marginTop: 3,
  },

  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },

  paymentLabel: {
    color: "#777",
    fontSize: 14,
  },

  paymentValue: {
    color: "#222",
    fontSize: 14,
    fontWeight: "800",
  },

  paid: {
    color: "#159447",
  },

  pending: {
    color: "#e58a00",
  },

  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
  },

  billLabel: {
    color: "#777",
    fontSize: 14,
  },

  billValue: {
    color: "#222",
    fontSize: 14,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
  },

  grandLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222",
  },

  grandTotal: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ff6b00",
  },

  refreshButton: {
    marginHorizontal: 16,
    marginTop: 16,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#ff6b00",
    justifyContent: "center",
    alignItems: "center",
  },

  refreshText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  backButton: {
    backgroundColor: "#ff6b00",
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 12,
  },

  backButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
});