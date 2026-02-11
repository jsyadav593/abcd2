export async function fetchUsers(page = 1, limit = 100) {
  try {
    const res = await fetch(`/api/users?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error('Network error');
    const json = await res.json();
    console.log('API Response:', json);
    
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

export async function deleteUser(id) {
  try {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    return true;
  } catch (e) {
    // In dev, simulate success
    return true;
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
    return res.json();
  } catch (e) {
    console.error('Fetch user failed', e);
    throw e;
  }
}

export async function updateUser(id, user) {
  try {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
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
