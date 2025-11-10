// src/utils/data.js
import {
  LuLayoutDashboard,
  LuUsers,
  LuClipboardCheck,
  LuSquarePlus,
  LuLogOut,
} from "react-icons/lu";
import { RiFolderHistoryLine } from "react-icons/ri";

// ==== Konstanta role & default route per role ====
export const ROLE = {
  ADMIN: "admin",
  PENGINPUT: "penginput",
  PENATA: "penata",
  PENELITI: "peneliti",
  PENGARSIP: "pengarsip",
  PENGIRIM: "pengirim",
  PENGECEK: "pengecek",
};

export const DEFAULT_ROUTE_BY_ROLE = {
  [ROLE.ADMIN]: "/admin/dashboard",
  [ROLE.PENGINPUT]: "/user/dashboard",
  [ROLE.PENATA]: "/user/dashboard",
  [ROLE.PENELITI]: "/user/dashboard",
  [ROLE.PENGARSIP]: "/user/dashboard",
  [ROLE.PENGIRIM]: "/user/dashboard",
  [ROLE.PENGECEK]: "/user/dashboard",
};

/**
 * Catatan: properti `match` dipakai untuk menandai item aktif
 * saat berada di rute turunan (startsWith).
 */

export const ADMIN_MENU = Object.freeze([
  Object.freeze({
    id: "01",
    label: "Dashboard",
    icon: LuLayoutDashboard,
    path: "/admin/dashboard",
    match: ["/admin/dashboard"],
  }),
  Object.freeze({
    id: "02",
    label: "Kelola Permohonan",
    icon: LuClipboardCheck,
    path: "/manage-task/task",
    match: ["/manage-task/task"],
  }),
  Object.freeze({
    id: "03",
    label: "Buat Permohonan",
    icon: LuSquarePlus,
    path: "/task/create",
    match: ["/task/create"],
  }),
  Object.freeze({
    id: "04",
    label: "Performa Tim",
    icon: LuUsers,
    path: "/admin/team-performance",
    match: ["/admin/team-performance"],
  }),
  Object.freeze({
    id: "05",
    label: "Riwayat Pengantar",
    icon: RiFolderHistoryLine,
    path: "/document/recommendation-latter",
    match: ["/document/recommendation-latter"],
  }),
  Object.freeze({
    id: "06",
    label: "Logout",
    icon: LuLogOut,
    path: "logout",
  }),
]);

export const USER_MENU = Object.freeze([
  Object.freeze({
    id: "01",
    label: "Dashboard",
    icon: LuLayoutDashboard,
    path: "/user/dashboard",
    match: ["/user/dashboard"],
  }),
  Object.freeze({
    id: "02",
    label: "Kelola Permohonan",
    icon: LuClipboardCheck,
    path: "/manage-task/task",
    match: ["/manage-task/task"],
  }),
  Object.freeze({
    id: "03",
    label: "Buat Permohonan",
    icon: LuSquarePlus,
    path: "/task/create",
    match: ["/task/create"],
  }),
  Object.freeze({
    id: "04",
    label: "Riwayat Pengantar",
    icon: RiFolderHistoryLine,
    path: "/document/recommendation-latter",
    match: ["/document/recommendation-latter"],
  }),
  Object.freeze({
    id: "05",
    label: "Logout",
    icon: LuLogOut,
    path: "logout",
  }),
]);

export const SUBDISTRICT_OPTIONS = [
  { label: "Kosambi", value: "Kosambi" },
  { label: "Sepatan", value: "Sepatan" },
  { label: "Sepatan Timur", value: "Sepatan Timur" },
  { label: "Pakuhaji", value: "Pakuhaji" },
  { label: "Teluknaga", value: "Teluknaga" },
];

export const TITLE_OPTIONS = [
  { label: "Pengaktifan", value: "Pengaktifan" },
  { label: "Mutasi Habis Update", value: "Mutasi Habis Update" },
  { label: "Mutasi Habis Reguler", value: "Mutasi Habis Reguler" },
  { label: "Mutasi Sebagian", value: "Mutasi Sebagian" },
  { label: "Pembetulan", value: "Pembetulan" },
  { label: "Objek Pajak Baru", value: "Objek Pajak Baru" },
];
