"use client";

// src/pages/Register.jsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import API from "@/api";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    avatar: null,
    coverImage: null,
  });
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) data.append(key, value);
    });

    try {
      const res = await API.post("/v1/users/register", data);
      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 rounded-xl shadow-lg mt-20 bg-white">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Create an Account
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Input
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="px-4 py-3 border border-gray-300 rounded-md w-full"
          />
        </div>

        <div>
          <Input
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            className="px-4 py-3 border border-gray-300 rounded-md w-full"
          />
        </div>

        <div>
          <Input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="px-4 py-3 border border-gray-300 rounded-md w-full"
          />
        </div>

        <div>
          <Input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="px-4 py-3 border border-gray-300 rounded-md w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Avatar
          </label>
          <Input
            name="avatar"
            type="file"
            accept="image/*"
            onChange={handleChange}
            required
            className="mt-2 px-4 py-3 border border-gray-300 rounded-md w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Cover Image
          </label>
          <Input
            name="coverImage"
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="mt-2 px-4 py-3 border border-gray-300 rounded-md w-full"
          />
        </div>

        <Button
          type="submit"
          className="w-full py-3 bg-blue-500 text-white hover:bg-blue-600 transition duration-300 rounded-md cursor-pointer"
        >
          Register
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-blue-500 hover:text-blue-700 font-semibold cursor-pointer"
          >
            Login here
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
