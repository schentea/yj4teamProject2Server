import 'dotenv/config';
import User from '../models/user';
import bcrypt from 'bcrypt';
import { SolapiMessageService } from 'solapi';

const PFID = process.env.PFID;
const TID = process.env.TID;
const messageService = new SolapiMessageService(process.env.SOLAPI_API_KEY, process.env.SOLAPI_SECRET_KEY);
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
            region: region,
            allergies: allergies,
            subscribe: false,
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
            res.send({ result: true, user: user, isLogin: true });
        } else {
            // 회원가입
            const userData = await User.create({
                userid: nickname,
                email,
                // profileImage: profile_image,
                createdAt: Date.now(),
            });
            res.send({ result: true, data: userData, message: '회원가입 완료!' });
        }
    }

    // 이메일 값이 DB에 없으면
    // 회원가입
};
