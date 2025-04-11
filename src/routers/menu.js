import express from "express";
import { BUNDLE, ITEM } from "../models/menu.js";
import { menuController } from "../controllers/menu.js";
import {
  BAD_REQUEST,
  CREATED,
  FORBIDDEN,
  NO_CONTENT,
  OK,
} from "../constants/statusCode.js";
import { ADMIN, CHEF, MANAGER } from "../constants/userTypes.js";

const menuRouter = express.Router();

menuRouter.post("/bundle", async (req, res) => {
  try {
    const { userType } = req.user;
    const { type, availability, stockCount } = req.body;

    if (!type)
      return res.status(BAD_REQUEST).json({
        message: "Please specify whether you're adding an Item or a Bundle.",
      });

    if (![ADMIN, MANAGER].includes(userType))
      return res
        .status(FORBIDDEN)
        .json({ message: "Only a manager can add a bundle to the menu." });

    const { bundleId } = req.body;
    const addedBundle = await menuController.addBundle({
      bundleId,
      availability,
      stockCount,
    });
    return res.status(CREATED).json({ addedBundle });
  } catch (error) {
    return res.status(error.code).json({ message: error.message });
  }
});

menuRouter.post("/item", async (req, res) => {
  const { userType } = req.user;
  const { type, availability, stockCount } = req.body;

  if (!type)
    return res.status(BAD_REQUEST).json({
      message: "Please specify whether you're adding an Item or a Bundle.",
    });

  if (![ADMIN, CHEF].includes(userType))
    return res
      .status(FORBIDDEN)
      .json({ message: "Only a chef can add an item to the menu." });

  const { itemId } = req.body;
  const addedItem = await menuController.addItem({
    itemId,
    availability,
    stockCount,
  });
  return res.status(CREATED).json({ addedItem });
});

menuRouter.get("", async (req, res) => {
  try {
    const menu = await menuController.getMenu();
    return res.status(OK).json({ menu });
  } catch (error) {
    return res.status(error.code).json({ message: error.message });
  }
});

menuRouter.patch("/bundle/:id/stock", async (req, res) => {
  try {
    const { userType } = req.user;
    const { stockCount } = req.body;

    if (![ADMIN, MANAGER].includes(userType))
      return res.status(FORBIDDEN).json({
        message: "Only a manager can update the stock of a bundle.",
      });

    const { id: bundleId } = req.params;
    await menuController.updateBundleStock({ bundleId, stockCount });
    return res.status(NO_CONTENT).json();
  } catch (error) {
    return res.status(error.code).json({ message: error.message });
  }
});

menuRouter.patch("/item/:id/stock", async (req, res) => {
  if (![ADMIN, CHEF].includes(userType))
    return res
      .status(FORBIDDEN)
      .json({ message: "Only a chef can update the stock of an item." });

  const { stockCount } = req.body;
  const { id: itemId } = req.params;

  await menuController.updateItemStock({ itemId, stockCount });
  return res.status(NO_CONTENT).json();
});

menuRouter.delete("/bundle/:id", async (req, res) => {
  try {
    const { userType } = req.user;

    if (![ADMIN, MANAGER].includes(userType))
      return res.status(FORBIDDEN).json({
        message: "Only a manager can remove a bundle from the menu.",
      });

    const { id: bundleId } = req.params;
    await menuController.deleteBundle({ bundleId });
    return res
      .status(OK)
      .json({ message: "Bundle removed from menu successfully." });
  } catch (error) {
    return res.status(error.code).json({ message: error.message });
  }
});

menuRouter.delete("/item/:id", async (req, res) => {
  try {
    const { userType } = req.user;

    if (![ADMIN, CHEF].includes(userType))
      return res.status(FORBIDDEN).json({
        message: "Only a chef can remove an item from the menu.",
      });

    const { id: itemId } = req.params;
    await menuController.deleteItem({ itemId });
    return res
      .status(OK)
      .json({ message: "Item removed from menu successfully." });
  } catch (error) {
    return res.status(error.code).json({ message: error.message });
  }
});

export default menuRouter;
