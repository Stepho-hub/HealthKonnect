"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const router = (0, express_1.Router)();
// Create appointment
router.post('/', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: { message: 'Unauthorized' } });
        }
        const { doctor, date, time, symptoms, notes } = req.body;
        if (!doctor || !date || !time) {
            return res.status(400).json({ error: { message: 'Doctor, date, and time are required' } });
        }
        const doctorDoc = await models_1.DoctorModel.findById(doctor);
        if (!doctorDoc) {
            return res.status(404).json({ error: { message: 'Doctor not found' } });
        }
        const appointment = new models_1.AppointmentModel({
            patient: req.user._id,
            doctor: doctor,
            date: new Date(date),
            time: time.trim(),
            symptoms: symptoms?.trim(),
            notes: notes?.trim()
        });
        await appointment.save();
        await appointment.populate('patient', 'name email');
        await appointment.populate('doctor', 'name specialization');
        res.status(201).json({ data: appointment });
    }
    catch (error) {
        console.error('Create appointment error:', error);
        res.status(500).json({ error: { message: 'Failed to create appointment' } });
    }
});
// Get user appointments
router.get('/', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: { message: 'Unauthorized' } });
        }
        const appointments = await models_1.AppointmentModel.find({
            $or: [{ patient: req.user._id }, { doctor: req.user._id }]
        })
            .populate('patient', 'name email')
            .populate('doctor', 'name email specialization')
            .sort({ date: -1, time: -1 });
        res.json({ data: appointments });
    }
    catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({ error: { message: 'Failed to get appointments' } });
    }
});
exports.default = router;
