import React from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

// Tambahkan prop totalData untuk konteks lebih baik
const Pagination = ({ 
  page = 1, 
  totalPages = 1, 
  totalData = 0, 
  onPageChange = () => {} 
}) => {
  const total = Math.max(1, Number.isFinite(+totalPages) ? +totalPages : 1);
  const current = Math.min(Math.max(1, Number.isFinite(+page) ? +page : 1), total);

  const prevDisabled = current <= 1;
  const nextDisabled = current >= total;

  const handlePrev = () => !prevDisabled && onPageChange(current - 1);
  const handleNext = () => !nextDisabled && onPageChange(current + 1);

  const buttonBaseClass = "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95";
  const activeClass = "bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600";
  const disabledClass = "bg-gray-50 border border-gray-100 text-gray-400 cursor-not-allowed opacity-50";

  return (
    <nav className="flex flex-col items-center gap-4" aria-label="Pagination">
      <div className="flex items-center">
        
        {/* Tombol Prev */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={prevDisabled}
          className={`${buttonBaseClass} ${prevDisabled ? disabledClass : activeClass}`}
        >
          <HiChevronLeft size={18} />
          <span>Prev</span>
        </button>

        {/* Indikator Tengah */}
        <div className="mx-8 flex flex-col items-center">
          <p className="text-sm font-medium text-gray-600 whitespace-nowrap">
            Halaman <span className="text-blue-600 font-bold">{current}</span> dari <span className="font-bold">{total}</span>
          </p>
          <div className="h-1 w-6 rounded-full bg-blue-400 mt-1 opacity-20"></div>
        </div>

        {/* Tombol Next */}
        <button
          type="button"
          onClick={handleNext}
          disabled={nextDisabled}
          className={`${buttonBaseClass} ${nextDisabled ? disabledClass : activeClass}`}
        >
          <span>Next</span>
          <HiChevronRight size={18} />
        </button>
      </div>

      {/* Informasi Tambahan (Opsional) */}
      {totalData > 0 && (
        <span className="text-xs text-gray-400 italic">
          Menampilkan total {totalData} data
        </span>
      )}
    </nav>
  );
};

export default React.memo(Pagination);