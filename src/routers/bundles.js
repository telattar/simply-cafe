import express from 'express';
import { ADMIN, MANAGER } from '../constants/userTypes.js';
import { CREATED, FORBIDDEN, NO_CONTENT, OK } from '../constants/statusCode.js';
import { bundleController } from '../controllers/bundle.js';

const bundleRouter = new express.Router();

bundleRouter.post('/createBundle', async (req, res) => {
    try {
        if (![MANAGER, ADMIN].includes(req.user.userType))
            return res.status(FORBIDDEN).json({ message: "Only a manager can create a bundle." });

        const { bundleName, itemIds, discount, limitedEdition, expiresOn, description } = req.body;
        const newBundle = await bundleController.createNewBundle({ bundleName, itemIds, discount, limitedEdition, expiresOn, description });

        return res.status(CREATED).json({ newBundle });
    } catch (error) {
        return res.status(error.code).json({ message: error.message });
    }
});

bundleRouter.get('/getBundle', async (req, res) => {
    try {
        if (![MANAGER, ADMIN].includes(req.user.userType))
            return res.status(FORBIDDEN).json({ message: "Only a manager can view a specific bundle's details." });

        const { bundleId } = req.query;
        const bundle = await bundleController.getBundle({ bundleId });

        return res.status(OK).json({ bundle });
    } catch (error) {
        return res.status(error.code).json({ message: error.message });
    }
});

bundleRouter.patch('/updateBundle', async (req, res) => {
    try {
        if (![MANAGER, ADMIN].includes(req.user.userType))
            return res.status(FORBIDDEN).json({ message: "Only a manager can update a bundle." });

        const { bundleId } = req.query;
        const { discount, description, limitedEdition, expiresOn } = req.body;

        await bundleController.updateBundle({ bundleId, discount, description, limitedEdition, expiresOn });
        res.status(NO_CONTENT).json();

    } catch (error) {
        return res.status(error.code).json({ message: error.message });
    }
});

bundleRouter.delete('/deleteBundle', async (req, res) => {
    try {
        if (![MANAGER, ADMIN].includes(req.user.userType))
            return res.status(FORBIDDEN).json({ message: "Only a manager can delete a bundle." });

        const { bundleId } = req.query;
        await bundleController.deleteBundle({ bundleId });

        return res.status(OK).json({ message: "Bundle deleted successfully" });

    } catch (error) {
        return res.status(error.code).json({ message: error.message });
    }
});

export default bundleRouter;