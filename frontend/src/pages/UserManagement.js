import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [editingRole, setEditingRole] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users/all');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setEditingRole(userId);

    try {
      await axios.put(`/api/users/${userId}/role`, { role: newRole });
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error updating role');
    } finally {
      setEditingRole(null);
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(userId);

    try {
      await axios.delete(`/api/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error deleting user');
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'role-admin';
      case 'organizer': return 'role-organizer';
      default: return 'role-user';
    }
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-management-page">
      <div className="container">
        <div className="page-header">
          <h1>👥 User Management</h1>
          <p>Manage all users in the system</p>
        </div>

        {users.length === 0 ? (
          <div className="no-users">
            <p>No users found.</p>
          </div>
        ) : (
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>
                      <div className="role-badge-container">
                        <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                          {user.role}
                        </span>
                        {editingRole === user.id ? (
                          <div className="role-select-container">
                            <select
                              defaultValue={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              className="role-select"
                            >
                              <option value="user">user</option>
                              <option value="organizer">organizer</option>
                              <option value="admin">admin</option>
                            </select>
                            <button
                              onClick={() => setEditingRole(null)}
                              className="btn-cancel-edit"
                              style={{ marginLeft: '5px', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              ❌
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingRole(user.id)}
                            className="btn-edit-role"
                            disabled={deletingId === user.id}
                          >
                            ✏️ Edit
                          </button>
                        )}
                      </div>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        className="btn-danger btn-small"
                        disabled={deletingId === user.id}
                      >
                        {deletingId === user.id ? 'Deleting...' : '🗑️ Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;

