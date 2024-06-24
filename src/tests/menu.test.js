import mongoose from "mongoose";
import app from "../index.js";
import { config } from "dotenv";
import request from "supertest";
import { faker } from "@faker-js/faker";
import { Items } from "../models/items.js";
import { BAD_REQUEST, CREATED, FORBIDDEN, NOT_FOUND, NO_CONTENT, OK } from "../constants/statusCode.js";
import { Bundles } from "../models/bundles.js";
import { BUNDLE, ITEM, Menu } from "../models/menu.js";
import { BAKERY, COFFEE } from "../constants/menuItems.js";

config();

async function createFakeItem() {
    const item = await Items.create({
        itemType: COFFEE,
        itemName: faker.string.alpha(7),
        price: faker.number.int({ max: 100 }),
        description: faker.lorem.sentence()
    });
    return item;
}

// to use the same agent in all tests.
const req = request.agent(app);
const password = process.env.TESTING_AUTH_PASSWORD;

beforeAll(async () => {
    // close the production database
    if (mongoose.connection.readyState !== 0)
        await mongoose.disconnect();

    await mongoose.connect(process.env.testURI);
});

afterAll(async () => {
    await mongoose.disconnect();
});

describe("/menu/addToMenu", () => {
    describe("Testing successful menu additions", () => {
        test("A chef can add an item to the menu", async () => {
            const { _id: itemId } = await createFakeItem();

            await req.post("/login").send({
                username: process.env.TEST_CHEF_USERNAME,
                password
            });

            const response = await req.post("/menu/addToMenu").send({
                type: ITEM,
                itemId,
                availability: true,
                stockCount: 10
            });

            expect(response.status).toBe(CREATED);
            expect(response.body.addedItem.type).toBe(ITEM);
            expect(response.body.addedItem.stockCount).toBe(10);
        });

        test("A manager can add a bundle to the menu", async () => {
            const { _id: itemId } = await createFakeItem();
            const { _id: itemId2 } = await createFakeItem();

            await req.post("/login").send({
                username: process.env.TEST_MANAGER_USERNAME,
                password
            });

            const bundle = await req.post("/bundle/createBundle").send({
                bundleName: faker.string.alpha(7),
                itemIds: [itemId, itemId2],
                discount: faker.number.int({ max: 100 }),
                description: faker.lorem.sentence()
            });

            const response = await req.post("/menu/addToMenu").send({
                type: BUNDLE,
                bundleId: bundle.body.newBundle._id,
                availability: true,
                stockCount: 2
            });

            expect(response.status).toBe(CREATED);
            expect(response.body.addedBundle.type).toBe(BUNDLE);
            expect(response.body.addedBundle.stockCount).toBe(2);
        });
    });

    describe("Testing unsuccessful menu additions", () => {
        test("A customer can not add anything to the menu", async () => {
            await req.post("/login").send({
                username: process.env.TEST_CUSTOMER_USERNAME,
                password
            });

            let response = await req.post("/menu/addToMenu").send({ type: ITEM });
            expect(response.status).toBe(FORBIDDEN);
            expect(response.body.message).toBe("Only a chef can add an item to the menu.");

            response = await req.post("/menu/addToMenu").send({ type: BUNDLE });
            expect(response.status).toBe(FORBIDDEN);
            expect(response.body.message).toBe("Only a manager can add a bundle to the menu.");
        });

        test("The request can not be done without providing a type", async () => {
            await req.post("/login").send({
                username: process.env.TEST_MANAGER_USERNAME,
                password
            });

            const response = await req.post("/menu/addToMenu");
            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toBe("Please specify whether you're adding an Item or a Bundle.");
        });

        test("Trying to add a nonexistent bundle to the menu", async () => {
            const response = await req.post("/menu/addToMenu").send({
                type: BUNDLE,
                bundleId: faker.database.mongodbObjectId(),
                availability: true,
                stockCount: 2
            });
            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toBe("No such bundle with this ID.");
        });

        test("Trying to add a bundle that already exists in the menu", async () => {
            const { bundle: { _id: bundleId } } = await Menu.findOne({ type: BUNDLE }).lean();

            const response = await req.post("/menu/addToMenu").send({
                type: BUNDLE,
                bundleId,
                availability: true,
                stockCount: 2
            });
            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toBe("This bundle is already in the menu.");
        });

        test("Trying to add a bundle with missing entries", async () => {
            const { _id: itemId } = await createFakeItem();
            const { _id: itemId2 } = await createFakeItem();

            const bundle = await req.post("/bundle/createBundle").send({
                bundleName: faker.string.alpha(7),
                itemIds: [itemId, itemId2],
                discount: faker.number.int({ max: 100 }),
                description: faker.lorem.sentence()
            });

            const response = await req.post("/menu/addToMenu").send({
                type: BUNDLE,
                bundleId: bundle.body.newBundle._id,
                availability: true,
            });
            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toContain("stockCount");
        });

        test("Trying to add an item that already exists in the menu", async () => {
            await req.post("/login").send({
                username: process.env.TEST_CHEF_USERNAME,
                password
            });

            const { item: { _id: itemId } } = await Menu.findOne({ type: ITEM }).lean();

            const response = await req.post("/menu/addToMenu").send({
                type: ITEM,
                itemId,
                availability: true,
                stockCount: 2
            });
            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toBe("This item is already in the menu.");
        });

        test("Trying to add an item with missing details", async () => {
            const { _id: itemId } = await createFakeItem();

            const response = await req.post("/menu/addToMenu").send({
                type: ITEM,
                itemId,
                availability: true,
            });

            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toContain("stockCount");
        });

    });
});

describe("/menu/getMenu", () => {
    test.concurrent("A logged in user can see the menu", async () => {
        await req.post("/login").send({
            username: process.env.TEST_CHEF_USERNAME,
            password
        });

        const response = await req.get("/menu/getMenu");
        expect(response.status).toBe(OK);
        expect(response.body.menu).not.toBeNull();
    });
});

describe("/menu/updateStock", () => {
    describe("Testing successful menu stock updates", () => {

        test("A manager can update a bundle's stock", async () => {
            await req.post("/login").send({
                username: process.env.TEST_MANAGER_USERNAME,
                password
            });

            const { bundle: { _id: bundleId } } = await Menu.findOne({ type: BUNDLE }).lean();
            const response = await req.patch("/menu/updateStock").send({
                type: BUNDLE,
                stockCount: faker.number.int({ max: 30 }),
                bundleId
            });

            expect(response.status).toBe(NO_CONTENT);
        });

        test("A chef can update an item's stock", async () => {
            await req.post("/login").send({
                username: process.env.TEST_CHEF_USERNAME,
                password
            });

            const { item: { _id: itemId } } = await Menu.findOne({ type: ITEM }).lean();
            const response = await req.patch("/menu/updateStock").send({
                type: ITEM,
                stockCount: faker.number.int({ max: 30 }),
                itemId
            });

            expect(response.status).toBe(NO_CONTENT);
        });
    });

    describe("Testing unsuccessful menu stock updates", () => {
        test("A chef tries to update the stock without specifying the count", async () => {
            // use logged in chef from preceding test
            const { item: { _id: itemId } } = await Menu.findOne({ type: ITEM }).lean();
            const response = await req.patch("/menu/updateStock").send({
                type: ITEM,
                itemId
            });

            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toBe("Please provide a stock count.");
        });

        test("A manager tries to update the stock without specifying the count", async () => {
            await req.post("/login").send({
                username: process.env.TEST_MANAGER_USERNAME,
                password
            });

            const { bundle: { _id: bundleId } } = await Menu.findOne({ type: BUNDLE }).lean();
            const response = await req.patch("/menu/updateStock").send({
                type: BUNDLE,
                bundleId
            });

            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toBe("Please provide a stock count.");
        });

        test("A manager tries to update a nonexistent menu bundle", async () => {
            const response = await req.patch("/menu/updateStock").send({
                type: BUNDLE,
                stockCount: faker.number.int({ max: 30 }),
                bundleId: faker.database.mongodbObjectId()
            });

            expect(response.status).toBe(NOT_FOUND);
            expect(response.body.message).toBe("No bundle found with this Id.");
        });

        test("A customer tries to update the menu", async () => {
            await req.post("/login").send({
                username: process.env.TEST_CUSTOMER_USERNAME,
                password
            });

            let response = await req.patch("/menu/updateStock").send({ type: ITEM });
            expect(response.status).toBe(FORBIDDEN);
            expect(response.body.message).toBe("Only a chef can update the stock of an item.");

            response = await req.patch("/menu/updateStock").send({ type: BUNDLE });
            expect(response.status).toBe(FORBIDDEN);
            expect(response.body.message).toBe("Only a manager can update the stock of a bundle.");
        });
    });
});


describe("/menu/removeFromMenu", () => {
    describe("Testing successful removal from menu", () => {
        test("A manager removes a bundle from the menu", async () => {
            await req.post("/login").send({
                username: process.env.TEST_MANAGER_USERNAME,
                password
            });

            const { bundle: { _id: bundleId } } = await Menu.findOne({ type: BUNDLE }).lean();
            const response = await req.delete("/menu/removeFromMenu").send({
                type: BUNDLE,
                bundleId
            });

            expect(response.status).toBe(OK);
            expect(response.body.message).toBe("Bundle removed from menu successfully.");
        });

        test("A manager removes a bundle from the menu", async () => {
            await req.post("/login").send({
                username: process.env.TEST_CHEF_USERNAME,
                password
            });

            const { item: { _id: itemId } } = await Menu.findOne({ type: ITEM }).lean();
            const response = await req.delete("/menu/removeFromMenu").send({
                type: ITEM,
                itemId
            });

            expect(response.status).toBe(OK);
            expect(response.body.message).toBe("Item removed from menu successfully.");
        });
    });

    describe("Testing unsuccessful removal from menu", () => {
        test("A chef tries to remove a bundle", async () => {
            const { bundle: { _id: bundleId } } = await Menu.findOne({ type: BUNDLE }).lean();
            const response = await req.delete("/menu/removeFromMenu").send({
                type: BUNDLE,
                bundleId
            });

            expect(response.status).toBe(FORBIDDEN);
            expect(response.body.message).toBe("Only a manager can remove a bundle from the menu.");
        });

        test("A chef tries no remove a nonexistent item", async () => {
            const response = await req.delete("/menu/removeFromMenu").send({
                type: ITEM,
                itemId: faker.database.mongodbObjectId()
            });

            expect(response.status).toBe(NOT_FOUND);
            expect(response.body.message).toBe("No such item with this ID.");
        });

        test("A manager tries to remove an item", async () => {
            await req.post("/login").send({
                username: process.env.TEST_MANAGER_USERNAME,
                password
            });

            const { item: { _id: itemId } } = await Menu.findOne({ type: ITEM }).lean();
            const response = await req.delete("/menu/removeFromMenu").send({
                type: ITEM,
                itemId
            });

            expect(response.status).toBe(FORBIDDEN);
            expect(response.body.message).toBe("Only a chef can remove an item from the menu.");
        });

        test("A manager tries to remove a nonexistent bundle", async () => {
            const response = await req.delete("/menu/removeFromMenu").send({
                type: BUNDLE,
                bundleId: faker.database.mongodbObjectId()
            });

            expect(response.status).toBe(NOT_FOUND);
            expect(response.body.message).toBe("No such bundle with this ID.");
        });

        test("A customer tries to remove something from the menu", async () => {
            await req.post("/login").send({
                username: process.env.TEST_CUSTOMER_USERNAME,
                password
            });

            let response = await req.delete("/menu/removeFromMenu").send({ type: ITEM });
            expect(response.status).toBe(FORBIDDEN);
            expect(response.body.message).toBe("Only a chef can remove an item from the menu.");

            response = await req.delete("/menu/removeFromMenu").send({ type: BUNDLE });
            expect(response.status).toBe(FORBIDDEN);
            expect(response.body.message).toBe("Only a manager can remove a bundle from the menu.");
        });
    });
});
