import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Table from "../../components/UI/Table/Table.jsx";
import Button from "../../components/UI/Button/Button.jsx";
import { PageLoader } from "../../components/UI/Loader/Loader.jsx";
import { ErrorNotification } from "../../components/ErrorBoundary/index.js";
import "./Users.css";
import { fetchAllUsers, disableUser, enableUser, toggleCanLogin } from "../../services/userApi";
import { exportToCSV } from "../../utils/exportToCSV";

const Users = () => {
  const navigate = useNavigate();

  const [showFilters, setShowFilters] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch all users by paging until complete
        const data = await fetchAllUsers(100);
        setAllUsers(data);
      } catch (error) {
        console.error("Failed to fetch users", error);
        setError(error.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is not on hamburger menu or dropdown
      if (!e.target.closest('.action-menu-container')) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  const handleDisableRow = async (id) => {
    const user = allUsers.find((u) => u._id === id);
    const confirmed = window.confirm(
      `Are you sure you want to disable ${user?.name || 'this user'}?`
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);
      
      // Step 1: If user has canLogin enabled, disable it first
      if (user?.canLogin) {
        await toggleCanLogin(id, false);
      }
      
      // Step 2: Deactivate user (isActive: false)
      await disableUser(id);
      
      setAllUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isActive: false, status: 'Inactive', canLogin: false } : u))
      );
    } catch (err) {
      console.error('Disable failed', err);
      setError(err.message || 'Failed to disable user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLogin = async (id, canLogin) => {
    try {
      setLoading(true);
      setError(null);
      const res = await toggleCanLogin(id, canLogin);

      // Update local state: reflect canLogin and if backend returned login credentials attach them
      setAllUsers((prev) =>
        prev.map((u) =>
          u._id === id
            ? {
                ...u,
                canLogin: canLogin,
                // if backend returned a login object, merge username info
                ...(res?.login ? { loginInfo: res.login } : {}),
              }
            : u,
        ),
      );
    } catch (err) {
      console.error('Toggle login failed', err);
      setError(err.message || 'Failed to toggle login');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableRow = async (id) => {
    const user = allUsers.find((u) => u._id === id);
    const confirmed = window.confirm(
      `Are you sure you want to enable ${user?.name || 'this user'}?`
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);
      // Enable user but keep canLogin as-is (do not force it to true)
      await enableUser(id);
      setAllUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isActive: true, status: 'Active' } : u))
      );
    } catch (err) {
      console.error('Enable failed', err);
      setError(err.message || 'Failed to enable user');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: "User ID",
      key: "userId",
      sortable: true,
      render: (row) => (
        <button
          className="user-link"
          onClick={() => navigate(`/user-detail/${row._id}`)}
          title="View user details"
        >
          {row.userId}
        </button>
      ),
    },
    {
      header: "Full Name",
      key: "name",
      sortable: true,
      render: (row) => (
        <button
          className="user-link"
          onClick={() => navigate(`/user-detail/${row._id}`)}
          title="View user details"
        >
          {row.name}
        </button>
      ),
    },
    { header: "Designation", key: "designation" },
    { header: "Department", key: "department" },
    { header: "Email", key: "email" },
    { header: "Phone no", key: "phone_no" },
    { header: "Role", key: "role" },
    { header: "Status", key: "status" },
    { header: "Remarks", key: "remarks" },
    {
      header: "Actions",
      key: "actions",
      render: (row) => (
        <div className="action-menu-container">
          <button
            className="hamburger-btn"
            onClick={() => setOpenMenuId(openMenuId === row._id ? null : row._id)}
            title="More actions"
          >
            <span className="material-icons">more_vert</span>
          </button>
          
          {openMenuId === row._id && (
            <div className="action-dropdown-menu">
              <button
                className="action-menu-item"
                onClick={() => {
                  navigate(`/edit-user/${row._id}`);
                  setOpenMenuId(null);
                }}
              >
                Edit
              </button>
              {row.canLogin ? (
                <button
                  className="action-menu-item action-menu-item--warning"
                  onClick={() => {
                    // Disable login
                    handleToggleLogin(row._id, false);
                    setOpenMenuId(null);
                  }}
                >
                  Disable Login
                </button>
              ) : (
                <button
                  className="action-menu-item action-menu-item--success"
                  onClick={() => {
                    // Enable login
                    handleToggleLogin(row._id, true);
                    setOpenMenuId(null);
                  }}
                >
                  Enable Login
                </button>
              )}

              {row.isActive ? (
                <button
                  className="action-menu-item action-menu-item--danger"
                  onClick={() => {
                    handleDisableRow(row._id);
                    setOpenMenuId(null);
                  }}
                >
                  Inactive
                </button>
              ) : (
                <button
                  className="action-menu-item action-menu-item--success"
                  onClick={() => {
                    handleEnableRow(row._id);
                    setOpenMenuId(null);
                  }}
                >
                  Active
                </button>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  const handleBulkDisable = async () => {
    const usersToDisable = allUsers.filter((u) => selectedRows.includes(u._id));

    const userListText = usersToDisable.map((u) => `${u.name} (${u.userId})`).join("\n");

    const confirmed = window.confirm(
      `Are you sure you want to disable the following users?\n\n${userListText}`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);
      await Promise.all(selectedRows.map((id) => disableUser(id)));

      setAllUsers((prev) =>
        prev.map((u) => (selectedRows.includes(u._id) ? { ...u, isActive: false, status: 'Inactive', canLogin: false } : u))
      );

      setSelectedRows([]);
    } catch (err) {
      console.error("Bulk disable failed", err);
      setError(err.message || "Bulk disable failed");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading && allUsers.length === 0) {
    return <PageLoader message="Loading users..." />;
  }

  return (
    <div className="users-page">
      {error && <ErrorNotification error={new Error(error)} onClose={() => setError(null)} />}

      <div className="page-title">
        <h2>Users</h2>
      </div>

      <section className="users-actions">
        <div className="users-actions__bar">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className="users-actions__btn users-actions__btn--filter"
          >
            <span className="material-icons">filter_list</span> Filter
          </Button>

          <Button
            onClick={() => navigate("/add-user")}
            className="users-actions__btn users-actions__btn--add"
          >
            + Add New User
          </Button>

          <Button
            onClick={() => exportToCSV(allUsers, "users.csv")}
            className="users-actions__btn users-actions__btn--export"
          >
            <span className="material-icons">file_download</span> Export
          </Button>

          {selectedRows.length > 0 && (
            <Button
              onClick={handleBulkDisable}
              className="delete-btn"
            >
              Disable
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="users-filters">
            <div className="users-filters__row">
              <label>Role:</label>
              <select>
                <option>All</option>
                <option>Admin</option>
                <option>User</option>
              </select>

              <label>Status:</label>
              <select>
                <option>All</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        )}
      </section>

      <div className="users-table">
        <Table
          columns={columns}
          data={allUsers}
          rowKey={(row) => row._id}
        />
      </div>
    </div>
  );
};

export default Users;
								