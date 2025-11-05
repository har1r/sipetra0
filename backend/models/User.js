const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: [
        "admin", // Akses penuh ke semua task
        "penginput", // Untuk tahap Diinput
        "penata", // Untuk tahap Ditata
        "peneliti", // Untuk tahap Diteliti
        "pengarsip", // Untuk tahap Diarsipkan
        "pengirim", // Untuk tahap Dikirim
        "pengecek", // Untuk tahap Selesai
      ],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true, // Saat user baru dibuat, otomatis aktif
    },
  },
  {
    timestamps: true, // otomatis buat createdAt & updatedAt
  }
);

module.exports = mongoose.model("User", userSchema);

// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },

//   email: {
//     type: String,
//     required: true,
//     unique: true,
//   },

//   password: {
//     type: String,
//     required: true,
//   },

//   profileImageUrl: {
//       type: String,
//       default: null,
//   },

//   role: {
//     type: String,
//     enum: [
//       "admin",       // Akses penuh ke semua task
//       "penginput",   // Untuk tahap Diinput
//       "penata",      // Untuk tahap Ditata
//       "peneliti",    // Untuk tahap Diteliti
//       "pengarsip",   // Untuk tahap Diarsipkan
//       "pengirim"     // Untuk tahap Dikirim
//     ],
//     required: true,
//   },

//   isActive: {
//     type: Boolean,
//     default: true,
//   },

//   createdAt: {
//     type: Date,
//     default: Date.now,
//   }
// });

// module.exports = mongoose.model("User", userSchema);
