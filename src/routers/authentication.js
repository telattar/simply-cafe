import express from "express";
import { authenticationController } from "../controllers/authController.js";
import { BAD_REQUEST, CREATED, OK, UNAUTHORIZED } from "../constants/statusCode.js";
import { userValidationSchema } from "../models/users.js";
import { config } from 'dotenv';
import jwt from 'jsonwebtoken';


config();
const authRouter = new express.Router();

//assume cookie expires after 1 month
const maxAge = 30 * 24 * 60 * 60;
authRouter.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const { userId, userType } = await authenticationController.login({ username, password });

        //no errors thrown means successful login
        const token = jwt.sign({ userId, userType }, process.env.JWT_SECRET_TOKEN, {
            expiresIn: maxAge,
        });

        // in cookies, maxAge is dealt in milliseconds. to use seconds, multiply by 1000
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(OK).json({ userId, userType });
    } catch (error) {
        res.status(error.code).json({ message: error.message });
    }
});

authRouter.post('/signUp', async (req, res) => {
    try {
        const { error } = userValidationSchema.validate(req.body);
        if (error)
            return res.status(BAD_REQUEST).json({ message: error.details.map(detail => detail.message).join(', ') });

        const { username, password, firstName, lastName, email, gender } = req.body;
        const user = await authenticationController.signUp({ username, password, firstName, lastName, email, gender });
        return res.status(CREATED).json({ user });
    } catch (error) {
        return res.status(error.code).json({ message: error.message });
    }
});

authRouter.post('/logout', async (req, res) => {
    try {
        const cookie = req.cookies.jwt;

        if (!cookie)
            return res.status(UNAUTHORIZED).json({ message: "You are not logged in." });

        // set the maximum age to zero so it goes away immediately.
        res.cookie('jwt', '', { httpOnly: true, maxAge: 0 });
        res.status(OK).json({ message: "Logged out successfully." });
    } catch (error) {
        return res.status(error.code).json({ message: error.message });
    }
});
export default authRouter;