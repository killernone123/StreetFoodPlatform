import axios from "axios";

const API = axios.create({
    baseURL: "https://streetfoodplatform-1.onrender.com/api"
});

API.interceptors.request.use(
    (config) => {

        const adminToken =
            localStorage.getItem("adminToken");

        const customerToken =
            localStorage.getItem("customerToken");

        const url =
            config.url || "";

        const method =
            config.method?.toLowerCase();

        // =====================================
        // CUSTOMER ORDER APIs
        // =====================================

        const isCustomerOrderApi =
            (
                url === "/orders" &&
                method === "post"
            ) ||
            (
                url === "/orders/verify-payment" &&
                method === "post"
            ) ||
            url.startsWith("/orders/my-orders") ||
            (
                url.startsWith("/orders/") &&
                method === "get"
            );

        // =====================================
        // CUSTOMER TOKEN
        // =====================================

        if (
            isCustomerOrderApi &&
            customerToken
        ) {
            config.headers.Authorization =
                `Bearer ${customerToken}`;
        }

        // =====================================
        // ADMIN TOKEN
        // =====================================

        else if (adminToken) {
            config.headers.Authorization =
                `Bearer ${adminToken}`;
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);

export default API;