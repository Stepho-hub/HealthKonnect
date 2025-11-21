"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const router = (0, express_1.Router)();
// Get all doctors
router.get('/', async (req, res) => {
    try {
        const doctors = await models_1.DoctorModel.find({}).populate('user', 'name email');
        res.json({ data: doctors });
    }
    catch (error) {
        console.error('Get doctors error:', error);
        res.status(500).json({ error: { message: 'Failed to get doctors' } });
    }
});
// Get doctors by city
router.get('/city/:city', async (req, res) => {
    try {
        const { city } = req.params;
        if (!city || city.trim().length === 0) {
            return res.status(400).json({ error: { message: 'City parameter is required' } });
        }
        const doctors = await models_1.DoctorModel.find({
            city: new RegExp(city.trim(), 'i')
        }).populate('user', 'name email');
        res.json({ data: doctors });
    }
    catch (error) {
        console.error('Get doctors by city error:', error);
        res.status(500).json({ error: { message: 'Failed to get doctors by city' } });
    }
});
// Get doctor appointments for a specific date
router.get('/:doctorId/appointments/:date', async (req, res) => {
    try {
        const { doctorId, date } = req.params;
        if (!doctorId || !date) {
            return res.status(400).json({ error: { message: 'Doctor ID and date are required' } });
        }
        // Parse the date and get start/end of day
        const appointmentDate = new Date(date);
        const startOfDay = new Date(appointmentDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(appointmentDate);
        endOfDay.setHours(23, 59, 59, 999);
        const { AppointmentModel } = await Promise.resolve().then(() => __importStar(require('../models')));
        const appointments = await AppointmentModel.find({
            doctor: doctorId,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            status: { $in: ['pending', 'confirmed'] } // Only count booked slots
        }).select('time');
        res.json({ data: appointments });
    }
    catch (error) {
        console.error('Get doctor appointments error:', error);
        res.status(500).json({ error: { message: 'Failed to get doctor appointments' } });
    }
});
exports.default = router;
