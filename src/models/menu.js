import mongoose from "mongoose";
import Joi from "joi";
import { Items, itemSchema } from "./items.js";
import { Bundles, bundleSchema } from "./bundles.js";


export const BUNDLE = "Bundle";
export const ITEM = "Item";

export const menuSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: [BUNDLE, ITEM],
        required: true
    },
    bundle: {
        type: bundleSchema,
        ref: Bundles,
    },
    item: {
        type: itemSchema,
        ref: Items,
    },
    availability: {
        type: Boolean,
        required: true
    },
    stockCount: {
        type: Number,
        required: true,
        default: 0
    }
});

export const menuValidationSchema = Joi.object({
    type: Joi.string().valid(BUNDLE, ITEM).required(),
    bundle: Joi.when('type', {
        is: BUNDLE,
        then: Joi.required(),
    }),
    item: Joi.when('type', {
        is: ITEM,
        then: Joi.required(),
    }),
    availability: Joi.boolean().required(),
    stockCount: Joi.number().required().min(0).default(0)
});

export const Menu = mongoose.model('menu', menuSchema);