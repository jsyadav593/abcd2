import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Table from "../../components/UI/Table/Table.jsx";
import Button from "../../components/UI/Button/Button.jsx";
import "./Users.css";
import { fetchUsers, deleteUser } from "../../services/userApi";
import { exportToCSV } from "../../utils/exportToCSV";

const Users = () => {
  const navigate = useNavigate();

  const [showFilters, setShowFilters] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Fetch with large limit to get all users
        const data = await fetchUsers(1, 1000);
        console.log('Users loaded:', data);
        setAllUsers(data);
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    };
    loadUsers();
  }, []);

  const columns = [
    { header: "User ID", key: "userId", sortable: true },
    { header: "Full Name", key: "name", sortable: true },
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
        <div className="action-buttons">
          <button
            className="edit-btn"
            onClick={() => navigate(`/edit-user/${row._id}`)}
          >
            <span className="material-icons">edit</span>
          </button>

          <button
            className="delete-btn"
            disabled
            title="Delete disabled"
          >
            <span className="material-icons">delete</span>
          </button>
        </div>
      ),
    },
  ];

  const handleBulkDelete = async () => {
    const usersToDelete = allUsers.filter((u) =>
      selectedRows.includes(u._id)
    );

    const userListText = usersToDelete
      .map((u) => `${u.name} (${u.userId})`)
      .join("\n");

    const confirmed = window.confirm(
      `Are you sure you want to delete the following users?\n\n${userListText}`
    );

    if (!confirmed) return;

    try {
      await Promise.all(selectedRows.map((id) => deleteUser(id)));

      setAllUsers((prev) =>
        prev.filter((u) => !selectedRows.includes(u._id))
      );

      setSelectedRows([]);
    } catch (err) {
      console.error("Bulk delete failed", err);
      alert("Bulk delete failed");
    }
  };

  return (
    <div className="users-page">
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
              onClick={handleBulkDelete}
              className="delete-btn"
            >
              Delete
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
								