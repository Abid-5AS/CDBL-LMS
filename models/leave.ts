import { Schema, model, models, Types } from "mongoose";

export type ApprovalStep = {
  role: "HR_ADMIN";
  status: "PENDING" | "APPROVED" | "REJECTED";
  decidedById?: string;
  decidedByName?: string;
  decidedAt?: Date;
  comment?: string;
};

const ApprovalSchema = new Schema<ApprovalStep>(
  {
    role: { type: String, enum: ["HR_ADMIN"], required: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    decidedById: { type: String },
    decidedByName: { type: String },
    decidedAt: { type: Date },
    comment: { type: String },
  },
  { _id: false }
);

const LeaveSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["EL", "CL", "ML", "EWP", "EWO", "MAT", "PAT"],
      required: true,
    },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    requestedDays: { type: Number, required: true },
    reason: { type: String, required: true },
    certificate: { type: Boolean, default: false },
    requestedByName: { type: String, required: true },
    requestedByEmail: { type: String, required: true },
    requestedById: { type: Types.ObjectId, ref: "User", required: true },
    approvals: { type: [ApprovalSchema], default: [] },
    currentStageIndex: { type: Number, default: 0 },
    approverStage: {
      type: String,
      enum: ["HR_ADMIN", "COMPLETED"],
      default: "HR_ADMIN",
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    timeline: [
      {
        by: { type: Schema.Types.ObjectId, ref: "User" },
        role: { type: String },
        action: { type: String },
        at: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  { timestamps: true }
);

LeaveSchema.index({ requestedById: 1, createdAt: -1 });

LeaveSchema.statics.workflowRoles = function () {
  return ["HR_ADMIN"];
};

export const Leave = models.Leave || model("Leave", LeaveSchema);
