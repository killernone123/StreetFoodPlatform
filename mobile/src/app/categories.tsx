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
import { useRouter } from "expo-router";

import API from "@/services/api";

type Category = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  isActive?: boolean;
};

export default function CategoriesScreen() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `https://streetfoodplatform-1.onrender.com/api/categories?nocache=${Date.now()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        }
      );

      const data = await response.json();

      console.log("📦 ALL CATEGORY RESPONSE:", data);

      let categoryList: Category[] = [];

      if (Array.isArray(data)) {
        categoryList = data;
      } else if (Array.isArray(data.categories)) {
        categoryList = data.categories;
      } else if (Array.isArray(data.data)) {
        categoryList = data.data;
      }

      const activeCategories = categoryList.filter(
        (category) => category.isActive !== false
      );

      setCategories(activeCategories);
    } catch (err) {
      console.log("❌ CATEGORY ERROR:", err);
      setError("Categories load nahi ho paayi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCategory = (category: Category) => {
    console.log("👉 Selected category:", category.name);
    console.log("👉 Category ID:", category._id);

    router.push({
      pathname: "/category-items",
      params: {
        categoryId: category._id,
        categoryName: category.name,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>All Categories</Text>

        <View style={{ width: 42 }} />
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ff6b00" />
          <Text style={styles.loadingText}>
            Categories loading...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadCategories}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🍽️</Text>

          <Text style={styles.emptyTitle}>
            No Categories Found
          </Text>

          <Text style={styles.emptyText}>
            Abhi koi category available nahi hai.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.sectionTitle}>
            Explore Categories
          </Text>

          <Text style={styles.sectionSubtitle}>
            Apni favourite category choose karein
          </Text>

          <View style={styles.grid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category._id}
                style={styles.categoryCard}
                activeOpacity={0.8}
                onPress={() => openCategory(category)}
              >
                <View style={styles.imageContainer}>
                  {category.image ? (
                    <Image
                      source={{
                        uri: category.image,
                      }}
                      style={styles.categoryImage}
                    />
                  ) : (
                    <Text style={styles.categoryEmoji}>
                      🍽️
                    </Text>
                  )}
                </View>

                <Text
                  style={styles.categoryName}
                  numberOfLines={2}
                >
                  {category.name}
                </Text>

                <Text style={styles.viewText}>
                  View Items →
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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

  header: {
    height: 65,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
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

  headerTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#222",
  },

  content: {
    padding: 18,
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
    marginTop: 5,
    marginBottom: 20,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  categoryCard: {
    width: "47.5%",
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eeeeee",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },

  imageContainer: {
    width: "100%",
    height: 130,
    borderRadius: 14,
    backgroundColor: "#fff3e8",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  categoryImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  categoryEmoji: {
    fontSize: 55,
  },

  categoryName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222",
    marginTop: 11,
  },

  viewText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ff6b00",
    marginTop: 6,
  },

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

  errorText: {
    color: "#d32f2f",
    fontSize: 16,
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