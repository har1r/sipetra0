import {
  LuLayoutDashboard,
  LuUsers,
  LuClipboardCheck,
  LuSquarePlus,
} from "react-icons/lu";
import { RiFolderHistoryLine } from "react-icons/ri";

const createOptions = (arr) => Object.freeze(arr.map((val) => ({ label: val, value: val })));

// 1. Roles Definition
export const ROLE = {
  ADMIN: "admin",
  PENGINPUT: "penginput",
  PENATA: "penata",
  PENELITI: "peneliti",
  PENGARSIP: "pengarsip",
  PENGIRIM: "pengirim",
  PENGECEK: "pengecek",
};

// 2. Default Routes
export const DEFAULT_ROUTE_BY_ROLE = {
  [ROLE.ADMIN]: "/admin/dashboard",
  // Gunakan pemetaan default untuk semua role non-admin
  ...Object.fromEntries(
    Object.values(ROLE)
      .filter((r) => r !== ROLE.ADMIN)
      .map((r) => [r, "/user/dashboard"]),
  ),
};

// 3. Menu Registry (Master Data untuk Menu)
// Kita buat registry supaya tidak menulis ulang object yang sama berkali-kali
const MENU_ITEMS = {
  DASHBOARD_ADMIN: {
    id: "01",
    label: "Dashboard",
    icon: LuLayoutDashboard,
    path: "/admin/dashboard",
    match: ["/admin/dashboard"],
  },
  DASHBOARD_USER: {
    id: "01",
    label: "Dashboard",
    icon: LuLayoutDashboard,
    path: "/user/dashboard",
    match: ["/user/dashboard"],
  },
  MANAGE_TASK: {
    id: "02",
    label: "Kelola Permohonan",
    icon: LuClipboardCheck,
    path: "/manage-task/task",
    match: ["/manage-task/task"],
  },
  CREATE_TASK: {
    id: "03",
    label: "Buat Permohonan",
    icon: LuSquarePlus,
    path: "/task/create",
    match: ["/task/create"],
  },
  TEAM_PERFORMANCE: {
    id: "04",
    label: "Performa Tim",
    icon: LuUsers,
    path: "/admin/team-performance",
    match: ["/admin/team-performance"],
  },
  HISTORY: {
    id: "05",
    label: "Riwayat Pengantar",
    icon: RiFolderHistoryLine,
    path: "/document/recommendation-latter",
    match: ["/document/recommendation-latter"],
  },
};

// 4. Export Final Menus (Frozen)
export const ADMIN_MENU = Object.freeze([
  MENU_ITEMS.DASHBOARD_ADMIN,
  MENU_ITEMS.MANAGE_TASK,
  MENU_ITEMS.CREATE_TASK,
  MENU_ITEMS.TEAM_PERFORMANCE,
  MENU_ITEMS.HISTORY,
]);

export const USER_MENU = Object.freeze([
  MENU_ITEMS.DASHBOARD_USER,
  MENU_ITEMS.MANAGE_TASK,
  MENU_ITEMS.CREATE_TASK,
  MENU_ITEMS.HISTORY,
]);

// 5. Options Data (Dibuat lebih deskriptif)
export const SUBDISTRICT_OPTIONS = Object.freeze(
  ["Kosambi", "Sepatan", "Sepatan Timur", "Pakuhaji", "Teluknaga"].map(
    (val) => ({ label: val, value: val }),
  ),
);

export const TITLE_OPTIONS = createOptions([
  "Pengaktifan",
  "Mutasi Habis Update",
  "Mutasi Habis Reguler",
  "Mutasi Sebagian",
  "Pembetulan",
  "Objek Pajak Baru",
]);
