import React, { useEffect, useState } from "react";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";

import SideMenu from "./SideMenu";

const Navbar = () => {
  const [openSideMenu, setOpenSideMenu] = useState(false);

  const toggleMenu = () => setOpenSideMenu((prev) => !prev);
  const closeMenu = () => setOpenSideMenu(false);

  // Lock scroll ketika menu mobile dibuka + tutup dengan ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    if (openSideMenu) {
      const prev = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = prev;
        window.removeEventListener("keydown", onKey);
      };
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [openSideMenu, closeMenu]);

  return (
    <nav
      className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white"
      role="navigation"
      aria-label="main-navigation"
    >
      <div className="relative flex h-16 w-full items-center justify-between px-4 sm:px-6 md:px-8">
        {/* 🔹 Brand (Logo + Text) di kiri dan sticky */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
          {/* logo */}
          <div className="inline-grid size-10 rounded-full overflow-hidden bg-indigo-600">
            <img
              src="/favicon-32x32.png"
              alt="Logo SIPETRA"
              className="size-full block object-cover"
            />
          </div>

          {/* Wordmark PETRA */}
          <div className="leading-tight">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-700 bg-clip-text text-transparent text-lg font-extrabold tracking-[0.18em]">
              SIPETRA
            </div>
            <div className="text-[11px] font-medium text-slate-500/90">
              Sistem Informasi Pelayanan Efektif Terpantau & Rapi
            </div>
          </div>
        </div>

        {/* Side menu button is still in the right */}
        <button
          type="button"
          className="ml-auto inline-flex items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 lg:hidden"
          onClick={toggleMenu}
          aria-label={openSideMenu ? "Close menu" : "Open menu"}
          aria-controls="mobile-sidebar"
          aria-expanded={openSideMenu}
        >
          {openSideMenu ? (
            <HiOutlineX className="h-6 w-6" />
          ) : (
            <HiOutlineMenu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile side menu (overlay) */}
      {openSideMenu && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* backdrop */}
          <div
            className="flex-1 bg-black/40"
            onClick={closeMenu}
            aria-hidden="true"
          />
          {/* panel */}
          <div
            id="mobile-sidebar"
            className="w-72 max-w-[80%] translate-x-0 bg-white shadow-xl ring-1 ring-slate-200 transition-transform duration-200 ease-out"
          >
            <SideMenu isMobile onClose={closeMenu} />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
