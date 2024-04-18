import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import db from './db';
import morgan from 'morgan';
import userRouter from './routers/userRotuer';

const PORT = process.env.PORT; //서버를 올릴때 제공해주는 주소를 받기 위해 변수로 지정
const app = express();
const corsOptions = {
    origin: ['http://localhost:3000', 'https://kidcare.netlify.app'],
    credentials: true,
    method: ['GET', 'POST'],
};

app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
// app.use(
//     session({
//         name: 'Session ID',
//         secret: 'secret',
//         resave: false, // 세션이 변경되지 않아도 항상 저장하도록 설정
//         saveUninitialized: false, // 초기화되지 않은 세션을 저장소에 저장하지 않도록 설정
//         cookie: {
//             maxAge: 1000 * 60 * 60 * 24,
//             httpOnly: false, // javascript에서 사용이 안되게 하는 옵션
//             secure: false, // https를 통해서만 세션 쿠키를 전송하도록 설정
//         },
//         store: MongoStore.create({
//             mongoUrl: process.env.DB_URL + '/yj4project2',
//         }),
//     })
// );

app.get('/', function (req, res) {
    res.send('Hello World!!!!!');
});
app.use('/users', userRouter);

app.listen(PORT, async () => {
    console.log(`Server is Listen on http://localhost:${PORT}`);
    db.User.find({ subscribe: true }, (error, users) => {
        if (error) {
            console.error('Error finding users with subscribe true:', error);
        } else {
            console.log('Users with subscribe true:', users);
        }
    });
});
