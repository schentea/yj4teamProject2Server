import express from 'express';
import {
    memberRegister,
    memberLogin,
    loginSuccess,
    logout,
    kakaoLogin,
    allergyAlim,
    googleLogin,
    profileEdit,
    defaultInfoEdit,
    allergiesEdit,
    regionSchoolEdit,
    userSubSetting,
} from '../controllers/userController';

const userRouter = express.Router();

userRouter.post('/register', memberRegister);
userRouter.post('/login', memberLogin);
userRouter.get('/login-success', loginSuccess);
userRouter.post('/logout', logout);
userRouter.get('/socials/kakao', kakaoLogin);
userRouter.post('/allergyAlim', allergyAlim);
userRouter.get('/socials/google', googleLogin);
userRouter.post('/profileEdit', profileEdit);
userRouter.post('/defaultInfo',defaultInfoEdit)
userRouter.post('/allergiesEdit',allergiesEdit)
userRouter.post('/regionSchoolEdit',regionSchoolEdit)
userRouter.post("/userSubSetting", userSubSetting)

export default userRouter;
