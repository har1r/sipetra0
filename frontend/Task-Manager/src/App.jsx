import React, { useContext, useEffect, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoadingSpinner from "./components/ui/LoadingSpinner";
import { Toaster } from "react-hot-toast";
import UserProvider from "./context/UserProvider";
import UserContext from "./context/UserContexts";

import { ROLE, DEFAULT_ROUTE_BY_ROLE } from "./utils/data";
import PrivateRoute from "./routes/PrivateRoute";

// === Auth Pages ===
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";

// === Lazy-loaded Pages ===
const Unauthorized = React.lazy(() =>
  import("./pages/Unauthorized/Unauthorized")
);
const Dashboard = React.lazy(() => import("./pages/Admin/AdminDashboard"));
const ManageTasks = React.lazy(() => import("./pages/Admin/ManageAdminTask"));
const TeamPerformance = React.lazy(() =>
  import("./pages/Admin/TeamPerformance")
);
const CreateTask = React.lazy(() => import("./pages/Task/CreateTask"));
const TaskDetailPublic = React.lazy(() => import("./pages/Detail/TaskDetail"));
const UpdateTask = React.lazy(() => import("./pages/Task/UpdateTask"));
const ExportSummary = React.lazy(() =>
  import("./pages/Detail/RecommendationLatter")
);
const UserDashboard = React.lazy(() => import("./pages/User/UserDashboard"));
const ManageUserTask = React.lazy(() => import("./pages/User/ManageUserTask"));

// === Root Redirect (berdasarkan role user) ===
const RootRedirect = () => {
  const { user, loading } = useContext(UserContext);

  if (loading) {
    // Spinner global ketika autentikasi masih berjalan
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Normalisasi role user → tentukan halaman utama sesuai role
  const role = String(user.role || "")
    .toLowerCase()
    .trim();
  const redirectPath = DEFAULT_ROUTE_BY_ROLE[role] || "/login";

  // Prefetch halaman penting sesuai role
  useEffect(() => {
    const prefetchPages = [];

    if (role === ROLE.ADMIN) {
      prefetchPages.push(
        import("./pages/Admin/AdminDashboard"),
        import("./pages/Admin/ManageAdminTask"),
        import("./pages/Task/UpdateTask"),
        import("./pages/Admin/TeamPerformance")
      );
    } else {
      prefetchPages.push(
        import("./pages/User/UserDashboard"),
        import("./pages/User/ManageUserTask")
      );
    }

    prefetchPages.push(
      import("./pages/Detail/TaskDetail"),
      import("./pages/Detail/RecommendationLatter"),
      import("./pages/Task/CreateTask")
    );

    Promise.all(prefetchPages).catch(() => {});
  }, [role]);

  return <Navigate to={redirectPath} replace />;
};

// === Main App ===
const App = () => {
  return (
    <UserProvider>
      <Router>
        <Toaster position="top-right" />

        {/* Suspense global: loading spinner tunggal untuk semua halaman lazy */}
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-[calc(100vh-100px)]">
              <LoadingSpinner />
            </div>
          }
        >
          <Routes>
            {/* Redirect root berdasarkan role */}
            <Route path="/" element={<RootRedirect />} />

            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* ADMIN only */}
            <Route element={<PrivateRoute allowedRoles={[ROLE.ADMIN]} />}>
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/tasks" element={<ManageTasks />} />
              <Route
                path="/admin/team-performance"
                element={<TeamPerformance />}
              />
            </Route>

            {/* USER only */}
            <Route
              element={
                <PrivateRoute
                  allowedRoles={[
                    ROLE.PENGINPUT,
                    ROLE.PENATA,
                    ROLE.PENELITI,
                    ROLE.PENGARSIP,
                    ROLE.PENGIRIM,
                  ]}
                />
              }
            >
              <Route path="/user/dashboard" element={<UserDashboard />} />
              <Route path="/user/tasks" element={<ManageUserTask />} />
            </Route>

            {/* ADMIN + PENGINPUT */}
            <Route
              element={
                <PrivateRoute allowedRoles={[ROLE.ADMIN, ROLE.PENGINPUT]} />
              }
            >
              <Route path="/task/create" element={<CreateTask />} />
              <Route path="/task/update/:id" element={<UpdateTask />} />
            </Route>

            {/* USER & ADMIN untuk laporan */}
            <Route
              element={
                <PrivateRoute
                  allowedRoles={[
                    ROLE.ADMIN,
                    ROLE.PENGINPUT,
                    ROLE.PENATA,
                    ROLE.PENELITI,
                    ROLE.PENGARSIP,
                    ROLE.PENGIRIM,
                  ]}
                />
              }
            >
              <Route
                path="/document/recommendation-latter"
                element={<ExportSummary />}
              />
              <Route path="/task-detail/:id" element={<TaskDetailPublic />} />
            </Route>

            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </UserProvider>
  );
};

export default App;
