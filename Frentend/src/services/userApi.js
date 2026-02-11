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
    // Use DELETE endpoint which performs soft delete (sets isActive: false)
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) throw new Error('Disable failed');
    return res.json();
  } catch (e) {
    console.error('disableUser error:', e);
    throw e;
  }
}

export async function enableUser(id) {
  try {
    // Use PATCH to set isActive: true
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true }),
    });

    if (!res.ok) throw new Error('Enable failed');
    return res.json();
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
    const json = await res.json();
    // Backend returns { statusCode: 201, data: user }
    return json?.data || json;
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
    const json = await res.json();
    // Backend returns { statusCode: 200, data: user }
    return json?.data || json;
  } catch (e) {
    console.error('Update user failed', e);
    throw e;
  }
}
