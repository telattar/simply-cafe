import express from 'express';
import { BUNDLE, ITEM } from '../models/menu.js';
import { menuController } from '../controllers/menu.js';
import { BAD_REQUEST, CREATED, FORBIDDEN, NO_CONTENT, OK } from '../constants/statusCode.js';
import { ADMIN, CHEF, MANAGER } from '../constants/userTypes.js';

const menuRouter = express.Router();

menuRouter.post('/addToMenu', async (req, res) => {
    try {
        const { userType } = req.user;
        const { type, availability, stockCount } = req.body;

        if (!type)
            return res.status(BAD_REQUEST).json({ message: "Please specify whether you're adding an Item or a Bundle." });

        if (type === BUNDLE) {
            if (![ADMIN, MANAGER].includes(userType))
                return res.status(FORBIDDEN).json({ message: "Only a manager can add a bundle to the menu." });

            const { bundleId } = req.body;
            const addedBundle = await menuController.addBundle({ bundleId, availability, stockCount });
            return res.status(CREATED).json({ addedBundle });
        }

        else if (type === ITEM) {
            if (![ADMIN, CHEF].includes(userType))
                return res.status(FORBIDDEN).json({ message: "Only a chef can add an item to the menu." });

            const { itemId } = req.body;
            const addedItem = await menuController.addItem({ itemId, availability, stockCount });
            return res.status(CREATED).json({ addedItem });
        }
    } catch (error) {
        return res.status(error.code).json({ message: error.message });
    }
});

menuRouter.get('/getMenu', async (req, res) => {
    try {
        const menu = await menuController.getMenu();
        return res.status(OK).json({ menu });
    } catch (error) {
        return res.status(error.code).json({ message: error.message });
    }
});

menuRouter.patch('/updateStock', async (req, res) => {
    try {
        const { userType } = req.user;
        const { type, stockCount } = req.body;

        if (!type)
            return res.status(BAD_REQUEST).json({ message: "please specify whether you're updating an Item or a Bundle." });

        if (type === BUNDLE) {
            if (![ADMIN, MANAGER].includes(userType))
                return res.status(FORBIDDEN).json({ message: "Only a manager can update the stock of a bundle." });

            const { bundleId } = req.body;
            await menuController.updateBundleStock({ bundleId, stockCount });
            return res.status(NO_CONTENT).json();
        }

        else if (type === ITEM) {
            if (![ADMIN, CHEF].includes(userType))
                return res.status(FORBIDDEN).json({ message: "Only a chef can update the stock of an item." });

            const { itemId } = req.body;
            await menuController.updateItemStock({ itemId, stockCount });
            return res.status(NO_CONTENT).json();
        }
    } catch (error) {
        return res.status(error.code).json({ message: error.message });
    }
});

menuRouter.delete("/removeFromMenu", async (req, res) => {
    try {
        const { userType } = req.user;
        const { type } = req.body;

        if (!type)
            return res.status(BAD_REQUEST).json({ message: "please specify whether you're removing an Item or a Bundle." });

        if (type === BUNDLE) {
            if (![ADMIN, MANAGER].includes(userType))
                return res.status(FORBIDDEN).json({ message: "Only a manager can remove a bundle from the menu." });

            const { bundleId } = req.body;
            await menuController.removeBundleFromMenu({ bundleId });
            return res.status(OK).json({ message: "Bundle removed from menu successfully." });
        }

        else if (type === ITEM) {
            if (![ADMIN, CHEF].includes(userType))
                return res.status(FORBIDDEN).json({ message: "Only a chef can remove an item from the menu." });

            const { itemId } = req.body;
            await menuController.removeItemFromMenu({ itemId });
            return res.status(OK).json({ message: "Item removed from menu successfully." });
        }
    } catch (error) {
        return res.status(error.code).json({ message: error.message });
    }
});
export default menuRouter;