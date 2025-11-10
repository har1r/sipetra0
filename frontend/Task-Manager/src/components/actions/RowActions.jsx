import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { BiSolidDetail } from "react-icons/bi";
import { MdEdit, MdDelete } from "react-icons/md";
import { FcApproval } from "react-icons/fc";
import UserContext from "../../context/UserContexts";

/**
 * Komponen: RowActions
 * Deskripsi:
 * - Menampilkan tombol aksi per task: Detail, Edit, Approval, dan Delete.
 * - Tombol bisa dikontrol tampilannya lewat prop (misal: showEdit={false})
 * - Mendukung kondisi disabled (misalnya ketika user tidak punya akses).
 */
function RowActions({
  id,
  showDetail = true,
  showEdit = true,
  showApproval = true,
  showDelete = true,
  disabled = false,
  onApprove,
  onDelete,
}) {
  const { user } = useContext(UserContext) || {};
  const userRole = String(user?.role || "").toLowerCase();
  const isAdmin = userRole === "admin";

  // Aturan akses dasar
  const canEdit = isAdmin && showEdit;
  const canDelete = isAdmin && showDelete;

  // Style umum untuk tombol
  const baseButton =
    "rounded-full p-1.5 sm:p-2 transition disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex justify-center gap-1 sm:gap-2">
      {/* Detail */}
      {showDetail && (
        <Link
          to={`/task-detail/${id}`}
          className={`${baseButton} bg-blue-100 hover:bg-blue-200`}
          title="Lihat Detail"
          onClick={(e) => disabled && e.preventDefault()}
        >
          <BiSolidDetail className="text-lg sm:text-xl text-blue-600" />
        </Link>
      )}

      {/* Edit */}
      {canEdit && (
        <Link
          to={`/task/update/${id}`}
          className={`${baseButton} bg-yellow-100 hover:bg-yellow-200`}
          title="Edit Task"
          onClick={(e) => disabled && e.preventDefault()}
        >
          <MdEdit className="text-lg sm:text-xl text-yellow-600" />
        </Link>
      )}

      {/* Approval */}
      {showApproval && (
        <button
          type="button"
          onClick={() => !disabled && onApprove?.(id)}
          className={`${baseButton} bg-green-100 hover:bg-green-200`}
          title="Approval Task"
          disabled={disabled}
        >
          <FcApproval className="text-lg sm:text-xl" />
        </button>
      )}

      {/* Delete */}
      {canDelete && (
        <button
          type="button"
          onClick={() => !disabled && onDelete?.(id)}
          className={`${baseButton} bg-red-100 hover:bg-red-200`}
          title="Hapus Task"
          disabled={disabled}
        >
          <MdDelete className="text-lg sm:text-xl text-red-600" />
        </button>
      )}
    </div>
  );
}

export default React.memo(RowActions);
