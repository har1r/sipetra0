import React from "react";

const Pagination = ({ page = 1, totalPages = 1, onPageChange = () => {} }) => {
  // Normalisasi angka agar aman
  const total = Math.max(1, Number.isFinite(+totalPages) ? +totalPages : 1);
  const current = Math.min(Math.max(1, Number.isFinite(+page) ? +page : 1), total);

  const prevDisabled = current <= 1;
  const nextDisabled = current >= total;

  const handlePrev = () => {
    if (!prevDisabled) onPageChange(current - 1);
  };

  const handleNext = () => {
    if (!nextDisabled) onPageChange(current + 1);
  };

  return (
    <nav className="mt-6" aria-label="Pagination">
      <div className="grid grid-cols-3 items-center gap-2">
        {/* Prev */}
        <div className="justify-self-start">
          <button
            type="button"
            onClick={handlePrev}
            disabled={prevDisabled}
            className={`px-3 py-1 rounded transition ${
              prevDisabled
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            aria-label="Halaman sebelumnya"
          >
            Prev
          </button>
        </div>

        {/* Indicator */}
        <p className="text-sm text-gray-600 text-center" aria-live="polite">
          Halaman {current} dari {total}
        </p>

        {/* Next */}
        <div className="justify-self-end">
          <button
            type="button"
            onClick={handleNext}
            disabled={nextDisabled}
            className={`px-3 py-1 rounded transition ${
              nextDisabled
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            aria-label="Halaman berikutnya"
          >
            Next
          </button>
        </div>
      </div>
    </nav>
  );
};

export default React.memo(Pagination);


