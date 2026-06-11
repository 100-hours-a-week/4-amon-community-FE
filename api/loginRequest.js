import { apiRequest, saveAuthToken } from './client.js';

export const userLogin = async (email, password) => {
    // 로그인 성공 시 내려오는 JWT를 저장해 이후 요청의 Authorization 헤더로 사용한다.
    const result = await apiRequest('/auth/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: email,
            password: password,
        }),
    });
    if (result.ok) saveAuthToken(result.data);
    return result;
};
