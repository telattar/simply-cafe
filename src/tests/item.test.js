import mongoose from "mongoose";
import app from "../index.js";
import { config } from "dotenv";
import request from "supertest";
import { faker } from "@faker-js/faker"
import { BAD_REQUEST, CREATED, FORBIDDEN, NOT_FOUND, NO_CONTENT, OK } from "../constants/statusCode.js";
import { COFFEE, TEA } from "../constants/menuItems.js";
import { Items } from "../models/items.js";
config();

// to use the same agent in all tests.
const req = request.agent(app);

beforeAll(async () => {
    // close the production database
    if (mongoose.connection.readyState !== 0)
        await mongoose.disconnect();

    await mongoose.connect(process.env.testURI);
});

afterAll(async () => {
    await mongoose.disconnect();
});


describe("POST /item/createItem", () => {
    describe("Testing successful item creation", () => {
        test("A logged in chef can create an item", async () => {
            // log in as chef: i have a record of a chef's username and password in my env file.
            await req.post('/login').send({
                username: process.env.TEST_CHEF_USERNAME,
                password: process.env.TESTING_AUTH_PASSWORD
            });

            const itemType = COFFEE;
            const itemName = faker.string.alpha(12);
            const price = faker.number.int({ max: 200 });
            const description = faker.lorem.sentence(2);

            const response = await req.post('/item/createItem').send({
                itemType,
                itemName,
                price,
                description
            });

            expect(response.status).toBe(CREATED);
            expect(response.body.newItem.itemName).toBe(itemName);
            expect(response.body.newItem.price).toBe(price);
            expect(response.body.newItem.description).toBe(description);
        });
    });

    describe("Testing unsuccessful item creation.", () => {
        test("A customer is not allowed to create an item", async () => {
            await req.post('/login').send({
                username: process.env.TEST_CUSTOMER_USERNAME,
                password: process.env.TESTING_AUTH_PASSWORD
            });

            // it is not necessary to include anything in the request body as it will not even process it.
            const response = await req.post('/item/createItem');

            expect(response.status).toBe(FORBIDDEN);
            expect(response.body.message).toBe("Only a chef can create an item.");
        });

        test("Item types can only be certain entries", async () => {
            await req.post('/login').send({
                username: process.env.TEST_CHEF_USERNAME,
                password: process.env.TESTING_AUTH_PASSWORD
            });

            const response = await req.post('/item/createItem').send({
                itemType: faker.string.alpha(12),
                itemName: faker.string.alpha(),
                price: faker.number.int({ max: 200 }),
                description: faker.lorem.sentence()
            });
            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toContain("itemType");
        });

        test("Item price can not be more than 200", async () => {
            const response = await req.post('/item/createItem').send({
                itemType: COFFEE,
                itemName: faker.string.alpha(12),
                price: faker.number.int({ min: 300 }),
                description: faker.lorem.sentence()
            });
            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toContain("price");
        });

        test("Testing item creation with missing entries", async () => {
            const response = await req.post('/item/createItem').send({
                itemName: faker.string.alpha(),
                price: faker.number.int({ max: 200 }),
            });
            expect(response.status).toBe(BAD_REQUEST);
        });

        test("Item name should be unique", async () => {
            const itemType = COFFEE;
            const itemName = faker.string.alpha(12);
            const price = faker.number.int({ max: 200 });
            const description = faker.lorem.sentence();

            // first time creation
            await req.post('/item/createItem').send({
                itemType,
                itemName,
                price,
                description
            });

            // second time creation, same item name.
            const response = await req.post('/item/createItem').send({
                itemType: TEA,
                itemName,
                price: faker.number.int({ max: 200 }),
                description: faker.lorem.sentence()
            });

            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toBe("This item name already exists.");
        });
    });
});

describe("GET /item/getItem", () => {
    describe("Testing successful item read", () => {
        test("A chef can view all item details", async () => {
            // get some item id
            const { _id } = await Items.findOne({}).lean();

            await req.post('/login').send({
                username: process.env.TEST_CHEF_USERNAME,
                password: process.env.TESTING_AUTH_PASSWORD
            });

            const response = await req.get(`/item/getItem?itemId=${_id}`);

            expect(response.status).toBe(OK);
            expect(response.body.item._id).toBe(_id.toString());
        });
    });
    describe("Testing unsuccessful item read", () => {
        test("A customer is not allowed to view the details an item", async () => {
            await req.post('/login').send({
                username: process.env.TEST_CUSTOMER_USERNAME,
                password: process.env.TESTING_AUTH_PASSWORD
            });

            // it is not necessary to include anything in the request body as it will not even process it.
            const response = await req.get('/item/getItem');

            expect(response.status).toBe(FORBIDDEN);
            expect(response.body.message).toBe("Only a chef can view a specific item's details.");
        });

        test("ItemId not provided in query params", async () => {
            await req.post('/login').send({
                username: process.env.TEST_CHEF_USERNAME,
                password: process.env.TESTING_AUTH_PASSWORD
            });

            const response = await req.get("/item/getItem");

            expect(response.status).toBe(NOT_FOUND);
            expect(response.body.message).toBe("No such item.");
        });
    });
});


describe("PATCH /item/updateItem", () => {
    describe("Testing successful item update", () => {
        test("A chef can update item details", async () => {
            // get some item id
            const { _id, itemName, description } = await Items.findOne({}).lean();

            await req.post('/login').send({
                username: process.env.TEST_CHEF_USERNAME,
                password: process.env.TESTING_AUTH_PASSWORD
            });

            const response = await req.patch(`/item/updateItem?itemId=${_id}`).send({
                itemName,
                description,
                price: faker.number.int({ max: 200 })
            });

            expect(response.status).toBe(NO_CONTENT);
        });
    });
    describe("Testing unsuccessful item update", () => {
        test("A customer is not allowed to update the details an item", async () => {
            await req.post('/login').send({
                username: process.env.TEST_CUSTOMER_USERNAME,
                password: process.env.TESTING_AUTH_PASSWORD
            });

            // it is not necessary to include anything in the request body as it will not even process it.
            const response = await req.patch('/item/updateItem');

            expect(response.status).toBe(FORBIDDEN);
            expect(response.body.message).toBe("Only a chef can update an item.");
        });

        test("Missing details while sending request", async () => {
            await req.post('/login').send({
                username: process.env.TEST_CHEF_USERNAME,
                password: process.env.TESTING_AUTH_PASSWORD
            });

            const response = await req.patch("/item/updateItem");

            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toBe("Please make sure to include an item ID, an item name, a price, and a description.");
        });

        test("Using a nonexistent objectId", async () => {
            const id = faker.database.mongodbObjectId();
            const response = await req.patch(`/item/updateItem?itemId=${id}`).send({
                itemName: faker.string.alpha(12),
                description: faker.lorem.sentence(),
                price: faker.number.int({ max: 200 })
            });

            expect(response.status).toBe(NOT_FOUND);
            expect(response.body.message).toBe("No such item with this ID.");
        });

    });
});


describe("DELETE /item/deleteItem", () => {
    describe("Testing successful item deletion", () => {
        test("A chef can delete an item", async () => {
            //get some item id
            const { _id } = await Items.findOne({}).lean();

            await req.post("/login").send({
                username: process.env.TEST_CHEF_USERNAME,
                password: process.env.TESTING_AUTH_PASSWORD
            });

            const response = await req.delete(`/item/deleteItem?itemId=${_id}`);

            expect(response.status).toBe(OK);
            expect(response.body.message).toBe("Item deleted successfully.")
        });
    });

    describe("Testing unsuccessful item deletion", () => {
        test("A customer can not delete an item", async () => {
            await req.post("/login").send({
                username: process.env.TEST_CUSTOMER_USERNAME,
                password: process.env.TESTING_AUTH_PASSWORD
            });

            const response = await req.delete("/item/deleteItem");

            expect(response.status).toBe(FORBIDDEN);
            expect(response.body.message).toBe("Only a chef can delete an item.")

        });

        test("Using no item id", async () => {
            await req.post("/login").send({
                username: process.env.TEST_CHEF_USERNAME,
                password: process.env.TESTING_AUTH_PASSWORD
            });

            const response = await req.delete("/item/deleteItem");
            expect(response.status).toBe(NOT_FOUND);
            expect(response.body.message).toBe("No such item with this ID.");
        });
    })
});
