import React, { useContext, useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Context & Logic
import UserProvider from "./context/UserProvider";
import UserContext from "./context/UserContexts";
import PrivateRoute from "./routes/PrivateRoute";
import { ROLE, DEFAULT_ROUTE_BY_ROLE } from "./utils/data";

// Components
import LoadingSpinner from "./components/ui/LoadingSpinner";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import ManageTask from "./pages/task/ManageTask"; // Import statis untuk performa menu utama

// === Lazy-loaded Pages ===
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));

const CreateTask = lazy(() => import("./pages/task/CreateTask"));
const UpdateTask = lazy(() => import("./pages/task/UpdateTask"));
const TaskDetail = lazy(() => import("./pages/task/TaskDetail"));

const TeamPerformance = lazy(() => import("./pages/report/TeamPerformance"));
const ReportHistory = lazy(() => import("./pages/report/ReportHistory"));

const Unauthorized = lazy(() => import("./pages/unauthorized/Unauthorized"));

const FullPageLoader = () => (
  <div className="flex justify-center items-center h-[calc(100vh-100px)]">
    <LoadingSpinner />
  </div>
);

// === Root Redirect ===
const RootRedirect = () => {
  const { user, loading } = useContext(UserContext);

  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  const role = String(user.role || "")
    .toLowerCase()
    .trim();
  const redirectPath = DEFAULT_ROUTE_BY_ROLE[role] || "/dashboard";

  // Prefetch halaman berdasarkan role
  useEffect(() => {
    const prefetch = (fn) => fn().catch(() => {});

    // Semua role pasti akses Dashboard & History
    prefetch(() => import("./pages/report/ReportHistory"));

    if (role === ROLE.ADMIN) {
      prefetch(() => import("./pages/report/TeamPerformance"));
    }
  }, [role]);

  return <Navigate to={redirectPath} replace />;
};

// === Main App ===
const App = () => {
  // Definisi grup role untuk mempermudah route protection
  const ALL_STAFF = Object.values(ROLE);
  const CREATOR_ROLES = [ROLE.ADMIN, ROLE.PENGINPUT];

  return (
    <UserProvider>
      <Router>
        <Toaster position="top-right" />

        <Suspense fallback={<FullPageLoader />}>
          <Routes>
            {/* Public & Auth */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* GROUP 1: Akses Semua Staff (Dashboard, Kelola, History) */}
            <Route element={<PrivateRoute allowedRoles={ALL_STAFF} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/manage-task/task" element={<ManageTask />} />
              <Route
                path="/document/recommendation-latter"
                element={<ReportHistory />}
              />
              <Route path="/task-detail/:id" element={<TaskDetail />} />
            </Route>

            {/* GROUP 2: Akses Pembuat (Admin & Penginput) */}
            <Route element={<PrivateRoute allowedRoles={CREATOR_ROLES} />}>
              <Route path="/task/create" element={<CreateTask />} />
              <Route path="/task/update/:id" element={<UpdateTask />} />
            </Route>

            {/* GROUP 3: Akses Khusus Admin */}
            <Route element={<PrivateRoute allowedRoles={[ROLE.ADMIN]} />}>
              <Route
                path="/admin/team-performance"
                element={<TeamPerformance />}
              />
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

// import React, { useContext, useEffect, Suspense } from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
// } from "react-router-dom";

// import LoadingSpinner from "./components/ui/LoadingSpinner";
// import { Toaster } from "react-hot-toast";
// import UserProvider from "./context/UserProvider";
// import UserContext from "./context/UserContexts";

// import { ROLE, DEFAULT_ROUTE_BY_ROLE } from "./utils/data";
// import PrivateRoute from "./routes/PrivateRoute";

// // === Auth Pages ===
// import Login from "./pages/Auth/Login";
// import SignUp from "./pages/Auth/SignUp";

// // === Lazy-loaded Pages ===
// const Unauthorized = React.lazy(
//   () => import("./pages/Unauthorized/Unauthorized"),
// );
// const Dashboard = React.lazy(() => import("./pages/Admin/AdminDashboard"));
// const TeamPerformance = React.lazy(
//   () => import("./pages/Admin/TeamPerformance"),
// );
// const CreateTask = React.lazy(() => import("./pages/Task/CreateTask"));
// const TaskDetail = React.lazy(() => import("./pages/Detail/TaskDetail"));
// const UpdateTask = React.lazy(() => import("./pages/Task/UpdateTask"));
// const ReportHistory = React.lazy(() => import("./pages/Detail/ReportHistory"));
// const UserDashboard = React.lazy(() => import("./pages/User/UserDashboard"));
// import ManageTask from "./pages/Task/ManageTask";

// // === Root Redirect (berdasarkan role user) ===
// const RootRedirect = () => {
//   const { user, loading } = useContext(UserContext);

//   if (loading) {
//     // Spinner global ketika autentikasi masih berjalan
//     return (
//       <div className="flex justify-center items-center h-[calc(100vh-100px)]">
//         <LoadingSpinner />
//       </div>
//     );
//   }

//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }

//   // Normalisasi role user → tentukan halaman utama sesuai role
//   const role = String(user.role || "")
//     .toLowerCase()
//     .trim();
//   const redirectPath = DEFAULT_ROUTE_BY_ROLE[role] || "/login";

//   // Prefetch halaman penting sesuai role
//   useEffect(() => {
//     const prefetchPages = [];

//     if (role === ROLE.ADMIN) {
//       prefetchPages.push(
//         import("./pages/Admin/AdminDashboard"),
//         import("./pages/Task/UpdateTask"),
//         import("./pages/Admin/TeamPerformance"),
//       );
//     } else {
//       prefetchPages.push(import("./pages/User/UserDashboard"));
//     }

//     prefetchPages.push(
//       import("./pages/Task/ManageTask"),
//       import("./pages/Detail/TaskDetail"),
//       import("./pages/Detail/ReportHistory"),
//       import("./pages/Task/CreateTask"),
//     );

//     Promise.all(prefetchPages).catch(() => {});
//   }, [role]);

//   return <Navigate to={redirectPath} replace />;
// };

// // === Main App ===
// const App = () => {
//   return (
//     <UserProvider>
//       <Router>
//         <Toaster position="top-right" />

//         {/* Suspense global: loading spinner tunggal untuk semua halaman lazy */}
//         <Suspense
//           fallback={
//             <div className="flex justify-center items-center h-[calc(100vh-100px)]">
//               <LoadingSpinner />
//             </div>
//           }
//         >
//           <Routes>
//             {/* Redirect root berdasarkan role */}
//             <Route path="/" element={<RootRedirect />} />

//             {/* Auth routes */}
//             <Route path="/login" element={<Login />} />
//             <Route path="/signup" element={<SignUp />} />
//             <Route path="/unauthorized" element={<Unauthorized />} />

//             {/* ADMIN only */}
//             <Route element={<PrivateRoute allowedRoles={[ROLE.ADMIN]} />}>
//               <Route path="/admin/dashboard" element={<Dashboard />} />
//               <Route
//                 path="/admin/team-performance"
//                 element={<TeamPerformance />}
//               />
//             </Route>

//             {/* USER only */}
//             <Route
//               element={
//                 <PrivateRoute
//                   allowedRoles={[
//                     ROLE.PENGINPUT,
//                     ROLE.PENATA,
//                     ROLE.PENELITI,
//                     ROLE.PENGARSIP,
//                     ROLE.PENGIRIM,
//                     ROLE.PENGECEK,
//                   ]}
//                 />
//               }
//             >
//               <Route path="/user/dashboard" element={<UserDashboard />} />
//             </Route>

//             {/* ADMIN + PENGINPUT */}
//             <Route
//               element={
//                 <PrivateRoute allowedRoles={[ROLE.ADMIN, ROLE.PENGINPUT]} />
//               }
//             >
//               <Route path="/task/create" element={<CreateTask />} />
//               <Route path="/task/update/:id" element={<UpdateTask />} />
//             </Route>

//             {/* USER & ADMIN untuk laporan */}
//             <Route
//               element={
//                 <PrivateRoute
//                   allowedRoles={[
//                     ROLE.ADMIN,
//                     ROLE.PENGINPUT,
//                     ROLE.PENATA,
//                     ROLE.PENELITI,
//                     ROLE.PENGARSIP,
//                     ROLE.PENGIRIM,
//                     ROLE.PENGECEK,
//                   ]}
//                 />
//               }
//             >
//               <Route path="/manage-task/task" element={<ManageTask />} />
//               <Route
//                 path="/document/recommendation-latter"
//                 element={<ReportHistory />}
//               />
//               <Route path="/task-detail/:id" element={<TaskDetail />} />
//             </Route>

//             {/* 404 fallback */}
//             <Route path="*" element={<Navigate to="/" replace />} />
//           </Routes>
//         </Suspense>
//       </Router>
//     </UserProvider>
//   );
// };

// export default App;
