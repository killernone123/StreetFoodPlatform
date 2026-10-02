import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useCartStore } from "../store/cartStore";

export default function CartScreen() {
  const router = useRouter();

  const items = useCartStore((state) => state.items);

  const increaseQuantity = useCartStore(
    (state) => state.increaseQuantity
  );

  const decreaseQuantity = useCartStore(
    (state) => state.decreaseQuantity
  );

  const removeFromCart = useCartStore(
    (state) => state.removeFromCart
  );

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const deliveryCharge = subtotal > 0 ? 30 : 0;

  const grandTotal = subtotal + deliveryCharge;

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          My Cart
        </Text>

        <View style={styles.headerSpace} />
      </View>

      {/* EMPTY CART */}
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>

          <Text style={styles.emptyIcon}>
            🛒
          </Text>

          <Text style={styles.emptyTitle}>
            Your cart is empty
          </Text>

          <Text style={styles.emptyText}>
            Add some delicious food to your cart.
          </Text>

          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.shopButtonText}>
              Browse Food
            </Text>
          </TouchableOpacity>

        </View>
      ) : (

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >

          {/* ITEMS TITLE */}
          <Text style={styles.sectionTitle}>
            Your Items ({items.length})
          </Text>

          {/* CART ITEMS */}
          {items.map((item) => (

            <View
              key={item.foodId}
              style={styles.cartItem}
            >

              {/* FOOD ICON */}
              <View style={styles.foodIconBox}>
                <Text style={styles.foodIcon}>
                  🍽️
                </Text>
              </View>

              {/* FOOD INFORMATION */}
              <View style={styles.itemInfo}>

                <Text
                  style={styles.itemName}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>

                {item.description ? (
                  <Text
                    style={styles.description}
                    numberOfLines={1}
                  >
                    {item.description}
                  </Text>
                ) : null}

                <Text style={styles.itemPrice}>
                  ₹{item.price}
                </Text>

                {/* QUANTITY */}
                <View style={styles.quantityRow}>

                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() =>
                      decreaseQuantity(item.foodId)
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quantityText}>
                      −
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.quantity}>
                    {item.quantity}
                  </Text>

                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() =>
                      increaseQuantity(item.foodId)
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quantityText}>
                      +
                    </Text>
                  </TouchableOpacity>

                </View>

              </View>

              {/* RIGHT SIDE */}
              <View style={styles.rightSection}>

                <Text style={styles.itemTotal}>
                  ₹{item.price * item.quantity}
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    removeFromCart(item.foodId)
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeText}>
                    Remove
                  </Text>
                </TouchableOpacity>

              </View>

            </View>

          ))}

          {/* BILL DETAILS */}
          <View style={styles.billCard}>

            <Text style={styles.billTitle}>
              Bill Details
            </Text>

            <View style={styles.billRow}>

              <Text style={styles.billLabel}>
                Item Total
              </Text>

              <Text style={styles.billValue}>
                ₹{subtotal}
              </Text>

            </View>

            <View style={styles.billRow}>

              <Text style={styles.billLabel}>
                Delivery Charge
              </Text>

              <Text style={styles.billValue}>
                ₹{deliveryCharge}
              </Text>

            </View>

            <View style={styles.divider} />

            <View style={styles.billRow}>

              <Text style={styles.grandLabel}>
                Grand Total
              </Text>

              <Text style={styles.grandValue}>
                ₹{grandTotal}
              </Text>

            </View>

          </View>

          {/* CHECKOUT */}
          <TouchableOpacity
            style={styles.checkoutButton}
            activeOpacity={0.8}
            onPress={() => router.push("/checkout")}
          >
            <Text style={styles.checkoutText}>
              Proceed to Checkout →
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomSpace} />

        </ScrollView>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },

  header: {
    height: 65,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
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
    fontSize: 32,
    lineHeight: 35,
    color: "#222222",
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#222222",
  },

  headerSpace: {
    width: 42,
  },

  content: {
    padding: 16,
    paddingBottom: 35,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222222",
    marginBottom: 14,
  },

  cartItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },

  foodIconBox: {
    width: 65,
    height: 65,
    borderRadius: 14,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
  },

  foodIcon: {
    fontSize: 30,
  },

  itemInfo: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },

  itemName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222222",
  },

  description: {
    fontSize: 12,
    color: "#777777",
    marginTop: 3,
  },

  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E65100",
    marginTop: 5,
  },

  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
  },

  quantityText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#E65100",
  },

  quantity: {
    fontSize: 15,
    fontWeight: "800",
    marginHorizontal: 12,
    color: "#222222",
  },

  rightSection: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    minHeight: 65,
    marginLeft: 8,
  },

  itemTotal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222222",
  },

  removeText: {
    fontSize: 12,
    color: "#E53935",
    fontWeight: "700",
    marginTop: 12,
  },

  billCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginTop: 8,
  },

  billTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222222",
    marginBottom: 15,
  },

  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  billLabel: {
    fontSize: 14,
    color: "#666666",
  },

  billValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222222",
  },

  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 5,
  },

  grandLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222222",
  },

  grandValue: {
    fontSize: 19,
    fontWeight: "900",
    color: "#E65100",
  },

  checkoutButton: {
    backgroundColor: "#E65100",
    height: 55,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },

  checkoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    fontSize: 70,
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#222222",
  },

  emptyText: {
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
    marginTop: 8,
  },

  shopButton: {
    backgroundColor: "#E65100",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 22,
  },

  shopButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  bottomSpace: {
    height: 30,
  },
});