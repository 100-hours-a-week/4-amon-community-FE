export const getServerUrl = () => {
    const configUrl =
        typeof window !== 'undefined' &&
        window.__APP_CONFIG__ &&
        window.__APP_CONFIG__.API_BASE_URL
            ? String(window.__APP_CONFIG__.API_BASE_URL).trim()
            : '';

    if (configUrl) {
        return configUrl.replace(/\/+$/, '');
    }

    // config.js가 없을 때도 로컬 개발 서버에서는 3000 포트 API 기준으로 동작하게 한다.
    const host = window.location.hostname;
    return host.includes('localhost')
        ? 'http://localhost:3000'
        : `http://${host}:3000`;
};

export const resolveImageUrl = (url, fallback = null) => {
    if (!url) return fallback;
    if (/^https?:\/\//i.test(url)) return url;
    return `${getServerUrl()}${url}`;
};

export const serverSessionCheck = async () => {
    // JWT 인증은 api/client.js의 fetch 어댑터가 Authorization 헤더로 붙이므로 credentials를 쓰지 않는다.
    const res = await fetch(`${getServerUrl()}/v1/auth/check`, {
        method: 'GET',
    });
    return res;
};

export const authCheck = async () => {
    const HTTP_OK = 200;
    const response = await serverSessionCheck();
    if (!response || response.status !== HTTP_OK)
        location.href = '/html/login.html';
    return response;
};

export const authCheckReverse = async () => {
    const response = await serverSessionCheck();
    if (response && response.ok) {
        location.href = '/';
    }
};
// 이메일 유효성 검사
export const validEmail = email => {
    const REGEX =
        /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
    return REGEX.test(email);
};

export const validPassword = password => {
    if (typeof password !== 'string') return false;

    // 안내 문구의 "특수문자"와 맞게 공백을 제외한 보이는 ASCII 특수문자를 폭넓게 허용한다.
    const isValidLength = password.length >= 8 && password.length <= 20;
    const isVisibleAscii = /^[\x21-\x7E]+$/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password);

    return (
        isValidLength &&
        isVisibleAscii &&
        hasLowercase &&
        hasUppercase &&
        hasNumber &&
        hasSpecialCharacter
    );
};

export const validNickname = nickname => {
    const REGEX = /^[가-힣a-zA-Z0-9]{2,10}$/;
    return REGEX.test(nickname);
};

export const prependChild = (parent, child) => {
    parent.insertBefore(child, parent.firstChild);
};

/**
 *
 * @param {File} file  이미지 파일
 * @param {boolean} isHigh? : true면 origin, false면  1/4 사이즈
 * @returns
 */
export const fileToBase64 = (file, isHigh) => {
    return new Promise((resolve, reject) => {
        const size = isHigh ? 1 : 4;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = e => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const width = img.width / size;
                const height = img.height / size;
                const elem = document.createElement('canvas');
                elem.width = width;
                elem.height = height;
                const ctx = elem.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(ctx.canvas.toDataURL());
            };
            img.onerror = e => {
                reject(e);
            };
        };
        reader.onerror = e => {
            reject(e);
        };
    });
};

/**
 *
 * @param {string} param
 * @returns
 */
export const getQueryString = param => {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
};

export const padTo2Digits = number => {
    return number.toString().padStart(2, '0');
};
