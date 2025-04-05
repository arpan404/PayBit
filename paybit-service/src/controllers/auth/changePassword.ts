import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../../db/user";

const changePassword = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Both current and new passwords are required.",
        code: "error-e1",
      });
    }
    const userId = req.user?.id;
    if (!userId) {

      
      return res
        .status(401)
        .json({ message: "User not authenticated.", code: "error-e2" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found.", code: "error-e3" });
    }

    // Verify the current password matches the hashed password in the database
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect.", code: "error-e4" });
    }

    // Prevent setting the new password the same as the current password
    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from the current password.",
        code: "error-e5",
      });
    }

    // Basic validation for new password (e.g., minimum length)
    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters long.",
        code: "error-e6",
      });
    }

    // Hash the new password and update the user record
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", code: "error-e7" });
  }
};

export default changePassword;
