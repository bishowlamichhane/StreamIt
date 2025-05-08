"use client";

// src/pages/Login.jsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import API from "@/api";
import { useAuthStore } from "@/store/authStore";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const setAuth = useAuthStore((state) => state.setAuth);
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  // Check if redirected from community
  const fromCommunity = location.state?.from === "community";
  const redirectMessage = location.state?.message;

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
    <div className="max-w-md mx-auto p-4 md:p-8 rounded-xl shadow-lg mt-10 md:mt-20 bg-card border border-border">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-card-foreground">
        Welcome Back! Please Login
      </h2>

      {/* Show message if redirected from community */}
      {fromCommunity && (
        <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-foreground">
              {redirectMessage || "Login Required"}
            </p>
            <p className="text-sm text-muted-foreground">
              Community features are only available to logged-in users.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Input
            placeholder="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            className="px-4 py-3 border border-border rounded-md w-full bg-background text-foreground"
          />
        </div>

        <div>
          <Input
            placeholder="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="px-4 py-3 border border-border rounded-md w-full bg-background text-foreground"
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
            className="px-4 py-3 border border-border rounded-md w-full bg-background text-foreground"
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
              Logging in...
            </div>
          ) : (
            "Login"
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <a
            href="/register"
            className="text-primary hover:text-primary/90 font-semibold cursor-pointer"
          >
            Create an Account
          </a>
        </p>
      </div>
      <div className="mt-8 p-4 bg-muted/30 border border-border rounded-lg">
        <div className="flex items-center mb-2">
          <div className="w-1 h-5 bg-primary mr-2"></div>
          <h3 className="font-medium">Demo Account</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          For demonstration purposes, you can use the following credentials:
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">Username:</div>
          <div className="font-mono bg-background/50 px-2 py-0.5 rounded">
            test
          </div>
          <div className="font-medium">Email:</div>
          <div className="font-mono bg-background/50 px-2 py-0.5 rounded">
            test@gmail.com
          </div>
          <div className="font-medium">Password:</div>
          <div className="font-mono bg-background/50 px-2 py-0.5 rounded">
            test1234
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
