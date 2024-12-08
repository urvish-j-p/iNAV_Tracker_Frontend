import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function AuthForm({ isLogin }) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const response = await axios.post(`${apiBaseUrl}${endpoint}`, formData);

      if (isLogin) {
        const { userId } = response.data;
        login(userId);
        toast.success("Login successful!");
        navigate("/");
      } else {
        toast.success("Registration successful! Please login to continue.");
        navigate("/login");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (isLogin ? "Login failed" : "Registration failed")
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col">
      <div className="font-extrabold text-indigo-600 text-3xl mb-5">
        i-NAV Tracker
      </div>
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="text-center text-2xl font-extrabold text-gray-900">
            {isLogin ? "Login" : "Register"}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
          </div>
          <div className="relative">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center mt-6"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <FaEyeSlash className="text-gray-500 text-xl" />
              ) : (
                <FaEye className="text-gray-500 text-xl" />
              )}
            </button>
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLogin ? "Login" : "Register"}
            </button>
          </div>
        </form>
        <div className="text-center">
          {isLogin ? (
            <Link
              to="/register"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Don't have an account? Register
            </Link>
          ) : (
            <Link to="/login" className="text-indigo-600 hover:text-indigo-500">
              Already have an account? Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthForm;
