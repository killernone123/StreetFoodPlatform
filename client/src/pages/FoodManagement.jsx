import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const FoodManagement = () => {

    const navigate = useNavigate();

    const [foods, setFoods] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add Food form
    const [showForm, setShowForm] = useState(false);

    // Edit Food
    const [editingFood, setEditingFood] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    // Add Food form data
    const [formData, setFormData] = useState({
        name: "",
        categoryId: "",
        description: "",
        price: "",
        image: "",
        isVeg: true,
        isAvailable: true,
        isPopular: false,
        preparationTime: 15
    });


    // =========================================
    // ADMIN AUTH CHECK
    // =========================================

    const logoutAdmin = () => {

        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");

        navigate("/admin-login");
    };


    // =========================================
    // FETCH FOODS + CATEGORIES
    // =========================================

    const fetchData = async () => {

        try {

            setLoading(true);

            const [
                foodResponse,
                categoryResponse
            ] = await Promise.all([
                API.get("/foods"),
                API.get("/categories")
            ]);

            if (foodResponse.data.success) {

                setFoods(
                    foodResponse.data.foods
                );
            }

            if (categoryResponse.data.success) {

                setCategories(
                    categoryResponse.data.categories
                );
            }

        } catch (error) {

            console.error(
                "Food data error:",
                error.response?.data || error
            );

            // Token expired / invalid
            if (error.response?.status === 401) {

                logoutAdmin();

                return;
            }

        } finally {

            setLoading(false);
        }
    };


    // =========================================
    // PAGE LOAD + ADMIN TOKEN CHECK
    // =========================================

    useEffect(() => {

        const token =
            localStorage.getItem("adminToken");

        if (!token) {

            navigate("/admin-login");

            return;
        }

        fetchData();

    }, [navigate]);


    // =========================================
    // ADD FOOD INPUT CHANGE
    // =========================================

    const handleChange = (event) => {

        const {
            name,
            value,
            type,
            checked
        } = event.target;

        setFormData((previous) => ({
            ...previous,

            [name]:
                type === "checkbox"
                    ? checked
                    : value
        }));
    };


    // =========================================
    // ADD FOOD
    // =========================================

    const handleAddFood = async (event) => {

        event.preventDefault();

        try {

            const response = await API.post(
                "/foods",
                {
                    ...formData,

                    price: Number(
                        formData.price
                    ),

                    preparationTime: Number(
                        formData.preparationTime
                    )
                }
            );

            if (response.data.success) {

                alert(
                    "Food added successfully"
                );

                // Reset form
                setFormData({
                    name: "",
                    categoryId: "",
                    description: "",
                    price: "",
                    image: "",
                    isVeg: true,
                    isAvailable: true,
                    isPopular: false,
                    preparationTime: 15
                });

                // Close form
                setShowForm(false);

                // Refresh list
                fetchData();
            }

        } catch (error) {

            console.error(
                "ADD FOOD ERROR:",
                error.response?.data || error
            );

            if (error.response?.status === 401) {

                logoutAdmin();

                return;
            }

            alert(
                error.response?.data?.message ||
                "Failed to add food"
            );
        }
    };


    // =========================================
    // EDIT FOOD
    // =========================================

    const handleEditFood = (food) => {

        console.log(
            "EDIT FOOD:",
            food
        );

        setEditingFood(food);

        setEditFormData({

            name:
                food.name || "",

            categoryId:
                food.categoryId?._id ||
                food.categoryId ||
                "",

            description:
                food.description || "",

            price:
                food.price ?? "",

            image:
                food.image || "",

            isVeg:
                food.isVeg ?? true,

            isAvailable:
                food.isAvailable ?? true,

            isPopular:
                food.isPopular ?? false,

            preparationTime:
                food.preparationTime ?? 15

        });
    };


    // =========================================
    // EDIT INPUT CHANGE
    // =========================================

    const handleEditChange = (event) => {

        const {
            name,
            value,
            type,
            checked
        } = event.target;

        setEditFormData((previous) => ({

            ...previous,

            [name]:
                type === "checkbox"
                    ? checked
                    : value

        }));
    };


    // =========================================
    // UPDATE FOOD
    // =========================================

    const handleUpdateFood = async (event) => {

        event.preventDefault();

        if (!editingFood) {
            return;
        }

        try {

            const response = await API.put(
                `/foods/${editingFood._id}`,
                {
                    ...editFormData,

                    price: Number(
                        editFormData.price
                    ),

                    preparationTime: Number(
                        editFormData.preparationTime
                    )
                }
            );

            console.log(
                "UPDATE RESPONSE:",
                response.data
            );

            if (response.data.success) {

                alert(
                    "Food updated successfully"
                );

                setEditingFood(null);

                setEditFormData({});

                fetchData();
            }

        } catch (error) {

            console.error(
                "UPDATE FOOD ERROR:",
                error.response?.data ||
                error
            );

            if (error.response?.status === 401) {

                logoutAdmin();

                return;
            }

            alert(
                error.response?.data?.message ||
                "Failed to update food"
            );
        }
    };


    // =========================================
    // DELETE FOOD
    // =========================================

    const handleDeleteFood = async (foodId) => {

        console.log(
            "DELETE FOOD ID:",
            foodId
        );

        const confirmDelete =
            window.confirm(
                "Are you sure you want to delete this food?"
            );

        if (!confirmDelete) {
            return;
        }

        try {

            const response = await API.delete(
                `/foods/${foodId}`
            );

            console.log(
                "DELETE RESPONSE:",
                response.data
            );

            if (response.data.success) {

                alert(
                    "Food deleted successfully"
                );

                setFoods((previousFoods) =>
                    previousFoods.filter(
                        (food) =>
                            food._id !== foodId
                    )
                );
            }

        } catch (error) {

            console.error(
                "DELETE FOOD ERROR:",
                error.response?.data ||
                error
            );

            if (error.response?.status === 401) {

                logoutAdmin();

                return;
            }

            alert(
                error.response?.data?.message ||
                "Failed to delete food"
            );
        }
    };


    // =========================================
    // TOGGLE AVAILABILITY
    // =========================================

    const handleAvailability = async (food) => {

        try {

            const response = await API.put(
                `/foods/${food._id}`,
                {
                    isAvailable:
                        !food.isAvailable
                }
            );

            if (response.data.success) {

                fetchData();
            }

        } catch (error) {

            console.error(
                "AVAILABILITY ERROR:",
                error.response?.data ||
                error
            );

            if (error.response?.status === 401) {

                logoutAdmin();

                return;
            }

            alert(
                error.response?.data?.message ||
                "Failed to update availability"
            );
        }
    };


    // =========================================
    // UI
    // =========================================

    return (

        <div className="admin-page">

            {/* ================================= */}
            {/* HEADER */}
            {/* ================================= */}

            <div className="admin-header">

                <div>

                    <p className="admin-label">
                        STREET FOOD
                    </p>

                    <h1>
                        Food Management
                    </h1>

                    <p>
                        Add and manage your food items
                    </p>

                </div>


                {/* ADD FOOD BUTTON */}

                <button
                    type="button"
                    className="refresh-btn"
                    onClick={() =>
                        setShowForm(
                            !showForm
                        )
                    }
                >

                    {showForm
                        ? "✕ Close"
                        : "➕ Add Food"}

                </button>

            </div>


            {/* ================================= */}
            {/* ADD FOOD FORM */}
            {/* ================================= */}

            {showForm && (

                <form
                    className="food-form"
                    onSubmit={handleAddFood}
                >

                    <h2>
                        ➕ Add New Food
                    </h2>


                    <input
                        type="text"
                        name="name"
                        placeholder="Food name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />


                    <select
                        name="categoryId"
                        value={
                            formData.categoryId
                        }
                        onChange={handleChange}
                        required
                    >

                        <option value="">
                            Select Category
                        </option>

                        {categories.map(
                            (category) => (

                                <option
                                    key={
                                        category._id
                                    }
                                    value={
                                        category._id
                                    }
                                >

                                    {category.name}

                                </option>

                            )
                        )}

                    </select>


                    <textarea
                        name="description"
                        placeholder="Food description"
                        value={
                            formData.description
                        }
                        onChange={handleChange}
                    />


                    <input
                        type="number"
                        name="price"
                        placeholder="Price ₹"
                        value={formData.price}
                        onChange={handleChange}
                        min="0"
                        required
                    />


                    <input
                        type="text"
                        name="image"
                        placeholder="Image URL"
                        value={formData.image}
                        onChange={handleChange}
                    />


                    <input
                        type="number"
                        name="preparationTime"
                        placeholder="Preparation time in minutes"
                        value={
                            formData.preparationTime
                        }
                        onChange={handleChange}
                        min="1"
                    />


                    <div className="food-checkboxes">

                        <label>

                            <input
                                type="checkbox"
                                name="isVeg"
                                checked={
                                    formData.isVeg
                                }
                                onChange={
                                    handleChange
                                }
                            />

                            Veg

                        </label>


                        <label>

                            <input
                                type="checkbox"
                                name="isAvailable"
                                checked={
                                    formData.isAvailable
                                }
                                onChange={
                                    handleChange
                                }
                            />

                            Available

                        </label>


                        <label>

                            <input
                                type="checkbox"
                                name="isPopular"
                                checked={
                                    formData.isPopular
                                }
                                onChange={
                                    handleChange
                                }
                            />

                            Popular

                        </label>

                    </div>


                    <button
                        type="submit"
                        className="details-add-btn"
                    >

                        ➕ Add Food

                    </button>

                </form>

            )}


            {/* ================================= */}
            {/* EDIT FOOD FORM */}
            {/* ================================= */}

            {editingFood && (

                <form
                    className="food-form edit-food-form"
                    onSubmit={
                        handleUpdateFood
                    }
                >

                    <div className="edit-form-header">

                        <h2>
                            ✏️ Edit Food
                        </h2>

                        <button
                            type="button"
                            className="close-edit-btn"
                            onClick={() => {

                                setEditingFood(
                                    null
                                );

                                setEditFormData(
                                    {}
                                );

                            }}
                        >

                            ✕

                        </button>

                    </div>


                    <input
                        type="text"
                        name="name"
                        placeholder="Food name"
                        value={
                            editFormData.name
                        }
                        onChange={
                            handleEditChange
                        }
                        required
                    />


                    <select
                        name="categoryId"
                        value={
                            editFormData.categoryId
                        }
                        onChange={
                            handleEditChange
                        }
                        required
                    >

                        <option value="">
                            Select Category
                        </option>

                        {categories.map(
                            (category) => (

                                <option
                                    key={
                                        category._id
                                    }
                                    value={
                                        category._id
                                    }
                                >

                                    {category.name}

                                </option>

                            )
                        )}

                    </select>


                    <textarea
                        name="description"
                        placeholder="Food description"
                        value={
                            editFormData.description
                        }
                        onChange={
                            handleEditChange
                        }
                    />


                    <input
                        type="number"
                        name="price"
                        placeholder="Price ₹"
                        value={
                            editFormData.price
                        }
                        onChange={
                            handleEditChange
                        }
                        min="0"
                        required
                    />


                    <input
                        type="text"
                        name="image"
                        placeholder="Image URL"
                        value={
                            editFormData.image
                        }
                        onChange={
                            handleEditChange
                        }
                    />


                    <input
                        type="number"
                        name="preparationTime"
                        placeholder="Preparation time"
                        value={
                            editFormData.preparationTime
                        }
                        onChange={
                            handleEditChange
                        }
                        min="1"
                    />


                    <div className="food-checkboxes">

                        <label>

                            <input
                                type="checkbox"
                                name="isVeg"
                                checked={
                                    editFormData.isVeg
                                }
                                onChange={
                                    handleEditChange
                                }
                            />

                            Veg

                        </label>


                        <label>

                            <input
                                type="checkbox"
                                name="isAvailable"
                                checked={
                                    editFormData.isAvailable
                                }
                                onChange={
                                    handleEditChange
                                }
                            />

                            Available

                        </label>


                        <label>

                            <input
                                type="checkbox"
                                name="isPopular"
                                checked={
                                    editFormData.isPopular
                                }
                                onChange={
                                    handleEditChange
                                }
                            />

                            Popular

                        </label>

                    </div>


                    <button
                        type="submit"
                        className="details-add-btn"
                    >

                        💾 Update Food

                    </button>

                </form>

            )}


            {/* ================================= */}
            {/* FOOD LIST */}
            {/* ================================= */}

            {loading ? (

                <div className="admin-message">
                    Loading foods...
                </div>

            ) : (

                <div className="admin-orders">

                    <h2>
                        Food Items
                    </h2>

                    <p>
                        {foods.length} food items
                    </p>


                    {foods.length === 0 ? (

                        <div className="admin-message">

                            <div>
                                🍽️
                            </div>

                            <h3>
                                No food items found
                            </h3>

                            <p>
                                Click "Add Food" to
                                create your first
                                food item.
                            </p>

                        </div>

                    ) : (

                        foods.map((food) => (

                            <div
                                className="admin-order-card"
                                key={food._id}
                            >

                                <div className="order-top">

                                    <div>

                                        <h3>
                                            {food.name}
                                        </h3>

                                        <p>
                                            ₹{food.price}
                                        </p>

                                    </div>


                                    <span>

                                        {food.isAvailable
                                            ? "🟢 Available"
                                            : "🔴 Unavailable"}

                                    </span>

                                </div>


                                <p>
                                    {food.description ||
                                        "No description"}
                                </p>


                                <p>

                                    <strong>
                                        Category:
                                    </strong>{" "}

                                    {
                                        food.categoryId
                                            ?.name ||
                                        "Unknown"
                                    }

                                </p>


                                <p>

                                    <strong>
                                        Preparation:
                                    </strong>{" "}

                                    {
                                        food.preparationTime
                                    }{" "}
                                    minutes

                                </p>


                                <p>

                                    <strong>
                                        Type:
                                    </strong>{" "}

                                    {food.isVeg
                                        ? "🟢 Veg"
                                        : "🔴 Non-Veg"}

                                </p>


                                {food.isPopular && (

                                    <span
                                        className="admin-tag"
                                    >

                                        ⭐ Popular

                                    </span>

                                )}


                                <div
                                    className="food-actions"
                                >

                                    <button
                                        type="button"
                                        className="edit-food-btn"
                                        onClick={() =>
                                            handleEditFood(
                                                food
                                            )
                                        }
                                    >

                                        ✏️ Edit

                                    </button>


                                    <button
                                        type="button"
                                        className="availability-btn"
                                        onClick={() =>
                                            handleAvailability(
                                                food
                                            )
                                        }
                                    >

                                        {food.isAvailable
                                            ? "🔴 Make Unavailable"
                                            : "🟢 Make Available"}

                                    </button>


                                    <button
                                        type="button"
                                        className="delete-food-btn"
                                        onClick={() =>
                                            handleDeleteFood(
                                                food._id
                                            )
                                        }
                                    >

                                        🗑️ Delete

                                    </button>

                                </div>

                            </div>

                        ))

                    )}

                </div>

            )}

        </div>
    );
};

export default FoodManagement;