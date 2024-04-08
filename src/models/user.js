import mongoose from "mongoose";
// 테이블 작업?
// 알레르기 정보랑 학교까지 저장해야 함
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  name: String,
  mobile: String,
  email: {
    type: String,
    unique: true,
  },
  password: String,
  createdAt: Date,
});

const User = mongoose.model("User", userSchema);
export default User;
