import express from "express";
import { ADMIN, CHEF } from "../constants/userTypes.js";
import { BAD_REQUEST, CREATED, FORBIDDEN, NO_CONTENT, OK } from "../constants/statusCode.js";
import { itemController } from "../controllers/item.js";

const itemRouter = new express.Router();

itemRouter.post('/createItem', async (req, res) => {
    try {
        if (![CHEF, ADMIN].includes(req.user.userType))
            return res.status(FORBIDDEN).json({ message: "Only a chef can create an item." });

        const { itemType, itemName, price, description } = req.body;
        const newItem = await itemController.createItem({ itemType, itemName, price, description });

        return res.status(CREATED).json({ newItem });

    } catch (error) {
        return res.status(error.code).json({ message: error.message });
    }
});

itemRouter.get('/getItem', async (req, res) => {
    try {
        if (![CHEF, ADMIN].includes(req.user.userType))
            return res.status(FORBIDDEN).json({ message: "Only a chef can view a specific item's details." });

        const { itemId } = req.query;
        const item = await itemController.getItem({ itemId });
        return res.status(OK).json({ item });
    } catch (error) {
        return res.status(error.code).json({ message: error.message });
    }
});

itemRouter.patch('/updateItem', async (req, res) => {
    try {
        if (![CHEF, ADMIN].includes(req.user.userType))
            return res.status(FORBIDDEN).json({ message: "Only a chef can update an item." });

        const { itemId } = req.query;
        const { itemName, price, description } = req.body;

        if (!itemId || !itemName || price == undefined || !description)
            return res.status(BAD_REQUEST).json({ message: "Please make sure to include an item ID, an item name, a price, and a description." });

        await itemController.updateItem({ itemId, itemName, price, description });

        return res.status(NO_CONTENT).json();
    } catch (error) {
        return res.status(error.code).json({ message: error.message });
    }
});

itemRouter.delete('/deleteItem', async (req, res) => {
    try {
        if (![CHEF, ADMIN].includes(req.user.userType))
            return res.status(FORBIDDEN).json({ message: "Only a chef can delete an item." });

        const { itemId } = req.query;
        await itemController.deleteItem({ itemId });

        return res.status(OK).json({ message: "Item deleted successfully." });
    } catch (error) {
        return res.status(error.code).json({ message: error.message });
    }
});



export default itemRouter;