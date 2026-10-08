import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Home from "./pages/Home";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin"
import FoodManagement from "./pages/FoodManagement";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerRegister from "./pages/CustomerRegister";
import MyOrders from "./pages/MyOrders";
import OrderDetails from "./pages/OrderDetails";
import AdminRegister from "./pages/AdminRegister";

function App() {
    return (
        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="/checkout"
                    element={<Checkout />}
                />
                <Route
                    path="admin"
                    element={<Admin />}
                />
                <Route
                    path="/admin-login"
                    element={<AdminLogin />} />
                <Route
                    path="/admin-register"
                    element={<AdminRegister />}
                />

                <Route
                    path="/admin/foods"
                    element={<FoodManagement />} />

                <Route
                    path="/login"
                    element={<CustomerLogin />}
                />

                <Route
                    path="/register"
                    element={<CustomerRegister />}
                />
                <Route
                    path="/my-orders"
                    element={<MyOrders />}
                />
                <Route
                    path="/my-orders/:id"
                    element={<OrderDetails />} />

            </Routes>


        </BrowserRouter>
    );
}

export default App;