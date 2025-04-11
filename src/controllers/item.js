import APIError from "../classes/APIError.js";
import {
  BAD_REQUEST,
  INTERNAL_ERROR_MESSAGE,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
} from "../constants/statusCode.js";
import { Items, itemValidationSchema } from "../models/items.js";
import { Menu } from "../models/menu.js";

// Only the chef is allowed to do CRUD operations to an item.

export const itemController = {
  /**
   * Create a new item.
   * @param {string} itemType - The type of the item. Should be one of the following:
   * Coffee - Cake - Tea - Bakery - Canned Soda - Water - Refreshing Drink
   * @param {string} itemName - The name of the item. Should be unique.
   * It would be lovely to use local branded-products like Elano water and V7 cola :)
   * @param {number} price - The price of the item in EGP (Egyptian Pounds).
   * @param {string} description - The description of the item.
   * @returns {Object} The created item object.
   * @throws {APIError} If the item name already exists or if there are validation errors.
   */
  async create({ itemType, itemName, price, description }) {
    try {
      const existingItemName = await Items.findOne({ itemName }).lean();
      if (existingItemName)
        throw new APIError(BAD_REQUEST, "This item name already exists.");

      const { error } = itemValidationSchema.validate({
        itemType,
        itemName,
        price,
        description,
      });
      if (error)
        throw new APIError(
          BAD_REQUEST,
          error.details.map((detail) => detail.message).join(", ")
        );

      const newItem = await Items.create({
        itemType,
        itemName,
        price,
        description,
      });

      return newItem;
    } catch (error) {
      // check for validation errors.
      if (error.name === "ValidationError") {
        const message = Object.values(error.errors).map((val) => val.message);
        throw new APIError(BAD_REQUEST, message);
      } else if (error instanceof APIError) throw error;
      else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
    }
  },
  /**
   * Get an item by its unique identifier.
   * @param {string} id - The ID of the item.
   * @returns {Object} The item object.
   * @throws {APIError} If the item is not found.
   */
  async getOne({ id }) {
    try {
      const item = await Items.findOne({ _id: id }).lean();
      if (!item) throw new APIError(NOT_FOUND, "No such item.");

      return item;
    } catch (error) {
      if (error instanceof APIError) throw error;
      else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
    }
  },

  /**
   * Update an existing item.
   * @param {string} id - The ID of the item.
   * @param {string} itemName - The new name of the item.
   * @param {number} price - The new price of the item.
   * @param {string} description - The new description of the item.
   * @throws {APIError} If the item name already exists, if the item is not found, or if the item is not updated.
   */
  async updateOne({ id, itemName, price, description }) {
    try {
      const item = await Items.findOne({ itemName }).lean();

      // sometimes people would update the item's name to be its current item name.....
      // if there is another item with this item name, throw the error
      if (item && item._id.toString() !== id.toString())
        throw new APIError(BAD_REQUEST, "This item name already exists.");

      const updatedItem = await Items.updateOne(
        { _id: id },
        { itemName, price, description }
      ).lean();
      if (updatedItem.matchedCount === 0)
        throw new APIError(NOT_FOUND, "No such item with this ID.");
      else if (updatedItem.modifiedCount === 0)
        throw new APIError(BAD_REQUEST, "The item was not updated.");
    } catch (error) {
      // check for validation errors.
      if (error.name === "ValidationError") {
        const message = Object.values(error.errors).map((val) => val.message);
        throw new APIError(BAD_REQUEST, message);
      } else if (error instanceof APIError) throw error;
      else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
    }
  },

  /**
   * Delete an item by ID. This will also remove it from the menu, if it was on it.
   * @param {string} id - The ID of the item.
   * @throws {APIError} If the item is not found.
   */
  async deleteOne({ id }) {
    try {
      const deletedItem = await Items.deleteOne({ _id: id }).lean();
      if (deletedItem.deletedCount === 0)
        throw new APIError(NOT_FOUND, "No such item with this ID.");

      await Menu.deleteOne({ "item._id": id }).lean();
    } catch (error) {
      console.log(error);

      if (error instanceof APIError) throw error;
      else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
    }
  },
};
