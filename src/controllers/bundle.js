import APIError from "../classes/APIError.js";
import {
  BAD_REQUEST,
  INTERNAL_ERROR_MESSAGE,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
} from "../constants/statusCode.js";
import { Bundles, bundleValidationSchema } from "../models/bundles.js";
import { Items } from "../models/items.js";
import { Menu } from "../models/menu.js";

// Only a manager can do CRUD operations to a bundle.

export const bundleController = {
  /**
   * Create a new bundle.
   * @param {string} bundleName - The name of the bundle. Should be Unique.
   * @param {string[]} itemIds - The IDs of the items to be included in the bundle. They should all be in the items collection.
   * No two bundles should contain the same items.
   * @param {number} discount - The discount percentage for the bundle.
   * @param {boolean} limitedEdition - Whether the bundle is a limited edition.
   * @param {Date} expiresOn - The expiration date of the bundle. Should be a future date.
   * @param {string} description - The description of the bundle.
   * @returns {object} The created bundle object.
   * @throws {APIError} If the bundle name already exists or if there are validation errors.
   */
  async create({
    bundleName,
    itemIds,
    discount,
    limitedEdition,
    expiresOn,
    description,
  }) {
    try {
      //check if the bundle name exists
      var existsBundle = await Bundles.findOne({ bundleName }).lean();
      if (existsBundle)
        throw new APIError(
          BAD_REQUEST,
          "There is already a bundle with this name."
        );

      const items = await Items.find({ _id: { $in: itemIds } });
      existsBundle = await Bundles.findOne({ items }).lean();

      //check if some bundle has the exact same items
      if (existsBundle)
        throw new APIError(
          BAD_REQUEST,
          "There is already a bundle with the exact same items."
        );

      var priceBeforeDiscount = 0;
      items.forEach((item) => {
        priceBeforeDiscount += item.price;
      });

      const priceAfterDiscount = priceBeforeDiscount * (1 - discount / 100);

      const { error } = bundleValidationSchema.validate({
        bundleName,
        items,
        priceBeforeDiscount,
        priceAfterDiscount,
        discount,
        limitedEdition,
        expiresOn,
        description,
      });
      if (error)
        throw new APIError(
          BAD_REQUEST,
          error.details.map((detail) => detail.message).join(", ")
        );

      if (!items.length)
        throw new APIError(
          BAD_REQUEST,
          "No items found with the provided IDs."
        );

      const newBundle = await Bundles.create({
        bundleName,
        items,
        priceBeforeDiscount,
        discount,
        priceAfterDiscount,
        limitedEdition,
        expiresOn,
        description,
      });

      return newBundle;
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
   * Get a bundle by ID.
   * @param {string} id - The ID of the bundle.
   * @returns {object} The bundle object.
   * @throws {APIError} If the bundle is not found.
   */
  async getOne({ id }) {
    try {
      const bundle = await Bundles.findOne({ _id: id }).lean();

      if (!bundle)
        throw new APIError(NOT_FOUND, "No bundle exists with this ID.");

      return bundle;
    } catch (error) {
      if (error instanceof APIError) throw error;
      else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
    }
  },

  /**
   * Update an existing bundle.
   * NO permission for bundle name modifications. The manager can create a new one instead.
   * @param {string} id - The ID of the bundle.
   * @param {number} [discount] - The new discount percentage for the bundle.
   * @param {string} [description] - The new description of the bundle.
   * @param {boolean} [limitedEdition] - Whether the bundle is a limited edition.
   * @param {Date} [expiresOn] - The new expiration date of the bundle.
   * @throws {APIError} If the bundle is not found or if there are validation errors.
   */
  async updateOne({ id, discount, description, limitedEdition, expiresOn }) {
    try {
      const bundle = await Bundles.findOne({ _id: id }).lean();
      if (!bundle) throw new APIError(NOT_FOUND, "No such bundle exists.");

      bundle.discount = discount ? discount : bundle.discount;
      bundle.priceAfterDiscount = discount
        ? (bundle.priceBeforeDiscount * discount) / 100
        : bundle.priceAfterDiscount;
      bundle.description = description ? description : bundle.description;
      bundle.limitedEdition = limitedEdition
        ? limitedEdition
        : bundle.limitedEdition;
      bundle.expiresOn = expiresOn ? expiresOn : bundle.expiresOn;

      const { error } = bundleValidationSchema.validate(bundle, {
        stripUnknown: true,
      });
      if (error)
        throw new APIError(
          BAD_REQUEST,
          error.details.map((detail) => detail.message).join(", ")
        );

      const updatedBundle = await Bundles.updateOne({ _id: id }, bundle).lean();
      if (updatedBundle.matchedCount === 0)
        throw new APIError(NOT_FOUND, "No such bundle with this ID");
      else if (updatedBundle.modifiedCount === 0)
        throw new APIError(BAD_REQUEST, "Bundle was not updated.");
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
   * Delete a bundle by ID. This will also delete it from the menu, if it was on it.
   * @param {string} id - The ID of the bundle.
   * @throws {APIError} If the bundle is not found.
   */
  async deleteOne({ id }) {
    try {
      const deletedBundle = await Bundles.deleteOne({ _id: id }).lean();
      if (deletedBundle.deletedCount === 0)
        throw new APIError(NOT_FOUND, "No such bundle with this ID.");

      await Menu.deleteOne({ "bundle._id": id }).lean();
    } catch (error) {
      if (error instanceof APIError) throw error;
      else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
    }
  },
};
