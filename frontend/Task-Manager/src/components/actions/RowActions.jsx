import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { BiSolidDetail } from "react-icons/bi";
import { MdEdit, MdDelete } from "react-icons/md";
import { FcApproval } from "react-icons/fc";
import UserContext from "../../context/UserContexts";

/**
 * Komponen: RowActions
 * Deskripsi: Menampilkan tombol aksi (Detail, Edit, Approval, Hapus) untuk setiap baris task.
 */
function RowActions({
  id,
  showDetail = true,
  showEdit = true,
  showApproval = true,
  showDeleteBtn = true,
  onApprove = () => {},
  onDelete = () => {},
}) {
  const { user } = useContext(UserContext) || {};
  const userRole = String(user?.role || "").toLowerCase();
  const isAdmin = userRole === "admin";

  const canEdit = isAdmin && showEdit;
  const canDelete = isAdmin && showDeleteBtn;

  return (
    <div className="flex justify-center gap-1 sm:gap-2">
      {showDetail && (
        <Link
          to={`/task-detail/${id}`}
          className="rounded-full bg-blue-100 p-1.5 sm:p-2 transition hover:bg-blue-200"
          title="Lihat Detail"
        >
          <BiSolidDetail className="text-lg sm:text-xl text-blue-600" />
        </Link>
      )}

      {canEdit && (
        <Link
          to={`/task/update/${id}`}
          className="rounded-full bg-yellow-100 p-1.5 sm:p-2 transition hover:bg-yellow-200"
          title="Edit Task"
        >
          <MdEdit className="text-lg sm:text-xl text-yellow-600" />
        </Link>
      )}

      {showApproval && (
        <button
          type="button"
          onClick={() => onApprove(id)}
          className="rounded-full bg-green-100 p-1.5 sm:p-2 transition hover:bg-green-200"
          title="Approval Task"
        >
          <FcApproval className="text-lg sm:text-xl" />
        </button>
      )}

      {canDelete && (
        <button
          type="button"
          onClick={() => onDelete(id)}
          className="rounded-full bg-red-100 p-1.5 sm:p-2 transition hover:bg-red-200"
          title="Hapus Task"
        >
          <MdDelete className="text-lg sm:text-xl text-red-600" />
        </button>
      )}
    </div>
  );
}

export default React.memo(RowActions);
