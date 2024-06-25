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
import { CASH, INSTAPAY } from "../constants/paymentMethod.js";
import { Orders } from "../models/orders.js";
import { Users } from "../models/users.js";
import { CUSTOMER } from "../constants/userTypes.js";
import { CANCELLED, PREPARING } from "../constants/orderStatus.js";

config();

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


describe("POST /order/newOrder", () => {
    test("A customer can make an order of an item that is available in the menu.", async () => {
        await req.post("/login").send({
            username: process.env.TEST_CUSTOMER_USERNAME,
            password
        });

        //get some menu item
        const { _id, stockCount } = await Menu.findOne({ availability: true }).lean();

        const response = await req.post("/order/newOrder").send({
            orderedItemIds: [_id],
            comment: faker.lorem.sentence(),
            paymentMethod: INSTAPAY
        });

        expect(response.status).toBe(CREATED);
        expect(response.body.newOrder.paymentMethod).toBe(INSTAPAY);

        const { stockCount: newStockCount } = await Menu.findOne({ _id }).lean();
        expect(newStockCount).toBe(stockCount - 1);
    });

    describe("Testing unsuccessful ordering attempts", () => {
        test("A customer making an order without specifying the ordered menu items", async () => {
            // use the logged in user from the preceding test
            const response = await req.post("/order/newOrder").send({
                orderedItemIds: [],
                comment: faker.lorem.sentence(),
                paymentMethod: INSTAPAY
            });

            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toBe("The ordered items are not in the menu OR are all out of stock.");
        });

        test("A customer tries to order an item that is out of stock", async () => {
            // nullify some item's stock
            const { _id, orderedItemIds, stockCount } = await Menu.updateOne({}, { availability: false, stockCount: 0 }).lean();

            const response = await req.post("/order/newOrder").send({
                orderedItemIds,
                comment: faker.lorem.sentence(),
                paymentMethod: INSTAPAY
            });

            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toBe("The ordered items are not in the menu OR are all out of stock.");

            // now undo the changes done to the item
            await Menu.updateOne({ _id }, { stockCount, availability: true });
        });

        test("A customer tries to order with missing details", async () => {
            const { _id } = await Menu.findOne({ availability: true }).lean();

            //payment method is required, comments are not.
            const response = await req.post("/order/newOrder").send({
                orderedItemIds: [_id],
                comment: faker.lorem.sentence(),
            });

            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toContain("paymentMethod");
        });

        test("A customer tries to order using a not allowed payment method", async () => {
            const { _id } = await Menu.findOne({ availability: true }).lean();

            const response = await req.post("/order/newOrder").send({
                orderedItemIds: [_id],
                comment: faker.lorem.sentence(),
                paymentMethod: faker.string.alpha(3)
            });

            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toContain("paymentMethod");
        });

        test("A manager tries to make an order", async () => {
            // sorry bro you just have to be a customer
            await req.post("/login").send({
                username: process.env.TEST_MANAGER_USERNAME,
                password
            });

            const response = await req.post("/order/newOrder");

            expect(response.status).toBe(FORBIDDEN);
            expect(response.body.message).toBe("Only a customer can make an order.");
        });
    });
});

describe("GET /order/viewMyOrder", () => {
    test("A customer can view their order", async () => {
        await req.post("/login").send({
            username: process.env.TEST_CUSTOMER_USERNAME,
            password
        });

        //since we use the same customer in all the tests, we can get any order Id.
        const { _id } = await Orders.findOne({}).lean();
        const response = await req.get(`/order/viewMyOrder?orderId=${_id}`);

        expect(response.status).toBe(OK);
        expect(response.body.order._id).toBe(_id.toString());
    });

    describe("Testing unsuccessful order viewing", () => {
        test("A customer can not view an order that is not theirs", async () => {
            const { _id } = await Menu.findOne({ availability: true }).lean();

            const newOrder = await req.post("/order/newOrder").send({
                orderedItemIds: [_id],
                comment: faker.lorem.sentence(),
                paymentMethod: CASH
            });

            //now update the new order's customer Id to some other Id
            await Orders.updateOne({ _id: newOrder.body.newOrder._id }, { customerId: faker.database.mongodbObjectId() });

            const response = await req.get(`/order/viewMyOrder?orderId=${newOrder.body.newOrder._id}`);

            expect(response.status).toBe(FORBIDDEN);
            expect(response.body.message).toBe("You can not view the details of an order that is not yours.");
        });

        test("A customer can not view a nonexistent order", async () => {
            const response = await req.get(`/order/viewMyOrder?orderId=${faker.database.mongodbObjectId()}`);

            expect(response.status).toBe(NOT_FOUND);
            expect(response.body.message).toBe("No such order with this ID.");
        });

        test("A chef can not view an order", async () => {
            // chefs, despite their ability to mark an order's complete, are not allowed to view a specific customer's
            // specific order details.

            await req.post("/login").send({
                username: process.env.TEST_CHEF_USERNAME,
                password
            });

            const response = await req.get("/order/viewMyOrder");
            expect(response.status).toBe(FORBIDDEN);
            expect(response.body.message).toBe("Only a customer can view their order.");
        });
    });
});


describe("PATCH /order/cancelOrder", () => {
    test("A customer can cancel their currently-being-prepared order", async () => {
        await req.post("/login").send({
            username: process.env.TEST_CUSTOMER_USERNAME,
            password
        });

        const { _id } = await Orders.findOne({ status: PREPARING }).lean();
        const response = await req.patch(`/order/cancelOrder?orderId=${_id}`);

        expect(response.status).toBe(NO_CONTENT);

        const updateOrder = await Orders.findOne({ _id }).lean();
        expect(updateOrder.status).toBe(CANCELLED);
    });

    describe("Testing unsuccessful order cancellation attempts", () => {
        test("A customer can not cancel a cancelled order", async () => {
            //use customer logged in from preceding test
            const { _id } = await Orders.findOne({ status: CANCELLED }).lean();
            const response = await req.patch(`/order/cancelOrder?orderId=${_id}`);

            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toContain("You can not cancel");
        });

        test("A customer can not cancel an order that is not theirs", async () => {
            const response = await req.patch(`/order/cancelOrder?orderId=${faker.database.mongodbObjectId()}`);

            expect(response.status).toBe(NOT_FOUND);
            expect(response.body.message).toBe("This order does not exist OR was not ordered by the currently logged in user.");
        });

        test("A chef can not cancel an order", async () => {
            await req.post("/login").send({
                username: process.env.TEST_CHEF_USERNAME,
                password
            });

            const response = await req.patch("/order/cancelOrder");

            expect(response.status).toBe(FORBIDDEN);
            expect(response.body.message).toBe("Only a customer can cancel THEIR order.");
        });
    });
});

describe("PATCH /order/completeOrder", () => {
    test("A chef can mark an order as complete", async () => {
        // use logged in chef from preceding test
        const { _id } = await Orders.findOne({ status: PREPARING }).lean();

        const response = await req.patch(`/order/completeOrder?orderId=${_id}`);
        expect(response.status).toBe(NO_CONTENT);
    });

    describe("Testing unsuccessful order completion", () => {
        test("A chef can not complete a nonexistent order", async () => {
            const response = await req.patch(`/order/completeOrder?orderId=${faker.database.mongodbObjectId()}`);
            expect(response.status).toBe(NOT_FOUND);

        });

        test("A cancelled order can not be completed", async () => {
            const { _id } = await Orders.findOne({ status: CANCELLED }).lean();
            const response = await req.patch(`/order/completeOrder?orderId=${_id}`);

            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toContain("You can not complete");
        });

        test("A customer can not mark an order as complete", async () => {
            await req.post("/login").send({
                username: process.env.TEST_CUSTOMER_USERNAME,
                password
            });

            const response = await req.patch("/order/completeOrder");
            expect(response.status).toBe(FORBIDDEN);
            expect(response.body.message).toBe("Only a chef can mark an order as complete.");
        });
    });
});