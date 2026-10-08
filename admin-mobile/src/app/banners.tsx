import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { uploadImage } from "../imageUpload";

const API_URL =
  "https://streetfoodplatform-1.onrender.com/api";

type BannerType =
  | "offer"
  | "important"
  | "festival"
  | "delivery"
  | "general";

interface Banner {
  _id: string;
  title: string;
  message?: string;
  image?: string;
  type: BannerType;
  isActive: boolean;
  sortOrder?: number;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
}

const bannerTypes: {
  value: BannerType;
  label: string;
  icon: string;
}[] = [
  {
    value: "offer",
    label: "Offer",
    icon: "🎁",
  },
  {
    value: "important",
    label: "Important",
    icon: "⚠️",
  },
  {
    value: "festival",
    label: "Festival",
    icon: "🎉",
  },
  {
    value: "delivery",
    label: "Delivery",
    icon: "🛵",
  },
  {
    value: "general",
    label: "General",
    icon: "📢",
  },
];

export default function BannersScreen() {
  const router = useRouter();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [editingBanner, setEditingBanner] =
    useState<Banner | null>(null);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState("");
  const [type, setType] =
    useState<BannerType>("general");
  const [isActive, setIsActive] =
    useState(true);
  const [sortOrder, setSortOrder] =
    useState("0");

  // =========================================
  // GET TOKEN
  // =========================================

  const getToken = async () => {
    const token =
      await AsyncStorage.getItem(
        "adminToken"
      );

    if (!token) {
      router.replace("/");
      throw new Error(
        "Admin token not found."
      );
    }

    return token;
  };

  // =========================================
  // LOAD BANNERS
  // =========================================

  const fetchBanners = async () => {
    try {
      const token = await getToken();

      const response = await fetch(
        `${API_URL}/banners`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        await AsyncStorage.removeItem(
          "adminToken"
        );

        await AsyncStorage.removeItem(
          "adminData"
        );

        router.replace("/");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to load banners."
        );
      }

      const bannerList =
        Array.isArray(data)
          ? data
          : data?.banners || [];

      setBanners(bannerList);
    } catch (error: any) {
      console.log(
        "❌ FETCH BANNERS ERROR:",
        error
      );

      Alert.alert(
        "Error",
        error?.message ||
          "Unable to load banners."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================
  // SCREEN FOCUS
  // =========================================

  useFocusEffect(
    useCallback(() => {
      fetchBanners();
    }, [])
  );

  // =========================================
  // REFRESH
  // =========================================

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBanners();
  };

  // =========================================
  // RESET FORM
  // =========================================

  const resetForm = () => {
    setEditingBanner(null);
    setTitle("");
    setMessage("");
    setImage("");
    setType("general");
    setIsActive(true);
    setSortOrder("0");
  };

  // =========================================
  // OPEN ADD
  // =========================================

  const openAddBanner = () => {
    resetForm();
    setModalVisible(true);
  };

  // =========================================
  // OPEN EDIT
  // =========================================

  const openEditBanner = (
    banner: Banner
  ) => {
    setEditingBanner(banner);

    setTitle(
      banner.title || ""
    );

    setMessage(
      banner.message || ""
    );

    setImage(
      banner.image || ""
    );

    setType(
      banner.type || "general"
    );

    setIsActive(
      banner.isActive !== false
    );

    setSortOrder(
      String(
        banner.sortOrder ?? 0
      )
    );

    setModalVisible(true);
  };

  // =========================================
  // CLOSE MODAL
  // =========================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalVisible(false);
    resetForm();
  };

  // =========================================
  // PICK IMAGE
  // =========================================

  const pickBannerImage = async () => {
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
            aspect: [16, 7],
            quality: 0.85,
          }
        );

      if (result.canceled) {
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

      console.log(
        "🖼️ BANNER IMAGE SELECTED:",
        asset.uri
      );

      setSaving(true);

      const mimeType =
        asset.mimeType ||
        "image/jpeg";

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

      setImage(uploadedUrl);

      Alert.alert(
        "Success",
        "Banner image upload ho gayi."
      );
    } catch (error: any) {
      console.log(
        "❌ BANNER IMAGE ERROR:",
        error
      );

      Alert.alert(
        "Upload Failed",
        error?.message ||
          "Banner image upload nahi ho paayi."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // SAVE BANNER
  // =========================================

  const saveBanner = async () => {
    try {
      const cleanTitle =
        title.trim();

      const cleanMessage =
        message.trim();

      const cleanImage =
        image.trim();

      if (!cleanTitle) {
        Alert.alert(
          "Title Required",
          "Banner ka title enter karo."
        );

        return;
      }

      if (
        !cleanMessage &&
        !cleanImage
      ) {
        Alert.alert(
          "Content Required",
          "Banner me message ya image me se kam se kam ek hona chahiye."
        );

        return;
      }

      const token = await getToken();

      setSaving(true);

      const payload = {
        title: cleanTitle,
        message: cleanMessage,
        image: cleanImage,
        type,
        isActive,
        sortOrder:
          Number(sortOrder) || 0,
      };

      const url =
        editingBanner
          ? `${API_URL}/banners/${editingBanner._id}`
          : `${API_URL}/banners`;

      const method =
        editingBanner
          ? "PUT"
          : "POST";

      console.log(
        "📢 SAVING BANNER:",
        payload
      );

      const response =
        await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            payload
          ),
        });

      const data =
        await response.json();

      if (response.status === 401) {
        await AsyncStorage.removeItem(
          "adminToken"
        );

        await AsyncStorage.removeItem(
          "adminData"
        );

        router.replace("/");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to save banner."
        );
      }

      Alert.alert(
        "Success ✅",
        editingBanner
          ? "Banner updated successfully."
          : "Banner created successfully."
      );

      setModalVisible(false);
      resetForm();

      await fetchBanners();
    } catch (error: any) {
      console.log(
        "❌ SAVE BANNER ERROR:",
        error
      );

      Alert.alert(
        "Save Failed",
        error?.message ||
          "Banner save nahi ho paya."
      );
    } finally {
      setSaving(false);
    }
  };
  // =========================================
// SEND CUSTOMER NOTIFICATION
// =========================================

const sendBannerNotification = (
  banner: Banner
) => {
  Alert.alert(
    "Send Notification 📢",
    `"${banner.title}" ka notification sabhi customers ko bhejna hai?`,
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Send",
        onPress: async () => {
          try {
            const token =
              await getToken();

            console.log(
              "📢 SENDING BANNER NOTIFICATION:",
              banner._id
            );

            const response =
              await fetch(
                `${API_URL}/banners/${banner._id}/send-notification`,
                {
                  method: "POST",
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                    "Content-Type":
                      "application/json",
                  },
                }
              );

            const data =
              await response.json();

            console.log(
              "📢 BANNER NOTIFICATION RESPONSE:",
              data
            );

            if (response.status === 401) {
              await AsyncStorage.removeItem(
                "adminToken"
              );

              await AsyncStorage.removeItem(
                "adminData"
              );

              router.replace("/");
              return;
            }

            if (!response.ok) {
              throw new Error(
                data?.message ||
                  "Notification send nahi ho paayi."
              );
            }

            Alert.alert(
              "Notification Sent ✅",
              `Customer notification successfully send ho gayi.\n\nSent: ${
                data?.sent ?? 0
              } / ${
                data?.total ?? 0
              }`
            );
          } catch (error: any) {
            console.log(
              "❌ SEND BANNER NOTIFICATION ERROR:",
              error
            );

            Alert.alert(
              "Notification Failed",
              error?.message ||
                "Customer notification send nahi ho paayi."
            );
          }
        },
      },
    ]
  );
};

  // =========================================
  // DELETE
  // =========================================

  const deleteBanner = (
    banner: Banner
  ) => {
    Alert.alert(
      "Delete Banner",
      `Are you sure you want to delete "${banner.title}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token =
                await getToken();

              const response =
                await fetch(
                  `${API_URL}/banners/${banner._id}`,
                  {
                    method: "DELETE",
                    headers: {
                      Authorization:
                        `Bearer ${token}`,
                      "Content-Type":
                        "application/json",
                    },
                  }
                );

              const data =
                await response.json();

              if (!response.ok) {
                throw new Error(
                  data?.message ||
                    "Failed to delete banner."
                );
              }

              Alert.alert(
                "Deleted ✅",
                "Banner delete ho gaya."
              );

              await fetchBanners();
            } catch (error: any) {
              console.log(
                "❌ DELETE BANNER ERROR:",
                error
              );

              Alert.alert(
                "Delete Failed",
                error?.message ||
                  "Banner delete nahi ho paya."
              );
            }
          },
        },
      ]
    );
  };

  // =========================================
  // TOGGLE ACTIVE
  // =========================================

  const toggleBanner = async (
    banner: Banner
  ) => {
    try {
      const token =
        await getToken();

      const newActive =
        !banner.isActive;

      const response =
        await fetch(
          `${API_URL}/banners/${banner._id}`,
          {
            method: "PUT",
            headers: {
              Authorization:
                `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              isActive: newActive,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to update banner."
        );
      }

      setBanners(
        (previous) =>
          previous.map(
            (item) =>
              item._id ===
              banner._id
                ? {
                    ...item,
                    isActive:
                      newActive,
                  }
                : item
          )
      );
    } catch (error: any) {
      console.log(
        "❌ TOGGLE BANNER ERROR:",
        error
      );

      Alert.alert(
        "Update Failed",
        error?.message ||
          "Banner status update nahi hua."
      );
    }
  };

  // =========================================
  // TYPE INFO
  // =========================================

  const getTypeInfo = (
    bannerType: BannerType
  ) => {
    return (
      bannerTypes.find(
        (item) =>
          item.value ===
          bannerType
      ) ||
      bannerTypes[4]
    );
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#ff6b00"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading banners...
        </Text>
      </View>
    );
  }

  // =========================================
  // UI
  // =========================================

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[
              "#ff6b00",
            ]}
          />
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View
            style={
              styles.headerTop
            }
          >
            <TouchableOpacity
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
                ←
              </Text>
            </TouchableOpacity>

            <View
              style={
                styles.headerTextBox
              }
            >
              <Text
                style={
                  styles.smallTitle
                }
              >
                STREET FOOD
              </Text>

              <Text
                style={
                  styles.title
                }
              >
                Banners
              </Text>
            </View>

            <TouchableOpacity
              style={
                styles.addButton
              }
              onPress={
                openAddBanner
              }
            >
              <Text
                style={
                  styles.addButtonText
                }
              >
                ＋
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={
              styles.subtitle
            }
          >
            Customer ko important
            information, offers aur
            announcements bhejo.
          </Text>
        </View>

        {/* INFO */}

        <View
          style={
            styles.infoCard
          }
        >
          <Text
            style={
              styles.infoIcon
            }
          >
            📢
          </Text>

          <View
            style={
              styles.infoContent
            }
          >
            <Text
              style={
                styles.infoTitle
              }
            >
              Customer Announcement
            </Text>

            <Text
              style={
                styles.infoText
              }
            >
              Active banner customer
              app ke Home page par
              show hoga.
            </Text>
          </View>
        </View>

        {/* BANNERS */}

        <View
          style={
            styles.listHeader
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            All Banners
          </Text>

          <Text
            style={
              styles.countText
            }
          >
            {banners.length} banners
          </Text>
        </View>

        {banners.length === 0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <Text
              style={
                styles.emptyIcon
              }
            >
              📢
            </Text>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No Banners Yet
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              + button se apna pehla
              customer banner create
              karo.
            </Text>

            <TouchableOpacity
              style={
                styles.emptyAddButton
              }
              onPress={
                openAddBanner
              }
            >
              <Text
                style={
                  styles.emptyAddButtonText
                }
              >
                ＋ Create Banner
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          banners.map(
            (banner) => {
              const typeInfo =
                getTypeInfo(
                  banner.type
                );

              return (
                <View
                  key={
                    banner._id
                  }
                  style={
                    styles.bannerCard
                  }
                >
                  {/* IMAGE */}

                  {banner.image ? (
                    <Image
                      source={{
                        uri: banner.image,
                      }}
                      style={
                        styles.bannerImage
                      }
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={
                        styles.noImageBox
                      }
                    >
                      <Text
                        style={
                          styles.noImageIcon
                        }
                      >
                        {typeInfo.icon}
                      </Text>

                      <Text
                        style={
                          styles.noImageText
                        }
                      >
                        Text Banner
                      </Text>
                    </View>
                  )}

                  {/* CONTENT */}

                  <View
                    style={
                      styles.bannerContent
                    }
                  >
                    <View
                      style={
                        styles.bannerTopRow
                      }
                    >
                      <View
                        style={
                          styles.typeBadge
                        }
                      >
                        <Text
                          style={
                            styles.typeBadgeText
                          }
                        >
                          {
                            typeInfo.icon
                          }{" "}
                          {
                            typeInfo.label
                          }
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.activeBadge,
                          {
                            backgroundColor:
                              banner.isActive
                                ? "#dcfce7"
                                : "#fee2e2",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.activeBadgeText,
                            {
                              color:
                                banner.isActive
                                  ? "#15803d"
                                  : "#dc2626",
                            },
                          ]}
                        >
                          {banner.isActive
                            ? "ACTIVE"
                            : "INACTIVE"}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={
                        styles.bannerTitle
                      }
                    >
                      {banner.title}
                    </Text>

                    {banner.message ? (
                      <Text
                        style={
                          styles.bannerMessage
                        }
                        numberOfLines={
                          4
                        }
                      >
                        {
                          banner.message
                        }
                      </Text>
                    ) : null}

                    <Text
                      style={
                        styles.sortText
                      }
                    >
                      Sort Order:{" "}
                      {banner.sortOrder ??
                        0}
                    </Text>

                    {/* ACTIONS */}

                    <View
                      style={
                        styles.actionRow
                      }
                    >
                      <TouchableOpacity
                        style={
                          styles.editButton
                        }
                        onPress={() =>
                          openEditBanner(
                            banner
                          )
                        }
                      >
                        <Text
                          style={
                            styles.editButtonText
                          }
                        >
                          ✏️ Edit
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={
                          styles.toggleButton
                        }
                        onPress={() =>
                          toggleBanner(
                            banner
                          )
                        }
                      >
                        <Text
                          style={
                            styles.toggleButtonText
                          }
                        >
                          {banner.isActive
                            ? "⏸ Disable"
                            : "▶️ Activate"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
  style={styles.notificationButton}
  onPress={() =>
    sendBannerNotification(
      banner
    )
  }
>
  <Text
    style={
      styles.notificationButtonText
    }
  >
    📢 Send
  </Text>
</TouchableOpacity>

                      <TouchableOpacity
                        style={
                          styles.deleteButton
                        }
                        onPress={() =>
                          deleteBanner(
                            banner
                          )
                        }
                      >
                        <Text
                          style={
                            styles.deleteButtonText
                          }
                        >
                          🗑️
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }
          )
        )}

        <View
          style={
            styles.bottomSpace
          }
        />
      </ScrollView>

      {/* ================================= */}
      {/* ADD / EDIT MODAL */}
      {/* ================================= */}

      <Modal
        visible={
          modalVisible
        }
        transparent
        animationType="slide"
        onRequestClose={
          closeModal
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            {/* MODAL HEADER */}

            <View
              style={
                styles.modalHeader
              }
            >
              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  {editingBanner
                    ? "Edit Banner"
                    : "Create Banner"}
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Customer ke Home
                  page ke liye
                  announcement
                </Text>
              </View>

              <TouchableOpacity
                style={
                  styles.closeButton
                }
                onPress={
                  closeModal
                }
                disabled={
                  saving
                }
              >
                <Text
                  style={
                    styles.closeText
                  }
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="handled"
            >
              {/* TITLE */}

              <Text
                style={
                  styles.inputLabel
                }
              >
                Title *
              </Text>

              <TextInput
                style={
                  styles.input
                }
                placeholder="Example: Today 20% OFF"
                placeholderTextColor="#94a3b8"
                value={title}
                onChangeText={
                  setTitle
                }
              />

              {/* MESSAGE */}

              <Text
                style={
                  styles.inputLabel
                }
              >
                Message
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                ]}
                placeholder="Customer ko kya batana hai?"
                placeholderTextColor="#94a3b8"
                value={message}
                onChangeText={
                  setMessage
                }
                multiline
                textAlignVertical="top"
              />

              {/* TYPE */}

              <Text
                style={
                  styles.inputLabel
                }
              >
                Banner Type
              </Text>

              <View
                style={
                  styles.typeContainer
                }
              >
                {bannerTypes.map(
                  (
                    item
                  ) => (
                    <TouchableOpacity
                      key={
                        item.value
                      }
                      style={[
                        styles.typeButton,
                        type ===
                          item.value &&
                          styles.typeButtonActive,
                      ]}
                      onPress={() =>
                        setType(
                          item.value
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          type ===
                            item.value &&
                            styles.typeButtonTextActive,
                        ]}
                      >
                        {
                          item.icon
                        }{" "}
                        {
                          item.label
                        }
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              {/* IMAGE */}

              <Text
                style={
                  styles.inputLabel
                }
              >
                Banner Image
              </Text>

              <TouchableOpacity
                style={
                  styles.uploadButton
                }
                onPress={
                  pickBannerImage
                }
                disabled={
                  saving
                }
              >
                <Text
                  style={
                    styles.uploadButtonText
                  }
                >
                  🖼️{" "}
                  {image
                    ? "Change Image"
                    : "Upload Image"}
                </Text>
              </TouchableOpacity>

              {image ? (
                <View
                  style={
                    styles.previewBox
                  }
                >
                  <Image
                    source={{
                      uri: image,
                    }}
                    style={
                      styles.previewImage
                    }
                    resizeMode="cover"
                  />

                  <TouchableOpacity
                    style={
                      styles.removeImageButton
                    }
                    onPress={() =>
                      setImage(
                        ""
                      )
                    }
                    disabled={
                      saving
                    }
                  >
                    <Text
                      style={
                        styles.removeImageText
                      }
                    >
                      ✕ Remove Image
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* MANUAL URL */}

              <Text
                style={
                  styles.inputLabel
                }
              >
                Or Image URL
              </Text>

              <TextInput
                style={
                  styles.input
                }
                placeholder="https://..."
                placeholderTextColor="#94a3b8"
                value={image}
                onChangeText={
                  setImage
                }
                autoCapitalize="none"
              />

              {/* SORT ORDER */}

              <Text
                style={
                  styles.inputLabel
                }
              >
                Sort Order
              </Text>

              <TextInput
                style={
                  styles.input
                }
                placeholder="0"
                placeholderTextColor="#94a3b8"
                value={sortOrder}
                onChangeText={
                  setSortOrder
                }
                keyboardType="numeric"
              />

              {/* ACTIVE */}

              <View
                style={
                  styles.switchRow
                }
              >
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    style={
                      styles.switchTitle
                    }
                  >
                    Show to Customers
                  </Text>

                  <Text
                    style={
                      styles.switchSubtitle
                    }
                  >
                    Active banner customer
                    app me visible hoga.
                  </Text>
                </View>

                <Switch
                  value={
                    isActive
                  }
                  onValueChange={
                    setIsActive
                  }
                  trackColor={{
                    false:
                      "#cbd5e1",
                    true:
                      "#fdba74",
                  }}
                  thumbColor={
                    isActive
                      ? "#ff6b00"
                      : "#f8fafc"
                  }
                />
              </View>

              {/* SAVE */}

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  saving && {
                    opacity: 0.6,
                  },
                ]}
                onPress={
                  saveBanner
                }
                disabled={
                  saving
                }
              >
                {saving ? (
                  <ActivityIndicator
                    color="#ffffff"
                  />
                ) : (
                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    {editingBanner
                      ? "Update Banner"
                      : "Create Banner"}
                  </Text>
                )}
              </TouchableOpacity>

              <View
                style={{
                  height: 30,
                }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =========================================
// STYLES
// =========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fb",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: "#ffffff",
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    fontSize: 25,
    fontWeight: "800",
    color: "#111827",
  },

  headerTextBox: {
    flex: 1,
    marginLeft: 12,
  },

  smallTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#ff6b00",
    letterSpacing: 1.5,
  },

  title: {
    marginTop: 2,
    fontSize: 25,
    fontWeight: "900",
    color: "#111827",
  },

  subtitle: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748b",
  },

  addButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#ff6b00",
    justifyContent: "center",
    alignItems: "center",
  },

  addButtonText: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "500",
    lineHeight: 32,
  },

  infoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 15,
    borderRadius: 18,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    fontSize: 30,
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
  },

  infoText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    color: "#64748b",
  },

  listHeader: {
    marginTop: 22,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
  },

  countText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },

  emptyCard: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 30,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },

  emptyIcon: {
    fontSize: 48,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: "#64748b",
  },

  emptyAddButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#ff6b00",
  },

  emptyAddButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },

  bannerCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  bannerImage: {
    width: "100%",
    height: 170,
    backgroundColor: "#f1f5f9",
  },

  noImageBox: {
    width: "100%",
    height: 130,
    backgroundColor: "#fff7ed",
    justifyContent: "center",
    alignItems: "center",
  },

  noImageIcon: {
    fontSize: 38,
  },

  noImageText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
  },

  bannerContent: {
    padding: 16,
  },

  bannerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },

  typeBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#475569",
  },

  activeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
  },

  activeBadgeText: {
    fontSize: 10,
    fontWeight: "900",
  },

  bannerTitle: {
    marginTop: 12,
    fontSize: 19,
    fontWeight: "900",
    color: "#111827",
  },

  bannerMessage: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748b",
  },

  sortText: {
    marginTop: 9,
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "700",
  },

  actionRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
  },

  editButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    justifyContent: "center",
    alignItems: "center",
  },

  editButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#ea580c",
  },

  toggleButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },

  toggleButtonText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#334155",
  },
  notificationButton: {
  flex: 1,
  minHeight: 42,
  borderRadius: 12,
  backgroundColor: "#eff6ff",
  borderWidth: 1,
  borderColor: "#bfdbfe",
  justifyContent: "center",
  alignItems: "center",
},

notificationButtonText: {
  fontSize: 11,
  fontWeight: "900",
  color: "#2563eb",
},

  deleteButton: {
    width: 46,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },

  deleteButtonText: {
    fontSize: 17,
  },

  bottomSpace: {
    height: 50,
  },

  // =======================================
  // MODAL
  // =======================================

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    padding: 20,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#111827",
  },

  modalSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#64748b",
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },

  closeText: {
    fontSize: 19,
    fontWeight: "900",
    color: "#334155",
  },

  inputLabel: {
    marginTop: 13,
    marginBottom: 7,
    fontSize: 13,
    fontWeight: "900",
    color: "#334155",
  },

  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 13,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f8fafc",
  },

  textArea: {
    minHeight: 105,
    paddingTop: 13,
    paddingBottom: 13,
  },

  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  typeButton: {
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  typeButtonActive: {
    backgroundColor: "#fff7ed",
    borderColor: "#ff6b00",
  },

  typeButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
  },

  typeButtonTextActive: {
    color: "#ea580c",
  },

  uploadButton: {
    minHeight: 50,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#ffb77a",
    backgroundColor: "#fff7ed",
    justifyContent: "center",
    alignItems: "center",
  },

  uploadButtonText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#ea580c",
  },

  previewBox: {
    marginTop: 10,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
  },

  previewImage: {
    width: "100%",
    height: 150,
  },

  removeImageButton: {
    minHeight: 42,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },

  removeImageText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "900",
  },

  switchRow: {
    marginTop: 18,
    padding: 14,
    borderRadius: 15,
    backgroundColor: "#f8fafc",
    flexDirection: "row",
    alignItems: "center",
  },

  switchTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
  },

  switchSubtitle: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 17,
    color: "#64748b",
  },

  saveButton: {
    marginTop: 20,
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: "#ff6b00",
    justifyContent: "center",
    alignItems: "center",
  },

  saveButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
});