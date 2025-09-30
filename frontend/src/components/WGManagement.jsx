import { useState } from "react";
import wg_api from "../services/wg_api"; // New: Import the dedicated WG API service

const WGManagement = ({ onCreated }) => {
  const [form, setForm] = useState({ title: "", address: "", etage: "", description: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await wg_api.createWG(form); // New: Use wg_api to create a WG
      onCreated(res.data); // res.data now contains the full WG object with ID
      setForm({ title: "", address: "", etage: "", description: "" });
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || "Failed to create shared apartment"));
    }
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium mb-1">Title</label>              
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <label className="block text-sm font-medium mb-1">Address</label>              
        <input
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
          required
          className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <label className="block text-sm font-medium mb-1">Etage</label>              
        <input
          name="etage"
          placeholder="Etage (e.g., 2nd floor)"
          value={form.etage}
          onChange={handleChange}
          className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <label className="block text-sm font-medium mb-1">Description</label>              
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        <button
          type="submit"
          className="w-full p-3 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors"
        >
          Create Shared Apartment
        </button>
      </form>
    </div>
  );
};

export default WGManagement;