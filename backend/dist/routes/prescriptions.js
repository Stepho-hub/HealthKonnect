"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pdfkit_1 = __importDefault(require("pdfkit"));
const models_1 = require("../models");
const router = (0, express_1.Router)();
// Create prescription
router.post('/', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: { message: 'Unauthorized' } });
        }
        const { appointmentId, medications, notes } = req.body;
        if (!appointmentId || !medications || !Array.isArray(medications)) {
            return res.status(400).json({ error: { message: 'Appointment ID and medications are required' } });
        }
        // Verify appointment exists and doctor is authorized
        const appointment = await models_1.AppointmentModel.findById(appointmentId)
            .populate('patient', 'name email')
            .populate('doctor', 'name specialization');
        if (!appointment) {
            return res.status(404).json({ error: { message: 'Appointment not found' } });
        }
        if (appointment.doctor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: { message: 'Access denied' } });
        }
        // Create prescription
        const prescription = new models_1.PrescriptionModel({
            doctor: req.user._id,
            patient: appointment.patient,
            appointment: appointmentId,
            meds: medications,
            notes: notes || ''
        });
        await prescription.save();
        await prescription.populate('doctor', 'name');
        await prescription.populate('patient', 'name');
        res.status(201).json({ data: prescription });
    }
    catch (error) {
        console.error('Create prescription error:', error);
        res.status(500).json({ error: { message: 'Failed to create prescription' } });
    }
});
// Get prescriptions for patient
router.get('/patient', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: { message: 'Unauthorized' } });
        }
        const prescriptions = await models_1.PrescriptionModel.find({ patient: req.user._id })
            .populate('doctor', 'name specialization')
            .populate('appointment')
            .sort({ createdAt: -1 });
        res.json({ data: prescriptions });
    }
    catch (error) {
        console.error('Get patient prescriptions error:', error);
        res.status(500).json({ error: { message: 'Failed to get prescriptions' } });
    }
});
// Get prescriptions created by doctor
router.get('/doctor', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: { message: 'Unauthorized' } });
        }
        const prescriptions = await models_1.PrescriptionModel.find({ doctor: req.user._id })
            .populate('patient', 'name')
            .populate('appointment')
            .sort({ createdAt: -1 });
        res.json({ data: prescriptions });
    }
    catch (error) {
        console.error('Get doctor prescriptions error:', error);
        res.status(500).json({ error: { message: 'Failed to get prescriptions' } });
    }
});
// Generate PDF prescription
router.get('/:id/pdf', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: { message: 'Unauthorized' } });
        }
        const { id } = req.params;
        const prescription = await models_1.PrescriptionModel.findById(id)
            .populate('doctor', 'name')
            .populate('patient', 'name')
            .populate('appointment');
        if (!prescription) {
            return res.status(404).json({ error: { message: 'Prescription not found' } });
        }
        // Check if user is authorized (patient or doctor)
        const isPatient = prescription.patient.toString() === req.user._id.toString();
        const isDoctor = prescription.doctor.toString() === req.user._id.toString();
        if (!isPatient && !isDoctor) {
            return res.status(403).json({ error: { message: 'Access denied' } });
        }
        // Generate PDF
        const doc = new pdfkit_1.default();
        const filename = `prescription-${prescription._id}.pdf`;
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        // Pipe PDF to response
        doc.pipe(res);
        // Add content to PDF
        doc.fontSize(20).text('HealthKonnect Medical Prescription', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Prescription ID: ${prescription._id}`);
        doc.text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`);
        doc.moveDown();
        doc.fontSize(16).text('Patient Information:');
        doc.fontSize(12).text(`Name: ${prescription.patient.name}`);
        doc.moveDown();
        doc.fontSize(16).text('Doctor Information:');
        doc.fontSize(12).text(`Name: Dr. ${prescription.doctor.name}`);
        doc.moveDown();
        doc.fontSize(16).text('Medications:');
        prescription.meds.forEach((med, index) => {
            doc.fontSize(12).text(`${index + 1}. ${med.name}`);
            doc.text(`   Dosage: ${med.dosage}`);
            doc.text(`   Frequency: ${med.frequency}`);
            doc.text(`   Duration: ${med.duration}`);
            doc.moveDown(0.5);
        });
        if (prescription.notes) {
            doc.fontSize(16).text('Notes:');
            doc.fontSize(12).text(prescription.notes);
        }
        doc.moveDown(2);
        doc.fontSize(10).text('This prescription was generated electronically by HealthKonnect.', { align: 'center' });
        doc.text('Please consult your healthcare provider for any questions.', { align: 'center' });
        // Finalize PDF
        doc.end();
    }
    catch (error) {
        console.error('Generate PDF error:', error);
        res.status(500).json({ error: { message: 'Failed to generate PDF' } });
    }
});
// Get single prescription
router.get('/:id', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: { message: 'Unauthorized' } });
        }
        const { id } = req.params;
        const prescription = await models_1.PrescriptionModel.findById(id)
            .populate('doctor', 'name specialization')
            .populate('patient', 'name')
            .populate('appointment');
        if (!prescription) {
            return res.status(404).json({ error: { message: 'Prescription not found' } });
        }
        // Check if user is authorized
        const isPatient = prescription.patient.toString() === req.user._id.toString();
        const isDoctor = prescription.doctor.toString() === req.user._id.toString();
        if (!isPatient && !isDoctor) {
            return res.status(403).json({ error: { message: 'Access denied' } });
        }
        res.json({ data: prescription });
    }
    catch (error) {
        console.error('Get prescription error:', error);
        res.status(500).json({ error: { message: 'Failed to get prescription' } });
    }
});
exports.default = router;
