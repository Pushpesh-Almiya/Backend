import { asyncHandler } from '../utils/asyncHandler.js';

const registerUser = asyncHandler(async (req, res) => {
    console.log('Register User Endpoint Hit');
    res.status(200).json({
        message: "Ok"
    });
});

export { registerUser };
