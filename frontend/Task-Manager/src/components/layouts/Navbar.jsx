import { useState } from "react";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import SideMenu from "./SideMenu";

const Navbar = () => {
  const [openSideMenu, setOpenSideMenu] = useState(false);

  const toggleMenu = () => setOpenSideMenu((prev) => !prev);
  const closeMenu = () => setOpenSideMenu(false);

  return (
    <nav
      className="sticky top-0 z-40 w-full border-b border-emerald-200/50 
                 bg-gradient-to-r from-emerald-50 via-lime-50 to-white/80 
                 backdrop-blur-md shadow-sm"
      role="navigation"
      aria-label="main-navigation"
    >
      <div className="relative flex h-16 w-full items-center justify-between px-4 sm:px-6 md:px-8">
        {/* 🔹 Brand Text */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3 select-none">
          {/* Wordmark */}
          <div className="leading-tight">
            <div className="bg-gradient-to-r from-emerald-700 to-lime-600 bg-clip-text text-transparent text-lg font-extrabold tracking-[0.18em]">
              SIPETRA
            </div>
            <div className="text-[11px] font-medium text-emerald-700/70">
              Sistem Informasi Pelayanan Efektif Terpantau & Rapi
            </div>
          </div>
        </div>

        {/* 🔸 Tombol Menu Mobile */}
        <button
          type="button"
          className="ml-auto inline-flex items-center justify-center rounded-lg p-2 
                     text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 lg:hidden"
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

      {/* 🔸 Mobile Side Menu (Overlay) */}
      {openSideMenu && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={closeMenu}
            aria-hidden="true"
          />

          {/* Panel Menu */}
          <div
            id="mobile-sidebar"
            className="relative w-72 max-w-[80%] translate-x-0 
                       bg-gradient-to-b from-white via-emerald-50 to-lime-50 
                       border-l border-emerald-200/50 shadow-xl 
                       backdrop-blur-md transition-transform duration-200 ease-out"
          >
            {/* Tombol Close di panel */}
            <button
              onClick={closeMenu}
              className="absolute top-3 right-9 rounded-md p-2 
                         text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 lg:hidden"
              aria-label="Close menu"
            >
              <HiOutlineX className="h-6 w-6" />
            </button>

            {/* Menu isi */}
            <SideMenu isMobile />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
