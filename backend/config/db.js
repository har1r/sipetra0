const mongoose = require("mongoose");

/**
 * Fungsi untuk menghubungkan ke MongoDB
 * Menggunakan async/await agar bisa menunggu koneksi
 */
const connectDB = async () => {
  try {
    // Validasi apakah MONGO_URI tersedia
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI tidak ditemukan di environment variable");
    }

    // Coba konek ke MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI, {});

    // Tampilkan informasi koneksi yang berhasil
    console.log(`✅ MongoDB terhubung: ${conn.connection.host} (${conn.connection.name})`);

  } catch (error) {
    // Log error lengkap dengan stack trace untuk debugging
    console.error("❌ Gagal konek ke MongoDB:", error.message);
    console.error(error.stack);

    // Hentikan server karena koneksi database gagal
    process.exit(1);
  }
};

module.exports = connectDB;
