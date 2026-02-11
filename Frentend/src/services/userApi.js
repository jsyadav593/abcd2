// export async function fetchOrganizations() {
//   try {
//     const res = await fetch(`/api/organizations`);
//     if (!res.ok) throw new Error('Failed to fetch organizations');
//     const json = await res.json();
//     return json?.data || [];
//   } catch (e) {
//     console.error('Fetch organizations error:', e);
//     return [];
//   }
// }

export async function fetchUsers(page = 1, limit = 100) {
  try {
    const res = await fetch(`/api/users?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error('Network error');
    const json = await res.json();
    // console.log('API Response:', json);
    
    // backend returns { statusCode: 200, data: { users: [...], pagination: {...} } }
    if (json?.data?.users && Array.isArray(json.data.users)) {
      // Map response data to table format
      return json.data.users.map(u => ({
        ...u,
        status: u.isActive ? 'Active' : 'Inactive',
        remarks: u.remarks || '',
      }));
    }
    return [];
  } catch (e) {
    console.error('fetchUsers error:', e);
    return [];
  }
}

export async function disableUser(id) {
  try {
    // Disable user using dedicated endpoints for better scalability
    // Step 1: Deactivate user (isActive: false)
    const deactivateRes = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    });

    if (!deactivateRes.ok) throw new Error('Failed to deactivate user');

    // Step 2: Revoke login capability (canLogin: false)
    const revokeRes = await fetch(`/api/users/${id}/toggle-login`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canLogin: false }),
    });

    if (!revokeRes.ok) throw new Error('Failed to revoke login');

    const json = await revokeRes.json();
    return json?.data || json;
  } catch (e) {
    console.error('disableUser error:', e);
    throw e;
  }
}

export async function enableUser(id) {
  try {
    // Enable user: only set isActive: true (keep canLogin as is)
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true }),
    });

    if (!res.ok) throw new Error('Enable failed');
    const json = await res.json();
    return json?.data || json;
  } catch (e) {
    console.error('enableUser error:', e);
    throw e;
  }
}

export async function addUser(user) {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error('Failed to create user');
    return res.json();
  } catch (e) {
    console.error('Add user failed', e);
    throw e;
  }
}

export async function fetchUserById(id) {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error('Failed to fetch user');
    const json = await res.json();
    // Backend returns { statusCode: 200, data: user }
    return json?.data || json;
  } catch (e) {
    console.error('Fetch user failed', e);
    throw e;
  }
}

export async function updateUser(id, user) {
  try {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
  } catch (e) {
    console.error('Update user failed', e);
    throw e;
  }
}

// ==================== User State Management ====================

// Toggle user login capability
export async function toggleCanLogin(id, canLogin) {
  try {
    const res = await fetch(`/api/users/${id}/toggle-login`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canLogin }),
    });
    if (!res.ok) throw new Error('Failed to toggle login');
    const json = await res.json();
    return json?.data || json;
  } catch (e) {
    console.error('toggleCanLogin error:', e);
    throw e;
  }
}

// Block user
export async function blockUser(id) {
  try {
    const res = await fetch(`/api/users/${id}/block-unblock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBlocked: true }),
    });
    if (!res.ok) throw new Error('Failed to block user');
    const json = await res.json();
    return json?.data || json;
  } catch (e) {
    console.error('blockUser error:', e);
    throw e;
  }
}

// Unblock user
export async function unblockUser(id) {
  try {
    const res = await fetch(`/api/users/${id}/block-unblock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBlocked: false }),
    });
    if (!res.ok) throw new Error('Failed to unblock user');
    const json = await res.json();
    return json?.data || json;
  } catch (e) {
    console.error('unblockUser error:', e);
    throw e;
  }
}

// ==================== User Filtering ====================

// Get users by organization
export async function getUsersByOrganization(organizationId, page = 1, limit = 10) {
  try {
    const res = await fetch(`/api/users/org/${organizationId}?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch users by organization');
    const json = await res.json();
    
    if (json?.data?.users && Array.isArray(json.data.users)) {
      return {
        users: json.data.users.map(u => ({
          ...u,
          status: u.isActive ? 'Active' : 'Inactive',
        })),
        pagination: json.data.pagination,
      };
    }
    return { users: [], pagination: {} };
  } catch (e) {
    console.error('getUsersByOrganization error:', e);
    throw e;
  }
}

// Get users by role
export async function getUsersByRole(role, organizationId = '', page = 1, limit = 10) {
  try {
    const query = new URLSearchParams({
      page,
      limit,
    });
    if (organizationId) {
      query.append('organizationId', organizationId);
    }
    
    const res = await fetch(`/api/users/role/${role}?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch users by role');
    const json = await res.json();
    
    if (json?.data?.users && Array.isArray(json.data.users)) {
      return {
        users: json.data.users.map(u => ({
          ...u,
          status: u.isActive ? 'Active' : 'Inactive',
        })),
        pagination: json.data.pagination,
      };
    }
    return { users: [], pagination: {} };
  } catch (e) {
    console.error('getUsersByRole error:', e);
    throw e;
  }
}

// Get user statistics
export async function getUserStats() {
  try {
    const res = await fetch('/api/users/stats/all');
    if (!res.ok) throw new Error('Failed to fetch user statistics');
    const json = await res.json();
    return json?.data || {};
  } catch (e) {
    console.error('getUserStats error:', e);
    throw e;
  }
}
