import mongoose from 'mongoose';
// 테이블 작업?
// 알레르기 정보랑 학교까지 저장해야 함
const userSchema = new mongoose.Schema({
    userid: {
        type: String,
        unique: true,
        required: true,
    },
    username: String,
    tel: String,
    email: {
        type: String,
        unique: true,
    },
    state: String,
    password: String,
    schoolNM: String,
    region: String,
    allergies: String,
    subscribe: Boolean,
    createdAt: Date,
});

const User = mongoose.model('User', userSchema);
export default User;
