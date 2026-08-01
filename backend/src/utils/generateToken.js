const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE || "1d"
        }
    );
};

module.exports = generateAccessToken;