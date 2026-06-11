import { apiRequest, normalizePostDetail } from './client.js';

export const getPost = postId => {
    // 새 게시글 상세 응답을 기존 화면 컴포넌트가 쓰는 필드명으로 정규화한다.
    const result = apiRequest(`/posts/${postId}`, {}, { dataType: 'postDetail' });
    return result;
};

export const deletePost = async postId => {
    const result = await apiRequest(`/posts/${postId}`, {
        method: 'DELETE',
    });
    return result;
};

export const writeComment = async (pageId, comment) => {
    // 댓글 생성 API의 본문 필드명이 commentContent에서 content로 바뀌었다.
    const result = await apiRequest(`/comments/${pageId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: comment }),
    });
    return result;
};

export const getComments = async postId => {
    // 별도 댓글 목록 API 대신 게시글 상세에 포함된 comments를 화면용 배열로 추출한다.
    const result = await apiRequest(`/posts/${postId}`, {}, { dataType: 'postDetail' });
    return {
        ...result,
        data: normalizePostDetail(result.data)?.comments || [],
    };
};

export const likePost = async postId => {
    const result = await apiRequest(`/posts/${postId}/like`, {
        method: 'POST',
    });
    return result;
};

export const unlikePost = async postId => {
    // 현재 백엔드는 좋아요 토글을 같은 POST 엔드포인트로 처리한다.
    const result = await apiRequest(`/posts/${postId}/like`, {
        method: 'POST',
    });
    return result;
};
