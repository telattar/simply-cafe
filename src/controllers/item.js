import APIError from "../classes/APIError.js";
import { BAD_REQUEST, INTERNAL_ERROR_MESSAGE, INTERNAL_SERVER_ERROR, NOT_FOUND } from "../constants/statusCode.js";
import { Items, itemValidationSchema } from "../models/items.js"

export const itemController = {
    async createItem({ itemType, itemName, price, description }) {
        try {
            const existingItemName = await Items.findOne({ itemName }).lean();
            if (existingItemName)
                throw new APIError(BAD_REQUEST, "This item name already exists.");

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
            const item = await Items.findOne({ itemName }).lean();

            // sometimes people would update the item's name to be its current item name.....
            // if there is another item with this item name, throw the error
            if (item && item._id.toString() !== itemId.toString())
                throw new APIError(BAD_REQUEST, "This item name already exists.");

            const updatedItem = await Items.updateOne({ _id: itemId }, { itemName, price, description }).lean();
            if (updatedItem.matchedCount === 0)
                throw new APIError(NOT_FOUND, "No such item with this ID.");

            else if (updatedItem.modifiedCount === 0)
                throw new APIError(BAD_REQUEST, "The item was not updated.");

        } catch (error) {
            // check for validation errors.
            if (error.name === "ValidationError") {
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