import { Schema, models, model, Types } from "mongoose";

const LeaveRequestSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["EL", "CL", "ML", "EWP", "EWO", "MAT", "PAT"],
      required: true,
    },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    requestedDays: { type: Number, required: true }, // inclusive days
    reason: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    requestedByName: { type: String, required: true },
    requestedByEmail: { type: String, required: true },
    requestedById: { type: Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

LeaveRequestSchema.index({ requestedById: 1, createdAt: -1 });

export type ILeaveRequest = {
  _id: string;
  type: "EL" | "CL" | "ML" | "EWP" | "EWO" | "MAT" | "PAT";
  start: Date;
  end: Date;
  requestedDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedByName: string;
  requestedByEmail: string;
  requestedById: string;
  createdAt: Date;
  updatedAt: Date;
};

export const LeaveRequest = models.LeaveRequest || model("LeaveRequest", LeaveRequestSchema);
