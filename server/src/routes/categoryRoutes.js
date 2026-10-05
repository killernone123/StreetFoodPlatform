const express = require("express");
const Category = require("../models/category");

const router = express.Router();


// =====================================================
// GET ALL ACTIVE CATEGORIES
// CUSTOMER APP
// =====================================================
router.get("/", async (req, res) => {
    try {
        const categories = await Category.find({
            isActive: true
        }).sort({
            sortOder: 1
        });

        res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });

    } catch (error) {
        console.log("GET CATEGORIES ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// =====================================================
// GET ALL CATEGORIES
// ADMIN MOBILE
// ACTIVE + INACTIVE BOTH
// =====================================================
router.get("/admin/all", async (req, res) => {
    try {
        const categories = await Category.find({})
            .sort({
                sortOder: 1
            });

        res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });

    } catch (error) {
        console.log("GET ADMIN CATEGORIES ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// =====================================================
// POST CREATE CATEGORY
// ADMIN
// =====================================================
router.post("/", async (req, res) => {
    try {
        const category = await Category.create(req.body);

        // 🔥 REAL-TIME CATEGORY UPDATE
        const io = req.app.get("io");

        if (io) {
            io.emit("categoryUpdated", {
                action: "created",
                category
            });

            console.log("⚡ CATEGORY CREATED EVENT SENT");
        }

        res.status(201).json({
            success: true,
            message: "Category Created Successfully",
            category
        });

    } catch (error) {
        console.log("CREATE CATEGORY ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// =====================================================
// PUT UPDATE CATEGORY
// ADMIN
// =====================================================
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByIdAndUpdate(
            id,
            {
                name: req.body.name,
                slug: req.body.slug,
                image: req.body.image || "",
                isActive: req.body.isActive,
                sortOder: Number(req.body.sortOder) || 1
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }


        // 🔥 REAL-TIME CATEGORY UPDATE
        const io = req.app.get("io");

        if (io) {
            io.emit("categoryUpdated", {
                action: "updated",
                category
            });

            console.log(
                "⚡ CATEGORY UPDATED EVENT SENT:",
                category._id.toString()
            );
        }


        res.status(200).json({
            success: true,
            message: "Category Updated Successfully",
            category
        });

    } catch (error) {
        console.log("UPDATE CATEGORY ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// =====================================================
// DELETE CATEGORY
// ADMIN
// =====================================================
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByIdAndDelete(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }


        // 🔥 REAL-TIME CATEGORY UPDATE
        const io = req.app.get("io");

        if (io) {
            io.emit("categoryUpdated", {
                action: "deleted",
                categoryId: id
            });

            console.log(
                "⚡ CATEGORY DELETED EVENT SENT:",
                id
            );
        }


        res.status(200).json({
            success: true,
            message: "Category Deleted Successfully"
        });

    } catch (error) {
        console.log("DELETE CATEGORY ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


module.exports = router;