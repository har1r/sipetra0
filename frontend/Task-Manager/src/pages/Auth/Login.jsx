import React, { useContext, useState, useId } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";
import toast from "react-hot-toast";

import AuthLayout from "../../components/layouts/AuthLayout";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance";
import UserContext from "../../context/UserContexts";
import { API_PATHS } from "../../utils/apiPaths";

const Login = () => {
  const navigate = useNavigate();
  const { updateUser } = useContext(UserContext);

  const emailInputId = useId();
  const passwordInputId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      console.error("❌ Login Error:", error);
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
        <h2 className="text-3xl font-bold text-slate-800 mb-2 text-center md:text-left leading-tight">
          Masuk Akun Anda
        </h2>
        <p className="text-slate-600 text-sm mb-6 text-center md:text-left">
          Silakan masuk menggunakan akun terdaftar untuk melanjutkan.
        </p>

        {/* === Form Login === */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* 📧 Email */}
          <div className="relative">
            <FaEnvelope className="absolute left-3 top-3.5 text-slate-400" />
            <input
              id={emailInputId}
              type="email"
              placeholder="Alamat email"
              className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* 🔒 Password */}
          <div className="relative">
            <FaLock className="absolute left-3 top-3.5 text-slate-400" />
            <input
              id={passwordInputId}
              type={showPassword ? "text" : "password"}
              placeholder="Kata sandi"
              className="w-full rounded-lg border border-slate-300 pl-10 pr-10 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-500 hover:text-indigo-600"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* 🔘 Tombol Login */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-lg shadow-md hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {isSubmitting ? "Proses..." : "Masuk"}
          </button>

          {/* 🔘 Tombol Sign Up */}
          <Link
            to="/signup"
            className="block w-full text-center border border-indigo-600 text-indigo-600 font-semibold py-2.5 rounded-lg hover:bg-indigo-50 transition"
          >
            Buat Akun Baru
          </Link>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;

// import { useContext, useState, useId } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { FaEye, FaEyeSlash } from "react-icons/fa";
// import toast from "react-hot-toast";

// import AuthLayout from "../../components/layouts/AuthLayout";
// import Input from "../../components/inputs/Input";
// import { validateEmail } from "../../utils/helper";
// import axiosInstance from "../../utils/axiosInstance";
// import UserContext from "../../context/UserContexts";
// import { API_PATHS } from "../../utils/apiPaths";

// const Login = () => {
//   const navigate = useNavigate();
//   const { updateUser } = useContext(UserContext);

//   // 🧠 Generate unique ID untuk input
//   const emailInputId = useId();
//   const passwordInputId = useId();

//   // 💾 State untuk form
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // 🧩 Handler login utama
//   const handleLogin = async (e) => {
//     e.preventDefault();

//     const safeEmail = email.trim().toLowerCase();
//     const safePassword = password.trim();

//     // 🔍 Validasi input sebelum kirim
//     if (!safeEmail || !safePassword) {
//       toast.error("Email dan password wajib diisi.");
//       return;
//     }
//     if (!validateEmail(safeEmail)) {
//       toast.error("Format email tidak valid.");
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       // 🚀 Kirim request ke backend
//       const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
//         email: safeEmail,
//         password: safePassword,
//       });

//       const { message, user, token, lastLogin } = response?.data || {};

//       // ⚠️ Validasi data dari backend
//       if (!token || !user) {
//         throw new Error("Token atau data pengguna tidak ditemukan.");
//       }

//       // 💾 Simpan token dan data user
//       localStorage.setItem("token", token);
//       updateUser(user);

//       // 🎉 Notifikasi sukses
//       toast.success(message || "Login berhasil!");
//       console.info("🕐 Last login:", lastLogin);

//       // 🔀 Arahkan ke dashboard sesuai role
//       const isAdmin = user.role?.toLowerCase() === "admin";
//       navigate(isAdmin ? "/admin/dashboard" : "/user/dashboard", {
//         replace: true,
//       });
//     } catch (error) {
//       console.error("❌ Login Error:", error);

//       // 🎯 Tangani error dengan pesan yang sesuai backend
//       const status = error?.response?.status;
//       const backendMsg = error?.response?.data?.message;

//       let displayMsg = "Gagal login. Coba lagi nanti.";
//       if (status === 400)
//         displayMsg = backendMsg || "Email dan password wajib diisi.";
//       else if (status === 401)
//         displayMsg = backendMsg || "Email atau password salah.";
//       else if (status === 500) displayMsg = "Terjadi kesalahan pada server.";
//       else if (backendMsg) displayMsg = backendMsg;

//       toast.error(displayMsg);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <AuthLayout>
//       <div className="mx-auto flex h-full w-full max-w-xl flex-col justify-center px-4 py-8">
//         <div className="mb-6 text-center">
//           <h1 className="text-2xl font-semibold text-slate-900">
//             Masuk Akun Anda
//           </h1>
//           <p className="mt-1 text-sm text-slate-600">
//             Silakan masukkan email dan password Anda.
//           </p>
//         </div>

//         <form
//           onSubmit={handleLogin}
//           className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm"
//           aria-label="Form Login"
//         >
//           {/* 📧 Input Email */}
//           <Input
//             id={emailInputId}
//             name="email"
//             label="Email"
//             type="email"
//             placeholder="Masukkan email terdaftar"
//             autoComplete="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//             hint="Gunakan email yang sudah terdaftar."
//           />

//           {/* 🔒 Input Password */}
//           <div>
//             <label
//               htmlFor={passwordInputId}
//               className="mb-1 block text-sm font-medium text-slate-700"
//             >
//               Password <span className="text-red-500">*</span>
//             </label>
//             <div className="relative">
//               <input
//                 id={passwordInputId}
//                 name="password"
//                 type={showPassword ? "text" : "password"}
//                 placeholder="Masukkan password"
//                 autoComplete="current-password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//                 className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-12 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword((prev) => !prev)}
//                 className="absolute inset-y-0 right-0 m-1 rounded-md px-3 text-slate-600 hover:bg-slate-100 focus:outline-none"
//                 title={
//                   showPassword ? "Sembunyikan password" : "Tampilkan password"
//                 }
//               >
//                 {showPassword ? <FaEyeSlash /> : <FaEye />}
//               </button>
//             </div>
//           </div>

//           {/* 🔘 Tombol Login */}
//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className="relative w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
//           >
//             {isSubmitting ? (
//               <span className="inline-flex items-center justify-center gap-2">
//                 <svg
//                   className="h-4 w-4 animate-spin"
//                   viewBox="0 0 24 24"
//                   aria-hidden="true"
//                 >
//                   <circle
//                     className="opacity-25"
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="3"
//                     fill="none"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8v3A5 5 0 007 12H4z"
//                   />
//                 </svg>
//                 Memproses…
//               </span>
//             ) : (
//               "Masuk"
//             )}
//           </button>

//           {/* 🔗 Link ke register */}
//           <p className="text-center text-sm text-slate-700">
//             Belum punya akun?{" "}
//             <Link
//               to="/signup"
//               className="font-medium text-indigo-600 underline hover:text-indigo-700"
//             >
//               Daftar di sini
//             </Link>
//           </p>
//         </form>
//       </div>
//     </AuthLayout>
//   );
// };

// export default Login;
