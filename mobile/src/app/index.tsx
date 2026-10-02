import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import API from "../services/api";
import { useCartStore } from "../store/cartStore";

type Category = {
  _id: string;
  name: string;
  image?: string;
};

type Food = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: string | Category;
};

export default function HomeScreen() {
  const router = useRouter();

  const addToCart = useCartStore((state) => state.addToCart);
  const cartItems = useCartStore((state) => state.items);

  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      setError("");

      const [categoriesResponse, foodsResponse] = await Promise.all([
        API.get("/categories"),
        API.get("/foods"),
      ]);

      console.log("CATEGORIES:", categoriesResponse.data);
      console.log("FOODS:", foodsResponse.data);

      const categoryData =
        categoriesResponse.data?.categories ||
        categoriesResponse.data ||
        [];

      const foodData =
        foodsResponse.data?.foods ||
        foodsResponse.data ||
        [];

      setCategories(categoryData);
      setFoods(foodData);
    } catch (err: any) {
      console.log("HOME API ERROR:", err);
      console.log("ERROR RESPONSE:", err?.response?.data);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load food data"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.smallText}>Welcome 👋</Text>
            <Text style={styles.logo}>Street Food</Text>
          </View>

          {/* CART BUTTON */}
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push("/cart")}
            activeOpacity={0.7}
          >
            <Text style={styles.cartIcon}>🛒</Text>

            {cartItems.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartItems.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* LOCATION */}
        <View style={styles.locationBox}>
          <Text style={styles.locationIcon}>📍</Text>

          <View>
            <Text style={styles.locationLabel}>DELIVER TO</Text>
            <Text style={styles.locationText}>
              Your Location
            </Text>
          </View>
        </View>

        {/* BANNER */}
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerSmall}>
              HOT & FRESH 🔥
            </Text>

            <Text style={styles.bannerTitle}>
              Taste the Street,
              {"\n"}
              Love the Food!
            </Text>

            <Text style={styles.bannerSubtitle}>
              Fresh food delivered to your door.
            </Text>

            <TouchableOpacity
              style={styles.orderButton}
              onPress={() => {
                if (foods.length > 0) {
                  // ScrollView already shows food below.
                  // This button is intentionally kept simple for now.
                }
              }}
            >
              <Text style={styles.orderButtonText}>
                Order Now →
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.bannerEmoji}>🍔</Text>
        </View>

        {/* LOADING */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator
              size="large"
              color="#E53935"
            />

            <Text style={styles.loadingText}>
              Loading delicious food...
            </Text>
          </View>
        )}

        {/* ERROR */}
        {!loading && error !== "" && (
          <View style={styles.errorBox}>
            <Text style={styles.errorEmoji}>⚠️</Text>

            <Text style={styles.errorText}>
              {error}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadHomeData}
            >
              <Text style={styles.retryText}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* DATA */}
        {!loading && error === "" && (
          <>
            {/* CATEGORIES */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Categories
              </Text>

              <Text style={styles.seeAll}>
                See All
              </Text>
            </View>

            {categories.length === 0 ? (
              <Text style={styles.emptyText}>
                No categories available
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category._id}
                    style={styles.categoryCard}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.categoryEmoji}>
                      🍽️
                    </Text>

                    <Text style={styles.categoryName}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* FOOD */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Popular Near You 🔥
              </Text>

              <Text style={styles.seeAll}>
                See All
              </Text>
            </View>

            {foods.length === 0 ? (
              <Text style={styles.emptyText}>
                No food items available
              </Text>
            ) : (
              foods.map((food) => (
                <View
                  key={food._id}
                  style={styles.foodCard}
                >
                  <View style={styles.foodImage}>
                    <Text style={styles.foodEmoji}>
                      🍔
                    </Text>
                  </View>

                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>
                      {food.name}
                    </Text>

                    <Text
                      style={styles.foodDescription}
                      numberOfLines={2}
                    >
                      {food.description ||
                        "Fresh and delicious street food"}
                    </Text>

                    <View style={styles.foodBottom}>
                      <Text style={styles.price}>
                        ₹{food.price}
                      </Text>

                      {/* ADD TO CART */}
                      <TouchableOpacity
                        style={styles.addButton}
                        activeOpacity={0.8}
                        onPress={() =>
                          addToCart({
                            foodId: food._id,
                            name: food.name,
                            price: food.price,
                            description: food.description,
                            quantity: 1,
                          })
                        }
                      >
                        <Text style={styles.addButtonText}>
                          + Add
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },

  container: {
    padding: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  smallText: {
    fontSize: 14,
    color: "#777",
    marginBottom: 4,
  },

  logo: {
    fontSize: 26,
    fontWeight: "800",
    color: "#E53935",
  },

  cartButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    position: "relative",
  },

  cartIcon: {
    fontSize: 23,
  },

  cartBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },

  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 15,
    marginBottom: 20,
  },

  locationIcon: {
    fontSize: 25,
    marginRight: 12,
  },

  locationLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#999",
  },

  locationText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginTop: 2,
  },

  banner: {
    backgroundColor: "#E53935",
    borderRadius: 24,
    padding: 22,
    minHeight: 190,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 28,
  },

  bannerContent: {
    flex: 1,
    zIndex: 2,
  },

  bannerSmall: {
    color: "#FFE082",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
  },

  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 31,
  },

  bannerSubtitle: {
    color: "#FFEAEA",
    fontSize: 12,
    marginTop: 8,
  },

  orderButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 15,
  },

  orderButtonText: {
    color: "#E53935",
    fontWeight: "800",
    fontSize: 13,
  },

  bannerEmoji: {
    position: "absolute",
    right: -10,
    bottom: -8,
    fontSize: 105,
  },

  loadingBox: {
    alignItems: "center",
    paddingVertical: 30,
  },

  loadingText: {
    marginTop: 10,
    color: "#777",
    fontSize: 14,
  },

  errorBox: {
    backgroundColor: "#FFF0F0",
    padding: 20,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 25,
  },

  errorEmoji: {
    fontSize: 35,
    marginBottom: 8,
  },

  errorText: {
    color: "#D32F2F",
    textAlign: "center",
    fontSize: 14,
  },

  retryButton: {
    backgroundColor: "#E53935",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
  },

  retryText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222",
  },

  seeAll: {
    color: "#E53935",
    fontWeight: "700",
    fontSize: 13,
  },

  categoryList: {
    gap: 12,
    paddingBottom: 28,
  },

  categoryCard: {
    width: 95,
    height: 105,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  categoryEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },

  categoryName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
  },

  foodCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    flexDirection: "row",
    marginBottom: 14,
    elevation: 3,
  },

  foodImage: {
    width: 105,
    height: 105,
    backgroundColor: "#FFF0E0",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  foodEmoji: {
    fontSize: 55,
  },

  foodInfo: {
    flex: 1,
    paddingLeft: 14,
    justifyContent: "space-between",
  },

  foodName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222",
  },

  foodDescription: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },

  foodBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  price: {
    fontSize: 18,
    fontWeight: "900",
    color: "#E53935",
  },

  addButton: {
    backgroundColor: "#E53935",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 15,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  emptyText: {
    color: "#888",
    marginBottom: 25,
    textAlign: "center",
  },

  bottomSpace: {
    height: 30,
  },
});