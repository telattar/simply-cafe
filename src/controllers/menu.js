import APIError from "../classes/APIError.js";
import { BAD_REQUEST, INTERNAL_ERROR_MESSAGE, INTERNAL_SERVER_ERROR, NOT_FOUND } from "../constants/statusCode.js";
import { Bundles } from "../models/bundles.js";
import { Items } from "../models/items.js"
import { BUNDLE, ITEM, Menu, menuValidationSchema } from "../models/menu.js";

export const menuController = {
    /**
     * Adds an existing item to the menu
     * The menu is basically a collection of some items/bundles along with their availability and stock count.
     * @param {String} type - this is the type of the menu item. It can be an ITEM or a BUNDLE.
     * @param {String} itemId - the ID of the item that will be added to the menu. Should be a valid ObjectId
     * @param {Boolean} availability - indicates whether this item is available for purchase or is out of stock.
     * @param {Number} stockCount - the amount of currently available item instances. Zero means out of stock.
     * @returns {Object} addedItem - the item that was added successfully to the collection.
     */
    async addItem({ itemId, availability, stockCount }) {
        try {
            const item = await Items.findOne({ _id: itemId }).lean();
            if (!item)
                throw new APIError(BAD_REQUEST, "No such item with this ID.");

            const itemExists = await Menu.findOne({ 'item._id': itemId }).lean();
            if (itemExists)
                throw new APIError(BAD_REQUEST, "This item is already in the menu.");

            const { error } = menuValidationSchema.validate({ type: ITEM, item, availability, stockCount });
            if (error)
                throw new APIError(BAD_REQUEST, error.details.map(detail => detail.message).join(', '));

            const addedItem = await Menu.create({
                type: ITEM,
                item,
                availability,
                stockCount
            });

            return addedItem;
        } catch (error) {
            console.log(error);
            if (error.name === "ValidationError") {
                const message = Object.values(error.errors).map(val => val.message);
                throw new APIError(BAD_REQUEST, message);
            }

            else if (error instanceof APIError) throw error;

            else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
        }
    },

    async addBundle({ bundleId, availability, stockCount }) {
        try {
            const bundle = await Bundles.findOne({ _id: bundleId }).lean();
            if (!bundle)
                throw new APIError(BAD_REQUEST, "No such bundle with this ID.");

            const bundleExists = await Menu.findOne({ 'bundle._id': bundleId }).lean();
            if (bundleExists)
                throw new APIError(BAD_REQUEST, "This bundle is already in the menu.");

            const { error } = menuValidationSchema.validate({ type: BUNDLE, bundle, availability, stockCount });
            if (error)
                throw new APIError(BAD_REQUEST, error.details.map(detail => detail.message).join(', '));

            const addedBundle = await Menu.create({
                type: BUNDLE,
                bundle,
                availability,
                stockCount
            });

            return addedBundle;

        } catch (error) {
            if (error.name === "ValidationError") {
                const message = Object.values(error.errors).map(val => val.message);
                throw new APIError(BAD_REQUEST, message);
            }

            else if (error instanceof APIError) throw error;

            else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
        }
    },

    async getMenu() {
        try {
            const menu = await Menu.find().lean();
            return menu;

        } catch (error) {
            if (error instanceof APIError) throw error;
            else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
        }
    },

    async updateItemStock({ itemId, stockCount }) {
        try {
            const updatedMenuItem = await Menu.updateOne({ 'item._id': itemId }, { stockCount }).lean();

            if (updatedMenuItem.matchedCount === 0)
                throw new APIError(NOT_FOUND, "No item found with this Id.");

            if (updatedMenuItem.modifiedCount === 0)
                throw new APIError(BAD_REQUEST, "The stock count was not updated.");

        } catch (error) {
            console.log(error)
            if (error instanceof APIError) throw error;

            else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
        }
    },

    async updateBundleStock({ bundleId, stockCount }) {
        try {
            const updatedMenuItem = await Menu.updateOne({ 'bundle._id': bundleId }, { stockCount }).lean();

            if (updatedMenuItem.matchedCount === 0)
                throw new APIError(NOT_FOUND, "No bundle found with this Id.");

            if (updatedMenuItem.modifiedCount === 0)
                throw new APIError(BAD_REQUEST, "The stock count was not updated.");

        } catch (error) {
            console.log(error)
            if (error instanceof APIError) throw error;

            else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
        }
    },

    async removeItemFromMenu({ itemId }) {
        try {
            const removedItem = await Menu.deleteOne({ 'item._id': itemId }).lean();
            if (removedItem.deletedCount === 0)
                throw new APIError(BAD_REQUEST, "No such item with this ID.");
        } catch (error) {
            console.log(error)
            if (error instanceof APIError) throw error;

            else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
        }
    },

    async removeBundleFromMenu({ bundleId }) {
        try {
            const removedBundle = await Menu.deleteOne({ 'item._id': bundleId }).lean();
            if (removedBundle.deletedCount === 0)
                throw new APIError(BAD_REQUEST, "No such item with this ID.");
        } catch (error) {
            console.log(error)
            if (error instanceof APIError) throw error;

            else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
        }
    },
}