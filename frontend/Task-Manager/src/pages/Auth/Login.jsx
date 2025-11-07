import { useContext, useState, useId } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";

import AuthLayout from "../../components/layouts/AuthLayout";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance";
import UserContext from "../../context/UserContexts";
import { API_PATHS } from "../../utils/apiPaths";
import Input from "../../components/inputs/Input";

const Login = () => {
  const navigate = useNavigate();
  const { updateUser } = useContext(UserContext);

  const emailId = useId();
  const passwordId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    const safeEmail = email.trim().toLowerCase();
    const safePassword = password.trim();

    if (!safeEmail || !safePassword) {
      toast.error("Email dan password wajib diisi.");
      return;
    }

    if (!validateEmail(safeEmail)) {
      toast.error("Format email tidak valid.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email: safeEmail,
        password: safePassword,
      });

      const { message, user, token } = response?.data || {};
      if (!token || !user)
        throw new Error("Token atau data pengguna tidak ditemukan.");

      localStorage.setItem("token", token);
      updateUser(user);
      toast.success(message || "Login berhasil!");

      const isAdmin = user.role?.toLowerCase() === "admin";
      navigate(isAdmin ? "/admin/dashboard" : "/user/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("❌ Login Error:", error.message);
      const backendMsg = error?.response?.data?.message;
      toast.error(backendMsg || "Gagal login. Coba lagi nanti.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-sm mx-auto px-3 md:px-0">
        {/* === Heading === */}
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 text-center md:text-left leading-snug">
          Masuk Akun Anda
        </h2>
        <p className="text-slate-600 text-sm mb-6 text-center md:text-left">
          Silakan masuk menggunakan akun terdaftar untuk melanjutkan.
        </p>

        {/* === Form Login === */}
        <form onSubmit={handleLogin} noValidate className="space-y-4">
          <Input
            id={emailId}
            name="email"
            type="email"
            placeholder="Alamat email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            icon={<MdEmail size={20} />}
          />

          <Input
            id={passwordId}
            name="password"
            type="password"
            placeholder="Kata sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            icon={<RiLockPasswordFill size={20} />}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-emerald-400 via-green-500 to-lime-500 text-white font-semibold py-2.5 rounded-lg shadow-md hover:brightness-110 hover:shadow-lg hover:scale-[1.02] transition disabled:opacity-60"
          >
            {isSubmitting ? "Proses..." : "Masuk"}
          </button>

          <Link
            to="/signup"
            className="block w-full text-center border border-emerald-500 text-emerald-600 font-semibold py-2.5 rounded-lg hover:bg-emerald-50 transition"
          >
            Buat Akun Baru
          </Link>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;
