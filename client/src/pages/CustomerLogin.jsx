import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

const CustomerLogin = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError("");

            const response = await API.post(
                "/users/login",
                formData
            );

            if (response.data.success) {
                localStorage.setItem(
                    "customerToken",
                    response.data.token
                );

                localStorage.setItem(
                    "customerData",
                    JSON.stringify(response.data.user)
                );

                alert("Login successful! 🎉");

                navigate("/");
            }

        } catch (error) {
            console.error("LOGIN FULL ERROR:", error);

            console.log("Error message:", error.message);
            console.log("Error code:", error.code);
            console.log("Error response:", error.response);
            console.log("Error request:", error.request);

            setError(
                error.response?.data?.message ||
                error.message ||
                "Login failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">

            <div className="auth-card">

                <div className="auth-icon">
                    🍴
                </div>

                <h1>Welcome Back!</h1>

                <p>
                    Login to order your favourite food
                </p>

                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label>Email</label>

                        <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>

                        <input
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-btn"
                        disabled={loading}
                    >
                        {loading
                            ? "Logging in..."
                            : "Login 🔐"}
                    </button>

                </form>

                <p className="auth-bottom">
                    Don't have an account?{" "}
                    <Link to="/register">
                        Create Account
                    </Link>
                </p>

            </div>

        </div>
    );
};

export default CustomerLogin;