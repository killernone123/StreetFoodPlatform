const FoodCard = ({ food, onAdd, onClick }) => {
    return (
        <div
            className="food-card"
            onClick={onClick}
        >
            <div className="food-image">
                {food.image ? (
                    <img
                        src={food.image}
                        alt={food.name}
                    />
                ) : (
                    "🍽️"
                )}
            </div>

            <div className="food-info">

                <span className="veg">
                    {food.isVeg ? "● Veg" : "● Non-Veg"}
                </span>

                <h3>{food.name}</h3>

                <p>
                    {food.description ||
                        "Fresh and delicious street food."}
                </p>

                <div className="food-bottom">

                    <strong>
                        ₹{food.price}
                    </strong>

                    <button
                        onClick={(event) => {
                            event.stopPropagation();
                            onAdd(food);
                        }}
                    >
                        + Add
                    </button>

                </div>

            </div>
        </div>
    );
};

export default FoodCard;