// Get API base URL from environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Helper function to handle API responses
 */
async function handleApiResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));

    // If backend returned validation errors array, include details in the thrown error
    if (error && Array.isArray(error.errors) && error.errors.length > 0) {
      const details = error.errors.map(e => `${e.field}: ${e.message}`).join('; ');
      const msg = `${error.message || 'API request failed'} - ${details}`;
      const err = new Error(msg);
      err.details = error.errors;
      throw err;
    }

    const err = new Error(error.message || 'API request failed');
    err.details = error.errors || null;
    throw err;
  }
  return response.json();
}

export async function fetchUsers(page = 1, limit = 100) {
  try {
    const res = await fetch(`${API_URL}/users?page=${page}&limit=${limit}`);
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

// Fetch all users by paging until no more results
export async function fetchAllUsers(limit = 100) {
  try {
    let page = 1;
    let results = [];

    while (true) {
      const res = await fetch(`${API_URL}/users?page=${page}&limit=${limit}`);
      const json = await handleApiResponse(res);
      const users = json?.data?.users || [];

      // map users to table format
      const mapped = users.map(u => ({
        ...u,
        status: u.isActive ? 'Active' : 'Inactive',
        remarks: u.remarks || '',
      }));

      results.push(...mapped);

      // stop if this was the last page
      if (users.length < limit) break;
      page += 1;
    }

    return results;
  } catch (e) {
    console.error('fetchAllUsers error:', e);
    return [];
  }
}

export async function disableUser(id) {
  try {
    // Disable user using dedicated endpoints for better scalability
    // Step 1: Deactivate user (isActive: false)
    const deactivateRes = await fetch(`${API_URL}/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    });

    if (!deactivateRes.ok) throw new Error('Failed to deactivate user');

    // Step 2: Revoke login capability (canLogin: false)
    const revokeRes = await fetch(`${API_URL}/users/${id}/toggle-login`, {
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
    const res = await fetch(`${API_URL}/users/${id}`, {
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
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    return handleApiResponse(res);
  } catch (e) {
    console.error('Add user failed', e);
    throw e;
  }
}

export async function fetchUserById(id) {
  try {
    const res = await fetch(`${API_URL}/users/${id}`);
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
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    return handleApiResponse(res);
  } catch (e) {
    console.error('Update user failed', e);
    throw e;
  }
}

// ==================== User State Management ====================

// Toggle user login capability
export async function toggleCanLogin(id, canLogin) {
  try {
    const res = await fetch(`${API_URL}/users/${id}/toggle-login`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canLogin }),
    });
    const json = await handleApiResponse(res);
    return json?.data || json;
  } catch (e) {
    console.error('toggleCanLogin error:', e);
    throw e;
  }
}

// Block user
export async function blockUser(id) {
  try {
    const res = await fetch(`${API_URL}/users/${id}/block-unblock`, {
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
    const res = await fetch(`${API_URL}/users/${id}/block-unblock`, {
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
    const res = await fetch(`${API_URL}/users/org/${organizationId}?page=${page}&limit=${limit}`);
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
    
    const res = await fetch(`${API_URL}/users/role/${role}?${query.toString()}`);
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
    const res = await fetch(`${API_URL}/users/stats/all`);
    if (!res.ok) throw new Error('Failed to fetch user statistics');
    const json = await res.json();
    return json?.data || {};
  } catch (e) {
    console.error('getUserStats error:', e);
    throw e;
  }
}
// ==================== Password Reset Functions ====================

/**
 * Request password reset token
 * Step 1 of password reset flow
 * Returns: { resetToken, expiresIn } - token shown only once to user
 */
export async function requestPasswordReset(username) {
  try {
    const res = await fetch(`${API_URL}/password/request-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    return handleApiResponse(res);
  } catch (e) {
    console.error('Request password reset error:', e);
    throw e;
  }
}

/**
 * Verify reset token validity
 * Step 2 of password reset flow (optional but recommended)
 * Checks if token is valid before showing reset form
 */
export async function verifyResetToken(resetToken) {
  try {
    const res = await fetch(`${API_URL}/password/verify-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken }),
    });
    return handleApiResponse(res);
  } catch (e) {
    console.error('Verify reset token error:', e);
    throw e;
  }
}

/**
 * Reset password with new password
 * Step 3 of password reset flow (final step)
 * Requires valid resetToken and matching passwords
 */
export async function resetPassword(resetToken, newPassword, confirmPassword) {
  try {
    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const res = await fetch(`${API_URL}/password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resetToken,
        newPassword,
        confirmPassword,
      }),
    });
    return handleApiResponse(res);
  } catch (e) {
    console.error('Reset password error:', e);
    throw e;
  }
}

/**
 * Check password reset status for a user
 * Checks if user has any pending (unused) reset tokens
 */
export async function getPasswordResetStatus(username) {
  try {
    const res = await fetch(`${API_URL}/password/status?username=${encodeURIComponent(username)}`);
    return handleApiResponse(res);
  } catch (e) {
    console.error('Get password reset status error:', e);
    throw e;
  }
}

// ==================== Login/Logout Functions ====================

/**
 * User Login
 * Authenticates user with username and password
 * Tracks device and returns access/refresh tokens
 * Sets isLoggedIn = true on successful login
 * 
 * Returns: { user, tokens, device, session }
 */
export async function loginUserViaPassword(username, password, deviceInfo = null) {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        deviceInfo,
      }),
    });
    return handleApiResponse(res);
  } catch (e) {
    console.error('Login error:', e);
    throw e;
  }
}

/**
 * User Logout
 * Logs out from a specific device
 * 
 * Logic:
 * - Marks device's last session as logged out
 * - Checks if active sessions remain
 * - If no active sessions, sets isLoggedIn = false
 * - Returns remaining active devices
 * 
 * Returns: { loggedOutDeviceId, isLoggedIn, activeDevices }
 */
export async function logoutUserFromDevice(deviceId, userId) {
  try {
    const res = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        userId,
      }),
    });
    return handleApiResponse(res);
  } catch (e) {
    console.error('Logout error:', e);
    throw e;
  }
}

/**
 * Get Active Sessions
 * Returns all devices user is currently logged in on
 * 
 * Returns: { isLoggedIn, activeSessions, devices[] }
 */
export async function getActiveSessions(userId) {
  try {
    const res = await fetch(`${API_URL}/auth/sessions/${userId}`);
    return handleApiResponse(res);
  } catch (e) {
    console.error('Get active sessions error:', e);
    throw e;
  }
}

/**
 * Logout From All Devices
 * Forces logout from all devices
 * Sets isLoggedIn = false
 * 
 * Returns: { loggedOutDevices[], isLoggedIn: false }
 */
export async function logoutFromAllDevices(userId) {
  try {
    const res = await fetch(`${API_URL}/auth/logout-all/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleApiResponse(res);
  } catch (e) {
    console.error('Logout from all devices error:', e);
    throw e;
  }
}
