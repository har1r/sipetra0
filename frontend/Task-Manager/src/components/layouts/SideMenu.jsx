import React, { useContext, useMemo, useCallback, Fragment } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../../context/UserContexts";
import { ADMIN_MENU, USER_MENU } from "../../utils/data";

// Daftar path yang dibatasi + siapa saja yang boleh mengaksesnya
const CAN_ACCESS_PATH_BY_ROLE = {
  "/task/create": new Set(["penginput", "admin"]),
};

const SideMenu = ({ isMobile = false, onClose }) => {
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Tentukan base menu: admin vs user
  const sideMenuData = useMemo(() => {
    if (!user) return [];
    return (user.role || "").toLowerCase() === "admin" ? ADMIN_MENU : USER_MENU;
  }, [user]);

  // Terapkan filter berdasarkan role dan aturan akses per-path
  const filteredMenu = useMemo(() => {
    if (!user) return [];
    const role = (user.role || "").toLowerCase();

    return sideMenuData.filter((item) => {
      const allowedSet = CAN_ACCESS_PATH_BY_ROLE[item.path];
      // Jika path tidak dibatasi: tampilkan
      if (!allowedSet) return true;
      // Jika dibatasi: tampilkan hanya bila role diizinkan
      return allowedSet.has(role);
    });
  }, [sideMenuData, user]);

  const activePath = location.pathname;

  const onMenuClick = useCallback(
    (e) => {
      const path = e.currentTarget.dataset.path;
      if (!path) return;

      if (path === "logout") {
        localStorage.removeItem("token");
        clearUser();
        navigate("/login", { replace: true });
        onClose?.();
        return;
      }

      navigate(path, { replace: activePath === path });
      onClose?.();
    },
    [activePath, clearUser, navigate, onClose]
  );

  if (!user) return null;

  const initials = (user?.name || "")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleBadge =
    (user.role || "").toLowerCase() === "admin"
      ? "Admin"
      : (user.role || "").charAt(0).toUpperCase() + (user.role || "").slice(1);

  // =============== UI blok yang dipakai di desktop & mobile ===============
  const MenuInner = (
    <div className="flex h-full w-64 flex-col bg-white">
      {/* User Card */}
      <div className="flex flex-col items-center justify-center px-5 pt-6 pb-5 border-b border-slate-200/60 bg-gradient-to-b from-white to-slate-50/40">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-indigo-400/20 blur-md" aria-hidden />
          {user.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt={`Foto profil ${user.name}`}
              className="relative h-20 w-20 rounded-full object-cover ring-2 ring-indigo-500/30 shadow-sm"
              loading="lazy"
            />
          ) : (
            <div
              aria-hidden
              className="relative grid h-20 w-20 place-items-center rounded-full bg-slate-100 text-slate-600 ring-2 ring-indigo-500/20 shadow-sm"
            >
              <span className="text-xl font-semibold">{initials || "U"}</span>
            </div>
          )}
        </div>

        <span className="mt-2 inline-flex items-center rounded-full bg-indigo-600 px-2.5 py-0.5 text-[11px] font-medium text-white shadow-sm">
          {roleBadge}
        </span>

        <h5 className="mt-2 line-clamp-1 text-base font-semibold text-slate-900">
          {user.name}
        </h5>
        <p className="max-w-[200px] truncate text-[12px] text-slate-500">{user.email}</p>
      </div>

      {/* Menu List */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="flex flex-col">
          {filteredMenu.map((item) => {
            const isActive = Array.isArray(item.match)
              ? item.match.some((p) => activePath.startsWith(p))
              : activePath === item.path;

            return (
              <li key={item.label}>
                <button
                  type="button"
                  data-path={item.path}
                  onClick={onMenuClick}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "group relative flex w-full items-center gap-3 px-5 py-3 text-left text-[15px] transition-colors duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {/* Left accent bar */}
                  <span
                    aria-hidden
                    className={[
                      "absolute left-0 top-0 h-full w-1 rounded-r-md transition-all duration-200",
                      isActive ? "bg-indigo-600" : "bg-transparent group-hover:bg-indigo-200",
                    ].join(" ")}
                  />

                  {item.icon && (
                    <item.icon
                      className={[
                        "text-[20px]",
                        isActive ? "text-indigo-600" : "text-slate-500 group-hover:text-slate-700",
                      ].join(" ")}
                      aria-hidden
                    />
                  )}

                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );

  // ============================ Render modes ============================
  if (isMobile) {
    return (
      <aside id="mobile-sidebar" className="h-full w-64 bg-white border-r border-slate-200/70 shadow-lg">
        {MenuInner}
      </aside>
    );
  }

  return (
    <Fragment>
      {/* Spacer untuk menjaga layout (ambil lebar 16rem) */}
      <div className="hidden lg:block w-64 shrink-0" aria-hidden />

      {/* Aside fixed */}
      <aside
        className="hidden lg:flex fixed left-0 top-[64px] z-30 h-[calc(100vh-64px)] w-64 border-r border-slate-200/70 bg-white shadow-sm"
        aria-label="Menu samping"
      >
        {MenuInner}
      </aside>
    </Fragment>
  );
};

export default React.memo(SideMenu);