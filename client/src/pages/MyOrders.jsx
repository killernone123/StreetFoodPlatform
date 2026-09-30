import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const MyOrders = () => {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =====================================
    // GET CUSTOMER ORDERS
    // =====================================

    const fetchMyOrders = async () => {
        try {
            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("customerToken");

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await API.get(
                "/orders/my-orders"
            );

            if (response.data.success) {
                setOrders(
                    response.data.orders || []
                );
            }

        } catch (error) {
            console.error(
                "My Orders Error:",
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
                "Failed to load your orders."
            );

        } finally {
            setLoading(false);
        }
    };


    // =====================================
    // LOAD ORDERS
    // =====================================

    useEffect(() => {
        fetchMyOrders();
    }, []);


    // =====================================
    // STATUS CLASS
    // =====================================

    const getStatusClass = (status) => {

        switch (status) {

            case "PLACED":
                return "status-placed";

            case "CONFIRMED":
                return "status-confirmed";

            case "PREPARING":
                return "status-preparing";

            case "READY":
                return "status-ready";

            case "OUT_FOR_DELIVERY":
                return "status-delivery";

            case "DELIVERED":
                return "status-delivered";

            case "CANCELLED":
                return "status-cancelled";

            default:
                return "";
        }
    };


    // =====================================
    // STATUS TEXT
    // =====================================

    const getStatusText = (status) => {

        switch (status) {

            case "PLACED":
                return "🟡 Order Placed";

            case "CONFIRMED":
                return "🔵 Confirmed";

            case "PREPARING":
                return "🟠 Preparing";

            case "READY":
                return "🟣 Ready";

            case "OUT_FOR_DELIVERY":
                return "🚚 Out for Delivery";

            case "DELIVERED":
                return "🟢 Delivered";

            case "CANCELLED":
                return "🔴 Cancelled";

            default:
                return status;
        }
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
            <div className="my-orders-page">

                <div className="orders-loading">

                    <div className="loading-icon">
                        🍔
                    </div>

                    <h2>
                        Loading your orders...
                    </h2>

                    <p>
                        Please wait a moment.
                    </p>

                </div>

            </div>
        );
    }


    // =====================================
    // PAGE
    // =====================================

    return (
        <div className="my-orders-page">


            {/* HEADER */}

            <div className="my-orders-header">

                <button
                    className="orders-back-btn"
                    onClick={() => navigate("/")}
                >
                    ← Home
                </button>

                <div>

                    <h1>
                        🛍️ My Orders
                    </h1>

                    <p>
                        Track your delicious orders
                    </p>

                </div>

                <button
                    className="orders-refresh-btn"
                    onClick={fetchMyOrders}
                >
                    🔄 Refresh
                </button>

            </div>


            {/* ERROR */}

            {error && (

                <div className="orders-error">

                    {error}

                </div>

            )}


            {/* NO ORDERS */}

            {!error && orders.length === 0 && (

                <div className="no-orders">

                    <div className="no-orders-icon">
                        🍔
                    </div>

                    <h2>
                        No Orders Yet
                    </h2>

                    <p>
                        You haven't placed any
                        orders yet.
                    </p>

                    <button
                        onClick={() =>
                            navigate("/")
                        }
                    >
                        🍴 Order Food
                    </button>

                </div>

            )}


            {/* ORDERS */}

            {orders.length > 0 && (

                <div className="orders-list">

                    {orders.map((order) => (

                        <div
                            className="order-card"
                            key={order._id}
                        >


                            {/* ORDER HEADER */}

                            <div className="order-card-header">

                                <div>

                                    <span className="order-label">
                                        Order Number
                                    </span>

                                    <h2>
                                        #
                                        {
                                            order.orderNumber
                                        }
                                    </h2>

                                </div>

                                <span
                                    className={`order-status ${getStatusClass(
                                        order.orderStatus
                                    )}`}
                                >
                                    {
                                        getStatusText(
                                            order.orderStatus
                                        )
                                    }
                                </span>

                            </div>


                            {/* DATE */}

                            <div className="order-date">

                                📅{" "}
                                {
                                    formatDate(
                                        order.createdAt
                                    )
                                }

                            </div>


                            {/* ITEMS */}

                            <div className="order-items">

                                <h3>
                                    🍴 Items
                                </h3>

                                {order.items?.map(
                                    (item, index) => (

                                        <div
                                            className="my-order-item"
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
                                                    {" "}
                                                    ×{" "}
                                                    {
                                                        item.quantity
                                                    }
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


                            {/* TOTAL */}

                            <div className="order-total-section">

                                <div>
                                    <span>
                                        Item Total
                                    </span>

                                    <strong>
                                        ₹
                                        {
                                            order.subtotal
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Delivery
                                    </span>

                                    <strong>
                                        {
                                            order.deliveryCharge ===
                                            0
                                                ? "FREE"
                                                : `₹${order.deliveryCharge}`
                                        }
                                    </strong>
                                </div>

                                <div className="final-order-total">

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
                            


                            {/* PAYMENT */}
                            <div className="order-details-button-wrapper">

    <button
        className="view-order-btn"
        onClick={() =>
            navigate(
                `/my-orders/${order._id}`
            )
        }
    >
        👀 View Details
    </button>

</div>


                            <div className="order-footer">

                                <span>
                                    💳 Payment:{" "}
                                    <strong>
                                        {
                                            order.paymentMethod
                                        }
                                    </strong>
                                </span>

                                <span>
                                    {
                                        order.paymentStatus
                                    }
                                </span>

                            </div>

                        </div>

                    ))}

                </div>

            )}

        </div>
    );
};

export default MyOrders;