import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useAlert } from "../contexts/AlertContext";
const AuthPage = ({ mode }) => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { darkMode } = useTheme();
  const { showAlert } = useAlert(); // 2. Use the showAlert function

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // const [error, setError] = useState(""); // Remove local error state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email validation regex (basic)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    // setError(""); // Remove clearing local error state
    setIsSubmitting(true);

    if (mode === "register") {
      // Client-side validation for registration
      if (!emailRegex.test(email)) {
        showAlert("Please enter a valid email address.", 'error'); // Use custom alert
        setIsSubmitting(false);
        return;
      }
      if (password.length < 8) {
        showAlert("Password must be at least 8 characters long.", 'error'); // Use custom alert
        setIsSubmitting(false);
        return;
      }
      if (password !== confirmPassword) {
        showAlert("Passwords do not match.", 'error'); // Use custom alert
        setIsSubmitting(false);
        return;
      }
    }

    let result;
    if (mode === "login") {
      result = await login(identifier, password);
    } else {
      result = await register(username, email, password);
    }

    if (result === true) {
      if (mode === "login") {
        // Redirection handled by login function in AuthContext.jsx
        showAlert("Login successful!", 'success'); // Optional: Show success alert on successful login
      } else {
        showAlert("Registration successful! Please log in.", 'success'); // Show success alert for register
        navigate("/login");
      }
    } else if (typeof result === 'string') {
      showAlert(result, 'error'); // Show API error message
    } else {
      showAlert(mode === "login" ? "Login failed. Check your credentials." : "Registration failed. Try again.", 'error'); // Show generic error
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 transition-colors duration-300">
      <div className="relative bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 w-full max-w-sm border border-gray-200 dark:border-gray-700">

        <h2 className="text-3xl font-semibold mb-6 text-center">
          {mode === "login" ? "Login" : "Register"}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "register" && (
            <>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="px-4 py-2 rounded-lg border-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                required
                autoComplete="username"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-2 rounded-lg border-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                required
                autoComplete="email"
              />
            </>
          )}
          {mode === "login" && (
            <input
              type="text"
              placeholder="Username or Email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="px-4 py-2 rounded-lg border-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              required
              autoComplete="username"
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-2 rounded-lg border-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {mode === "register" && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="px-4 py-2 rounded-lg border-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              required
              autoComplete="new-password"
            />
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 mt-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition duration-300 disabled:bg-gray-400"
          >
            {isSubmitting ? "Loading..." : (mode === "login" ? "Login" : "Register")}
          </button>
        </form>

        <div className="mt-4 text-center">
          {mode === "login" ? (
            <p>Don't have an account? <Link to="/register" className="text-blue-500 hover:text-blue-400 font-medium transition duration-300">Register</Link></p>
          ) : (
            <p>Already have an account? <Link to="/login" className="text-blue-500 hover:text-blue-400 font-medium transition duration-300">Login</Link></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;