import { useNavigate } from "react-router-dom";
import UserForm from "./UserForm.jsx";
import { addUser } from "../../services/userApi";

const AddUserPage = () => {
  const navigate = useNavigate();

  const handleSaveUser = async (userData) => {
    try {
      console.log('Creating new user with data:', userData);
      const response = await addUser(userData);
      console.log('User created:', response);
      alert('User created successfully!');
      navigate("/users");
    } catch (err) {
      console.error("User creation failed", err);
      alert("Failed to create user: " + err.message);
    }
  };

  return (
    <UserForm onSave={handleSaveUser} onClose={() => navigate("/users")} />
  );
};

export default AddUserPage;
