import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, REQUEST_TIMEOUT, UNAUTHORIZED } from "../constants/statusCode.js";

export default class APIError extends Error {
    code;
    message;

    constructor(code, message) {
        if (![BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, REQUEST_TIMEOUT, INTERNAL_SERVER_ERROR].includes(code)) {
            throw new Error(`Invalid ERROR code: ${code}`);
        }
        super(message);
        this.code = code;
        this.message = message;
    }
};