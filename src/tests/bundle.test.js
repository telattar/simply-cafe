import mongoose from "mongoose";
import app from "../index.js";
import { config } from "dotenv";
import request from "supertest";
import { faker } from "@faker-js/faker";
import { Items } from "../models/items.js";
import { BAD_REQUEST, CREATED, FORBIDDEN, NOT_FOUND, NO_CONTENT, OK } from "../constants/statusCode.js";
import { Bundles } from "../models/bundles.js";

config();

// to use the same agent in all tests.
const req = request.agent(app);
var itemIds;
process.env.TEST = 'true';

beforeAll(async () => {
    // close the production database
    if (mongoose.connection.readyState !== 0)
        await mongoose.disconnect();

    await mongoose.connect(process.env.testURI);
    itemIds = await Items.find().limit(2).select('_id');
});

afterAll(async () => {
    await mongoose.disconnect();
});


describe("POST /bundle/createBundle", () => {

    describe("Testing successful bundle creation", () => {
        test("A manager can create a bundle of items", async () => {
            const bundleName = faker.string.alpha(12);
            const discount = faker.number.int({ min: 2, max: 100 });
            const limitedEdition = true;
            const expiresOn = faker.date.future();
            const description = faker.lorem.sentence();

            await req.post("/login").send({
                username: process.env.TEST_MANAGER_USERNAME,
                password: process.env.TESTING_AUTH_PASSWORD
            });

            const response = await req.post("/bundle/createBundle").send({
                bundleName,
                itemIds,
                discount,
                limitedEdition,
                expiresOn,
                description
            });

            expect(response.status).toBe(CREATED);
            expect(response.body.newBundle.bundleName).toBe(bundleName);
            expect(response.body.newBundle.discount).toBe(discount);
            expect(response.body.newBundle.description).toBe(description);
        });
    });

    describe("Testing unsuccessful bundle creation", () => {
        test("Customers can not create a bundle", async () => {
            await req.post("/login").send({
                username: process.env.TEST_CUSTOMER_USERNAME,
                password: process.env.TESTING_AUTH_PASSWORD
            });

            const response = await req.post("/bundle/createBundle");

            expect(response.status).toBe(FORBIDDEN);
            expect(response.body.message).toBe("Only a manager can create a bundle.");
        });

        test("Using similar bundle name", async () => {
            const bundleName = faker.string.alpha();
            const discount = faker.number.int({ min: 2, max: 100 });
            const limitedEdition = true;
            const expiresOn = faker.date.future();
            const description = faker.lorem.sentence();

            await req.post("/login").send({
                username: process.env.TEST_MANAGER_USERNAME,
                password: process.env.TESTING_AUTH_PASSWORD
            });

            // first time creation
            await req.post("/bundle/createBundle").send({
                bundleName,
                itemIds,
                discount,
                limitedEdition,
                expiresOn,
                description
            });

            const response = await req.post("/bundle/createBundle").send({
                bundleName,
                itemIds,
                discount: faker.number.int({ min: 2, max: 100 }),
                description: faker.lorem.sentence()
            });

            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toBe("There is already a bundle with this name.");
        });

        test("Creating a bundle with no items", async () => {
            const bundleName = faker.string.alpha(12);
            const discount = faker.number.int({ min: 2, max: 100 });
            const limitedEdition = true;
            const expiresOn = faker.date.future();
            const description = faker.lorem.sentence();

            const response = await req.post("/bundle/createBundle").send({
                bundleName,
                itemIds: [],
                discount,
                limitedEdition,
                expiresOn,
                description
            });

            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toContain("items");
        });
    });

    test("Creating a bundle with past expiry date", async () => {
        const bundleName = faker.string.alpha();
        const discount = faker.number.int({ min: 2, max: 100 });
        const limitedEdition = true;
        const expiresOn = faker.date.past();
        const description = faker.lorem.sentence();

        const response = await req.post("/bundle/createBundle").send({
            bundleName,
            itemIds,
            discount,
            limitedEdition,
            expiresOn,
            description
        });

        expect(response.status).toBe(BAD_REQUEST);
        expect(response.body.message).toContain("expiresOn");
    });

    test("Creating a bundle with discount more than 100", async () => {
        const bundleName = faker.string.alpha();
        const discount = faker.number.int({ min: 101 });
        const description = faker.lorem.sentence();

        const response = await req.post("/bundle/createBundle").send({
            bundleName,
            itemIds,
            discount,
            description
        });

        expect(response.status).toBe(BAD_REQUEST);
        expect(response.body.message).toContain("discount");
    });

    test("Creating a bundle with missing fields", async () => {
        const bundleName = faker.string.alpha(12);
        const discount = faker.number.int({ max: 100 });

        const response = await req.post("/bundle/createBundle").send({
            bundleName,
            itemIds,
            discount,
        });

        expect(response.status).toBe(BAD_REQUEST);
        expect(response.body.message).toContain("description");
    });
});


describe("GET /bundle/getBundle", () => {
    test("A manager can read a bundle's details", async () => {
        const { _id } = await Bundles.findOne({}).lean();

        await req.post("/login").send({
            username: process.env.TEST_MANAGER_USERNAME,
            password: process.env.TESTING_AUTH_PASSWORD
        });

        const response = await req.get(`/bundle/getBundle?bundleId=${_id}`);

        expect(response.status).toBe(OK);
        expect(response.body.bundle._id).toBe(_id.toString());
    });

    test("A customer can not read a bundle's details", async () => {
        await req.post("/login").send({
            username: process.env.TEST_CUSTOMER_USERNAME,
            password: process.env.TESTING_AUTH_PASSWORD
        });

        const response = await req.get("/bundle/getBundle");

        expect(response.status).toBe(FORBIDDEN);
        expect(response.body.message).toBe("Only a manager can view a specific bundle's details.");
    });
});

describe("PATCH /bundle/updateBundle", () => {
    test("A manager can update a bundle's details", async () => {
        const { _id } = await Bundles.findOne({}).lean();

        await req.post("/login").send({
            username: process.env.TEST_MANAGER_USERNAME,
            password: process.env.TESTING_AUTH_PASSWORD
        });

        const response = await req.patch(`/bundle/updateBundle?bundleId=${_id}`).send({
            discount: faker.number.int({ max: 100 }),
            description: faker.lorem.sentence()
        });

        expect(response.status).toBe(NO_CONTENT);
    });

    describe("Testing unsuccessful bundle updates", () => {
        test("Customers can not update a bundle", async () => {
            await req.post("/login").send({
                username: process.env.TEST_CUSTOMER_USERNAME,
                password: process.env.TESTING_AUTH_PASSWORD
            });

            const response = await req.patch("/bundle/updateBundle");

            expect(response.status).toBe(FORBIDDEN);
            expect(response.body.message).toBe("Only a manager can update a bundle.");
        });

        test("Updating a bundle with missing bundleId", async () => {
            const { _id } = await Bundles.findOne({}).lean();

            await req.post("/login").send({
                username: process.env.TEST_MANAGER_USERNAME,
                password: process.env.TESTING_AUTH_PASSWORD
            });

            const response = await req.patch("/bundle/updateBundle");

            expect(response.status).toBe(NOT_FOUND);
            expect(response.body.message).toContain("No such bundle exists.");
        });

        test("Updating a bundle with an invalid discount", async () => {
            const { _id } = await Bundles.findOne({}).lean();

            await req.post("/login").send({
                username: process.env.TEST_MANAGER_USERNAME,
                password: process.env.TESTING_AUTH_PASSWORD
            });

            const response = await req.patch(`/bundle/updateBundle?bundleId=${_id}`).send({
                discount: faker.number.int({ min: 100 }),
            });

            expect(response.status).toBe(BAD_REQUEST);
            expect(response.body.message).toContain("discount");
        });
    });
});

describe("DELETE /bundle/deleteBundle", () => {
    test("A manager can delete a bundle", async () => {
        const { _id } = await Bundles.findOne({}).lean();

        await req.post("/login").send({
            username: process.env.TEST_MANAGER_USERNAME,
            password: process.env.TESTING_AUTH_PASSWORD
        });

        const response = await req.delete(`/bundle/deleteBundle?bundleId=${_id}`);

        expect(response.status).toBe(OK);
        expect(response.body.message).toBe("Bundle deleted successfully.");
    });

    describe("Testing unsuccessful bundle deletions", () => {
        test("A customer can not delete a bundle", async () => {
            await req.post("/login").send({
                username: process.env.TEST_CUSTOMER_USERNAME,
                password: process.env.TESTING_AUTH_PASSWORD
            });

            const response = await req.delete("/bundle/deleteBundle");

            expect(response.status).toBe(FORBIDDEN);
            expect(response.body.message).toBe("Only a manager can delete a bundle.");
        });

        test("not providing a bundleId", async () => {
            await req.post("/login").send({
                username: process.env.TEST_MANAGER_USERNAME,
                password: process.env.TESTING_AUTH_PASSWORD
            });

            const response = await req.delete("/bundle/deleteBundle");

            expect(response.status).toBe(NOT_FOUND);
            expect(response.body.message).toBe("No such bundle with this ID.");
        });
    });
});