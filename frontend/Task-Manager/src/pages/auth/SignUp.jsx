import React, { useContext, useId, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// Icons
import { IoPersonSharp } from "react-icons/io5";
import { MdEmail, MdToken } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";
import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";

import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/input/Input";
import axiosInstance from "../../utils/axiosInstance";
import { validateEmail } from "../../utils/helper";
import UserContext from "../../context/UserContexts";
import { API_PATHS } from "../../utils/apiPaths";

const stageToRoleMap = {
  Diinput: "penginput",
  Ditata: "penata",
  Diteliti: "peneliti",
  Arsip: "pengarsip",
  Dikirim: "pengirim",
  Selesai: "pengecek",
};

const SignUp = () => {
  const navigate = useNavigate();
  const { updateUser } = useContext(UserContext);

  // ID & Refs
  const nameId = useId();
  const emailId = useId();
  const passId = useId();
  const adminTokenId = useId();
  const stageId = useId();

  const formRef = useRef(null);

  // States
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    adminInviteToken: "",
    selectedStage: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getInitials = (fullName) => {
    if (!fullName) return "";
    const parts = fullName.trim().split(" ");
    return (
      parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")
    ).toUpperCase();
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const safe = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password.trim(),
      adminInviteToken: formData.adminInviteToken.trim(),
      selectedStage: formData.selectedStage.trim(),
    };

    if (!safe.name || !safe.email || !safe.password) {
      toast.error("Mohon lengkapi data diri Anda.");
      return;
    }

    if (!validateEmail(safe.email)) {
      toast.error("Format email tidak valid.");
      return;
    }

    let role = "";
    if (safe.adminInviteToken) {
      role = "admin";
    } else if (safe.selectedStage) {
      role = stageToRoleMap[safe.selectedStage] || "";
    } else {
      toast.error("Pilih tanggung jawab atau gunakan token admin.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: safe.name,
        email: safe.email,
        password: safe.password,
        role,
        adminInviteToken: safe.adminInviteToken || undefined,
      };

      const response = await axiosInstance.post(
        API_PATHS.AUTH.REGISTER,
        payload,
      );
      const { message, token, user } = response?.data || {};

      if (!token || !user) throw new Error("Data respons tidak lengkap.");

      const userWithInitials = { ...user, initials: getInitials(user.name) };
      localStorage.setItem("token", token);
      updateUser(userWithInitials);
      toast.success(message || "Akun berhasil dibuat!");

      const isAdmin = user.role?.toLowerCase() === "admin";
      navigate(isAdmin ? "/admin/dashboard" : "/user/dashboard", {
        replace: true,
      });
    } catch (error) {
      const backendMsg = error?.response?.data?.message;
      toast.error(backendMsg || "Gagal mendaftar. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full">
        {/* === Heading Section === */}
        <header className="text-center md:text-left mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3 tracking-tight">
            Daftar <span className="text-emerald-600">SIPETRA</span>
          </h2>
          <p className="text-slate-500 text-base leading-relaxed">
            Mulai kelola sistem informasi pelayanan secara rapi dan terpantau.
          </p>
        </header>

        {/* === Form Section === */}
        <form onSubmit={handleRegister} noValidate className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor={nameId}
              className="text-sm font-medium text-slate-700 ml-1"
            >
              Nama Lengkap
            </label>
            <Input
              id={nameId}
              name="name"
              placeholder="Masukkan nama lengkap"
              value={formData.name}
              onChange={handleChange}
              icon={<IoPersonSharp className="text-emerald-500/70" size={18} />}
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor={emailId}
              className="text-sm font-medium text-slate-700 ml-1"
            >
              Alamat Email
            </label>
            <Input
              id={emailId}
              name="email"
              type="email"
              placeholder="nama@email.com"
              value={formData.email}
              onChange={handleChange}
              icon={<MdEmail className="text-emerald-500/70" size={18} />}
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor={passId}
              className="text-sm font-medium text-slate-700 ml-1"
            >
              Kata Sandi
            </label>
            <Input
              id={passId}
              name="password"
              type="password"
              placeholder="Min. 8 karakter"
              value={formData.password}
              onChange={handleChange}
              icon={
                <RiLockPasswordFill className="text-emerald-500/70" size={18} />
              }
            />
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100"></span>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-slate-400 bg-white px-2 w-max mx-auto">
              Peran & Akses
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor={adminTokenId}
              className="text-sm font-medium text-slate-700 ml-1"
            >
              Token Admin (Opsional)
            </label>
            <Input
              id={adminTokenId}
              name="adminInviteToken"
              placeholder="Masukkan token jika ada"
              value={formData.adminInviteToken}
              onChange={handleChange}
              icon={<MdToken className="text-emerald-500/70" size={18} />}
            />
          </div>

          {!formData.adminInviteToken && (
            <div className="space-y-1">
              <label
                htmlFor={stageId}
                className="text-sm font-medium text-slate-700 ml-1"
              >
                Tanggung Jawab
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-emerald-500/70 pointer-events-none">
                  <HiOutlineAdjustmentsHorizontal size={20} />
                </div>
                <select
                  id={stageId}
                  name="selectedStage"
                  value={formData.selectedStage}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-emerald-100 bg-white/70 text-slate-700 text-[15px] focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Pilih tahapan tanggung jawab</option>
                  {Object.keys(stageToRoleMap).map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 pointer-events-none border-l pl-2 border-slate-100 text-slate-400">
                  <span className="text-[10px]">▼</span>
                </div>
              </div>
            </div>
          )}

          {/* === Action Buttons === */}
          <div className="pt-4 space-y-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#064e3b] hover:bg-[#053f30] text-white font-semibold py-3.5 rounded-xl shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Mendaftarkan...
                </>
              ) : (
                "Daftar Akun"
              )}
            </button>

            <p className="text-center text-slate-600 text-sm">
              Sudah memiliki akun?{" "}
              <Link
                to="/login"
                className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
              >
                Masuk Sekarang
              </Link>
            </p>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default SignUp;
