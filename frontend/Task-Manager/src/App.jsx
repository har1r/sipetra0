import React, { useContext, useEffect, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoadingSpinner from "./components/ui/LoadingSpinner";
import Notification from "./components/ui/Notification";
import UserProvider, { UserContext } from "./context/UserContexts";

// ==== Lazy load pages (route-level code splitting) ====
// Memecah (split) file kode React jadi bagian-bagian kecil dan baru dimuat (load) ketika dibutuhkan.
// Hemat waktu loading dan bikin aplikasi terasa lebih ringan.
const Login = React.lazy(() => import("./pages/Auth/Login"));
const SignUp = React.lazy(() => import("./pages/Auth/SignUp"));

const Unauthorized = React.lazy(() =>
  import("./pages/Unauthorized/Unauthorized")
);
const TaskDetailPublic = React.lazy(() =>
  import("./pages/Public/TaskDetailPublic")
);

const Dashboard = React.lazy(() => import("./pages/Admin/Dashboard"));
const ManageTasks = React.lazy(() => import("./pages/Admin/ManageTask"));
const TeamPerformance = React.lazy(() =>
  import("./pages/Admin/TeamPerformance")
);
const UpdateTask = React.lazy(() => import("./pages/Admin/UpdateTask"));

const ExportSummary = React.lazy(() => import("./pages/Summary/ExportSummary"));
const CreateTask = React.lazy(() => import("./pages/Task/CreateTask"));

const ManageUserTask = React.lazy(() => import("./pages/User/ManageUserTask"));
const UserDashboard = React.lazy(() => import("./pages/User/UserDashboard"));

import PrivateRoute from "./routes/PrivateRoute";
import { ROLE, DEFAULT_ROUTE_BY_ROLE } from "./utils/data";

// ==== Root redirect component (berdasarkan role) ====
const Root = () => {
  const { user, loading } = useContext(UserContext);

  if (loading) {
    return <LoadingSpinner />;
  }
  //tanpa replace → Navigate menambahkan halaman tujuan (/login) ke dalam riwayat browser (history stack).
  //user bisa klik tombol Back di browser dan balik lagi ke halaman sebelumnya (misalnya /dashboard) walaupun dia belum login.
  if (!user) return <Navigate to="/login" replace />; //

  // Normalisasi role → tentukan rute tujuan
  const role = String(user.role || "")
    .toLowerCase()
    .trim(); //trim() itu fungsinya menghapus spasi (dan karakter whitespace lain) di awal dan akhir string.
  const target = DEFAULT_ROUTE_BY_ROLE[role] || "/login";

  // Prefetch halaman sesuai role agar transisi cepat
  useEffect(() => {
    //komponen di-load lebih dulu di belakang layar, jadi nanti waktu dipakai user, tampilnya lebih cepat karena file-nya sudah siap.
    const warmups = [];
    if (role === ROLE.ADMIN) {
      warmups.push(
        import("./pages/Admin/Dashboard"),
        import("./pages/Admin/ManageTask"),
        import("./pages/Admin/UpdateTask"),
        import("./pages/Admin/TeamPerformance")
      );
    } else {
      warmups.push(
        import("./pages/User/UserDashboard"),
        import("./pages/User/ManageUserTask")
      );
    }
    warmups.push(import("./pages/Public/TaskDetailPublic"));
    warmups.push(import("./pages/Summary/ExportSummary"));
    warmups.push(import("./pages/Task/CreateTask"));
    Promise.all(warmups).catch(() => {}); //semua import dijalankan paralel. kalau ada error pas load, diabaikan saja (biar aplikasi nggak crash).
  }, [role]);

  return <Navigate to={target} replace />;
};

const App = () => {
  return (
    <UserProvider>
      <Router>
        {/* Notification global (tidak perlu lazy) */}
        <Notification />

        {/* Satu Suspense global untuk semua route lazy */}
        {/* komponen bawaan React yang dipakai untuk nunggu sesuatu yang lagi di-load secara async (misalnya komponen dengan React.lazy). */}
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Root redirect berdasarkan role */}
            <Route path="/" element={<Root />} />

            {/* Public Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Public detail task */}
            {/* <Route path="/task-detail/:id" element={<TaskDetailPublic />} /> */}

            {/* ADMIN only */}
            <Route element={<PrivateRoute allowedRoles={[ROLE.ADMIN]} />}>
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/tasks" element={<ManageTasks />} />
              <Route path="/admin/task/update/:id" element={<UpdateTask />} />
              <Route path="/task-detail/:id" element={<TaskDetailPublic />} />
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
              <Route path="/task-detail/:id" element={<TaskDetailPublic />} />
            </Route>

            {/* USER PENGINPUT & ADMIN */}
            <Route
              element={
                <PrivateRoute allowedRoles={[ROLE.ADMIN, ROLE.PENGINPUT]} />
              }
            >
              <Route path="/task/create" element={<CreateTask />} />
            </Route>

            {/* USER & ADMIN */}
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
                path="/reports/daftar-surat-pengantar"
                element={<ExportSummary />}
              />
            </Route>

            {/* 404 fallback → ke root (akan di-redirect oleh <Root />) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </UserProvider>
  );
};

export default App;
