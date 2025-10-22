import React, { useContext, useState, useId } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";

import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/inputs/Input";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance";
import { UserContext } from "../../context/UserContexts";
import { API_PATHS } from "../../utils/apiPaths";

const Login = () => {
  const navigate = useNavigate();
  const { updateUser } = useContext(UserContext);

  const emailId = useId();
  const passId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    const safeEmail = email.trim();
    const safePassword = password;

    if (!validateEmail(safeEmail)) {
      toast.error("Format email tidak valid.");
      return;
    }
    if (!safePassword) {
      toast.error("Password tidak boleh kosong.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email: safeEmail,
        password: safePassword,
      });

      const { token, role } = data || {};
      if (!token) throw new Error("Token autentikasi tidak ditemukan.");

      localStorage.setItem("token", token);
      updateUser(data);
      toast.success("Login berhasil!");

      const isAdmin = String(role || "").toLowerCase() === "admin";
      navigate(isAdmin ? "/admin/dashboard" : "/user/dashboard", {
        replace: true,
      });
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Gagal login. Coba lagi.";
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mx-auto flex h-full w-full max-w-xl flex-col justify-center px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            Masuk Akun Anda
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Silakan masukkan email dan password
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm"
          aria-label="Form Login"
        >
          <Input
            id={emailId}
            name="email"
            label="Email"
            type="email"
            placeholder="Masukkan email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            hint="Gunakan email terdaftar."
          />

          <div>
            <label
              htmlFor={passId}
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id={passId}
                name="password"
                type={showPass ? "text" : "password"}
                placeholder="Masukkan password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-12 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute inset-y-0 right-0 m-1 rounded-md px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-pressed={showPass}
                aria-controls={passId}
                title={showPass ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="relative w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v3A5 5 0 007 12H4z"
                  />
                </svg>
                Memproses…
              </span>
            ) : (
              "Masuk"
            )}
          </button>

          <p className="text-center text-sm text-slate-700">
            Belum punya akun?{" "}
            <Link
              to="/signup"
              className="font-medium text-indigo-600 underline hover:text-indigo-700"
            >
              Daftar di sini
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;
