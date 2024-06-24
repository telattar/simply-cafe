import mongoose from "mongoose";
import app from "../index.js";
import { config } from "dotenv";
import { CUSTOMER, FEMALE, MALE } from "../constants/userTypes.js";
import request from "supertest";
import { faker } from "@faker-js/faker"
import { BAD_REQUEST, CREATED, OK, UNAUTHORIZED } from "../constants/statusCode.js";
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


describe("Testing successful signup, login and logout", () => {
    const username = faker.internet.userName().toLocaleLowerCase();
    const password = faker.internet.password();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email().toLocaleLowerCase();

    test("It should successfully sign up the user as a new customer.", async () => {
        const response = await req.post('/signup').send({
            username,
            password,
            firstName,
            lastName,
            email,
            gender: FEMALE
        });
        expect(response.status).toBe(CREATED);
        expect(response.body.user.username).toBe(username);
        expect(response.body.user.email).toBe(email);
        expect(response.body.user.userType).toBe(CUSTOMER);
    });

    test("It should allow the signed up user to login", async () => {
        const response = await req.post('/login').send({
            username,
            password
        });

        expect(response.status).toBe(OK);
        expect(response.body.userType).toBe(CUSTOMER);
    });

    test("It should logout the signed in user", async () => {
        const response = await req.post('/logout');

        expect(response.status).toBe(OK);
        expect(response.body.message).toBe("Logged out successfully.");
    });
});

describe("Testing unsuccessful signup", () => {
    const password = faker.internet.password();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    test("It should not allow a username with length less than 6", async () => {
        const response = await req.post('/signup').send({
            username: faker.string.alpha(4),
            password,
            firstName,
            lastName,
            email: faker.internet.email(),
            gender: FEMALE
        });

        expect(response.status).toBe(BAD_REQUEST);
        expect(response.body.message).toContain("username");
    });
    test("It should not allow signup without required fields such as first and last names", async () => {
        const response = await req.post('/signup').send({
            username: faker.string.alpha(10),
            password,
            email: faker.internet.email(),
            gender: FEMALE
        });

        expect(response.status).toBe(BAD_REQUEST);
        expect(response.body.message).toContain("firstName");
    });
    test("It should not allow signup without a properly written email", async () => {
        const response = await req.post('/signup').send({
            username: faker.string.alpha(10),
            password,
            email: faker.string.alpha(14),
            gender: FEMALE
        });

        expect(response.status).toBe(BAD_REQUEST);
        expect(response.body.message).toContain("email");
    });

    test("It should not allow signup using a weak password", async () => {
        const response = await req.post('/signup').send({
            username: faker.string.alpha(10),
            password: "123456",
            firstName,
            lastName,
            email: faker.internet.email(),
            gender: FEMALE
        });

        expect(response.status).toBe(BAD_REQUEST);
        expect(response.body.message).toContain("password");
    });

});

describe("Testing successful signup, with unsuccessful login", () => {
    const username = faker.internet.userName().toLocaleLowerCase();
    const password = faker.internet.password();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email().toLocaleLowerCase();

    test("It should successfully sign up the user as a new customer.", async () => {
        const response = await req.post('/signup').send({
            username,
            password,
            firstName,
            lastName,
            email,
            gender: MALE
        });
        expect(response.status).toBe(CREATED);
        expect(response.body.user.username).toBe(username);
        expect(response.body.user.email).toBe(email);
        expect(response.body.user.userType).toBe(CUSTOMER);
    });

    test("It should not allow logging in with a nonexistent username.", async () => {
        const response = await req.post('/login').send({
            username: faker.string.alpha(7),
            password
        });

        expect(response.status).toBe(UNAUTHORIZED);
        expect(response.body.message).toBe("This username does not exist.");
    });

    test("It should not allow logging in with a correct username and an incorrect password.", async () => {
        const response = await req.post('/login').send({
            username,
            password: faker.string.alpha(7)
        });

        expect(response.status).toBe(UNAUTHORIZED);
        expect(response.body.message).toBe("Username or Password is incorrect.");
    });
});