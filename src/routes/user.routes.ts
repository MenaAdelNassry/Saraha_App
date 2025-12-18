import { multerHost, validationTypes } from './../middlewares/multer.middleware';
import { allowedTo } from './../middlewares/auth.middleware';
import { validate } from './../middlewares/validation.middleware';
import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { deleteAccount, freezeAccount, getMyProfile, getProfile, restoreAccount, updatePassword, updateProfile, uploadProfilePic } from "../controllers/user.controller";
import { profileSchema } from '../validation/profile.schema';
import { updateProfileSchema } from '../validation/auth.schema';
import { freezeAccountSchema } from '../validation/freezeAccount.schema';
import { restoreAccountSchema } from '../validation/restoreAccount.schema';
import { roleEnum } from '../models/user.model';
import { deleteUserSchema } from '../validation/deleteAccount.schema';
import { updatePasswordSchema } from '../validation/updatePassword.schema';

const router = Router();

// GET /api/v1/users/profile/me
router.get('/profile/me', protect, getMyProfile);

// GET /api/v1/users/profile/65a1b2c3d4...
router.get('/profile/:id', validate(profileSchema, 'params'), getProfile);

// PATCH /api/v1/users/profile
router.patch('/profile', protect, validate(updateProfileSchema), updateProfile);

// PATCH /api/v1/users/freeze-account/optionalId
router.patch('/freeze-account', protect, freezeAccount);
router.patch('/freeze-account/:userId', protect, validate(freezeAccountSchema, 'params'), allowedTo(roleEnum.ADMIN), freezeAccount);

// PATCH /api/v1/users/restore-account/65a1b2c3d4...
router.patch('/restore-account/:userId', protect, validate(restoreAccountSchema, 'params'), allowedTo(roleEnum.ADMIN), restoreAccount);

// PATCH /api/v1/users/update-password
router.patch('/update-password', validate(updatePasswordSchema), protect, updatePassword);

// PATCH /api/v1/users/profile-pic
router.patch('/profile-pic', protect, multerHost(validationTypes.image).single("image"), uploadProfilePic);

// DELETE /api/v1/users/delete-account/65a1b2c3d4...
router.delete('/delete-account/:userId', protect, validate(deleteUserSchema, 'params'), allowedTo(roleEnum.ADMIN), deleteAccount);

export default router;