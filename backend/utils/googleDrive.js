const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const KEYFILEPATH = path.join(__dirname, '../service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

const uploadToDrive = async (fileObject) => {
  try {
    const fileMetadata = {
      name: fileObject.originalname,
      parents: ['1aS3ZpOmjiBiOgKERRVig8ohBzlAoHxef'],
      // PENTING: Jangan masukkan 'parents' (folder ID) 
      // agar file menggunakan kuota internal Service Account
    };

    const media = {
      mimeType: fileObject.mimetype,
      body: fs.createReadStream(fileObject.path),
    };

    // 1. Unggah ke ruang penyimpanan Service Account sendiri
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    const fileId = response.data.id;

    // 2. Berikan izin agar link bisa dibuka secara publik
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // 3. (Opsi Tambahan) Agar file muncul di menu "Shared with me" Drive Anda
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'writer',
        type: 'user',
        emailAddress: 'muftiharir3@gmail.com', 
      },
    });

    // Hapus file sementara di lokal server
    if (fs.existsSync(fileObject.path)) {
      fs.unlinkSync(fileObject.path);
    }

    return response.data;
  } catch (error) {
    console.error("Drive Upload Error:", error.response?.data || error.message);
    throw new Error("Gagal mengunggah ke Google Drive: " + error.message);
  }
};

module.exports = { uploadToDrive };