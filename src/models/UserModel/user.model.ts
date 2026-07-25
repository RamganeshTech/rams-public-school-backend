import mongoose, { Schema, Document, Types, model } from "mongoose";

export interface IUserAssignment {
  _id?: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId | null;
}

// 1. Reusable Upload Interface
export interface IUpload {
  type: "image";
  key?: string;
  url?: string;
  originalName?: string;
  uploadedAt: Date;
}


export type IRole =  "staff" | "admin" | "owner" | null;

export interface IUser extends Document {
  email?: string;
  userName: string;
  password: string;
  role: IRole
  phoneNo?: string;
  profileImage: IUpload | null
  createdAt: Date;
  updatedAt: Date;
}

const uploadSchema = new Schema<IUpload>({
  type: { type: String, enum: ["image"] },
  key: { type: String, },
  url: { type: String, },
  originalName: String,
  uploadedAt: { type: Date, default: new Date() }
});

const userSchema = new Schema<IUser>(
  {
    email: { type: String, default: ""},
    userName: { type: String, required: true },
    password: { type: String, required: true },

    role: {
      type: String,
      // required: true, 
      // enum: ["correspondent", "teacher", "principal", "viceprincipal", "administrator", "parent", "accountant", null]
    },
    phoneNo: { type: String,  default: "" },
    profileImage: {
      type: uploadSchema, default: null
    },
  },
  { timestamps: true }
);

const UserModel = model("UserModel", userSchema);

export default UserModel;
