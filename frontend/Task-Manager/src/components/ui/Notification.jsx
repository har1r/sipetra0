import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * Notification
 * -----------------
 * Komponen toast notification global.
 * Gunakan sekali di layout utama (App.jsx).
 * 
 * Optimasi: Bisa di-lazy load untuk mengurangi bundle awal
 */
const Notification = () => {
  return (
    <ToastContainer
      position="top-right"        // Posisi toast
      autoClose={1000}            // Auto close setelah 3 detik
      hideProgressBar={false}     // Tampilkan progress bar
      newestOnTop={true}          // Toast terbaru di atas
      closeOnClick                // Bisa ditutup dengan klik
      pauseOnFocusLoss            // Pause saat pindah window
      draggable                   // Bisa dipindah
      pauseOnHover                // Pause saat hover
      theme="light"               // Tema terang
    />
  );
};

export default Notification;

// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// /**
//  * Komponen Toast Notifikasi Global
//  * Dapat digunakan sekali saja di layout utama (biasanya di App.jsx)
//  */
// const Notification = () => {
//   return (
//     <ToastContainer
//       position="top-right"        // Posisi toast
//       autoClose={3000}            // Auto close setelah 3 detik
//       hideProgressBar={false}     // Tampilkan bar progres
//       newestOnTop={true}          // Toast terbaru ditampilkan paling atas
//       closeOnClick                // Bisa ditutup dengan klik
//       pauseOnFocusLoss            // Pause saat pindah window
//       draggable                   // Bisa dipindah (drag)
//       pauseOnHover                // Pause saat hover
//       theme="light"               // Tema terang
//     />
//   );
// };

// export default Notification;

