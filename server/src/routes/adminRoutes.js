const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");

const router = express.Router();


// =====================================
// ADMIN REGISTER
// =====================================

router.post("/register", async (req, res) => {
    try {

        const {
            name,
            email,
            password
        } = req.body;


        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email and password are required"
            });
        }


        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters"
            });
        }


        const existingAdmin =
            await Admin.findOne({
                email: email.toLowerCase()
            });


        if (existingAdmin) {
            return res.status(409).json({
                success: false,
                message:
                    "Admin already exists"
            });
        }


        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        const admin =
            await Admin.create({
                name,

                email:
                    email.toLowerCase(),

                password:
                    hashedPassword
            });


        res.status(201).json({
            success: true,
            message:
                "Admin registered successfully",

            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email
            }
        });

    } catch (error) {

        console.error(
            "Admin Register Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to register admin"
        });
    }
});


// =====================================
// ADMIN LOGIN
// =====================================

router.post("/login", async (req, res) => {
    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required"
            });
        }


        const admin =
            await Admin.findOne({
                email:
                    email.toLowerCase()
            });


        if (!admin) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password"
            });
        }


        const passwordMatch =
            await bcrypt.compare(
                password,
                admin.password
            );


        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password"
            });
        }


        const token =
            jwt.sign(
                {
                    id: admin._id,
                    role: admin.role
                },

                process.env.JWT_SECRET,

                {
                    expiresIn: "7d"
                }
            );


        res.status(200).json({
            success: true,

            message:
                "Login successful",

            token,

            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {

        console.error(
            "Admin Login Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Login failed"
        });
    }
});

// =====================================
// RESET ADMIN PASSWORD
// TEMPORARY USE
// =====================================

router.post("/reset-password", async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Email and new password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        const admin = await Admin.findOne({
            email: email.toLowerCase()
        });

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        admin.password = hashedPassword;

        await admin.save();

        res.status(200).json({
            success: true,
            message: "Admin password reset successfully"
        });

    } catch (error) {
        console.error(
            "Admin Password Reset Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to reset admin password"
        });
    }
});


module.exports = router;