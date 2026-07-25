import express from 'express'
// import { assignRolesToUser, createUser, deleteUser, isAuthenticated, loginUser, logoutUser, updateUser, getParentStudents, createUserV1, requestPasswordReset, resetPassword, updateProfileImg } from '../../../controllers/New_Controllers/user_contorllers/user.controllers';
import { parseFormData } from '../../middleware/upload.middleware';
import { adminReadLimiter } from '../../middleware/rateLimiter.middleware';
import { multiRoleAuth } from '../../middleware/multiRoleRequest';
import { getSingleUser, getUsers } from '../../controllers/user_contorllers/userUtil.controller';
import { assignRolesToUser, deleteUser, isAuthenticated, loginUser, logoutUser, updateUser, createUserV1, requestPasswordReset, resetPassword, updateProfileImg } from '../../controllers/user_contorllers/user.controllers';


const userRoutes = express.Router()

// but this is old , belwo normal '/create' is the new one 
userRoutes.post('/v1/create', adminReadLimiter,
    // multiRoleAuth("owner", "admin", "staff"), 
    createUserV1);

userRoutes.post('/login', adminReadLimiter,loginUser);
userRoutes.post('/logout',adminReadLimiter, logoutUser);
userRoutes.get('/isauthenticated',
    adminReadLimiter,
    multiRoleAuth("owner", "staff",  "admin"),
    isAuthenticated);

userRoutes.delete("/delete/:id",
    adminReadLimiter,
    multiRoleAuth("owner", "admin"),
    deleteUser);

userRoutes.put("/update/:id",
    adminReadLimiter,
    multiRoleAuth("owner", "staff",  "admin"),
    updateUser);


userRoutes.put("/update-profile-img/:id",
    adminReadLimiter,
  parseFormData.single("file"), // Image
    multiRoleAuth("owner", "staff",  "admin"),
    updateProfileImg);

//  new route (in role  if you send the all in the role params , then youll get all the users irrespective of role)
userRoutes.get(
    "/:role",
    adminReadLimiter,
    multiRoleAuth("owner", "staff",  "admin"),
    getUsers
);

userRoutes.get(
    "/get-single/:userId",
    adminReadLimiter,
    multiRoleAuth("owner", "staff",  "admin"),
    getSingleUser
);


userRoutes.put(
    "/assignrole/:userId",
    adminReadLimiter,
    multiRoleAuth("owner", "admin", "staff"),
    assignRolesToUser
);


userRoutes.post("/forgot-password", adminReadLimiter, requestPasswordReset);
userRoutes.post("/reset-password/:id/:token", adminReadLimiter, resetPassword);



export default userRoutes;