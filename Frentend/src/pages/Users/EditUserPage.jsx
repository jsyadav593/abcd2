import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import UserForm from "./UserForm.jsx";
import { fetchUserById, updateUser } from "../../services/userApi";

const EditUserPage = () => {
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
        // console.log('Fetching user with ID:', id);
        const data = await fetchUserById(id);
        // console.log('Fetched user data:', data);
        setUserData(data);
      } catch (err) {
        console.error("Failed to fetch user", err);
        setError(err.message);
        alert('Failed to load user details: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadUser();
    }
  }, [id]);

  const handleUpdate = async (updatedData) => {
    try {
      // console.log('Updating user with ID:', id, 'Data:', updatedData);
      const response = await updateUser(id, updatedData);
      // console.log('Update response:', response);
      alert('User updated successfully!');
      navigate("/users");
    } catch (err) {
      console.error("Failed to update user", err);
      alert("Failed to update user: " + err.message);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading user details...</div>;
  
  if (error) return <div style={{ padding: '2rem', color: '#dc3545', textAlign: 'center' }}>Error: {error}</div>;

  if (!userData) return <div style={{ padding: '2rem', textAlign: 'center' }}>User data not found</div>;

  return (
    <UserForm
      formData={userData}
      onSave={handleUpdate}
      onClose={() => navigate("/users")}
    />
  );
};

export default EditUserPage;
