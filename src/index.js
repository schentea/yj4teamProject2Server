import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import userRouter from './routers/userRotuer';
import schedule from 'node-schedule';
import db from './db.js';
import { meal } from './controllers/userController.js';

const PORT = process.env.PORT; //서버를 올릴때 제공해주는 주소를 받기 위해 변수로 지정
const app = express();
const corsOptions = {
    origin: ['http://localhost:3000', 'https://kidcare.netlify.app'],
    credentials: true,
    method: ['GET', 'POST'],
};
let location = {
    서울: 'B10',
    부산: 'C10',
    대구: 'D10',
    인천: 'E10',
    광주: 'F10',
    대전: 'G10',
    울산: 'H10',
    세종시: 'I10',
    경기도: 'J10',
    강원도: 'K10',
    충청북도: 'M10',
    충청남도: 'N10',
    전라북도: 'P10',
    전라남도: 'Q10',
    경상북도: 'R10',
    경상남도: 'S10',
    제주도: 'T10',
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
schedule.scheduleJob('30 13 * * *', async function () {
    const subUser = await db.User.find({ subscribe: true }, 'username tel allergies schoolNM region');
    const arrUser = [...subUser];
    console.log(arrUser);
    const nowDate = new Date();
    const year = nowDate.getFullYear();
    const month = String(nowDate.getMonth() + 1).padStart(2, '0');
    const date = String(nowDate.getDate() + 3).padStart(2, '0');
    const tomorrowDate = `${year}${month}${date}`;
    console.log(tomorrowDate);
    arrUser.map((item) => {
        meal(
            location[item.region],
            item.schoolNM.split(',')[1],
            tomorrowDate,
            item.allergies,
            item.username,
            item.tel,
            item.schoolNM.split(',')[0]
        );
    });
    console.log('go');
});

app.get('/', function (req, res) {
    res.send('Hello World!!!!!');
});
app.use('/users', userRouter);

app.listen(PORT, async () => {
    console.log(`Server is Listen on http://localhost:${PORT}`);
});
