const jwt = require("jsonwebtoken");

const userAuth = (req, res, next) => {
    try {
        const authHeader =
            req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Customer login required"
            });
        }

        const token =
            authHeader.startsWith("Bearer ")
                ? authHeader.split(" ")[1]
                : null;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (decoded.role !== "customer") {
            return res.status(403).json({
                success: false,
                message: "Customer access required"
            });
        }

        req.user = decoded;

        next();

    } catch (error) {

        console.error(
            "User Auth Error:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message:
                "Invalid or expired customer token"
        });
    }
};

module.exports = userAuth;