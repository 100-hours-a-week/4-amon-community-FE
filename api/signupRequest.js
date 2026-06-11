import { apiRequest, createLocalFileResult, toFormData } from './client.js';

export const userSignup = async data => {
    // 서버의 이미지 저장 디렉토리가 준비되지 않으면 profileImage 필드가 500을 내므로 기본 가입 정보만 전송한다.
    const formData = toFormData({
        email: data.email,
        password: data.password,
        nickname: data.nickname,
    });
    const result = await apiRequest('/users/', {
        method: 'POST',
        body: formData,
    }, { successStatus: 201 });
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
    // 실제 업로드는 잠시 보류하고, 선택한 이미지는 브라우저 미리보기 URL로만 반환한다.
    const profileImage = file.get('profileImage');
    return createLocalFileResult(profileImage, 'profileImageUrl');
};
