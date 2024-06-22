import APIError from "../classes/APIError.js";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } from "../constants/statusCode.js";
import { Bundles, bundleValidationSchema } from "../models/bundles.js"
import { Items } from "../models/items.js";

export const bundleController = {
    async createNewBundle({ bundleName, itemIds, discount, limitedEdition, expiresOn, description }) {
        try {
            const items = await Items.find({ _id: { $in: itemIds }});

            var priceBeforeDiscount = 0;
            items.forEach(item => {
                priceBeforeDiscount += item.price;
            });

            const priceAfterDiscount = priceBeforeDiscount * (1 - discount / 100);
            
            const { error } = bundleValidationSchema.validate({ bundleName, items, priceBeforeDiscount, priceAfterDiscount, discount, limitedEdition, expiresOn, description });
            if (error)
                throw new APIError(BAD_REQUEST, error.details.map(detail => detail.message).join(', '));
    
            if (!items.length)
                throw new APIError(BAD_REQUEST, "No items found with the provided IDs.");
            
            const newBundle = await Bundles.create({
                bundleName,
                items,
                priceBeforeDiscount,
                discount,
                priceAfterDiscount,
                limitedEdition,
                expiresOn,
                description
            });

            return newBundle;
        } catch(error) {
            console.log(error);
            if (error.code === 11000)
                throw new APIError(BAD_REQUEST, "There is already a bundle with this name.");

            // check for validation errors.
            if (error.name === "ValidationError") {
                const message = Object.values(error.errors).map(val => val.message);
                throw new APIError(BAD_REQUEST, message);
            }
            
            else if (error instanceof APIError) throw error;
            
            else throw new APIError(INTERNAL_SERVER_ERROR, "Internal Server Error.");
        }
    },

    async getBundle({ bundleId }) {
        try {
            const bundle = await Bundles.findOne({ _id: bundleId }).lean();

            if (!bundle)
                throw new APIError(NOT_FOUND, "No bundle exists with this ID.");

            return bundle;
        } catch(error) {
            if (error instanceof APIError) throw error;
            
            else throw new APIError(INTERNAL_SERVER_ERROR, "Internal Server Error.");
        }
    },

    async updateBundle({ bundleId, discount, description, limitedEdition, expiresOn }) {
        try {
            const updatedBundle = await Bundles.updateOne({ _id: bundleId }, { discount, description, limitedEdition, expiresOn }).lean();
            if (updatedBundle.matchedCount === 0)
                throw new APIError(NOT_FOUND, "No such bundle with this ID");
            
            else if (updatedBundle.modifiedCount === 0)
                throw new APIError(BAD_REQUEST, "Bundle was not updated.");

        } catch(error) {
            console.log(error)

            // check for validation errors.
            if (error.name === "ValidationError") {
                const message = Object.values(error.errors).map(val => val.message);
                throw new APIError(BAD_REQUEST, message);
            }

            else if (error instanceof APIError) throw error;
            
            else throw new APIError(INTERNAL_SERVER_ERROR, "Internal Server Error.");
        }
    },

    async deleteBundle({ bundleId }) {
        try {
            const deletedBundle = await Bundles.deleteOne({ _id: bundleId }).lean();

            if (deletedBundle.deletedCount === 0)
                throw new APIError(NOT_FOUND, "No such bundle with this ID.");

        } catch(error) {
            if (error instanceof APIError) throw error;

            else throw new APIError(INTERNAL_SERVER_ERROR, "Internal Server Error.");
        }
    }
}