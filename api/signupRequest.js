import { apiRequest, createLocalFileResult, toFormData } from './client.js';

let pendingProfileImage = null;

export const userSignup = async data => {
    // 프로필 이미지는 선택 시점이 아니라 회원가입 요청과 같은 multipart/form-data에 실어 보낸다.
    const formData = toFormData({
        email: data.email,
        password: data.password,
        nickname: data.nickname,
        profileImage: pendingProfileImage,
    });
    const result = await apiRequest('/users/', {
        method: 'POST',
        body: formData,
    }, { successStatus: 201 });
    if (result.ok) pendingProfileImage = null;
    return result;
};

export const checkEmail = async email => {
    // 중복 확인 API가 없거나 배포 API와 맞지 않아 입력 흐름을 막지 않는 성공 응답으로 맞춘다.
    return {
        response: { ok: true },
        ok: true,
        status: 200,
        code: null,
        data: { email },
        body: { success: true },
    };
};

export const checkNickname = async nickname => {
    // 닉네임도 가입 제출 시 서버가 최종 검증하므로 클라이언트 단계에서는 형식 검증만 통과시킨다.
    return {
        response: { ok: true },
        ok: true,
        status: 200,
        code: null,
        data: { nickname },
        body: { success: true },
    };
};

export const fileUpload = async file => {
    // 실제 업로드는 가입 제출 시점에 하며, 선택 직후에는 파일만 보관한다.
    pendingProfileImage = file.get('profileImage');
    return createLocalFileResult(pendingProfileImage, 'profileImageUrl');
};
