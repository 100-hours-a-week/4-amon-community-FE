import { apiRequest } from './client.js';

export const deleteComment = (postId, commentId) => {
    // 댓글 API는 postId 없이 commentId만으로 삭제하도록 변경됐다.
    const result = apiRequest(`/comments/${commentId}`, {
        method: 'DELETE',
    });
    return result;
};

export const updateComment = (postId, commentId, commentContent) => {
    // 기존 commentContent 객체/문자열 양쪽 호출을 새 content 필드로 맞춘다.
    const result = apiRequest(`/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            content: commentContent.content || commentContent.commentContent,
        }),
    });
    return result;
};
