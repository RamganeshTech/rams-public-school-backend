import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Response } from "express";
import { RoleBasedRequest } from '../../utils/types';
import { isValidEmail, isValidPhone } from '../../utils/basicValidation';
import UserModel from '../../models/UserModel/user.model';
import { uploadFileToS3 } from '../../utils/s3Upload';
import { transporter } from '../../services/mail_services/forgotPasswordMail';
import dotenv from 'dotenv';

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET! // store in env


export const createUserV1 = async (req: RoleBasedRequest, res: Response) => {
  try {
    let { email, userName, password, phoneNo,
      role,
      isPlatformAdmin = false } = req.body;

    // Trim whitespace from email and password
    email = email?.trim();
    password = password?.trim();


    // if (!schoolId) {
    //   return res.status(400).json({ message: "schoolId is required", ok: false });
    // }


    if (!role) {
      return res.status(400).json({ message: "role must be provided", ok: false });
    }


    // // Validate required fields
    // if (!phoneNo) {
    //   return res.status(400).json({ ok: false, message: "phoneNo is required" });
    // }


    if (!email && !phoneNo) {
      return res.status(400).json({
        ok: false,
        message: "Either email or phoneNo is required"
      });
    }

    if (phoneNo && !isValidPhone(phoneNo)) {
      return res.status(400).json({ message: "Invalid phone number format", ok: false });
    }

    // 2. Validate formats (assuming you have these helpers)
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format", ok: false });
    }

    if (!userName || !password) {
      return res.status(400).json({ ok: false, message: "userName, password are required" });
    }

    // Check for existing platform admin if isPlatformAdmin = true
    if (isPlatformAdmin) {
      const existingAdmin = await UserModel.findOne({ isPlatformAdmin: true });

      if (existingAdmin) {
        return res.status(400).json({ message: "Only one platform admin is allowed", ok: false });
      }
    }


    // const filter = {
    //   $or: [{ email: email }, { phoneNo: phoneNo }]
    // }
    // const isDuplicate = await UserModel.findOne(filter);

    const duplicateConditions = [];

    if (email) {
      duplicateConditions.push({ email });
    }

    if (phoneNo) {
      duplicateConditions.push({ phoneNo });
    }

    const isDuplicate = await UserModel.findOne({
      $or: duplicateConditions
    });

    if (isDuplicate) {
      return res.status(400).json({ message: "Email or phoneno is already in use", ok: false });
    }


    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Normalize role to lowercase for checking
    // const isTeacher = role.toLowerCase() === "teacher";
    // Prepare user data
    const userData = {
      userName,
      password: hashedPassword,
      role: role,
      // phoneNo,
      // email,

      ...(phoneNo && { phoneNo }),
      ...(email && { email }),

      // ...(isPlatformAdmin ? { isPlatformAdmin: true } : {}) // only store if true
    };

    const newUser = await UserModel.create(userData)


    const userResponse: any = newUser.toObject();
    delete userResponse.password;


    // console.log("newuser", newUser)

    // if (req && req?.user) {
    //   await createAuditLog(req, {
    //     action: "create",
    //     module: "user",
    //     targetId: newUser._id,
    //     description: `user created (${newUser._id})`,
    //     status: "success"
    //   });

    // }




    return res.status(201).json({
      message: "User created successfully",
      user: newUser,
      ok: true
    });
  } catch (err: any) {
    console.error(err);
    if (err.code === 11000) {
      // duplicate key error
      return res.status(400).json({ message: "duplicate data, please use different email or phone Number", ok: false });
    }
    res.status(500).json({ ok: false, message: "Server error", error: err?.message });
  }
};



export const loginUser = async (req: RoleBasedRequest, res: Response) => {
  try {
    let { identifier, password } = req.body;

    // Trim whitespace from identifier (email/phone) and password
    identifier = identifier?.trim();
    password = password?.trim();

    if (!identifier || !password) {
      return res.status(400).json({ ok: false, message: "Email/PhoneNo and and password are required" });
    }

    // Find user by email OR phoneNo
    const user = await UserModel.findOne({
      $or: [
        { email: identifier },
        { phoneNo: identifier }
      ]
    })



    // const user = await UserModel.findOne({ phoneNo })
    if (!user) {
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        _id: user._id, role: user?.role || null, userName: user?.userName,
        email: user.email, phoneNo: user.phoneNo,
        // isPlatformAdmin: user?.isPlatformAdmin || false, schoolId: user.schoolId?._id
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 🚩 THE UPGRADE: Set the HttpOnly Cookie
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true, // Prevents JavaScript/XSS from reading the cookie
      secure: isProduction, // Must be true in production (requires HTTPS)
      sameSite: isProduction ? "none" : "lax", // Cross-origin handling
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    // Send token in headers and also in body
    res.setHeader("Authorization", `Bearer ${token}`);
    return res.status(200).json({
      ok: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        userName: user.userName,
        email: user.email,
        phoneNo: user.phoneNo,
        role: user.role,
        // isPlatformAdmin: user.isPlatformAdmin || false,
        profileImage: user.profileImage,
      }
    });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error", error: err?.message });
  }
};

// --------------------- LOGOUT ---------------------
// Note: JWT cannot truly be invalidated without storing blacklist or changing secret.
// So logout is usually handled on client by deleting the token.
export const logoutUser = async (req: RoleBasedRequest, res: Response) => {
  try {

    // 🚩 THE UPGRADE: Instruct the browser to delete the cookie
    const isProduction = process.env.NODE_ENV === "production";

    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    // If you want, you can also tell the frontend to delete the token
    return res.status(200).json({
      ok: true,
      message: "Logout successful, token invalidated on client"
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};




export const isAuthenticated = async (req: RoleBasedRequest, res: Response) => {
  try {
    const user = req?.user; // populated by auth middleware

    if (!user?._id) {
      return res.status(404).json({ ok: false, message: "User id not found" });
    }

    const isExist = await UserModel.findById(user._id)

    if (!isExist) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    const data = {
      _id: isExist._id,
      role: isExist?.role || null,
      email: isExist.email,
      // schoolId: isExist.schoolId,
      phoneNo: isExist.phoneNo,
      userName: isExist.userName,
      isAuthenticated: true,
      profileImage: isExist.profileImage,
      // isPlatformAdmin: isExist?.isPlatformAdmin || false,
    };


    res.status(200).json({
      ok: true,
      message: "User is authenticated",
      data
    });

  } catch (error: any) {
    console.error("Error in isAuthenticated:", error);
    res.status(500).json({
      ok: false,
      message: "Internal server error",
      errorMessage: error instanceof Error ? error.message : error
    });
  }
};




export const deleteUser = async (req: RoleBasedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(404).json({ ok: false, message: "User id not found" });
    }

    // const isPA = await UserModel.findById(id);


    // if (isPA?.isPlatformAdmin) {
    //   return res.status(404).json({ ok: false, message: "Platform admin cannot be deleted" });
    // }

    const isExist = await UserModel.findByIdAndDelete(id);



    if (!isExist) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    // if (isExist?.schoolId) {
    //   await archiveData({
    //     schoolId: isExist.schoolId,
    //     category: "user",
    //     originalId: isExist._id,
    //     deletedData: isExist.toObject(), // Convert Mongoose doc to plain object
    //     deletedBy: req.user!._id || null,
    //     reason: null, // Optional reason from body
    //   });
    // }

    // await createAuditLog(req, {
    //   action: "delete",
    //   module: "user",
    //   targetId: isExist._id,
    //   description: `user deleted (${isExist._id})`,
    //   status: "success"
    // });

    return res.status(201).json({
      message: "User deleted successfully",
      user: isExist,
      ok: true
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error", error: err?.message });
  }
};


export const updateUser = async (req: RoleBasedRequest, res: Response) => {
  try {
    const { id } = req.params;
    let { email, phoneNo, userName } = req.body;

    // 1. Sanitize Inputs
    email = email?.trim();
    phoneNo = phoneNo?.trim();
    userName = userName?.trim();

    // 2. Validation
    if (phoneNo && phoneNo.length !== 10) {
      return res.status(400).json({ ok: false, message: "phoneNo should be 10 digits" });
    }


    if (phoneNo && !isValidPhone(phoneNo)) {
      return res.status(400).json({ message: "Invalid phone number format", ok: false });
    }

    // 2. Validate formats (assuming you have these helpers)
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format", ok: false });
    }

    // 3. Build Update Object (Strict Whitelisting)
    // We strictly only allow these three fields. 
    // If the user sends 'role' or 'password', it is ignored here.
    const updates: any = {};
    if (email) updates.email = email;
    if (phoneNo) updates.phoneNo = phoneNo;
    if (userName) updates.userName = userName;

    // If payload is empty or contains only invalid fields
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ ok: false, message: "No valid fields provided for update" });
    }

    // 4. Check for Conflicts (Uniqueness)
    // We need to check if email or phone exists in ANOTHER user document.
    const conflictChecks = [];
    if (email) conflictChecks.push({ email });
    if (phoneNo) conflictChecks.push({ phoneNo });

    // Only run query if we are updating email or phone
    if (conflictChecks.length > 0) {
      const duplicate = await UserModel.findOne({
        _id: { $ne: id }, // IMPORTANT: Exclude the current user from the check
        $or: conflictChecks
      });

      if (duplicate) {
        if (duplicate.email === email) {
          return res.status(400).json({ message: "Email is already in use by another user", ok: false });
        }
        if (duplicate.phoneNo === phoneNo) {
          return res.status(400).json({ message: "Phone number is already in use by another user", ok: false });
        }
      }
    }

    // 5. Perform Update
    const updatedUser = await UserModel.findByIdAndUpdate(id, updates, {
      new: true, // Return the updated document
      runValidators: true
    }).select("-password"); // Do not return the password

    if (!updatedUser) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    // await createAuditLog(req, {
    //   action: "edit",
    //   module: "user",
    //   targetId: updatedUser._id,
    //   description: `user edit (${updatedUser._id})`,
    //   status: "success"
    // });

    return res.status(200).json({
      ok: true,
      message: "User updated successfully",
      user: updatedUser,
    });

  } catch (err: any) {
    console.error("Error updating user:", err);
    // Handle Mongoose duplicate key error (fallback)
    if (err.code === 11000) {
      return res.status(400).json({ message: "Duplicate field value entered", ok: false });
    }
    return res.status(500).json({ ok: false, message: "Server error", error: err.message });
  }
};


export const updateProfileImg = async (req: RoleBasedRequest, res: Response) => {
  try {


    const { id } = req.params
    const file = req.file; // From Multer

    if (!id) {
      return res.status(404).json({ ok: false, message: "User id not found" });

    }

    let uploadedImage = null;
    if (file) {
      const uploadedData = await uploadFileToS3(file);
      // const type = file.mimetype.startsWith("image") ? "image" : "pdf";

      uploadedImage = {
        url: uploadedData.url,
        key: uploadedData.key,
        type: "image" as const,
        originalName: file.originalname,
        uploadedAt: new Date()
      };
    }


    const user = await UserModel.findById(id)
    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    user.profileImage = uploadedImage
    await user.save();


    // await createAuditLog(req, {
    //   action: "update",
    //   module: "user",
    //   targetId: user._id,
    //   description: `user updated profile image (${user._id})`,
    //   status: "success"
    // });


    return res.status(201).json({
      message: "User profile updated successfully",
      data: user,
      ok: true
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, message: "error in uploading the profile image", error: err?.message });
  }
}

// ==========================================
// 1. REQUEST PASSWORD RESET (Sends Email)
// ==========================================
export const requestPasswordReset = async (req: RoleBasedRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });

    // SECURITY: We return a success message even if the user doesn't exist 
    // to prevent malicious actors from guessing valid emails in your system.
    if (!user) {
      return res.status(200).json({
        ok: true,
        message: "If an account with that email exists, a password reset link has been sent."
      });
    }

    // SECURITY: Create a dynamic secret using the user's CURRENT password hash.
    // If the password changes, this secret changes, instantly invalidating the token.
    const secret = process.env.JWT_SECRET + user.password;

    // Token expires in 15 minutes
    const token = jwt.sign({ email: user.email, id: user._id }, secret, { expiresIn: "15m" });

    // Construct the frontend reset URL
    const resetLink = `${process.env.ADMIN_FRONTEND_URL}/reset-password/${user._id}/${token}`;

    // Professional Email Template
    const mailOptions = {
      from: `"buildmyschool" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Request",
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #1e293b; margin: 0;">Password Reset Request</h2>
                    </div>
                    <div style="color: #475569; font-size: 16px; line-height: 1.6;">
                        <p>Hello ${user.userName},</p>
                        <p>We received a request to reset the password for your account. This link is valid for exactly <strong>15 minutes</strong>.</p>
                        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                        
                        <div style="text-align: center; margin: 40px 0;">
                            <a href="${resetLink}" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                                Reset Your Password
                            </a>
                        </div>
                        
                        <p style="font-size: 14px;">Or copy and paste this link into your browser:</p>
                        <p style="font-size: 14px; word-break: break-all; color: #3b82f6;">
                            <a href="${resetLink}">${resetLink}</a>
                        </p>
                    </div>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                    <div style="text-align: center; color: #94a3b8; font-size: 12px;">
                        <p>This is an automated message, please do not reply.</p>
                        <p>&copy; ${new Date().getFullYear()} School Management System</p>
                    </div>
                </div>
            `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      ok:true,
      message: "If an account with that email exists, a password reset link has been sent."
    });

  } catch (error: any) {
    console.error("Password reset request error:", error);
    return res.status(500).json({ message: "An error occurred while processing your request." , error: error.message});
  }
};

// ==========================================
// 2. EXECUTE PASSWORD RESET
// ==========================================
export const resetPassword = async (req: RoleBasedRequest, res: Response) => {
  try {
    const { id, token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Both password fields are required." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired link." });
    }

    // Reconstruct the dynamic secret
    const secret = process.env.JWT_SECRET + user.password;

    try {
      // Verify the token. If the password was changed, the secret is different, and this throws an error.
      jwt.verify(token, secret);
    } catch (error) {
      return res.status(400).json({ message: "Invalid or expired link. Please request a new password reset." });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ ok:true, message: "Password has been successfully reset. You can now log in." });

  } catch (error: any) {
    console.error("Password reset execution error:", error);
    return res.status(500).json({ message: "An error occurred while resetting your password.", error: error.message});
  }
};




export const assignRolesToUser = async (req: RoleBasedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    let { role } = req.body;

    // console.log("getting called 22222222222")


    if (!userId) {
      return res.status(400).json({ ok: false, message: "userId is missing" });
    }


    const allowedRoles = ["correspondent", "teacher", "principal", "viceprincipal", "administrator", "parent", "accountant"]

    // console.log("allowedRoles", allowedRoles)
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ ok: false, message: `22222  role not allowed, only ${allowedRoles.join(", ")} are allowed` });

    }


    // 5. Perform Update
    const updatedUser = await UserModel.findByIdAndUpdate(userId, { role: role }, {
      new: true, // Return the updated document
      runValidators: true
    }).select("-password"); // Do not return the password

    if (!updatedUser) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    // await createAuditLog(req, {
    //   action: "edit",
    //   module: "user",
    //   targetId: updatedUser._id,
    //   description: `${role} assinged to user  (${updatedUser._id})`,
    //   status: "success"
    // });

    return res.status(200).json({
      ok: true,
      message: "User role updated successfully",
      user: updatedUser,
    });

  } catch (err: any) {
    console.error("Error updating user:", err);

    return res.status(500).json({ ok: false, message: "Server error", error: err.message });
  }
};