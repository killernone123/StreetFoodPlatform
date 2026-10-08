import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const API_URL =
  'https://streetfoodplatform-1.onrender.com/api';

type SupportItem = {
  _id: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  orderId?: string;
  orderNumber?: string;
  type?: 'FEEDBACK' | 'COMPLAINT' | 'GENERAL';
  rating?: number;
  subject?: string;
  message?: string;
  status?: 'NEW' | 'READ' | 'RESOLVED';
  adminReply?: string;
  resolvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function FeedbacksScreen() {
  const router = useRouter();

  const [feedbacks, setFeedbacks] = useState<SupportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedFeedback, setSelectedFeedback] =
    useState<SupportItem | null>(null);

  const [showDetails, setShowDetails] = useState(false);

  const [updating, setUpdating] = useState(false);

  const [adminReply, setAdminReply] = useState('');

  const [filter, setFilter] = useState<
    'ALL' | 'NEW' | 'READ' | 'RESOLVED'
  >('ALL');

  const [typeFilter, setTypeFilter] = useState<
    'ALL' | 'FEEDBACK' | 'COMPLAINT' | 'GENERAL'
  >('ALL');

  const [search, setSearch] = useState('');

  // =========================================
  // FETCH FEEDBACKS
  // =========================================

  const fetchFeedbacks = useCallback(async () => {
    try {
      const token =
        await AsyncStorage.getItem('adminToken');

      if (!token) {
        router.replace('/');
        return;
      }

      const response = await fetch(
        `${API_URL}/support`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 401) {
        await AsyncStorage.removeItem(
          'adminToken'
        );

        await AsyncStorage.removeItem(
          'adminData'
        );

        router.replace('/');
        return;
      }

      const data = await response.json();

      console.log(
        'ADMIN FEEDBACK RESPONSE:',
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Failed to fetch feedbacks'
        );
      }

      const list =
        Array.isArray(data?.supports)
          ? data.supports
          : [];

      setFeedbacks(list);
    } catch (error: any) {
      console.log(
        'Fetch feedbacks error:',
        error
      );

      Alert.alert(
        'Error',
        error?.message ||
          'Unable to load feedbacks'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // =========================================
  // REFRESH
  // =========================================

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeedbacks();
  };

  // =========================================
  // OPEN DETAILS
  // =========================================

  const openDetails = (
    feedback: SupportItem
  ) => {
    setSelectedFeedback(feedback);
    setAdminReply(
      feedback.adminReply || ''
    );
    setShowDetails(true);
  };

  // =========================================
  // CLOSE DETAILS
  // =========================================

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedFeedback(null);
    setAdminReply('');
  };

  // =========================================
  // UPDATE STATUS
  // =========================================

  const updateStatus = async (
    id: string,
    status: 'NEW' | 'READ' | 'RESOLVED',
    reply?: string
  ) => {
    try {
      setUpdating(true);

      const token =
        await AsyncStorage.getItem('adminToken');

      if (!token) {
        router.replace('/');
        return;
      }

      const response = await fetch(
        `${API_URL}/support/${id}/status`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
            ...(reply !== undefined
              ? {
                  adminReply: reply,
                }
              : {}),
          }),
        }
      );

      const data = await response.json();

      console.log(
        'UPDATE FEEDBACK RESPONSE:',
        data
      );

      if (response.status === 401) {
        await AsyncStorage.removeItem(
          'adminToken'
        );

        await AsyncStorage.removeItem(
          'adminData'
        );

        router.replace('/');
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Failed to update feedback'
        );
      }

      const updated =
        data?.support;

      if (updated) {
        setFeedbacks((previous) =>
          previous.map((item) =>
            item._id === id
              ? updated
              : item
          )
        );

        setSelectedFeedback(updated);
        setAdminReply(
          updated.adminReply || ''
        );
      }

      Alert.alert(
        'Success ✅',
        'Feedback updated successfully.'
      );
    } catch (error: any) {
      console.log(
        'Update feedback error:',
        error
      );

      Alert.alert(
        'Update Failed',
        error?.message ||
          'Unable to update feedback'
      );
    } finally {
      setUpdating(false);
    }
  };

  // =========================================
  // DELETE
  // =========================================

  const deleteFeedback = (
    feedback: SupportItem
  ) => {
    Alert.alert(
      'Delete Feedback',
      'Are you sure you want to permanently delete this feedback?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdating(true);

              const token =
                await AsyncStorage.getItem(
                  'adminToken'
                );

              if (!token) {
                router.replace('/');
                return;
              }

              const response =
                await fetch(
                  `${API_URL}/support/${feedback._id}`,
                  {
                    method: 'DELETE',
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type':
                        'application/json',
                    },
                  }
                );

              const data =
                await response.json();

              if (response.status === 401) {
                await AsyncStorage.removeItem(
                  'adminToken'
                );

                await AsyncStorage.removeItem(
                  'adminData'
                );

                router.replace('/');
                return;
              }

              if (!response.ok) {
                throw new Error(
                  data?.message ||
                    'Failed to delete feedback'
                );
              }

              setFeedbacks(
                (previous) =>
                  previous.filter(
                    (item) =>
                      item._id !==
                      feedback._id
                  )
              );

              closeDetails();

              Alert.alert(
                'Deleted 🗑️',
                'Feedback deleted successfully.'
              );
            } catch (error: any) {
              console.log(
                'Delete feedback error:',
                error
              );

              Alert.alert(
                'Delete Failed',
                error?.message ||
                  'Unable to delete feedback'
              );
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  // =========================================
  // STATUS COLOR
  // =========================================

  const getStatusColor = (
    status?: string
  ) => {
    switch (status) {
      case 'NEW':
        return '#f97316';

      case 'READ':
        return '#2563eb';

      case 'RESOLVED':
        return '#16a34a';

      default:
        return '#64748b';
    }
  };

  // =========================================
  // TYPE COLOR
  // =========================================

  const getTypeColor = (
    type?: string
  ) => {
    switch (type) {
      case 'COMPLAINT':
        return '#dc2626';

      case 'FEEDBACK':
        return '#ff6b00';

      case 'GENERAL':
        return '#7c3aed';

      default:
        return '#64748b';
    }
  };

  // =========================================
  // FORMAT
  // =========================================

  const formatType = (
    type?: string
  ) => {
    if (!type) {
      return 'Feedback';
    }

    return (
      type.charAt(0) +
      type.slice(1).toLowerCase()
    );
  };

  const formatDate = (
    date?: string
  ) => {
    if (!date) {
      return 'Date unavailable';
    }

    try {
      return new Date(
        date
      ).toLocaleString();
    } catch {
      return 'Date unavailable';
    }
  };

  // =========================================
  // FILTER
  // =========================================

  const filteredFeedbacks =
    feedbacks.filter(
      (feedback) => {
        const text =
          search
            .trim()
            .toLowerCase();

        const name =
          String(
            feedback.customerName ||
              ''
          ).toLowerCase();

        const phone =
          String(
            feedback.customerPhone ||
              ''
          ).toLowerCase();

        const orderNumber =
          String(
            feedback.orderNumber ||
              ''
          ).toLowerCase();

        const message =
          String(
            feedback.message || ''
          ).toLowerCase();

        const matchesSearch =
          !text ||
          name.includes(text) ||
          phone.includes(text) ||
          orderNumber.includes(text) ||
          message.includes(text);

        const matchesStatus =
          filter === 'ALL' ||
          feedback.status === filter;

        const matchesType =
          typeFilter === 'ALL' ||
          feedback.type === typeFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesType
        );
      }
    );

  // =========================================
  // COUNTS
  // =========================================

  const newCount =
    feedbacks.filter(
      (item) =>
        item.status === 'NEW'
    ).length;

  const readCount =
    feedbacks.filter(
      (item) =>
        item.status === 'READ'
    ).length;

  const resolvedCount =
    feedbacks.filter(
      (item) =>
        item.status === 'RESOLVED'
    ).length;

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <View
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="large"
          color="#ff6b00"
        />

        <Text
          style={styles.loadingText}
        >
          Loading feedbacks...
        </Text>
      </View>
    );
  }

  // =========================================
  // UI
  // =========================================

  return (
    <View style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text
            style={styles.smallTitle}
          >
            STREET FOOD
          </Text>

          <Text
            style={styles.title}
          >
            Customer Feedback
          </Text>

          <Text
            style={styles.subtitle}
          >
            Feedback & complaints
          </Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.replace(
              '/dashboard'
            )
          }
        >
          <Text
            style={styles.backText}
          >
            ←
          </Text>
        </TouchableOpacity>
      </View>

      {/* STATS */}

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ff6b00']}
          />
        }
      >

        <View style={styles.statsRow}>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>
              💬
            </Text>

            <Text style={styles.statNumber}>
              {feedbacks.length}
            </Text>

            <Text style={styles.statLabel}>
              Total
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>
              🆕
            </Text>

            <Text style={styles.statNumber}>
              {newCount}
            </Text>

            <Text style={styles.statLabel}>
              New
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>
              👀
            </Text>

            <Text style={styles.statNumber}>
              {readCount}
            </Text>

            <Text style={styles.statLabel}>
              Read
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>
              ✅
            </Text>

            <Text style={styles.statNumber}>
              {resolvedCount}
            </Text>

            <Text style={styles.statLabel}>
              Resolved
            </Text>
          </View>

        </View>

        {/* SEARCH */}

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>
            🔎
          </Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search customer, phone, order..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* STATUS FILTER */}

        <Text style={styles.filterTitle}>
          Status
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.filterContainer
          }
        >
          {[
            'ALL',
            'NEW',
            'READ',
            'RESOLVED',
          ].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filter === status &&
                  styles.filterButtonActive,
              ]}
              onPress={() =>
                setFilter(
                  status as
                    | 'ALL'
                    | 'NEW'
                    | 'READ'
                    | 'RESOLVED'
                )
              }
            >
              <Text
                style={[
                  styles.filterText,
                  filter === status &&
                    styles.filterTextActive,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* TYPE FILTER */}

        <Text style={styles.filterTitle}>
          Type
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.filterContainer
          }
        >
          {[
            'ALL',
            'FEEDBACK',
            'COMPLAINT',
            'GENERAL',
          ].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterButton,
                typeFilter === type &&
                  styles.filterButtonActive,
              ]}
              onPress={() =>
                setTypeFilter(
                  type as
                    | 'ALL'
                    | 'FEEDBACK'
                    | 'COMPLAINT'
                    | 'GENERAL'
                )
              }
            >
              <Text
                style={[
                  styles.filterText,
                  typeFilter === type &&
                    styles.filterTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* RESULT */}

        <View style={styles.resultHeader}>
          <Text style={styles.sectionTitle}>
            Customer Messages
          </Text>

          <Text style={styles.resultCount}>
            {filteredFeedbacks.length}
          </Text>
        </View>

        {/* EMPTY */}

        {filteredFeedbacks.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>
              📭
            </Text>

            <Text style={styles.emptyTitle}>
              No Feedback Found
            </Text>

            <Text style={styles.emptyText}>
              Customer feedback and
              complaints will appear here.
            </Text>
          </View>
        ) : (
          filteredFeedbacks.map(
            (feedback) => (
              <TouchableOpacity
                key={feedback._id}
                style={styles.feedbackCard}
                activeOpacity={0.85}
                onPress={() =>
                  openDetails(feedback)
                }
              >

                {/* TOP */}

                <View style={styles.cardTop}>

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={
                        styles.customerName
                      }
                    >
                      👤{' '}
                      {feedback.customerName ||
                        'Customer'}
                    </Text>

                    <Text
                      style={
                        styles.customerPhone
                      }
                    >
                      📞{' '}
                      {feedback.customerPhone ||
                        'Phone unavailable'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          getStatusColor(
                            feedback.status
                          ),
                      },
                    ]}
                  >
                    <Text
                      style={
                        styles.statusBadgeText
                      }
                    >
                      {feedback.status ||
                        'NEW'}
                    </Text>
                  </View>
                </View>

                {/* TYPE */}

                <View
                  style={
                    styles.typeRow
                  }
                >
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor:
                          getTypeColor(
                            feedback.type
                          ),
                      },
                    ]}
                  >
                    <Text
                      style={
                        styles.typeBadgeText
                      }
                    >
                      {formatType(
                        feedback.type
                      )}
                    </Text>
                  </View>

                  {feedback.rating ? (
                    <Text
                      style={
                        styles.ratingText
                      }
                    >
                      ⭐ {feedback.rating}/5
                    </Text>
                  ) : null}

                  <Text
                    style={
                      styles.dateText
                    }
                  >
                    {formatDate(
                      feedback.createdAt
                    )}
                  </Text>
                </View>

                {/* ORDER */}

                {feedback.orderNumber && (
                  <Text
                    style={
                      styles.orderText
                    }
                  >
                    📦 Order #
                    {feedback.orderNumber}
                  </Text>
                )}

                {/* SUBJECT */}

                {feedback.subject && (
                  <Text
                    style={
                      styles.subject
                    }
                  >
                    {feedback.subject}
                  </Text>
                )}

                {/* MESSAGE */}

                <Text
                  style={
                    styles.message
                  }
                  numberOfLines={3}
                >
                  {feedback.message ||
                    'No message'}
                </Text>

                <View
                  style={
                    styles.viewRow
                  }
                >
                  <Text
                    style={
                      styles.viewText
                    }
                  >
                    View Details →
                  </Text>
                </View>

              </TouchableOpacity>
            )
          )
        )}

        <View
          style={{
            height: 40,
          }}
        />

      </ScrollView>

      {/* DETAILS MODAL */}

      <Modal
        visible={showDetails}
        transparent
        animationType="slide"
        onRequestClose={
          closeDetails
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={styles.modalCard}
          >

            {/* HEADER */}

            <View
              style={styles.modalHeader}
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
                  Feedback Details
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Customer message
                </Text>
              </View>

              <TouchableOpacity
                style={
                  styles.closeButton
                }
                onPress={
                  closeDetails
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

            {selectedFeedback && (
              <ScrollView
                showsVerticalScrollIndicator={
                  false
                }
              >

                {/* CUSTOMER */}

                <Text
                  style={
                    styles.detailTitle
                  }
                >
                  Customer
                </Text>

                <View
                  style={
                    styles.detailBox
                  }
                >
                  <Text
                    style={
                      styles.detailText
                    }
                  >
                    👤{' '}
                    {selectedFeedback.customerName ||
                      'N/A'}
                  </Text>

                  <Text
                    style={
                      styles.detailText
                    }
                  >
                    📞{' '}
                    {selectedFeedback.customerPhone ||
                      'N/A'}
                  </Text>

                  {selectedFeedback.customerEmail && (
                    <Text
                      style={
                        styles.detailText
                      }
                    >
                      📧{' '}
                      {
                        selectedFeedback.customerEmail
                      }
                    </Text>
                  )}
                </View>

                {/* ORDER */}

                {selectedFeedback.orderNumber && (
                  <>
                    <Text
                      style={
                        styles.detailTitle
                      }
                    >
                      Order
                    </Text>

                    <View
                      style={
                        styles.detailBox
                      }
                    >
                      <Text
                        style={
                          styles.detailText
                        }
                      >
                        📦 Order #
                        {
                          selectedFeedback.orderNumber
                        }
                      </Text>
                    </View>
                  </>
                )}

                {/* FEEDBACK */}

                <Text
                  style={
                    styles.detailTitle
                  }
                >
                  Feedback
                </Text>

                <View
                  style={
                    styles.detailBox
                  }
                >
                  <View
                    style={
                      styles.detailMetaRow
                    }
                  >
                    <View
                      style={[
                        styles.typeBadge,
                        {
                          backgroundColor:
                            getTypeColor(
                              selectedFeedback.type
                            ),
                        },
                      ]}
                    >
                      <Text
                        style={
                          styles.typeBadgeText
                        }
                      >
                        {formatType(
                          selectedFeedback.type
                        )}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.ratingBig
                      }
                    >
                      {selectedFeedback.rating
                        ? `⭐ ${selectedFeedback.rating}/5`
                        : 'No rating'}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.detailSubject
                    }
                  >
                    {selectedFeedback.subject ||
                      'Customer Feedback'}
                  </Text>

                  <Text
                    style={
                      styles.detailMessage
                    }
                  >
                    {selectedFeedback.message ||
                      'No message'}
                  </Text>

                  <Text
                    style={
                      styles.dateDetail
                    }
                  >
                    Submitted:{' '}
                    {formatDate(
                      selectedFeedback.createdAt
                    )}
                  </Text>
                </View>

                {/* STATUS */}

                <Text
                  style={
                    styles.detailTitle
                  }
                >
                  Update Status
                </Text>

                <View
                  style={
                    styles.statusActionRow
                  }
                >

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor:
                          '#2563eb',
                      },
                    ]}
                    disabled={updating}
                    onPress={() =>
                      updateStatus(
                        selectedFeedback._id,
                        'READ',
                        adminReply
                      )
                    }
                  >
                    <Text
                      style={
                        styles.actionButtonText
                      }
                    >
                      👀 Mark Read
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor:
                          '#16a34a',
                      },
                    ]}
                    disabled={updating}
                    onPress={() =>
                      updateStatus(
                        selectedFeedback._id,
                        'RESOLVED',
                        adminReply
                      )
                    }
                  >
                    <Text
                      style={
                        styles.actionButtonText
                      }
                    >
                      ✅ Resolve
                    </Text>
                  </TouchableOpacity>

                </View>

                {/* REPLY */}

                <Text
                  style={
                    styles.detailTitle
                  }
                >
                  Admin Reply
                </Text>

                <TextInput
                  style={
                    styles.replyInput
                  }
                  placeholder="Write reply to customer..."
                  placeholderTextColor="#94a3b8"
                  value={adminReply}
                  onChangeText={
                    setAdminReply
                  }
                  multiline
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={
                    styles.saveReplyButton
                  }
                  disabled={updating}
                  onPress={() =>
                    updateStatus(
                      selectedFeedback._id,
                      selectedFeedback.status ||
                        'READ',
                      adminReply
                    )
                  }
                >
                  {updating ? (
                    <ActivityIndicator
                      color="#ffffff"
                    />
                  ) : (
                    <Text
                      style={
                        styles.saveReplyText
                      }
                    >
                      💾 Save Reply
                    </Text>
                  )}
                </TouchableOpacity>

                {/* DELETE */}

                <TouchableOpacity
                  style={
                    styles.deleteButton
                  }
                  disabled={updating}
                  onPress={() =>
                    deleteFeedback(
                      selectedFeedback
                    )
                  }
                >
                  <Text
                    style={
                      styles.deleteButtonText
                    }
                  >
                    🗑️ Delete Feedback
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.closeFullButton
                  }
                  onPress={
                    closeDetails
                  }
                >
                  <Text
                    style={
                      styles.closeFullButtonText
                    }
                  >
                    Close
                  </Text>
                </TouchableOpacity>

                <View
                  style={{
                    height: 35,
                  }}
                />

              </ScrollView>
            )}

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
    backgroundColor: '#f5f7fb',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fb',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748b',
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 16,
    paddingBottom: 18,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
  },

  smallTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ff6b00',
    letterSpacing: 1.5,
  },

  title: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#fff3e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  backText: {
    fontSize: 25,
    fontWeight: '900',
    color: '#ff6b00',
  },

  statsRow: {
    paddingHorizontal: 12,
    paddingTop: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  statCard: {
    width: '46%',
    margin: '2%',
    minHeight: 110,
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  statIcon: {
    fontSize: 22,
  },

  statNumber: {
    marginTop: 6,
    fontSize: 25,
    fontWeight: '900',
    color: '#111827',
  },

  statLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },

  searchBox: {
    marginHorizontal: 16,
    marginTop: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    height: '100%',
    color: '#111827',
    fontSize: 14,
  },

  filterTitle: {
    marginTop: 18,
    marginBottom: 3,
    paddingHorizontal: 20,
    fontSize: 14,
    fontWeight: '900',
    color: '#334155',
  },

  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },

  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  filterButtonActive: {
    backgroundColor: '#ff6b00',
    borderColor: '#ff6b00',
  },

  filterText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748b',
  },

  filterTextActive: {
    color: '#ffffff',
  },

  resultHeader: {
    paddingHorizontal: 20,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },

  resultCount: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff3e8',
    textAlign: 'center',
    paddingTop: 7,
    color: '#ff6b00',
    fontSize: 12,
    fontWeight: '900',
  },

  feedbackCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  customerName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },

  customerPhone: {
    marginTop: 5,
    fontSize: 12,
    color: '#64748b',
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
  },

  statusBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },

  typeRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },

  typeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },

  typeBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },

  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400e',
  },

  dateText: {
    fontSize: 10,
    color: '#94a3b8',
  },

  orderText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },

  subject: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '900',
    color: '#1e293b',
  },

  message: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: '#64748b',
  },

  viewRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eef2f7',
    alignItems: 'flex-end',
  },

  viewText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ff6b00',
  },

  emptyBox: {
    marginHorizontal: 16,
    marginTop: 15,
    padding: 35,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 45,
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },

  emptyText: {
    marginTop: 5,
    textAlign: 'center',
    fontSize: 13,
    color: '#64748b',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    maxHeight: '92%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  modalTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#111827',
  },

  modalSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#64748b',
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#334155',
  },

  detailTitle: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },

  detailBox: {
    padding: 14,
    borderRadius: 15,
    backgroundColor: '#f8fafc',
  },

  detailText: {
    marginBottom: 5,
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
  },

  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  ratingBig: {
    fontSize: 14,
    fontWeight: '900',
    color: '#92400e',
  },

  detailSubject: {
    marginTop: 15,
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },

  detailMessage: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },

  dateDetail: {
    marginTop: 12,
    fontSize: 11,
    color: '#94a3b8',
  },

  statusActionRow: {
    flexDirection: 'row',
    gap: 10,
  },

  actionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },

  replyInput: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#f8fafc',
    color: '#111827',
    fontSize: 14,
  },

  saveReplyButton: {
    marginTop: 10,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#ff6b00',
    justifyContent: 'center',
    alignItems: 'center',
  },

  saveReplyText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },

  deleteButton: {
    marginTop: 10,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  deleteButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '900',
  },

  closeFullButton: {
    marginTop: 10,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeFullButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});