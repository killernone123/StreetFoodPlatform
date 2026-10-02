import React, { useEffect, useState } from "react";
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
import { useCartStore } from "../store/cartStore";

export default function CheckoutScreen() {
  const router = useRouter();

  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<"COD" | "ONLINE">("COD");

  const [checkingLogin, setCheckingLogin] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const subtotal = items.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  const deliveryCharge = subtotal > 0 ? 30 : 0;

  const grandTotal = subtotal + deliveryCharge;

  // CHECK LOGIN
  useEffect(() => {
    checkCustomerLogin();
  }, []);

  const checkCustomerLogin = async () => {
    try {
      const token =
        await AsyncStorage.getItem("customerToken");

      const customerData =
        await AsyncStorage.getItem("customerData");

      if (!token) {
        setCheckingLogin(false);

        Alert.alert(
          "Login Required",
          "Please login before placing your order.",
          [
            {
              text: "Login",
              onPress: () => {
                router.replace("/login");
              },
            },
          ]
        );

        return;
      }

      // Saved customer data se fields fill karna
      if (customerData) {
        const customer = JSON.parse(customerData);

        setName(customer?.name || "");
        setPhone(customer?.phone || "");
      }
    } catch (error) {
      console.log("LOGIN CHECK ERROR:", error);
    } finally {
      setCheckingLogin(false);
    }
  };

  // PLACE ORDER
  const placeOrder = async () => {
    if (!name.trim()) {
      Alert.alert(
        "Required",
        "Please enter your name."
      );
      return;
    }

    if (
      !phone.trim() ||
      phone.length !== 10
    ) {
      Alert.alert(
        "Invalid Phone",
        "Please enter a valid 10 digit phone number."
      );
      return;
    }

    if (!address.trim()) {
      Alert.alert(
        "Required",
        "Please enter your delivery address."
      );
      return;
    }

    if (items.length === 0) {
      Alert.alert(
        "Cart Empty",
        "Please add food to your cart."
      );
      return;
    }

    try {
      setPlacingOrder(true);

      const token =
        await AsyncStorage.getItem("customerToken");

      if (!token) {
        Alert.alert(
          "Login Required",
          "Please login first.",
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

      const orderData = {
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          landmark: landmark.trim(),
        },

        items: items.map((item) => ({
          foodId: item.foodId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          customizations: [],
          addOns: [],
        })),

        subtotal,
        deliveryCharge,
        grandTotal,

        paymentMethod,
      };

      console.log(
        "CREATING ORDER:",
        orderData
      );

      const response = await API.post(
        "/orders",
        orderData
      );

      console.log(
        "ORDER RESPONSE:",
        response.data
      );

      const order =
        response.data?.order ||
        response.data?.data ||
        response.data;

      clearCart();

      Alert.alert(
        "Order Placed Successfully 🎉",
        `Your order ${
          order?.orderNumber
            ? `#${order.orderNumber}`
            : ""
        } has been placed.`,
        [
          {
            text: "View Order",
            onPress: () => {
              if (order?._id) {
                router.replace(
                 ("/my-orders")
                );
              } else {
                router.replace("/my-orders");
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "ORDER ERROR:",
        error
      );

      console.log(
        "ORDER ERROR RESPONSE:",
        error?.response?.data
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
        "Order Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to place order. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  // EMPTY CART
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>
          🛒
        </Text>

        <Text style={styles.emptyTitle}>
          Your cart is empty
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.backButtonText}>
            Go to Home
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // LOGIN CHECK
  if (checkingLogin) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#E65100"
        />

        <Text style={styles.loadingText}>
          Checking login...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBack}
          onPress={() => router.back()}
        >
          <Text style={styles.headerBackText}>
            ←
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Checkout
        </Text>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* CUSTOMER DETAILS */}

        <Text style={styles.sectionTitle}>
          Delivery Details
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>
            Full Name
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#999"
            style={styles.input}
          />

          <Text style={styles.label}>
            Mobile Number
          </Text>

          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="10 digit mobile number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.input}
          />

          <Text style={styles.label}>
            Delivery Address
          </Text>

          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="House no, street, area..."
            placeholderTextColor="#999"
            multiline
            style={[
              styles.input,
              styles.addressInput,
            ]}
          />

          <Text style={styles.label}>
            Landmark
          </Text>

          <TextInput
            value={landmark}
            onChangeText={setLandmark}
            placeholder="Nearby landmark (optional)"
            placeholderTextColor="#999"
            style={styles.input}
          />
        </View>

        {/* PAYMENT */}

        <Text style={styles.sectionTitle}>
          Payment Method
        </Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "COD" &&
                styles.paymentSelected,
            ]}
            onPress={() =>
              setPaymentMethod("COD")
            }
          >
            <View style={styles.radio}>
              {paymentMethod === "COD" && (
                <View
                  style={styles.radioInner}
                />
              )}
            </View>

            <View>
              <Text
                style={styles.paymentTitle}
              >
                Cash on Delivery
              </Text>

              <Text
                style={styles.paymentSubtitle}
              >
                Pay when your order arrives
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "ONLINE" &&
                styles.paymentSelected,
            ]}
            onPress={() =>
              setPaymentMethod("ONLINE")
            }
          >
            <View style={styles.radio}>
              {paymentMethod === "ONLINE" && (
                <View
                  style={styles.radioInner}
                />
              )}
            </View>

            <View>
              <Text
                style={styles.paymentTitle}
              >
                Online Payment
              </Text>

              <Text
                style={styles.paymentSubtitle}
              >
                Pay securely online
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ORDER SUMMARY */}

        <Text style={styles.sectionTitle}>
          Order Summary
        </Text>

        <View style={styles.card}>
          {items.map((item) => (
            <View
              key={item.foodId}
              style={styles.summaryRow}
            >
              <Text
                style={styles.itemName}
                numberOfLines={1}
              >
                {item.name} × {item.quantity}
              </Text>

              <Text
                style={styles.itemPrice}
              >
                ₹{item.price * item.quantity}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.grayText}>
              Item Total
            </Text>

            <Text style={styles.amount}>
              ₹{subtotal}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.grayText}>
              Delivery
            </Text>

            <Text style={styles.amount}>
              ₹{deliveryCharge}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalText}>
              Grand Total
            </Text>

            <Text style={styles.totalAmount}>
              ₹{grandTotal}
            </Text>
          </View>
        </View>

        {/* PLACE ORDER */}

        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            placingOrder &&
              styles.disabledButton,
          ]}
          onPress={placeOrder}
          disabled={placingOrder}
        >
          {placingOrder ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text
              style={styles.placeOrderText}
            >
              {paymentMethod === "COD"
                ? `Place Order • ₹${grandTotal}`
                : `Pay Now • ₹${grandTotal}`}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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

  headerBack: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F2F2F2",
    justifyContent: "center",
    alignItems: "center",
  },

  headerBackText: {
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

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222",
    marginBottom: 12,
    marginTop: 8,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
    marginBottom: 7,
    marginTop: 8,
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

  addressInput: {
    height: 85,
    paddingTop: 14,
    textAlignVertical: "top",
  },

  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  paymentSelected: {
    borderColor: "#E65100",
    backgroundColor: "#FFF7EF",
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#E65100",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#E65100",
  },

  paymentTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222",
  },

  paymentSubtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 3,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  itemName: {
    flex: 1,
    fontSize: 14,
    color: "#444",
    marginRight: 10,
  },

  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },

  grayText: {
    fontSize: 14,
    color: "#777",
  },

  amount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },

  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 5,
  },

  totalText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#222",
  },

  totalAmount: {
    fontSize: 20,
    fontWeight: "900",
    color: "#E65100",
  },

  placeOrderButton: {
    height: 56,
    backgroundColor: "#E65100",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },

  disabledButton: {
    opacity: 0.7,
  },

  placeOrderText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  emptyContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    fontSize: 65,
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#222",
  },

  backButton: {
    backgroundColor: "#E65100",
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 20,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
});