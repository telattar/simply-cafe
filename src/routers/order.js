import express from 'express';
import { ADMIN, CHEF, CUSTOMER } from '../constants/userTypes.js';
import { FORBIDDEN, NO_CONTENT, OK } from '../constants/statusCode.js';
import { orderController } from '../controllers/order.js';

const orderRouter = new express.Router();

orderRouter.post('/newOrder', async (req, res) => {
    try {
        console.log(req.user);
        const { userId: customerId, userType } = req.user;
        const { orderedItemIds, comment, paymentMethod } = req.body;

        if (userType !== CUSTOMER)
            return res.status(FORBIDDEN).json({ message: "Only a customer can make an order." });

        const newOrder = await orderController.createOrder({ customerId, orderedItemIds, comment, paymentMethod });
        return res.status(OK).json({ newOrder });
    } catch (error) {
        return res.status(error.code).json({ message: error.message });
    }
});

orderRouter.patch('/cancelOrder', async (req, res) => {
    try {
        const { userId: customerId, userType } = req.user;
        const { orderId } = req.query;

        if (userType !== CUSTOMER)
            return res.status(FORBIDDEN).json({ message: "Only a customer can cancel THEIR order." });

        await orderController.cancelOrder({ customerId, orderId });
        res.status(NO_CONTENT).json();
    } catch (error) {
        res.status(error.code).json({ message: error.message });
    }
});

orderRouter.patch('/completeOrder', async (req, res) => {
    try {
        const { userType } = req.user;
        const { orderId } = req.query;

        if (![ADMIN, CHEF].includes(userType))
            return res.status(FORBIDDEN).json({ message: "Only a chef can mark an order as complete." });

        await orderController.completeOrder({ orderId });
        return res.status(NO_CONTENT).json();
    } catch (error) {
        res.status(error.code).json({ message: error.message });
    }
});
export default orderRouter;