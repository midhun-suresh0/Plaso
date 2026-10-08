import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const uploadDirs = ['public/uploads/posts', 'public/uploads/profiles', 'public/uploads/stories'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    let dest = 'public/uploads/';
    if (file.fieldname === 'media') {
      dest += 'posts';
    } else if (file.fieldname === 'profileImage') {
      dest += 'profiles';
    } else if (file.fieldname === 'storyMedia') {
      dest += 'stories';
    }
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (_req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed'), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit to allow for short videos
  },
  fileFilter
});
