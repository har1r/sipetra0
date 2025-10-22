import { useContext } from "react";
import { UserContext } from "../../context/UserContexts";

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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-1">
        {/* Side menu */}
        <aside className="hidden lg:block w-64 border-r border-gray-200/50">
          <SideMenu />
        </aside>

        {/* Main content */}
        <main className="flex-1 p-5 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
