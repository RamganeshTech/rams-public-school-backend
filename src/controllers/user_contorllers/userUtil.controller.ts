import type { Request, Response } from "express";
import UserModel, { IRole } from "../../models/UserModel/user.model";

export const getUsers = async (req: Request, res: Response): Promise<any> => {
    try {
        // 1. Get School ID
        // If the user is logged in (Principal/Admin), use their schoolId.
        // If a Platform Admin is querying, they might pass it in query params.
        const role = req.params.role as IRole | "all";

        const allowedRoles: IRole[] = ["principal" , "admin" , "correspondent" , "viceprincipal", "teacher", "accountant" ]

        // 2. Build the Query Object


        if (role === "all") {
            // LOGIC: If "all", find users whose role matches ANY of the allowed roles
            // We use case-insensitive Regex for every role in the list to be safe
            //   const regexRoles = allowedRoles.map(r => new RegExp(`^${r}$`, "i"));

            const users = await UserModel.find()
                .select("-password -__v") // Exclude password and internal version key
                .sort({ userName: 1 });   // Sort alphabetically by name

            return res.status(200).json({
                ok: true,
                count: users.length,
                data: users,
            });


        }



        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ ok: false, message: `role not allowed, only ${allowedRoles.join(", ")} and "all" are allowed` });
        }

        // 2. Query
        const users = await UserModel.find({
            role: role,
        })
            .select("-password -__v") // Exclude password and internal version key
            .sort({ userName: 1 });   // Sort alphabetically by name

        return res.status(200).json({
            ok: true,
            count: users.length,
            data: users,
        });

    } catch (error: any) {
        console.error("Get users Error:", error);
        return res.status(500).json({ ok: false, message: "Internal server error", error: error.message });
    }
};



export const getSingleUser = async (req: Request, res: Response): Promise<any> => {
    try {
        // 1. Get School ID
        // If the user is logged in (Principal/Admin), use their schoolId.
        // If a Platform Admin is querying, they might pass it in query params.
        const userId = req.params.userId



        if (!userId) {
            return res.status(400).json({ ok: false, message: "user ID is required" });
        }


        // 2. Query
        const user = await UserModel.findById(userId)
            .select("-password -__v") // Exclude password and internal version key

        return res.status(200).json({
            ok: true,
            data: user,
        });

    } catch (error: any) {
        console.error("Get user Error:", error);
        return res.status(500).json({ ok: false, message: "Internal server error", error: error.message });
    }
};
