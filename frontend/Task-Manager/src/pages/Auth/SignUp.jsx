import React, { useContext, useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";

import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/inputs/Input";
import PreviewImage from "../../components/ui/ImagePreview";
import axiosInstance from "../../utils/axiosInstance";
import uploadImage from "../../utils/uploadImage";
import { validateEmail } from "../../utils/helper";
import { UserContext } from "../../context/UserContexts";
import { API_PATHS } from "../../utils/apiPaths";

// Mapping stage → role (sesuai backend)
const stageToRoleMap = {
  Diinput: "penginput",
  Ditata: "penata",
  Diteliti: "peneliti",
  Diarsipkan: "pengarsip",
  Dikirim: "pengirim",
};

const SignUp = () => {
  const navigate = useNavigate();
  const { updateUser } = useContext(UserContext);

  const nameId = useId();
  const emailId = useId();
  const passId = useId();
  const adminInvTokenId = useId()
  const stageId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [adminInviteToken, setAdminInviteToken] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();

    const safe = {
      name: name.trim(),
      email: email.trim(),
      password: password, // biarkan apa adanya
      adminInviteToken: adminInviteToken.trim(),
      selectedStage: selectedStage.trim(),
    };

    if (!validateEmail(safe.email)) {
      toast.error("Format email tidak valid.");
      return;
    }
    if (!safe.name || !safe.email || !safe.password) {
      toast.error("Semua data wajib diisi!");
      return;
    }

    // Tentukan role
    let role = "";
    if (safe.adminInviteToken) {
      role = "admin";
    } else if (safe.selectedStage) {
      role = stageToRoleMap[safe.selectedStage] || "";
    } else {
      toast.error("Pilih tahapan atau masukkan token admin.");
      return;
    }

    setSubmitting(true);
    try {
      // Upload foto profil (opsional)
      let profileImageUrl = "";
      if (profilePic) {
        const imgRes = await uploadImage(profilePic);
        profileImageUrl = imgRes?.imageUrl || "";
      }

      // Register
      const { data } = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
        name: safe.name,
        email: safe.email,
        password: safe.password,
        role,
        profileImageUrl,
        adminInviteToken: safe.adminInviteToken,
      });

      const { token, role: userRole } = data || {};
      if (!token) throw new Error("Token autentikasi tidak ditemukan.");

      localStorage.setItem("token", token);
      updateUser(data);
      toast.success("Pendaftaran berhasil!");

      const isAdmin = String(userRole || "").toLowerCase() === "admin";
      navigate(isAdmin ? "/admin/dashboard" : "/user/dashboard", {
        replace: true,
      });
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Terjadi kesalahan. Coba lagi.";
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-xl mx-auto flex flex-col justify-center h-full px-4 py-6">
        <h3 className="text-xl sm:text-2xl font-semibold text-black mb-2">
          Buat Akun Anda
        </h3>
        <p className="text-sm text-slate-700 mb-6">
          Silakan isi data untuk mendaftar
        </p>

        <form onSubmit={handleSignUp} aria-label="Form Signup">
          {/* Preview foto profil */}
          <PreviewImage 
            image={profilePic} 
            setImage={setProfilePic}
            label="Foto Profil"
            shape="circle" 
          />

          {/* Input fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              id={nameId}
              name="name"
              label="Nama"
              type="text"
              placeholder="Masukkan nama lengkap"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
                  title={
                    showPass ? "Sembunyikan password" : "Tampilkan password"
                  }
                >
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <Input
              id={adminInvTokenId}
              name="adminInviteToken"
              label="Admin Token (opsional)"
              type="text"
              placeholder="Token admin"
              autoComplete="off"
              value={adminInviteToken}
              onChange={(e) => setAdminInviteToken(e.target.value)}
            />
          </div>

          {/* Pilih stage hanya jika TIDAK pakai token admin */}
          {!adminInviteToken && (
            <div className="mb-4">
              <label htmlFor={stageId} className="text-sm text-slate-00 block mb-1">
                Tanggung Jawab Tahapan
              </label>
              <select
                id={stageId}
                className="input-box w-full bg-white outline-none border border-gray-300 rounded-md p-2"
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
              >
                <option value="">-- Pilih Tahapan --</option>
                {Object.keys(stageToRoleMap).map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tombol submit: samakan warna dengan login */}
          <button
            type="submit"
            disabled={submitting}
            className="relative w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60 mt-2"
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
              "Daftar"
            )}
          </button>

          <p className="text-sm text-slate-800 mt-4 text-center">
            Sudah punya akun?{" "}
            <Link
              to="/login"
              className="text-indigo-600 hover:text-indigo-700 font-medium underline"
            >
              Masuk di sini
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default SignUp;
