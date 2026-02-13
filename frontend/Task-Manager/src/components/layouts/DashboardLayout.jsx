import { useContext } from "react";
import UserContext from "../../context/UserContexts";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu";

const DashboardLayout = ({ children }) => {
  const { user, loading } = useContext(UserContext);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 justify-center items-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-emerald-600 animate-pulse">
          Menyiapkan Dashboard...
        </p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-800 overflow-hidden">
      {/* Navbar di atas */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex flex-col w-72 border-r border-slate-200/60 bg-white shrink-0">
          <SideMenu />
        </aside>

        {/* Main content - Area Scroll */}
        <main className="flex-1 overflow-y-auto scroll-smooth z-0">
          <div className="max-w-7xl mx-auto p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

// import { useContext } from "react";
// import UserContext from "../../context/UserContexts";

// import Navbar from "./Navbar";
// import SideMenu from "./SideMenu";

// const DashboardLayout = ({ children }) => {
//   const { user, loading } = useContext(UserContext);

//   if (loading)
//     return (
//       <div className="flex justify-center items-center min-h-screen">
//         Loading...
//       </div>
//     );

//   if (!user) return null; // User is not logged in

//   return (
//     <div className="min-h-screen flex flex-col bg-gradient-to-br from-lime-50 via-green-100 to-emerald-50 text-gray-800 ">
//       <Navbar />
//       <div className="flex flex-1">
//         {/* Side menu */}
//         <aside className="hidden lg:block w-64 border-r border-emerald-200/40 bg-white/70 shadow-sm">
//           <SideMenu />
//         </aside>

//         {/* Main content */}
//         <main className="flex-1 p-6 overflow-x-auto bg-white/60 shadow-inner">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// };

// export default DashboardLayout;
