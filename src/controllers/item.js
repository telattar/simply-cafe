import APIError from "../classes/APIError.js";
import { BAD_REQUEST, INTERNAL_ERROR_MESSAGE, INTERNAL_SERVER_ERROR, NOT_FOUND } from "../constants/statusCode.js";
import { Items, itemValidationSchema } from "../models/items.js"

export const itemController = {
    async createItem({ itemType, itemName, price, description }) {
        try {
            const { error } = itemValidationSchema.validate({ itemType, itemName, price, description });
            if (error)
                throw new APIError(BAD_REQUEST, error.details.map(detail => detail.message).join(', '));

            const newItem = await Items.create({
                itemType,
                itemName,
                price,
                description
            });

            return newItem;
        } catch (error) {
            console.log(error)
            if (error.code === 11000)
                throw new APIError(BAD_REQUEST, "This item name already exists.");

            // check for validation errors.
            if (error.name === "ValidationError") {
                const message = Object.values(error.errors).map(val => val.message);
                throw new APIError(BAD_REQUEST, message);
            }

            else if (error instanceof APIError) throw error;

            else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
        }
    },

    async getItem({ itemId }) {
        try {
            const item = await Items.findOne({ _id: itemId }).lean();
            if (!item)
                throw new APIError(NOT_FOUND, "No such item.");

            return item;
        } catch (error) {
            if (error instanceof APIError) throw error;

            else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
        }
    },

    async updateItem({ itemId, itemName, price, description }) {
        try {

            const updatedItem = await Items.updateOne({ _id: itemId }, { itemName, price, description }).lean();
            if (updatedItem.matchedCount === 0)
                throw new APIError(NOT_FOUND, "No such item with this ID.");

            else if (updatedItem.modifiedCount === 0)
                throw new APIError(BAD_REQUEST, "The item was not updated.");

        } catch (error) {
            console.log(error)
            if (error.code === 11000)
                throw new APIError(BAD_REQUEST, "This item name already exists.");

            // check for validation errors.
            else if (error.name === "ValidationError") {
                const message = Object.values(error.errors).map(val => val.message);
                throw new APIError(BAD_REQUEST, message);
            }

            else if (error instanceof APIError) throw error;

            else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
        }
    },

    async deleteItem({ itemId }) {
        try {
            const deletedItem = await Items.deleteOne({ _id: itemId }).lean();
            if (deletedItem.deletedCount === 0)
                throw new APIError(NOT_FOUND, "No such item with this ID.");

        } catch (error) {
            if (error instanceof APIError) throw error;

            else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
        }
    }

}