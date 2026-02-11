import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema(
  {
    // Permission ka naam aur unique code
    name: {
      type: String,
      required: [true, 'Permission name required'],
      trim: true,
      example: 'Create User'
    },
    code: {
      type: String,
      required: [true, 'Permission code required'],
      unique: true,
      uppercase: true,
      example: 'USER_CREATE'
    },

    // Module (Kaun sa feature/module mein ye permission hai)
    module: {
      type: String,
      enum: ['Users', 'Assets', 'Reports', 'Organization', 'Settings', 'Audit', 'Department'],
      required: true
    },

    // Action type
    action: {
      type: String,
      enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'DISABLE', 'ASSIGN', 'EXPORT', 'MANAGE'],
      required: true
    },

    // Description - kya ye permission karta hai
    description: {
      type: String,
      trim: true
    },

    // Is ye permission active hai ya nahi
    isActive: {
      type: Boolean,
      default: true
    },

    // Categories for grouping
    category: {
      type: String,
      enum: ['VIEW', 'CREATE', 'MODIFY', 'DELETE', 'ADMIN'],
      default: 'VIEW'
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
permissionSchema.index({ code: 1 });
permissionSchema.index({ module: 1 });
permissionSchema.index({ action: 1 });

export const Permission = mongoose.model('Permission', permissionSchema);
