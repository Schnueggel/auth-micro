module.exports = {
    PORT: process.env.PORT || 9999,
    MONGO_URL: process.env.MONGO_URL || 'localhost:27017/auth-micro',
    MONGO_URL_TEST: process.env.MONGO_URL_TEST || 'localhost:27017/auth-micro-test',
    ENABLE_USERNAME: falsyEnv(process.env.ENABLE_USERNAME),
    PASSWORD_LENGTH: process.env.PASSWORD_LENGTH || 8,
    PASSWORD_REGEX: '.+'
};

function falsyEnv(value) {
    return (value !== '0' && value !== 'false' && value);
}
