import APIError from "../classes/APIError.js";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND, UNAUTHORIZED } from "../constants/statusCode.js";
import { CUSTOMER } from "../constants/userTypes.js";
import { Users } from "../models/users.js";
import bcrypt from 'bcrypt';

export const authenticationController = {
    /**
     * Login function, authenticates a valid user login and generates a corresponding jwt cookie for them.
     * @param { string } username
     * @param { string } password 
     * @returns { userId, userType } - an object that has the user ID and the user type.
     */
    async login({ username, password }) {
        try {
            const user = await Users.findOne({ username }).lean();
            if (!user)
                throw new APIError(UNAUTHORIZED, "This username does not exist.");

            const comparePassword = await bcrypt.compare(password, user.password);
            if (!comparePassword)
                throw new APIError(UNAUTHORIZED, "Username or Password is incorrect.");

            // successful login
            return { userId: user._id, userType: user.userType };
        } catch (error) {
            console.log(error);
            if (error instanceof APIError) throw error;
            else throw new APIError(INTERNAL_SERVER_ERROR, "Internal Server Error.");
        }
    },

    
    /**
    *Sign Up function, registers a new user in the system.
    * @param {string} username - The username of the new user. Should be unique.
    * @param {string} password - The password of the new user. Will be validated in the schema itself,
    * should contain at least 1 uppercase letter, 1 lowercase letter, and a digit. Minimum length is six.
    * @param {string} firstName - The first name of the new user.
    * @param {string} lastName - The last name of the new user.
    * @param {string} email - The email address of the new user. Will also be validated, and should be unique,
    * meaning each email address can be used only in 1 account.
    * @param {string} gender - The gender of the new user. MALE OR FEMALE ONLY.
    * @returns {Object} - the created user object.
    */
    async signUp({ username, password, firstName, lastName, email, gender }) {
        try {
            // salt for ten rounds.
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const user = await Users.create({
                username,
                password: hashedPassword,
                firstName,
                lastName,
                email,
                gender,
                userType: CUSTOMER
            });

            return user;

        } catch (error) {
            // email and username should be unique.
            if (error.code === 11000) {
                if (error.keyPattern.email)
                    throw new APIError(BAD_REQUEST, "This email is already in use");
                else if (error.keyPattern.username)
                    throw new APIError(BAD_REQUEST, "This username is already in use");
            }

            // check for validation errors.
            else if (error.name === "ValidationError") {
                let message = "";
                Object.keys(error.errors).forEach((key) => {
                    message += error.errors[key].message + " ";
                });
                throw new APIError(BAD_REQUEST, message);
            }

            else if (error instanceof APIError) throw error;

            else throw new APIError(INTERNAL_SERVER_ERROR, "Internal Error.");
        }
    }
}
