import mongoose from "mongoose";
import Joi from "joi";
import { Items, itemSchema } from "./items.js";

export const bundleSchema = new mongoose.Schema({
    bundleName: {
        type: String,
        required: true,
    },
    items: [{
        type: itemSchema,
        ref: Items,
        required: true
    }],
    priceBeforeDiscount: {
        type: Number,
        min: 0,
        required: true
    },
    discount: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    priceAfterDiscount: {
        type: Number,
        required: true
    },
    limitedEdition: {
        type: Boolean,
        default: false
    },
    expiresOn: {
        type: Date,
    },
    description: {
        type: String,
        required: true
    }
});

export const bundleValidationSchema = Joi.object({
    bundleName: Joi.string().required(),
    items: Joi.array().min(2).required(),
    priceBeforeDiscount: Joi.number().min(1).max(1000).required(),
    discount: Joi.number().min(1).max(100).required(),
    priceAfterDiscount: Joi.number().min(0).max(1000).required(),
    limitedEdition: Joi.boolean().default(false),
    expiresOn: Joi.when('limitedEdition', {
        is: true,
        then: Joi.date().min(Date.now()).required()
    }
    ),
    description: Joi.string().min(3).max(200).required()
});
bundleSchema.index({ bundleName: 1 }, { unique: true });

export const Bundles = mongoose.model('bundles', bundleSchema);