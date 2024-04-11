import mongoose from 'mongoose';
// 테이블 작업?
const communitySchema = new mongoose.Schema({
    num: Int,
    writer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    title: String,
    createAt: Date,
});

const Community = mongoose.model('Community', communitySchema);
export default Community;
