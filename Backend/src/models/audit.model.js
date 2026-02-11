import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const auditSchema = new mongoose.Schema(
  {
    // User who performed the action
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Action performed (CREATE, UPDATE, DELETE, DISABLE, ENABLE, etc.)
    action: {
      type: String,
      enum: [
        'USER_CREATED',
        'USER_UPDATED',
        'USER_DELETED',
        'USER_DISABLED',
        'USER_ENABLED',
        'USER_LOGIN_TOGGLED',
        'USER_BLOCKED',
        'USER_UNBLOCKED',
        'PERMISSION_UPDATED',
        'BULK_ACTION',
      ],
      required: true,
    },

    // Resource type (User, Permission, Role, etc.)
    resourceType: {
      type: String,
      enum: ['User', 'Permission', 'Role', 'Organization', 'Branch'],
      required: true,
    },

    // ID of the resource being modified
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // What changed
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },

    // IP address for audit trail
    ipAddress: String,

    // User agent for audit trail
    userAgent: String,

    // Status of the operation
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
    },

    // Error message if failed
    errorMessage: String,

    // Organization context
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },

    // Additional metadata
    metadata: mongoose.Schema.Types.Mixed,

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
auditSchema.index({ userId: 1, timestamp: -1 });
auditSchema.index({ resourceType: 1, resourceId: 1 });
auditSchema.index({ action: 1, timestamp: -1 });
auditSchema.index({ organizationId: 1, timestamp: -1 });
auditSchema.index({ timestamp: -1 });

export const Audit = mongoose.model('Audit', auditSchema);

/**
 * Create audit log entry
 * @param {Object} auditData - Audit log data
 */
export async function createAuditLog(auditData) {
  try {
    const audit = await Audit.create(auditData);
    logger.info('Audit log created', { auditId: audit._id, action: auditData.action });
    return audit;
  } catch (error) {
    logger.error('Failed to create audit log', { error: error.message });
    // Don't throw - audit logging failure shouldn't break main operation
  }
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(filters = {}, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const logs = await Audit.find(filters)
    .populate('userId', 'name email')
    .skip(skip)
    .limit(limit)
    .sort({ timestamp: -1 });

  const total = await Audit.countDocuments(filters);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}
