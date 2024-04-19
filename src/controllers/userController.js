import 'dotenv/config';
import User from '../models/user';
import bcrypt from 'bcryptjs';
import { SolapiMessageService } from 'solapi';

const PFID = process.env.PFID;
const TID = process.env.TID;
const PFID2 = process.env.PFID2;
const TID2 = process.env.TID2;
const messageService = new SolapiMessageService(process.env.SOLAPI_API_KEY, process.env.SOLAPI_SECRET_KEY);
let noFood = {
    1: '달걀',
    2: '우유',
    3: '메밀',
    4: '땅콩',
    5: '대두',
    6: '밀',
    7: '고등어',
    8: '게',
    9: '새우',
    10: '돼지고기',
    11: '복숭아',
    12: '토마토',
    13: '아황산',
    14: '호두',
    15: '닭고기',
    16: '쇠고기',
    17: '오징어',
    18: '조개류.굴.홍합.전복',
    19: '잣',
};
// 회원가입
export const memberRegister = async (req, res) => {
    console.log(req.body);
    try {
        const {
            data: { userid, username, email, password, tel, schoolNM },
        } = req.body;
        const region = req.body.selectedRegion;
        const allergies = req.body.selectedAllergies.join(',');

        // 아이디 중복처리
        const exist = await User.exists({ userid });
        const exist2 = await User.exists({ email });
        console.log(exist);
        if (exist) {
            return res.send({
                result: false,
                message: '입력하신 아이디가 이미 있습니다.',
            });
        } else if (exist2) {
            return res.send({
                result: false,
                emailMessage: '입력하신 이메일이 이미 있습니다.',
            });
        }

        // 패스워드 암호화
        const salt = bcrypt.genSaltSync(5);
        const hashedPassword = bcrypt.hashSync(password, salt);
        console.log('password: ', hashedPassword);

        const data = User.create({
            userid: userid,
            username: username,
            tel: tel,
            schoolNM: schoolNM,
            email: email,
            password: hashedPassword,
            profileImg: '',
            region: region,
            allergies: allergies,
            subscribe: false,
            state: 'basic',
            createdAt: new Date(),
        });

        res.send({ result: true, data });
    } catch (error) {
        console.log(error);
    }
};

// 로그인
export const memberLogin = async (req, res) => {
    // 데이터 가져오기
    console.log(req.body);
    const {
        body: { userid, password },
    } = req;

    // 아이디 중복체크
    const user = await User.findOne({ userid: userid });
    if (!user) {
        return res.send({ result: false, message: '해당하는 유저가 없습니다' });
    }
    // bcrypt를 사용자가 입력한 패스워드와 DB에 있는 패스워드 확인
    const ok = bcrypt.compareSync(password, user.password);
    if (!ok) {
        return res.send({ result: false, message: '패스워드가 다릅니다.' });
    }
    // 패스워드가 맞으면 로그인
    if (ok) {
        // 로그인
        res.send({
            result: true,
            token: user?._id,
            schoolNM: user?.schoolNM,
            region: user?.region,
            userAllergy: user?.allergies,
        });
    }
};

// 로그인 성공 후 정보 보내주기
export const loginSuccess = async (req, res) => {
    console.log('loginSuceess', req.query.token);
    try {
        const user = await User.findById(req.query.token);

        if (user) {
            res.send({ result: true, user: user, isLogin: true });
        } else {
            res.send({ result: true, isLogin: false });
        }
    } catch (error) {
        console.log(error);
    }
};

// 로그아웃
export const logout = async (req, res) => {
    try {
        req.session.destroy(() => {
            res.send({ result: true, message: '로그아웃 성공' });
        });
    } catch (error) {
        console.log(error);
    }
};
//알림톡
export const allergyAlim = async (req, res) => {
    console.log(req.body);

    const {
        body: { username, tel, subscribe, uid },
    } = req;
    const userData = await User.findOne({ userid: uid });
    userData.subscribe = subscribe;
    await userData.save();

    try {
        const response = await messageService.send({
            to: tel,
            from: '01033528779', // 계정에서 등록한 발신번호 입력.
            kakaoOptions: {
                pfId: PFID,
                templateId: TID,
                variables: {
                    '#{name}': username,
                    '#{링크}': 'www.naver.com',
                },
                disableSms: true, // 필요에 따라 disableSms 옵션 사용
            },
        });
        res.json({ success: true, message: '알림톡 전송 성공', data: response });
    } catch (e) {
        console.log(e);
    }
};

// 소셜카카오 로그인
export const kakaoLogin = async (req, res) => {
    // step 1. 인가코드 받기
    const {
        query: { code },
    } = req;

    // step 2. 토큰 받기
    const KAKAO_BASE_PATH = 'https://kauth.kakao.com/oauth/token';
    const config = {
        grant_type: 'authorization_code',
        client_id: process.env.CLIENT_ID,
        redirect_uri: process.env.REDIRECT_URI,
        code,
    };
    const params = new URLSearchParams(config).toString();
    const finalUrl = `${KAKAO_BASE_PATH}?${params}`;
    const data = await fetch(finalUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    const tokenRequest = await data.json();

    // step 3. 사용자 정보 받기
    const { access_token } = tokenRequest;
    if (access_token) {
        const userRequest = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        const userData = await userRequest.json();
        const {
            properties: { nickname },
            kakao_account: { email },
        } = userData;

        // 사용자 정보 중에 이메일 값이 DB에 있으면
        // 로그인
        const user = await User.findOne({ email });
        if (user) {
            // 로그인
            res.send({ result: true, user: user, isLogin: true, token: user._id });
        } else {
            // 회원가입
            let userExamId = email.split('@')[0];
            const userData = await User.create({
                userid: userExamId,
                username: nickname,
                tel: '수정',
                schoolNM: '수정',
                region: '수정',
                allergies: '수정',
                subscribe: false,
                profileImg: '',
                email,
                state: 'kakao',
                // profileImage: profile_image,
                createdAt: Date.now(),
            });
            const loginUser = await User.findOne({ email });

            res.send({ result: true, isLogin: true, user: loginUser, token: loginUser._id, message: '회원가입 완료!' });
        }
    }

    // 이메일 값이 DB에 없으면
    // 회원가입
};

//구글 로그인
export const googleLogin = async (req, res) => {
    const {
        query: { code },
    } = req;
    const GOOGLE_BASE_PATH = 'https://oauth2.googleapis.com/token';
    const config = {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_SECRET_ID,
        redirect_uri: process.env.GOOGLE_REDIRECT_URL,
        grant_type: 'authorization_code',
    };
    const params = new URLSearchParams(config).toString();
    const finalUrl = `${GOOGLE_BASE_PATH}?${params}`;
    const data = await fetch(finalUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    const tokenRequest = await data.json();
    const { access_token } = tokenRequest;
    if (access_token) {
        const userRequest = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        const userData = await userRequest.json();
        console.log(userData);
        const email = userData.email;
        const name = userData.name;
        console.log(email);
        let userExamId = email.split('@')[0].substring(0, 3);

        const user = await User.findOne({ email });
        if (user) {
            // 로그인
            res.send({ result: true, user: user, isLogin: true, token: user._id });
        } else {
            // 회원가입

            const userData = await User.create({
                userid: userExamId,
                username: name,
                tel: '수정',
                schoolNM: '수정',
                region: '수정',
                allergies: '수정',
                subscribe: false,
                email,
                state: 'google',
                // profileImage: profile_image,
                createdAt: Date.now(),
            });
            const loginUser = await User.findOne({ email });

            res.send({ result: true, isLogin: true, user: loginUser, token: loginUser._id, message: '회원가입 완료!' });
        }
    }
};
// 기본정보 수정
export const defaultInfoEdit = async (req, res) => {
    const {
        body: { tel, password, userid },
    } = req;
    const salt = bcrypt.genSaltSync(5);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const userData = await User.findOne({ userid });
    try {
        userData.tel = tel;
        userData.password = hashedPassword;
        await userData.save();
        res.send({
            result: true,
            token: userData?._id,
            schoolNM: userData?.schoolNM,
            region: userData?.region,
            userAllergy: userData?.allergies,
        });
    } catch (error) {
        console.log(error);
    }
};
// 알러지 정보 수정
export const allergiesEdit = async (req, res) => {
    console.log('1', req.body);
    const userid = req.body.userid;
    const allergies = req.body.selectedAllergies.join(',');
    const userData = await User.findOne({ userid });
    try {
        userData.allergies = allergies;
        await userData.save();
        res.send({
            result: true,
            token: userData?._id,
            schoolNM: userData?.schoolNM,
            region: userData?.region,
            userAllergy: userData?.allergies,
        });
    } catch (e) {
        console.log(e);
    }
};
// 지역,학교 정보 수정
export const regionSchoolEdit = async (req, res) => {
    console.log('2', req.body);
    const { region, schoolNM, userid } = req.body;
    const userData = await User.findOne({ userid });
    try {
        userData.region = region;
        userData.schoolNM = schoolNM;
        await userData.save();
        res.send({
            result: true,
            token: userData?._id,
            schoolNM: userData?.schoolNM,
            region: userData?.region,
            userAllergy: userData?.allergies,
        });
    } catch (error) {
        console.log(e);
    }
};
//프로필 이미지
export const profileEdit = async (req, res) => {
    //값 받기

    console.log('1', req.files);
    console.log('2', req.body);
    //try {
    //} catch (error) {
    //   console.log(error);
    //}
};
export const newUserData = async (req, res) => {};

export async function meal(region, schoolNM, tomorrowDate, userAllergy, username, tel, schoolName) {
    const mealRes = await fetch(
        `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${process.env.API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${region}&SD_SCHUL_CODE=${schoolNM}&MLSV_YMD=${tomorrowDate}`
    ).then((res) => res.json());

    const mealData =
        mealRes.mealServiceDietInfo &&
        mealRes.mealServiceDietInfo[1]?.row &&
        mealRes.mealServiceDietInfo[1].row[0]?.DDISH_NM
            ? mealRes.mealServiceDietInfo[1].row[0].DDISH_NM
            : '';

    const str = mealData.split('(');
    const arr = str.map((item) => item.split(/[).<br/>]/));
    const arr2 = arr.flatMap((item) => item).filter((item) => !isNaN(item) && item !== '');

    const allergylist = arr2.map((item) => noFood[item]);
    const allergy = [...new Set(allergylist)];

    let mealAndUserAllerrgies = [];

    allergy.map((item) => {
        if (userAllergy.includes(item)) {
            mealAndUserAllerrgies.push(item);
        }
    });
    mealAndUserAllerrgies = mealAndUserAllerrgies.join();

    if (mealAndUserAllerrgies) {
        try {
            const response = await messageService.send({
                to: tel,
                from: '01033528779', // 계정에서 등록한 발신번호 입력.
                kakaoOptions: {
                    pfId: PFID2,
                    templateId: TID2,
                    variables: {
                        '#{name}': username,
                        '#{SchoolNM}': schoolName,
                        '#{allergies}': mealAndUserAllerrgies,
                        '#{링크}': 'kidcare.netlify.app',
                    },
                    disableSms: true, // 필요에 따라 disableSms 옵션 사용
                },
            });
            console.log('알림톡 전송성공');
        } catch (e) {
            console.log(e);
        }
    }
}
