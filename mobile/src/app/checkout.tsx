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
import * as Location from "expo-location";
import RazorpayCheckout from "react-native-razorpay";

import API from "../services/api";
import { useCartStore } from "../store/cartStore";

export default function CheckoutScreen() {
  const router = useRouter();

  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  // ==========================================
  // CUSTOMER DETAILS
  // ==========================================

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");

  // ==========================================
  // PAYMENT
  // ==========================================

  const [paymentMethod, setPaymentMethod] =
    useState<"COD" | "ONLINE">("COD");

  // ==========================================
  // LOGIN
  // ==========================================

  const [checkingLogin, setCheckingLogin] =
    useState(true);

  const [placingOrder, setPlacingOrder] =
    useState(false);

  // ==========================================
  // LOCATION
  // ==========================================

  const [customerLat, setCustomerLat] =
    useState<number | null>(null);

  const [customerLng, setCustomerLng] =
    useState<number | null>(null);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [locationReady, setLocationReady] =
    useState(false);

  // ==========================================
  // DELIVERY CALCULATION
  // ==========================================

  const [deliveryCalculating, setDeliveryCalculating] =
    useState(false);

  const [deliveryDistanceKm, setDeliveryDistanceKm] =
    useState<number | null>(null);

  const [deliveryCharge, setDeliveryCharge] =
    useState<number | null>(null);

  const [deliveryAvailable, setDeliveryAvailable] =
    useState<boolean | null>(null);

  const [deliveryMessage, setDeliveryMessage] =
    useState("");

  // ==========================================
  // SUBTOTAL
  // ==========================================

  const subtotal = items.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  // ==========================================
  // GRAND TOTAL
  // ==========================================

  const grandTotal =
    subtotal +
    (deliveryCharge ?? 0);

  // ==========================================
  // CHECK LOGIN
  // ==========================================

  useEffect(() => {
    checkCustomerLogin();
  }, []);

  const checkCustomerLogin = async () => {
    try {
      const token =
        await AsyncStorage.getItem(
          "customerToken"
        );

      const customerData =
        await AsyncStorage.getItem(
          "customerData"
        );

      console.log(
        "CHECKOUT CUSTOMER TOKEN:",
        token ? "FOUND" : "NOT FOUND"
      );

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

      if (customerData) {
        const customer =
          JSON.parse(customerData);

        setName(
          customer?.name || ""
        );

        setPhone(
          customer?.phone || ""
        );
      }
    } catch (error) {
      console.log(
        "LOGIN CHECK ERROR:",
        error
      );
    } finally {
      setCheckingLogin(false);
    }
  };

  // ==========================================
  // GET CURRENT LOCATION
  // ==========================================

  const getCustomerLocation = async () => {
    try {
      setLocationLoading(true);

      setDeliveryMessage("");

      console.log(
        "📍 REQUESTING LOCATION..."
      );

      // --------------------------------------
      // Ask permission
      // --------------------------------------

      const {
        status
      } =
        await Location.requestForegroundPermissionsAsync();

      console.log(
        "📍 LOCATION PERMISSION:",
        status
      );

      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Please allow location permission so we can calculate delivery distance and charges."
        );

        setLocationLoading(false);

        return;
      }

      // --------------------------------------
      // Get current GPS position
      // --------------------------------------

      const location =
        await Location.getCurrentPositionAsync(
          {
            accuracy:
              Location.Accuracy.High,
          }
        );

      const latitude =
        location.coords.latitude;

      const longitude =
        location.coords.longitude;

      console.log(
        "📍 CUSTOMER LOCATION:",
        latitude,
        longitude
      );

      setCustomerLat(latitude);
      setCustomerLng(longitude);

      setLocationReady(true);

      // --------------------------------------
      // Calculate delivery
      // --------------------------------------

      await calculateDelivery(
        latitude,
        longitude
      );
    } catch (error) {
      console.log(
        "❌ LOCATION ERROR:",
        error
      );

      Alert.alert(
        "Location Error",
        "Unable to get your current location. Please try again."
      );
    } finally {
      setLocationLoading(false);
    }
  };

  // ==========================================
  // CALCULATE DELIVERY CHARGE
  // ==========================================

  const calculateDelivery = async (
    latitude: number,
    longitude: number
  ) => {
    try {
      setDeliveryCalculating(true);

      setDeliveryAvailable(null);

      setDeliveryCharge(null);

      setDeliveryDistanceKm(null);

      setDeliveryMessage("");

      console.log(
        "🚚 CALCULATING DELIVERY:",
        {
          customerLat: latitude,
          customerLng: longitude,
        }
      );

      const response =
        await API.post(
          "/delivery/calculate",
          {
            customerLat: latitude,
            customerLng: longitude,
          }
        );

      console.log(
        "🚚 DELIVERY RESPONSE:",
        response.data
      );

      const data =
        response.data;

      if (!data?.success) {
        setDeliveryAvailable(false);

        setDeliveryMessage(
          data?.message ||
            "Delivery is not available at this location."
        );

        return;
      }

      const distance =
        Number(data.distanceKm);

      const charge =
        Number(data.deliveryCharge);

      setDeliveryDistanceKm(
        distance
      );

      setDeliveryCharge(
        charge
      );

      setDeliveryAvailable(
        data.available !== false
      );

      setDeliveryMessage(
        data?.message || ""
      );

      console.log(
        "✅ DISTANCE:",
        distance,
        "KM"
      );

      console.log(
        "✅ DELIVERY CHARGE:",
        charge
      );
    } catch (error: any) {
      console.log(
        "❌ DELIVERY CALCULATION ERROR:",
        error
      );

      console.log(
        "❌ DELIVERY ERROR RESPONSE:",
        error?.response?.data
      );

      setDeliveryAvailable(false);

      setDeliveryMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to calculate delivery charge."
      );

      Alert.alert(
        "Delivery Calculation Failed",
        error?.response?.data?.message ||
          "Unable to calculate delivery charge. Please try again."
      );
    } finally {
      setDeliveryCalculating(false);
    }
  };

  // ==========================================
  // RE-CALCULATE BUTTON
  // ==========================================

  const recalculateDelivery = async () => {
    if (
      customerLat === null ||
      customerLng === null
    ) {
      await getCustomerLocation();

      return;
    }

    await calculateDelivery(
      customerLat,
      customerLng
    );
  };

  // ==========================================
  // COD ORDER
  // ==========================================

  const placeCODOrder = async (
    token: string,
    orderData: any
  ) => {
    try {
      console.log(
        "CREATING COD ORDER:",
        orderData
      );

      const response =
        await API.post(
          "/orders",
          orderData,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      console.log(
        "COD ORDER RESPONSE:",
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
              router.replace(
                "/my-orders"
              );
            },
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "COD ORDER ERROR:",
        error
      );

      console.log(
        "COD ERROR RESPONSE:",
        error?.response?.data
      );

      throw error;
    }
  };

  // ==========================================
  // ONLINE PAYMENT
  // ==========================================

  const startOnlinePayment = async (
    token: string,
    orderData: any
  ) => {
    try {
      // --------------------------------
      // 1. CREATE DATABASE ORDER
      // --------------------------------

      console.log(
        "CREATING ONLINE ORDER:",
        orderData
      );

      const orderResponse =
        await API.post(
          "/orders",
          orderData,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      console.log(
        "ONLINE ORDER RESPONSE:",
        orderResponse.data
      );

      const order =
        orderResponse.data?.order ||
        orderResponse.data?.data ||
        orderResponse.data;

      if (!order?._id) {
        throw new Error(
          "Order was created but Order ID was not received."
        );
      }

      const orderId =
        order._id;

      // --------------------------------
      // 2. CREATE RAZORPAY ORDER
      // --------------------------------

      console.log(
        "CREATING RAZORPAY ORDER FOR:",
        orderId
      );

      const paymentOrderResponse =
        await API.post(
          "/payments/create-order",
          {
            orderId,
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      console.log(
        "RAZORPAY ORDER RESPONSE:",
        paymentOrderResponse.data
      );

      const paymentData =
        paymentOrderResponse.data;

      if (
        !paymentData?.success ||
        !paymentData?.razorpayOrderId
      ) {
        throw new Error(
          paymentData?.message ||
            "Unable to create Razorpay order."
        );
      }

      // --------------------------------
      // 3. OPEN RAZORPAY CHECKOUT
      // --------------------------------

      const razorpayOptions = {
        description:
          `Street Food Order #${
            order.orderNumber || ""
          }`,

        image:
          "https://streetfoodplatform-1.onrender.com/favicon.ico",

        currency:
          paymentData.currency ||
          "INR",

        key:
          paymentData.key,

        amount:
          paymentData.amount,

        name:
          "Street Food Platform",

        order_id:
          paymentData.razorpayOrderId,

        prefill: {
          name:
            name.trim(),

          contact:
            phone.trim(),
        },

        notes: {
          orderId:
            orderId.toString(),

          orderNumber:
            order.orderNumber ||
            "",
        },

        theme: {
          color:
            "#E65100",
        },
      };

      console.log(
        "OPENING RAZORPAY..."
      );

      console.log(
        "🚀 RAZORPAY OPEN START"
      );

      console.log(
        "💰 RAZORPAY OPTIONS:",
        {
          amount:
            razorpayOptions.amount,

          currency:
            razorpayOptions.currency,

          order_id:
            razorpayOptions.order_id,

          key:
            razorpayOptions.key,
        }
      );

      const razorpayResult =
        await RazorpayCheckout.open(
          razorpayOptions
        );

      console.log(
        "RAZORPAY SUCCESS:",
        razorpayResult
      );

      // --------------------------------
      // 4. VERIFY PAYMENT
      // --------------------------------

      console.log(
        "VERIFYING PAYMENT..."
      );

      const verifyResponse =
        await API.post(
          "/payments/verify",
          {
            orderId,

            razorpay_order_id:
              razorpayResult
                .razorpay_order_id,

            razorpay_payment_id:
              razorpayResult
                .razorpay_payment_id,

            razorpay_signature:
              razorpayResult
                .razorpay_signature,
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      console.log(
        "PAYMENT VERIFY RESPONSE:",
        verifyResponse.data
      );

      if (
        !verifyResponse.data?.success
      ) {
        throw new Error(
          verifyResponse.data?.message ||
            "Payment verification failed."
        );
      }

      // --------------------------------
      // 5. PAYMENT SUCCESS
      // --------------------------------

      clearCart();

      Alert.alert(
        "Payment Successful 🎉",
        `Your payment was successful and your order ${
          order?.orderNumber
            ? `#${order.orderNumber}`
            : ""
        } has been confirmed.`,
        [
          {
            text: "View Order",
            onPress: () => {
              router.replace(
                "/my-orders"
              );
            },
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "ONLINE PAYMENT ERROR:",
        error
      );

      console.log(
        "PAYMENT ERROR RESPONSE:",
        error?.response?.data
      );

      // Razorpay cancelled
      if (
        error?.code === 2 ||
        error?.description
          ?.toLowerCase()
          ?.includes("cancel")
      ) {
        Alert.alert(
          "Payment Cancelled",
          "Your payment was cancelled. You can try again."
        );

        return;
      }

      throw error;
    }
  };

  // ==========================================
  // MAIN PLACE ORDER
  // ==========================================

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

    // --------------------------------------
    // LOCATION REQUIRED
    // --------------------------------------

    if (
      customerLat === null ||
      customerLng === null
    ) {
      Alert.alert(
        "Delivery Location Required",
        "Please use your current location so we can calculate the delivery charge.",
        [
          {
            text: "Use Location",
            onPress:
              getCustomerLocation,
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );

      return;
    }

    // --------------------------------------
    // DELIVERY CALCULATION REQUIRED
    // --------------------------------------

    if (
      deliveryCalculating
    ) {
      Alert.alert(
        "Please Wait",
        "Delivery charge is being calculated."
      );

      return;
    }

    if (
      deliveryAvailable !== true ||
      deliveryCharge === null
    ) {
      Alert.alert(
        "Delivery Unavailable",
        deliveryMessage ||
          "Delivery is not available for this location."
      );

      return;
    }

    try {
      setPlacingOrder(true);

      const token =
        await AsyncStorage.getItem(
          "customerToken"
        );

      if (!token) {
        Alert.alert(
          "Login Required",
          "Please login first.",
          [
            {
              text: "Login",
              onPress: () =>
                router.replace(
                  "/login"
                ),
            },
          ]
        );

        return;
      }

      // --------------------------------------
      // ORDER DATA
      // --------------------------------------

      const orderData = {
        customer: {
          name:
            name.trim(),

          phone:
            phone.trim(),

          address:
            address.trim(),

          landmark:
            landmark.trim(),
        },

        items:
          items.map((item) => ({
            foodId:
              item.foodId,

            name:
              item.name,

            quantity:
              item.quantity,

            unitPrice:
              item.price,

            customizations:
              [],

            addOns:
              [],
          })),

        subtotal:

          subtotal,

        deliveryCharge:

          deliveryCharge,

        deliveryDistanceKm:

          deliveryDistanceKm,

        deliveryLocation: {
          latitude:
            customerLat,

          longitude:
            customerLng,
        },

        grandTotal:

          grandTotal,

        paymentMethod,
      };

      console.log(
        "📦 FINAL ORDER DATA:",
        orderData
      );

      // ====================================
      // COD
      // ====================================

      if (
        paymentMethod ===
        "COD"
      ) {
        await placeCODOrder(
          token,
          orderData
        );

        return;
      }

      // ====================================
      // ONLINE
      // ====================================

      await startOnlinePayment(
        token,
        orderData
      );

    } catch (error: any) {
      console.log(
        "PLACE ORDER ERROR:",
        error
      );

      console.log(
        "PLACE ORDER RESPONSE:",
        error?.response?.data
      );

      if (
        error?.response?.status ===
        401
      ) {
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
                router.replace(
                  "/login"
                ),
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

  // ==========================================
  // EMPTY CART
  // ==========================================

  if (items.length === 0) {
    return (
      <View
        style={
          styles.emptyContainer
        }
      >
        <Text
          style={
            styles.emptyIcon
          }
        >
          🛒
        </Text>

        <Text
          style={
            styles.emptyTitle
          }
        >
          Your cart is empty
        </Text>

        <TouchableOpacity
          style={
            styles.backButton
          }
          onPress={() =>
            router.replace("/")
          }
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            Go to Home
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ==========================================
  // LOGIN CHECK
  // ==========================================

  if (checkingLogin) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#E65100"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Checking login...
        </Text>
      </View>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <KeyboardAvoidingView
      style={
        styles.container
      }
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      {/* HEADER */}

      <View
        style={
          styles.header
        }
      >
        <TouchableOpacity
          style={
            styles.headerBack
          }
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.headerBackText
            }
          >
            ←
          </Text>
        </TouchableOpacity>

        <Text
          style={
            styles.headerTitle
          }
        >
          Checkout
        </Text>

        <View
          style={{
            width: 42,
          }}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* CUSTOMER DETAILS */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Delivery Details
        </Text>

        <View
          style={
            styles.card
          }
        >
          <Text
            style={
              styles.label
            }
          >
            Full Name
          </Text>

          <TextInput
            value={name}
            onChangeText={
              setName
            }
            placeholder="Enter your name"
            placeholderTextColor="#999"
            style={
              styles.input
            }
          />

          <Text
            style={
              styles.label
            }
          >
            Mobile Number
          </Text>

          <TextInput
            value={phone}
            onChangeText={
              setPhone
            }
            placeholder="10 digit mobile number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            maxLength={10}
            style={
              styles.input
            }
          />

          <Text
            style={
              styles.label
            }
          >
            Delivery Address
          </Text>

          <TextInput
            value={address}
            onChangeText={
              setAddress
            }
            placeholder="House no, street, area..."
            placeholderTextColor="#999"
            multiline
            style={[
              styles.input,
              styles.addressInput,
            ]}
          />

          <Text
            style={
              styles.label
            }
          >
            Landmark
          </Text>

          <TextInput
            value={
              landmark
            }
            onChangeText={
              setLandmark
            }
            placeholder="Nearby landmark (optional)"
            placeholderTextColor="#999"
            style={
              styles.input
            }
          />

          {/* LOCATION BUTTON */}

          <TouchableOpacity
            style={[
              styles.locationButton,

              locationReady &&
                styles.locationButtonReady,
            ]}
            onPress={
              getCustomerLocation
            }
            disabled={
              locationLoading ||
              deliveryCalculating
            }
          >
            {locationLoading ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={
                  styles.locationButtonText
                }
              >
                {locationReady
                  ? "📍 Location Updated"
                  : "📍 Use Current Location"}
              </Text>
            )}
          </TouchableOpacity>

          {/* LOCATION STATUS */}

          {locationReady && (
            <View
              style={
                styles.locationStatus
              }
            >
              <Text
                style={
                  styles.locationStatusTitle
                }
              >
                📍 Delivery location selected
              </Text>

              <Text
                style={
                  styles.locationStatusText
                }
              >
                Your current GPS location will
                be used to calculate the actual
                road distance.
              </Text>
            </View>
          )}

          {/* DELIVERY CALCULATION */}

          {deliveryCalculating && (
            <View
              style={
                styles.calculatingBox
              }
            >
              <ActivityIndicator
                size="small"
                color="#E65100"
              />

              <Text
                style={
                  styles.calculatingText
                }
              >
                Calculating delivery distance...
              </Text>
            </View>
          )}

          {!deliveryCalculating &&
            deliveryDistanceKm !== null &&
            deliveryCharge !== null &&
            deliveryAvailable ===
              true && (
              <View
                style={
                  styles.deliveryInfo
                }
              >
                <View
                  style={
                    styles.deliveryInfoRow
                  }
                >
                  <Text
                    style={
                      styles.deliveryInfoLabel
                    }
                  >
                    🛣️ Road Distance
                  </Text>

                  <Text
                    style={
                      styles.deliveryInfoValue
                    }
                  >
                    {deliveryDistanceKm} km
                  </Text>
                </View>

                <View
                  style={
                    styles.deliveryInfoRow
                  }
                >
                  <Text
                    style={
                      styles.deliveryInfoLabel
                    }
                  >
                    🚚 Delivery Charge
                  </Text>

                  <Text
                    style={
                      styles.deliveryChargeValue
                    }
                  >
                    ₹{deliveryCharge}
                  </Text>
                </View>

                <TouchableOpacity
                  style={
                    styles.recalculateButton
                  }
                  onPress={
                    recalculateDelivery
                  }
                >
                  <Text
                    style={
                      styles.recalculateText
                    }
                  >
                    🔄 Recalculate
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          {!deliveryCalculating &&
            deliveryAvailable ===
              false && (
              <View
                style={
                  styles.deliveryError
                }
              >
                <Text
                  style={
                    styles.deliveryErrorTitle
                  }
                >
                  🚫 Delivery unavailable
                </Text>

                <Text
                  style={
                    styles.deliveryErrorText
                  }
                >
                  {deliveryMessage ||
                    "Delivery is not available at this location."}
                </Text>
              </View>
            )}
        </View>

        {/* PAYMENT */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Payment Method
        </Text>

        <View
          style={
            styles.card
          }
        >
          {/* COD */}

          <TouchableOpacity
            style={[
              styles.paymentOption,

              paymentMethod ===
                "COD" &&
                styles.paymentSelected,
            ]}
            onPress={() =>
              setPaymentMethod(
                "COD"
              )
            }
          >
            <View
              style={
                styles.radio
              }
            >
              {paymentMethod ===
                "COD" && (
                <View
                  style={
                    styles.radioInner
                  }
                />
              )}
            </View>

            <View>
              <Text
                style={
                  styles.paymentTitle
                }
              >
                Cash on Delivery
              </Text>

              <Text
                style={
                  styles.paymentSubtitle
                }
              >
                Pay when your order arrives
              </Text>
            </View>
          </TouchableOpacity>

          {/* ONLINE */}

          <TouchableOpacity
            style={[
              styles.paymentOption,

              paymentMethod ===
                "ONLINE" &&
                styles.paymentSelected,
            ]}
            onPress={() =>
              setPaymentMethod(
                "ONLINE"
              )
            }
          >
            <View
              style={
                styles.radio
              }
            >
              {paymentMethod ===
                "ONLINE" && (
                <View
                  style={
                    styles.radioInner
                  }
                />
              )}
            </View>

            <View>
              <Text
                style={
                  styles.paymentTitle
                }
              >
                Online Payment
              </Text>

              <Text
                style={
                  styles.paymentSubtitle
                }
              >
                Pay securely online
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ORDER SUMMARY */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Order Summary
        </Text>

        <View
          style={
            styles.card
          }
        >
          {items.map(
            (item) => (
              <View
                key={
                  item.foodId
                }
                style={
                  styles.summaryRow
                }
              >
                <Text
                  style={
                    styles.itemName
                  }
                  numberOfLines={
                    1
                  }
                >
                  {item.name} ×{" "}
                  {item.quantity}
                </Text>

                <Text
                  style={
                    styles.itemPrice
                  }
                >
                  ₹
                  {item.price *
                    item.quantity}
                </Text>
              </View>
            )
          )}

          <View
            style={
              styles.divider
            }
          />

          {/* ITEM TOTAL */}

          <View
            style={
              styles.summaryRow
            }
          >
            <Text
              style={
                styles.grayText
              }
            >
              Item Total
            </Text>

            <Text
              style={
                styles.amount
              }
            >
              ₹{subtotal}
            </Text>
          </View>

          {/* DELIVERY */}

          <View
            style={
              styles.summaryRow
            }
          >
            <Text
              style={
                styles.grayText
              }
            >
              Delivery
            </Text>

            <Text
              style={
                styles.amount
              }
            >
              {deliveryCharge ===
              null
                ? "—"
                : `₹${deliveryCharge}`}
            </Text>
          </View>

          {/* DISTANCE */}

          {deliveryDistanceKm !==
            null && (
            <View
              style={
                styles.summaryRow
              }
            >
              <Text
                style={
                  styles.grayText
                }
              >
                Road Distance
              </Text>

              <Text
                style={
                  styles.amount
                }
              >
                {deliveryDistanceKm} km
              </Text>
            </View>
          )}

          <View
            style={
              styles.divider
            }
          />

          {/* GRAND TOTAL */}

          <View
            style={
              styles.summaryRow
            }
          >
            <Text
              style={
                styles.totalText
              }
            >
              Grand Total
            </Text>

            <Text
              style={
                styles.totalAmount
              }
            >
              ₹{grandTotal}
            </Text>
          </View>
        </View>

        {/* PLACE ORDER */}

        <TouchableOpacity
          style={[
            styles.placeOrderButton,

            (placingOrder ||
              deliveryCalculating ||
              deliveryAvailable !==
                true) &&
              styles.disabledButton,
          ]}
          onPress={
            placeOrder
          }
          disabled={
            placingOrder ||
            deliveryCalculating ||
            deliveryAvailable !==
              true
          }
        >
          {placingOrder ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text
              style={
                styles.placeOrderText
              }
            >
              {paymentMethod ===
              "COD"
                ? `Place Order • ₹${grandTotal}`
                : `Pay Now • ₹${grandTotal}`}
            </Text>
          )}
        </TouchableOpacity>

        {/* LOCATION NOTE */}

        <Text
          style={
            styles.bottomNote
          }
        >
          📍 Delivery charge is calculated
          using Google Maps road distance.
        </Text>

        <View
          style={{
            height: 30,
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


// ======================================================
// STYLES
// ======================================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#F8F9FA",
    },

    loadingContainer: {
      flex: 1,
      backgroundColor:
        "#F8F9FA",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    loadingText: {
      marginTop: 12,
      color: "#777",
      fontSize: 14,
    },

    header: {
      height: 65,
      backgroundColor:
        "#FFFFFF",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal:
        16,
      borderBottomWidth:
        1,
      borderBottomColor:
        "#EEEEEE",
    },

    headerBack: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        "#F2F2F2",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    headerBackText: {
      fontSize: 27,
      color: "#222",
    },

    headerTitle: {
      fontSize: 21,
      fontWeight:
        "800",
      color: "#222",
    },

    content: {
      padding: 16,
      paddingBottom: 40,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight:
        "800",
      color: "#222",
      marginBottom:
        12,
      marginTop: 8,
    },

    card: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 18,
      padding: 16,
      marginBottom:
        16,
    },

    label: {
      fontSize: 13,
      fontWeight:
        "700",
      color: "#444",
      marginBottom:
        7,
      marginTop: 8,
    },

    input: {
      height: 50,
      borderWidth: 1,
      borderColor:
        "#E2E2E2",
      borderRadius: 12,
      paddingHorizontal:
        14,
      fontSize: 14,
      color: "#222",
      backgroundColor:
        "#FAFAFA",
    },

    addressInput: {
      height: 85,
      paddingTop: 14,
      textAlignVertical:
        "top",
    },

    // ==========================================
    // LOCATION
    // ==========================================

    locationButton: {
      height: 52,
      backgroundColor:
        "#E65100",
      borderRadius: 14,
      justifyContent:
        "center",
      alignItems:
        "center",
      marginTop: 18,
    },

    locationButtonReady: {
      backgroundColor:
        "#2E7D32",
    },

    locationButtonText: {
      color:
        "#FFFFFF",
      fontSize: 15,
      fontWeight:
        "800",
    },

    locationStatus: {
      backgroundColor:
        "#F1F8E9",
      borderRadius: 12,
      padding: 12,
      marginTop: 12,
    },

    locationStatusTitle: {
      color:
        "#33691E",
      fontSize: 14,
      fontWeight:
        "800",
    },

    locationStatusText: {
      color:
        "#558B2F",
      fontSize: 12,
      marginTop: 4,
      lineHeight: 18,
    },

    calculatingBox: {
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#FFF3E0",
      borderRadius: 12,
      padding: 12,
      marginTop: 12,
    },

    calculatingText: {
      color:
        "#E65100",
      fontSize: 13,
      fontWeight:
        "700",
      marginLeft: 10,
    },

    deliveryInfo: {
      backgroundColor:
        "#FFF8F2",
      borderWidth: 1,
      borderColor:
        "#FFE0CC",
      borderRadius: 14,
      padding: 14,
      marginTop: 12,
    },

    deliveryInfoRow: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginBottom: 10,
    },

    deliveryInfoLabel: {
      color:
        "#555",
      fontSize: 13,
      fontWeight:
        "600",
    },

    deliveryInfoValue: {
      color:
        "#222",
      fontSize: 14,
      fontWeight:
        "800",
    },

    deliveryChargeValue: {
      color:
        "#E65100",
      fontSize: 16,
      fontWeight:
        "900",
    },

    recalculateButton: {
      borderWidth: 1,
      borderColor:
        "#E65100",
      borderRadius: 10,
      paddingVertical: 9,
      alignItems:
        "center",
      marginTop: 3,
    },

    recalculateText: {
      color:
        "#E65100",
      fontSize: 13,
      fontWeight:
        "800",
    },

    deliveryError: {
      backgroundColor:
        "#FFEBEE",
      borderWidth: 1,
      borderColor:
        "#FFCDD2",
      borderRadius: 14,
      padding: 14,
      marginTop: 12,
    },

    deliveryErrorTitle: {
      color:
        "#C62828",
      fontSize: 14,
      fontWeight:
        "900",
    },

    deliveryErrorText: {
      color:
        "#B71C1C",
      fontSize: 12,
      marginTop: 5,
      lineHeight: 18,
    },

    // ==========================================
    // PAYMENT
    // ==========================================

    paymentOption: {
      flexDirection:
        "row",
      alignItems:
        "center",
      borderWidth: 1,
      borderColor:
        "#E5E5E5",
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
    },

    paymentSelected: {
      borderColor:
        "#E65100",
      backgroundColor:
        "#FFF7EF",
    },

    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor:
        "#E65100",
      justifyContent:
        "center",
      alignItems:
        "center",
      marginRight: 12,
    },

    radioInner: {
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor:
        "#E65100",
    },

    paymentTitle: {
      fontSize: 15,
      fontWeight:
        "800",
      color: "#222",
    },

    paymentSubtitle: {
      fontSize: 12,
      color: "#777",
      marginTop: 3,
    },

    // ==========================================
    // ORDER SUMMARY
    // ==========================================

    summaryRow: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
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
      fontWeight:
        "700",
      color: "#222",
    },

    grayText: {
      fontSize: 14,
      color: "#777",
    },

    amount: {
      fontSize: 14,
      fontWeight:
        "700",
      color: "#222",
    },

    divider: {
      height: 1,
      backgroundColor:
        "#EEEEEE",
      marginVertical: 5,
    },

    totalText: {
      fontSize: 17,
      fontWeight:
        "900",
      color: "#222",
    },

    totalAmount: {
      fontSize: 20,
      fontWeight:
        "900",
      color: "#E65100",
    },

    // ==========================================
    // PLACE ORDER
    // ==========================================

    placeOrderButton: {
      height: 56,
      backgroundColor:
        "#E65100",
      borderRadius: 16,
      justifyContent:
        "center",
      alignItems:
        "center",
      marginTop: 4,
    },

    disabledButton: {
      opacity: 0.5,
    },

    placeOrderText: {
      color:
        "#FFFFFF",
      fontSize: 16,
      fontWeight:
        "900",
    },

    bottomNote: {
      textAlign:
        "center",
      color:
        "#888",
      fontSize: 11,
      marginTop: 12,
      lineHeight: 17,
    },

    // ==========================================
    // EMPTY CART
    // ==========================================

    emptyContainer: {
      flex: 1,
      backgroundColor:
        "#F8F9FA",
      justifyContent:
        "center",
      alignItems:
        "center",
      paddingHorizontal:
        30,
    },

    emptyIcon: {
      fontSize: 65,
      marginBottom: 18,
    },

    emptyTitle: {
      fontSize: 23,
      fontWeight:
        "900",
      color: "#222",
    },

    backButton: {
      backgroundColor:
        "#E65100",
      paddingHorizontal:
        25,
      paddingVertical:
        13,
      borderRadius: 14,
      marginTop: 20,
    },

    backButtonText: {
      color:
        "#FFFFFF",
      fontWeight:
        "800",
      fontSize: 15,
    },
  });
 