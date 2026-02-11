import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    // Role ka naam jaise 'Enterprise Admin', 'Branch Manager'
    name: {
      type: String,
      required: [true, 'Role name required'],
      trim: true,
      unique: true,
      example: 'Enterprise Admin'
    },

    // Role ka unique code
    code: {
      type: String,
      required: [true, 'Role code required'],
      unique: true,
      uppercase: true,
      example: 'ROLE_ENTERPRISE_ADMIN'
    },

    // Is role kis organization mein available hai
    // (null matlab system-wide role hai)
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null
    },

    // Role hierarchy level (5 = topmost power, 1 = lowest power)
    // Purpose: Ek admin apne se lower level ka role hi create kar sakta hai
    level: {
      type: Number,
      enum: [1, 2, 3, 4, 5], // 1=User, 2=BranchAdmin, 3=Admin, 4=SuperAdmin, 5=EnterpriseAdmin
      required: true,
      default: 1
    },

    // Permissions codes ki array (Permission model ke code se reference)
    permissions: [
      {
        type: String, // Permission code jaise 'USER_CREATE', 'ASSET_DELETE'
        trim: true
      }
    ],

    // Description - ye role ka purpose kya hai
    description: {
      type: String,
      trim: true
    },

    // Ye role system ka default hai ya custom hai
    isSystemRole: {
      type: Boolean,
      default: false,
      // System roles ko modify nahi kar sakte
    },

    // Role active hai ya nahi
    isActive: {
      type: Boolean,
      default: true
    },

    // Scope: organization-wide ya branch-specific
    scope: {
      type: String,
      enum: ['SYSTEM', 'ORGANIZATION', 'DEPARTMENT', 'BRANCH'],
      default: 'ORGANIZATION'
    },

    // Kis user ne ye role create kiya
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
roleSchema.index({ code: 1 });
roleSchema.index({ organizationId: 1 });
roleSchema.index({ level: 1 });

export const Role = mongoose.model('Role', roleSchema);
