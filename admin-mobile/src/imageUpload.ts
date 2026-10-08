import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

const API_URL =
    "https://streetfoodplatform-1.onrender.com/api";

export async function uploadImage(
    uri: string,
    mimeType?: string | null
): Promise<string> {

    try {

        console.log("====================================");
        console.log("📸 IMAGE UPLOAD START");
        console.log("📱 LOCAL URI:", uri);
        console.log("====================================");

        // --------------------------------
        // ADMIN TOKEN
        // --------------------------------

        const token =
            await AsyncStorage.getItem("adminToken");

        if (!token) {
            throw new Error(
                "Admin token not found. Please login again."
            );
        }

        // --------------------------------
        // FILE TYPE
        // --------------------------------

        const type =
            mimeType || "image/jpeg";

        let extension = "jpg";

        if (type.includes("png")) {
            extension = "png";
        }

        if (type.includes("webp")) {
            extension = "webp";
        }

        if (type.includes("jpeg")) {
            extension = "jpg";
        }

        const fileName =
            `streetfood_${Date.now()}.${extension}`;

        console.log("📄 FILE TYPE:", type);
        console.log("📄 FILE NAME:", fileName);

        // --------------------------------
        // CHECK FILE
        // --------------------------------

        const fileInfo =
            await FileSystem.getInfoAsync(uri);

        console.log(
            "📁 FILE INFO:",
            fileInfo
        );

        if (!fileInfo.exists) {
            throw new Error(
                "Selected image file does not exist."
            );
        }

        // --------------------------------
        // UPLOAD
        // --------------------------------

        console.log(
            "⬆️ UPLOADING TO:",
            `${API_URL}/uploads/image`
        );

        const uploadResult =
            await FileSystem.uploadAsync(
                `${API_URL}/uploads/image`,
                uri,
                {
                    httpMethod: "POST",

                    uploadType:
                        FileSystem.FileSystemUploadType.MULTIPART,

                    fieldName: "image",

                    mimeType: type,

                    parameters: {
                        fileName: fileName,
                    },

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

        // --------------------------------
        // RESPONSE
        // --------------------------------

        console.log(
            "📡 UPLOAD STATUS:",
            uploadResult.status
        );

        console.log(
            "📡 UPLOAD RESPONSE:",
            uploadResult.body
        );

        let data: any;

        try {

            data =
                JSON.parse(
                    uploadResult.body
                );

        } catch {

            throw new Error(
                "Server returned invalid response."
            );
        }

        // --------------------------------
        // VALIDATION
        // --------------------------------

        if (
            uploadResult.status < 200 ||
            uploadResult.status >= 300
        ) {

            throw new Error(
                data?.message ||
                `Upload failed with status ${uploadResult.status}`
            );

        }

        if (
            !data.success ||
            !data.imageUrl
        ) {

            throw new Error(
                data?.message ||
                "Image upload failed."
            );

        }

        // --------------------------------
        // CLOUDINARY URL
        // --------------------------------

        console.log(
            "☁️ CLOUDINARY URL:",
            data.imageUrl
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

        return data.imageUrl;

    } catch (error: any) {

        console.log(
            "❌ IMAGE UPLOAD ERROR:",
            error
        );

        throw new Error(
            error?.message ||
            "Image upload failed."
        );
    }
}