"use strict";
// Shared types for HealthKonnect Backend
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = exports.validatePhone = exports.validateEmail = exports.generateId = exports.formatTime = exports.formatDate = void 0;
// Utility functions
const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};
exports.formatDate = formatDate;
const formatTime = (date) => {
    return date.toTimeString().split(' ')[0].substring(0, 5);
};
exports.formatTime = formatTime;
const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
};
exports.generateId = generateId;
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
const validatePhone = (phone) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone);
};
exports.validatePhone = validatePhone;
const sanitizeInput = (input) => {
    return input.replace(/[<>]/g, '');
};
exports.sanitizeInput = sanitizeInput;
