const success = (res, data = null, message = "Success", status = 200) => {
    return res.status(status).json({
        success: true,
        message,
        data
    });
};

const created = (res, data = null, message = "Created") => {
    return res.status(201).json({
        success: true,
        message,
        data
    });
};

const error = (res, message = "Internal Server Error", status = 500, errors = null) => {
    return res.status(status).json({
        success: false,
        message,
        errors
    });
};

module.exports = {
    success,
    created,
    error
};