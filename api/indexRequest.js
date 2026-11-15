import { apiRequest } from './client.js';

export const getPosts = async (offset, limit) => {
    const result = await apiRequest(
        `/posts?cursor=${offset}&size=${limit}`,
        {},
        { dataType: 'postList' },
    );
    return result;
};

export const searchPosts = async (
    keyword,
    cursor = null,
    size = 5,
    sort = 'accuracy',
) => {
    const params = new URLSearchParams({
        keyword: keyword.trim(),
        sort,
        size: String(size),
    });
    if (cursor) params.set('cursor', cursor);

    return apiRequest(`/search/posts?${params.toString()}`, {}, {
        dataType: 'postSearch',
    });
};
