const multer = require("multer");
const { cloudinary } = require("../../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const storage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: "herya-app/users",
		allowedFormats: ["jpg", "png", "jpeg", "gif", "webp"],
	},
});

const uploadUserImage = multer({
	storage,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB max
	},
	fileFilter: (req, file, cb) => {
		const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
		allowedMimes.includes(file.mimetype)
			? cb(null, true)
			: cb(new Error("Solo jpg, png, gif, webp permitidos"));
	},
});

module.exports = { uploadUserImage };
