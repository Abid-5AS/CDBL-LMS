import { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    role: {
      type: String,
      enum: ["EMPLOYEE", "HR_ADMIN"],
      default: "EMPLOYEE",
    },
  },
  { timestamps: true }
);

export type IUser = {
  _id: string;
  name: string;
  email?: string;
  role: "EMPLOYEE" | "HR_ADMIN";
};

export const User = models.User || model("User", UserSchema);
