const express = require("express");
const Category = require("../models/category");

const router = express.Router();

// GET ALL ACTIVE CATEGORIES
router.get("/", async (req, res) => {
    try {
        const categories = await Category.find({
            isActive: true
        }).sort({
            sortOrder: 1
        });

        res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


router.post("/", async(req, res)=>{
    try{
        const category = await Category.create(req.body);

        res.status(201).json({
            success: true,
            message:"Category Created Successfully", category
        });

    }catch(error){
        res.status(500).json({success:false, message:error.message});

    }
});

module.exports = router;