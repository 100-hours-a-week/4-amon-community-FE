import {
    apiRequest,
    createLocalFileResult,
    normalizePostDetail,
    toFormData,
} from './client.js';

// 글 저장 API가 multipart/form-data를 받으므로, 파일 선택 시점에는 로컬에 보관했다가 저장 요청에 함께 싣는다.
let pendingPostImage = null;

export const createPost = boardData => {
    // 새 백엔드 스펙에 맞춰 JSON 대신 FormData로 게시글 본문과 첨부 이미지를 전송한다.
    const result = apiRequest('/posts/', {
        method: 'POST',
        body: toFormData({
            title: boardData.title,
            content: boardData.content,
            postImage: pendingPostImage,
        }),
    }, { successStatus: 201 });
    result.then(response => {
        if (response.ok) pendingPostImage = null;
        // 기존 화면 로직은 insertId를 기대하므로, 새 응답의 postId/id를 같은 이름으로 맞춰준다.
        if (response.data && !response.data.insertId) {
            response.data.insertId =
                response.data.postId || response.data.id || response.data.post?.postId;
        }
    });
    return result;
};

export const updatePost = (postId, boardData) => {
    // 수정도 생성과 동일하게 FormData로 보내서 이미지 변경을 같은 요청에서 처리한다.
    const result = apiRequest(`/posts/${postId}`, {
        method: 'PATCH',
        body: toFormData({
            title: boardData.title,
            content: boardData.content,
            postImage: pendingPostImage,
        }),
    });
    result.then(response => {
        if (response.ok) pendingPostImage = null;
    });

    return result;
};

export const fileUpload = formData => {
    // 실제 업로드는 글 저장 시점에 하며, 선택 직후에는 미리보기 URL만 만들어 화면에 보여준다.
    pendingPostImage = formData.get('postFile') || formData.get('postImage');
    return createLocalFileResult(pendingPostImage, 'fileUrl');
};

export const getBoardItem = postId => {
    // 상세 응답의 필드명이 화면 기대값과 다를 수 있어 공통 정규화 함수를 한 번 더 적용한다.
    const result = apiRequest(`/posts/${postId}`, {
        method: 'GET',
    }, { dataType: 'postDetail' });
    result.then(response => {
        response.data = normalizePostDetail(response.data);
    });

    return result;
};
