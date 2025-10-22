import React from "react";

const CardSkeleton = ({ height = 240 }) => (
  <div
    className="card animate-pulse"
    style={{
      minHeight: height,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
    aria-busy="true"
  >
    <div className="h-4 w-1/2 bg-slate-200 rounded" />
  </div>
);

export default React.memo(CardSkeleton);