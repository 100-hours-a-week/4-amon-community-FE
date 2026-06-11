import { apiRequest, clearAuthToken } from './client.js';

export const changePassword = async password => {
    // 비밀번호 변경 API는 성공 시 201을 반환하므로 화면의 성공 조건과 맞춰 정규화한다.
    const result = apiRequest('/users/password', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            password,
        }),
    }, { successStatus: 201 });
    result.then(response => {
        // 비밀번호가 바뀌면 기존 토큰은 더 이상 쓰지 않도록 제거한다.
        if (response.ok) clearAuthToken();
    });
    return result;
};
