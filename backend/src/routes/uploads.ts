import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { MedicalDocumentModel } from '../models';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to allow only specific file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// Upload medical document
router.post('/medical-document', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    // Handle file upload
    upload.single('document')(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: { message: 'File too large. Maximum size is 10MB.' } });
          }
        }
        return res.status(400).json({ error: { message: err.message } });
      }

      if (!req.file) {
        return res.status(400).json({ error: { message: 'No file uploaded' } });
      }

      const { type, description } = req.body;

      // Create medical document record
      const document = new MedicalDocumentModel({
        patient: req.user._id,
        url: `/uploads/${req.file.filename}`,
        type: type || 'general',
        uploadedAt: new Date()
      });

      await document.save();

      res.status(201).json({
        data: {
          document,
          message: 'Document uploaded successfully'
        }
      });
    });
  } catch (error) {
    console.error('Upload medical document error:', error);
    res.status(500).json({ error: { message: 'Failed to upload document' } });
  }
});

// Get user's medical documents
router.get('/medical-documents', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const documents = await MedicalDocumentModel.find({ patient: req.user._id })
      .sort({ uploadedAt: -1 });

    res.json({ data: documents });
  } catch (error) {
    console.error('Get medical documents error:', error);
    res.status(500).json({ error: { message: 'Failed to get documents' } });
  }
});

// Delete medical document
router.delete('/medical-document/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const { id } = req.params;

    const document = await MedicalDocumentModel.findById(id);
    if (!document) {
      return res.status(404).json({ error: { message: 'Document not found' } });
    }

    // Check if user owns the document
    if (document.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../../uploads', path.basename(document.url));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete document record
    await MedicalDocumentModel.findByIdAndDelete(id);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete medical document error:', error);
    res.status(500).json({ error: { message: 'Failed to delete document' } });
  }
});

export default router;