const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUDE_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60000,
});

const uploadToCloudinary = async (fileURI) => {
  try {
    const response = await cloudinary.uploader.upload(fileURI);
    return response;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to upload image to Cloudinary");
  }
};

module.exports = { uploadToCloudinary, cloudinary };
