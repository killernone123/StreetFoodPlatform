const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

// =====================================
// ROUTES
// =====================================

const categoryRoutes = require("./routes/categoryRoutes");
const foodRoutes = require("./routes/foodRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const supportRoutes = require("./routes/supportRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const pushNotificationRoutes = require("./routes/pushNotificationRoutes");

const app = express();

// =====================================
// CHECK ROUTES
// =====================================

console.log("=====================================");
console.log("🔍 CHECKING ROUTES");
console.log("=====================================");

console.log(
    "userRoutes:",
    typeof userRoutes
);

console.log(
    "categoryRoutes:",
    typeof categoryRoutes
);

console.log(
    "foodRoutes:",
    typeof foodRoutes
);

console.log(
    "orderRoutes:",
    typeof orderRoutes
);

console.log(
    "adminRoutes:",
    typeof adminRoutes
);

console.log(
    "paymentRoutes:",
    typeof paymentRoutes
);

console.log(
    "supportRoutes:",
    typeof supportRoutes
);

console.log("=====================================");


// =====================================
// CORS
// =====================================

const allowedOrigins = [
    "http://localhost:5173",
    "https://street-food-platform-z38i.vercel.app"
];

const corsOptions = {
    origin: (origin, callback) => {

        // Postman / Mobile / Server-to-server
        if (!origin) {
            return callback(null, true);
        }

        // Exact allowed origins
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Vercel preview deployments
        if (
            origin.startsWith(
                "https://street-food-platform"
            ) &&
            origin.endsWith(".vercel.app")
        ) {
            return callback(null, true);
        }

        console.log(
            "❌ Blocked CORS Origin:",
            origin
        );

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
// SOCKET.IO
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
// APP MIDDLEWARE
// =====================================

app.set("io", io);

app.use(cors(corsOptions));

app.use(express.json());



// =====================================
// ROUTE VALIDATION
// =====================================

function mountRoute(path, route, name) {

    if (typeof route !== "function") {

        console.error(
            `❌ INVALID ROUTE: ${name}`
        );

        console.error(
            `Expected router/function but received: ${typeof route}`
        );

        throw new TypeError(
            `${name} is not exporting an Express router`
        );
    }

    console.log(
        `✅ Route loaded: ${name} -> ${path}`
    );

    app.use(path, route);
}


// =====================================
// API ROUTES
// =====================================

mountRoute(
    "/api/users",
    userRoutes,
    "userRoutes"
);

mountRoute(
    "/api/categories",
    categoryRoutes,
    "categoryRoutes"
);

mountRoute(
    "/api/foods",
    foodRoutes,
    "foodRoutes"
);

mountRoute(
    "/api/orders",
    orderRoutes,
    "orderRoutes"
);

mountRoute(
    "/api/admin",
    adminRoutes,
    "adminRoutes"
);

mountRoute(
    "/api/payments",
    paymentRoutes,
    "paymentRoutes"
);
app.use(
  "/api/push-notifications",
  pushNotificationRoutes
);

// =====================================
// SUPPORT / FEEDBACK ROUTE
// =====================================

mountRoute(
    "/api/support",
    supportRoutes,
    "supportRoutes"
);
mountRoute(
    "/api/delivery",
    deliveryRoutes,
    "deliveryRoutes"
);
mountRoute(
    "/api/uploads",
    uploadRoutes,
    "uploadRoutes"
);
mountRoute(
    "/api/banners",
    bannerRoutes,
    "bannerRoutes"
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

    socket.on(
        "joinAdminRoom",
        (callback) => {

            console.log(
                "📥 JOIN ADMIN ROOM REQUEST RECEIVED"
            );

            console.log(
                "🆔 Socket ID:",
                socket.id
            );

            socket.join("admin_room");

            const clients =
                io.sockets.adapter.rooms.get(
                    "admin_room"
                )?.size || 0;

            console.log(
                "✅ Admin joined admin_room:",
                socket.id
            );

            console.log(
                "👥 Admin room clients:",
                clients
            );

            if (
                typeof callback ===
                "function"
            ) {
                callback({
                    success: true,
                    room: "admin_room",
                    clients
                });
            }
        }
    );


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

app.get(
    "/",
    (req, res) => {

        res.json({
            message:
                "Street Food API is Running"
        });
    }
);


// =====================================
// PORT
// =====================================

const PORT =
    process.env.PORT || 5000;


// =====================================
// START SERVER
// =====================================

server.listen(
    PORT,
    () => {

        console.log(
            `🚀 Server running on port ${PORT}`
        );

    }
);