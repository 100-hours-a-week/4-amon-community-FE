import { apiRequest, clearAuthToken } from './client.js';

export const userModify = async changeData => {
    // 현재 백엔드는 닉네임 수정만 별도 엔드포인트로 받으므로 필요한 필드만 보낸다.
    const result = await apiRequest('/users/nickname', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname: changeData.nickname }),
    }, { successStatus: 201 });
    return result;
};

export const userDelete = async () => {
    // 탈퇴 성공 후 남은 JWT가 재사용되지 않도록 로컬 인증 정보를 정리한다.
    const result = await apiRequest('/users/withdraw', {
        method: 'DELETE',
    });
    if (result.ok) clearAuthToken();
    return result;
};
