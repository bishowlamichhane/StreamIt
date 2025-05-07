"use client";

// src/pages/Login.jsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import API from "@/api";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const setAuth = useAuthStore((state) => state.setAuth);
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/v1/users/login", form);
      const { user, accessToken, refreshToken } = res.data.data;

      setAuth({ user, accessToken, refreshToken });
      toast.success("Login successful");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 rounded-xl shadow-lg mt-20 bg-white">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Welcome Back! Please Login
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Input
            placeholder="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            className="px-4 py-3 border border-gray-300 rounded-md w-full"
          />
        </div>

        <div>
          <Input
            placeholder="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="px-4 py-3 border border-gray-300 rounded-md w-full"
          />
        </div>

        <div>
          <Input
            placeholder="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="px-4 py-3 border border-gray-300 rounded-md w-full"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-500 text-white hover:bg-blue-600 transition duration-300 rounded-md cursor-pointer"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              Logging in...
            </div>
          ) : (
            "Login"
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <a
            href="/register"
            className="text-blue-500 hover:text-blue-700 font-semibold cursor-pointer"
          >
            Create an Account
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
