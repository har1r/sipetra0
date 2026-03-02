// pages/Dashboard/Dashboard.jsx
import React, { useContext, useMemo } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import InfoCard from "../../components/cards/InfoCard";
import DelayedTaskTable from "../../components/tables/DelayedTaskTable";
import DashboardBarChart from "../../components/charts/DashboardBarChart";
import CardSkeleton from "../../components/Skeletons/CardSkeleton";

import UserContext from "../../contexts/UserContexts";
import { UseUserAuth } from "../../hooks/UseUserAuth";
import { useManageDashboard } from "../../hooks/useManageDashboard";
import { formatDateId } from "../../utils/formatDateId";

const Dashboard = () => {
  UseUserAuth();
  const { user } = useContext(UserContext);
  const { state, actions } = useManageDashboard();
  const { cardStats, delayedAlerts, subdistrictData, villageData, isLoading } = state;

  const todayLabel = useMemo(
    () => formatDateId(new Date(), { withWeekday: true }),
    []
  );

  // Helper untuk render Empty State agar kode lebih bersih
  const RenderEmptyState = ({ message }) => (
    <div className="w-full py-16 bg-white/40 border-2 border-dashed border-emerald-200 rounded-[2.5rem] flex flex-col items-center justify-center text-emerald-600 animate-in fade-in duration-700">
      <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p className="font-bold italic text-sm tracking-wide uppercase opacity-60">{message}</p>
    </div>
  );

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="min-h-screen pb-12 space-y-8 animate-in fade-in duration-500">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-emerald-100">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-emerald-900 tracking-tight">
              Halo, <span className="text-emerald-600">{user?.name}</span>
            </h1>
            <p className="text-sm font-medium text-emerald-600/80 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {todayLabel} • Dashboard Monitoring Laporan
            </p>
          </div>
          <button
            onClick={actions.refresh}
            className="group flex items-center gap-2 text-xs font-bold bg-emerald-50 text-emerald-700 px-5 py-3 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-sm shadow-emerald-200/50"
          >
            <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            REFRESH DATA
          </button>
        </header>

        <main className="space-y-10">
          
          {/* 1. CRITICAL ALERTS SECTION */}
          <section className="space-y-4">
            {isLoading ? (
              <div className="w-full h-48 bg-slate-100 animate-pulse rounded-[2.5rem] border border-slate-200" />
            ) : delayedAlerts.tasks.length > 0 ? (
              <div className="animate-in slide-in-from-top-5 duration-700">
                <DelayedTaskTable tasks={delayedAlerts.tasks} />
              </div>
            ) : (
              <RenderEmptyState message="Tidak ada antrian berkas terlambat" />
            )}
          </section>

          {/* 2. STATS OVERVIEW CARDS */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)
            ) : cardStats.length > 0 ? (
              cardStats.map((item, idx) => <InfoCard key={idx} item={item} />)
            ) : (
              <div className="col-span-full">
                <RenderEmptyState message="Data statistik belum tersedia" />
              </div>
            )}
          </section>

          {/* 3. VISUALIZATION SECTION */}
          <section className="grid grid-cols-1 gap-10">
            {isLoading ? (
              // Chart Skeleton
              <div className="space-y-10">
                <div className="w-full h-[400px] bg-slate-50 animate-pulse rounded-[2.5rem] border border-slate-100" />
                <div className="w-full h-[400px] bg-slate-50 animate-pulse rounded-[2.5rem] border border-slate-100" />
              </div>
            ) : (
              <>
                {/* Chart Kecamatan */}
                {subdistrictData.chartData.length > 0 ? (
                  <div className="bg-white/40 p-1 rounded-[2.5rem] border border-emerald-50">
                    <DashboardBarChart 
                      data={subdistrictData} 
                      title="Distribusi Layanan per Kecamatan"
                    />
                  </div>
                ) : (
                  <RenderEmptyState message="Data grafik kecamatan kosong" />
                )}

                {/* Chart Kelurahan */}
                {villageData.chartData.length > 0 ? (
                  <div className="bg-white/40 p-1 rounded-[2.5rem] border border-emerald-50">
                    <DashboardBarChart 
                      data={villageData} 
                      xKey="village" 
                      title="Analisis Layanan per Kelurahan"
                    />
                  </div>
                ) : (
                  <RenderEmptyState message="Data grafik kelurahan kosong" />
                )}
              </>
            )}
          </section>

        </main>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;