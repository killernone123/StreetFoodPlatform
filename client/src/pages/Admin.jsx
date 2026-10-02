import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../services/api";

const SOCKET_URL = "https://streetfoodplatform-1.onrender.com";

const Admin = () => {

    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("ALL");
    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const [newOrderAlert, setNewOrderAlert] =
        useState(null);


    // =====================================
    // FETCH ORDERS
    // =====================================

    const fetchOrders = async () => {

        try {

            setLoading(true);

            setError("");


            const token =
                localStorage.getItem(
                    "adminToken"
                );


            if (!token) {

                navigate("/admin-login");

                return;
            }


            const response =
                await API.get(
                    "/orders",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            if (response.data.success) {

                setOrders(
                    response.data.orders || []
                );

            }


        } catch (error) {

            console.error(
                "Fetch Orders Error:",
                error
            );


            if (
                error.response?.status === 401
            ) {

                localStorage.removeItem(
                    "adminToken"
                );

                localStorage.removeItem(
                    "adminData"
                );

                navigate("/admin-login");

                return;
            }


            setError(
                error.response?.data?.message ||
                "Failed to load orders"
            );


        } finally {

            setLoading(false);

        }
    };


    // =====================================
    // ADMIN LOGIN CHECK
    // =====================================

    useEffect(() => {

        const token =
            localStorage.getItem("adminToken");

        if (!token) {
            navigate("/admin-login");
            return;
        }

        fetchOrders();

        requestNotificationPermission();



        // =================================
        // CONNECT SOCKET
        // =================================

        const socket = io(SOCKET_URL, {
            transports: ["polling"],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            timeout: 15000
        });
        window.adminSocket = socket;
        console.log("🔌 Connecting admin socket...");


        // =================================
        // SOCKET CONNECTED
        // =================================

        socket.on("connect", () => {

            console.log(
                "🟢 Admin socket connected:",
                socket.id
            );

            // JOIN ADMIN ROOM
            socket.emit("joinAdminRoom");

            console.log(
                "👨‍💼 joinAdminRoom event sent"
            );

        });


        // =================================
        // NEW ORDER
        // =================================
        socket.on("newOrder", async (newOrder) => {

            console.log(
                "🔔 NEW ORDER RECEIVED:",
                newOrder
            );

            // 🔄 Get latest orders from backend
            await fetchOrders();

            setNewOrderAlert(newOrder);

            setTimeout(() => {
                setNewOrderAlert(null);
            }, 5000);

            // =================================
            // ADD ORDER TO LIST
            // =================================

            setOrders((previousOrders) => {

                const alreadyExists =
                    previousOrders.some(
                        (order) =>
                            order._id === newOrder._id
                    );

                if (alreadyExists) {
                    return previousOrders;
                }

                return [
                    newOrder,
                    ...previousOrders
                ];
            });


            // =================================
            // NOTIFICATION
            // =================================

            const notification = {
                id: newOrder._id,
                orderNumber: newOrder.orderNumber,
                customerName:
                    newOrder.customer?.name || "Customer",
                total: newOrder.grandTotal,
                time: new Date()
            };

            setNotifications((previous) => [
                notification,
                ...previous
            ]);

            setNotificationCount(
                (previous) => previous + 1
            );


            // =================================
            // BROWSER NOTIFICATION
            // =================================

            if (
                "Notification" in window &&
                Notification.permission === "granted"
            ) {

                const browserNotification =
                    new Notification(
                        "🔔 New Order Received!",
                        {
                            body:
                                `Order: ${newOrder.orderNumber}\n` +
                                `Customer: ${newOrder.customer?.name || "Customer"}\n` +
                                `Total: ₹${newOrder.grandTotal}`,

                            icon: "/favicon.ico",

                            tag: newOrder._id
                        }
                    );


                browserNotification.onclick = () => {

                    window.focus();

                    browserNotification.close();

                };

            }


            // =================================
            // SOUND
            // =================================

            try {

                const audio =
                    new Audio("/notification.mp3");

                audio.volume = 0.8;

                audio.play().catch(() => {
                    console.log(
                        "Notification sound blocked by browser"
                    );
                });

            } catch (error) {

                console.log(
                    "Notification sound error:",
                    error
                );

            }



        });

        // =================================
        // DISCONNECT
        // =================================

        socket.on("disconnect", (reason) => {

            console.log(
                "🔴 Admin socket disconnected:",
                reason
            );

        });


        // =================================
        // CLEANUP
        // =================================

        return () => {

            console.log(
                "🧹 Closing admin socket..."
            );

            socket.disconnect();

        };

    }, []);

    // =====================================
    // UPDATE STATUS
    // =====================================

    const updateStatus =
        async (
            orderId,
            newStatus
        ) => {

            try {

                const token =
                    localStorage.getItem(
                        "adminToken"
                    );


                if (!token) {

                    navigate(
                        "/admin-login"
                    );

                    return;
                }


                const response =
                    await API.patch(

                        `/orders/${orderId}/status`,

                        {
                            status:
                                newStatus
                        },

                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }

                    );


                if (
                    response.data.success
                ) {

                    setOrders(
                        (
                            previousOrders
                        ) =>

                            previousOrders.map(
                                (
                                    order
                                ) =>

                                    order._id ===
                                        orderId

                                        ? {
                                            ...order,
                                            orderStatus:
                                                newStatus
                                        }

                                        : order
                            )

                    );

                }


            } catch (error) {

                console.error(
                    "Update Status Error:",
                    error
                );


                if (
                    error.response
                        ?.status === 401
                ) {

                    localStorage.removeItem(
                        "adminToken"
                    );

                    localStorage.removeItem(
                        "adminData"
                    );

                    navigate(
                        "/admin-login"
                    );

                    return;
                }


                setError(
                    error.response?.data
                        ?.message ||
                    "Failed to update order status"
                );

            }

        };


    // =====================================
    // FILTER ORDERS
    // =====================================

    const filteredOrders =
        useMemo(() => {

            return orders.filter(
                (order) => {

                    const searchText =
                        search
                            .toLowerCase()
                            .trim();


                    const matchesSearch =

                        !searchText ||

                        order.orderNumber
                            ?.toLowerCase()
                            .includes(
                                searchText
                            ) ||

                        order.customer?.name
                            ?.toLowerCase()
                            .includes(
                                searchText
                            ) ||

                        order.customer?.phone
                            ?.toLowerCase()
                            .includes(
                                searchText
                            );


                    const matchesStatus =

                        statusFilter ===
                        "ALL" ||

                        order.orderStatus ===
                        statusFilter;


                    return (
                        matchesSearch &&
                        matchesStatus
                    );

                }
            );

        }, [
            orders,
            search,
            statusFilter
        ]);


    // =====================================
    // FORMAT DATE
    // =====================================

    const formatDate = (date) => {

        return new Date(date)
            .toLocaleString(
                "en-IN",
                {
                    dateStyle:
                        "medium",

                    timeStyle:
                        "short"
                }
            );

    };


    // =====================================
    // STATUS CLASS
    // =====================================

    const getStatusClass =
        (status) => {

            return status
                .toLowerCase()
                .replaceAll(
                    "_",
                    "-"
                );

        };


    // =====================================
    // COUNTS
    // =====================================

    const placedCount =
        orders.filter(
            (order) =>
                order.orderStatus ===
                "PLACED"
        ).length;


    const confirmedCount =
        orders.filter(
            (order) =>
                order.orderStatus ===
                "CONFIRMED"
        ).length;


    const preparingCount =
        orders.filter(
            (order) =>
                order.orderStatus ===
                "PREPARING"
        ).length;


    const readyCount =
        orders.filter(
            (order) =>
                order.orderStatus ===
                "READY"
        ).length;


    const deliveryCount =
        orders.filter(
            (order) =>
                order.orderStatus ===
                "OUT_FOR_DELIVERY"
        ).length;


    const completedCount =
        orders.filter(
            (order) =>
                order.orderStatus ===
                "DELIVERED"
        ).length;


    // =====================================
    // BROWSER NOTIFICATION
    // =====================================

    const requestNotificationPermission = async () => {

        if (!("Notification" in window)) {
            console.log(
                "This browser does not support notifications"
            );
            return;
        }

        if (Notification.permission === "default") {

            const permission =
                await Notification.requestPermission();

            console.log(
                "Notification permission:",
                permission
            );
        }
    };


    // =====================================
    // LOGOUT
    // =====================================

    const logoutAdmin = () => {

        localStorage.removeItem(
            "adminToken"
        );

        localStorage.removeItem(
            "adminData"
        );

        navigate(
            "/admin-login"
        );

    };


    // =====================================
    // UI
    // =====================================

    return (

        <div className="admin-page">


            {/* =================================
    NEW ORDER TOAST
================================= */}

            {newOrderAlert && (

                <div
                    className="new-order-toast"
                    onClick={() => {

                        setShowNotifications(false);

                        setStatusFilter("ALL");

                        setSearch(
                            newOrderAlert.orderNumber
                        );

                        setNewOrderAlert(null);

                    }}
                >

                    {/* ICON */}

                    <div className="toast-icon">
                        🛍️
                    </div>


                    {/* CONTENT */}

                    <div className="toast-content">

                        <strong>
                            New Order Received!
                        </strong>

                        <span>
                            {newOrderAlert.orderNumber}
                        </span>

                        <small>

                            {newOrderAlert.customer?.name ||
                                "Customer"}

                            {" • "}

                            ₹{newOrderAlert.grandTotal}

                        </small>

                    </div>


                    {/* CLOSE BUTTON */}

                    <button
                        className="toast-close"
                        onClick={(event) => {

                            event.stopPropagation();

                            setNewOrderAlert(null);

                        }}
                    >
                        ✕
                    </button>

                </div>

            )}


            {/* =================================
    HEADER
================================= */}

            <div className="admin-header">

                {/* LEFT SIDE */}
                <div className="admin-header-info">

                    <p className="admin-label">
                        STREET FOOD
                    </p>

                    <h1>
                        Admin Dashboard
                    </h1>

                    <p>
                        Manage customer orders
                    </p>

                </div>


                {/* RIGHT SIDE */}
                <div className="admin-header-actions">

                    {/* =========================
            NOTIFICATION
        ========================= */}

                    <div className="notification-wrapper">

                        <button
                            className="notification-btn"
                            onClick={() => {

                                setShowNotifications(
                                    (previous) => !previous
                                );

                                setNotificationCount(0);

                            }}
                        >

                            🔔

                            {notificationCount > 0 && (

                                <span className="notification-badge">

                                    {notificationCount > 99
                                        ? "99+"
                                        : notificationCount}

                                </span>

                            )}

                        </button>


                        {/* NOTIFICATION PANEL */}

                        {showNotifications && (

                            <div className="notification-panel">

                                <div className="notification-panel-header">

                                    <strong>
                                        Notifications
                                    </strong>

                                    <button
                                        onClick={() => {

                                            setNotifications([]);

                                            setNotificationCount(0);

                                        }}
                                    >
                                        Clear
                                    </button>

                                </div>


                                {notifications.length === 0 ? (

                                    <div className="no-notifications">

                                        🔔

                                        <p>
                                            No new notifications
                                        </p>

                                    </div>

                                ) : (

                                    notifications.map(
                                        (notification) => (

                                            <div
                                                className="notification-item"
                                                key={notification.id}
                                                onClick={() => {

                                                    setShowNotifications(
                                                        false
                                                    );

                                                    setStatusFilter(
                                                        "ALL"
                                                    );

                                                    setSearch(
                                                        notification.orderNumber
                                                    );

                                                }}
                                            >

                                                <div className="notification-icon">
                                                    🛍️
                                                </div>


                                                <div>

                                                    <strong>
                                                        New Order
                                                    </strong>

                                                    <p>
                                                        {
                                                            notification.orderNumber
                                                        }
                                                    </p>

                                                    <small>

                                                        {
                                                            notification.customerName
                                                        }

                                                        {" • "}

                                                        ₹
                                                        {
                                                            notification.total
                                                        }

                                                    </small>

                                                </div>

                                            </div>

                                        )
                                    )

                                )}

                            </div>

                        )}

                    </div>


                    {/* =========================
            REFRESH
        ========================= */}

                    <button
                        className="refresh-btn"
                        onClick={fetchOrders}
                    >
                        🔄 Refresh
                    </button>


                    {/* =========================
            LOGOUT
        ========================= */}

                    <button
                        className="refresh-btn"
                        onClick={logoutAdmin}
                    >
                        🚪 Logout
                    </button>

                </div>

            </div>


            {/* =================================
                STATS
            ================================= */}

            <div className="admin-stats">


                <div className="stat-card">

                    <span>
                        📦
                    </span>

                    <div>

                        <p>
                            Total Orders
                        </p>

                        <h2>
                            {orders.length}
                        </h2>

                    </div>

                </div>


                <div className="stat-card">

                    <span>
                        🆕
                    </span>

                    <div>

                        <p>
                            New Orders
                        </p>

                        <h2>
                            {placedCount}
                        </h2>

                    </div>

                </div>


                <div className="stat-card">

                    <span>
                        🔵
                    </span>

                    <div>

                        <p>
                            Confirmed
                        </p>

                        <h2>
                            {confirmedCount}
                        </h2>

                    </div>

                </div>


                <div className="stat-card">

                    <span>
                        👨‍🍳
                    </span>

                    <div>

                        <p>
                            Preparing
                        </p>

                        <h2>
                            {preparingCount}
                        </h2>

                    </div>

                </div>


                <div className="stat-card">

                    <span>
                        🍔
                    </span>

                    <div>

                        <p>
                            Ready
                        </p>

                        <h2>
                            {readyCount}
                        </h2>

                    </div>

                </div>


                <div className="stat-card">

                    <span>
                        🛵
                    </span>

                    <div>

                        <p>
                            Out for Delivery
                        </p>

                        <h2>
                            {deliveryCount}
                        </h2>

                    </div>

                </div>


                <div className="stat-card">

                    <span>
                        ✅
                    </span>

                    <div>

                        <p>
                            Delivered
                        </p>

                        <h2>
                            {completedCount}
                        </h2>

                    </div>

                </div>

            </div>


            {/* =================================
                FILTERS
            ================================= */}

            <div className="admin-filters">

                <div className="admin-search">

                    <span>
                        🔎
                    </span>

                    <input
                        type="text"
                        placeholder="Search order, customer or phone..."
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />

                </div>


                <select
                    value={statusFilter}
                    onChange={(event) =>
                        setStatusFilter(
                            event.target.value
                        )
                    }
                >

                    <option value="ALL">
                        All Orders
                    </option>

                    <option value="PLACED">
                        Placed
                    </option>

                    <option value="CONFIRMED">
                        Confirmed
                    </option>

                    <option value="PREPARING">
                        Preparing
                    </option>

                    <option value="READY">
                        Ready
                    </option>

                    <option value="OUT_FOR_DELIVERY">
                        Out for Delivery
                    </option>

                    <option value="DELIVERED">
                        Delivered
                    </option>

                    <option value="CANCELLED">
                        Cancelled
                    </option>

                </select>

            </div>


            {/* =================================
                ORDERS
            ================================= */}

            <div className="admin-orders">

                <div className="orders-heading">

                    <div>

                        <h2>
                            Orders
                        </h2>

                        <p>
                            Showing{" "}
                            {
                                filteredOrders.length
                            }{" "}
                            of{" "}
                            {
                                orders.length
                            }{" "}
                            orders
                        </p>

                    </div>

                </div>


                {loading && (

                    <div className="admin-message">

                        Loading orders...

                    </div>

                )}


                {error && (

                    <div className="admin-error">

                        {error}

                    </div>

                )}


                {!loading &&
                    !error &&
                    filteredOrders.length ===
                    0 && (

                        <div className="admin-message">

                            <div>
                                📦
                            </div>

                            <h3>
                                No orders yet
                            </h3>

                            <p>
                                Customer orders
                                will appear here.
                            </p>

                        </div>

                    )}


                {!loading &&
                    filteredOrders.map(
                        (order) => (

                            <div
                                className="admin-order-card"
                                key={order._id}
                            >


                                {/* ORDER TOP */}

                                <div className="order-top">

                                    <div>

                                        <h3>
                                            {
                                                order.orderNumber
                                            }
                                        </h3>

                                        <p>
                                            {
                                                formatDate(
                                                    order.createdAt
                                                )
                                            }
                                        </p>

                                    </div>


                                    <span
                                        className={`order-status ${getStatusClass(
                                            order.orderStatus
                                        )}`}
                                    >

                                        {
                                            order.orderStatus
                                                .replaceAll(
                                                    "_",
                                                    " "
                                                )
                                        }

                                    </span>

                                </div>


                                {/* CUSTOMER */}

                                <div className="order-customer">

                                    <h4>
                                        👤 Customer
                                    </h4>

                                    <p>
                                        <strong>
                                            {
                                                order.customer
                                                    ?.name
                                            }
                                        </strong>
                                    </p>

                                    <p>
                                        📞{" "}
                                        {
                                            order.customer
                                                ?.phone
                                        }
                                    </p>

                                    <p>
                                        📍{" "}
                                        {
                                            order.customer
                                                ?.address
                                        }
                                    </p>

                                    {
                                        order.customer
                                            ?.landmark && (

                                            <p>
                                                🏠 Near:{" "}
                                                {
                                                    order.customer
                                                        .landmark
                                                }
                                            </p>

                                        )
                                    }

                                </div>


                                {/* ITEMS */}

                                <div className="admin-order-items">

                                    <h4>
                                        🍽️ Items
                                    </h4>


                                    {
                                        order.items?.map(
                                            (
                                                item,
                                                index
                                            ) => (

                                                <div
                                                    className="admin-item"
                                                    key={
                                                        `${item.foodId}-${index}`
                                                    }
                                                >

                                                    <div>

                                                        <strong>
                                                            {
                                                                item.name
                                                            }
                                                        </strong>

                                                        <span>
                                                            ×{" "}
                                                            {
                                                                item.quantity
                                                            }
                                                        </span>


                                                        {
                                                            item
                                                                .customizations
                                                                ?.length >
                                                            0 && (

                                                                <div className="admin-tags">

                                                                    {
                                                                        item.customizations.map(
                                                                            (
                                                                                customization
                                                                            ) => (

                                                                                <small
                                                                                    key={
                                                                                        customization.name
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        customization.name
                                                                                    }
                                                                                </small>

                                                                            )
                                                                        )
                                                                    }

                                                                </div>

                                                            )
                                                        }


                                                        {
                                                            item
                                                                .addOns
                                                                ?.length >
                                                            0 && (

                                                                <div className="admin-tags">

                                                                    {
                                                                        item.addOns.map(
                                                                            (
                                                                                addOn
                                                                            ) => (

                                                                                <small
                                                                                    key={
                                                                                        addOn.name
                                                                                    }
                                                                                >
                                                                                    +{" "}
                                                                                    {
                                                                                        addOn.name
                                                                                    }
                                                                                </small>

                                                                            )
                                                                        )
                                                                    }

                                                                </div>

                                                            )
                                                        }

                                                    </div>


                                                    <strong>

                                                        ₹
                                                        {
                                                            item.unitPrice *
                                                            item.quantity
                                                        }

                                                    </strong>

                                                </div>

                                            )
                                        )
                                    }

                                </div>


                                {/* TOTAL */}

                                <div className="admin-total">

                                    <div>

                                        <span>
                                            Payment
                                        </span>

                                        <strong>
                                            {
                                                order.paymentMethod
                                            }
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Grand Total
                                        </span>

                                        <strong>
                                            ₹
                                            {
                                                order.grandTotal
                                            }
                                        </strong>

                                    </div>

                                </div>


                                {/* STATUS */}

                                <div className="status-control">

                                    <label>
                                        Update Status
                                    </label>


                                    <select
                                        value={
                                            order.orderStatus
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateStatus(
                                                order._id,
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    >

                                        <option value="PLACED">
                                            Placed
                                        </option>

                                        <option value="CONFIRMED">
                                            Confirmed
                                        </option>

                                        <option value="PREPARING">
                                            Preparing
                                        </option>

                                        <option value="READY">
                                            Ready
                                        </option>

                                        <option value="OUT_FOR_DELIVERY">
                                            Out for Delivery
                                        </option>

                                        <option value="DELIVERED">
                                            Delivered
                                        </option>

                                        <option value="CANCELLED">
                                            Cancelled
                                        </option>

                                    </select>

                                    <button
                                        type="button"
                                        className="view-order-btn"
                                        onClick={() => {
                                            console.log("✅ VIEW BUTTON CLICKED");
                                            console.log("📦 SELECTED ORDER:", order);

                                            setSelectedOrder(order);
                                            setShowOrderDetails(true);
                                        }}
                                    >
                                        👁️ View Full Details
                                    </button>

                                </div>

                            </div>

                        )
                    )}

            </div>
            {/* =================================
    ORDER DETAILS MODAL
================================= */}
            {showOrderDetails &&
                selectedOrder &&
                createPortal(
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100vw",
                            height: "100vh",
                            background: "rgba(0, 0, 0, 0.65)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "20px",
                            zIndex: 999999,
                            boxSizing: "border-box"
                        }}
                        onClick={() => {
                            setShowOrderDetails(false);
                            setSelectedOrder(null);
                        }}
                    >

                        <div
                            style={{
                                width: "700px",
                                maxWidth: "95vw",
                                maxHeight: "90vh",
                                overflowY: "auto",
                                background: "#ffffff",
                                borderRadius: "20px",
                                boxShadow: "0 25px 80px rgba(0,0,0,0.35)",
                                position: "relative",
                                zIndex: 1000000,
                                boxSizing: "border-box"
                            }}
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            {/* =================================
                MODAL HEADER
            ================================= */}

                            <div className="order-modal-header">

                                <div>

                                    <span>
                                        ORDER DETAILS
                                    </span>

                                    <h2>
                                        {selectedOrder.orderNumber}
                                    </h2>

                                </div>


                                <button
                                    className="modal-close-btn"
                                    onClick={() => {
                                        setShowOrderDetails(false);
                                        setSelectedOrder(null);
                                    }}
                                >
                                    ✕
                                </button>

                            </div>


                            {/* =================================
                ORDER STATUS
            ================================= */}

                            <div className="modal-status-row">

                                <span
                                    className={`order-status ${getStatusClass(
                                        selectedOrder.orderStatus
                                    )}`}
                                >

                                    {selectedOrder.orderStatus
                                        .replaceAll("_", " ")}

                                </span>


                                <span>
                                    {formatDate(
                                        selectedOrder.createdAt
                                    )}
                                </span>

                            </div>


                            {/* =================================
                CUSTOMER INFORMATION
            ================================= */}

                            <div className="modal-section">

                                <h3>
                                    👤 Customer Information
                                </h3>


                                <div className="modal-info-grid">

                                    {/* NAME */}

                                    <div>

                                        <span>
                                            Name
                                        </span>

                                        <strong>
                                            {
                                                selectedOrder
                                                    .customer
                                                    ?.name
                                            }
                                        </strong>

                                    </div>


                                    {/* PHONE */}

                                    <div>

                                        <span>
                                            Phone
                                        </span>

                                        <strong>
                                            📞{" "}
                                            {
                                                selectedOrder
                                                    .customer
                                                    ?.phone
                                            }
                                        </strong>

                                    </div>


                                    {/* ADDRESS */}

                                    <div className="full-width">

                                        <span>
                                            Address
                                        </span>

                                        <strong>
                                            📍{" "}
                                            {
                                                selectedOrder
                                                    .customer
                                                    ?.address
                                            }
                                        </strong>

                                    </div>


                                    {/* LANDMARK */}

                                    {selectedOrder.customer?.landmark && (

                                        <div className="full-width">

                                            <span>
                                                Landmark
                                            </span>

                                            <strong>
                                                🏠{" "}
                                                {
                                                    selectedOrder
                                                        .customer
                                                        .landmark
                                                }
                                            </strong>

                                        </div>

                                    )}

                                </div>

                            </div>


                            {/* =================================
                ORDERED ITEMS
            ================================= */}

                            <div className="modal-section">

                                <h3>
                                    🍽️ Ordered Items
                                </h3>


                                <div className="modal-items">

                                    {selectedOrder.items?.map(
                                        (item, index) => (

                                            <div
                                                className="modal-item"
                                                key={`${item.foodId}-${index}`}
                                            >

                                                <div className="modal-item-main">

                                                    <div>

                                                        {/* ITEM NAME */}

                                                        <strong>
                                                            {item.name}
                                                        </strong>


                                                        {/* QUANTITY */}

                                                        <span>
                                                            Quantity:{" "}
                                                            {item.quantity}
                                                        </span>


                                                        {/* CUSTOMIZATIONS */}

                                                        {item.customizations?.length > 0 && (

                                                            <div className="modal-tags">

                                                                {item.customizations.map(
                                                                    (
                                                                        customization,
                                                                        customizationIndex
                                                                    ) => (

                                                                        <small
                                                                            key={`${customization.name}-${customizationIndex}`}
                                                                        >

                                                                            ⚙️{" "}

                                                                            {
                                                                                customization.name
                                                                            }

                                                                            {customization.price > 0 &&
                                                                                ` +₹${customization.price}`}

                                                                        </small>

                                                                    )
                                                                )}

                                                            </div>

                                                        )}


                                                        {/* ADDONS */}

                                                        {item.addOns?.length > 0 && (

                                                            <div className="modal-tags">

                                                                {item.addOns.map(
                                                                    (
                                                                        addOn,
                                                                        addOnIndex
                                                                    ) => (

                                                                        <small
                                                                            key={`${addOn.name}-${addOnIndex}`}
                                                                        >

                                                                            ➕{" "}

                                                                            {
                                                                                addOn.name
                                                                            }

                                                                            {addOn.price > 0 &&
                                                                                ` +₹${addOn.price}`}

                                                                        </small>

                                                                    )
                                                                )}

                                                            </div>

                                                        )}

                                                    </div>


                                                    {/* ITEM TOTAL */}

                                                    <strong>

                                                        ₹
                                                        {
                                                            item.unitPrice *
                                                            item.quantity
                                                        }

                                                    </strong>

                                                </div>

                                            </div>

                                        )
                                    )}

                                </div>

                            </div>


                            {/* =================================
                PAYMENT INFORMATION
            ================================= */}

                            <div className="modal-section">

                                <h3>
                                    💳 Payment
                                </h3>


                                <div className="payment-info">

                                    {/* PAYMENT METHOD */}

                                    <div>

                                        <span>
                                            Method
                                        </span>

                                        <strong>
                                            {
                                                selectedOrder
                                                    .paymentMethod
                                            }
                                        </strong>

                                    </div>


                                    {/* PAYMENT STATUS */}

                                    <div>

                                        <span>
                                            Payment Status
                                        </span>

                                        <strong>
                                            {
                                                selectedOrder
                                                    .paymentStatus
                                            }
                                        </strong>

                                    </div>

                                </div>

                            </div>


                            {/* =================================
                BILL SUMMARY
            ================================= */}

                            <div className="modal-bill">

                                {/* SUBTOTAL */}

                                <div>

                                    <span>
                                        Subtotal
                                    </span>

                                    <strong>
                                        ₹
                                        {
                                            selectedOrder
                                                .subtotal
                                        }
                                    </strong>

                                </div>


                                {/* DELIVERY */}

                                <div>

                                    <span>
                                        Delivery Charge
                                    </span>

                                    <strong>
                                        ₹
                                        {
                                            selectedOrder
                                                .deliveryCharge
                                        }
                                    </strong>

                                </div>


                                {/* GRAND TOTAL */}

                                <div className="modal-grand-total">

                                    <span>
                                        Grand Total
                                    </span>

                                    <strong>
                                        ₹
                                        {
                                            selectedOrder
                                                .grandTotal
                                        }
                                    </strong>

                                </div>

                            </div>


                            {/* =================================
                UPDATE STATUS
            ================================= */}

                            <div className="modal-status-control">

                                <label>
                                    Update Order Status
                                </label>


                                <select
                                    value={
                                        selectedOrder.orderStatus
                                    }
                                    onChange={(event) => {

                                        const newStatus =
                                            event.target.value;


                                        // BACKEND UPDATE

                                        updateStatus(
                                            selectedOrder._id,
                                            newStatus
                                        );


                                        // MODAL UI UPDATE

                                        setSelectedOrder(
                                            (previous) => ({
                                                ...previous,

                                                orderStatus:
                                                    newStatus
                                            })
                                        );

                                    }}
                                >

                                    <option value="PLACED">
                                        Placed
                                    </option>

                                    <option value="CONFIRMED">
                                        Confirmed
                                    </option>

                                    <option value="PREPARING">
                                        Preparing
                                    </option>

                                    <option value="READY">
                                        Ready
                                    </option>

                                    <option value="OUT_FOR_DELIVERY">
                                        Out for Delivery
                                    </option>

                                    <option value="DELIVERED">
                                        Delivered
                                    </option>

                                    <option value="CANCELLED">
                                        Cancelled
                                    </option>

                                </select>

                            </div>

                        </div>

                    </div>,
                    document.body

                )}

        </div>

    );

};

export default Admin;