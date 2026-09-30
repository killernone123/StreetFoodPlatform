import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const AdminLogin = () => {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");


    const handleChange = (event) => {

        const {
            name,
            value
        } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };


    const handleLogin = async (event) => {

        event.preventDefault();

        setError("");
        setLoading(true);


        try {

            const response =
                await API.post(
                    "/admin/login",
                    formData
                );


            if (response.data.success) {

                localStorage.setItem(
                    "adminToken",
                    response.data.token
                );

                localStorage.setItem(
                    "adminData",
                    JSON.stringify(
                        response.data.admin
                    )
                );


                navigate("/admin");
            }

        } catch (error) {

            setError(
                error.response?.data?.message ||
                "Login failed"
            );

        } finally {

            setLoading(false);
        }
    };


    return (
        <div className="admin-login-page">

            <div className="admin-login-card">

                <div className="admin-login-icon">
                    🔐
                </div>

                <p className="admin-login-label">
                    STREET FOOD
                </p>

                <h1>
                    Admin Login
                </h1>

                <p className="admin-login-subtitle">
                    Login to manage your orders
                </p>


                {error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}


                <form
                    onSubmit={handleLogin}
                >

                    <div className="form-group">

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            name="email"
                            value={
                                formData.email
                            }
                            onChange={
                                handleChange
                            }
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
                            value={
                                formData.password
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Enter password"
                            required
                        />

                    </div>


                    <button
                        type="submit"
                        className="admin-login-btn"
                        disabled={loading}
                    >
                        {loading
                            ? "Logging in..."
                            : "Login →"}
                    </button>

                </form>

            </div>

        </div>
    );
};

export default AdminLogin;