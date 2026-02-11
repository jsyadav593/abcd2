export async function fetchUsers() {
  try {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Network error');
    const json = await res.json();
    // assume backend returns { data: { users: [...] } } or array
    if (Array.isArray(json)) return json;
    if (json?.data?.users) return json.data.users;
    if (json?.users) return json.users;
    return [];
  } catch (e) {
    // fallback mock
    return [
      { _id: '1', userId: 'EMP001', name: 'John Admin', designation: 'Manager', department: 'IT', email: 'john@example.com', phone_no: '9999999999', role: 'enterprise_admin', status: 'Active', remarks: '' },
      { _id: '2', userId: 'EMP002', name: 'Jane User', designation: 'Staff', department: 'HR', email: 'jane@example.com', phone_no: '8888888888', role: 'user', status: 'Active', remarks: '' },
      { _id: '3', userId: 'EMP003', name: 'Bob Admin', designation: 'Director', department: 'Finance', email: 'bob@example.com', phone_no: '7777777777', role: 'super_admin', status: 'Active', remarks: '' },
    ];
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
