import React, { useContext } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { UserContext } from "../context/UserContexts";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const normalizeRole = (v) => String(v || "").toLowerCase().trim().replace(/\u00A0/g, "");

export default function PrivateRoute({ allowedRoles = [] }) {
  const { user, loading } = useContext(UserContext);
  const location = useLocation();

  if (loading) return <LoadingSpinner />;

  // Belum login → ke /login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Cek role bila dibatasi
  const userRole = normalizeRole(user.role);
  const allowed = new Set(allowedRoles.map(normalizeRole));
  if (allowed.size > 0 && !allowed.has(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // OK
  return <Outlet />;
}

// import React, { useContext } from "react";
// import { Outlet, Navigate } from "react-router-dom";
// import { UserContext } from "../context/userContext";
// import LoadingSpinner from "../components/ui/LoadingSpinner";

// function PrivateRoute({ allowedRoles = [] }) {
//   const { user, loading } = useContext(UserContext);

//   // =============================
//   // STEP 1: Tampilkan spinner saat user masih loading
//   // =============================
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
//         <LoadingSpinner />
//       </div>
//     );
//   }

//   // =============================
//   // STEP 2: Redirect ke login jika tidak ada user
//   // =============================
//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }

//   // =============================
//   // STEP 3: Bersihkan role user dari spasi/karakter tak terlihat
//   // =============================
//   const userRole = user.role?.toLowerCase().trim().replace(/\u00A0/g, "");

//   // =============================
//   // STEP 4: Cek apakah user termasuk allowedRoles
//   // =============================
//   if (allowedRoles.length > 0) {
//     const allowedSet = new Set(
//       allowedRoles.map(r => r.toLowerCase().trim().replace(/\u00A0/g, ""))
//     );

//     if (!allowedSet.has(userRole)) {
//       // Jika tidak diizinkan, redirect ke unauthorized
//       return <Navigate to="/unauthorized" replace />;
//     }
//   }

//   // =============================
//   // STEP 5: Render nested routes
//   // =============================
//   return <Outlet />;
// }

// export default PrivateRoute;


