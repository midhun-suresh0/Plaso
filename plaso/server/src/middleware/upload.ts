import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const uploadDirs = [
  'public/uploads',
  'public/uploads/posts',
  'public/uploads/profiles',
  'public/uploads/stories',
  'public/uploads/listings',
];
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
    } else if (file.fieldname === 'images') {
      dest += 'listings';
    }
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    let ext = path.extname(file.originalname);
    if (!ext || ext === '.') {
      if (file.mimetype === 'image/png') ext = '.png';
      else if (file.mimetype === 'image/webp') ext = '.webp';
      else if (file.mimetype === 'image/gif') ext = '.gif';
      else if (file.mimetype.includes('image')) ext = '.jpg';
      else ext = '.bin';
    }
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
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
