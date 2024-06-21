import mongoose from "mongoose";
import { ADMIN, CHEF, CUSTOMER, MALE, FEMALE, WAITER, MANAGER } from '../constants/userTypes.js';
import Joi from "joi";
import { joiPasswordExtendCore } from "joi-password";

const joiPassword = Joi.extend(joiPasswordExtendCore);
export const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        min: 6,
        max: 100
    },
    password: {
        type: String,
        required: true,
        min: 6,
        max: 100
    },
    userType: {
        type: String,
        enum: [ADMIN, CHEF, CUSTOMER, WAITER, MANAGER],
        default: CUSTOMER
    },
    firstName: {
        type: String,
        required: true,
        min: 2,
        max: 100
    },
    lastName: {
        type: String,
        required: true,
        min: 2,
        max: 100
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        lowercase: true,
        unique: true,
    },
    gender: {
        type: String,
        required: true,
        enum: [MALE, FEMALE],
        // "other" or "prefer not to say" is not an acceptable answer.
    },
});

export const userValidationSchema = Joi.object({
    username: Joi.string().min(6).max(100).required(),
    password: joiPassword.string()
        .minOfLowercase(1)
        .minOfUppercase(1)
        .minOfNumeric(1)
        .noWhiteSpaces()
        .min(6)
        .max(100)
        .required(),
    userType: Joi.string().valid(ADMIN, CHEF, CUSTOMER, WAITER, MANAGER).default(CUSTOMER),
    firstName: Joi.string().min(2).max(100).required(),
    lastName: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    gender: Joi.string().valid(MALE, FEMALE).required()
});

export const Users = mongoose.model('users', userSchema);
