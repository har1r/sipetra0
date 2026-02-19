import React, { useContext, useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { IoPersonSharp } from "react-icons/io5";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";
import { MdToken } from "react-icons/md";

import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/inputs/Input";
import axiosInstance from "../../utils/axiosInstance";
import { validateEmail } from "../../utils/helper";
import UserContext from "../../context/UserContexts";
import { API_PATHS } from "../../utils/apiPaths";

const stageToRoleMap = {
  Diinput: "penginput",
  Ditata: "penata",
  Diteliti: "peneliti",
  Diarsipkan: "pengarsip",
  Dikirim: "pengirim",
  Selesai: "pengecek",
};

const SignUp = () => {
  const navigate = useNavigate();
  const { updateUser } = useContext(UserContext);

  const nameId = useId();
  const emailId = useId();
  const passId = useId();
  const adminTokenId = useId();
  const stageId = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminInviteToken, setAdminInviteToken] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      adminInviteToken: adminInviteToken.trim(),
      selectedStage: selectedStage.trim(),
    };

    if (!safe.name || !safe.email || !safe.password) {
      toast.error("Nama, email, dan password wajib diisi.");
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
      toast.error("Pilih tahapan tanggung jawab atau masukkan token admin.");
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
        payload
      );
      const { message, token, user } = response?.data || {};
      if (!token || !user)
        throw new Error("Token atau data pengguna tidak ditemukan.");

      const userWithInitials = { ...user, initials: getInitials(user.name) };
      localStorage.setItem("token", token);
      updateUser(userWithInitials);
      toast.success(message || "Registrasi berhasil!");

      const isAdmin = user.role?.toLowerCase() === "admin";
      navigate(isAdmin ? "/admin/dashboard" : "/user/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("❌ Register Error:", error.message);
      const backendMsg = error?.response?.data?.message;
      toast.error(backendMsg || "Gagal register. Coba lagi nanti.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-sm mx-auto px-3 md:px-0">
        {/* === Heading === */}
        <h2 className="text-3xl md:text-4xl font-extrabold text-emerald-700 mb-2 text-center md:text-left leading-snug">
          Daftar Akun Baru
        </h2>
        <p className="text-emerald-600/80 text-sm mb-6 text-center md:text-left">
          Isi data berikut untuk membuat akun Anda.
        </p>

        {/* === Form Register === */}
        <form onSubmit={handleRegister} noValidate className="space-y-4">
          <Input
            id={nameId}
            name="name"
            type="text"
            placeholder="Nama lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            icon={<IoPersonSharp size={20} />}
          />

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
            id={passId}
            name="password"
            type="password"
            placeholder="Kata sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            icon={<RiLockPasswordFill size={20} />}
          />

          <Input
            id={adminTokenId}
            name="adminInviteToken"
            type="text"
            placeholder="Token admin (opsional)"
            value={adminInviteToken}
            onChange={(e) => setAdminInviteToken(e.target.value)}
            icon={<MdToken size={20} />}
          />

          {!adminInviteToken && (
            <select
              id={stageId}
              className="w-full rounded-lg border border-emerald-200 bg-white/70 text-slate-700 p-2 text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-300 transition-all duration-200"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
            >
              <option value="">-- Pilih tahapan tanggung jawab --</option>
              {Object.keys(stageToRoleMap).map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-emerald-500 via-green-500 to-lime-500 text-white font-semibold py-2.5 rounded-lg shadow-md hover:brightness-110 transition-all duration-300 disabled:opacity-60"
          >
            {isSubmitting ? "Mendaftarkan..." : "Daftar"}
          </button>

          <Link
            to="/login"
            className="block w-full text-center border border-emerald-500 text-emerald-600 font-semibold py-2.5 rounded-lg hover:bg-emerald-50 transition-all duration-300"
          >
            Masuk Ke Akun
          </Link>
        </form>
      </div>
    </AuthLayout>
  );
};

export default SignUp;
