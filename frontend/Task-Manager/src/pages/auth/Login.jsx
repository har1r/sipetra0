import { useContext, useState, useId, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";

import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/input/Input";
import UserContext from "../../context/UserContexts";
import axiosInstance from "../../utils/axiosInstance";
import { validateEmail } from "../../utils/helper";
import { API_PATHS } from "../../utils/apiPaths";

const Login = () => {
  const navigate = useNavigate();
  const { updateUser } = useContext(UserContext);

  const emailId = useId();
  const passwordId = useId();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: false, password: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: false }));
  };

  const scrollToElement = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    ref.current?.focus();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const safeEmail = formData.email.trim().toLowerCase();
    const safePassword = formData.password.trim();

    if (!safeEmail) {
      setErrors((prev) => ({ ...prev, email: true }));
      toast.error("Email wajib diisi.");
      return scrollToElement(emailRef);
    }

    if (!validateEmail(safeEmail)) {
      setErrors((prev) => ({ ...prev, email: true }));
      toast.error("Format email tidak valid.");
      return scrollToElement(emailRef);
    }

    if (!safePassword) {
      setErrors((prev) => ({ ...prev, password: true }));
      toast.error("Kata sandi wajib diisi.");
      return scrollToElement(passwordRef);
    }

    setIsSubmitting(true);
    try {
      const { data } = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email: safeEmail,
        password: safePassword,
      });

      const { message, user, token } = data || {};
      if (!token || !user) throw new Error("Respons server tidak valid.");

      localStorage.setItem("token", token);
      updateUser(user);
      toast.success(message || "Selamat datang kembali!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || "Gagal login. Silakan coba lagi.";
      setErrors({ email: true, password: true });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full">
        {/* Header Section */}
        <header className="text-center md:text-left mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3 tracking-tight">
            Selamat Datang <span className="text-emerald-600">Kembali</span>
          </h2>
          <p className="text-slate-500 text-base leading-relaxed">
            Akses dashboard SIPETRA Anda dengan akun yang terdaftar.
          </p>
        </header>

        {/* Form Section */}
        <form onSubmit={handleLogin} noValidate className="space-y-6">
          <div className="space-y-1">
            <label
              htmlFor={emailId}
              className="text-sm font-medium text-slate-700 ml-1"
            >
              Alamat Email
            </label>
            <Input
              id={emailId}
              ref={emailRef}
              error={errors.email}
              name="email"
              type="email"
              placeholder="nama@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              icon={<MdEmail size={20} />}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label
                htmlFor={passwordId}
                className="text-sm font-medium text-slate-700"
              >
                Kata Sandi
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-emerald-600 hover:underline"
              >
                Lupa Password?
              </Link>
            </div>
            <Input
              id={passwordId}
              ref={passwordRef}
              error={errors.password}
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              icon={<RiLockPasswordFill size={20} />}
            />
          </div>

          <div className="pt-4 space-y-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk Sekarang"
              )}
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase tracking-widest">
                Atau
              </span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <p className="text-center text-slate-600 text-sm">
              Belum punya akun?{" "}
              <Link
                to="/signup"
                className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
              >
                Daftar Akun Baru
              </Link>
            </p>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;
