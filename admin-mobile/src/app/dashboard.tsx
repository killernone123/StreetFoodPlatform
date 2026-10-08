import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { io } from 'socket.io-client';

const API_URL =
  'https://streetfoodplatform-1.onrender.com/api';

const SOCKET_URL =
  'https://streetfoodplatform-1.onrender.com';

export default function DashboardScreen() {
  const router = useRouter();

  const [adminName, setAdminName] = useState('Admin');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [newOrderCount, setNewOrderCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] =
    useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedOrder, setSelectedOrder] =
    useState<any>(null);

  const [showOrderDetails, setShowOrderDetails] =
    useState(false);

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [stats, setStats] = useState({
    total: 0,
    placed: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    outForDelivery: 0,
    delivered: 0,
  });

  // =========================================
  // LOAD ADMIN + SOCKET
  // =========================================

  useEffect(() => {
    loadAdmin();
    fetchOrders();

    let socket: any;

    const connectAdminSocket = async () => {
      try {
        const token =
          await AsyncStorage.getItem('adminToken');

        if (!token) {
          return;
        }

        socket = io(SOCKET_URL, {
          transports: ['polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
          timeout: 15000,
          forceNew: true,
        });

        console.log(
          '🔌 Connecting admin mobile socket...'
        );

        socket.on('connect', () => {
          console.log(
            '🟢 Admin mobile socket connected:',
            socket.id
          );

          socket.emit(
            'joinAdminRoom',
            (response: any) => {
              console.log(
                '🏠 ADMIN MOBILE ROOM JOIN:',
                response
              );
            }
          );
        });

        socket.on(
          'newOrder',
          async (newOrder: any) => {
            console.log(
              '🔔 NEW ORDER RECEIVED:',
              newOrder
            );

            setNewOrderCount(
              (prev) => prev + 1
            );

            setNotifications(
              (prev) => [
                {
                  id: Date.now().toString(),
                  type: 'NEW_ORDER',
                  title: 'New Order Received',
                  message: `Order #${
                    newOrder?.orderNumber ||
                    newOrder?._id ||
                    'New Order'
                  }`,
                  order: newOrder,
                  time: new Date(),
                  read: false,
                },
                ...prev,
              ]
            );

            // Refresh order list
            await fetchOrders();

            Alert.alert(
              '🔔 New Order Received!',
              `Order #${
                newOrder?.orderNumber ||
                newOrder?._id ||
                'New Order'
              }\n\nA new customer order has been placed.`,
              [
                {
                  text: 'OK',
                },
              ]
            );
          }
        );

        socket.on(
          'disconnect',
          (reason: string) => {
            console.log(
              '🔴 Admin mobile socket disconnected:',
              reason
            );
          }
        );

        socket.on(
          'connect_error',
          (error: any) => {
            console.log(
              '❌ Admin mobile socket error:',
              error?.message || error
            );
          }
        );
      } catch (error) {
        console.log(
          'Admin mobile socket setup error:',
          error
        );
      }
    };

    connectAdminSocket();

    return () => {
      console.log(
        '🧹 Closing admin mobile socket...'
      );

      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  // =========================================
  // LOAD ADMIN
  // =========================================

  const loadAdmin = async () => {
    try {
      const adminData =
        await AsyncStorage.getItem(
          'adminData'
        );

      if (adminData) {
        const admin =
          JSON.parse(adminData);

        setAdminName(
          admin?.name || 'Admin'
        );
      }
    } catch (error) {
      console.log(
        'Admin data error:',
        error
      );
    }
  };

  // =========================================
  // GET ORDER STATUS
  // =========================================

  const getOrderStatus = (
    order: any
  ) => {
    return (
      order?.orderStatus ||
      order?.status ||
      'PLACED'
    );
  };

  // =========================================
  // CALCULATE STATS
  // =========================================

  const calculateStats = (
    orderList: any[]
  ) => {
    setStats({
      total: orderList.length,

      placed: orderList.filter(
        (order: any) =>
          getOrderStatus(order) ===
          'PLACED'
      ).length,

      confirmed: orderList.filter(
        (order: any) =>
          getOrderStatus(order) ===
          'CONFIRMED'
      ).length,

      preparing: orderList.filter(
        (order: any) =>
          getOrderStatus(order) ===
          'PREPARING'
      ).length,

      ready: orderList.filter(
        (order: any) =>
          getOrderStatus(order) ===
          'READY'
      ).length,

      outForDelivery: orderList.filter(
        (order: any) =>
          getOrderStatus(order) ===
          'OUT_FOR_DELIVERY'
      ).length,

      delivered: orderList.filter(
        (order: any) =>
          getOrderStatus(order) ===
          'DELIVERED'
      ).length,
    });
  };

  // =========================================
  // FETCH ORDERS
  // =========================================

  const fetchOrders = async () => {
    try {
      const token =
        await AsyncStorage.getItem(
          'adminToken'
        );

      if (!token) {
        router.replace('/');
        return;
      }

      const response = await fetch(
        `${API_URL}/orders`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type':
              'application/json',
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

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Failed to fetch orders'
        );
      }

      const orderList =
        Array.isArray(data)
          ? data
          : data?.orders || [];

      setOrders(orderList);

      calculateStats(orderList);
    } catch (error: any) {
      console.log(
        'Fetch orders error:',
        error
      );

      Alert.alert(
        'Error',
        error?.message ||
          'Unable to load orders'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================
  // REFRESH
  // =========================================

  const onRefresh = async () => {
    setRefreshing(true);

    await fetchOrders();
  };

  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(
              'adminToken'
            );

            await AsyncStorage.removeItem(
              'adminData'
            );

            router.replace('/');
          },
        },
      ]
    );
  };

  // =========================================
  // STATUS COLOR
  // =========================================

  const getStatusColor = (
    status: string
  ) => {
    switch (status) {
      case 'PLACED':
        return '#ff9800';

      case 'CONFIRMED':
        return '#2196f3';

      case 'PREPARING':
        return '#9c27b0';

      case 'READY':
        return '#00a884';

      case 'OUT_FOR_DELIVERY':
        return '#673ab7';

      case 'DELIVERED':
        return '#16a34a';

      case 'CANCELLED':
        return '#dc2626';

      default:
        return '#64748b';
    }
  };

  // =========================================
  // FORMAT STATUS
  // =========================================

  const formatStatus = (
    status: string
  ) => {
    return (
      status
        ?.replaceAll('_', ' ')
        ?.replace(
          /\b\w/g,
          (char) =>
            char.toUpperCase()
        ) || 'Unknown'
    );
  };

  // =========================================
  // FILTER ORDERS
  // =========================================

  const filteredOrders =
    orders.filter(
      (order: any) => {
        const searchText =
          search.trim().toLowerCase();

        const orderNumber =
          String(
            order?.orderNumber || ''
          ).toLowerCase();

        const customerName =
          String(
            order?.customer?.name || ''
          ).toLowerCase();

        const customerPhone =
          String(
            order?.customer?.phone || ''
          ).toLowerCase();

        const matchesSearch =
          !searchText ||
          orderNumber.includes(
            searchText
          ) ||
          customerName.includes(
            searchText
          ) ||
          customerPhone.includes(
            searchText
          );

        const orderStatus =
          getOrderStatus(order);

        const matchesStatus =
          statusFilter === 'ALL' ||
          orderStatus ===
            statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );

  // =========================================
  // OPEN ORDER DETAILS
  // =========================================

  const openOrderDetails = (
    order: any
  ) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  // =========================================
  // CLOSE ORDER DETAILS
  // =========================================

  const closeOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  // =========================================
  // UPDATE ORDER STATUS
  // =========================================

  const updateOrderStatus = async (
    orderId: string,
    newStatus: string
  ) => {
    try {
      setUpdatingStatus(true);

      const token =
        await AsyncStorage.getItem(
          'adminToken'
        );

      if (!token) {
        router.replace('/');
        return;
      }

      const response = await fetch(
        `${API_URL}/orders/${orderId}/status`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Failed to update order status'
        );
      }

      const updatedOrders =
        orders.map(
          (order) =>
            order._id === orderId
              ? {
                  ...order,

                  // Backend field
                  orderStatus:
                    newStatus,

                  // Compatibility
                  status:
                    newStatus,
                }
              : order
        );

      setOrders(
        updatedOrders
      );

      calculateStats(
        updatedOrders
      );

      setSelectedOrder(
        (previousOrder: any) =>
          previousOrder
            ? {
                ...previousOrder,
                orderStatus:
                  newStatus,
                status:
                  newStatus,
              }
            : previousOrder
      );

      Alert.alert(
        'Status Updated ✅',
        `Order status changed to ${formatStatus(
          newStatus
        )}`
      );
    } catch (error: any) {
      console.log(
        'Update status error:',
        error
      );

      Alert.alert(
        'Update Failed',
        error?.message ||
          'Unable to update order status'
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // =========================================
  // CONFIRM STATUS CHANGE
  // =========================================

  const confirmStatusChange = (
    status: string
  ) => {
    if (!selectedOrder) {
      return;
    }

    const currentStatus =
      getOrderStatus(
        selectedOrder
      );

    if (
      currentStatus ===
      status
    ) {
      return;
    }

    Alert.alert(
      'Update Order Status',
      `Change order status to ${formatStatus(
        status
      )}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Update',
          onPress: () =>
            updateOrderStatus(
              selectedOrder._id,
              status
            ),
        },
      ]
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
          Loading orders...
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
            colors={['#ff6b00']}
          />
        }
      >

        {/* ============================= */}
        {/* HEADER */}
        {/* ============================= */}

        <View style={styles.header}>
          <View>
            <Text
              style={
                styles.smallTitle
              }
            >
              STREET FOOD
            </Text>

            <Text
              style={styles.title}
            >
              Admin Dashboard
            </Text>

            <Text
              style={
                styles.welcome
              }
            >
              Welcome, {adminName} 👋
            </Text>
          </View>

          <View
            style={
              styles.headerButtons
            }
          >
            {/* NOTIFICATION */}

            <TouchableOpacity
              style={
                styles.iconButton
              }
              onPress={() => {
                setNewOrderCount(0);
                setShowNotifications(
                  true
                );
              }}
            >
              <Text
                style={
                  styles.iconText
                }
              >
                🔔
              </Text>

              {newOrderCount > 0 && (
                <View
                  style={
                    styles.notificationBadge
                  }
                >
                  <Text
                    style={
                      styles.notificationBadgeText
                    }
                  >
                    {newOrderCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* REFRESH */}

            <TouchableOpacity
              style={
                styles.iconButton
              }
              onPress={
                fetchOrders
              }
            >
              <Text
                style={
                  styles.iconText
                }
              >
                🔄
              </Text>
            </TouchableOpacity>

            {/* ITEMS */}

<TouchableOpacity
  style={styles.iconButton}
  onPress={() => router.push('/items')}
>
  <Text style={styles.iconText}>
    🍔
  </Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.iconButton}
  onPress={() => router.push('/categories')}
>
  <Text style={styles.iconText}>
    📂
  </Text>
</TouchableOpacity>
{/* BANNERS */}

<TouchableOpacity
  style={styles.iconButton}
  onPress={() => router.push('/banners')}
>
  <Text style={styles.iconText}>
    📢
  </Text>
</TouchableOpacity>
{/* FEEDBACK */}

<TouchableOpacity
  style={styles.iconButton}
  onPress={() => router.push('/feedbacks')}
>
  <Text style={styles.iconText}>
    💬
  </Text>
</TouchableOpacity>

            {/* LOGOUT */}

            <TouchableOpacity
              style={
                styles.iconButton
              }
              onPress={
                handleLogout
              }
            >
              <Text
                style={
                  styles.iconText
                }
              >
                🚪
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================= */}
        {/* NOTIFICATIONS */}
        {/* ============================= */}

        {showNotifications && (
          <View
            style={
              styles.notificationPanel
            }
          >
            <View
              style={
                styles.notificationHeader
              }
            >
              <Text
                style={
                  styles.notificationTitle
                }
              >
                🔔 Notifications
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setShowNotifications(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.notificationClose
                  }
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {notifications.length ===
            0 ? (
              <View
                style={
                  styles.noNotifications
                }
              >
                <Text
                  style={
                    styles.noNotificationIcon
                  }
                >
                  🔕
                </Text>

                <Text
                  style={
                    styles.noNotificationText
                  }
                >
                  No notifications
                </Text>
              </View>
            ) : (
              notifications.map(
                (
                  notification
                ) => (
                  <TouchableOpacity
                    key={
                      notification.id
                    }
                    style={
                      styles.notificationItem
                    }
                    onPress={() => {
                      setShowNotifications(
                        false
                      );

                      if (
                        notification.order
                      ) {
                        openOrderDetails(
                          notification.order
                        );
                      }
                    }}
                  >
                    <View
                      style={
                        styles.notificationIconBox
                      }
                    >
                      <Text
                        style={
                          styles.notificationItemIcon
                        }
                      >
                        🆕
                      </Text>
                    </View>

                    <View
                      style={
                        styles.notificationContent
                      }
                    >
                      <Text
                        style={
                          styles.notificationItemTitle
                        }
                      >
                        {
                          notification.title
                        }
                      </Text>

                      <Text
                        style={
                          styles.notificationItemMessage
                        }
                      >
                        {
                          notification.message
                        }
                      </Text>

                      <Text
                        style={
                          styles.notificationItemTime
                        }
                      >
                        New order received
                      </Text>
                    </View>
                  </TouchableOpacity>
                )
              )
            )}
          </View>
        )}

        {/* ============================= */}
        {/* STATS */}
        {/* ============================= */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Order Overview
        </Text>

        <View
          style={
            styles.statsGrid
          }
        >
          <View
            style={
              styles.statCard
            }
          >
            <Text
              style={
                styles.statIcon
              }
            >
              📦
            </Text>

            <Text
              style={
                styles.statNumber
              }
            >
              {stats.total}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Total Orders
            </Text>
          </View>

          <View
            style={
              styles.statCard
            }
          >
            <Text
              style={
                styles.statIcon
              }
            >
              🆕
            </Text>

            <Text
              style={
                styles.statNumber
              }
            >
              {stats.placed}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              New Orders
            </Text>
          </View>

          <View
            style={
              styles.statCard
            }
          >
            <Text
              style={
                styles.statIcon
              }
            >
              ✅
            </Text>

            <Text
              style={
                styles.statNumber
              }
            >
              {stats.confirmed}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Confirmed
            </Text>
          </View>

          <View
            style={
              styles.statCard
            }
          >
            <Text
              style={
                styles.statIcon
              }
            >
              👨‍🍳
            </Text>

            <Text
              style={
                styles.statNumber
              }
            >
              {stats.preparing}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Preparing
            </Text>
          </View>

          <View
            style={
              styles.statCard
            }
          >
            <Text
              style={
                styles.statIcon
              }
            >
              🍱
            </Text>

            <Text
              style={
                styles.statNumber
              }
            >
              {stats.ready}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Ready
            </Text>
          </View>

          <View
            style={
              styles.statCard
            }
          >
            <Text
              style={
                styles.statIcon
              }
            >
              🛵
            </Text>

            <Text
              style={
                styles.statNumber
              }
            >
              {stats.outForDelivery}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Out For Delivery
            </Text>
          </View>

          <View
            style={
              styles.statCard
            }
          >
            <Text
              style={
                styles.statIcon
              }
            >
              🎉
            </Text>

            <Text
              style={
                styles.statNumber
              }
            >
              {stats.delivered}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Delivered
            </Text>
          </View>
        </View>

        {/* ============================= */}
        {/* SEARCH */}
        {/* ============================= */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Search Orders
        </Text>

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
            🔎
          </Text>

          <TextInput
            style={
              styles.searchInput
            }
            placeholder="Order number, name or phone..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={
              setSearch
            }
          />
        </View>

        {/* ============================= */}
        {/* FILTER */}
        {/* ============================= */}

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
            'PLACED',
            'CONFIRMED',
            'PREPARING',
            'READY',
            'OUT_FOR_DELIVERY',
            'DELIVERED',
            'CANCELLED',
          ].map(
            (status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  statusFilter ===
                    status &&
                    styles.filterButtonActive,
                ]}
                onPress={() =>
                  setStatusFilter(
                    status
                  )
                }
              >
                <Text
                  style={[
                    styles.filterText,
                    statusFilter ===
                      status &&
                      styles.filterTextActive,
                  ]}
                >
                  {status === 'ALL'
                    ? 'ALL'
                    : formatStatus(
                        status
                      )}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>

        {/* ============================= */}
        {/* RECENT ORDERS */}
        {/* ============================= */}

        <View
          style={
            styles.orderHeader
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Recent Orders
          </Text>

          <Text
            style={
              styles.orderCount
            }
          >
            {filteredOrders.length}{' '}
            orders
          </Text>
        </View>

        {filteredOrders.length ===
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
              📭
            </Text>

            <Text
              style={
                styles.emptyTitle
              }
            >
              {orders.length ===
              0
                ? 'No Orders Yet'
                : 'No Matching Orders'}
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              {orders.length ===
              0
                ? 'New customer orders will appear here.'
                : 'Try another search or status filter.'}
            </Text>
          </View>
        ) : (
          filteredOrders.map(
            (order: any) => {
              const orderStatus =
                getOrderStatus(
                  order
                );

              return (
                <TouchableOpacity
                  key={order._id}
                  style={
                    styles.orderCard
                  }
                  activeOpacity={
                    0.85
                  }
                  onPress={() =>
                    openOrderDetails(
                      order
                    )
                  }
                >
                  <View
                    style={
                      styles.orderTop
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.orderNumber
                        }
                      >
                        #
                        {order.orderNumber ||
                          order._id}
                      </Text>

                      <Text
                        style={
                          styles.orderDate
                        }
                      >
                        {order.createdAt
                          ? new Date(
                              order.createdAt
                            ).toLocaleString()
                          : 'Date unavailable'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            getStatusColor(
                              orderStatus
                            ),
                        },
                      ]}
                    >
                      <Text
                        style={
                          styles.statusText
                        }
                      >
                        {formatStatus(
                          orderStatus
                        )}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.divider
                    }
                  />

                  {/* CUSTOMER NAME */}

                  <Text
                    style={
                      styles.customerName
                    }
                  >
                    👤{' '}
                    {order.customer?.name ||
                      'Customer unavailable'}
                  </Text>

                  {/* CUSTOMER PHONE */}

                  <Text
                    style={
                      styles.customerPhone
                    }
                  >
                    📞{' '}
                    {order.customer?.phone ||
                      'Phone unavailable'}
                  </Text>

                  {/* CUSTOMER ADDRESS */}

                  <Text
                    style={
                      styles.address
                    }
                  >
                    📍{' '}
                    {order.customer?.address ||
                      'Address unavailable'}
                  </Text>

                  {/* LANDMARK */}

                  {order.customer?.landmark && (
                    <Text
                      style={
                        styles.address
                      }
                    >
                      🏠{' '}
                      {order.customer.landmark}
                    </Text>
                  )}

                  <View
                    style={
                      styles.orderBottom
                    }
                  >
                    <Text
                      style={
                        styles.itemsText
                      }
                    >
                      🍔{' '}
                      {order.items
                        ?.length ||
                        0}{' '}
                      items
                    </Text>

                    <Text
                      style={
                        styles.totalText
                      }
                    >
                      ₹
                      {order.grandTotal ??
                        0}
                    </Text>
                  </View>
                </TouchableOpacity>
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
      {/* ORDER DETAILS MODAL */}
      {/* ================================= */}

      {showOrderDetails &&
        selectedOrder && (
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
                    Order Details
                  </Text>

                  <Text
                    style={
                      styles.modalOrderNumber
                    }
                  >
                    #
                    {selectedOrder.orderNumber ||
                      selectedOrder._id}
                  </Text>
                </View>

                <TouchableOpacity
                  style={
                    styles.closeButton
                  }
                  onPress={
                    closeOrderDetails
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
              >

                {/* CURRENT STATUS */}

                <Text
                  style={
                    styles.detailSectionTitle
                  }
                >
                  Current Order Status
                </Text>

                <View
                  style={[
                    styles.currentStatusBox,
                    {
                      borderColor:
                        getStatusColor(
                          getOrderStatus(
                            selectedOrder
                          )
                        ),
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.currentStatusDot,
                      {
                        backgroundColor:
                          getStatusColor(
                            getOrderStatus(
                              selectedOrder
                            )
                          ),
                      },
                    ]}
                  />

                  <Text
                    style={
                      styles.currentStatusText
                    }
                  >
                    {formatStatus(
                      getOrderStatus(
                        selectedOrder
                      )
                    )}
                  </Text>
                </View>

                {/* ========================== */}
                {/* UPDATE ORDER STATUS */}
                {/* ========================== */}

                <View
                  style={
                    styles.updateStatusCard
                  }
                >
                  <Text
                    style={
                      styles.updateStatusTitle
                    }
                  >
                    🔄 Update Order Status
                  </Text>

                  <Text
                    style={
                      styles.updateStatusSubtitle
                    }
                  >
                    Select the new status for
                    this order
                  </Text>

                  <View
                    style={
                      styles.statusButtonsContainer
                    }
                  >
                    {[
                      'PLACED',
                      'CONFIRMED',
                      'PREPARING',
                      'READY',
                      'OUT_FOR_DELIVERY',
                      'DELIVERED',
                      'CANCELLED',
                    ].map(
                      (status) => {
                        const isActive =
                          getOrderStatus(
                            selectedOrder
                          ) ===
                          status;

                        return (
                          <TouchableOpacity
                            key={
                              status
                            }
                            activeOpacity={
                              0.8
                            }
                            disabled={
                              updatingStatus
                            }
                            style={[
                              styles.statusUpdateButton,

                              isActive && {
                                backgroundColor:
                                  getStatusColor(
                                    status
                                  ),
                                borderColor:
                                  getStatusColor(
                                    status
                                  ),
                              },

                              updatingStatus && {
                                opacity: 0.6,
                              },
                            ]}
                            onPress={() =>
                              confirmStatusChange(
                                status
                              )
                            }
                          >
                            <Text
                              style={[
                                styles.statusUpdateButtonText,

                                isActive && {
                                  color:
                                    '#ffffff',
                                },
                              ]}
                            >
                              {formatStatus(
                                status
                              )}
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                    )}
                  </View>

                  {updatingStatus && (
                    <View
                      style={
                        styles.updatingBox
                      }
                    >
                      <ActivityIndicator
                        size="small"
                        color="#ff6b00"
                      />

                      <Text
                        style={
                          styles.updatingText
                        }
                      >
                        Updating order
                        status...
                      </Text>
                    </View>
                  )}
                </View>

                {/* DATE */}

                <Text
                  style={
                    styles.detailSectionTitle
                  }
                >
                  Order Date
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
                    🕐{' '}
                    {selectedOrder.createdAt
                      ? new Date(
                          selectedOrder.createdAt
                        ).toLocaleString()
                      : 'Date unavailable'}
                  </Text>
                </View>

                {/* ========================== */}
                {/* CUSTOMER */}
                {/* ========================== */}

                <Text
                  style={
                    styles.detailSectionTitle
                  }
                >
                  Customer Details
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
                    {selectedOrder.customer?.name ||
                      'Customer unavailable'}
                  </Text>

                  <Text
                    style={
                      styles.detailText
                    }
                  >
                    📞{' '}
                    {selectedOrder.customer?.phone ||
                      'Phone unavailable'}
                  </Text>

                  <Text
                    style={
                      styles.detailText
                    }
                  >
                    📍{' '}
                    {selectedOrder.customer?.address ||
                      'Address unavailable'}
                  </Text>

                  {selectedOrder.customer?.landmark && (
                    <Text
                      style={
                        styles.detailText
                      }
                    >
                      🏠 Landmark:{' '}
                      {
                        selectedOrder
                          .customer
                          .landmark
                      }
                    </Text>
                  )}
                </View>

                {/* ========================== */}
                {/* ITEMS */}
                {/* ========================== */}

                <Text
                  style={
                    styles.detailSectionTitle
                  }
                >
                  Ordered Items
                </Text>

                <View
                  style={
                    styles.detailBox
                  }
                >
                  {selectedOrder.items
                    ?.length ? (
                    selectedOrder.items.map(
                      (
                        item: any,
                        index: number
                      ) => (
                        <View
                          key={index}
                          style={
                            styles.itemRow
                          }
                        >
                          <View
                            style={{
                              flex: 1,
                            }}
                          >
                            <Text
                              style={
                                styles.itemName
                              }
                            >
                              {item.name ||
                                item.foodName ||
                                item.title ||
                                'Food Item'}
                            </Text>

                            <Text
                              style={
                                styles.itemQuantity
                              }
                            >
                              Qty:{' '}
                              {item.quantity ||
                                1}
                            </Text>

                            {item.customizations
                              ?.length > 0 && (
                              <Text
                                style={
                                  styles.itemExtra
                                }
                              >
                                Customizations:{' '}
                                {item.customizations
                                  .map(
                                    (
                                      c: any
                                    ) =>
                                      c.name
                                  )
                                  .join(
                                    ', '
                                  )}
                              </Text>
                            )}

                            {item.addOns
                              ?.length > 0 && (
                              <Text
                                style={
                                  styles.itemExtra
                                }
                              >
                                Add-ons:{' '}
                                {item.addOns
                                  .map(
                                    (
                                      a: any
                                    ) =>
                                      a.name
                                  )
                                  .join(
                                    ', '
                                  )}
                              </Text>
                            )}
                          </View>

                          <Text
                            style={
                              styles.itemPrice
                            }
                          >
                            ₹
                            {item.unitPrice ??
                              item.price ??
                              0}
                          </Text>
                        </View>
                      )
                    )
                  ) : (
                    <Text
                      style={
                        styles.detailText
                      }
                    >
                      No item details
                      available
                    </Text>
                  )}
                </View>

                {/* ========================== */}
                {/* PAYMENT */}
                {/* ========================== */}

                <Text
                  style={
                    styles.detailSectionTitle
                  }
                >
                  Payment
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
                    💳 Method:{' '}
                    {selectedOrder.paymentMethod ||
                      'N/A'}
                  </Text>

                  <Text
                    style={
                      styles.detailText
                    }
                  >
                    💰 Payment Status:{' '}
                    {selectedOrder.paymentStatus ||
                      'N/A'}
                  </Text>
                </View>

                {/* ========================== */}
                {/* BILL */}
                {/* ========================== */}

                <Text
                  style={
                    styles.detailSectionTitle
                  }
                >
                  Bill Summary
                </Text>

                <View
                  style={
                    styles.billBox
                  }
                >
                  <View
                    style={
                      styles.billRow
                    }
                  >
                    <Text
                      style={
                        styles.billLabel
                      }
                    >
                      Subtotal
                    </Text>

                    <Text
                      style={
                        styles.billValue
                      }
                    >
                      ₹
                      {selectedOrder.subtotal ??
                        0}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.billRow
                    }
                  >
                    <Text
                      style={
                        styles.billLabel
                      }
                    >
                      Delivery Fee
                    </Text>

                    <Text
                      style={
                        styles.billValue
                      }
                    >
                      ₹
                      {selectedOrder.deliveryCharge ??
                        selectedOrder.deliveryFee ??
                        0}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.billDivider
                    }
                  />

                  <View
                    style={
                      styles.billRow
                    }
                  >
                    <Text
                      style={
                        styles.grandTotalLabel
                      }
                    >
                      Grand Total
                    </Text>

                    <Text
                      style={
                        styles.grandTotal
                      }
                    >
                      ₹
                      {selectedOrder.grandTotal ??
                        selectedOrder.totalAmount ??
                        selectedOrder.total ??
                        0}
                    </Text>
                  </View>
                </View>

                {/* CLOSE */}

                <TouchableOpacity
                  style={
                    styles.closeFullButton
                  }
                  onPress={
                    closeOrderDetails
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
                    height: 30,
                  }}
                />
              </ScrollView>
            </View>
          </View>
        )}
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
    fontSize: 16,
    color: '#64748b',
  },

 header: {
  paddingTop: 55,
  paddingHorizontal: 16,
  paddingBottom: 18,
  backgroundColor: '#ffffff',
  flexDirection: 'column',
  alignItems: 'stretch',
},

  smallTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ff6b00',
    letterSpacing: 1.5,
  },

  title: {
    marginTop: 4,
    fontSize: 25,
    fontWeight: '900',
    color: '#111827',
  },

  welcome: {
    marginTop: 5,
    fontSize: 14,
    color: '#64748b',
  },

  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#fff3e8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconText: {
    fontSize: 19,
  },

  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#ffffff',
  },

  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },

  notificationPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  notificationTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },

  notificationClose: {
    fontSize: 20,
    fontWeight: '900',
    color: '#64748b',
  },

  noNotifications: {
    alignItems: 'center',
    paddingVertical: 25,
  },

  noNotificationIcon: {
    fontSize: 34,
    marginBottom: 8,
  },

  noNotificationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },

  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },

  notificationIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  notificationItemIcon: {
    fontSize: 21,
  },

  notificationContent: {
    flex: 1,
  },

  notificationItemTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },

  notificationItemMessage: {
    marginTop: 3,
    fontSize: 13,
    color: '#475569',
  },

  notificationItemTime: {
    marginTop: 4,
    fontSize: 11,
    color: '#94a3b8',
  },

  sectionTitle: {
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 20,
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },

  statsGrid: {
    paddingHorizontal: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  statCard: {
    width: '46%',
    margin: '2%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    minHeight: 120,
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
    fontSize: 23,
  },

  statNumber: {
    marginTop: 7,
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
    fontSize: 14,
    color: '#111827',
  },

  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },

  filterButton: {
    paddingHorizontal: 14,
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
    fontWeight: '800',
    color: '#64748b',
  },

  filterTextActive: {
    color: '#ffffff',
  },

  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 20,
  },

  orderCount: {
    marginTop: 20,
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },

  orderCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 17,
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

  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  orderNumber: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
  },

  orderDate: {
    marginTop: 4,
    fontSize: 11,
    color: '#94a3b8',
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },

  divider: {
    height: 1,
    backgroundColor: '#eef2f7',
    marginVertical: 12,
  },

  customerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },

  customerPhone: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748b',
  },

  address: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: '#64748b',
  },

  orderBottom: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eef2f7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  itemsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },

  totalText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ff6b00',
  },

  emptyBox: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 30,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 42,
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },

  emptyText: {
    marginTop: 5,
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },

  /* MODAL */

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor:
      'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    padding: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },

  modalTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#111827',
  },

  modalOrderNumber: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '700',
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
    fontWeight: '800',
    color: '#334155',
  },

  currentStatusBox: {
    minHeight: 52,
    borderWidth: 2,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },

  currentStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },

  currentStatusText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },

  updateStatusCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },

  updateStatusTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
  },

  updateStatusSubtitle: {
    marginTop: 5,
    marginBottom: 13,
    fontSize: 12,
    color: '#64748b',
  },

  statusButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  statusUpdateButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },

  statusUpdateButtonText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#334155',
  },

  updatingBox: {
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#fed7aa',
    flexDirection: 'row',
    alignItems: 'center',
  },

  updatingText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '800',
    color: '#ff6b00',
  },

  detailSectionTitle: {
    marginTop: 20,
    marginBottom: 9,
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
  },

  detailBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 15,
    padding: 14,
  },

  detailText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 5,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },

  itemQuantity: {
    marginTop: 3,
    fontSize: 12,
    color: '#64748b',
  },

  itemExtra: {
    marginTop: 3,
    fontSize: 11,
    color: '#64748b',
  },

  itemPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ff6b00',
  },

  billBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 15,
    padding: 15,
  },

  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },

  billLabel: {
    fontSize: 14,
    color: '#64748b',
  },

  billValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },

  billDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 10,
  },

  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },

  grandTotal: {
    fontSize: 21,
    fontWeight: '900',
    color: '#ff6b00',
  },

  closeFullButton: {
    marginTop: 20,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeFullButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },

  bottomSpace: {
    height: 40,
  },
});