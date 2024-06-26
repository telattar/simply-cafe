import APIError from "../classes/APIError.js";
import { BAD_REQUEST, INTERNAL_ERROR_MESSAGE, INTERNAL_SERVER_ERROR, NOT_FOUND } from "../constants/statusCode.js";
import { Bundles } from "../models/bundles.js";
import { Items } from "../models/items.js"
import { BUNDLE, ITEM, Menu, menuValidationSchema } from "../models/menu.js";

// Any operations related to ITEMS can only be done by the CHEF,
// while any operations related to the BUNDLES can only be done by the MANAGER.

export const menuController = {
    /**
     * Adds an existing item to the menu.
     * The menu is a collection of items/bundles, along with their availability and stock count.
     * @param {string} type - The type of the menu item, either ITEM or BUNDLE.
     * @param {string} itemId - The ID of the item to be added to the menu. Should be a valid ObjectId.
     * @param {boolean} availability - Indicates whether the item is available for purchase.
     * @param {number} stockCount - The amount of currently available item instances.
     * Zero means out of stock, which also means availability is false.
     * @returns {object} The item that was added successfully to the collection.
     * @throws {APIError} If the item ID is invalid, the item is already in the menu, or there are validation errors.
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
            if (error.name === "ValidationError") {
                const message = Object.values(error.errors).map(val => val.message);
                throw new APIError(BAD_REQUEST, message);
            }

            else if (error instanceof APIError) throw error;

            else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
        }
    },

    /**
     * Adds an existing bundle to the menu.
     * @param {string} bundleId - The ID of the bundle to be added to the menu. Should be a valid ObjectId.
     * @param {boolean} availability - Indicates whether the bundle is available for purchase.
     * @param {number} stockCount - The amount of currently available bundle instances. Zero means out of stock, which also means availability is false.
     * @returns {object} The bundle that was added successfully to the collection.
     * @throws {APIError} If the bundle ID is invalid, the bundle is already in the menu, or there are validation errors.
     */
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

    /**
     * Retrieves the menu.
     * Before doing so, check each bundle on the menu that has an expiresOn date greater than now.
     * Expired bundles should be REMOVED from the menu.
     * @returns {object[]} The menu items.
     * @throws {APIError} If there is an internal server error.
     */
    async getMenu() {
        try {
            await Menu.deleteMany({ 'bundle.expiresOn': { $lt: Date.now() } }).lean();

            const menu = await Menu.find().lean();
            return menu;

        } catch (error) {
            if (error instanceof APIError) throw error;
            else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
        }
    },

    /**
     * Updates the stock count of an item in the menu.
     * @param {string} itemId - The ID of the item.
     * @param {number} stockCount - The new stock count of the item.
     * @throws {APIError} If the stock count is invalid, the item is not found, or there are validation errors.
     */
    async updateItemStock({ itemId, stockCount }) {
        try {
            if (stockCount === undefined)
                throw new APIError(BAD_REQUEST, "Please provide a stock count.");
            if (stockCount < 0)
                throw new APIError(BAD_REQUEST, "Please provide a stock count that is greater than zero.");

            const availability = stockCount > 0 ? true : false;
            const updatedMenuItem = await Menu.updateOne({ 'item._id': itemId }, { stockCount, availability }).lean();

            if (updatedMenuItem.matchedCount === 0)
                throw new APIError(NOT_FOUND, "No item found with this Id.");

            if (updatedMenuItem.modifiedCount === 0)
                throw new APIError(BAD_REQUEST, "The stock count was not updated.");

        } catch (error) {
            if (error instanceof APIError) throw error;

            else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
        }
    },

    /**
     * Updates the stock count of a bundle in the menu.
     * @param {string} bundleId - The ID of the bundle.
     * @param {number} stockCount - The new stock count of the bundle.
     * @throws {APIError} If the stock count is less than zero, the bundle is not found, or there are validation errors.
     */
    async updateBundleStock({ bundleId, stockCount }) {
        try {
            if (stockCount === undefined)
                throw new APIError(BAD_REQUEST, "Please provide a stock count.")
            if (stockCount < 0)
                throw new APIError(BAD_REQUEST, "Please provide a stock count that is greater than zero.");

            const availability = stockCount > 0 ? true : false;
            const updatedMenuItem = await Menu.updateOne({ 'bundle._id': bundleId }, { stockCount, availability }).lean();

            if (updatedMenuItem.matchedCount === 0)
                throw new APIError(NOT_FOUND, "No bundle found with this Id.");

            if (updatedMenuItem.modifiedCount === 0)
                throw new APIError(BAD_REQUEST, "The stock count was not updated.");

        } catch (error) {
            if (error instanceof APIError) throw error;

            else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
        }
    },

    /**
     * Removes an item from the menu.
     * @param {string} itemId - The ID of the item.
     * @throws {APIError} If the item is not found.
     */
    async removeItemFromMenu({ itemId }) {
        try {
            const removedItem = await Menu.deleteOne({ 'item._id': itemId }).lean();
            if (removedItem.deletedCount === 0)
                throw new APIError(NOT_FOUND, "No such item with this ID.");
        } catch (error) {
            if (error instanceof APIError) throw error;

            else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
        }
    },

    /**
     * Removes a bundle from the menu.
     * @param {string} bundleId - The ID of the bundle.
     * @throws {APIError} If the bundle is not found.
     */
    async removeBundleFromMenu({ bundleId }) {
        try {
            const removedBundle = await Menu.deleteOne({ 'bundle._id': bundleId }).lean();
            if (removedBundle.deletedCount === 0)
                throw new APIError(NOT_FOUND, "No such bundle with this ID.");
        } catch (error) {
            if (error instanceof APIError) throw error;

            else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
        }
    },
}