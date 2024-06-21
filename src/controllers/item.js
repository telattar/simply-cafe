import APIError from "../classes/APIError.js";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } from "../constants/statusCode.js";
import { Items } from "../models/items.js"

export const itemController = {
    async createItem({ itemType, itemName, price, description }) {
        try {            
            const newItem = await Items.create({ 
                itemType,
                itemName,
                price,
                description
            });
            
            return newItem;
        } catch(error) {
            console.log(error)
            if (error.code === 11000)
                    throw new APIError(BAD_REQUEST, "This item name already exists.");

            // check for validation errors.
            if (error.name === "ValidationError") {
                let message = "";
                Object.keys(error.errors).forEach((key) => {
                    message += error.errors[key].message + " ";
                });
                throw new APIError(BAD_REQUEST, message);
            }

            else if (error instanceof APIError) throw error;

            else throw new APIError(INTERNAL_SERVER_ERROR, "Internal Server Error.");
        }
    },
    
    async getItem({ itemId }) {
        try {
            const item = await Items.findOne({ _id: itemId }).lean();
            if (!item)
                throw new APIError(NOT_FOUND, "No such item.");

            return item;
        } catch(error) {
            if (error instanceof APIError) throw error;

            else throw new APIError(INTERNAL_SERVER_ERROR, "Internal Server Error.");
        }
    },

    async deleteItem({ itemId }) {
        try {
            const deletedItem = await Items.deleteOne({ _id: itemId }).lean();
            if (deletedItem.deletedCount === 0)
                throw new APIError(NOT_FOUND, "No such item with this ID.");

        } catch (error) {
            if (error instanceof APIError) throw error;

            else throw new APIError(INTERNAL_SERVER_ERROR, "Internal Server Error.");
        }
    }
}