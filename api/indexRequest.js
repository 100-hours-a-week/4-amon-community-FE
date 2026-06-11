import { apiRequest } from './client.js';

// 백엔드가 offset 대신 cursor 기반 페이지네이션을 쓰므로 다음 cursor를 모듈 상태로 보관한다.
let nextCursor = 0;

export const getPosts = async (offset, limit) => {
    // 화면이 첫 페이지를 요청하면 서버 cursor도 처음부터 다시 조회한다.
    if (offset === 0) nextCursor = 0;
    const result = await apiRequest(
        `/posts?cursor=${nextCursor || 0}&size=${limit}`,
        {},
        { dataType: 'postList' },
    );
    nextCursor = result.body?.data?.pagination?.nextCursor ?? nextCursor;
    return result;
};

export const searchPosts = async (keyword, offset = 0, limit = 5, sort = 'recent') => {
    // 검색 API가 없어서 충분한 목록을 받은 뒤 클라이언트에서 필터/정렬한다.
    const result = await apiRequest('/posts?cursor=0&size=100', {}, {
        dataType: 'postList',
    });
    const lowerKeyword = keyword.trim().toLowerCase();
    const filtered = result.data
        .filter(post => post.title.toLowerCase().includes(lowerKeyword))
        .sort((a, b) => {
            if (sort === 'likes') return b.likeCount - a.likeCount;
            if (sort === 'views') return b.viewCount - a.viewCount;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    return {
        ...result,
        data: filtered.slice(offset, offset + limit),
    };
};
