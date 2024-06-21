import express from "express";
import { ADMIN, CHEF } from "../constants/userTypes.js";
import { CREATED, FORBIDDEN, OK } from "../constants/statusCode.js";
import { itemController } from "../controllers/item.js";

const itemRouter = new express.Router();

itemRouter.post('/createItem', async (req, res) => {
    try {
        if (![CHEF, ADMIN].includes(req.user.userType))
            return res.status(FORBIDDEN).json({message: "Only a chef to create an item."});

        const { itemType, itemName, price, description } = req.body;
        const newItem = await itemController.createItem({ itemType, itemName, price, description });

        return res.status(CREATED).json({ newItem });

    } catch (error) {
        console.log(error);
        return res.status(error.code).json({message: error.message});
    }
});

itemRouter.get('/getItem', async (req, res) => {
    try {
        if (![CHEF, ADMIN].includes(req.user.userType))
            return res.status(FORBIDDEN).json({message: "Only a chef to view a specific item's details."});

        const { itemId } = req.query;
        const item = await itemController.getItem({ itemId });
        return res.status(OK).json({ item });
    } catch (error) {
        return res.status(error.code).json({message: error.message});
    }
});

itemRouter.delete('/deleteItem', async (req, res) => {
    try {
        if (![CHEF, ADMIN].includes(req.user.userType))
            return res.status(FORBIDDEN).json({message: "Only a chef to view a specific item's details."});
        
        const { itemId } = req.query;
        await itemController.deleteItem({ itemId });
        
        return res.status(OK).json({message: "Item deleted successfully."});
    } catch(error) {
        return res.status(error.code).json({message: error.message});
    }
});

export default itemRouter;