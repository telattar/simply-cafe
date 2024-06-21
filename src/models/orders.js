import mongoose from "mongoose";
import Joi from "joi";
import { Users } from "./users";
import { Menu, menuSchema } from "./menu";
import { CARD, CASH, INSTAPAY } from "../constants/paymentMethod";

const orderSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.ObjectId,
        ref: Users,
        required: true
    },
    date: {
        type : Date,
        required: true,
        default: Date.now
    },
    orderedItems: [{
        type: menuSchema,
        ref: Menu,
        required: true
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    comment: {
        type: String
    },
    paymentMethod: {
        type: String,
        enum: [CASH, CARD, INSTAPAY],
        required: true
    }
});

export const orderValidationSchema = Joi.object({
    customerId: Joi.string().hex().length(24).required(), // object ID validation
    date: Joi.date().required(),
    orderedItems: Joi.array().items(Joi.object().required()),
    totalPrice: Joi.number().min(0).required(),
    comment: Joi.string().allow(""),
    paymentMethod: Joi.string().valid(CASH, CARD, INSTAPAY).required()
});
export const Bundles = mongoose.model('orders', orderSchema);