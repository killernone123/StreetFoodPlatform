import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { uploadImage } from "../imageUpload";

const API_URL =
  "https://streetfoodplatform-1.onrender.com/api";

/* =========================================================
   TYPES
========================================================= */

type Category = {
  _id: string;
  name: string;
  isActive?: boolean;
};

type Food = {
  _id: string;
  name: string;
  categoryId:
    | string
    | {
        _id: string;
        name?: string;
      };
  description?: string;
  price: number;
  image?: string;
  isVeg: boolean;
  isAvailable: boolean;
  isPopular: boolean;
  preparationTime?: number;
  customizations?: any[];
  addOns?: any[];
  createdAt?: string;
  updatedAt?: string;
};

/* =========================================================
   SCREEN
========================================================= */

export default function ItemsScreen() {
  const router = useRouter();

  const [foods, setFoods] =
    useState<Food[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [editingFood, setEditingFood] =
    useState<Food | null>(null);

  /* =======================================================
     FORM
  ======================================================= */

  const [name, setName] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [image, setImage] =
    useState("");

  const [preparationTime, setPreparationTime] =
    useState("10");

  const [isVeg, setIsVeg] =
    useState(true);

  const [isAvailable, setIsAvailable] =
    useState(true);

  const [isPopular, setIsPopular] =
    useState(false);

  /* =======================================================
     SEARCH / FILTER
  ======================================================= */

  const [search, setSearch] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("all");

  /* =========================================================
     TOKEN
  ========================================================= */

  const getToken = async () => {
    return await AsyncStorage.getItem(
      "adminToken"
    );
  };

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const token =
        await getToken();

      if (!token) {
        Alert.alert(
          "Login Required",
          "Admin login expire ho gaya hai."
        );
        return;
      }

      const [foodsResponse, categoriesResponse] =
        await Promise.all([
          fetch(
            `${API_URL}/foods?nocache=${Date.now()}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          ),

          fetch(
            `${API_URL}/categories?nocache=${Date.now()}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          ),
        ]);

      const foodsData =
        await foodsResponse.json();

      const categoriesData =
        await categoriesResponse.json();

      console.log(
        "🍔 FOODS RESPONSE:",
        foodsData
      );

      console.log(
        "📂 CATEGORIES RESPONSE:",
        categoriesData
      );

      if (
        !foodsResponse.ok ||
        !foodsData.success
      ) {
        throw new Error(
          foodsData?.message ||
            "Foods load nahi hue."
        );
      }

      if (
        !categoriesResponse.ok ||
        !categoriesData.success
      ) {
        throw new Error(
          categoriesData?.message ||
            "Categories load nahi hui."
        );
      }

      setFoods(
        foodsData.foods || []
      );

      setCategories(
        categoriesData.categories || []
      );
    } catch (error: any) {
      console.log(
        "❌ LOAD ITEMS ERROR:",
        error
      );

      Alert.alert(
        "Error",
        error?.message ||
          "Items load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     CATEGORY NAME
  ========================================================= */

  const getCategoryName = (
    food: Food
  ) => {
    if (
      typeof food.categoryId ===
      "object"
    ) {
      return (
        food.categoryId?.name ||
        "Unknown Category"
      );
    }

    const category =
      categories.find(
        (item) =>
          item._id ===
          food.categoryId
      );

    return (
      category?.name ||
      "Unknown Category"
    );
  };

  /* =========================================================
     FILTERED FOODS
  ========================================================= */

  const filteredFoods =
    useMemo(() => {
      const cleanSearch =
        search
          .trim()
          .toLowerCase();

      return foods.filter(
        (food) => {
          const matchesSearch =
            !cleanSearch ||
            food.name
              .toLowerCase()
              .includes(cleanSearch);

          const foodCategoryId =
            typeof food.categoryId ===
            "object"
              ? food.categoryId?._id
              : food.categoryId;

          const matchesCategory =
            selectedCategory ===
              "all" ||
            foodCategoryId ===
              selectedCategory;

          return (
            matchesSearch &&
            matchesCategory
          );
        }
      );
    }, [
      foods,
      search,
      selectedCategory,
    ]);

  /* =========================================================
     RESET FORM
  ========================================================= */

  const resetForm = () => {
    setName("");
    setCategoryId("");
    setDescription("");
    setPrice("");
    setImage("");
    setPreparationTime("10");
    setIsVeg(true);
    setIsAvailable(true);
    setIsPopular(false);
    setEditingFood(null);
  };

  /* =========================================================
     ADD MODAL
  ========================================================= */

  const openAddModal = () => {
    resetForm();

    if (
      categories.length > 0
    ) {
      const firstActive =
        categories.find(
          (category) =>
            category.isActive !==
            false
        );

      setCategoryId(
        firstActive?._id ||
          categories[0]._id
      );
    }

    setModalVisible(true);
  };

  /* =========================================================
     EDIT MODAL
  ========================================================= */

  const openEditModal = (
    food: Food
  ) => {
    setEditingFood(food);

    setName(
      food.name || ""
    );

    const foodCategoryId =
      typeof food.categoryId ===
      "object"
        ? food.categoryId?._id
        : food.categoryId;

    setCategoryId(
      foodCategoryId || ""
    );

    setDescription(
      food.description || ""
    );

    setPrice(
      String(
        food.price ?? ""
      )
    );

    setImage(
      food.image || ""
    );

    setPreparationTime(
      String(
        food.preparationTime ??
          10
      )
    );

    setIsVeg(
      food.isVeg ?? true
    );

    setIsAvailable(
      food.isAvailable ??
        true
    );

    setIsPopular(
      food.isPopular ??
        false
    );

    setModalVisible(true);
  };

  /* =========================================================
     IMAGE PICKER
  ========================================================= */

  const pickFoodImage =
    async () => {
      try {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Permission Required",
            "Gallery se image select karne ke liye photo permission allow karo."
          );

          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes: ["images"],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.85,
            }
          );

        if (
          result.canceled
        ) {
          return;
        }

        const asset =
          result.assets?.[0];

        if (!asset?.uri) {
          Alert.alert(
            "Error",
            "Image select nahi hui."
          );

          return;
        }

        setSaving(true);

        const mimeType =
          asset.mimeType ||
          "image/jpeg";

        console.log(
          "🖼️ FOOD IMAGE:",
          asset.uri
        );

        const uploadedUrl =
          await uploadImage(
            asset.uri,
            mimeType
          );

        if (!uploadedUrl) {
          throw new Error(
            "Image upload nahi hui."
          );
        }

        console.log(
          "☁️ FOOD IMAGE UPLOADED:",
          uploadedUrl
        );

        setImage(
          uploadedUrl
        );

        Alert.alert(
          "Success",
          "Food image upload ho gayi."
        );
      } catch (error: any) {
        console.log(
          "❌ FOOD IMAGE ERROR:",
          error
        );

        Alert.alert(
          "Upload Failed",
          error?.message ||
            "Food image upload nahi ho paayi."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================================================
     SAVE FOOD
  ========================================================= */

  const saveFood =
    async () => {
      const cleanName =
        name.trim();

      const cleanDescription =
        description.trim();

      const numericPrice =
        Number(
          price
            .replace(/,/g, "")
            .trim()
        );

      const numericPreparationTime =
        Number(
          preparationTime
            .trim()
        );

      if (!cleanName) {
        Alert.alert(
          "Required",
          "Food item ka name daalo."
        );

        return;
      }

      if (!categoryId) {
        Alert.alert(
          "Category Required",
          "Food ki category select karo."
        );

        return;
      }

      const selectedCategoryExists =
        categories.some(
          (category) =>
            category._id ===
            categoryId
        );

      if (
        !selectedCategoryExists
      ) {
        Alert.alert(
          "Invalid Category",
          "Selected category valid nahi hai. Please category dobara select karo."
        );

        return;
      }

      if (
        !Number.isFinite(
          numericPrice
        ) ||
        numericPrice <= 0
      ) {
        Alert.alert(
          "Invalid Price",
          "Valid food price daalo."
        );

        return;
      }

      if (
        !Number.isFinite(
          numericPreparationTime
        ) ||
        numericPreparationTime <
          0
      ) {
        Alert.alert(
          "Invalid Time",
          "Preparation time valid daalo."
        );

        return;
      }

      try {
        setSaving(true);

        const token =
          await getToken();

        if (!token) {
          Alert.alert(
            "Login Required",
            "Admin login expire ho gaya hai. Please dobara login karo."
          );

          return;
        }

        /*
         * Existing customization/addOn arrays
         * preserve kiye ja rahe hain.
         */

        const foodData = {
          name:
            cleanName,

          categoryId,

          description:
            cleanDescription,

          price:
            numericPrice,

          image:
            image.trim(),

          isVeg,

          isAvailable,

          isPopular,

          preparationTime:
            numericPreparationTime,

          customizations:
            editingFood?.customizations ||
            [],

          addOns:
            editingFood?.addOns ||
            [],
        };

        console.log(
          "📤 FOOD DATA:",
          JSON.stringify(
            foodData,
            null,
            2
          )
        );

        const url =
          editingFood
            ? `${API_URL}/foods/${editingFood._id}`
            : `${API_URL}/foods`;

        const method =
          editingFood
            ? "PUT"
            : "POST";

        const response =
          await fetch(url, {
            method,

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify(
                foodData
              ),
          });

        const data =
          await response.json();

        console.log(
          "📥 FOOD SAVE RESPONSE:",
          JSON.stringify(
            data,
            null,
            2
          )
        );

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data?.message ||
              "Food save failed."
          );
        }

        /*
         * Backend verification
         */

        if (
          !data.food ||
          !data.food._id
        ) {
          throw new Error(
            "Backend ne food save response confirm nahi kiya."
          );
        }

        Alert.alert(
          "Success",
          editingFood
            ? "Food item update ho gaya."
            : "Food item add ho gaya."
        );

        setModalVisible(
          false
        );

        resetForm();

        await loadData();
      } catch (error: any) {
        console.log(
          "❌ SAVE FOOD ERROR:",
          error
        );

        Alert.alert(
          "Error",
          error?.message ||
            "Food item save nahi ho paaya."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================================================
     TOGGLE AVAILABILITY
  ========================================================= */

  const toggleAvailability =
    async (
      food: Food
    ) => {
      try {
        const token =
          await getToken();

        if (!token) {
          Alert.alert(
            "Login Required",
            "Please login again."
          );

          return;
        }

        const response =
          await fetch(
            `${API_URL}/foods/${food._id}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  isAvailable:
                    !food.isAvailable,
                }),
            }
          );

        const data =
          await response.json();

        console.log(
          "🔄 AVAILABILITY RESPONSE:",
          data
        );

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data?.message ||
              "Availability update failed."
          );
        }

        setFoods(
          (previous) =>
            previous.map(
              (item) =>
                item._id ===
                food._id
                  ? {
                      ...item,
                      isAvailable:
                        !food.isAvailable,
                    }
                  : item
            )
        );
      } catch (error: any) {
        console.log(
          "❌ AVAILABILITY ERROR:",
          error
        );

        Alert.alert(
          "Error",
          error?.message ||
            "Availability update nahi hua."
        );
      }
    };

  /* =========================================================
     TOGGLE POPULAR
  ========================================================= */

  const togglePopular =
    async (
      food: Food
    ) => {
      try {
        const token =
          await getToken();

        if (!token) {
          Alert.alert(
            "Login Required",
            "Please login again."
          );

          return;
        }

        const response =
          await fetch(
            `${API_URL}/foods/${food._id}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  isPopular:
                    !food.isPopular,
                }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data?.message ||
              "Popular status update failed."
          );
        }

        setFoods(
          (previous) =>
            previous.map(
              (item) =>
                item._id ===
                food._id
                  ? {
                      ...item,
                      isPopular:
                        !food.isPopular,
                    }
                  : item
            )
        );
      } catch (error: any) {
        console.log(
          "❌ POPULAR ERROR:",
          error
        );

        Alert.alert(
          "Error",
          error?.message ||
            "Popular status update nahi hua."
        );
      }
    };

  /* =========================================================
     DELETE CONFIRM
  ========================================================= */

  const deleteFood = (
    food: Food
  ) => {
    Alert.alert(
      "Delete Food",
      `Kya aap "${food.name}" delete karna chahte ho?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Delete",
          style: "destructive",

          onPress: () =>
            performDelete(
              food._id
            ),
        },
      ]
    );
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const performDelete =
    async (
      id: string
    ) => {
      try {
        const token =
          await getToken();

        if (!token) {
          Alert.alert(
            "Login Required",
            "Please login again."
          );

          return;
        }

        const response =
          await fetch(
            `${API_URL}/foods/${id}`,
            {
              method: "DELETE",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        console.log(
          "🗑️ DELETE FOOD RESPONSE:",
          data
        );

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data?.message ||
              "Delete failed."
          );
        }

        setFoods(
          (previous) =>
            previous.filter(
              (item) =>
                item._id !== id
            )
        );

        Alert.alert(
          "Deleted",
          "Food item delete ho gaya."
        );
      } catch (error: any) {
        console.log(
          "❌ DELETE FOOD ERROR:",
          error
        );

        Alert.alert(
          "Error",
          error?.message ||
            "Food item delete nahi ho paaya."
        );
      }
    };

  /* =========================================================
     FOOD CARD
  ========================================================= */

  const renderFood = ({
    item,
  }: {
    item: Food;
  }) => {
    return (
      <View
        style={
          styles.foodCard
        }
      >
        {/* IMAGE */}

        <View
          style={
            styles.imageBox
          }
        >
          {item.image ? (
            <Image
              source={{
                uri: item.image,
              }}
              style={
                styles.foodImage
              }
            />
          ) : (
            <Text
              style={
                styles.foodEmoji
              }
            >
              🍔
            </Text>
          )}
        </View>

        {/* INFO */}

        <View
          style={
            styles.foodInfo
          }
        >
          <View
            style={
              styles.nameRow
            }
          >
            <Text
              style={
                styles.foodName
              }
              numberOfLines={1}
            >
              {item.name}
            </Text>

            <Text
              style={
                item.isVeg
                  ? styles.veg
                  : styles.nonVeg
              }
            >
              {item.isVeg
                ? "●"
                : "●"}
            </Text>
          </View>

          <Text
            style={
              styles.categoryText
            }
          >
            {getCategoryName(
              item
            )}
          </Text>

          {!!item.description && (
            <Text
              style={
                styles.description
              }
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}

          <View
            style={
              styles.priceRow
            }
          >
            <Text
              style={
                styles.price
              }
            >
              ₹{item.price}
            </Text>

            <Text
              style={
                styles.time
              }
            >
              ⏱️{" "}
              {item.preparationTime ??
                10} min
            </Text>
          </View>

          {/* BADGES */}

          <View
            style={
              styles.badgeRow
            }
          >
            <View
              style={[
                styles.statusBadge,
                item.isAvailable
                  ? styles.availableBadge
                  : styles.unavailableBadge,
              ]}
            >
              <Text
                style={
                  styles.badgeText
                }
              >
                {item.isAvailable
                  ? "Available"
                  : "Unavailable"}
              </Text>
            </View>

            {item.isPopular && (
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
                  ⭐ Popular
                </Text>
              </View>
            )}
          </View>

          {/* ACTIONS */}

          <View
            style={
              styles.actionRow
            }
          >
            <Pressable
              style={
                styles.editButton
              }
              onPress={() =>
                openEditModal(
                  item
                )
              }
            >
              <Text
                style={
                  styles.editText
                }
              >
                ✏️ Edit
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.availableButton,
                item.isAvailable
                  ? styles.offButton
                  : styles.onButton,
              ]}
              onPress={() =>
                toggleAvailability(
                  item
                )
              }
            >
              <Text
                style={
                  styles.actionText
                }
              >
                {item.isAvailable
                  ? "🔴 Off"
                  : "🟢 On"}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.popularButton,
                item.isPopular
                  ? styles.popularActive
                  : styles.popularInactive,
              ]}
              onPress={() =>
                togglePopular(
                  item
                )
              }
            >
              <Text
                style={
                  styles.actionText
                }
              >
                ⭐
              </Text>
            </Pressable>

            <Pressable
              style={
                styles.deleteButton
              }
              onPress={() =>
                deleteFood(item)
              }
            >
              <Text
                style={
                  styles.deleteText
                }
              >
                🗑️
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      {/* HEADER */}

      <View
        style={
          styles.header
        }
      >
        <Pressable
          style={
            styles.backButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.backText
            }
          >
            ‹
          </Text>
        </Pressable>

        <View
          style={
            styles.headerInfo
          }
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            Add Items
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            Manage food items
          </Text>
        </View>

        <Pressable
          style={
            styles.addButton
          }
          onPress={
            openAddModal
          }
        >
          <Text
            style={
              styles.addButtonText
            }
          >
            + Add
          </Text>
        </Pressable>
      </View>

      {/* SEARCH */}

      <View
        style={
          styles.searchBox
        }
      >
        <Text
          style={
            styles.searchIcon
          }
        >
          🔍
        </Text>

        <TextInput
          style={
            styles.searchInput
          }
          placeholder="Search food item..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={
            setSearch
          }
        />

        {search.length >
          0 && (
          <Pressable
            onPress={() =>
              setSearch("")
            }
          >
            <Text
              style={
                styles.clearText
              }
            >
              ✕
            </Text>
          </Pressable>
        )}
      </View>

      {/* CATEGORY FILTER */}

     <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.filterList}
  nestedScrollEnabled
>
        <Pressable
          style={[
            styles.filterChip,
            selectedCategory ===
              "all" &&
              styles.filterChipActive,
          ]}
          onPress={() =>
            setSelectedCategory(
              "all"
            )
          }
        >
          <Text
            style={[
              styles.filterText,
              selectedCategory ===
                "all" &&
                styles.filterTextActive,
            ]}
          >
            All
          </Text>
        </Pressable>

        {categories.map(
          (category) => (
            <Pressable
              key={
                category._id
              }
              style={[
                styles.filterChip,
                selectedCategory ===
                  category._id &&
                  styles.filterChipActive,
              ]}
              onPress={() =>
                setSelectedCategory(
                  category._id
                )
              }
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategory ===
                    category._id &&
                    styles.filterTextActive,
                ]}
              >
                {category.name}
              </Text>
            </Pressable>
          )
        )}
      </ScrollView>

      {/* COUNT */}

      <View
        style={
          styles.countRow
        }
      >
        <Text
          style={
            styles.countText
          }
        >
          {filteredFoods.length}{" "}
          Items
        </Text>

        <Pressable
          onPress={
            loadData
          }
        >
          <Text
            style={
              styles.refreshText
            }
          >
            🔄 Refresh
          </Text>
        </Pressable>
      </View>

      {/* LIST */}

      {loading ? (
        <View
          style={
            styles.loader
          }
        >
          <ActivityIndicator
            size="large"
            color="#FF6B00"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading items...
          </Text>
        </View>
      ) : (
        <FlatList
          data={
            filteredFoods
          }
          keyExtractor={(
            item
          ) => item._id}
          renderItem={
            renderFood
          }
          contentContainerStyle={
            styles.list
          }
          showsVerticalScrollIndicator={
            false
          }
          refreshing={
            loading
          }
          onRefresh={
            loadData
          }
          ListEmptyComponent={
            <View
              style={
                styles.empty
              }
            >
              <Text
                style={
                  styles.emptyIcon
                }
              >
                🍔
              </Text>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No Items Found
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Pehla food item add
                karo.
              </Text>

              <Pressable
                style={
                  styles.emptyButton
                }
                onPress={
                  openAddModal
                }
              >
                <Text
                  style={
                    styles.emptyButtonText
                  }
                >
                  + Add Food Item
                </Text>
              </Pressable>
            </View>
          }
        />
      )}

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      <Modal
        visible={
          modalVisible
        }
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!saving) {
            setModalVisible(
              false
            );
          }
        }}
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modal
            }
          >
            {/* MODAL HEADER */}

            <View
              style={
                styles.modalHeader
              }
            >
              <View
                style={
                  styles.modalHeaderInfo
                }
              >
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  {editingFood
                    ? "Edit Food"
                    : "Add Food Item"}
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Food details
                </Text>
              </View>

              <Pressable
                disabled={
                  saving
                }
                onPress={() =>
                  setModalVisible(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.closeText
                  }
                >
                  ✕
                </Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.form
              }
            >
              {/* NAME */}

              <Text
                style={
                  styles.label
                }
              >
                Food Name *
              </Text>

              <TextInput
                style={
                  styles.input
                }
                placeholder="e.g. Samosa"
                placeholderTextColor="#999"
                value={name}
                onChangeText={
                  setName
                }
              />

              {/* CATEGORY */}

              <Text
                style={
                  styles.label
                }
              >
                Category *
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.categoryList
                }
              >
                {categories.map(
                  (category) => (
                    <Pressable
                      key={
                        category._id
                      }
                      style={[
                        styles.categoryChip,
                        categoryId ===
                          category._id &&
                          styles.categoryChipActive,
                      ]}
                      onPress={() =>
                        setCategoryId(
                          category._id
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          categoryId ===
                            category._id &&
                            styles.categoryChipTextActive,
                        ]}
                      >
                        {
                          category.name
                        }
                      </Text>
                    </Pressable>
                  )
                )}
              </ScrollView>

              {/* DESCRIPTION */}

              <Text
                style={
                  styles.label
                }
              >
                Description
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                ]}
                placeholder="Food item ke baare me..."
                placeholderTextColor="#999"
                multiline
                value={
                  description
                }
                onChangeText={
                  setDescription
                }
              />

              {/* PRICE */}

              <Text
                style={
                  styles.label
                }
              >
                Price *
              </Text>

              <TextInput
                style={
                  styles.input
                }
                placeholder="e.g. 30"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={price}
                onChangeText={
                  setPrice
                }
              />

              {/* PREPARATION TIME */}

              <Text
                style={
                  styles.label
                }
              >
                Preparation Time
              </Text>

              <TextInput
                style={
                  styles.input
                }
                placeholder="e.g. 10"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={
                  preparationTime
                }
                onChangeText={
                  setPreparationTime
                }
              />

              {/* IMAGE */}

              <Text
                style={
                  styles.label
                }
              >
                Food Image
              </Text>

              <Pressable
                style={
                  styles.galleryButton
                }
                disabled={
                  saving
                }
                onPress={
                  pickFoodImage
                }
              >
                <Text
                  style={
                    styles.galleryIcon
                  }
                >
                  🖼️
                </Text>

                <View
                  style={
                    styles.galleryContent
                  }
                >
                  <Text
                    style={
                      styles.galleryTitle
                    }
                  >
                    {image
                      ? "Change Image"
                      : "Choose From Gallery"}
                  </Text>

                  <Text
                    style={
                      styles.gallerySubtitle
                    }
                  >
                    Upload food image
                  </Text>
                </View>
              </Pressable>

              {image ? (
                <View
                  style={
                    styles.uploadedBox
                  }
                >
                  <Text
                    style={
                      styles.uploadedText
                    }
                  >
                    ✓ Image uploaded
                  </Text>

                  <Pressable
                    disabled={
                      saving
                    }
                    onPress={() =>
                      setImage("")
                    }
                  >
                    <Text
                      style={
                        styles.removeText
                      }
                    >
                      Remove
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {/* IMAGE URL */}

              <TextInput
                style={[
                  styles.input,
                  {
                    marginTop: 10,
                  },
                ]}
                placeholder="Ya image URL paste karo"
                placeholderTextColor="#999"
                autoCapitalize="none"
                value={
                  image
                }
                onChangeText={
                  setImage
                }
              />

              {/* VEG */}

              <View
                style={
                  styles.switchRow
                }
              >
                <View
                  style={
                    styles.switchInfo
                  }
                >
                  <Text
                    style={
                      styles.switchTitle
                    }
                  >
                    🥬 Veg Item
                  </Text>

                  <Text
                    style={
                      styles.switchSubtitle
                    }
                  >
                    Customer ko
                    vegetarian item
                    dikhega
                  </Text>
                </View>

                <Switch
                  value={
                    isVeg
                  }
                  onValueChange={
                    setIsVeg
                  }
                  trackColor={{
                    false: "#ddd",
                    true: "#A7E6B5",
                  }}
                  thumbColor={
                    isVeg
                      ? "#22C55E"
                      : "#999"
                  }
                />
              </View>

              {/* AVAILABLE */}

              <View
                style={
                  styles.switchRow
                }
              >
                <View
                  style={
                    styles.switchInfo
                  }
                >
                  <Text
                    style={
                      styles.switchTitle
                    }
                  >
                    🟢 Available
                  </Text>

                  <Text
                    style={
                      styles.switchSubtitle
                    }
                  >
                    Customer order
                    kar sakta hai
                  </Text>
                </View>

                <Switch
                  value={
                    isAvailable
                  }
                  onValueChange={
                    setIsAvailable
                  }
                  trackColor={{
                    false: "#ddd",
                    true: "#A7E6B5",
                  }}
                  thumbColor={
                    isAvailable
                      ? "#22C55E"
                      : "#999"
                  }
                />
              </View>

              {/* POPULAR */}

              <View
                style={
                  styles.switchRow
                }
              >
                <View
                  style={
                    styles.switchInfo
                  }
                >
                  <Text
                    style={
                      styles.switchTitle
                    }
                  >
                    ⭐ Popular Item
                  </Text>

                  <Text
                    style={
                      styles.switchSubtitle
                    }
                  >
                    Popular section
                    me show hoga
                  </Text>
                </View>

                <Switch
                  value={
                    isPopular
                  }
                  onValueChange={
                    setIsPopular
                  }
                  trackColor={{
                    false: "#ddd",
                    true: "#FFD580",
                  }}
                  thumbColor={
                    isPopular
                      ? "#FF9F00"
                      : "#999"
                  }
                />
              </View>

              {/* SAVE */}

              <Pressable
                style={[
                  styles.saveButton,
                  saving &&
                    styles.disabledButton,
                ]}
                disabled={
                  saving
                }
                onPress={
                  saveFood
                }
              >
                {saving ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.saveText
                    }
                  >
                    {editingFood
                      ? "Update Food"
                      : "Add Food"}
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#F7F7F8",
    },

    header: {
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 14,
      backgroundColor:
        "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor:
        "#EEEEEE",
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        "#F1F1F1",
      justifyContent:
        "center",
      alignItems:
        "center",
      marginRight: 12,
    },

    backText: {
      fontSize: 32,
      lineHeight: 34,
      color: "#222",
    },

    headerInfo: {
      flex: 1,
    },

    headerTitle: {
      fontSize: 21,
      fontWeight: "900",
      color: "#171717",
    },

    headerSubtitle: {
      fontSize: 12,
      color: "#777",
      marginTop: 2,
    },

    addButton: {
      backgroundColor:
        "#FF6B00",
      paddingHorizontal: 15,
      paddingVertical: 11,
      borderRadius: 12,
    },

    addButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "900",
    },

    searchBox: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginHorizontal: 16,
      marginTop: 14,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E5E5E5",
      borderRadius: 14,
      paddingHorizontal: 13,
      height: 50,
    },

    searchIcon: {
      fontSize: 18,
      marginRight: 8,
    },

    searchInput: {
      flex: 1,
      fontSize: 14,
      color: "#222",
    },

    clearText: {
      fontSize: 16,
      color: "#777",
      padding: 5,
    },

    filterList: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 10,
      gap: 8,
      alignItems:"center",
      minHeight: 52,
    },

filterChip: {
  height: 42,
  minWidth: 72,
  paddingHorizontal: 16,
  borderRadius: 21,
  borderWidth: 1,
  borderColor: "#DDDDDD",
  backgroundColor: "#FFFFFF",
  justifyContent: "center",
  alignItems: "center",
},

    filterChipActive: {
      backgroundColor:
        "#FF6B00",
      borderColor:
        "#FF6B00",
    },

    filterText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#555",
    },

    filterTextActive: {
      color: "#FFFFFF",
    },

    countRow: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },

    countText: {
      fontSize: 14,
      fontWeight: "800",
      color: "#333",
    },

    refreshText: {
      fontSize: 12,
      fontWeight: "800",
      color: "#FF6B00",
    },

    list: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },

    foodCard: {
      flexDirection:
        "row",
      backgroundColor:
        "#FFFFFF",
      borderRadius: 18,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor:
        "#EEEEEE",
    },

    imageBox: {
      width: 95,
      height: 95,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor:
        "#FFF4EA",
      justifyContent:
        "center",
      alignItems:
        "center",
      marginRight: 12,
    },

    foodImage: {
      width: "100%",
      height: "100%",
    },

    foodEmoji: {
      fontSize: 40,
    },

    foodInfo: {
      flex: 1,
      minWidth: 0,
    },

    nameRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    foodName: {
      flex: 1,
      fontSize: 16,
      fontWeight: "900",
      color: "#171717",
    },

    veg: {
      color: "#22C55E",
      fontSize: 14,
      marginLeft: 5,
    },

    nonVeg: {
      color: "#EF4444",
      fontSize: 14,
      marginLeft: 5,
    },

    categoryText: {
      fontSize: 11,
      color: "#FF6B00",
      fontWeight: "800",
      marginTop: 3,
    },

    description: {
      fontSize: 11,
      color: "#777",
      lineHeight: 16,
      marginTop: 5,
    },

    priceRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 6,
    },

    price: {
      fontSize: 16,
      fontWeight: "900",
      color: "#171717",
    },

    time: {
      fontSize: 10,
      color: "#777",
      marginLeft: 10,
    },

    badgeRow: {
      flexDirection:
        "row",
      flexWrap: "wrap",
      gap: 5,
      marginTop: 6,
    },

    statusBadge: {
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 8,
    },

    availableBadge: {
      backgroundColor:
        "#E8F8ED",
    },

    unavailableBadge: {
      backgroundColor:
        "#FDECEC",
    },

    badgeText: {
      fontSize: 9,
      fontWeight: "800",
      color: "#333",
    },

    popularBadge: {
      backgroundColor:
        "#FFF5D9",
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 8,
    },

    popularText: {
      fontSize: 9,
      fontWeight: "800",
      color: "#8A6200",
    },

    actionRow: {
      flexDirection:
        "row",
      gap: 5,
      marginTop: 8,
    },

    editButton: {
      flex: 1,
      backgroundColor:
        "#EEF3FF",
      borderRadius: 9,
      paddingVertical: 8,
      alignItems:
        "center",
    },

    editText: {
      color: "#3158B8",
      fontSize: 10,
      fontWeight: "900",
    },

    availableButton: {
      flex: 0.7,
      borderRadius: 9,
      paddingVertical: 8,
      alignItems:
        "center",
    },

    offButton: {
      backgroundColor:
        "#FFF0F0",
    },

    onButton: {
      backgroundColor:
        "#EAF8EE",
    },

    popularButton: {
      width: 38,
      borderRadius: 9,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    popularActive: {
      backgroundColor:
        "#FFF0C2",
    },

    popularInactive: {
      backgroundColor:
        "#F5F5F5",
    },

    actionText: {
      fontSize: 10,
      fontWeight: "900",
    },

    deleteButton: {
      width: 38,
      borderRadius: 9,
      backgroundColor:
        "#FDECEC",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    deleteText: {
      fontSize: 15,
    },

    loader: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    loadingText: {
      marginTop: 10,
      color: "#777",
    },

    empty: {
      alignItems:
        "center",
      paddingTop: 80,
      paddingHorizontal: 20,
    },

    emptyIcon: {
      fontSize: 55,
    },

    emptyTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: "#222",
      marginTop: 15,
    },

    emptyText: {
      color: "#777",
      marginTop: 5,
    },

    emptyButton: {
      marginTop: 18,
      backgroundColor:
        "#FF6B00",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
    },

    emptyButtonText: {
      color: "#FFFFFF",
      fontWeight: "900",
    },

    modalOverlay: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.55)",
      justifyContent:
        "flex-end",
    },

    modal: {
      backgroundColor:
        "#FFFFFF",
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      maxHeight: "94%",
      paddingTop: 18,
    },

    modalHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      paddingHorizontal: 20,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor:
        "#EEEEEE",
    },

    modalHeaderInfo: {
      flex: 1,
    },

    modalTitle: {
      fontSize: 21,
      fontWeight: "900",
      color: "#171717",
    },

    modalSubtitle: {
      fontSize: 12,
      color: "#888",
      marginTop: 3,
    },

    closeText: {
      fontSize: 24,
      color: "#555",
      padding: 5,
    },

    form: {
      padding: 20,
      paddingBottom: 50,
    },

    label: {
      fontSize: 13,
      fontWeight: "900",
      color: "#333",
      marginBottom: 7,
      marginTop: 13,
    },

    input: {
      minHeight: 50,
      borderWidth: 1,
      borderColor:
        "#DDDDDD",
      borderRadius: 12,
      paddingHorizontal: 14,
      fontSize: 15,
      color: "#222",
      backgroundColor:
        "#FAFAFA",
    },

    textArea: {
      height: 95,
      paddingTop: 13,
      textAlignVertical:
        "top",
    },

   categoryList: {
  gap: 8,
  paddingBottom: 3,
  alignItems: "center",
  minHeight: 44,
},

categoryChip: {
  height: 40,
  paddingHorizontal: 15,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: "#DDDDDD",
  backgroundColor: "#FFFFFF",
  justifyContent: "center",
  alignItems: "center",
},

    categoryChipActive: {
      backgroundColor:
        "#FF6B00",
      borderColor:
        "#FF6B00",
    },

    categoryChipText: {
      fontSize: 12,
      fontWeight: "800",
      color: "#555",
    },

    categoryChipTextActive: {
      color: "#FFFFFF",
    },

    galleryButton: {
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#FFF4EA",
      borderWidth: 1,
      borderColor:
        "#FFD2B3",
      borderRadius: 14,
      padding: 14,
    },

    galleryIcon: {
      fontSize: 28,
      marginRight: 12,
    },

    galleryContent: {
      flex: 1,
    },

    galleryTitle: {
      fontSize: 14,
      fontWeight: "900",
      color: "#FF6B00",
    },

    gallerySubtitle: {
      fontSize: 11,
      color: "#888",
      marginTop: 3,
    },

    uploadedBox: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginTop: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor:
        "#EAF8EE",
    },

    uploadedText: {
      flex: 1,
      color: "#16803C",
      fontSize: 12,
      fontWeight: "800",
    },

    removeText: {
      color: "#D32F2F",
      fontSize: 12,
      fontWeight: "900",
    },

    switchRow: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor:
        "#EEEEEE",
    },

    switchInfo: {
      flex: 1,
      paddingRight: 10,
    },

    switchTitle: {
      fontSize: 14,
      fontWeight: "900",
      color: "#222",
    },

    switchSubtitle: {
      fontSize: 11,
      color: "#888",
      marginTop: 3,
    },

    saveButton: {
      height: 54,
      backgroundColor:
        "#FF6B00",
      borderRadius: 14,
      justifyContent:
        "center",
      alignItems:
        "center",
      marginTop: 24,
    },

    disabledButton: {
      opacity: 0.6,
    },

    saveText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "900",
    },
  });