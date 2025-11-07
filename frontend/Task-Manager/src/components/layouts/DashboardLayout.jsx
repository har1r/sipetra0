import { useContext } from "react";
import UserContext from "../../context/UserContexts";

import Navbar from "./Navbar";
import SideMenu from "./SideMenu";

const DashboardLayout = ({ children }) => {
  const { user, loading } = useContext(UserContext);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );

  if (!user) return null; // User is not logged in

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-lime-50 via-green-100 to-emerald-50 text-gray-800 ">
      <Navbar />
      <div className="flex flex-1">
        {/* Side menu */}
        <aside className="hidden lg:block w-64 border-r border-emerald-200/40 bg-white/70 shadow-sm">
          <SideMenu />
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-x-auto bg-white/60 shadow-inner">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
