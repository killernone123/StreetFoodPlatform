import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import API from "@/services/api";
import { useCartStore } from "../store/cartStore";

type Food = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  isVeg?: boolean;
  isAvailable?: boolean;
  isPopular?: boolean;
  preparationTime?: number;
  categoryId?: string | { _id: string; name?: string };
};

export default function CategoryItemsScreen() {
  const router = useRouter();

  // =========================
  // CART STORE
  // =========================
  const addToCart = useCartStore(
    (state) => state.addToCart
  );

  const params = useLocalSearchParams<{
    categoryId?: string;
    categoryName?: string;
  }>();

  const categoryId = params.categoryId;
  const categoryName = params.categoryName || "Items";

  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // LOAD CATEGORY FOODS
  // =========================
  const loadFoods = async () => {
    try {
      setLoading(true);
      setError("");

      if (!categoryId) {
        setFoods([]);
        setError("Category ID nahi mila.");
        return;
      }

      console.log(
        "🍽️ Loading category:",
        categoryName
      );

      console.log(
        "🆔 Category ID:",
        categoryId
      );

      const response = await API.get(
        `/foods?categoryId=${encodeURIComponent(
          categoryId
        )}&nocache=${Date.now()}`
      );

      console.log(
        "📦 CATEGORY FOOD RESPONSE:",
        response.data
      );

      let foodList: Food[] = [];

      if (Array.isArray(response.data)) {
        foodList = response.data;
      } else if (
        Array.isArray(response.data?.foods)
      ) {
        foodList = response.data.foods;
      } else if (
        Array.isArray(response.data?.data)
      ) {
        foodList = response.data.data;
      }

      const availableFoods = foodList.filter(
        (food) => food.isAvailable !== false
      );

      console.log(
        "✅ Available foods:",
        availableFoods.length
      );

      setFoods(availableFoods);
    } catch (err: any) {
      console.log(
        "❌ CATEGORY FOOD ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Items load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOAD ON CATEGORY CHANGE
  // =========================
  useEffect(() => {
    loadFoods();
  }, [categoryId]);

  // =========================
  // ADD TO CART
  // =========================
  const handleAddToCart = (food: Food) => {
    try {
      console.log(
        "🛒 ADD CLICKED"
      );

      console.log(
        "🆔 Food ID:",
        food._id
      );

      console.log(
        "🍔 Food:",
        food.name
      );

      addToCart({
        foodId: food._id,
        name: food.name,
        price: food.price,
        description: food.description,
        quantity: 1,
      });

      console.log(
        "✅ ADDED TO CART:",
        food.name
      );
    } catch (error) {
      console.log(
        "❌ ADD CART ERROR:",
        error
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* =========================
          HEADER
      ========================= */}
      <View style={styles.header}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text
            style={styles.headerTitle}
            numberOfLines={1}
          >
            {categoryName}
          </Text>

          <Text style={styles.itemCount}>
            {foods.length}{" "}
            {foods.length === 1
              ? "Item"
              : "Items"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cartButton}
          onPress={() =>
            router.push("/cart")
          }
        >
          <Text style={styles.cartIcon}>
            🛒
          </Text>
        </TouchableOpacity>

      </View>

      {/* =========================
          LOADING
      ========================= */}
      {loading ? (
        <View style={styles.center}>

          <ActivityIndicator
            size="large"
            color="#ff6b00"
          />

          <Text style={styles.loadingText}>
            {categoryName} items loading...
          </Text>

        </View>

      ) : error ? (

        /* =========================
            ERROR
        ========================= */
        <View style={styles.center}>

          <Text style={styles.errorIcon}>
            ⚠️
          </Text>

          <Text style={styles.errorText}>
            {error}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadFoods}
          >
            <Text style={styles.retryText}>
              Retry
            </Text>
          </TouchableOpacity>

        </View>

      ) : foods.length === 0 ? (

        /* =========================
            EMPTY
        ========================= */
        <View style={styles.center}>

          <Text style={styles.emptyIcon}>
            🍽️
          </Text>

          <Text style={styles.emptyTitle}>
            No Items Available
          </Text>

          <Text style={styles.emptyText}>
            Is category me abhi koi item
            available nahi hai.
          </Text>

        </View>

      ) : (

        /* =========================
            FOOD LIST
        ========================= */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.content
          }
        >

          <Text style={styles.sectionTitle}>
            {categoryName} Items
          </Text>

          <Text style={styles.sectionSubtitle}>
            Apna favourite item choose karein
          </Text>

          {foods.map((food) => (

            <View
              key={food._id}
              style={styles.foodCard}
            >

              {/* =========================
                  FOOD IMAGE
              ========================= */}
              <View
                style={
                  styles.foodImageContainer
                }
              >

                {food.image ? (

                  <Image
                    source={{
                      uri: food.image,
                    }}
                    style={styles.foodImage}
                  />

                ) : (

                  <Text
                    style={styles.foodEmoji}
                  >
                    🍔
                  </Text>

                )}

                {/* VEG / NON-VE */}
                {food.isVeg !== undefined && (

                  <View
                    style={[
                      styles.vegBadge,
                      {
                        borderColor:
                          food.isVeg
                            ? "#16a34a"
                            : "#dc2626",
                      },
                    ]}
                  >

                    <View
                      style={[
                        styles.vegDot,
                        {
                          backgroundColor:
                            food.isVeg
                              ? "#16a34a"
                              : "#dc2626",
                        },
                      ]}
                    />

                  </View>

                )}

              </View>

              {/* =========================
                  FOOD DETAILS
              ========================= */}
              <View
                style={styles.foodDetails}
              >

                <View
                  style={styles.nameRow}
                >

                  <Text
                    style={styles.foodName}
                    numberOfLines={2}
                  >
                    {food.name}
                  </Text>

                  {food.isPopular && (

                    <View
                      style={
                        styles.popularBadge
                      }
                    >

                      <Text
                        style={
                          styles.popularText
                        }
                      >
                        Popular
                      </Text>

                    </View>

                  )}

                </View>

                {/* DESCRIPTION */}
                {food.description ? (

                  <Text
                    style={styles.description}
                    numberOfLines={2}
                  >
                    {food.description}
                  </Text>

                ) : null}

                {/* PREPARATION TIME */}
                {food.preparationTime ? (

                  <Text
                    style={
                      styles.preparationTime
                    }
                  >
                    ⏱{" "}
                    {food.preparationTime} min
                  </Text>

                ) : null}

                {/* =========================
                    PRICE + ADD
                ========================= */}
                <View
                  style={styles.bottomRow}
                >

                  <Text style={styles.price}>
                    ₹{food.price}
                  </Text>

                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() =>
                      handleAddToCart(food)
                    }
                    activeOpacity={0.8}
                  >

                    <Text
                      style={
                        styles.addButtonText
                      }
                    >
                      + Add
                    </Text>

                  </TouchableOpacity>

                </View>

              </View>

            </View>

          ))}

        </ScrollView>

      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  // =========================
  // HEADER
  // =========================

  header: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    backgroundColor: "#fff",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff3e8",
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    fontSize: 34,
    lineHeight: 36,
    color: "#ff6b00",
    marginTop: -3,
  },

  titleContainer: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222",
  },

  itemCount: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },

  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff3e8",
    alignItems: "center",
    justifyContent: "center",
  },

  cartIcon: {
    fontSize: 21,
  },

  // =========================
  // CONTENT
  // =========================

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#222",
  },

  sectionSubtitle: {
    fontSize: 14,
    color: "#777",
    marginTop: 4,
    marginBottom: 18,
  },

  // =========================
  // FOOD CARD
  // =========================

  foodCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#eeeeee",

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.07,
    shadowRadius: 5,

    elevation: 3,
  },

  foodImageContainer: {
    width: 125,
    height: 125,
    borderRadius: 14,
    backgroundColor: "#fff3e8",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  foodImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  foodEmoji: {
    fontSize: 50,
  },

  // =========================
  // VEG BADGE
  // =========================

  vegBadge: {
    position: "absolute",
    top: 7,
    left: 7,
    width: 19,
    height: 19,
    borderWidth: 1.5,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  vegDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  // =========================
  // FOOD DETAILS
  // =========================

  foodDetails: {
    flex: 1,
    marginLeft: 12,
    paddingVertical: 3,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  foodName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: "#222",
  },

  popularBadge: {
    backgroundColor: "#fff0d9",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 5,
  },

  popularText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#e87500",
  },

  description: {
    fontSize: 12,
    color: "#777",
    lineHeight: 17,
    marginTop: 5,
  },

  preparationTime: {
    fontSize: 11,
    color: "#888",
    marginTop: 5,
  },

  // =========================
  // PRICE + ADD
  // =========================

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 9,
  },

  price: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222",
  },

  addButton: {
    minWidth: 70,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: "#ff6b00",
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  // =========================
  // CENTER
  // =========================

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 10,
    color: "#777",
    fontSize: 14,
  },

  // =========================
  // ERROR
  // =========================

  errorIcon: {
    fontSize: 45,
    marginBottom: 10,
  },

  errorText: {
    color: "#d32f2f",
    fontSize: 15,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 15,
    backgroundColor: "#ff6b00",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
  },

  retryText: {
    color: "#fff",
    fontWeight: "700",
  },

  // =========================
  // EMPTY
  // =========================

  emptyIcon: {
    fontSize: 60,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222",
    marginTop: 12,
  },

  emptyText: {
    fontSize: 14,
    color: "#777",
    marginTop: 6,
    textAlign: "center",
  },

});