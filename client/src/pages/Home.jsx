import { useEffect, useState } from "react";
import API from "../services/api";
import FoodCard from "../components/FoodCard";
import Cart from "../components/Cart";
import FoodDetails from "../components/FoodDetails";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();

    const [foods, setFoods] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [searchText, setSearchText] = useState("");

    const [loading, setLoading] = useState(true);
    const [foodError, setFoodError] = useState("");

    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem("streetFoodCart");

        return savedCart
            ? JSON.parse(savedCart)
            : [];
    });

    const [showCart, setShowCart] = useState(false);
    const [selectedFood, setSelectedFood] = useState(null);

    // =====================================
    // CUSTOMER LOGIN DATA
    // =====================================

    const customerToken =
        localStorage.getItem("customerToken");

    const customerData = JSON.parse(
        localStorage.getItem("customerData") || "null"
    );

    // =====================================
    // CUSTOMER LOGOUT
    // =====================================

    const logoutCustomer = () => {
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerData");

        alert("Logout successful 👋");

        navigate("/");
    };

    // =====================================
    // GET CATEGORIES
    // =====================================

    const getCategories = async () => {
        try {
            const response = await API.get("/categories");

            if (response.data.success) {
                setCategories(
                    response.data.categories || []
                );
            }
        } catch (error) {
            console.error(
                "Category fetch error:",
                error
            );
        }
    };

    // =====================================
    // GET FOODS
    // =====================================

    const getFoods = async (categoryId = "") => {
        try {
            setLoading(true);
            setFoodError("");

            const url = categoryId
                ? `/foods?categoryId=${categoryId}`
                : "/foods";

            const response = await API.get(url);

            if (response.data.success) {
                const availableFoods =
                    (response.data.foods || []).filter(
                        (food) =>
                            food.isAvailable !== false
                    );

                setFoods(availableFoods);
            } else {
                setFoods([]);
            }
        } catch (error) {
            console.error(
                "Food fetch error:",
                error
            );

            setFoodError(
                "Food load nahi ho pa raha. Please try again."
            );

            setFoods([]);
        } finally {
            setLoading(false);
        }
    };

    // =====================================
    // INITIAL DATA
    // =====================================

    useEffect(() => {
        getCategories();
        getFoods();
    }, []);

    // =====================================
    // SAVE CART
    // =====================================

    useEffect(() => {
        localStorage.setItem(
            "streetFoodCart",
            JSON.stringify(cartItems)
        );
    }, [cartItems]);

    // =====================================
    // CLEAR CART
    // =====================================

    const clearCart = () => {
        setCartItems([]);

        localStorage.removeItem(
            "streetFoodCart"
        );
    };

    // =====================================
    // CATEGORY FILTER
    // =====================================

    const handleCategory = (categoryId) => {
        setSelectedCategory(categoryId);

        getFoods(categoryId);
    };

    // =====================================
    // SEARCH FILTER
    // =====================================

    const filteredFoods = foods.filter((food) => {
        const search = searchText
            .toLowerCase()
            .trim();

        if (!search) {
            return true;
        }

        return (
            food.name
                ?.toLowerCase()
                .includes(search) ||
            food.description
                ?.toLowerCase()
                .includes(search)
        );
    });

    // =====================================
    // FOOD CLICK
    // =====================================

    const handleFoodClick = (food) => {
        setSelectedFood(food);
    };

    // =====================================
    // ADD TO CART
    // =====================================

    const handleAddToCart = (food) => {
        setCartItems((previousItems) => {
            const itemId =
                food.cartItemId || food._id;

            const existingItem =
                previousItems.find(
                    (item) =>
                        (item.cartItemId ||
                            item._id) === itemId
                );

            if (existingItem) {
                return previousItems.map(
                    (item) =>
                        (item.cartItemId ||
                            item._id) === itemId
                            ? {
                                ...item,
                                quantity:
                                    item.quantity +
                                    (food.quantity ||
                                        1),
                            }
                            : item
                );
            }

            return [
                ...previousItems,
                {
                    ...food,
                    quantity:
                        food.quantity || 1,
                },
            ];
        });

        setSelectedFood(null);
        setShowCart(true);
    };

    // =====================================
    // INCREASE QUANTITY
    // =====================================

    const increaseQuantity = (id) => {
        setCartItems((previousItems) =>
            previousItems.map((item) =>
                (item.cartItemId ||
                    item._id) === id
                    ? {
                        ...item,
                        quantity:
                            item.quantity + 1,
                    }
                    : item
            )
        );
    };

    // =====================================
    // DECREASE QUANTITY
    // =====================================

    const decreaseQuantity = (id) => {
        setCartItems((previousItems) =>
            previousItems
                .map((item) =>
                    (item.cartItemId ||
                        item._id) === id
                        ? {
                            ...item,
                            quantity:
                                item.quantity -
                                1,
                        }
                        : item
                )
                .filter(
                    (item) => item.quantity > 0
                )
        );
    };

    // =====================================
    // REMOVE FROM CART
    // =====================================

    const removeFromCart = (id) => {
        setCartItems((previousItems) =>
            previousItems.filter(
                (item) =>
                    (item.cartItemId ||
                        item._id) !== id
            )
        );
    };

    // =====================================
    // CART COUNT
    // =====================================

    const cartCount = cartItems.reduce(
        (total, item) =>
            total + item.quantity,
        0
    );

    // =====================================
    // JSX
    // =====================================

    return (
        <div className="home">

            {/* FOOD DETAILS */}

            {selectedFood && (
                <FoodDetails
                    food={selectedFood}
                    onClose={() =>
                        setSelectedFood(null)
                    }
                    onAdd={handleAddToCart}
                />
            )}

            {/* ============================= */}
            {/* NAVBAR */}
            {/* ============================= */}

            <nav className="navbar">

                <div className="logo">
                    🍴 Street<span>Food</span>
                </div>

                <div className="nav-links">
                    <a href="/">Home</a>

                    <a href="#foods">
                        Foods
                    </a>

                    <a href="#about">
                        About
                    </a>
                </div>

                <div className="nav-actions">

                    {/* CART */}

                    <button
                        className="cart-btn"
                        onClick={() =>
                            setShowCart(!showCart)
                        }
                    >
                        🛒 Cart

                        {cartCount > 0 && (
                            <span className="cart-count">
                                {cartCount}
                            </span>
                        )}
                    </button>

                    {/* CUSTOMER LOGIN / LOGOUT */}

                    {customerToken ? (
                        <div className="customer-menu">

                            <span className="customer-name">
                                👤 {customerData?.name || "Customer"}
                            </span>

                            <button
                                className="my-orders-btn"
                                onClick={() =>
                                    navigate("/my-orders")
                                }
                            >
                                🛍️ My Orders
                            </button>

                            <button
                                className="login-btn"
                                onClick={logoutCustomer}
                            >
                                Logout
                            </button>

                        </div>
                    ) : (
                        <button
                            className="login-btn"
                            onClick={() => navigate("/login")}
                        >
                            Login
                        </button>
                    )}

                </div>

            </nav>

            {/* CART */}

            {showCart && (
                <Cart
                    cartItems={cartItems}
                    onIncrease={
                        increaseQuantity
                    }
                    onDecrease={
                        decreaseQuantity
                    }
                    onRemove={
                        removeFromCart
                    }
                    onClear={clearCart}
                />
            )}

            {/* ============================= */}
            {/* HERO */}
            {/* ============================= */}

            <section className="hero">

                <div className="hero-content">

                    <p className="hero-small">
                        🔥 Fresh & Delicious
                    </p>

                    <h1>
                        Your Favourite
                        <br />
                        <span>
                            Street Food
                        </span>
                    </h1>

                    <p className="hero-description">
                        Hot, fresh and delicious
                        food delivered directly
                        to your doorstep.
                    </p>

                    <button
                        className="order-btn"
                        onClick={() =>
                            document
                                .getElementById(
                                    "foods"
                                )
                                ?.scrollIntoView({
                                    behavior:
                                        "smooth",
                                })
                        }
                    >
                        Order Now 🍽️
                    </button>

                </div>

                <div className="hero-food">
                    🍔
                </div>

            </section>

            {/* ============================= */}
            {/* SEARCH */}
            {/* ============================= */}

            <section className="search-section">

                <input
                    type="text"
                    placeholder="Search your favourite food..."
                    value={searchText}
                    onChange={(e) =>
                        setSearchText(
                            e.target.value
                        )
                    }
                />

                <button>
                    🔍
                </button>

            </section>

            {/* ============================= */}
            {/* CATEGORIES */}
            {/* ============================= */}

            <section className="categories">

                <h2>
                    Explore Categories
                </h2>

                <p>
                    Choose what you want to eat
                </p>

                <div className="category-list">

                    {/* ALL */}

                    <div
                        className={`category-card ${selectedCategory === ""
                            ? "active-category"
                            : ""
                            }`}
                        onClick={() =>
                            handleCategory("")
                        }
                    >
                        🍽️

                        <span>
                            All
                        </span>
                    </div>

                    {/* DATABASE CATEGORIES */}

                    {categories.map(
                        (category) => (
                            <div
                                className={`category-card ${selectedCategory ===
                                    category._id
                                    ? "active-category"
                                    : ""
                                    }`}
                                key={
                                    category._id
                                }
                                onClick={() =>
                                    handleCategory(
                                        category._id
                                    )
                                }
                            >

                                <span>

                                    {category.name ===
                                        "Poha" &&
                                        "🥣"}

                                    {category.name ===
                                        "Kachori" &&
                                        "🥟"}

                                    {category.name ===
                                        "Samosa" &&
                                        "🥠"}

                                    {category.name ===
                                        "Aloo Vada" &&
                                        "🥔"}

                                    {category.name ===
                                        "Chaat" &&
                                        "🥗"}

                                    {category.name ===
                                        "Beverages" &&
                                        "🥤"}

                                    {category.name ===
                                        "Tea & Coffee" &&
                                        "☕"}

                                </span>

                                <span>
                                    {
                                        category.name
                                    }
                                </span>

                            </div>
                        )
                    )}

                </div>

            </section>

            {/* ============================= */}
            {/* FOOD SECTION */}
            {/* ============================= */}

            <section
                className="foods-section"
                id="foods"
            >

                <div className="section-heading">

                    <div>

                        <h2>
                            Popular Foods 🔥
                        </h2>

                        <p>
                            Freshly prepared
                            for you
                        </p>

                    </div>

                    <button
                        className="view-btn"
                        onClick={() => {
                            setSelectedCategory(
                                ""
                            );

                            getFoods();
                        }}
                    >
                        View All →
                    </button>

                </div>

                {/* LOADING */}

                {loading && (
                    <p className="loading">
                        Loading foods...
                    </p>
                )}

                {/* ERROR */}

                {!loading &&
                    foodError && (
                        <div className="food-error">

                            <p>
                                {foodError}
                            </p>

                            <button
                                onClick={() =>
                                    getFoods(
                                        selectedCategory
                                    )
                                }
                            >
                                Try Again
                            </button>

                        </div>
                    )}

                {/* EMPTY */}

                {!loading &&
                    !foodError &&
                    filteredFoods.length ===
                    0 && (
                        <div className="no-foods">

                            <p>
                                😔 No foods found.
                            </p>

                            {searchText && (
                                <p>
                                    Try another
                                    food name.
                                </p>
                            )}

                        </div>
                    )}

                {/* FOOD GRID */}

                {!loading &&
                    !foodError &&
                    filteredFoods.length >
                    0 && (
                        <div className="food-grid">

                            {filteredFoods.map(
                                (food) => (
                                    <FoodCard
                                        key={
                                            food._id
                                        }
                                        food={food}
                                        onAdd={
                                            handleAddToCart
                                        }
                                        onClick={() =>
                                            handleFoodClick(
                                                food
                                            )
                                        }
                                    />
                                )
                            )}

                        </div>
                    )}

            </section>

            {/* ============================= */}
            {/* OFFER */}
            {/* ============================= */}

            <section className="offer">

                <div>

                    <p>
                        🎉 SPECIAL OFFER
                    </p>

                    <h2>
                        Get 20% OFF
                    </h2>

                    <p>
                        On your first order
                    </p>

                    <button
                        onClick={() =>
                            document
                                .getElementById(
                                    "foods"
                                )
                                ?.scrollIntoView({
                                    behavior:
                                        "smooth",
                                })
                        }
                    >
                        Order Now
                    </button>

                </div>

                <div className="offer-emoji">
                    🥳🍔
                </div>

            </section>

            {/* ============================= */}
            {/* FOOTER */}
            {/* ============================= */}

            <footer id="about">

                <h2>
                    🍴 StreetFood
                </h2>

                <p>
                    Delicious street food
                    delivered to your
                    doorstep.
                </p>

                <p>
                    © 2026 StreetFood.
                    All rights reserved.
                </p>

            </footer>

        </div>
    );
};

export default Home;