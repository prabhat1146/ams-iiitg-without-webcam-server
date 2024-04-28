const jwt = require('jsonwebtoken')

const createjwt = (email, secretKey,expireTime) => {

    try {
        const token = jwt.sign({ email }, secretKey, { expiresIn: expireTime });

    if (token) {
        return token;

    }
    } catch (error) {
        console.log(error)
    }
}
const verifyjwt = (token, secretKey) => {

    const decodedToken = jwt.verify(token, secretKey)
    if (decodedToken) {
        return decodedToken
    }

}

module.exports = { createjwt, verifyjwt }