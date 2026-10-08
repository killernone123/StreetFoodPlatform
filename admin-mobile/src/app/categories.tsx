import React, { useEffect, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

import { uploadImage } from "../imageUpload";

const API_URL =
  "https://streetfoodplatform-1.onrender.com/api";

type Category = {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  isActive?: boolean;
  sortOder?: number;
};

export default function CategoriesScreen() {
  const router = useRouter();

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");
  const [sortOder, setSortOder] =
    useState("1");

  const [isActive, setIsActive] =
    useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  // =========================
  // GET CATEGORIES
  // =========================

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const url =
        `${API_URL}/categories/admin/all`;

      console.log(
        "📡 FETCH CATEGORY URL:",
        url
      );

      const response =
        await fetch(url);

      console.log(
        "📡 FETCH CATEGORY STATUS:",
        response.status
      );

      const responseText =
        await response.text();

      console.log(
        "📦 FETCH CATEGORY RAW RESPONSE:",
        responseText
      );

      let data;

      try {
        data =
          JSON.parse(responseText);
      } catch (parseError) {
        console.log(
          "❌ CATEGORY JSON PARSE ERROR:",
          parseError
        );

        Alert.alert(
          "Server Error",
          `Server ne valid JSON nahi bheja.\nStatus: ${response.status}`
        );

        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        Alert.alert(
          "Category Error",
          data.message ||
            `Categories load failed (${response.status})`
        );

        return;
      }

      setCategories(
        data.categories || []
      );

    } catch (error: any) {
      console.log(
        "❌ FETCH CATEGORY ERROR:",
        error
      );

      Alert.alert(
        "Category Error",
        error?.message ||
          "Categories load nahi ho rahi hain"
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================
  // OPEN ADD
  // =========================

  const openAddModal = () => {
    setEditingCategory(null);

    setName("");
    setSlug("");
    setImage("");

    setSortOder(
      String(categories.length + 1)
    );

    setIsActive(true);

    setModalVisible(true);
  };

  // =========================
  // OPEN EDIT
  // =========================

  const openEditModal = (
    category: Category
  ) => {
    setEditingCategory(category);

    setName(category.name || "");

    setSlug(category.slug || "");

    setImage(
      category.image || ""
    );

    setSortOder(
      String(
        category.sortOder ?? 1
      )
    );

    setIsActive(
      category.isActive !== false
    );

    setModalVisible(true);
  };

  // =========================
  // PICK + UPLOAD IMAGE
  // =========================

  const pickCategoryImage =
    async () => {
      try {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Permission Required",
            "Gallery permission allow karo."
          );

          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes: ["images"],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.9,
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
          "📱 SELECTED IMAGE:",
          asset.uri
        );

        setUploadingImage(true);

        Alert.alert(
          "Uploading",
          "Image Cloudinary par upload ho rahi hai..."
        );

        const cloudinaryUrl =
          await uploadImage(
            asset.uri,
            asset.mimeType
          );

        console.log(
          "☁️ CLOUDINARY URL:",
          cloudinaryUrl
        );

        setImage(
          cloudinaryUrl
        );

        Alert.alert(
          "Success",
          "Image successfully upload ho gayi."
        );

      } catch (error: any) {
        console.log(
          "❌ CATEGORY IMAGE ERROR:",
          error
        );

        Alert.alert(
          "Upload Failed",
          error?.message ||
            "Image upload failed."
        );

      } finally {
        setUploadingImage(false);
      }
    };

  // =========================
  // SAVE CATEGORY
  // =========================

  const saveCategory = async () => {
    if (!name.trim()) {
      Alert.alert(
        "Required",
        "Category name enter karo"
      );

      return;
    }

    if (!slug.trim()) {
      Alert.alert(
        "Required",
        "Slug enter karo"
      );

      return;
    }

    if (
      uploadingImage
    ) {
      Alert.alert(
        "Please Wait",
        "Image abhi upload ho rahi hai."
      );

      return;
    }

    try {
      setSaving(true);

      const adminToken =
        await AsyncStorage.getItem(
          "adminToken"
        );

      if (!adminToken) {
        Alert.alert(
          "Login Required",
          "Admin login dobara karo"
        );

        return;
      }

      const categoryData = {
        name: name.trim(),

        slug:
          slug.trim().toLowerCase(),

        image:
          image.trim(),

        isActive,

        sortOder:
          Number(sortOder) || 1,
      };

      console.log(
        "📦 CATEGORY DATA:",
        categoryData
      );

      const url =
        editingCategory
          ? `${API_URL}/categories/${editingCategory._id}`
          : `${API_URL}/categories`;

      const method =
        editingCategory
          ? "PUT"
          : "POST";

      const response =
        await fetch(url, {
          method,

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${adminToken}`,
          },

          body:
            JSON.stringify(
              categoryData
            ),
        });

      const data =
        await response.json();

      console.log(
        "📡 SAVE CATEGORY RESPONSE:",
        response.status,
        data
      );

      if (
        !response.ok ||
        !data.success
      ) {
        Alert.alert(
          "Error",
          data.message ||
            "Category save nahi hui"
        );

        return;
      }

      Alert.alert(
        "Success",
        editingCategory
          ? "Category update ho gayi"
          : "Category add ho gayi"
      );

      setModalVisible(false);

      await fetchCategories();

    } catch (error) {
      console.log(
        "SAVE CATEGORY ERROR:",
        error
      );

      Alert.alert(
        "Error",
        "Category save karte time problem hui"
      );

    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE CATEGORY
  // =========================

  const deleteCategory = (
    category: Category
  ) => {
    Alert.alert(
      "Delete Category",
      `"${category.name}" ko delete karna hai?`,
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
              category._id
            ),
        },
      ]
    );
  };

  const performDelete =
    async (id: string) => {
      try {
        const adminToken =
          await AsyncStorage.getItem(
            "adminToken"
          );

        if (!adminToken) {
          Alert.alert(
            "Error",
            "Admin token nahi mila"
          );

          return;
        }

        const response =
          await fetch(
            `${API_URL}/categories/${id}`,
            {
              method: "DELETE",

              headers: {
                Authorization:
                  `Bearer ${adminToken}`,
              },
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          Alert.alert(
            "Error",
            data.message ||
              "Category delete nahi hui"
          );

          return;
        }

        Alert.alert(
          "Success",
          "Category delete ho gayi"
        );

        await fetchCategories();

      } catch (error) {
        console.log(
          "DELETE CATEGORY ERROR:",
          error
        );

        Alert.alert(
          "Error",
          "Category delete karte time problem hui"
        );
      }
    };

  // =========================
  // TOGGLE ACTIVE
  // =========================

  const toggleActive =
    async (
      category: Category
    ) => {
      try {
        const adminToken =
          await AsyncStorage.getItem(
            "adminToken"
          );

        if (!adminToken) {
          Alert.alert(
            "Error",
            "Admin token nahi mila"
          );

          return;
        }

        const newStatus =
          category.isActive === true
            ? false
            : true;

        const response =
          await fetch(
            `${API_URL}/categories/${category._id}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${adminToken}`,
              },

              body:
                JSON.stringify({
                  name:
                    category.name,

                  slug:
                    category.slug,

                  image:
                    category.image ||
                    "",

                  isActive:
                    newStatus,

                  sortOder:
                    Number(
                      category.sortOder
                    ) || 1,
                }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          Alert.alert(
            "Error",
            data.message ||
              "Category status update failed"
          );

          return;
        }

        await fetchCategories();

        Alert.alert(
          "Success",
          newStatus
            ? "Category Active ho gayi"
            : "Category Inactive ho gayi"
        );

      } catch (error: any) {
        console.log(
          "TOGGLE CATEGORY ERROR:",
          error
        );

        Alert.alert(
          "Error",
          error?.message ||
            "Category status update problem"
        );
      }
    };

  // =========================
  // AUTO SLUG
  // =========================

  const handleNameChange =
    (value: string) => {
      setName(value);

      if (!editingCategory) {
        const generatedSlug =
          value
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(
              /[^a-z0-9-]/g,
              ""
            );

        setSlug(
          generatedSlug
        );
      }
    };

  return (
    <SafeAreaView
      style={styles.container}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={styles.backText}
          >
            ‹
          </Text>
        </Pressable>

        <View
          style={styles.headerTitleBox}
        >
          <Text
            style={styles.title}
            numberOfLines={1}
          >
            Categories
          </Text>

          <Text
            style={styles.subtitle}
            numberOfLines={1}
          >
            Add & manage food categories
          </Text>
        </View>

        <Pressable
          style={styles.addButton}
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

      {/* CATEGORY LIST */}

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator
            size="large"
            color="#FF6B00"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Categories loading...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={
            styles.listContainer
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {categories.length ===
          0 ? (
            <View
              style={
                styles.emptyBox
              }
            >
              <Text
                style={
                  styles.emptyIcon
                }
              >
                📂
              </Text>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No Categories
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                + Add button se first
                category add karo.
              </Text>
            </View>
          ) : (
            categories.map(
              (category) => (
                <View
                  key={
                    category._id
                  }
                  style={
                    styles.categoryCard
                  }
                >
                  <View
                    style={
                      styles.categoryInfo
                    }
                  >
                    {/* CATEGORY IMAGE */}

                    {category.image &&
                    (
                      category.image.startsWith(
                        "http://"
                      ) ||
                      category.image.startsWith(
                        "https://"
                      )
                    ) ? (
                      <Image
                        source={{
                          uri:
                            category.image,
                        }}
                        style={
                          styles.categoryImage
                        }
                      />
                    ) : (
                      <View
                        style={
                          styles.categoryIcon
                        }
                      >
                        <Text
                          style={
                            styles.categoryIconText
                          }
                        >
                          🍔
                        </Text>
                      </View>
                    )}

                    <View
                      style={
                        styles.categoryTextBox
                      }
                    >
                      <Text
                        style={
                          styles.categoryName
                        }
                      >
                        {category.name}
                      </Text>

                      <Text
                        style={
                          styles.slug
                        }
                      >
                        /{category.slug}
                      </Text>

                      <Text
                        style={
                          styles.sortText
                        }
                      >
                        Sort Order:{" "}
                        {category.sortOder ??
                          1}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.statusRow
                    }
                  >
                    <Pressable
                      style={[
                        styles.statusBadge,

                        category.isActive
                          ? styles.activeBadge
                          : styles.inactiveBadge,
                      ]}
                      onPress={() =>
                        toggleActive(
                          category
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.statusText,

                          category.isActive
                            ? styles.activeText
                            : styles.inactiveText,
                        ]}
                      >
                        {category.isActive
                          ? "● Active"
                          : "● Inactive"}
                      </Text>
                    </Pressable>
                  </View>

                  <View
                    style={
                      styles.actions
                    }
                  >
                    <Pressable
                      style={
                        styles.editButton
                      }
                      onPress={() =>
                        openEditModal(
                          category
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
                      style={
                        styles.deleteButton
                      }
                      onPress={() =>
                        deleteCategory(
                          category
                        )
                      }
                    >
                      <Text
                        style={
                          styles.deleteText
                        }
                      >
                        🗑️ Delete
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )
            )
          )}
        </ScrollView>
      )}

      {/* ADD / EDIT MODAL */}

      <Modal
        visible={
          modalVisible
        }
        animationType="slide"
        transparent
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalBox
            }
          >
            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="handled"
            >
              <View
                style={
                  styles.modalHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.modalTitle
                    }
                  >
                    {editingCategory
                      ? "Edit Category"
                      : "Add Category"}
                  </Text>

                  <Text
                    style={
                      styles.modalSubtitle
                    }
                  >
                    Category ki details
                    enter karo
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setModalVisible(
                      false
                    )
                  }
                  style={
                    styles.closeButton
                  }
                >
                  <Text
                    style={
                      styles.closeText
                    }
                  >
                    ×
                  </Text>
                </Pressable>
              </View>

              {/* NAME */}

              <Text
                style={styles.label}
              >
                Category Name *
              </Text>

              <TextInput
                style={styles.input}
                placeholder="e.g. Burger"
                placeholderTextColor="#999"
                value={name}
                onChangeText={
                  handleNameChange
                }
              />

              {/* SLUG */}

              <Text
                style={styles.label}
              >
                Slug *
              </Text>

              <TextInput
                style={styles.input}
                placeholder="e.g. burger"
                placeholderTextColor="#999"
                value={slug}
                onChangeText={
                  setSlug
                }
                autoCapitalize="none"
              />

              {/* IMAGE UPLOAD */}

              <Text
                style={styles.label}
              >
                Category Image
              </Text>

              <Pressable
                style={[
                  styles.imagePickerButton,

                  uploadingImage &&
                    styles.disabledButton,
                ]}
                onPress={
                  pickCategoryImage
                }
                disabled={
                  uploadingImage
                }
              >
                {uploadingImage ? (
                  <>
                    <ActivityIndicator
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.imagePickerText
                      }
                    >
                      Uploading...
                    </Text>
                  </>
                ) : (
                  <Text
                    style={
                      styles.imagePickerText
                    }
                  >
                    📷 Choose Image
                  </Text>
                )}
              </Pressable>

              {/* IMAGE PREVIEW */}

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
                  />

                  <View
                    style={
                      styles.previewInfo
                    }
                  >
                    <Text
                      style={
                        styles.previewTitle
                      }
                    >
                      Image Selected
                    </Text>

                    <Text
                      style={
                        styles.previewUrl
                      }
                      numberOfLines={2}
                    >
                      {image}
                    </Text>
                  </View>

                  <Pressable
                    style={
                      styles.removeImageButton
                    }
                    onPress={() =>
                      setImage("")
                    }
                  >
                    <Text
                      style={
                        styles.removeImageText
                      }
                    >
                      Remove
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {/* MANUAL URL */}

              <Text
                style={styles.label}
              >
                Or Image URL
              </Text>

              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor="#999"
                value={image}
                onChangeText={
                  setImage
                }
                autoCapitalize="none"
              />

              {/* SORT */}

              <Text
                style={styles.label}
              >
                Sort Order
              </Text>

              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor="#999"
                value={sortOder}
                onChangeText={
                  setSortOder
                }
                keyboardType="numeric"
              />

              {/* ACTIVE */}

              <Pressable
                style={
                  styles.switchRow
                }
                onPress={() =>
                  setIsActive(
                    !isActive
                  )
                }
              >
                <View>
                  <Text
                    style={
                      styles.switchTitle
                    }
                  >
                    Category Active
                  </Text>

                  <Text
                    style={
                      styles.switchSubtitle
                    }
                  >
                    Customer app me
                    category dikhegi
                  </Text>
                </View>

                <View
                  style={[
                    styles.switch,

                    isActive
                      ? styles.switchOn
                      : styles.switchOff,
                  ]}
                >
                  <View
                    style={[
                      styles.switchCircle,

                      isActive
                        ? styles.circleOn
                        : styles.circleOff,
                    ]}
                  />
                </View>
              </Pressable>

              {/* SAVE */}

              <Pressable
                style={[
                  styles.saveButton,

                  (saving ||
                    uploadingImage) &&
                    styles.disabledButton,
                ]}
                onPress={
                  saveCategory
                }
                disabled={
                  saving ||
                  uploadingImage
                }
              >
                {saving ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    {editingCategory
                      ? "Update Category"
                      : "Save Category"}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F1F1F1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  backText: {
    fontSize: 32,
    lineHeight: 34,
    color: "#222",
  },

  headerTitleBox: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#171717",
  },

  subtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  addButton: {
    backgroundColor: "#FF6B00",
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 12,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#777",
    fontSize: 14,
  },

  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },

  categoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FFF3E8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  categoryIconText: {
    fontSize: 25,
  },

  categoryImage: {
    width: 52,
    height: 52,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: "#FFF3E8",
  },

  categoryTextBox: {
    flex: 1,
  },

  categoryName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#171717",
  },

  slug: {
    marginTop: 3,
    color: "#777",
    fontSize: 13,
  },

  sortText: {
    marginTop: 4,
    color: "#999",
    fontSize: 12,
  },

  statusRow: {
    marginTop: 14,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  activeBadge: {
    backgroundColor: "#E9F9EF",
  },

  inactiveBadge: {
    backgroundColor: "#F3F3F3",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "800",
  },

  activeText: {
    color: "#16A34A",
  },

  inactiveText: {
    color: "#777",
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  editButton: {
    flex: 1,
    backgroundColor: "#FFF3E8",
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
  },

  editText: {
    color: "#E85D00",
    fontWeight: "800",
  },

  deleteButton: {
    flex: 1,
    backgroundColor: "#FFF0F0",
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
  },

  deleteText: {
    color: "#DC2626",
    fontWeight: "800",
  },

  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    marginTop: 30,
  },

  emptyIcon: {
    fontSize: 45,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "800",
    color: "#222",
  },

  emptyText: {
    marginTop: 6,
    color: "#777",
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  modalBox: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: "90%",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#171717",
  },

  modalSubtitle: {
    marginTop: 4,
    color: "#777",
    fontSize: 13,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F1F1",
    justifyContent: "center",
    alignItems: "center",
  },

  closeText: {
    fontSize: 28,
    color: "#444",
    lineHeight: 30,
  },

  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#333",
    marginBottom: 7,
    marginTop: 10,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FAFAFA",
    color: "#222",
    fontSize: 14,
  },

  imagePickerButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#FF6B00",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },

  imagePickerText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  previewBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#FFF8F2",
    borderWidth: 1,
    borderColor: "#FFE0C7",
  },

  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: "#EEEEEE",
  },

  previewInfo: {
    marginTop: 10,
  },

  previewTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#222",
  },

  previewUrl: {
    marginTop: 4,
    fontSize: 11,
    color: "#777",
  },

  removeImageButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#FFE8E8",
    alignItems: "center",
  },

  removeImageText: {
    color: "#DC2626",
    fontWeight: "800",
  },

  switchRow: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#F8F8F8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  switchTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222",
  },

  switchSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: "#888",
  },

  switch: {
    width: 52,
    height: 30,
    borderRadius: 20,
    justifyContent: "center",
    paddingHorizontal: 3,
  },

  switchOn: {
    backgroundColor: "#FF6B00",
  },

  switchOff: {
    backgroundColor: "#D1D5DB",
  },

  switchCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },

  circleOn: {
    alignSelf: "flex-end",
  },

  circleOff: {
    alignSelf: "flex-start",
  },

  saveButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#FF6B00",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },

  disabledButton: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
});