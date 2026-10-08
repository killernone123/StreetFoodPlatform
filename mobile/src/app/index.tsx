import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  AppState,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  useFocusEffect,
  useRouter,
} from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";

import API from "../services/api";
import { useCartStore } from "../store/cartStore";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type Category = {
  _id: string;
  name: string;
  image?: string;
  isActive?: boolean;
};

type Food = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;

  category?: string | Category;
  categoryId?: string | Category;

  isAvailable?: boolean;
  isPopular?: boolean;
  isVeg?: boolean;
  preparationTime?: number;
  customizations?: any[];
  addOns?: any[];
};

type Banner = {
  _id: string;
  title: string;
  message?: string;
  image?: string;
  type?: string;
  isActive?: boolean;
  sortOrder?: number;
};

export default function HomeScreen() {
  const router = useRouter();
 const registerForPushNotificationsAsync = async () => {
  try {
    if (!Device.isDevice) {
      console.log(
        "⚠️ Push notifications ke liye physical device required hai."
      );
      return null;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } =
        await Notifications.requestPermissionsAsync();

      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log(
        "❌ Notification permission nahi mili."
      );
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.log(
        "❌ EAS projectId nahi mila."
      );
      return null;
    }

    const pushToken =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    const expoPushToken = pushToken.data;

    console.log(
      "🔔 CUSTOMER EXPO PUSH TOKEN:",
      expoPushToken
    );

    // =================================================
    // REGISTER TOKEN WITH BACKEND
    // =================================================

    const customerToken =
      await AsyncStorage.getItem(
        "customerToken"
      );

    let customerId = null;

    try {
      const storedCustomer =
        await AsyncStorage.getItem(
          "customerData"
        );

      if (storedCustomer) {
        const parsedCustomer =
          JSON.parse(storedCustomer);

        customerId =
          parsedCustomer?._id ||
          parsedCustomer?.id ||
          null;
      }
    } catch (error) {
      console.log(
        "⚠️ Customer data parse error:",
        error
      );
    }

    const response = await fetch(
      "https://streetfoodplatform-1.onrender.com/api/push-notifications/register",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
          Accept:
            "application/json",

          ...(customerToken
            ? {
                Authorization:
                  `Bearer ${customerToken}`,
              }
            : {}),
        },

        body: JSON.stringify({
          token: expoPushToken,
          userType: "customer",
          userId: customerId,
          deviceName:
            "Street Food Customer Android",
        }),
      }
    );

    const data = await response.json();

    console.log(
      "📲 PUSH TOKEN REGISTER RESPONSE:",
      data
    );

    if (!response.ok) {
      console.log(
        "❌ Push token register failed:",
        response.status
      );

      return null;
    }

    console.log(
      "✅ CUSTOMER PUSH TOKEN SAVED IN BACKEND"
    );

    return expoPushToken;
  } catch (error) {
    console.log(
      "❌ PUSH TOKEN ERROR:",
      error
    );

    return null;
  }
};
  // =====================================================
  // CART
  // =====================================================

  const addToCart = useCartStore(
    (state) => state.addToCart
  );

  const cartItems = useCartStore(
    (state) => state.items
  );

  // =====================================================
  // STATES
  // =====================================================

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [foods, setFoods] =
    useState<Food[]>([]);

  const [activeBanners, setActiveBanners] =
    useState<Banner[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [cartMessage, setCartMessage] =
    useState("");

  // =====================================================
  // REFS
  // =====================================================

  const isFirstLoad = useRef(true);

  const isLoadingData = useRef(false);

  const cartMessageTimer = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  // =====================================================
  // CLEAN CART MESSAGE TIMER
  // =====================================================

  useEffect(() => {
    return () => {
      if (cartMessageTimer.current) {
        clearTimeout(
          cartMessageTimer.current
        );
      }
    };
  }, []);
  useEffect(() => {
  registerForPushNotificationsAsync();
}, []);

  // =====================================================
  // LOAD HOME DATA
  // =====================================================

  const loadHomeData = useCallback(
    async (showLoader = false) => {
      if (isLoadingData.current) {
        console.log(
          "⏳ Home data already loading..."
        );

        return;
      }

      try {
        isLoadingData.current = true;

        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        console.log(
          "🔄 Refreshing home data..."
        );

        const token =
          await AsyncStorage.getItem(
            "customerToken"
          );

        console.log(
          "🔐 Customer token:",
          token
            ? "FOUND"
            : "NOT FOUND"
        );

        const cacheBuster =
          Date.now();

        // =====================================================
        // API CALLS
        // =====================================================

        const [
          categoriesResponse,
          foodsResponse,
          bannersResponse,
        ] = await Promise.all([
          // ================= CATEGORIES =================

          fetch(
            `https://streetfoodplatform-1.onrender.com/api/categories?nocache=${cacheBuster}`,
            {
              method: "GET",

              headers: {
                Accept:
                  "application/json",

                "Cache-Control":
                  "no-cache",

                Pragma:
                  "no-cache",

                ...(token
                  ? {
                      Authorization:
                        `Bearer ${token}`,
                    }
                  : {}),
              },
            }
          ),

          // ================= FOODS =================

          API.get(
            `/foods?nocache=${cacheBuster}`,
            {
              headers: {
                "Cache-Control":
                  "no-cache",

                Pragma:
                  "no-cache",
              },
            }
          ),

          // ================= BANNERS =================

          fetch(
            `https://streetfoodplatform-1.onrender.com/api/banners/active?nocache=${cacheBuster}`,
            {
              method: "GET",

              headers: {
                Accept:
                  "application/json",

                "Cache-Control":
                  "no-cache",

                Pragma:
                  "no-cache",
              },
            }
          ),
        ]);

        // =====================================================
        // CATEGORY RESPONSE
        // =====================================================

        if (
          !categoriesResponse.ok
        ) {
          throw new Error(
            `Categories API failed: ${categoriesResponse.status}`
          );
        }

        const categoryResponseData =
          await categoriesResponse.json();

        console.log(
          "📦 CATEGORY RESPONSE:",
          JSON.stringify(
            categoryResponseData
          )
        );

        let categoryData: Category[] =
          [];

        if (
          Array.isArray(
            categoryResponseData
          )
        ) {
          categoryData =
            categoryResponseData;
        } else if (
          Array.isArray(
            categoryResponseData?.categories
          )
        ) {
          categoryData =
            categoryResponseData.categories;
        } else if (
          Array.isArray(
            categoryResponseData?.data
          )
        ) {
          categoryData =
            categoryResponseData.data;
        } else if (
          Array.isArray(
            categoryResponseData?.data
              ?.categories
          )
        ) {
          categoryData =
            categoryResponseData.data.categories;
        }

        // =====================================================
        // BANNER RESPONSE
        // =====================================================

        if (
          !bannersResponse.ok
        ) {
          console.log(
            "⚠️ Banner API failed:",
            bannersResponse.status
          );

          setActiveBanners([]);
        } else {
          const bannerResponseData =
            await bannersResponse.json();

          console.log(
            "📢 BANNER RESPONSE:",
            JSON.stringify(
              bannerResponseData
            )
          );

          let bannerData: Banner[] =
            [];

          if (
            Array.isArray(
              bannerResponseData
            )
          ) {
            bannerData =
              bannerResponseData;
          } else if (
            Array.isArray(
              bannerResponseData?.banners
            )
          ) {
            bannerData =
              bannerResponseData.banners;
          } else if (
            Array.isArray(
              bannerResponseData?.data
            )
          ) {
            bannerData =
              bannerResponseData.data;
          } else if (
            Array.isArray(
              bannerResponseData?.data
                ?.banners
            )
          ) {
            bannerData =
              bannerResponseData.data.banners;
          }

          const validBanners =
            bannerData.filter(
              (banner) =>
                banner &&
                banner._id &&
                banner.isActive !== false
            );

          validBanners.sort(
            (a, b) =>
              (a.sortOrder ?? 0) -
              (b.sortOrder ?? 0)
          );

          setActiveBanners(
            validBanners
          );

          console.log(
            "✅ Active banners:",
            validBanners.length
          );
        }

        // =====================================================
        // FOOD RESPONSE
        // =====================================================

        const foodResponseData =
          foodsResponse?.data;

        console.log(
          "📦 FOOD RESPONSE:",
          JSON.stringify(
            foodResponseData
          )
        );

        let foodData: Food[] =
          [];

        if (
          Array.isArray(
            foodResponseData
          )
        ) {
          foodData =
            foodResponseData;
        } else if (
          Array.isArray(
            foodResponseData?.foods
          )
        ) {
          foodData =
            foodResponseData.foods;
        } else if (
          Array.isArray(
            foodResponseData?.data
          )
        ) {
          foodData =
            foodResponseData.data;
        } else if (
          Array.isArray(
            foodResponseData?.data
              ?.foods
          )
        ) {
          foodData =
            foodResponseData.data.foods;
        }

        console.log(
          "✅ Categories loaded:",
          categoryData.length
        );

        console.log(
          "✅ Foods loaded:",
          foodData.length
        );

        // =====================================================
        // ACTIVE CATEGORIES
        // =====================================================

        const activeCategories =
          categoryData.filter(
            (category) =>
              category &&
              category._id &&
              category.name &&
              category.isActive !== false
          );

        // =====================================================
        // AVAILABLE FOODS
        // =====================================================

        const availableFoods =
          foodData.filter(
            (food) =>
              food &&
              food._id &&
              food.name &&
              food.isAvailable !== false
          );

        // =====================================================
        // SELECTED CATEGORY CHECK
        // =====================================================

        setSelectedCategoryId(
          (currentSelectedId) => {
            if (
              !currentSelectedId
            ) {
              return null;
            }

            const stillExists =
              activeCategories.some(
                (category) =>
                  category._id ===
                  currentSelectedId
              );

            if (!stillExists) {
              console.log(
                "📂 Selected category no longer active. Showing all."
              );

              return null;
            }

            return currentSelectedId;
          }
        );

        // =====================================================
        // UPDATE UI
        // =====================================================

        setCategories(
          activeCategories
        );

        setFoods(
          availableFoods
        );

        console.log(
          "✅ Active categories:",
          activeCategories.length
        );

        console.log(
          "✅ Available foods:",
          availableFoods.length
        );

        console.log(
          "🔄 CUSTOMER HOME UPDATED"
        );
      } catch (err: any) {
        console.log(
          "❌ HOME API ERROR:",
          err?.message || err
        );

        console.log(
          "❌ ERROR STATUS:",
          err?.response?.status
        );

        console.log(
          "❌ ERROR RESPONSE:",
          err?.response?.data
        );

        if (
          isFirstLoad.current
        ) {
          setError(
            err?.response
              ?.data?.message ||
              err?.message ||
              "Unable to load food data"
          );

          setCategories([]);
          setFoods([]);
          setActiveBanners([]);
        }
      } finally {
        isFirstLoad.current =
          false;

        setLoading(false);

        setRefreshing(false);

        isLoadingData.current =
          false;
      }
    },
    []
  );

  // =====================================================
  // FIRST LOAD
  // =====================================================

  useEffect(() => {
    loadHomeData(true);
  }, [loadHomeData]);

  // =====================================================
  // AUTO REFRESH EVERY 10 SECONDS
  // =====================================================

  useEffect(() => {
    console.log(
      "⏱️ Live refresh started: every 10 seconds"
    );

    const interval =
      setInterval(() => {
        console.log(
          "🔄 Automatic live refresh..."
        );

        loadHomeData(false);
      }, 10000);

    return () => {
      console.log(
        "⏹️ Live refresh stopped"
      );

      clearInterval(
        interval
      );
    };
  }, [loadHomeData]);

  // =====================================================
  // REFRESH WHEN HOME SCREEN GETS FOCUS
  // =====================================================

  useFocusEffect(
    useCallback(() => {
      console.log(
        "👀 Home screen focused - refreshing..."
      );

      loadHomeData(false);

      return () => {
        console.log(
          "👋 Home screen unfocused"
        );
      };
    }, [loadHomeData])
  );

  // =====================================================
  // REFRESH WHEN APP COMES TO FOREGROUND
  // =====================================================

  useEffect(() => {
    const subscription =
      AppState.addEventListener(
        "change",
        (nextState) => {
          if (
            nextState ===
            "active"
          ) {
            console.log(
              "📱 App active - refreshing home..."
            );

            loadHomeData(false);
          }
        }
      );

    return () => {
      subscription.remove();
    };
  }, [loadHomeData]);

  // =====================================================
  // GET CATEGORY ID FROM FOOD
  // =====================================================

  const getFoodCategoryId = (
    food: Food
  ): string | null => {
    const categoryValue =
      food.categoryId ??
      food.category;

    if (!categoryValue) {
      return null;
    }

    if (
      typeof categoryValue ===
      "string"
    ) {
      return categoryValue;
    }

    if (
      typeof categoryValue ===
        "object" &&
      categoryValue._id
    ) {
      return categoryValue._id;
    }

    return null;
  };

  // =====================================================
  // FILTER FOODS
  // =====================================================

  const filteredFoods =
    selectedCategoryId
      ? foods.filter(
          (food) =>
            getFoodCategoryId(
              food
            ) ===
            selectedCategoryId
        )
      : foods;

  // =====================================================
  // SELECT CATEGORY
  // =====================================================

  const handleCategoryPress = (
    category: Category
  ) => {
    console.log(
      "📂 Opening category:",
      category.name
    );

    console.log(
      "🆔 Category ID:",
      category._id
    );

    router.push({
      pathname: "/category-items",
      params: {
        categoryId: category._id,
        categoryName: category.name,
      },
    });
  };

  // =====================================================
  // SEE ALL
  // =====================================================

  const handleSeeAll = () => {
    console.log(
      "📂 Opening ALL CATEGORIES page..."
    );

    router.push(
      "/categories"
    );
  };

  // =====================================================
  // HELP & SUPPORT
  // =====================================================

  const handleHelpSupport = () => {
    console.log(
      "🎧 Opening Help & Support..."
    );

    router.push(
      "/help-support"
    );
  };

  // =====================================================
  // ADD TO CART
  // =====================================================

  const handleAddToCart = (
    food: Food
  ) => {
    addToCart({
      foodId: food._id,
      name: food.name,
      price: food.price,
      description:
        food.description,
      quantity: 1,
    });

    setCartMessage(
      `${food.name} added to cart • ₹${food.price}`
    );

    if (
      cartMessageTimer.current
    ) {
      clearTimeout(
        cartMessageTimer.current
      );
    }

    cartMessageTimer.current =
      setTimeout(() => {
        setCartMessage("");
      }, 2500);
  };

  // =====================================================
  // SELECTED CATEGORY
  // =====================================================

  const selectedCategory =
    categories.find(
      (category) =>
        category._id ===
        selectedCategoryId
    );

  // =====================================================
  // UI
  // =====================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.container
        }
      >
        {/* ================= HEADER ================= */}

        <View
          style={styles.header}
        >
          <View>
            <Text
              style={styles.smallText}
            >
              Welcome 👋
            </Text>

            <Text
              style={styles.logo}
            >
              Street Food
            </Text>
          </View>

          <View
            style={
              styles.headerButtons
            }
          >
            <TouchableOpacity
              style={
                styles.profileButton
              }
              onPress={() =>
                router.push(
                  "/profile"
                )
              }
              activeOpacity={0.7}
            >
              <Text
                style={
                  styles.profileIcon
                }
              >
                👤
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.cartButton
              }
              onPress={() =>
                router.push(
                  "/cart"
                )
              }
              activeOpacity={0.7}
            >
              <Text
                style={
                  styles.cartIcon
                }
              >
                🛒
              </Text>

              {cartItems.length >
                0 && (
                <View
                  style={
                    styles.cartBadge
                  }
                >
                  <Text
                    style={
                      styles.cartBadgeText
                    }
                  >
                    {cartItems.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ================= LOCATION ================= */}

        <View
          style={styles.locationBox}
        >
          <Text
            style={
              styles.locationIcon
            }
          >
            📍
          </Text>

          <View>
            <Text
              style={
                styles.locationLabel
              }
            >
              DELIVER TO
            </Text>

            <Text
              style={
                styles.locationText
              }
            >
              Your Location
            </Text>
          </View>
        </View>

        {/* =====================================================
            ADMIN BANNERS
        ===================================================== */}

        {activeBanners.length >
          0 && (
          <View
            style={
              styles.adminBannerSection
            }
          >
            {activeBanners.map(
              (banner) => (
                <View
                  key={
                    banner._id
                  }
                  style={
                    styles.adminBanner
                  }
                >
                  {banner.image ? (
                    <Image
                      source={{
                        uri:
                          banner.image,
                      }}
                      style={
                        styles.adminBannerImage
                      }
                      resizeMode="cover"
                    />
                  ) : null}

                  <View
                    style={
                      styles.adminBannerContent
                    }
                  >
                    <View
                      style={
                        styles.adminBannerType
                      }
                    >
                      <Text
                        style={
                          styles.adminBannerTypeText
                        }
                      >
                        {(
                          banner.type ||
                          "GENERAL"
                        ).toUpperCase()}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.adminBannerTitle
                      }
                    >
                      {banner.title}
                    </Text>

                    {banner.message ? (
                      <Text
                        style={
                          styles.adminBannerMessage
                        }
                      >
                        {banner.message}
                      </Text>
                    ) : null}
                  </View>
                </View>
              )
            )}
          </View>
        )}

        {/* ================= DEFAULT BANNER ================= */}

        <View
          style={styles.banner}
        >
          <View
            style={
              styles.bannerContent
            }
          >
            <Text
              style={
                styles.bannerSmall
              }
            >
              HOT & FRESH 🔥
            </Text>

            <Text
              style={
                styles.bannerTitle
              }
            >
              Taste the Street,
              {"\n"}
              Love the Food!
            </Text>

            <Text
              style={
                styles.bannerSubtitle
              }
            >
              Fresh food delivered
              to your door.
            </Text>

            <TouchableOpacity
              style={
                styles.orderButton
              }
              onPress={
                handleSeeAll
              }
            >
              <Text
                style={
                  styles.orderButtonText
                }
              >
                Order Now →
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={
              styles.bannerEmoji
            }
          >
            🍔
          </Text>
        </View>

        {/* ================= LIVE STATUS ================= */}

        {refreshing &&
          !loading && (
            <View
              style={
                styles.liveUpdateBox
              }
            >
              <View
                style={
                  styles.liveDot
                }
              />

              <Text
                style={
                  styles.liveUpdateText
                }
              >
                Updating menu...
              </Text>
            </View>
          )}

        {/* ================= CART SUCCESS MESSAGE ================= */}

        {cartMessage !== "" && (
          <View
            style={
              styles.cartMessageBox
            }
          >
            <View
              style={
                styles.cartMessageIcon
              }
            >
              <Text
                style={
                  styles.cartMessageIconText
                }
              >
                ✓
              </Text>
            </View>

            <View
              style={
                styles.cartMessageContent
              }
            >
              <Text
                style={
                  styles.cartMessageTitle
                }
              >
                Added to Cart
              </Text>

              <Text
                style={
                  styles.cartMessageText
                }
                numberOfLines={2}
              >
                {cartMessage}
              </Text>
            </View>

            <TouchableOpacity
              style={
                styles.cartMessageButton
              }
              onPress={() =>
                router.push(
                  "/cart"
                )
              }
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.cartMessageButtonText
                }
              >
                View Cart
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= LOADING ================= */}

        {loading && (
          <View
            style={
              styles.loadingBox
            }
          >
            <ActivityIndicator
              size="large"
              color="#E53935"
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Loading delicious
              food...
            </Text>
          </View>
        )}

        {/* ================= ERROR ================= */}

        {!loading &&
          error !== "" && (
            <View
              style={
                styles.errorBox
              }
            >
              <Text
                style={
                  styles.errorEmoji
                }
              >
                ⚠️
              </Text>

              <Text
                style={
                  styles.errorText
                }
              >
                {error}
              </Text>

              <TouchableOpacity
                style={
                  styles.retryButton
                }
                onPress={() =>
                  loadHomeData(
                    true
                  )
                }
              >
                <Text
                  style={
                    styles.retryText
                  }
                >
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          )}

        {/* ================= DATA ================= */}

        {!loading &&
          error === "" && (
            <>
              {/* ================= HELP & SUPPORT ================= */}

              <TouchableOpacity
                style={
                  styles.helpSupportButton
                }
                onPress={
                  handleHelpSupport
                }
                activeOpacity={0.82}
              >
                <View
                  style={
                    styles.helpIconBox
                  }
                >
                  <Text
                    style={
                      styles.helpIcon
                    }
                  >
                    🎧
                  </Text>
                </View>

                <View
                  style={
                    styles.helpTextContainer
                  }
                >
                  <Text
                    style={
                      styles.helpTitle
                    }
                  >
                    Help & Support
                  </Text>

                  <Text
                    style={
                      styles.helpSubtitle
                    }
                  >
                    Contact us, feedback or complaint
                  </Text>
                </View>

                <Text
                  style={
                    styles.helpArrow
                  }
                >
                  ›
                </Text>
              </TouchableOpacity>

              {/* ================= CATEGORIES ================= */}

              <View
                style={
                  styles.sectionHeader
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Categories
                </Text>

                <TouchableOpacity
                  onPress={
                    handleSeeAll
                  }
                  activeOpacity={
                    0.7
                  }
                >
                  <Text
                    style={
                      styles.seeAll
                    }
                  >
                    See All
                  </Text>
                </TouchableOpacity>
              </View>

              {categories.length ===
              0 ? (
                <Text
                  style={
                    styles.emptyText
                  }
                >
                  No categories available
                </Text>
              ) : (
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
                    (
                      category
                    ) => {
                      const isSelected =
                        selectedCategoryId ===
                        category._id;

                      return (
                        <TouchableOpacity
                          key={
                            category._id
                          }
                          style={[
                            styles.categoryCard,
                            isSelected &&
                              styles.selectedCategoryCard,
                          ]}
                          onPress={() =>
                            handleCategoryPress(
                              category
                            )
                          }
                          activeOpacity={
                            0.8
                          }
                        >
                          {category.image ? (
                            <Image
                              source={{
                                uri:
                                  category.image,
                              }}
                              style={
                                styles.categoryImage
                              }
                              resizeMode="cover"
                              onError={() =>
                                console.log(
                                  "❌ CATEGORY IMAGE ERROR:",
                                  category.image
                                )
                              }
                            />
                          ) : (
                            <Text
                              style={
                                styles.categoryEmoji
                              }
                            >
                              🍽️
                            </Text>
                          )}

                          <Text
                            style={
                              styles.categoryName
                            }
                            numberOfLines={
                              1
                            }
                          >
                            {
                              category.name
                            }
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </ScrollView>
              )}

              {/* ================= FOOD HEADER ================= */}

              <View
                style={
                  styles.sectionHeader
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  {selectedCategory
                    ? selectedCategory.name
                    : "Popular Near You 🔥"}
                </Text>

                <TouchableOpacity
                  onPress={
                    handleSeeAll
                  }
                  activeOpacity={
                    0.7
                  }
                >
                  <Text
                    style={
                      styles.seeAll
                    }
                  >
                    See All
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ================= FOOD ================= */}

              {filteredFoods.length ===
              0 ? (
                <View
                  style={
                    styles.noFoodBox
                  }
                >
                  <Text
                    style={
                      styles.noFoodEmoji
                    }
                  >
                    🍽️
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    {selectedCategory
                      ? `No food available in ${selectedCategory.name}`
                      : "No food items available"}
                  </Text>
                </View>
              ) : (
                filteredFoods.map(
                  (
                    food,
                    index
                  ) => (
                    <View
                      key={`${food._id}-${index}`}
                      style={
                        styles.foodCard
                      }
                    >
                      <View
                        style={
                          styles.foodImage
                        }
                      >
                        {food.image ? (
                          <Image
                            source={{
                              uri: food.image,
                            }}
                            style={
                              styles.foodImageReal
                            }
                            resizeMode="cover"
                            onError={() =>
                              console.log(
                                "❌ FOOD IMAGE ERROR:",
                                food.image
                              )
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

                      <View
                        style={
                          styles.foodInfo
                        }
                      >
                        <Text
                          style={
                            styles.foodName
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {food.name}
                        </Text>

                        <Text
                          style={
                            styles.foodDescription
                          }
                          numberOfLines={
                            2
                          }
                        >
                          {food.description ||
                            "Fresh and delicious street food"}
                        </Text>

                        <View
                          style={
                            styles.foodBottom
                          }
                        >
                          <Text
                            style={
                              styles.price
                            }
                          >
                            ₹{food.price}
                          </Text>

                          <TouchableOpacity
                            style={
                              styles.addButton
                            }
                            activeOpacity={
                              0.8
                            }
                            onPress={() =>
                              handleAddToCart(
                                food
                              )
                            }
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
                  )
                )
              )}
            </>
          )}

        <View
          style={
            styles.bottomSpace
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#FFF8F0",
    },

    container: {
      padding: 20,
    },

    // =====================================================
    // HEADER
    // =====================================================

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },

    headerButtons: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
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

    // =====================================================
    // PROFILE
    // =====================================================

    profileButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
      elevation: 4,
    },

    profileIcon: {
      fontSize: 22,
    },

    // =====================================================
    // CART
    // =====================================================

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

    // =====================================================
    // ADMIN BANNER
    // =====================================================

    adminBannerSection: {
      marginBottom: 18,
    },

    adminBanner: {
      backgroundColor: "#FFFFFF",
      borderRadius: 20,
      overflow: "hidden",
      elevation: 4,
      borderWidth: 1,
      borderColor: "#FFE0E0",
      marginBottom: 12,
    },

    adminBannerImage: {
      width: "100%",
      height: 170,
      backgroundColor: "#FFF0F0",
    },

    adminBannerContent: {
      padding: 16,
    },

    adminBannerType: {
      alignSelf: "flex-start",
      backgroundColor: "#FFF0F0",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      marginBottom: 8,
    },

    adminBannerTypeText: {
      color: "#E53935",
      fontSize: 10,
      fontWeight: "900",
    },

    adminBannerTitle: {
      color: "#222222",
      fontSize: 19,
      fontWeight: "900",
    },

    adminBannerMessage: {
      color: "#666666",
      fontSize: 13,
      lineHeight: 19,
      marginTop: 6,
    },

    // =====================================================
    // LOCATION
    // =====================================================

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

    // =====================================================
    // DEFAULT BANNER
    // =====================================================

    banner: {
      backgroundColor: "#E53935",
      borderRadius: 24,
      padding: 22,
      minHeight: 190,
      flexDirection: "row",
      overflow: "hidden",
      marginBottom: 18,
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

    // =====================================================
    // LIVE UPDATE
    // =====================================================

    liveUpdateBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      backgroundColor: "#FFF0F0",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
      marginBottom: 15,
    },

    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#22C55E",
      marginRight: 7,
    },

    liveUpdateText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#E53935",
    },

    // =====================================================
    // CART SUCCESS MESSAGE
    // =====================================================

    cartMessageBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: 18,
      padding: 12,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: "#D7F5DF",
      elevation: 4,
    },

    cartMessageIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: "#22C55E",
      justifyContent: "center",
      alignItems: "center",
    },

    cartMessageIconText: {
      color: "#FFFFFF",
      fontSize: 22,
      fontWeight: "900",
    },

    cartMessageContent: {
      flex: 1,
      marginLeft: 10,
      marginRight: 8,
    },

    cartMessageTitle: {
      fontSize: 13,
      fontWeight: "900",
      color: "#222222",
    },

    cartMessageText: {
      fontSize: 11,
      color: "#666666",
      marginTop: 2,
    },

    cartMessageButton: {
      backgroundColor: "#E53935",
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderRadius: 14,
    },

    cartMessageButtonText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "800",
    },

    // =====================================================
    // HELP & SUPPORT
    // =====================================================

    helpSupportButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFF3E8",
      borderRadius: 18,
      padding: 14,
      marginBottom: 22,
      borderWidth: 1,
      borderColor: "#FFE0C2",
    },

    helpIconBox: {
      width: 50,
      height: 50,
      borderRadius: 15,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },

    helpIcon: {
      fontSize: 27,
    },

    helpTextContainer: {
      flex: 1,
      marginLeft: 12,
    },

    helpTitle: {
      fontSize: 17,
      fontWeight: "900",
      color: "#222222",
    },

    helpSubtitle: {
      fontSize: 12,
      color: "#777777",
      marginTop: 4,
    },

    helpArrow: {
      fontSize: 30,
      color: "#E65100",
      marginLeft: 8,
    },

    // =====================================================
    // LOADING
    // =====================================================

    loadingBox: {
      alignItems: "center",
      paddingVertical: 30,
    },

    loadingText: {
      marginTop: 10,
      color: "#777",
      fontSize: 14,
    },

    // =====================================================
    // ERROR
    // =====================================================

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

    // =====================================================
    // SECTION
    // =====================================================

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

    // =====================================================
    // CATEGORIES
    // =====================================================

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
      paddingHorizontal: 6,
      borderWidth: 2,
      borderColor: "transparent",
    },

    selectedCategoryCard: {
      borderColor: "#E53935",
      backgroundColor: "#FFF0F0",
    },

    categoryImage: {
      width: 52,
      height: 52,
      borderRadius: 26,
      marginBottom: 7,
    },

    categoryEmoji: {
      fontSize: 36,
      marginBottom: 8,
    },

    categoryName: {
      fontSize: 12,
      fontWeight: "700",
      color: "#333",
      textAlign: "center",
    },

    // =====================================================
    // FOOD
    // =====================================================

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
      overflow: "hidden",
    },

    foodImageReal: {
      width: "100%",
      height: "100%",
    },

    foodEmoji: {
      fontSize: 55,
    },

    foodInfo: {
      flex: 1,
      paddingLeft: 14,
      justifyContent: "space-between",
      minWidth: 0,
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

    // =====================================================
    // EMPTY
    // =====================================================

    emptyText: {
      color: "#888",
      marginBottom: 25,
      textAlign: "center",
    },

    noFoodBox: {
      alignItems: "center",
      paddingVertical: 10,
    },

    noFoodEmoji: {
      fontSize: 42,
      marginBottom: 5,
    },

    // =====================================================
    // BOTTOM
    // =====================================================

    bottomSpace: {
      height: 30,
    }, 
  });