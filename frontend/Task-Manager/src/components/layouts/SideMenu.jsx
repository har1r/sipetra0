import React, { useContext, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UserContext from "../../context/UserContexts";
// Import getMenuByRole, kita tidak butuh ADMIN_MENU & USER_MENU lagi secara langsung
import { getMenuByRole } from "../../utils/data";
import { HiOutlineLogout } from "react-icons/hi";

const SideMenu = ({ isMobile = false, onClose }) => {
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Ambil menu secara dinamis berdasarkan role dari logic terpusat di data.js
  const menuItems = useMemo(() => {
    return getMenuByRole(user?.role);
  }, [user?.role]);

  const onMenuClick = useCallback(
    (path) => {
      if (!path) return;
      if (path === "logout") {
        localStorage.removeItem("token");
        clearUser();
        navigate("/login", { replace: true });
      } else {
        // Navigasi ke path, replace jika sudah di path yang sama
        navigate(path, { replace: location.pathname === path });
      }
      if (onClose) onClose();
    },
    [location.pathname, clearUser, navigate, onClose],
  );

  if (!user) return null;

  const initials = (user?.name || "")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col h-full w-full bg-white">
      {/* 👤 Profil User */}
      <div className="p-6 shrink-0">
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-white shadow-sm border border-slate-100">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-inner">
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-800">
              {user.name}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              {user.role}
            </p>
          </div>
        </div>
      </div>

      {/* Navigasi Utama */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <p className="px-4 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
          Menu Utama
        </p>

        {menuItems.map((item) => {
          // Menggunakan array match untuk menentukan status aktif (lebih akurat)
          const isActive = Array.isArray(item.match)
            ? item.match.some(
                (p) =>
                  location.pathname === p ||
                  location.pathname.startsWith(p + "/"),
              )
            : location.pathname === item.path;

          return (
            <button
              key={item.id} // Gunakan id dari registry untuk key yang lebih stabil
              onClick={() => onMenuClick(item.path)}
              className={`group flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                isActive
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                  : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
            >
              {item.icon && (
                <item.icon
                  size={20}
                  className={
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-emerald-600"
                  }
                />
              )}
              <span
                className={`font-medium ${isActive ? "text-white" : "text-slate-600"}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer - Logout */}
      <div className="p-4 mt-auto border-t border-slate-100 shrink-0 bg-white">
        <button
          onClick={() => onMenuClick("logout")}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors"
        >
          <HiOutlineLogout size={20} />
          <span>Keluar Aplikasi</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(SideMenu);

// import React, { useContext, useMemo, useCallback, Fragment } from "react";
// import { useNavigate, useLocation } from "react-router-dom";

// import UserContext from "../../context/UserContexts";
// import { ADMIN_MENU, USER_MENU } from "../../utils/data";

// const CAN_ACCESS_PATH_BY_ROLE = {
//   "/task/create": new Set(["penginput", "admin"]),
// };

// const SideMenu = ({ isMobile = false, onClose }) => {
//   const { user, clearUser } = useContext(UserContext);
//   const navigate = useNavigate();
//   const location = useLocation();

//   // Tentukan menu berdasarkan role
//   const sideMenuData = useMemo(() => {
//     if (!user) return [];
//     return (user.role || "").toLowerCase() === "admin" ? ADMIN_MENU : USER_MENU;
//   }, [user]);

//   // Filter menu sesuai role & akses path
//   const filteredMenu = useMemo(() => {
//     if (!user) return [];
//     const role = (user.role || "").toLowerCase();

//     return sideMenuData.filter((item) => {
//       const allowedSet = CAN_ACCESS_PATH_BY_ROLE[item.path];
//       if (!allowedSet) return true;
//       return allowedSet.has(role);
//     });
//   }, [sideMenuData, user]);

//   const activePath = location.pathname;

//   const onMenuClick = useCallback(
//     (e) => {
//       const path = e.currentTarget.dataset.path;
//       if (!path) return;

//       if (path === "logout") {
//         localStorage.removeItem("token");
//         clearUser();
//         navigate("/login", { replace: true });
//         onClose?.();
//         return;
//       }

//       navigate(path, { replace: activePath === path });
//       onClose?.();
//     },
//     [activePath, clearUser, navigate, onClose],
//   );

//   if (!user) return null;

//   const initials = (user?.name || "")
//     .split(" ")
//     .map((s) => s[0])
//     .join("")
//     .slice(0, 2)
//     .toUpperCase();

//   const roleBadge =
//     (user.role || "").toLowerCase() === "admin"
//       ? "Admin"
//       : (user.role || "").charAt(0).toUpperCase() + (user.role || "").slice(1);

//   // ==================== UI utama sidebar ====================
//   const MenuInner = (
//     <div className="flex h-full w-64 flex-col bg-gradient-to-b from-white via-emerald-50 to-lime-50 border-r border-emerald-200/40">
//       {/* Kartu User */}
//       <div className="flex flex-col items-center justify-center px-5 pt-6 pb-5 border-b border-emerald-200/40 bg-white/60 backdrop-blur-md">
//         <div className="relative">
//           <div
//             className="absolute inset-0 rounded-full bg-emerald-400/20 blur-md"
//             aria-hidden
//           />
//           {user.profileImageUrl ? (
//             <img
//               src={user.profileImageUrl}
//               alt={`Foto profil ${user.name}`}
//               className="relative h-20 w-20 rounded-full object-cover ring-2 ring-emerald-500/30 shadow-sm"
//               loading="lazy"
//             />
//           ) : (
//             <div
//               aria-hidden
//               className="relative grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400/30 shadow-sm"
//             >
//               <span className="text-xl font-semibold">{initials || "U"}</span>
//             </div>
//           )}
//         </div>

//         <span className="mt-2 inline-flex items-center rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-medium text-white shadow-sm">
//           {roleBadge}
//         </span>

//         <h5 className="mt-2 line-clamp-1 text-base font-semibold text-gray-800">
//           {user.name}
//         </h5>
//         <p className="max-w-[200px] truncate text-[12px] text-gray-500">
//           {user.email}
//         </p>
//       </div>

//       {/* Daftar Menu */}
//       <nav className="flex-1 overflow-y-auto py-3">
//         <ul className="flex flex-col">
//           {filteredMenu.map((item) => {
//             const isActive = Array.isArray(item.match)
//               ? item.match.some((p) => activePath.startsWith(p))
//               : activePath === item.path;

//             return (
//               <li key={item.label}>
//                 <button
//                   type="button"
//                   data-path={item.path}
//                   onClick={onMenuClick}
//                   aria-current={isActive ? "page" : undefined}
//                   className={[
//                     "group relative flex w-full items-center gap-3 px-5 py-3 text-left text-[15px] transition-colors duration-200",
//                     "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
//                     isActive
//                       ? "bg-emerald-100 text-emerald-700 font-medium"
//                       : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700",
//                   ].join(" ")}
//                 >
//                   {/* Accent bar kiri */}
//                   <span
//                     aria-hidden
//                     className={[
//                       "absolute left-0 top-0 h-full w-1 rounded-r-md transition-all duration-200",
//                       isActive
//                         ? "bg-emerald-600"
//                         : "bg-transparent group-hover:bg-emerald-300",
//                     ].join(" ")}
//                   />

//                   {item.icon && (
//                     <item.icon
//                       className={[
//                         "text-[20px]",
//                         isActive
//                           ? "text-emerald-600"
//                           : "text-gray-400 group-hover:text-emerald-600",
//                       ].join(" ")}
//                       aria-hidden
//                     />
//                   )}

//                   <span className="truncate">{item.label}</span>
//                 </button>
//               </li>
//             );
//           })}
//         </ul>
//       </nav>
//     </div>
//   );

//   // ================== Render desktop & mobile ==================
//   if (isMobile) {
//     return (
//       <aside
//         id="mobile-sidebar"
//         className="h-full w-64 bg-white/90 border-r border-emerald-200/40 shadow-lg backdrop-blur-md"
//       >
//         {MenuInner}
//       </aside>
//     );
//   }

//   return (
//     <Fragment>
//       <div className="hidden lg:block w-64 shrink-0" aria-hidden />
//       <aside
//         className="hidden lg:flex fixed left-0 top-[64px] z-30 h-[calc(100vh-64px)] w-64 border-r border-emerald-200/40 bg-white/70 backdrop-blur-md shadow-sm"
//         aria-label="Menu samping"
//       >
//         {MenuInner}
//       </aside>
//     </Fragment>
//   );
// };

// export default React.memo(SideMenu);
