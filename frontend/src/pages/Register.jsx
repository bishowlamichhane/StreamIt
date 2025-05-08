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
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 rounded-xl shadow-lg mt-20 bg-card border border-border">
      <h2 className="text-3xl font-bold mb-6 text-center text-card-foreground">
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
            className="px-4 py-3 border border-border rounded-md w-full bg-background text-foreground"
          />
        </div>

        <div>
          <Input
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            className="px-4 py-3 border border-border rounded-md w-full bg-background text-foreground"
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
            className="px-4 py-3 border border-border rounded-md w-full bg-background text-foreground"
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
            className="px-4 py-3 border border-border rounded-md w-full bg-background text-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-card-foreground mb-1">
            Avatar
          </label>
          <Input
            name="avatar"
            type="file"
            accept="image/*"
            onChange={handleChange}
            required
            className="mt-2 px-4 py-3 border border-border rounded-md w-full bg-background text-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-card-foreground mb-1">
            Cover Image
          </label>
          <Input
            name="coverImage"
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="mt-2 px-4 py-3 border border-border rounded-md w-full bg-background text-foreground"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition duration-300 rounded-md cursor-pointer"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"></div>
              Registering...
            </div>
          ) : (
            "Register"
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-primary hover:text-primary/90 font-semibold cursor-pointer"
          >
            Login here
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
