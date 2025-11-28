"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogModel = exports.PaymentModel = exports.NotificationModel = exports.MedicalDocumentModel = exports.PrescriptionModel = exports.MessageModel = exports.AppointmentModel = exports.DoctorModel = exports.ProfileModel = exports.UserModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// User Schema
const userSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' }
}, { timestamps: true });
// Profile Schema
const profileSchema = new mongoose_1.default.Schema({
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true },
    phone: String,
    role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
    location: String,
    age: Number,
    gender: String,
    medicalConditions: [String]
}, { timestamps: true });
// Doctor Schema
const doctorSchema = new mongoose_1.default.Schema({
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    city: String,
    hospital: String,
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    consultationFee: Number,
    latitude: Number,
    longitude: Number,
    availableSlots: [String]
}, { timestamps: true });
// Appointment Schema
const appointmentSchema = new mongoose_1.default.Schema({
    patient: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
    symptoms: String,
    notes: String,
    paymentRef: String
}, { timestamps: true });
// Message Schema
const messageSchema = new mongoose_1.default.Schema({
    appointmentRef: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Appointment' },
    threadRef: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Message' },
    sender: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
    delivered: { type: Boolean, default: false }
}, { timestamps: true });
// Prescription Schema
const prescriptionSchema = new mongoose_1.default.Schema({
    doctor: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    patient: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    meds: [{
            name: String,
            dosage: String,
            frequency: String,
            duration: String
        }],
    pdfUrl: String
}, { timestamps: true });
// Medical Document Schema
const medicalDocumentSchema = new mongoose_1.default.Schema({
    patient: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
});
// Notification Schema
const notificationSchema = new mongoose_1.default.Schema({
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    payload: { type: mongoose_1.default.Schema.Types.Mixed, required: true },
    sentStatus: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' }
}, { timestamps: true });
// Payment Schema
const paymentSchema = new mongoose_1.default.Schema({
    mpesaTransactionId: String,
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    amount: { type: Number, required: true },
    reference: { type: String, required: true }
}, { timestamps: true });
// Audit Log Schema
const auditLogSchema = new mongoose_1.default.Schema({
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    before: mongoose_1.default.Schema.Types.Mixed,
    after: mongoose_1.default.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
});
// Models
exports.UserModel = mongoose_1.default.model('User', userSchema);
exports.ProfileModel = mongoose_1.default.model('Profile', profileSchema);
exports.DoctorModel = mongoose_1.default.model('Doctor', doctorSchema);
exports.AppointmentModel = mongoose_1.default.model('Appointment', appointmentSchema);
exports.MessageModel = mongoose_1.default.model('Message', messageSchema);
exports.PrescriptionModel = mongoose_1.default.model('Prescription', prescriptionSchema);
exports.MedicalDocumentModel = mongoose_1.default.model('MedicalDocument', medicalDocumentSchema);
exports.NotificationModel = mongoose_1.default.model('Notification', notificationSchema);
exports.PaymentModel = mongoose_1.default.model('Payment', paymentSchema);
exports.AuditLogModel = mongoose_1.default.model('AuditLog', auditLogSchema);
