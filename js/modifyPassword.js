import { changePassword } from '../api/modifyPasswordRequest.js';
import Dialog from '../component/dialog/dialog.js';
import Header from '../component/header/header.js';
import {
    authCheck,
    getServerUrl,
    prependChild,
    resolveImageUrl,
    validPassword,
} from '../utils/function.js';

const button = document.querySelector('#signupBtn');

const DEFAULT_PROFILE_IMAGE = '../public/image/profile/default.jpg';
const HTTP_CREATED = 201;

const dataResponse = await authCheck();
const data = await dataResponse.json();
const profileImage = resolveImageUrl(
    data.data.profileImageUrl,
    DEFAULT_PROFILE_IMAGE,
);

const modifyData = {
    password: '',
    passwordCheck: '',
};

const observeData = () => {
    const { password, passwordCheck } = modifyData;

    // 버튼 활성화 조건도 실제 비밀번호 정책과 동일하게 맞춘다.
    if (
        !password ||
        !validPassword(password) ||
        !passwordCheck ||
        password !== passwordCheck
    ) {
        button.disabled = true;
        button.style.backgroundColor = '#ACA0EB';
    } else {
        button.disabled = false;
        button.style.backgroundColor = '#7F6AEE';
    }
};

const blurEventHandler = async (event, uid) => {
    if (uid == 'pw') {
        const value = event.target.value;
        const isValidPassword = validPassword(value);
        const helperElement = document.querySelector(
            `.inputBox p[name="${uid}"]`,
        );
        const helperElementCheck = document.querySelector(
            `.inputBox p[name="pwck"]`,
        );

        if (!helperElement) return;

        if (value == '' || value == null) {
            helperElement.textContent = '*비밀번호를 입력해주세요.';
            helperElementCheck.textContent = '';
            // 잘못된 입력 뒤에도 이전 정상 값이 남아 버튼이 켜지는 일을 막는다.
            modifyData.password = '';
            modifyData.passwordCheck = '';
        } else if (!isValidPassword) {
            helperElement.textContent =
                '*비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.';
            helperElementCheck.textContent = '';
            // 검증 실패 시 확인값까지 초기화해 화면 메시지와 내부 상태를 맞춘다.
            modifyData.password = '';
            modifyData.passwordCheck = '';
        } else {
            helperElement.textContent = '';
            modifyData.password = value;
            if (modifyData.passwordCheck && modifyData.passwordCheck !== value) {
                // 비밀번호를 다시 바꾸면 기존 확인값은 더 이상 신뢰할 수 없다.
                modifyData.passwordCheck = '';
                helperElementCheck.textContent = '*비밀번호가 다릅니다.';
            }
        }
    } else if (uid == 'pwck') {
        const value = event.target.value;
        const helperElement = document.querySelector(
            `.inputBox p[name="${uid}"]`,
        );
        // pw 입력란의 현재 값
        const password = modifyData.password;

        if (value == '' || value == null) {
            helperElement.textContent = '*비밀번호 한번 더 입력해주세요.';
            // 불일치/빈 값 상태가 이전 확인값을 유지하지 않게 한다.
            modifyData.passwordCheck = '';
        } else if (password !== value) {
            helperElement.textContent = '*비밀번호가 다릅니다.';
            modifyData.passwordCheck = '';
        } else {
            helperElement.textContent = '';
            modifyData.passwordCheck = value;
        }
    }

    observeData();
};

const addEventForInputElements = () => {
    const InputElement = document.querySelectorAll('input');
    InputElement.forEach(element => {
        const id = element.id;

        element.addEventListener('input', event => blurEventHandler(event, id));
    });
};

const modifyPassword = async () => {
    const { password } = modifyData;

    const { status } = await changePassword(password);

    if (status == HTTP_CREATED) {
        try {
            // JWT 기반 인증이라 credentials를 빼야 실배포 CORS에서 차단되지 않는다.
            await fetch(`${getServerUrl()}/v1/auth/logout`, {
                method: 'POST',
            });
        } catch (error) {
            console.error('로그아웃 요청 실패:', error);
        }
        localStorage.clear();
        location.href = '/html/login.html';
    } else {
        Dialog('비밀번호 변경 실패', () => {
            location.href = '/html/modifyPassword.html';
        });
    }
};

const init = () => {
    button.addEventListener('click', modifyPassword);
    prependChild(document.body, Header('커뮤니티', 1, profileImage));
    addEventForInputElements();
    observeData();
};

init();
