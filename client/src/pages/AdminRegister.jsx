import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const AdminRegister = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleRegister = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            const response = await API.post("/admin/register", {
                name: formData.name,
                email: formData.email,
                password: formData.password
            });

            if (response.data.success) {
                setSuccess("Admin registered successfully!");

                setFormData({
                    name: "",
                    email: "",
                    password: "",
                    confirmPassword: ""
                });

                setTimeout(() => {
                    navigate("/admin-login");
                }, 1200);
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Registration failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">

            <div className="admin-login-card">

                <div className="admin-login-icon">
                    👨‍💼
                </div>

                <p className="admin-login-label">
                    STREET FOOD
                </p>

                <h1>
                    Admin Register
                </h1>

                <p className="admin-login-subtitle">
                    Create your admin account
                </p>

                {error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="login-success">
                        {success}
                    </div>
                )}

                <form onSubmit={handleRegister}>

                    <div className="form-group">
                        <label>
                            Name
                        </label>

                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter admin name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="admin@example.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Minimum 6 characters"
                            minLength={6}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Confirm Password
                        </label>

                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="admin-login-btn"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating account..."
                            : "Create Admin Account →"}
                    </button>

                </form>

                <button
                    type="button"
                    onClick={() => navigate("/admin-login")}
                    style={{
                        marginTop: "15px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer"
                    }}
                >
                    Already have an account? Login
                </button>

            </div>

        </div>
    );
};

export default AdminRegister;