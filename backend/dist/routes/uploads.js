"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const models_1 = require("../models");
const router = (0, express_1.Router)();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads');
        // Create uploads directory if it doesn't exist
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: fileFilter
});
// Upload medical document
router.post('/medical-document', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: { message: 'Unauthorized' } });
        }
        // Handle file upload
        upload.single('document')(req, res, async (err) => {
            if (err) {
                if (err instanceof multer_1.default.MulterError) {
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
            const document = new models_1.MedicalDocumentModel({
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
    }
    catch (error) {
        console.error('Upload medical document error:', error);
        res.status(500).json({ error: { message: 'Failed to upload document' } });
    }
});
// Get user's medical documents
router.get('/medical-documents', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: { message: 'Unauthorized' } });
        }
        const documents = await models_1.MedicalDocumentModel.find({ patient: req.user._id })
            .sort({ uploadedAt: -1 });
        res.json({ data: documents });
    }
    catch (error) {
        console.error('Get medical documents error:', error);
        res.status(500).json({ error: { message: 'Failed to get documents' } });
    }
});
// Delete medical document
router.delete('/medical-document/:id', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: { message: 'Unauthorized' } });
        }
        const { id } = req.params;
        const document = await models_1.MedicalDocumentModel.findById(id);
        if (!document) {
            return res.status(404).json({ error: { message: 'Document not found' } });
        }
        // Check if user owns the document
        if (document.patient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: { message: 'Access denied' } });
        }
        // Delete file from filesystem
        const filePath = path_1.default.join(__dirname, '../../uploads', path_1.default.basename(document.url));
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        // Delete document record
        await models_1.MedicalDocumentModel.findByIdAndDelete(id);
        res.json({ message: 'Document deleted successfully' });
    }
    catch (error) {
        console.error('Delete medical document error:', error);
        res.status(500).json({ error: { message: 'Failed to delete document' } });
    }
});
exports.default = router;
