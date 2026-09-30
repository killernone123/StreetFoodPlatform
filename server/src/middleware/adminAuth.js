const jwt = require("jsonwebtoken");

const adminAuth = (req, res, next) => {

    try {

        const authHeader =
            req.headers.authorization;

        if (!authHeader) {

            return res.status(401).json({
                success: false,
                message: "Authorization token missing"
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

        req.admin = decoded;

        next();

    } catch (error) {

        console.error("JWT ERROR:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired admin token"
        });

    }
};

module.exports = adminAuth;