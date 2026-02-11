import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      default:"NA",
      trim: true,
    },
    department: {
      type: String,
      default:"NA",
      trim: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      note: 'Link to department for scope-based access'
    },

    email: {
      type: String,
    //   required: true,
      trim: true,
    },

    phone_no: {
      type: Number,
      trim: true,
      length: 10,
    },

    role: {
      type: String,
      enum: ["enterprise_admin","super_admin", "admin", "user"],
      required: true,
      default:"user",
    },

    // NEW: Role-based permission system (Enterprise feature)
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      default: null,
      note: 'Link to new Role model for granular permissions'
    },

    canLogin:{
      type:Boolean,
      default:false
    },

    permissions: [String],

    reportingTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    branchId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "School",
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
