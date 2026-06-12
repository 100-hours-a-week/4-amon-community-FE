import { apiRequest } from './client.js';

export const getPosts = async (offset, limit) => {
    const result = await apiRequest(
        `/posts?cursor=${offset}&size=${limit}`,
        {},
        { dataType: 'postList' },
    );
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
