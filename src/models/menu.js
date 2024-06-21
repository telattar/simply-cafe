import mongoose from "mongoose";
import Joi, { boolean } from "joi";
import { itemSchema } from "./items";
import { bundleSchema } from "./bundles";


const BUNDLE = "Bundle";
const ITEM = "Item";

export const menuSchema = new mongoose.Schema({
    menuItemName: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: [BUNDLE, ITEM],
        required: true
    },
    bundle: {
        type: bundleSchema
    },
    item: {
        type: itemSchema
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
    menuItemName: Joi.string().min(2).required(),
    type: Joi.string().valid([BUNDLE, ITEM]).required(),
    bundle: Joi.when('type', {
        is: BUNDLE,
        then: bundleSchema.required(),
    }),
    item: Joi.when('type', {
        is: ITEM,
        then: itemSchema.required(),
    }),
    availability: Joi.boolean().required(),
    stockCount: Joi.number().required().default(0)
});

export const Menu = mongoose.model('menu', menuSchema);