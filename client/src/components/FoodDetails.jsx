import { useState } from "react";

const FoodDetails = ({ food, onClose, onAdd }) => {
    const [quantity, setQuantity] = useState(1);

    const [selectedOptions, setSelectedOptions] = useState({});

    const [selectedAddOns, setSelectedAddOns] = useState([]);

    if (!food) {
        return null;
    }

    const handleOptionChange = (groupName, option) => {
        setSelectedOptions((previous) => ({
            ...previous,
            [groupName]: option
        }));
    };

    const handleAddOnChange = (addOn) => {
        setSelectedAddOns((previous) => {

            const alreadySelected = previous.some(
                (item) => item.name === addOn.name
            );

            if (alreadySelected) {
                return previous.filter(
                    (item) => item.name !== addOn.name
                );
            }

            return [...previous, addOn];
        });
    };

    // Customization total
    const customizationPrice = Object.values(
        selectedOptions
    ).reduce(
        (total, option) =>
            total + Number(option.price || 0),
        0
    );

    // Add-on total
    const addOnPrice = selectedAddOns.reduce(
        (total, addOn) =>
            total + Number(addOn.price || 0),
        0
    );

    // One item final price
    const singlePrice =
        Number(food.price) +
        customizationPrice +
        addOnPrice;

    // Quantity ke according total
    const totalPrice =
        singlePrice * quantity;

    const handleAdd = () => {

        const customizedFood = {
            ...food,

            cartItemId:
                food._id + "-" + Date.now(),

            quantity,

            selectedOptions,

            selectedAddOns,

            finalPrice: singlePrice
        };

        onAdd(customizedFood);

        onClose();
    };

    return (
        <div
            className="food-modal-overlay"
            onClick={onClose}
        >

            <div
                className="food-modal"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >

                <button
                    className="close-modal"
                    onClick={onClose}
                >
                    ×
                </button>

                {/* IMAGE */}

                <div className="details-image">

                    {food.image ? (
                        <img
                            src={food.image}
                            alt={food.name}
                        />
                    ) : (
                        "🍽️"
                    )}

                </div>

                {/* CONTENT */}

                <div className="details-content">

                    <span className="veg">
                        {food.isVeg
                            ? "● Veg"
                            : "● Non-Veg"}
                    </span>

                    <h2>{food.name}</h2>

                    <p className="details-description">
                        {food.description ||
                            "Fresh and delicious street food."}
                    </p>

                    <h3 className="details-price">
                        ₹{food.price}
                    </h3>

                    {/* CUSTOMIZATION */}

                    {food.customizations &&
                        food.customizations.length > 0 && (

                            <div className="customization-section">

                                <h3>Customize</h3>

                                {food.customizations.map(
                                    (group) => (

                                        <div
                                            className="customization-group"
                                            key={group.name}
                                        >

                                            <h4>
                                                {group.name}
                                            </h4>

                                            {group.options?.map(
                                                (option) => (

                                                    <label
                                                        className="option-row"
                                                        key={
                                                            option.name
                                                        }
                                                    >

                                                        <input
                                                            type="radio"
                                                            name={
                                                                group.name
                                                            }
                                                            checked={
                                                                selectedOptions[
                                                                    group.name
                                                                ]?.name ===
                                                                option.name
                                                            }
                                                            onChange={() =>
                                                                handleOptionChange(
                                                                    group.name,
                                                                    option
                                                                )
                                                            }
                                                        />

                                                        <span>
                                                            {
                                                                option.name
                                                            }
                                                        </span>

                                                        <strong>
                                                            {Number(
                                                                option.price
                                                            ) > 0
                                                                ? `+₹${option.price}`
                                                                : "Free"}
                                                        </strong>

                                                    </label>

                                                )
                                            )}

                                        </div>
                                    )
                                )}

                            </div>
                        )}

                    {/* ADD ONS */}

                    {food.addOns &&
                        food.addOns.length > 0 && (

                            <div className="customization-group">

                                <h3>Add-ons</h3>

                                {food.addOns.map(
                                    (addOn) => {

                                        const selected =
                                            selectedAddOns.some(
                                                (item) =>
                                                    item.name ===
                                                    addOn.name
                                            );

                                        return (
                                            <label
                                                className="option-row"
                                                key={
                                                    addOn.name
                                                }
                                            >

                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        selected
                                                    }
                                                    onChange={() =>
                                                        handleAddOnChange(
                                                            addOn
                                                        )
                                                    }
                                                />

                                                <span>
                                                    {
                                                        addOn.name
                                                    }
                                                </span>

                                                <strong>
                                                    {Number(
                                                        addOn.price
                                                    ) > 0
                                                        ? `+₹${addOn.price}`
                                                        : "Free"}
                                                </strong>

                                            </label>
                                        );
                                    }
                                )}

                            </div>
                        )}

                    {/* PRICE BREAKDOWN */}

                    <div className="price-breakdown">

                        <div>
                            <span>Food</span>
                            <span>
                                ₹{food.price}
                            </span>
                        </div>

                        <div>
                            <span>Customization</span>
                            <span>
                                +₹{customizationPrice}
                            </span>
                        </div>

                        <div>
                            <span>Add-ons</span>
                            <span>
                                +₹{addOnPrice}
                            </span>
                        </div>

                    </div>

                    {/* QUANTITY */}

                    <div className="details-quantity">

                        <span>Quantity</span>

                        <div className="quantity-box">

                            <button
                                onClick={() =>
                                    setQuantity(
                                        Math.max(
                                            1,
                                            quantity - 1
                                        )
                                    )
                                }
                            >
                                −
                            </button>

                            <span>
                                {quantity}
                            </span>

                            <button
                                onClick={() =>
                                    setQuantity(
                                        quantity + 1
                                    )
                                }
                            >
                                +
                            </button>

                        </div>

                    </div>

                    {/* ADD */}

                    <button
                        className="details-add-btn"
                        onClick={handleAdd}
                    >
                        Add to Cart — ₹{totalPrice}
                    </button>

                </div>

            </div>

        </div>
    );
};

export default FoodDetails;