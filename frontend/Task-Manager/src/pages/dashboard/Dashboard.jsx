// pages/Dashboard/Dashboard.jsx
import React, { useContext, useMemo } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import InfoCard from "../../components/cards/InfoCard";
import DelayedTaskTable from "../../components/tables/DelayedTaskTable";
import CardSkeleton from "../../components/Skeletons/CardSkeleton";

import UserContext from "../../contexts/UserContexts";
import { UseUserAuth } from "../../hooks/UseUserAuth";
import { useDashboardData } from "../../hooks/useManageDashboard";
import { formatDateId } from "../../utils/formatDateId";

const Dashboard = () => {
  UseUserAuth();
  const { user } = useContext(UserContext);

  // Destructuring dari state dan actions sesuai struktur useDashboardData terbaru
  const { state, actions } = useDashboardData();
  const { cardStats, delayedAlerts, isLoading } = state;
  console.log(delayedAlerts);

  const todayLabel = useMemo(
    () => formatDateId(new Date(), { withWeekday: true }),
    [],
  );

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="min-h-screen pb-10">
        {/* Header Section */}
        <header className="mb-8 bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-md border border-emerald-200/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-emerald-800">
                Halo, {user?.name}
              </h1>
              <p className="text-sm text-emerald-600">
                {todayLabel} • Ringkasan Statistik Laporan
              </p>
            </div>
            {/* Tombol Refresh Opsional */}
            <button
              onClick={actions.refresh}
              className="text-xs bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl hover:bg-emerald-200 transition font-medium"
            >
              Refresh Data
            </button>
          </div>
        </header>

        {/* Content Section */}
        <main className="space-y-8">
          {/* Stats Section: Loading atau Grid Data */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : cardStats.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {cardStats.map((item, idx) => (
                <InfoCard key={idx} item={item} />
              ))}
            </div>
          ) : (
            /*  Empty State: Jika benar-benar tidak ada data */
            <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-dashed border-emerald-300">
              <div className="flex flex-col items-center gap-2">
                <div className="p-4 bg-emerald-50 rounded-full text-emerald-400">
                  {/* Anda bisa tambahkan icon search/folder kosong di sini */}
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <p className="text-emerald-600 font-medium">
                  Belum ada data statistik untuk ditampilkan.
                </p>
              </div>
            </div>
          )}

          {/* Alert Section: Muncul paling atas jika ada data tertunda */}
          {!isLoading && delayedAlerts.count > 0 && (
            <section className="animate-in fade-in slide-in-from-top-4 duration-700">
              <DelayedTaskTable tasks={delayedAlerts.tasks} />
            </section>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
