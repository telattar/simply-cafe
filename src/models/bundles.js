import mongoose from "mongoose";
import Joi from "joi";
import { Items, itemSchema } from "./items.js";

export const bundleSchema = new mongoose.Schema({
    bundleName: {
        type: String,
        required: true,
        unique: true
    },
    items: [{
        type: itemSchema,
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
    priceAfterDiscount: {
        type: Number,
        required: true
    },
    limitedEdition: {
        type: Boolean,
        required: true,
        default: false
    },
    expiresOn: {
        type: Date,
    },
    description: {
        type: String,
        required:true
    }
});

export const bundleValidationSchema = Joi.object({
    bundleName: Joi.string().required(),
    items: Joi.array().min(2).required(),
    priceBeforeDiscount: Joi.number().min(1).max(1000).required(),
    discount: Joi.number().min(1).max(100).required(),
    priceAfterDiscount: Joi.number().min(1).max(1000).required(),
    limitedEdition: Joi.boolean().default(false).required(),
    expiresOn: Joi.when('limitedEdition', {
        is: true,
        then: Joi.date().required()
        }
    ),
    description: Joi.string().min(3).max(200).required()
});
export const Bundles = mongoose.model('bundles', bundleSchema);