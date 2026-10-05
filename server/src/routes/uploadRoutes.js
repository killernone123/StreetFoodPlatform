const express = require("express");
const multer = require("multer");

const cloudinary = require("../config/cloudinary");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Only JPG, JPEG, PNG and WEBP images are allowed."
                )
            );
        }
    }
});

router.post(
    "/image",
    adminAuth,
    upload.single("image"),
    async (req, res) => {
        try {
            console.log("====================================");
            console.log("📸 IMAGE UPLOAD REQUEST");
            console.log("====================================");

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Image file is required."
                });
            }

            console.log(
                "📁 FILE:",
                req.file.originalname
            );

            console.log(
                "📦 SIZE:",
                req.file.size
            );

            console.log(
                "📝 TYPE:",
                req.file.mimetype
            );

            if (
                !process.env.CLOUDINARY_CLOUD_NAME ||
                !process.env.CLOUDINARY_API_KEY ||
                !process.env.CLOUDINARY_API_SECRET
            ) {
                console.log(
                    "❌ CLOUDINARY ENV VARIABLES MISSING"
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Cloudinary is not configured on server."
                });
            }

            const result =
                await new Promise((resolve, reject) => {
                    const stream =
                        cloudinary.uploader.upload_stream(
                            {
                                folder: "streetfood",
                                resource_type: "image",

                                transformation: [
                                    {
                                        width: 1200,
                                        height: 1200,
                                        crop: "limit",
                                        quality: "auto",
                                        fetch_format: "auto"
                                    }
                                ]
                            },

                            (error, result) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(result);
                                }
                            }
                        );

                    stream.end(req.file.buffer);
                });

            if (
                !result ||
                !result.secure_url
            ) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Cloudinary URL was not received."
                });
            }

            console.log(
                "☁️ CLOUDINARY URL:"
            );

            console.log(
                result.secure_url
            );

            console.log(
                "===================================="
            );

            console.log(
                "✅ IMAGE UPLOAD SUCCESS"
            );

            console.log(
                "===================================="
            );

            return res.status(200).json({
                success: true,

                message:
                    "Image uploaded successfully.",

                imageUrl:
                    result.secure_url,

                publicId:
                    result.public_id,

                width:
                    result.width,

                height:
                    result.height,

                format:
                    result.format
            });

        } catch (error) {

            console.log(
                "❌ IMAGE UPLOAD ERROR:"
            );

            console.log(error);

            return res.status(500).json({
                success: false,

                message:
                    error.message ||
                    "Image upload failed."
            });
        }
    }
);

module.exports = router;