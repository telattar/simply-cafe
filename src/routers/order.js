import express from "express";
import { ADMIN, CHEF, CUSTOMER } from "../constants/userTypes.js";
import { CREATED, FORBIDDEN, NO_CONTENT, OK } from "../constants/statusCode.js";
import { orderController } from "../controllers/order.js";

const orderRouter = new express.Router();

orderRouter.post("", async (req, res) => {
  try {
    const { userId: customerId, userType } = req.user;
    const { orderedItemIds, comment, paymentMethod } = req.body;

    if (userType !== CUSTOMER)
      return res
        .status(FORBIDDEN)
        .json({ message: "Only a customer can make an order." });

    const newOrder = await orderController.create({
      customerId,
      orderedItemIds,
      comment,
      paymentMethod,
    });
    return res.status(CREATED).json({ newOrder });
  } catch (error) {
    return res.status(error.code).json({ message: error.message });
  }
});

orderRouter.get("/:id", async (req, res) => {
  try {
    const { userId: customerId, userType } = req.user;

    if (userType !== CUSTOMER)
      return res
        .status(FORBIDDEN)
        .json({ message: "Only a customer can view their order." });

    const { id: orderId } = req.params;
    const order = await orderController.getCustomerOrder({
      customerId,
      orderId,
    });

    return res.status(OK).json({ order });
  } catch (error) {
    return res.status(error.code).json({ message: error.message });
  }
});

orderRouter.patch("/:id/cancel", async (req, res) => {
  try {
    const { userId: customerId, userType } = req.user;
    const { id: orderId } = req.params;

    if (userType !== CUSTOMER)
      return res
        .status(FORBIDDEN)
        .json({ message: "Only a customer can cancel THEIR order." });

    await orderController.cancel({ customerId, orderId });
    res.status(NO_CONTENT).json();
  } catch (error) {
    res.status(error.code).json({ message: error.message });
  }
});

orderRouter.patch("/:id/complete", async (req, res) => {
  try {
    const { userType } = req.user;
    const { id: orderId } = req.params;

    if (![ADMIN, CHEF].includes(userType))
      return res
        .status(FORBIDDEN)
        .json({ message: "Only a chef can mark an order as complete." });

    await orderController.markAsComplete({ orderId });
    return res.status(NO_CONTENT).json();
  } catch (error) {
    res.status(error.code).json({ message: error.message });
  }
});
export default orderRouter;
