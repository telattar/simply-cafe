import jwt from 'jsonwebtoken';
import { UNAUTHORIZED } from '../constants/statusCode';
import { config } from 'dotenv';

config();
const requireAuth = (req, res, next) => {
    const cookie = req.cookies.jwt;
    // if jwt does not exist
    if (!cookie)
        return res.status(UNAUTHORIZED).json({message: "You are not logged in."});

    // verify cookie
    jwt.verify(cookie, process.env.JWT_SECRET_TOKEN, (error, decodedToken) => {
        if (error)
            return res.status(UNAUTHORIZED).json({message: "You are not logged in."});
        else {
            console.log(decodedToken);
            //authentication valid, continue with the next middleware.
            next();
        }

    });
}

export default requireAuth;