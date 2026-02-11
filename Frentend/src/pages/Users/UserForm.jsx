import { useState, useEffect } from "react";
import { Form, FormFields, FormActions } from "../../components/Forms/index.js";
import { TextInput, Select, Textarea } from "../../components/UI/index.js";
import "../../components/Forms/Forms.css";

const UserForm = ({ onSave, onClose, formData: initialData }) => {
  const [formData, setFormData] = useState({
    userId: "",
    name: "",
    designation: "",
    department: "",
    phone_no: "",
    email: "",
    role: "user",
    status: "active",
    canLogin: false,
    username: "",
    password: "",
    remarks: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // auto handle canLogin based on role
  useEffect(() => {
    if (formData.role === "admin" || formData.role === "super_admin") {
      setFormData((prev) => ({ ...prev, canLogin: true }));
    } else {
      setFormData((prev) => ({
        ...prev,
        canLogin: false,
        username: "",
        password: "",
      }));
    }
  }, [formData.role]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? e.target.checked : value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.userId.trim()) newErrors.userId = "Employee ID is required";
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (formData.canLogin && formData.status === "active") {
      if (!formData.username.trim()) {
        newErrors.username = "Username is required for login";
      }
      if (!formData.password.trim()) {
        newErrors.password = "Password is required for login";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      await onSave(formData);
    }
  };

  const formActionButtons = [
    {
      label: "Cancel",
      onClick: onClose,
      type: "button",
      variant: "secondary",
    },
    {
      label: initialData ? "Update User" : "Create User",
      onClick: handleSubmit,
      type: "submit",
      variant: "primary",
    },
  ];

  return (
    
        <Form
          title={initialData ? "Edit User" : "Add New User"}
          onSubmit={handleSubmit}
          actions={<FormActions buttons={formActionButtons} />}
        >
          <FormFields columns={2}>
            <TextInput
              label="Employee ID"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              placeholder="Enter employee ID"
              required
            />

            <TextInput
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter employee name"
              required
            />

            <TextInput
              label="Designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              placeholder="e.g., Manager, Developer"
            />

            <TextInput
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g., IT, HR, Sales"
            />

            <TextInput
              label="Phone Number"
              name="phone_no"
              type="tel"
              value={formData.phone_no}
              onChange={handleChange}
              placeholder="Enter phone number"
            />

            <TextInput
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="user@example.com"
              required
            />

            <Select
              label="Role"
              name="role"
              value={formData.role}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, role: value }))
              }
              options={[
                { label: "User", value: "user" },
                { label: "Admin", value: "admin" },
                { label: "Super Admin", value: "super_admin" },
              ]}
            />

            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
              options={[
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
            />

            <Select
              label="Can Login"
              name="canLogin"
              value={formData.canLogin ? "yes" : "no"}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  canLogin: value === "yes",
                }))
              }
              options={[
                { label: "No", value: "no" },
                { label: "Yes", value: "yes" },
              ]}
              disabled={
                formData.role === "admin" || formData.role === "super_admin"
              }
            />

            {formData.canLogin && formData.status === "active" && (
              <>
                <TextInput
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter login username"
                  required
                />

                <TextInput
                  label="Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter secure password"
                  required
                />
              </>
            )}
          </FormFields>

          <div className="form-remarks-wrapper">
            <Textarea
              label="Additional Remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={3}
              placeholder="Add any additional notes or remarks (optional)..."
            />
          </div>
        </Form>
      
  );
};

export default UserForm;
