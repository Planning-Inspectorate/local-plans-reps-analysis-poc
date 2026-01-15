import multer from 'multer';

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10485760 } // 10MB limit
});

export const uploadMiddleware = upload.single('comments');
