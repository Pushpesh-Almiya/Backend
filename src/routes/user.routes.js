import { Router } from 'express';
import { registerUser } from '../controllers/user.controller.js';

const router = Router();

router.route('/register').post(registerUser);
// You can add more routes here, e.g. login, getUser, etc.

export default router;