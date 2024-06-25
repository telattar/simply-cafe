import mongoose from "mongoose";
import Joi from "joi";
import { BAKERY, CAKE, COFFEE, REFRESHER, SODA_CAN, TEA, WATER } from "../constants/menuItems.js";

export const itemSchema = new mongoose.Schema({
    itemType: {
        type: String,
        required: true
    },
    itemName: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    }
});

export const itemValidationSchema = Joi.object({
    itemType: Joi.string().valid(COFFEE, TEA, WATER, SODA_CAN, REFRESHER, BAKERY, CAKE).required(),
    itemName: Joi.string().min(3).max(40).required(),
    price: Joi.number().min(1).max(200).required(),
    description: Joi.string().min(3).max(200).required()
});

export const Items = mongoose.model('items', itemSchema);