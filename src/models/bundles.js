import mongoose from "mongoose";
import Joi, { number, required } from "joi";
import { Items } from "./items";

export const bundleSchema = new mongoose.Schema({
    bundleName: {
        type: String,
        required: true
    },
    items: [{
        type: mongoose.Schema.ObjectId,
        ref: Items,
        required: true
    }],
    priceBeforeDiscount: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required:true
    }
});

export const bundleValidationSchema = Joi.object({
    bundleName: Joi.string().valid(COFFEE, TEA, WATER, SODA_CAN, REFRESHER, BAKERY, CAKE).required(),
    items: Joi.array().min(2).required(),
    priceBeforeDiscount: Joi.number().min(1).max(200).required(),
    discount: Joi.number().min(1).max(100).required(),
    description: Joi.string().min(3).max(200).required()
});
export const Bundles = mongoose.model('bundles', bundleSchema);