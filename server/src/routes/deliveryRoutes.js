const express = require("express");
const DeliverySettings = require("../models/DeliverySettings");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();


// ======================================================
// DEFAULT DELIVERY SETTINGS
// ======================================================

const DEFAULT_SETTINGS = {
    restaurantLat: 21.82013,
    restaurantLng: 75.619958,

    pricingType: "SLAB",

    baseCharge: 20,
    freeDistanceKm: 0,
    perKmCharge: 10,
    maxDistanceKm: 12,

    slabs: [
        {
            minKm: 0,
            maxKm: 1,
            charge: 20
        },
        {
            minKm: 1,
            maxKm: 2,
            charge: 30
        },
        {
            minKm: 2,
            maxKm: 5,
            charge: 50
        },
        {
            minKm: 5,
            maxKm: 12,
            charge: 70
        }
    ],

    isActive: true
};


// ======================================================
// GET DELIVERY SETTINGS
// ======================================================

router.get("/", adminAuth, async (req, res) => {
    try {

        let settings =
            await DeliverySettings.findOne({
                isActive: true
            });

        // ------------------------------------------
        // Create default settings if not found
        // ------------------------------------------

        if (!settings) {

            settings =
                await DeliverySettings.create(
                    DEFAULT_SETTINGS
                );
        }

        res.status(200).json({
            success: true,
            settings
        });

    } catch (error) {

        console.log(
            "❌ GET DELIVERY SETTINGS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                error.message
        });
    }
});


// ======================================================
// UPDATE DELIVERY SETTINGS
// ======================================================

router.put("/", adminAuth, async (req, res) => {
    try {

        const {
            restaurantLat,
            restaurantLng,
            pricingType,
            baseCharge,
            freeDistanceKm,
            perKmCharge,
            maxDistanceKm,
            slabs
        } = req.body;


        // ------------------------------------------
        // Validate restaurant coordinates
        // ------------------------------------------

        if (
            restaurantLat === undefined ||
            restaurantLng === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Restaurant latitude and longitude are required."
            });
        }


        const restaurantLatitude =
            Number(restaurantLat);

        const restaurantLongitude =
            Number(restaurantLng);


        if (
            !Number.isFinite(
                restaurantLatitude
            ) ||
            !Number.isFinite(
                restaurantLongitude
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid restaurant coordinates."
            });
        }


        if (
            restaurantLatitude < -90 ||
            restaurantLatitude > 90 ||
            restaurantLongitude < -180 ||
            restaurantLongitude > 180
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Restaurant coordinates are out of range."
            });
        }


        // ------------------------------------------
        // Validate pricing type
        // ------------------------------------------

        if (
            !["SLAB", "PER_KM"].includes(
                pricingType
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "pricingType must be SLAB or PER_KM."
            });
        }


        // ------------------------------------------
        // Get existing settings
        // ------------------------------------------

        let settings =
            await DeliverySettings.findOne();


        if (!settings) {

            settings =
                new DeliverySettings(
                    DEFAULT_SETTINGS
                );
        }


        // ------------------------------------------
        // Update basic settings
        // ------------------------------------------

        settings.restaurantLat =
            restaurantLatitude;

        settings.restaurantLng =
            restaurantLongitude;

        settings.pricingType =
            pricingType;


        settings.baseCharge =
            Number(
                baseCharge ?? 0
            );


        settings.freeDistanceKm =
            Number(
                freeDistanceKm ?? 0
            );


        settings.perKmCharge =
            Number(
                perKmCharge ?? 0
            );


        settings.maxDistanceKm =
            Number(
                maxDistanceKm ?? 0
            );


        // ------------------------------------------
        // Validate numeric settings
        // ------------------------------------------

        if (
            !Number.isFinite(
                settings.baseCharge
            ) ||
            !Number.isFinite(
                settings.freeDistanceKm
            ) ||
            !Number.isFinite(
                settings.perKmCharge
            ) ||
            !Number.isFinite(
                settings.maxDistanceKm
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid delivery pricing values."
            });
        }


        if (
            settings.baseCharge < 0 ||
            settings.freeDistanceKm < 0 ||
            settings.perKmCharge < 0 ||
            settings.maxDistanceKm <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Delivery pricing values cannot be negative and max distance must be greater than 0."
            });
        }


        // ------------------------------------------
        // Update slabs
        // ------------------------------------------

        if (Array.isArray(slabs)) {

            settings.slabs =
                slabs
                    .map((slab) => ({
                        minKm:
                            Number(
                                slab.minKm
                            ),

                        maxKm:
                            Number(
                                slab.maxKm
                            ),

                        charge:
                            Number(
                                slab.charge
                            )
                    }))
                    .filter(
                        (slab) =>
                            Number.isFinite(
                                slab.minKm
                            ) &&
                            Number.isFinite(
                                slab.maxKm
                            ) &&
                            Number.isFinite(
                                slab.charge
                            )
                    );
        }


        settings.isActive =
            true;


        await settings.save();


        res.status(200).json({
            success: true,
            message:
                "Delivery settings updated successfully.",
            settings
        });

    } catch (error) {

        console.log(
            "❌ UPDATE DELIVERY SETTINGS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                error.message
        });
    }
});


// ======================================================
// CALCULATE DELIVERY CHARGE
// GOOGLE ROUTES API
// ======================================================

router.post(
    "/calculate",
    async (req, res) => {

        try {

            console.log(
                "🚚 DELIVERY CALCULATION REQUEST"
            );


            // ==========================================
            // CUSTOMER LOCATION
            // ==========================================

            const {
                customerLat,
                customerLng
            } = req.body;


            if (
                customerLat === undefined ||
                customerLng === undefined
            ) {

                return res.status(400).json({
                    success: false,
                    available: false,
                    message:
                        "Customer latitude and longitude are required."
                });
            }


            const lat =
                Number(customerLat);

            const lng =
                Number(customerLng);


            // ==========================================
            // VALIDATE CUSTOMER COORDINATES
            // ==========================================

            if (
                !Number.isFinite(lat) ||
                !Number.isFinite(lng)
            ) {

                return res.status(400).json({
                    success: false,
                    available: false,
                    message:
                        "Invalid customer coordinates."
                });
            }


            if (
                lat < -90 ||
                lat > 90 ||
                lng < -180 ||
                lng > 180
            ) {

                return res.status(400).json({
                    success: false,
                    available: false,
                    message:
                        "Customer coordinates are out of range."
                });
            }


            console.log(
                "📍 CUSTOMER:",
                lat,
                lng
            );


            // ==========================================
            // GET DELIVERY SETTINGS
            // ==========================================

            let settings =
                await DeliverySettings.findOne({
                    isActive: true
                });


            // ------------------------------------------
            // If settings missing, create defaults
            // ------------------------------------------

            if (!settings) {

                settings =
                    await DeliverySettings.create(
                        DEFAULT_SETTINGS
                    );
            }


            const restaurantLat =
                Number(
                    settings.restaurantLat
                );

            const restaurantLng =
                Number(
                    settings.restaurantLng
                );


            console.log(
                "🏪 RESTAURANT:",
                restaurantLat,
                restaurantLng
            );


            // ==========================================
            // GOOGLE API KEY
            // ==========================================

            const apiKey =
                process.env.GOOGLE_MAPS_API_KEY;


            if (!apiKey) {

                console.log(
                    "❌ GOOGLE_MAPS_API_KEY MISSING"
                );

                return res.status(500).json({
                    success: false,
                    available: false,
                    message:
                        "Google Maps API key is not configured."
                });
            }


            // ==========================================
            // GOOGLE ROUTES API
            // ==========================================

            const googleResponse =
                await fetch(
                    "https://routes.googleapis.com/directions/v2:computeRoutes",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "X-Goog-Api-Key":
                                apiKey,

                            "X-Goog-FieldMask":
                                "routes.distanceMeters,routes.duration"
                        },

                        body: JSON.stringify({

                            origin: {
                                location: {
                                    latLng: {
                                        latitude:
                                            restaurantLat,

                                        longitude:
                                            restaurantLng
                                    }
                                }
                            },

                            destination: {
                                location: {
                                    latLng: {
                                        latitude:
                                            lat,

                                        longitude:
                                            lng
                                    }
                                }
                            },

                            travelMode:
                                "DRIVE"
                        })
                    }
                );


            const googleData =
                await googleResponse.json();


            // ==========================================
            // GOOGLE ERROR
            // ==========================================

            if (
                !googleResponse.ok
            ) {

                console.log(
                    "❌ GOOGLE ROUTES API ERROR:"
                );

                console.log(
                    googleData
                );

                return res.status(500).json({
                    success: false,
                    available: false,
                    message:
                        "Google Maps route calculation failed.",
                    error:
                        googleData?.error?.message ||
                        "Unknown Google Maps error"
                });
            }


            // ==========================================
            // CHECK ROUTE
            // ==========================================

            if (
                !googleData.routes ||
                googleData.routes.length === 0
            ) {

                return res.status(400).json({
                    success: false,
                    available: false,
                    message:
                        "No delivery route found."
                });
            }


            const route =
                googleData.routes[0];


            const distanceMeters =
                Number(
                    route.distanceMeters
                );


            if (
                !Number.isFinite(
                    distanceMeters
                )
            ) {

                return res.status(500).json({
                    success: false,
                    available: false,
                    message:
                        "Invalid distance received from Google Maps."
                });
            }


            const distanceKm =
                distanceMeters / 1000;


            const roundedDistance =
                Number(
                    distanceKm.toFixed(2)
                );


            console.log(
                "🛣️ ROAD DISTANCE:",
                roundedDistance,
                "KM"
            );


            // ==========================================
            // FREE RESTAURANT ZONE
            // ==========================================
            // Restaurant ke bilkul paas:
            // 0 - 100 meters = ₹0 delivery
            // ==========================================

            const FREE_RESTAURANT_ZONE_KM =
                0.10;


            if (
                distanceKm <=
                FREE_RESTAURANT_ZONE_KM
            ) {

                console.log(
                    "🆓 FREE RESTAURANT ZONE"
                );


                return res.status(200).json({

                    success: true,

                    available: true,

                    distanceKm:
                        roundedDistance,

                    deliveryCharge:
                        0,

                    maxDistanceKm:
                        Number(
                            settings.maxDistanceKm
                        ),

                    duration:
                        route.duration ||
                        null,

                    message:
                        "You are near the restaurant. Free delivery."
                });
            }


            // ==========================================
            // MAXIMUM DELIVERY DISTANCE
            // ==========================================

            if (
                distanceKm >
                Number(
                    settings.maxDistanceKm
                )
            ) {

                return res.status(200).json({

                    success: false,

                    available: false,

                    distanceKm:
                        roundedDistance,

                    deliveryCharge:
                        0,

                    maxDistanceKm:
                        Number(
                            settings.maxDistanceKm
                        ),

                    message:
                        `Delivery is available only within ${settings.maxDistanceKm} km.`,

                    duration:
                        route.duration ||
                        null
                });
            }


            // ==========================================
            // DELIVERY CHARGE
            // ==========================================

            let deliveryCharge = 0;


            // ==========================================
            // SLAB PRICING
            // ==========================================

            if (
                settings.pricingType ===
                "SLAB"
            ) {

                const slabs =
                    Array.isArray(
                        settings.slabs
                    )
                        ? settings.slabs
                        : [];


                const slab =
                    slabs.find(
                        (slab, index) => {

                            const minKm =
                                Number(
                                    slab.minKm
                                );

                            const maxKm =
                                Number(
                                    slab.maxKm
                                );


                            const isLast =
                                index ===
                                slabs.length - 1;


                            if (isLast) {

                                return (
                                    distanceKm >=
                                        minKm &&
                                    distanceKm <=
                                        maxKm
                                );
                            }


                            return (
                                distanceKm >=
                                    minKm &&
                                distanceKm <
                                    maxKm
                            );
                        }
                    );


                if (!slab) {

                    return res.status(200).json({

                        success: false,

                        available: false,

                        distanceKm:
                            roundedDistance,

                        deliveryCharge:
                            0,

                        maxDistanceKm:
                            Number(
                                settings.maxDistanceKm
                            ),

                        message:
                            "Delivery charge slab not found."
                    });
                }


                deliveryCharge =
                    Number(
                        slab.charge
                    );
            }


            // ==========================================
            // PER KM PRICING
            // ==========================================

            else if (
                settings.pricingType ===
                "PER_KM"
            ) {

                const freeDistance =
                    Number(
                        settings.freeDistanceKm
                    );


                const chargeableDistance =
                    Math.max(
                        0,
                        distanceKm -
                            freeDistance
                    );


                deliveryCharge =
                    Number(
                        settings.baseCharge
                    ) +
                    (
                        chargeableDistance *
                        Number(
                            settings.perKmCharge
                        )
                    );


                deliveryCharge =
                    Math.ceil(
                        deliveryCharge
                    );
            }


            // ==========================================
            // FINAL RESPONSE
            // ==========================================

            deliveryCharge =
                Number(
                    deliveryCharge.toFixed(2)
                );


            console.log(
                "💰 DELIVERY CHARGE:",
                deliveryCharge
            );


            console.log(
                "✅ DELIVERY AVAILABLE"
            );


            return res.status(200).json({

                success: true,

                available: true,

                distanceKm:
                    roundedDistance,

                deliveryCharge:
                    deliveryCharge,

                maxDistanceKm:
                    Number(
                        settings.maxDistanceKm
                    ),

                duration:
                    route.duration ||
                    null,

                message:
                    "Delivery available."
            });


        } catch (error) {

            console.log(
                "❌ DELIVERY CALCULATION ERROR:"
            );

            console.log(
                error
            );


            return res.status(500).json({

                success: false,

                available: false,

                message:
                    error.message ||
                    "Delivery calculation failed."
            });
        }
    }
);


module.exports = router;