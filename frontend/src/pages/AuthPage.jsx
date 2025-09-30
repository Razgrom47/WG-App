import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

const AuthPage = ({ mode }) => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { darkMode } = useTheme();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email validation regex (basic)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (mode === "register") {
      // Client-side validation for registration
      if (!emailRegex.test(email)) {
        setError("Please enter a valid email address.");
        setIsSubmitting(false);
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        setIsSubmitting(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
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
        // NEW: Redirection to strHomePage is now handled by the login function in AuthContext.jsx
      } else {
        navigate("/login");
      }
    } else if (typeof result === 'string') {
      setError(result);
    } else {
      setError(mode === "login" ? "Login failed. Check your credentials." : "Registration failed. Try again.");
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 transition-colors duration-300">
      <div className="relative bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 w-full max-w-sm border border-gray-200 dark:border-gray-700">

        <h2 className="text-3xl font-semibold mb-6 text-center">
          {mode === "login" ? "Login" : "Register"}
        </h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
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