"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const seedDoctors = async () => {
    try {
        // Connect to MongoDB
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        // Clear existing doctors
        await models_1.DoctorModel.deleteMany({});
        console.log('Cleared existing doctors');
        // Sample doctors data
        const doctorsData = [
            {
                name: 'Dr. Sarah Johnson',
                specialization: 'Cardiology',
                city: 'Nairobi',
                hospital: 'Kenyatta National Hospital',
                rating: 4.8,
                reviewCount: 127,
                consultationFee: 5000,
                latitude: -1.2864,
                longitude: 36.8172
            },
            {
                name: 'Dr. Michael Chen',
                specialization: 'Dermatology',
                city: 'Nairobi',
                hospital: 'Nairobi Hospital',
                rating: 4.6,
                reviewCount: 89,
                consultationFee: 4500,
                latitude: -1.2864,
                longitude: 36.8172
            },
            {
                name: 'Dr. Grace Wanjiku',
                specialization: 'Pediatrics',
                city: 'Nairobi',
                hospital: 'Mater Hospital',
                rating: 4.9,
                reviewCount: 156,
                consultationFee: 4000,
                latitude: -1.2864,
                longitude: 36.8172
            },
            {
                name: 'Dr. David Kiprop',
                specialization: 'Orthopedics',
                city: 'Eldoret',
                hospital: 'Moi Teaching and Referral Hospital',
                rating: 4.7,
                reviewCount: 98,
                consultationFee: 5500,
                latitude: 0.5143,
                longitude: 35.2698
            },
            {
                name: 'Dr. Ann Nyambura',
                specialization: 'Gynecology',
                city: 'Nairobi',
                hospital: 'Aga Khan Hospital',
                rating: 4.8,
                reviewCount: 134,
                consultationFee: 4800,
                latitude: -1.2864,
                longitude: 36.8172
            },
            {
                name: 'Dr. James Oduya',
                specialization: 'General Medicine',
                city: 'Kisumu',
                hospital: 'Jaramogi Oginga Odinga Teaching and Referral Hospital',
                rating: 4.5,
                reviewCount: 76,
                consultationFee: 3500,
                latitude: -0.0917,
                longitude: 34.7679
            }
        ];
        // Create doctors
        for (const doctorData of doctorsData) {
            // Create a placeholder user for each doctor
            const placeholderUser = new models_1.UserModel({
                clerkId: `doctor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: doctorData.name,
                email: `${doctorData.name.toLowerCase().replace(/\s+/g, '.')}@h-konnect.com`,
                role: 'doctor'
            });
            await placeholderUser.save();
            // Create doctor profile
            const doctor = new models_1.DoctorModel({
                user: placeholderUser._id,
                ...doctorData
            });
            await doctor.save();
            console.log(`Created doctor: ${doctorData.name}`);
        }
        console.log('Seeding completed successfully!');
        console.log(`Created ${doctorsData.length} doctors`);
    }
    catch (error) {
        console.error('Seeding failed:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
};
// Run the seed function
seedDoctors();
