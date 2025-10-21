import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import Logo from "../components/Logo";
import { signinUser } from "../api/usersAPI";
import { type ApiError } from "../types/authTypes";
import { showSuccessToast, showErrorToast } from "../utils/toast";
import { type AppDispatch } from "../store/store";
import { useDispatch } from "react-redux";
import { setUser } from "../store/slices/usersSlice";

const Signin: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      const data = await signinUser({
        email: formData.email,
        password: formData.password,
      });

      const user = {
        _id: data.user._id,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        organizationName: data.user.organizationName,
        profiles: [],
        numberOfReconciledProfiles: 0,
        numberOfUnReconciledProfiles: 0,
        token: data.token,
      };
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", data.token);
      dispatch(setUser(user));
      showSuccessToast(`Welcome back, ${data.user.firstName}! 👋`);
      navigate("/dashboard");
    } catch (error) {
      const err = error as ApiError;
      console.error("❌ Signin failed:", err.message);
      showErrorToast("Invalid email or password.");
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 items-center justify-center flex flex-col gap-1">
          <Logo width="150" height="150" navbar_theme="light" />
          <p className="text-text-secondary text-sm">
            AI-Powered POS Reconciliation
          </p>
        </div>

        {/* Signin Card */}
        <div className="bg-bg-light rounded-2xl shadow-lg border border-border p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Welcome Back
          </h2>
          <p className="text-text-secondary text-sm mb-6">
            Sign in to continue to Clofast
          </p>

          <div className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-text-tertiary" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  className="w-full pl-12 pr-4 py-3 bg-bg border border-border rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-text-tertiary" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3 bg-bg border border-border rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-tertiary hover:text-text-secondary transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Signin Button */}
            <button
              onClick={handleSubmit}
              className="w-full bg-bg-button text-text-inverted py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity duration-200 shadow-md mt-6"
            >
              Sign In
            </button>
          </div>

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-text-secondary text-sm">
              Don’t have an account?{" "}
              <a
                href="/signup"
                className="text-primary font-semibold hover:underline transition-all duration-200"
              >
                Sign up
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-text-tertiary text-xs mt-6">
          Forgot your password?{" "}
          <a
            href="#forgot-password"
            className="text-primary font-semibold hover:underline transition-all duration-200"
          >
            Reset it here
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signin;
