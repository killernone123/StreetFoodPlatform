import { useNavigate } from "react-router-dom";
const Cart = ({
    cartItems,
    onIncrease,
    onDecrease,
    onRemove,
    onClear
}) => {
    const navigate = useNavigate();

    const getItemId = (item) => {
        return item.cartItemId || item._id;
    };

    const getItemPrice = (item) => {
        return Number(
            item.finalPrice ?? item.price ?? 0
        );
    };

    const totalItems = cartItems.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const subtotal = cartItems.reduce(
        (total, item) =>
            total +
            getItemPrice(item) * item.quantity,
        0
    );

    // Abhi fixed delivery charge
    const deliveryCharge =
        subtotal === 0
            ? 0
            : subtotal >= 199
                ? 0
                : 30;

    const grandTotal =
        subtotal + deliveryCharge;


    return (
        <div className="cart-panel">

            {/* HEADER */}

            <div className="cart-header">

                <div>
                    <h2>🛒 Your Cart</h2>

                    <span>
                        {totalItems}{" "}
                        {totalItems === 1
                            ? "Item"
                            : "Items"}
                    </span>
                </div>

                {cartItems.length > 0 && (
                    <button
                        className="clear-cart-btn"
                        onClick={onClear}
                    >
                        Clear Cart
                    </button>
                )}

            </div>


            {/* EMPTY CART */}

            {cartItems.length === 0 ? (

                <div className="empty-cart">

                    <div className="empty-cart-icon">
                        🛒
                    </div>

                    <h3>
                        Your cart is empty
                    </h3>

                    <p>
                        Add some delicious
                        street food!
                    </p>

                </div>

            ) : (

                <>

                    {/* CART ITEMS */}

                    <div className="cart-items">

                        {cartItems.map((item) => {

                            const itemPrice =
                                getItemPrice(item);

                            const itemTotal =
                                itemPrice *
                                item.quantity;

                            return (
                                <div
                                    className="cart-item"
                                    key={getItemId(item)}
                                >

                                    {/* ITEM INFO */}

                                    <div className="cart-item-info">

                                        <h3>
                                            {item.name}
                                        </h3>

                                        <p className="cart-unit-price">
                                            ₹{itemPrice} ×{" "}
                                            {item.quantity}
                                        </p>


                                        {/* CUSTOMIZATION */}

                                        {item.selectedOptions &&
                                            Object.values(
                                                item.selectedOptions
                                            ).length > 0 && (

                                                <div className="cart-customizations">

                                                    {Object.values(
                                                        item.selectedOptions
                                                    ).map(
                                                        (option) => (
                                                            <span
                                                                key={
                                                                    option.name
                                                                }
                                                            >
                                                                {option.name}
                                                            </span>
                                                        )
                                                    )}

                                                </div>
                                            )}


                                        {/* ADDONS */}

                                        {item.selectedAddOns &&
                                            item.selectedAddOns.length >
                                            0 && (

                                                <div className="cart-customizations">

                                                    {item.selectedAddOns.map(
                                                        (addOn) => (
                                                            <span
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
                                            )}


                                        <strong className="cart-item-total">
                                            ₹{itemTotal}
                                        </strong>

                                    </div>


                                    {/* QUANTITY */}

                                    <div className="quantity-box">

                                        <button
                                            onClick={() =>
                                                onDecrease(
                                                    getItemId(item)
                                                )
                                            }
                                        >
                                            −
                                        </button>

                                        <span>
                                            {item.quantity}
                                        </span>

                                        <button
                                            onClick={() =>
                                                onIncrease(
                                                    getItemId(item)
                                                )
                                            }
                                        >
                                            +
                                        </button>

                                    </div>


                                    {/* REMOVE */}

                                    <button
                                        className="remove-btn"
                                        onClick={() =>
                                            onRemove(
                                                getItemId(item)
                                            )
                                        }
                                    >
                                        Remove
                                    </button>

                                </div>
                            );
                        })}

                    </div>


                    {/* BILL SUMMARY */}

                    <div className="cart-summary">

                        <h3>
                            Bill Summary
                        </h3>

                        <div className="summary-row">

                            <span>
                                Item Total
                            </span>

                            <span>
                                ₹{subtotal}
                            </span>

                        </div>


                        <div className="summary-row">

                            <span>
                                Delivery
                            </span>

                            <span>
                                {deliveryCharge === 0
                                    ? "FREE"
                                    : `₹${deliveryCharge}`}
                            </span>

                        </div>


                        {subtotal > 0 &&
                            subtotal < 199 && (

                                <p className="delivery-message">
                                    Add ₹
                                    {199 - subtotal}
                                    {" "}
                                    more for FREE
                                    delivery 🎉
                                </p>

                            )}


                        <div className="summary-total">

                            <span>
                                Grand Total
                            </span>

                            <strong>
                                ₹{grandTotal}
                            </strong>

                        </div>

                    </div>


                    {/* CHECKOUT */}

                    <button
                        className="checkout-btn"
                        onClick={() =>
                            navigate("/checkout")
                        }
                    >
                        Proceed to Checkout →
                    </button>

                </>

            )}

        </div>
    );
};

export default Cart;