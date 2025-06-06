import APIError from "../classes/APIError.js";
import { CANCELLED, COMPLETE, PREPARING } from "../constants/orderStatus.js";
import {
  BAD_REQUEST,
  FORBIDDEN,
  INTERNAL_ERROR_MESSAGE,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
} from "../constants/statusCode.js";
import { ITEM, Menu } from "../models/menu.js";
import { Orders, orderValidationSchema } from "../models/orders.js";

// Customer can create orders, view their details and cancel them.
// Chefs mark an order as complete.

export const orderController = {
  /**
   * Creates a new order for a customer.
   * @param {String} customerId - The ID of the customer placing the order.
   * @param {ObjectId[]} orderedItemIds - An array of item IDs to be ordered. It has to contain at least one Id from a menu object.
   * @param {String} comment - A comment provided by the customer for the order, if any.
   * @param {String} paymentMethod - The payment method chosen by the customer. Could be Cash, Debit Card, or Instapay.
   * @returns {Object} - The created order object.
   * @throws {APIError} - If validation fails.
   */
  async create({ customerId, orderedItemIds, comment, paymentMethod }) {
    try {
      var orderedItems = await Menu.find({
        _id: { $in: orderedItemIds },
      }).lean();

      // please note that you can only order available items. Such thing can be handled on the front-end side,
      // for simplicity I will just filter out the out of stock products from the array of ordered items
      orderedItems = orderedItems.filter((item) => item.availability === true);

      if (!orderedItems.length)
        throw new APIError(
          BAD_REQUEST,
          "The ordered items are not in the menu OR are all out of stock."
        );

      var totalPrice = 0;
      orderedItems.forEach((menuItem) => {
        totalPrice +=
          menuItem.type === ITEM
            ? menuItem.item.price
            : menuItem.bundle.priceAfterDiscount;
      });

      const date = Date.now();

      const { error } = orderValidationSchema.validate({
        customerId,
        date,
        orderedItems,
        totalPrice,
        comment,
        paymentMethod,
        status: PREPARING,
      });
      if (error)
        throw new APIError(
          BAD_REQUEST,
          error.details.map((detail) => detail.message).join(", ")
        );

      const order = await Orders.create({
        customerId,
        date,
        orderedItems,
        totalPrice,
        comment,
        paymentMethod,
        status: PREPARING,
      });

      // update the menu by decrementing the stock count and updating the availability if needed.
      await Menu.updateMany({ _id: { $in: orderedItemIds } }, [
        { $set: { stockCount: { $subtract: ["$stockCount", 1] } } },
        { $set: { availability: { $gt: ["$stockCount", 0] } } },
      ]);

      return order;
    } catch (error) {
      if (error.code === 11000)
        throw new APIError(BAD_REQUEST, "Duplicate key error.");

      // check for validation errors.
      if (error.name === "ValidationError") {
        const message = Object.values(error.errors).map((val) => val.message);
        throw new APIError(BAD_REQUEST, message);
      } else if (error instanceof APIError) throw error;
      else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
    }
  },

  /**
   * Views a specific order for a customer.
   * @param {String} customerId - The ID of the customer viewing the order.
   * @param {String} orderId - The ID of the order to be viewed.
   * @returns {Object} - The order object.
   * @throws {APIError} - If the order does not exist or does not belong to the customer.
   */
  async getCustomerOrder({ customerId, orderId }) {
    try {
      const order = await Orders.findOne({ _id: orderId }).lean();
      if (!order) throw new APIError(NOT_FOUND, "No such order with this ID.");

      if (order.customerId.toString() !== customerId)
        throw new APIError(
          FORBIDDEN,
          "You can not view the details of an order that is not yours."
        );

      return order;
    } catch (error) {
      if (error instanceof APIError) throw error;
      else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
    }
  },

  /**
   * Cancels a specific order for a customer.
   * @param {String} customerId - The ID of the customer cancelling the order.
   * @param {String} orderId - The ID of the order to be cancelled.
   * @throws {APIError} - If the order does not exist, does not belong to the customer,
   * or if the status us either Complete or Cancelled. Logically in this case, the order cannot be cancelled.
   */
  async cancel({ customerId, orderId }) {
    try {
      const order = await Orders.findOneAndUpdate(
        { _id: orderId, customerId },
        { status: CANCELLED },
        { new: false }
      ).lean();
      if (!order)
        throw new APIError(
          NOT_FOUND,
          "This order does not exist OR was not ordered by the currently logged in user."
        );

      const { status, orderedItems } = order;

      if (status !== PREPARING)
        throw new APIError(
          BAD_REQUEST,
          `You can not cancel an order which status is ${status}.`
        );

      const orderedItemIds = orderedItems.map((orderedItem) => orderedItem._id);
      // now that the order is cancelled, we will need to reverse the changes done to the stock count and the availability in the menu
      // update the menu by incrementing the stock count and updating the availability to true.
      await Menu.updateMany({ _id: { $in: orderedItemIds } }, [
        {
          $set: {
            stockCount: { $add: ["$stockCount", 1] },
            availability: true,
          },
        },
      ]);
    } catch (error) {
      if (error instanceof APIError) throw error;
      else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
    }
  },

  /**
   * Completes a specific order.
   * Only the chef can do this operation
   * @param {String} orderId - The ID of the order to be completed.
   * @throws {APIError} - If the order does not exist or cannot be completed due to its status being either Complete or Cancelled.
   */
  async markAsComplete({ orderId }) {
    try {
      const order = await Orders.findOne({ _id: orderId }).lean();
      if (!order) throw new APIError(NOT_FOUND, "This order does not exist.");

      const { status } = order;
      if (status !== PREPARING)
        throw new APIError(
          BAD_REQUEST,
          `You can not complete an order which status is ${status}.`
        );

      const completeOrder = await Orders.updateOne(
        { _id: orderId },
        { status: COMPLETE }
      ).lean();
      if (completeOrder.matchedCount === 0)
        throw new APIError(NOT_FOUND, "This order does not exist.");

      if (completeOrder.modifiedCount === 0)
        throw new APIError(BAD_REQUEST, "The order status was not updated.");
    } catch (error) {
      if (error instanceof APIError) throw error;
      else throw new APIError(INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
    }
  },
};
