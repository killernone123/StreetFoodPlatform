import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import API from "../services/api";

export default function HelpSupportScreen() {
  const router = useRouter();

  // =====================================================
  // FEEDBACK STATES
  // =====================================================

  const [rating, setRating] = useState(0);

  const [feedback, setFeedback] = useState("");

  const [customerName, setCustomerName] = useState("");

  const [customerPhone, setCustomerPhone] = useState("");

  const [customerEmail, setCustomerEmail] = useState("");

  const [orderNumber, setOrderNumber] = useState("");

  const [feedbackType, setFeedbackType] =
    useState<"FEEDBACK" | "COMPLAINT" | "GENERAL">(
      "FEEDBACK"
    );

  const [submitting, setSubmitting] = useState(false);

  // =====================================================
  // CONTACT DETAILS
  // =====================================================

  const PHONE_NUMBER = "9179725307";

  const WHATSAPP_NUMBER = "9179725307";

  const EMAIL = "support@streetfood.com";

  // =====================================================
  // CALL
  // =====================================================

  const handleCall = async () => {
    try {
      const url = `tel:${PHONE_NUMBER}`;

      const supported =
        await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Call unavailable",
          "Is device par calling available nahi hai."
        );
      }
    } catch (error) {
      console.log("CALL ERROR:", error);

      Alert.alert(
        "Error",
        "Call open nahi ho pa raha."
      );
    }
  };

  // =====================================================
  // WHATSAPP
  // =====================================================

  const handleWhatsApp = async () => {
    try {
      const message =
        "Hello Street Food, mujhe help chahiye.";

      const url =
        `https://wa.me/${WHATSAPP_NUMBER}` +
        `?text=${encodeURIComponent(message)}`;

      const supported =
        await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "WhatsApp unavailable",
          "WhatsApp installed nahi hai."
        );
      }
    } catch (error) {
      console.log(
        "WHATSAPP ERROR:",
        error
      );

      Alert.alert(
        "Error",
        "WhatsApp open nahi ho pa raha."
      );
    }
  };

  // =====================================================
  // EMAIL
  // =====================================================

  const handleEmail = async () => {
    try {
      const url =
        `mailto:${EMAIL}` +
        `?subject=${encodeURIComponent(
          "Street Food Support"
        )}`;

      const supported =
        await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Email unavailable",
          "Email app available nahi hai."
        );
      }
    } catch (error) {
      console.log(
        "EMAIL ERROR:",
        error
      );

      Alert.alert(
        "Error",
        "Email open nahi ho pa raha."
      );
    }
  };

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetFeedbackForm = () => {
    setRating(0);
    setFeedback("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setOrderNumber("");
    setFeedbackType("FEEDBACK");
  };

  // =====================================================
  // SUBMIT FEEDBACK
  // =====================================================

  const handleSubmitFeedback = async () => {
    // ---------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------

    if (!customerName.trim()) {
      Alert.alert(
        "Name Required",
        "Please apna naam enter karein."
      );

      return;
    }

    if (!customerPhone.trim()) {
      Alert.alert(
        "Phone Required",
        "Please apna mobile number enter karein."
      );

      return;
    }

    if (customerPhone.trim().length < 10) {
      Alert.alert(
        "Invalid Phone",
        "Please valid mobile number enter karein."
      );

      return;
    }

    if (rating === 0) {
      Alert.alert(
        "Rating Required",
        "Please apni rating select karein."
      );

      return;
    }

    if (!feedback.trim()) {
      Alert.alert(
        "Feedback Required",
        "Please apna feedback likhein."
      );

      return;
    }

    // ---------------------------------------------------
    // PREVENT DOUBLE SUBMIT
    // ---------------------------------------------------

    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);

      console.log(
        "📤 Sending feedback to server..."
      );

      const response = await API.post(
        "/support",
        {
          customerName:
            customerName.trim(),

          customerPhone:
            customerPhone.trim(),

          customerEmail:
            customerEmail.trim() || undefined,

          orderNumber:
            orderNumber.trim() || undefined,

          type: feedbackType,

          rating: rating,

          subject:
            feedbackType === "COMPLAINT"
              ? "Customer Complaint"
              : feedbackType === "GENERAL"
              ? "General Support"
              : "Customer Feedback",

          message:
            feedback.trim(),
        }
      );

      console.log(
        "✅ SUPPORT RESPONSE:",
        response.data
      );

      Alert.alert(
        "Thank You! ❤️",
        "Aapka feedback successfully submit ho gaya hai.",
        [
          {
            text: "OK",
            onPress: () => {
              resetFeedbackForm();
            },
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "❌ FEEDBACK SUBMIT ERROR:",
        error
      );

      console.log(
        "❌ RESPONSE:",
        error?.response?.data
      );

      let message =
        "Feedback submit nahi ho paaya. Please dobara try karein.";

      if (
        error?.response?.data?.message
      ) {
        message =
          error.response.data.message;
      }

      Alert.alert(
        "Submission Failed",
        message
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <SafeAreaView style={styles.container}>
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Help & Support
        </Text>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* ================================================= */}
        {/* HERO */}
        {/* ================================================= */}

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroEmoji}>
              🎧
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            How can we help you?
          </Text>

          <Text style={styles.heroSubtitle}>
            Kisi bhi help, complaint ya
            feedback ke liye humse contact
            karein.
          </Text>
        </View>

        {/* ================================================= */}
        {/* DIRECT CONTACT */}
        {/* ================================================= */}

        <Text style={styles.sectionTitle}>
          Contact Us
        </Text>

        <View style={styles.contactGrid}>
          {/* CALL */}

          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleCall}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.contactIcon,
                {
                  backgroundColor:
                    "#E8F5E9",
                },
              ]}
            >
              <Text
                style={styles.contactEmoji}
              >
                📞
              </Text>
            </View>

            <View style={styles.contactInfo}>
              <Text
                style={styles.contactTitle}
              >
                Call Us
              </Text>

              <Text
                style={
                  styles.contactSubtitle
                }
              >
                Direct call karein
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </TouchableOpacity>

          {/* WHATSAPP */}

          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleWhatsApp}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.contactIcon,
                {
                  backgroundColor:
                    "#E8F5E9",
                },
              ]}
            >
              <Text
                style={styles.contactEmoji}
              >
                💬
              </Text>
            </View>

            <View style={styles.contactInfo}>
              <Text
                style={styles.contactTitle}
              >
                WhatsApp
              </Text>

              <Text
                style={
                  styles.contactSubtitle
                }
              >
                Chat with us
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </TouchableOpacity>

          {/* EMAIL */}

          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleEmail}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.contactIcon,
                {
                  backgroundColor:
                    "#FFF3E0",
                },
              ]}
            >
              <Text
                style={styles.contactEmoji}
              >
                ✉️
              </Text>
            </View>

            <View style={styles.contactInfo}>
              <Text
                style={styles.contactTitle}
              >
                Email Us
              </Text>

              <Text
                style={
                  styles.contactSubtitle
                }
              >
                Send us an email
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================================================= */}
        {/* FEEDBACK */}
        {/* ================================================= */}

        <Text style={styles.sectionTitle}>
          Give Your Feedback
        </Text>

        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>
            ⭐ Rate Your Experience
          </Text>

          <Text
            style={styles.feedbackSubtitle}
          >
            Aapka feedback hume aur better
            banane me help karta hai.
          </Text>

          {/* ================================================= */}
          {/* FEEDBACK TYPE */}
          {/* ================================================= */}

          <Text style={styles.inputLabel}>
            Feedback Type
          </Text>

          <View style={styles.typeRow}>
            {/* FEEDBACK */}

            <TouchableOpacity
              style={[
                styles.typeButton,
                feedbackType ===
                  "FEEDBACK" &&
                  styles.typeButtonActive,
              ]}
              onPress={() =>
                setFeedbackType(
                  "FEEDBACK"
                )
              }
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  feedbackType ===
                    "FEEDBACK" &&
                    styles.typeButtonTextActive,
                ]}
              >
                ⭐ Feedback
              </Text>
            </TouchableOpacity>

            {/* COMPLAINT */}

            <TouchableOpacity
              style={[
                styles.typeButton,
                feedbackType ===
                  "COMPLAINT" &&
                  styles.typeButtonActive,
              ]}
              onPress={() =>
                setFeedbackType(
                  "COMPLAINT"
                )
              }
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  feedbackType ===
                    "COMPLAINT" &&
                    styles.typeButtonTextActive,
                ]}
              >
                🆘 Complaint
              </Text>
            </TouchableOpacity>

            {/* GENERAL */}

            <TouchableOpacity
              style={[
                styles.typeButton,
                feedbackType ===
                  "GENERAL" &&
                  styles.typeButtonActive,
              ]}
              onPress={() =>
                setFeedbackType(
                  "GENERAL"
                )
              }
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  feedbackType ===
                    "GENERAL" &&
                    styles.typeButtonTextActive,
                ]}
              >
                💬 General
              </Text>
            </TouchableOpacity>
          </View>

          {/* ================================================= */}
          {/* CUSTOMER NAME */}
          {/* ================================================= */}

          <Text style={styles.inputLabel}>
            Your Name *
          </Text>

          <TextInput
            style={styles.textInput}
            placeholder="Apna naam enter karein"
            placeholderTextColor="#999"
            value={customerName}
            onChangeText={
              setCustomerName
            }
            autoCapitalize="words"
          />

          {/* ================================================= */}
          {/* CUSTOMER PHONE */}
          {/* ================================================= */}

          <Text style={styles.inputLabel}>
            Mobile Number *
          </Text>

          <TextInput
            style={styles.textInput}
            placeholder="Apna mobile number"
            placeholderTextColor="#999"
            value={customerPhone}
            onChangeText={(text) =>
              setCustomerPhone(
                text.replace(
                  /[^0-9]/g,
                  ""
                )
              )
            }
            keyboardType="phone-pad"
            maxLength={10}
          />

          {/* ================================================= */}
          {/* EMAIL */}
          {/* ================================================= */}

          <Text style={styles.inputLabel}>
            Email
            <Text style={styles.optionalText}>
              {" "}
              (Optional)
            </Text>
          </Text>

          <TextInput
            style={styles.textInput}
            placeholder="your@email.com"
            placeholderTextColor="#999"
            value={customerEmail}
            onChangeText={
              setCustomerEmail
            }
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* ================================================= */}
          {/* ORDER NUMBER */}
          {/* ================================================= */}

          <Text style={styles.inputLabel}>
            Order Number
            <Text style={styles.optionalText}>
              {" "}
              (Optional)
            </Text>
          </Text>

          <TextInput
            style={styles.textInput}
            placeholder="Example: SF123456"
            placeholderTextColor="#999"
            value={orderNumber}
            onChangeText={
              setOrderNumber
            }
            autoCapitalize="characters"
          />

          {/* ================================================= */}
          {/* STARS */}
          {/* ================================================= */}

          <Text style={styles.inputLabel}>
            Your Rating *
          </Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(
              (star) => (
                <TouchableOpacity
                  key={star}
                  style={
                    styles.starButton
                  }
                  onPress={() =>
                    setRating(star)
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.star,
                      {
                        color:
                          star <= rating
                            ? "#FFB300"
                            : "#D5D5D5",
                      },
                    ]}
                  >
                    ★
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          {rating > 0 && (
            <Text
              style={styles.ratingText}
            >
              {rating === 1 &&
                "Very Bad 😞"}

              {rating === 2 &&
                "Needs Improvement 😐"}

              {rating === 3 &&
                "Good 🙂"}

              {rating === 4 &&
                "Very Good 😊"}

              {rating === 5 &&
                "Excellent ❤️"}
            </Text>
          )}

          {/* ================================================= */}
          {/* FEEDBACK INPUT */}
          {/* ================================================= */}

          <Text style={styles.inputLabel}>
            Your Feedback *
          </Text>

          <TextInput
            style={styles.feedbackInput}
            placeholder={
              feedbackType ===
              "COMPLAINT"
                ? "Apni complaint detail me likhein..."
                : "Apna feedback ya suggestion likhein..."
            }
            placeholderTextColor="#999"
            multiline
            numberOfLines={5}
            value={feedback}
            onChangeText={setFeedback}
            textAlignVertical="top"
            maxLength={1000}
          />

          <Text
            style={styles.characterCount}
          >
            {feedback.length}/1000
          </Text>

          {/* ================================================= */}
          {/* SUBMIT */}
          {/* ================================================= */}

          <TouchableOpacity
            style={[
              styles.submitButton,
              submitting &&
                styles.submitButtonDisabled,
            ]}
            onPress={
              handleSubmitFeedback
            }
            activeOpacity={0.8}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />

                <Text
                  style={[
                    styles.submitButtonText,
                    {
                      marginLeft: 8,
                    },
                  ]}
                >
                  Submitting...
                </Text>
              </>
            ) : (
              <Text
                style={
                  styles.submitButtonText
                }
              >
                Submit Feedback
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ================================================= */}
        {/* ORDER COMPLAINT */}
        {/* ================================================= */}

        <Text style={styles.sectionTitle}>
          Need Help With An Order?
        </Text>

        <TouchableOpacity
          style={styles.complaintCard}
          onPress={() => {
            setFeedbackType(
              "COMPLAINT"
            );

            Alert.alert(
              "Order Complaint",
              "Neeche Complaint select karke apne order ki details submit karein."
            );
          }}
          activeOpacity={0.8}
        >
          <View
            style={styles.complaintIcon}
          >
            <Text
              style={
                styles.complaintEmoji
              }
            >
              🆘
            </Text>
          </View>

          <View
            style={styles.complaintInfo}
          >
            <Text
              style={
                styles.complaintTitle
              }
            >
              Order Complaint
            </Text>

            <Text
              style={
                styles.complaintSubtitle
              }
            >
              Missing item, wrong item,
              delivery issue
            </Text>
          </View>

          <Text style={styles.arrow}>
            ›
          </Text>
        </TouchableOpacity>

        <View
          style={styles.bottomSpace}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },

  // ===================================================
  // HEADER
  // ===================================================

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
    backgroundColor: "#FFF3E8",
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    fontSize: 34,
    lineHeight: 36,
    color: "#E65100",
    marginTop: -3,
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#222222",
  },

  headerSpace: {
    width: 42,
  },

  // ===================================================
  // CONTENT
  // ===================================================

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  // ===================================================
  // HERO
  // ===================================================

  heroCard: {
    backgroundColor: "#FFF3E8",
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    marginBottom: 25,
  },

  heroIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  heroEmoji: {
    fontSize: 36,
  },

  heroTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#222222",
  },

  heroSubtitle: {
    fontSize: 13,
    color: "#777777",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 7,
  },

  // ===================================================
  // SECTION
  // ===================================================

  sectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#222222",
    marginBottom: 12,
    marginTop: 5,
  },

  // ===================================================
  // CONTACT
  // ===================================================

  contactGrid: {
    marginBottom: 20,
  },

  contactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  contactEmoji: {
    fontSize: 24,
  },

  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },

  contactTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222222",
  },

  contactSubtitle: {
    fontSize: 12,
    color: "#888888",
    marginTop: 3,
  },

  arrow: {
    fontSize: 28,
    color: "#AAAAAA",
  },

  // ===================================================
  // FEEDBACK CARD
  // ===================================================

  feedbackCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  feedbackTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222222",
  },

  feedbackSubtitle: {
    fontSize: 12,
    color: "#888888",
    lineHeight: 18,
    marginTop: 5,
  },

  // ===================================================
  // FEEDBACK TYPE
  // ===================================================

  typeRow: {
    flexDirection: "row",
    marginTop: 4,
    marginBottom: 5,
    gap: 7,
  },

  typeButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },

  typeButtonActive: {
    backgroundColor: "#FFF3E8",
    borderColor: "#E65100",
  },

  typeButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#777777",
    textAlign: "center",
  },

  typeButtonTextActive: {
    color: "#E65100",
  },

  // ===================================================
  // INPUT
  // ===================================================

  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333333",
    marginTop: 14,
    marginBottom: 7,
  },

  optionalText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#999999",
  },

  textInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 13,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#222222",
    backgroundColor: "#FAFAFA",
  },

  // ===================================================
  // STARS
  // ===================================================

  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 2,
    marginBottom: 2,
  },

  starButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  star: {
    fontSize: 36,
  },

  ratingText: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    color: "#E65100",
    marginBottom: 4,
  },

  // ===================================================
  // FEEDBACK INPUT
  // ===================================================

  feedbackInput: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 13,
    padding: 12,
    fontSize: 14,
    color: "#222222",
    backgroundColor: "#FAFAFA",
  },

  characterCount: {
    textAlign: "right",
    fontSize: 10,
    color: "#999999",
    marginTop: 4,
  },

  // ===================================================
  // SUBMIT
  // ===================================================

  submitButton: {
    height: 52,
    backgroundColor: "#E65100",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    flexDirection: "row",
  },

  submitButtonDisabled: {
    opacity: 0.65,
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  // ===================================================
  // COMPLAINT
  // ===================================================

  complaintCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  complaintIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
  },

  complaintEmoji: {
    fontSize: 24,
  },

  complaintInfo: {
    flex: 1,
    marginLeft: 12,
  },

  complaintTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222222",
  },

  complaintSubtitle: {
    fontSize: 12,
    color: "#888888",
    marginTop: 3,
  },

  // ===================================================
  // BOTTOM
  // ===================================================

  bottomSpace: {
    height: 30,
  },
});