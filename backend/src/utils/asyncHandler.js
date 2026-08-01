/**
 * Wraps async route handlers and forwards errors to Express.
 */
module.exports = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (err) {
            next(err);
        }
    };
};