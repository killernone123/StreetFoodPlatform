const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

const categoryRoutes = require("./routes/categoryRoutes");
const foodRoutes = require("./routes/foodRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();


// =====================================
// ALLOWED FRONTEND ORIGINS
// =====================================

const allowedOrigins = [
    "http://localhost:5173",
    "https://street-food-platform-z38i.vercel.app"
];


// =====================================
// CORS CONFIGURATION
// =====================================

const corsOptions = {
    origin: (origin, callback) => {

        // Postman / mobile / server-to-server
        if (!origin) {
            return callback(null, true);
        }

        // Exact allowed origins
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Vercel preview deployments
        if (
            origin.startsWith("https://street-food-platform") &&
            origin.endsWith(".vercel.app")
        ) {
            return callback(null, true);
        }

        console.log("❌ Blocked CORS Origin:", origin);

        return callback(
            new Error("Not allowed by CORS")
        );
    },

    credentials: true
};


// =====================================
// HTTP SERVER
// =====================================

const server = http.createServer(app);


// =====================================
// SOCKET.IO SERVER
// =====================================

const io = new Server(server, {
    cors: {
        origin: true,

        methods: [
            "GET",
            "POST",
            "PATCH"
        ],

        credentials: true
    },

    transports: [
        "polling",
        "websocket"
    ]
});


// =====================================
// IMPORTANT
// Make Socket.IO available in Express
// =====================================

app.set("io", io);


// =====================================
// MIDDLEWARE
// =====================================

app.use(cors(corsOptions));

app.use(express.json());


// =====================================
// API ROUTES
// =====================================

app.use(
    "/api/users",
    userRoutes
);

app.use(
    "/api/categories",
    categoryRoutes
);

app.use(
    "/api/foods",
    foodRoutes
);

app.use(
    "/api/orders",
    orderRoutes
);

app.use(
    "/api/admin",
    adminRoutes
);

app.use(
    "/api/payments",
    paymentRoutes
);


// =====================================
// DATABASE
// =====================================

connectDB();


// =====================================
// SOCKET CONNECTION
// =====================================

io.on("connection", (socket) => {

    console.log(
        `🟢 Socket connected: ${socket.id}`
    );


    // =================================
    // ADMIN ROOM
    // =================================

    socket.on("joinAdminRoom", () => {

        socket.join("admin_room");

        console.log(
            `👨‍💼 Admin joined admin_room: ${socket.id}`
        );

        console.log(
            "👥 Admin room clients:",
            io.sockets.adapter.rooms.get(
                "admin_room"
            )?.size || 0
        );

    });


    // =================================
    // CUSTOMER ORDER ROOM
    // =================================

    socket.on(
        "joinOrderRoom",
        (orderId) => {

            if (!orderId) {
                return;
            }

            const roomName =
                `order_${orderId}`;

            socket.join(roomName);

            console.log(
                `📦 Customer joined: ${roomName}`
            );

        }
    );


    // =================================
    // DISCONNECT
    // =================================

    socket.on(
        "disconnect",
        () => {

            console.log(
                `🔴 Socket disconnected: ${socket.id}`
            );

        }
    );

});


// =====================================
// HOME API
// =====================================

app.get("/", (req, res) => {

    res.json({
        message:
            "Street Food API is Running"
    });

});


// =====================================
// PORT
// =====================================

const PORT =
    process.env.PORT || 5000;


// =====================================
// START SERVER
// =====================================

server.listen(PORT, () => {

    console.log(
        `🚀 Server running on port ${PORT}`
    );

});