import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const Checkout = () => {
    const navigate = useNavigate();

    // ==============================
    // CUSTOMER LOGIN DATA
    // ==============================

    const customerToken =
        localStorage.getItem("customerToken");

    const customerData = JSON.parse(
        localStorage.getItem("customerData") || "null"
    );

    // ==============================
    // CART DATA
    // ==============================

    const [cartItems] = useState(() => {
        const savedCart =
            localStorage.getItem("streetFoodCart");

        return savedCart
            ? JSON.parse(savedCart)
            : [];
    });

    // ==============================
    // FORM DATA
    // ==============================

    const [formData, setFormData] = useState({
        name: customerData?.name || "",
        phone: customerData?.phone || "",
        address: "",
        landmark: ""
    });

    // ==============================
    // PAYMENT METHOD
    // ==============================

    const [paymentMethod, setPaymentMethod] =
        useState("COD");

    // ==============================
    // LOADING
    // ==============================

    const [loading, setLoading] =
        useState(false);

    // ==============================
    // ITEM PRICE
    // ==============================

    const getItemPrice = (item) => {
        return Number(
            item.finalPrice ??
            item.price ??
            0
        );
    };

    // ==============================
    // PRICE CALCULATION
    // ==============================

    const subtotal = cartItems.reduce(
        (total, item) =>
            total +
            getItemPrice(item) *
                Number(item.quantity || 0),
        0
    );

    const deliveryCharge =
        subtotal === 0
            ? 0
            : subtotal >= 199
                ? 0
                : 30;

    const grandTotal =
        subtotal + deliveryCharge;

    // ==============================
    // INPUT CHANGE
    // ==============================

    const handleChange = (event) => {
        const { name, value } =
            event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // ==============================
    // COD SUCCESS
    // ==============================

    const handleCODSuccess = (order) => {
        alert(
            `🎉 Order Placed Successfully!\n\n` +
            `Order Number: ${order.orderNumber}\n` +
            `Payment: Cash on Delivery\n` +
            `Total: ₹${order.grandTotal}`
        );

        localStorage.removeItem(
            "streetFoodCart"
        );

        navigate(
            `/my-orders/${order._id}`
        );
    };

    // ==============================
    // RAZORPAY PAYMENT
    // ==============================

    const openRazorpay = (data) => {
        const payment =
            data?.payment;

        // ------------------------------
        // PAYMENT DATA CHECK
        // ------------------------------

        if (!payment) {
            setLoading(false);

            throw new Error(
                "Payment information not received from server."
            );
        }

        // ------------------------------
        // RAZORPAY SCRIPT CHECK
        // ------------------------------

        if (
            typeof window.Razorpay ===
            "undefined"
        ) {
            setLoading(false);

            throw new Error(
                "Razorpay Checkout failed to load. Please refresh the page."
            );
        }

        // ==============================
        // RAZORPAY OPTIONS
        // ==============================

        const options = {
            key: payment.key,

            amount: payment.amount,

            currency: payment.currency,

            name: "Street Food",

            description:
                `Payment for ${data.order.orderNumber}`,

            order_id:
                payment.razorpayOrderId,

            prefill: {
                name: formData.name,
                contact: formData.phone
            },

            notes: {
                orderNumber:
                    data.order.orderNumber
            },

            theme: {
                color: "#ff5722"
            },

            // ==============================
            // PAYMENT SUCCESS
            // ==============================

            handler: async function (
                paymentResponse
            ) {
                console.log(
                    "✅ Razorpay Payment Success:",
                    paymentResponse
                );

                try {
                    // ------------------------------
                    // VERIFY PAYMENT
                    // ------------------------------

                    const verifyResponse =
                        await API.post(
                            "/orders/verify-payment",
                            {
                                orderId:
                                    data.order._id,

                                razorpay_payment_id:
                                    paymentResponse.razorpay_payment_id,

                                razorpay_order_id:
                                    paymentResponse.razorpay_order_id,

                                razorpay_signature:
                                    paymentResponse.razorpay_signature
                            }
                        );

                    const verifyData =
                        verifyResponse.data;

                    // ------------------------------
                    // VERIFY SUCCESS CHECK
                    // ------------------------------

                    if (
                        !verifyData.success
                    ) {
                        throw new Error(
                            verifyData.message ||
                            "Payment verification failed."
                        );
                    }

                    console.log(
                        "✅ Payment verified by server:",
                        verifyData.order
                    );

                    // ------------------------------
                    // CLEAR CART
                    // ------------------------------

                    localStorage.removeItem(
                        "streetFoodCart"
                    );

                    // ------------------------------
                    // SUCCESS MESSAGE
                    // ------------------------------

                    alert(
                        `🎉 Payment Successful!\n\n` +
                        `Order Number: ${verifyData.order.orderNumber}\n` +
                        `Payment: Online\n` +
                        `Total: ₹${verifyData.order.grandTotal}`
                    );

                    // ------------------------------
                    // ORDER DETAILS
                    // ------------------------------

                    navigate(
                        `/my-orders/${verifyData.order._id}`
                    );
                } catch (error) {
                    console.error(
                        "❌ Payment Verification Error:",
                        error
                    );

                    setLoading(false);

                    alert(
                        error.response?.data?.message ||
                        error.message ||
                        "Payment verification failed."
                    );
                }
            },

            // ==============================
            // PAYMENT MODAL CLOSED
            // ==============================

            modal: {
                ondismiss: function () {
                    console.log(
                        "❌ Razorpay Checkout closed"
                    );

                    setLoading(false);

                    alert(
                        "Payment cancelled.\n\nYour order is still pending payment."
                    );
                }
            }
        };

        // ==============================
        // CREATE RAZORPAY INSTANCE
        // ==============================

        const razorpayInstance =
            new window.Razorpay(
                options
            );

        // ==============================
        // PAYMENT FAILED
        // ==============================

        razorpayInstance.on(
            "payment.failed",
            function (response) {
                console.error(
                    "❌ Razorpay Payment Failed:",
                    response
                );

                setLoading(false);

                alert(
                    response.error?.description ||
                    "Payment failed. Please try again."
                );
            }
        );

        // ==============================
        // OPEN PAYMENT WINDOW
        // ==============================

        razorpayInstance.open();
    };

    // ==============================
    // PLACE ORDER
    // ==============================

    const handlePlaceOrder = async (
        event
    ) => {
        event.preventDefault();

        // ==============================
        // LOGIN CHECK
        // ==============================

        if (!customerToken) {
            alert(
                "Please login first to place your order 🔐"
            );

            navigate("/login");

            return;
        }

        // ==============================
        // CART CHECK
        // ==============================

        if (cartItems.length === 0) {
            alert(
                "Your cart is empty!"
            );

            navigate("/");

            return;
        }

        // ==============================
        // PHONE VALIDATION
        // ==============================

        if (
            formData.phone.length !== 10 ||
            !/^[0-9]+$/.test(
                formData.phone
            )
        ) {
            alert(
                "Please enter a valid 10 digit mobile number."
            );

            return;
        }

        try {
            setLoading(true);

            // ==============================
            // ORDER ITEMS
            // ==============================

            const orderItems =
                cartItems.map(
                    (item) => ({
                        foodId:
                            item._id,

                        quantity:
                            Number(
                                item.quantity
                            ),

                        selectedOptions:
                            item.selectedOptions ||
                            {},

                        selectedAddOns:
                            item.selectedAddOns ||
                            []
                    })
                );

            // ==============================
            // CREATE ORDER
            // ==============================

            const response =
                await API.post(
                    "/orders",
                    {
                        customer:
                            formData,

                        items:
                            orderItems,

                        paymentMethod
                    }
                );

            const data =
                response.data;

            // ==============================
            // SUCCESS CHECK
            // ==============================

            if (!data.success) {
                throw new Error(
                    data.message ||
                    "Order creation failed."
                );
            }

            // ==============================
            // ONLINE PAYMENT
            // ==============================

            if (
                paymentMethod ===
                "ONLINE"
            ) {
                /*
                    IMPORTANT:

                    Yahan cart clear nahi karna.

                    Razorpay payment complete hone
                    aur backend verification ke baad
                    cart clear hoga.
                */

                openRazorpay(data);

                /*
                    IMPORTANT:
                    Yahan setLoading(false) mat karo.

                    Razorpay popup open hai.
                    Popup close/success/failure
                    ke time loading handle hoga.
                */

                return;
            }

            // ==============================
            // COD
            // ==============================

            if (
                paymentMethod ===
                "COD"
            ) {
                handleCODSuccess(
                    data.order
                );

                return;
            }

        } catch (error) {
            console.error(
                "❌ Order Error:",
                error
            );

            setLoading(false);

            alert(
                error.response?.data?.message ||
                error.message ||
                "Something went wrong while placing order."
            );
        }
    };

    // ==============================
    // EMPTY CART
    // ==============================

    if (
        cartItems.length === 0
    ) {
        return (
            <div className="checkout-page">

                <div className="empty-checkout">

                    <div className="empty-checkout-icon">
                        🛒
                    </div>

                    <h2>
                        Your cart is empty
                    </h2>

                    <p>
                        Please add some food
                        before checkout.
                    </p>

                    <button
                        onClick={() =>
                            navigate("/")
                        }
                    >
                        ← Back to Menu
                    </button>

                </div>

            </div>
        );
    }

    // ==============================
    // CHECKOUT UI
    // ==============================

    return (
        <div className="checkout-page">

            {/* ==============================
                HEADER
            ============================== */}

            <div className="checkout-header">

                <button
                    className="back-btn"
                    onClick={() =>
                        navigate("/")
                    }
                >
                    ← Back
                </button>

                <h1>
                    Checkout
                </h1>

                <span>
                    🛍️ Order Summary
                </span>

            </div>

            {/* ==============================
                LOGIN NOTICE
            ============================== */}

            {!customerToken && (
                <div className="checkout-login-notice">

                    <div>
                        🔐
                    </div>

                    <div>

                        <strong>
                            Login required
                        </strong>

                        <p>
                            Please login to place
                            your order.
                        </p>

                    </div>

                    <button
                        onClick={() =>
                            navigate("/login")
                        }
                    >
                        Login
                    </button>

                </div>
            )}

            <div className="checkout-container">

                {/* ==============================
                    LEFT SIDE
                ============================== */}

                <div className="checkout-left">

                    <div className="checkout-card">

                        <h2>
                            📍 Delivery Details
                        </h2>

                        <p className="checkout-subtitle">
                            {customerToken
                                ? "Your account details are automatically filled"
                                : "Login to continue with your order"}
                        </p>

                        <form
                            onSubmit={
                                handlePlaceOrder
                            }
                        >

                            {/* NAME */}

                            <div className="form-group">

                                <label>
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={
                                        formData.name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter your name"
                                    required
                                />

                            </div>

                            {/* PHONE */}

                            <div className="form-group">

                                <label>
                                    Mobile Number
                                </label>

                                <input
                                    type="tel"
                                    name="phone"
                                    value={
                                        formData.phone
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter 10 digit mobile number"
                                    maxLength="10"
                                    inputMode="numeric"
                                    required
                                />

                            </div>

                            {/* ADDRESS */}

                            <div className="form-group">

                                <label>
                                    Delivery Address
                                </label>

                                <textarea
                                    name="address"
                                    value={
                                        formData.address
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="House no, street, area..."
                                    rows="4"
                                    required
                                />

                            </div>

                            {/* LANDMARK */}

                            <div className="form-group">

                                <label>
                                    Landmark
                                    <span>
                                        {" "}
                                        (Optional)
                                    </span>
                                </label>

                                <input
                                    type="text"
                                    name="landmark"
                                    value={
                                        formData.landmark
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Near school, temple, shop..."
                                />

                            </div>

                            {/* ==============================
                                PAYMENT
                            ============================== */}

                            <div className="payment-section">

                                <h2>
                                    💳 Payment Method
                                </h2>

                                {/* COD */}

                                <label
                                    className={`payment-option ${
                                        paymentMethod ===
                                        "COD"
                                            ? "selected"
                                            : ""
                                    }`}
                                >

                                    <input
                                        type="radio"
                                        name="payment"
                                        value="COD"
                                        checked={
                                            paymentMethod ===
                                            "COD"
                                        }
                                        onChange={
                                            (event) =>
                                                setPaymentMethod(
                                                    event.target.value
                                                )
                                        }
                                    />

                                    <div>

                                        <strong>
                                            💵 Cash on Delivery
                                        </strong>

                                        <small>
                                            Pay when your
                                            order arrives
                                        </small>

                                    </div>

                                </label>

                                {/* ONLINE */}

                                <label
                                    className={`payment-option ${
                                        paymentMethod ===
                                        "ONLINE"
                                            ? "selected"
                                            : ""
                                    }`}
                                >

                                    <input
                                        type="radio"
                                        name="payment"
                                        value="ONLINE"
                                        checked={
                                            paymentMethod ===
                                            "ONLINE"
                                        }
                                        onChange={
                                            (event) =>
                                                setPaymentMethod(
                                                    event.target.value
                                                )
                                        }
                                    />

                                    <div>

                                        <strong>
                                            💳 Online Payment
                                        </strong>

                                        <small>
                                            UPI / Card /
                                            Net Banking
                                        </small>

                                    </div>

                                </label>

                            </div>

                            {/* ==============================
                                PLACE ORDER
                            ============================== */}

                            <button
                                type="submit"
                                className="place-order-btn"
                                disabled={
                                    loading
                                }
                            >

                                {loading
                                    ? "Processing..."
                                    : `Place Order — ₹${grandTotal}`}

                            </button>

                        </form>

                    </div>

                </div>

                {/* ==============================
                    RIGHT SIDE
                ============================== */}

                <div className="checkout-right">

                    <div className="order-summary-card">

                        <h2>
                            🛒 Your Order
                        </h2>

                        <div className="checkout-items">

                            {cartItems.map(
                                (item) => {

                                    const itemPrice =
                                        getItemPrice(
                                            item
                                        );

                                    return (
                                        <div
                                            className="checkout-item"
                                            key={
                                                item.cartItemId ||
                                                item._id
                                            }
                                        >

                                            <div>

                                                <h3>
                                                    {
                                                        item.name
                                                    }
                                                </h3>

                                                <p>
                                                    ₹
                                                    {
                                                        itemPrice
                                                    }
                                                    {" × "}
                                                    {
                                                        item.quantity
                                                    }
                                                </p>

                                                {/* OPTIONS */}

                                                {item.selectedOptions &&
                                                    Object.values(
                                                        item.selectedOptions
                                                    ).map(
                                                        (
                                                            option
                                                        ) => (
                                                            <span
                                                                className="checkout-tag"
                                                                key={
                                                                    option.name
                                                                }
                                                            >
                                                                {
                                                                    option.name
                                                                }
                                                            </span>
                                                        )
                                                    )}

                                                {/* ADDONS */}

                                                {item.selectedAddOns &&
                                                    item.selectedAddOns.map(
                                                        (
                                                            addOn
                                                        ) => (
                                                            <span
                                                                className="checkout-tag"
                                                                key={
                                                                    addOn.name
                                                                }
                                                            >
                                                                +{" "}
                                                                {
                                                                    addOn.name
                                                                }
                                                            </span>
                                                        )
                                                    )}

                                            </div>

                                            <strong>
                                                ₹
                                                {
                                                    itemPrice *
                                                    item.quantity
                                                }
                                            </strong>

                                        </div>
                                    );
                                }
                            )}

                        </div>

                        {/* ==============================
                            PRICE
                        ============================== */}

                        <div className="checkout-price">

                            <div>

                                <span>
                                    Item Total
                                </span>

                                <span>
                                    ₹{subtotal}
                                </span>

                            </div>

                            <div>

                                <span>
                                    Delivery
                                </span>

                                <span>
                                    {deliveryCharge ===
                                    0
                                        ? "FREE"
                                        : `₹${deliveryCharge}`}
                                </span>

                            </div>

                            <div className="checkout-grand-total">

                                <strong>
                                    Grand Total
                                </strong>

                                <strong>
                                    ₹{grandTotal}
                                </strong>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default Checkout;