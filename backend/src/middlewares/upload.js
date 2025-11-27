const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads/challenges';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, uniqueSuffix + '-' + cleanName);
    }
});
// fuck zip slip that it's an admin thing only
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || path.extname(file.originalname) === '.zip') {
        cb(null, true);
    } else {
        cb(new Error('Only .zip files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, 
    fileFilter: fileFilter
});

module.exports = upload;
