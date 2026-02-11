import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUserById } from "../../services/userApi";
import "./UserDetail.css";

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchUserById(id);
        setUserData(data);
      } catch (err) {
        console.error("Failed to fetch user", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadUser();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-loading">Loading user details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-page">
        <div className="detail-error">Error: {error}</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="detail-page">
        <div className="detail-error">User data not found</div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <div className="detail-header">
        <button className="detail-back-btn" onClick={() => navigate("/users")}>
          <span className="material-icons">arrow_back</span> Back to Users
        </button>
      </div>

      <div className="detail-container">
        <div className="detail-card">
          <h1 className="detail-title">{userData.name}</h1>

          <div className="detail-grid">
            <div className="detail-field">
              <label className="detail-label">Employee ID</label>
              <p className="detail-value">{userData.userId}</p>
            </div>

            <div className="detail-field">
              <label className="detail-label">Email</label>
              <p className="detail-value">{userData.email || "N/A"}</p>
            </div>

            <div className="detail-field">
              <label className="detail-label">Designation</label>
              <p className="detail-value">{userData.designation || "N/A"}</p>
            </div>

            <div className="detail-field">
              <label className="detail-label">Department</label>
              <p className="detail-value">{userData.department || "N/A"}</p>
            </div>

            <div className="detail-field">
              <label className="detail-label">Phone Number</label>
              <p className="detail-value">{userData.phone_no || "N/A"}</p>
            </div>

            <div className="detail-field">
              <label className="detail-label">Role</label>
              <p className="detail-value">
                <span className="detail-badge detail-badge--role">
                  {userData.role}
                </span>
              </p>
            </div>

            <div className="detail-field">
              <label className="detail-label">Status</label>
              <p className="detail-value">
                <span className={`detail-badge ${userData.isActive ? 'detail-badge--active' : 'detail-badge--inactive'}`}>
                  {userData.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>

            <div className="detail-field">
              <label className="detail-label">Can Login</label>
              <p className="detail-value">
                {userData.canLogin ? '✓ Yes' : '✗ No'}
              </p>
            </div>

            {userData.remarks && (
              <div className="detail-field detail-field--full">
                <label className="detail-label">Remarks</label>
                <p className="detail-value detail-value--multiline">{userData.remarks}</p>
              </div>
            )}
          </div>

          <div className="detail-actions">
            <button
              className="detail-btn detail-btn--primary"
              onClick={() => navigate(`/edit-user/${userData._id}`)}
            >
              <span className="material-icons">edit</span> Edit User
            </button>
            <button
              className="detail-btn detail-btn--secondary"
              onClick={() => navigate("/users")}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;
