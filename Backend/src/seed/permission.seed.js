import { Role } from '../models/role.model.js';
import { Permission } from '../models/permission.model.js';

/**
 * Seed data - Pre-defined roles and permissions for the system
 * Run this once to setup initial roles
 */

// ============================================================================
// 1. PERMISSIONS - Sabhi permissions define karo
// ============================================================================

const ALL_PERMISSIONS = [
  // USER MANAGEMENT
  { name: 'Create User', code: 'USER_CREATE', module: 'Users', action: 'CREATE', category: 'CREATE' },
  { name: 'View Users', code: 'USER_READ', module: 'Users', action: 'READ', category: 'VIEW' },
  { name: 'Update User', code: 'USER_UPDATE', module: 'Users', action: 'UPDATE', category: 'MODIFY' },
  { name: 'Delete User', code: 'USER_DELETE', module: 'Users', action: 'DELETE', category: 'DELETE' },
  { name: 'Disable User', code: 'USER_DISABLE', module: 'Users', action: 'DISABLE', category: 'MODIFY' },
  { name: 'Manage Permissions', code: 'USER_PERMISSIONS', module: 'Users', action: 'MANAGE', category: 'ADMIN' },

  // ASSET MANAGEMENT
  { name: 'Create Asset', code: 'ASSET_CREATE', module: 'Assets', action: 'CREATE', category: 'CREATE' },
  { name: 'View Assets', code: 'ASSET_READ', module: 'Assets', action: 'READ', category: 'VIEW' },
  { name: 'Update Asset', code: 'ASSET_UPDATE', module: 'Assets', action: 'UPDATE', category: 'MODIFY' },
  { name: 'Delete Asset', code: 'ASSET_DELETE', module: 'Assets', action: 'DELETE', category: 'DELETE' },
  { name: 'Assign Asset', code: 'ASSET_ASSIGN', module: 'Assets', action: 'ASSIGN', category: 'MODIFY' },
  { name: 'Export Assets', code: 'ASSET_EXPORT', module: 'Assets', action: 'EXPORT', category: 'VIEW' },

  // REPORTS
  { name: 'View Reports', code: 'REPORT_VIEW', module: 'Reports', action: 'READ', category: 'VIEW' },
  { name: 'Generate Reports', code: 'REPORT_GENERATE', module: 'Reports', action: 'CREATE', category: 'CREATE' },
  { name: 'Export Reports', code: 'REPORT_EXPORT', module: 'Reports', action: 'EXPORT', category: 'VIEW' },

  // ORGANIZATION SETTINGS
  { name: 'Manage Organization', code: 'ORG_MANAGE', module: 'Organization', action: 'MANAGE', category: 'ADMIN' },
  { name: 'View Organization', code: 'ORG_READ', module: 'Organization', action: 'READ', category: 'VIEW' },

  // DEPARTMENT MANAGEMENT
  { name: 'Create Department', code: 'DEPT_CREATE', module: 'Department', action: 'CREATE', category: 'CREATE' },
  { name: 'Manage Department', code: 'DEPT_MANAGE', module: 'Department', action: 'MANAGE', category: 'ADMIN' },

  // AUDIT & SETTINGS
  { name: 'View Audit Trail', code: 'AUDIT_VIEW', module: 'Audit', action: 'READ', category: 'VIEW' },
  { name: 'Manage Settings', code: 'SETTINGS_MANAGE', module: 'Settings', action: 'MANAGE', category: 'ADMIN' },
];

// ============================================================================
// 2. ROLES - Roles with their permissions
// ============================================================================

const ROLE_DEFINITIONS = [
  {
    // Level 5 - TOPMOST POWER
    name: 'Enterprise Admin',
    code: 'ROLE_ENTERPRISE_ADMIN',
    level: 5,
    description: 'Full system access. Can manage everything across all organizations.',
    isSystemRole: true,
    scope: 'SYSTEM',
    permissions: [
      'USER_CREATE', 'USER_READ', 'USER_UPDATE', 'USER_DELETE', 'USER_DISABLE', 'USER_PERMISSIONS',
      'ASSET_CREATE', 'ASSET_READ', 'ASSET_UPDATE', 'ASSET_DELETE', 'ASSET_ASSIGN', 'ASSET_EXPORT',
      'REPORT_VIEW', 'REPORT_GENERATE', 'REPORT_EXPORT',
      'ORG_MANAGE', 'ORG_READ',
      'DEPT_CREATE', 'DEPT_MANAGE',
      'AUDIT_VIEW',
      'SETTINGS_MANAGE'
    ]
  },

  {
    // Level 4 - SUPER ADMIN
    name: 'Super Admin',
    code: 'ROLE_SUPER_ADMIN',
    level: 4,
    description: 'Can manage users, assets, and reports within organization. Cannot manage settings.',
    isSystemRole: true,
    scope: 'ORGANIZATION',
    permissions: [
      'USER_CREATE', 'USER_READ', 'USER_UPDATE', 'USER_DISABLE', 'USER_PERMISSIONS',
      'ASSET_CREATE', 'ASSET_READ', 'ASSET_UPDATE', 'ASSET_ASSIGN', 'ASSET_EXPORT',
      'REPORT_VIEW', 'REPORT_GENERATE', 'REPORT_EXPORT',
      'ORG_READ',
      'DEPT_CREATE', 'DEPT_MANAGE',
      'AUDIT_VIEW'
    ]
  },

  {
    // Level 3 - ADMIN
    name: 'Admin',
    code: 'ROLE_ADMIN',
    level: 3,
    description: 'Can manage users and assets within their department/branch.',
    isSystemRole: true,
    scope: 'DEPARTMENT',
    permissions: [
      'USER_CREATE', 'USER_READ', 'USER_UPDATE', 'USER_DISABLE',
      'ASSET_CREATE', 'ASSET_READ', 'ASSET_UPDATE', 'ASSET_ASSIGN',
      'REPORT_VIEW', 'REPORT_GENERATE',
      'ORG_READ',
      'DEPT_MANAGE',
      'AUDIT_VIEW'
    ]
  },

  {
    // Level 2 - BRANCH ADMIN / MANAGER
    name: 'Branch Admin',
    code: 'ROLE_BRANCH_ADMIN',
    level: 2,
    description: 'Can view and assign assets only within their branch.',
    isSystemRole: true,
    scope: 'BRANCH',
    permissions: [
      'USER_READ',
      'ASSET_READ', 'ASSET_ASSIGN',
      'REPORT_VIEW',
      'ORG_READ'
    ]
  },

  {
    // Level 1 - REGULAR USER
    name: 'User',
    code: 'ROLE_USER',
    level: 1,
    description: 'Can only view assets assigned to them.',
    isSystemRole: true,
    scope: 'BRANCH',
    permissions: [
      'ASSET_READ',
      'REPORT_VIEW'
    ]
  }
];

// ============================================================================
// 3. SEEDING FUNCTION
// ============================================================================

export const seedPermissionsAndRoles = async () => {
  try {
    console.log('🌱 Starting permission and role seeding...');

    // 1. Create all permissions
    console.log('📝 Creating permissions...');
    for (const permData of ALL_PERMISSIONS) {
      const exists = await Permission.findOne({ code: permData.code });
      if (!exists) {
        await Permission.create(permData);
        console.log(`✅ Created permission: ${permData.code}`);
      }
    }

    // 2. Create all roles
    console.log('👥 Creating roles...');
    for (const roleData of ROLE_DEFINITIONS) {
      const exists = await Role.findOne({ code: roleData.code });
      if (!exists) {
        await Role.create(roleData);
        console.log(`✅ Created role: ${roleData.code}`);
      }
    }

    console.log('✨ Seeding completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

// ============================================================================
// 4. UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all permissions for a specific role
 */
export const getPermissionsForRole = (roleCode) => {
  const role = ROLE_DEFINITIONS.find(r => r.code === roleCode);
  return role?.permissions || [];
};

/**
 * Get role information
 */
export const getRoleInfo = (roleCode) => {
  return ROLE_DEFINITIONS.find(r => r.code === roleCode);
};

/**
 * Check if user (by role) can perform action
 */
export const canUserPerform = (roleCode, permissionCode) => {
  const role = ROLE_DEFINITIONS.find(r => r.code === roleCode);
  return role?.permissions?.includes(permissionCode) || false;
};

/**
 * Print all roles and permissions (for debugging/documentation)
 */
export const printRoleMatrix = () => {
  console.log('\n📊 ROLE & PERMISSION MATRIX\n');
  console.log('='.repeat(100));

  ROLE_DEFINITIONS.forEach((role) => {
    console.log(`\n🔹 ${role.name} (${role.code})`);
    console.log(`   Level: ${role.level} | Scope: ${role.scope}`);
    console.log(`   Description: ${role.description}`);
    console.log(`   Permissions: ${role.permissions.length}`);
    console.log(`   ├─ ${role.permissions.join('\n   ├─ ')}`);
  });

  console.log('\n' + '='.repeat(100));
  console.log('\nTotal Permissions: ' + ALL_PERMISSIONS.length);
  console.log('Total Roles: ' + ROLE_DEFINITIONS.length);
};
