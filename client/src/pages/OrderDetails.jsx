import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../services/api";

const SOCKET_URL = "http://localhost:5000";

const OrderDetails = () => {

    const { id } = useParams();

    const navigate = useNavigate();


    // =====================================
    // STATES
    // =====================================

    const [order, setOrder] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [liveUpdate, setLiveUpdate] = useState(false);


    // =====================================
    // FETCH ORDER
    // =====================================

    const fetchOrder = async () => {

        try {

            setLoading(true);

            setError("");


            const token =
                localStorage.getItem(
                    "customerToken"
                );


            if (!token) {

                navigate("/login");

                return;
            }


            const response =
                await API.get(
                    `/orders/${id}`
                );


            if (response.data.success) {

                setOrder(
                    response.data.order
                );
            }


        } catch (error) {

            console.error(
                "Order Details Error:",
                error
            );


            if (
                error.response?.status === 401
            ) {

                localStorage.removeItem(
                    "customerToken"
                );

                localStorage.removeItem(
                    "customerData"
                );

                navigate("/login");

                return;
            }


            setError(
                error.response?.data?.message ||
                "Failed to load order details."
            );


        } finally {

            setLoading(false);

        }
    };


    // =====================================
    // FETCH ORDER ON PAGE LOAD
    // =====================================

    useEffect(() => {

        fetchOrder();


        // =================================
        // CONNECT CUSTOMER SOCKET
        // =================================

        const socket = io("http://localhost:5000", {
            transports: ["websocket"],
            reconnection: true
        });

        console.log(
            "🔌 Connecting customer socket..."
        );


        // =================================
        // SOCKET CONNECTED
        // =================================

        socket.on("connect", () => {

            console.log(
                "🟢 Customer socket connected:",
                socket.id
            );


            // Join current order room
            socket.emit(
                "joinOrderRoom",
                id
            );

            console.log(
                "📦 Joined order room:",
                `order_${id}`
            );

        });


        // =================================
        // LIVE ORDER STATUS
        // =================================

        socket.on(
            "orderStatusUpdated",
            (data) => {

                console.log(
                    "🔔 LIVE ORDER STATUS:",
                    data
                );


                if (
                    data.orderId?.toString() ===
                    id?.toString()
                ) {

                    setOrder((previousOrder) => {

                        if (!previousOrder) {
                            return previousOrder;
                        }

                        return {
                            ...previousOrder,
                            orderStatus:
                                data.status
                        };

                    });

                }

            }
        );


        // =================================
        // DISCONNECT
        // =================================

        socket.on("disconnect", (reason) => {

            console.log(
                "🔴 Customer socket disconnected:",
                reason
            );

        });


        // =================================
        // CLEANUP
        // =================================

        return () => {

            console.log(
                "🧹 Closing customer socket..."
            );

            socket.disconnect();

        };

    }, [id]);

    // =====================================
    // SOCKET.IO LIVE TRACKING
    // =====================================

    useEffect(() => {

        if (!id) {
            return;
        }


        console.log(
            "🔌 Connecting to live order tracking..."
        );


        const socket =
            io(SOCKET_URL);


        // =================================
        // SOCKET CONNECTED
        // =================================

        socket.on("connect", () => {

            console.log(
                "🟢 Socket connected:",
                socket.id
            );


            // Join specific order room

            socket.emit(
                "joinOrderRoom",
                id
            );


            console.log(
                `📦 Joined order room: order_${id}`
            );
        });


        // =================================
        // LIVE ORDER STATUS UPDATE
        // =================================

        socket.on(
            "orderStatusUpdated",
            (data) => {

                console.log(
                    "🔔 Live order update:",
                    data
                );


                if (
                    data.orderId?.toString() !==
                    id.toString()
                ) {
                    return;
                }


                // Update only status

                setOrder((previousOrder) => {

                    if (!previousOrder) {
                        return previousOrder;
                    }


                    return {
                        ...previousOrder,

                        orderStatus:
                            data.status
                    };

                });


                // Show small live notification

                setLiveUpdate(true);


                setTimeout(() => {

                    setLiveUpdate(false);

                }, 3000);

            }
        );


        // =================================
        // SOCKET DISCONNECTED
        // =================================

        socket.on("disconnect", () => {

            console.log(
                "🔴 Socket disconnected"
            );

        });


        // =================================
        // CLEANUP
        // =================================

        return () => {

            console.log(
                "🔌 Closing socket..."
            );


            socket.disconnect();

        };


    }, [id]);


    // =====================================
    // ORDER STATUS STEPS
    // =====================================

    const statusSteps = [

        {
            key: "PLACED",
            title: "Order Placed",
            icon: "🟡"
        },

        {
            key: "CONFIRMED",
            title: "Order Confirmed",
            icon: "🔵"
        },

        {
            key: "PREPARING",
            title: "Preparing Food",
            icon: "👨‍🍳"
        },

        {
            key: "READY",
            title: "Food Ready",
            icon: "🍔"
        },

        {
            key: "OUT_FOR_DELIVERY",
            title: "Out for Delivery",
            icon: "🚚"
        },

        {
            key: "DELIVERED",
            title: "Delivered",
            icon: "🟢"
        }

    ];


    // =====================================
    // CURRENT STEP
    // =====================================

    const getCurrentStep = () => {

        if (!order) {
            return -1;
        }


        return statusSteps.findIndex(
            (step) =>
                step.key ===
                order.orderStatus
        );

    };


    // =====================================
    // FORMAT DATE
    // =====================================

    const formatDate = (date) => {

        return new Date(date).toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    };


    // =====================================
    // LOADING
    // =====================================

    if (loading) {

        return (

            <div className="order-details-page">

                <div className="order-details-loading">

                    <div>🍔</div>

                    <h2>
                        Loading Order...
                    </h2>

                    <p>
                        Please wait.
                    </p>

                </div>

            </div>

        );
    }


    // =====================================
    // ERROR
    // =====================================

    if (error || !order) {

        return (

            <div className="order-details-page">

                <div className="order-details-error">

                    <div>😕</div>

                    <h2>
                        {error ||
                            "Order not found"}
                    </h2>


                    <button
                        onClick={() =>
                            navigate(
                                "/my-orders"
                            )
                        }
                    >
                        ← Back to My Orders
                    </button>

                </div>

            </div>

        );
    }


    const currentStep =
        getCurrentStep();


    // =====================================
    // MAIN UI
    // =====================================

    return (

        <div className="order-details-page">

            <div className="order-details-container">


                {/* =================================
                    LIVE UPDATE MESSAGE
                ================================= */}

                {liveUpdate && (

                    <div className="live-order-update">

                        🔔 Order status updated
                        <strong>
                            Live
                        </strong>

                    </div>

                )}


                {/* =================================
                    TOP BUTTONS
                ================================= */}

                <div className="order-details-top">

                    <button
                        className="order-back-btn"
                        onClick={() =>
                            navigate(
                                "/my-orders"
                            )
                        }
                    >
                        ← My Orders
                    </button>


                    <button
                        className="order-refresh-btn"
                        onClick={fetchOrder}
                    >
                        🔄 Refresh
                    </button>

                </div>


                {/* =================================
                    ORDER HEADER
                ================================= */}

                <div className="order-details-header">

                    <div>

                        <span>
                            Order Number
                        </span>

                        <h1>
                            #{order.orderNumber}
                        </h1>

                        <p>
                            📅{" "}
                            {formatDate(
                                order.createdAt
                            )}
                        </p>

                    </div>


                    <div className="big-order-status">

                        {order.orderStatus}

                    </div>

                </div>


                {/* =================================
                    TRACKING
                ================================= */}

                {order.orderStatus !==
                    "CANCELLED" && (

                        <div className="tracking-card">

                            <h2>
                                📦 Track Your Order
                            </h2>


                            <div className="live-tracking-label">

                                🟢 Live Tracking Active

                            </div>


                            <div className="timeline">

                                {statusSteps.map(
                                    (
                                        step,
                                        index
                                    ) => {

                                        const completed =
                                            index <=
                                            currentStep;


                                        return (

                                            <div
                                                className={`timeline-step ${completed
                                                        ? "completed"
                                                        : ""
                                                    }`}
                                                key={
                                                    step.key
                                                }
                                            >


                                                <div className="timeline-icon">

                                                    {completed
                                                        ? "✓"
                                                        : step.icon}

                                                </div>


                                                <div className="timeline-content">

                                                    <strong>
                                                        {
                                                            step.title
                                                        }
                                                    </strong>


                                                    {index ===
                                                        currentStep && (

                                                            <span>
                                                                Current Status
                                                            </span>

                                                        )}

                                                </div>


                                                {index <
                                                    statusSteps.length -
                                                    1 && (

                                                        <div
                                                            className={`timeline-line ${index <
                                                                    currentStep
                                                                    ? "line-completed"
                                                                    : ""
                                                                }`}
                                                        />

                                                    )}

                                            </div>

                                        );

                                    }
                                )}

                            </div>

                        </div>

                    )}


                {/* =================================
                    CANCELLED
                ================================= */}

                {order.orderStatus ===
                    "CANCELLED" && (

                        <div className="cancelled-order">

                            <div>
                                ❌
                            </div>

                            <div>

                                <h3>
                                    Order Cancelled
                                </h3>

                                <p>
                                    This order has been
                                    cancelled.
                                </p>

                            </div>

                        </div>

                    )}


                {/* =================================
                    ORDERED ITEMS
                ================================= */}

                <div className="details-card">

                    <h2>
                        🍴 Ordered Items
                    </h2>


                    {order.items?.map(
                        (item, index) => (

                            <div
                                className="details-item"
                                key={`${item.foodId}-${index}`}
                            >

                                <div>

                                    <strong>
                                        {item.name}
                                    </strong>

                                    <span>
                                        ×{" "}
                                        {item.quantity}
                                    </span>

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
                    )}

                </div>


                {/* =================================
                    DELIVERY ADDRESS
                ================================= */}

                <div className="details-card">

                    <h2>
                        📍 Delivery Address
                    </h2>


                    <div className="delivery-info">

                        <strong>
                            {order.customer?.name}
                        </strong>


                        <p>
                            📱{" "}
                            {order.customer?.phone}
                        </p>


                        <p>
                            🏠{" "}
                            {order.customer?.address}
                        </p>


                        {order.customer
                            ?.landmark && (

                                <p>
                                    📌{" "}
                                    {
                                        order.customer
                                            .landmark
                                    }
                                </p>

                            )}

                    </div>

                </div>


                {/* =================================
                    PAYMENT SUMMARY
                ================================= */}

                <div className="details-card">

                    <h2>
                        💳 Payment Summary
                    </h2>


                    <div className="price-row">

                        <span>
                            Item Total
                        </span>

                        <strong>
                            ₹{order.subtotal}
                        </strong>

                    </div>


                    <div className="price-row">

                        <span>
                            Delivery
                        </span>

                        <strong>

                            {order.deliveryCharge ===
                                0
                                ? "FREE"
                                : `₹${order.deliveryCharge}`}

                        </strong>

                    </div>


                    <div className="price-row final-price">

                        <span>
                            Grand Total
                        </span>

                        <strong>
                            ₹{order.grandTotal}
                        </strong>

                    </div>


                    <div className="payment-method">

                        💳 Payment Method:

                        <strong>
                            {" "}
                            {order.paymentMethod}
                        </strong>

                        <span>
                            {" "}
                            ({order.paymentStatus})
                        </span>

                    </div>

                </div>


            </div>

        </div>

    );
};


export default OrderDetails;