import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import User from "../../db/user";

export const changeProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Check authentication
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        code: "profile-e1",
        message: "User not authenticated",
      });
      return;
    }

    const userId = req.user.id;
    const { fullname } = req.body;

    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        code: "profile-e2",
        message: "User not found",
      });
      return;
    }

    // Update fullname if provided
    if (fullname) {
      user.fullname = fullname;
    }

    // Handle profile image upload
    if (req.file) {
      // Delete old image if exists and not a URL
      if (user.profileImage && !user.profileImage.startsWith("http")) {
        const oldImagePath = path.join(
          __dirname,
          "../../../public",
          user.profileImage,
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      // Set new image path
      user.profileImage = `/uploads/${req.file.filename}`;
    }

    // Save updated user
    await user.save();

    // Send success response
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        uid: user.uid,
        fullname: user.fullname,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      code: "profile-e3",
      message: "Server error updating profile",
    });
  }
};

export default changeProfile;
