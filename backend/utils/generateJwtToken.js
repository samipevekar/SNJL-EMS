import jwt from 'jsonwebtoken'

export const generateJwtToken = (userId,role) =>{
    return jwt.sign({id:userId,role:role}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY
    });
}