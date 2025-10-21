import { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    role: {
      type: String,
      enum: ["employee", "hr_admin", "dept_head", "hr_head", "ceo"],
      default: "employee",
    },
  },
  { timestamps: true }
);

export type IUser = {
  _id: string;
  name: string;
  email?: string;
  role: "employee" | "hr_admin" | "dept_head" | "hr_head" | "ceo";
};

export const User = models.User || model("User", UserSchema);
