import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { BiSolidDetail } from "react-icons/bi";
import { MdEdit, MdDelete } from "react-icons/md";
import { FcApproval } from "react-icons/fc";
import { UserContext } from "../../context/UserContexts";

/**
 * RowActions
 * Aksi-aksi per baris task (Detail / Edit / Approval / Delete)
 *
 * Props:
 * - id: string (wajib)
 * - showDetail?: boolean = true
 * - showEdit?: boolean = true
 * - showApproval?: boolean = true
 * - showDeleteBtn?: boolean = true
 * - onApprove?: (id: string) => void
 * - onDelete?:  (id: string) => void
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
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  // Gating: hanya admin boleh Edit & Delete.
  const canEdit = isAdmin && showEdit;
  const canDelete = isAdmin && showDeleteBtn;

  return (
    <div className="flex gap-1 sm:gap-2 justify-center">
      {showDetail && (
        <Link
          to={`/task-detail/${id}`}
          className="p-1.5 sm:p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition"
          title="Detail"
          aria-label={`Lihat detail task ${id}`}
        >
          <BiSolidDetail className="text-lg sm:text-xl text-blue-600" />
        </Link>
      )}

      {canEdit && (
        <Link
          to={`/admin/task/update/${id}`}
          className="p-1.5 sm:p-2 rounded-full bg-yellow-100 hover:bg-yellow-200 transition"
          title="Edit"
          aria-label={`Ubah task ${id}`}
        >
          <MdEdit className="text-lg sm:text-xl text-yellow-600" />
        </Link>
      )}

      {showApproval && (
        <button
          type="button"
          onClick={() => onApprove(id)}
          className="p-1.5 sm:p-2 rounded-full bg-green-100 hover:bg-green-200 transition"
          title="Approval"
          aria-label={`Buka approval task ${id}`}
        >
          <FcApproval className="text-lg sm:text-xl" />
        </button>
      )}

      {canDelete && (
        <button
          type="button"
          onClick={() => onDelete(id)}
          className="p-1.5 sm:p-2 rounded-full bg-red-100 hover:bg-red-200 transition"
          title="Hapus"
          aria-label={`Hapus task ${id}`}
        >
          <MdDelete className="text-lg sm:text-xl text-red-600" />
        </button>
      )}
    </div>
  );
}

export default React.memo(RowActions);

