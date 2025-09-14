import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import api from "../services/api";

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ username: user?.username, email: user?.email });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async () => {
    try {
      const res = await api.put("/user", form);
      alert("Updated: " + JSON.stringify(res.data));
    } catch (err) {
      alert("Update failed: " + (err.response?.data?.error || "Error"));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete("/user");
      logout();
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <div>
      <h1>Profile</h1>
      <input name="username" value={form.username} onChange={handleChange} />
      <input name="email" value={form.email} onChange={handleChange} />
      <button onClick={handleUpdate}>Update</button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
};

export default ProfilePage;