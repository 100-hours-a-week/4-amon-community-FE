import { getServerUrl } from '../utils/function.js';
import { requestJson } from '../utils/request.js';

const TOKEN_KEY = 'accessToken';

const normalizeBaseUrl = url => String(url || '').replace(/\/+$/, '');

const getApiBaseUrl = () => {
    // S3/CloudFront 배포에서는 config.js의 API_BASE_URL을 단일 진입점으로 사용한다.
    return normalizeBaseUrl(getServerUrl());
};

// 이전 구현에서 쓰던 키도 함께 읽어 배포 중 토큰 키 변경으로 로그인이 풀리지 않게 한다.
const getStoredToken = () =>
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt');

const isJwtLike = value =>
    typeof value === 'string' && /^[^.]+\.[^.]+\.[^.]+$/.test(value);

export const saveAuthToken = data => {
    const queue = [data];
    while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;
        if (isJwtLike(current)) {
            // 응답 구조가 바뀌어도 객체 내부에서 JWT 형태 문자열을 찾아 표준 키에 저장한다.
            localStorage.setItem(TOKEN_KEY, current);
            return current;
        }
        if (typeof current === 'object') {
            queue.push(...Object.values(current));
        }
    }
    return null;
};

export const clearAuthToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem('jwt');
};

const appendAuthHeader = options => {
    const token = getStoredToken();
    if (!token) return options;

    // 쿠키 credentials 대신 JWT Authorization 헤더를 붙여 CORS credentials 요구를 피한다.
    const headers = new Headers(options.headers || {});
    if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    return {
        ...options,
        headers,
    };
};

const rewriteLegacyPath = (pathname, search) => {
    // 기존 화면 코드의 /v1 경로를 현재 백엔드 엔드포인트로 중앙에서 변환한다.
    const path = pathname.replace(/^\/v1/, '');

    if (path === '/auth/check') return { pathname: '/users/', search: '' };
    if (path === '/auth/login') return { pathname: '/auth/', search: '' };
    if (path === '/auth/signup') return { pathname: '/users/', search: '' };
    if (path === '/auth/logout') return { pathname: '/auth/delete', search: '' };
    if (path === '/users/me') return { pathname: '/users/', search: '' };
    if (path === '/users/me/password')
        return { pathname: '/users/password', search: '' };
    if (path === '/users/upload/profile-image')
        return { pathname: '/users/profileImage', search: '' };

    const postCommentMatch = path.match(/^\/posts\/([^/]+)\/comments$/);
    if (postCommentMatch) {
        return { pathname: `/comments/${postCommentMatch[1]}`, search: '' };
    }

    const postLikeMatch = path.match(/^\/posts\/([^/]+)\/likes$/);
    if (postLikeMatch) {
        return { pathname: `/posts/${postLikeMatch[1]}/like`, search: '' };
    }

    if (path === '/posts') {
        const params = new URLSearchParams(search);
        if (params.has('offset') || params.has('limit')) {
            const cursor = params.get('offset') || '0';
            const size = params.get('limit') || '10';
            return {
                pathname: '/posts',
                search: `?${new URLSearchParams({ cursor, size }).toString()}`,
            };
        }
    }

    return { pathname: path, search };
};

export const resolveApiUrl = path => {
    // 상대/절대 경로를 모두 API base URL 기준으로 만들고, 필요하면 새 API 경로로 재작성한다.
    const baseUrl = getApiBaseUrl();
    const url = new URL(path, baseUrl);
    const rewritten = rewriteLegacyPath(url.pathname, url.search);
    url.pathname = rewritten.pathname;
    url.search = rewritten.search;
    return url.toString();
};

const normalizeErrorCode = body => {
    // 서버별 에러 메시지가 달라도 화면 분기 코드는 기존 상수명을 그대로 쓰게 한다.
    const text = `${body?.code || ''} ${body?.message || ''} ${
        body?.data?.error || ''
    }`;

    if (/email|이메일/i.test(text) && /exist|중복|이미/i.test(text)) {
        return 'ALREADY_EXIST_EMAIL';
    }
    if (/nickname|닉네임/i.test(text) && /exist|중복|이미/i.test(text)) {
        return 'ALREADY_EXIST_NICKNAME';
    }
    if (/valid|유효|입력/i.test(text)) return 'INVALID_INPUT';
    return body?.code || null;
};

export const normalizeResult = (result, options = {}) => {
    // HTTP 200이어도 body.success=false일 수 있어 화면에서 쓰는 ok/status/data 형태로 다시 맞춘다.
    const body = result.body;
    const success =
        body && Object.prototype.hasOwnProperty.call(body, 'success')
            ? body.success !== false
            : result.ok;
    const status =
        success && options.successStatus ? options.successStatus : result.status;

    return {
        ...result,
        ok: result.response.ok && success,
        status,
        code: normalizeErrorCode(body),
        data: normalizeData(body?.data ?? result.data, options.dataType),
        body,
    };
};

export const apiRequest = async (path, options = {}, normalizeOptions = {}) => {
    // 모든 API 요청은 URL 재작성과 Authorization 헤더 추가를 이 함수에서 공통 처리한다.
    const result = await requestJson(resolveApiUrl(path), appendAuthHeader(options));
    return normalizeResult(result, normalizeOptions);
};

export const createJsonOptions = (method, body, options = {}) =>
    appendAuthHeader({
        ...options,
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        body: JSON.stringify(body),
    });

export const toFormData = data => {
    // multipart 요청에서 빈 값이 문자열 "undefined" 등으로 전송되지 않도록 유효한 값만 싣는다.
    const formData = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            formData.append(key, value);
        }
    });
    return formData;
};

// 파일 선택 직후 서버 업로드 없이도 기존 미리보기 UI가 동작하도록 성공 응답 모양을 흉내낸다.
export const createLocalFileResult = (file, dataKey) => ({
    response: { ok: true },
    ok: true,
    status: 200,
    code: null,
    data: {
        [dataKey]: file ? URL.createObjectURL(file) : null,
    },
    body: {
        success: true,
        data: {
            [dataKey]: file ? URL.createObjectURL(file) : null,
        },
    },
});

// 목록 응답의 작성자/카운트 필드명을 기존 게시글 카드가 읽는 형태로 맞춘다.
const normalizePostListItem = post => ({
    id: post.id ?? post.postId,
    postId: post.postId ?? post.id,
    createdAt: post.createdAt,
    title: post.title,
    viewCount: post.viewCount ?? post.view ?? 0,
    likeCount: post.likeCount ?? post.like ?? 0,
    commentCount: post.commentCount ?? post.comment ?? 0,
    author: {
        userId: post.author?.userId ?? post.user?.userId,
        nickname: post.author?.nickname ?? post.user?.nickname,
        profileImageUrl:
            post.author?.profileImageUrl ?? post.user?.profileImage ?? null,
    },
});

// 댓글 필드명 차이를 흡수해 댓글 컴포넌트가 content/author를 안정적으로 읽게 한다.
const normalizeComment = (comment, postId) => ({
    ...comment,
    id: comment.id ?? comment.commentId,
    postId: comment.postId ?? postId,
    content: comment.content ?? comment.commentContent ?? comment.comment,
    author: {
        userId: comment.author?.userId ?? comment.user?.userId,
        nickname: comment.author?.nickname ?? comment.user?.nickname,
        profileImageUrl:
            comment.author?.profileImageUrl ?? comment.user?.profileImage ?? null,
    },
});

export const normalizePostDetail = data => {
    // 상세 응답이 post로 감싸져 오거나 바로 오더라도 같은 형태로 다룬다.
    const post = data?.post || data;
    if (!post) return post;
    const user = post.user || post.author || {};

    return {
        ...post,
        id: post.id ?? post.postId,
        postId: post.postId ?? post.id,
        writerId: post.writerId ?? user.userId,
        userId: post.userId ?? user.userId,
        nickname: post.nickname ?? user.nickname,
        profileImage: post.profileImage ?? user.profileImage,
        profileImageUrl: post.profileImageUrl ?? user.profileImage,
        filePath: post.filePath ?? post.postImage,
        fileUrl: post.fileUrl ?? post.postImage,
        viewCount: post.viewCount ?? post.view ?? 0,
        likeCount: post.likeCount ?? post.like ?? 0,
        commentCount: post.commentCount ?? post.comment ?? post.comments?.length ?? 0,
        comments: (post.comments || []).map(comment =>
            normalizeComment(comment, post.postId ?? post.id),
        ),
    };
};

const normalizeData = (data, dataType) => {
    // 호출부가 요청한 화면 타입에 따라 서버 응답을 필요한 구조로 변환한다.
    if (dataType === 'postList') {
        const posts = Array.isArray(data) ? data : data?.posts || [];
        return posts.map(normalizePostListItem);
    }
    if (dataType === 'postDetail') return normalizePostDetail(data);
    if (dataType === 'comments') {
        const detail = normalizePostDetail(data);
        return detail?.comments || [];
    }
    return data;
};

const installFetchAdapter = () => {
    if (typeof window === 'undefined' || window.__API_FETCH_ADAPTER__) return;

    // 직접 fetch를 쓰는 기존 코드도 새 API 경로와 JWT 헤더 규칙을 타도록 얇게 감싼다.
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init = {}) => {
        const originalUrl =
            typeof input === 'string'
                ? input
                : input instanceof URL
                  ? input.toString()
                  : input.url;
        const rewrittenUrl = resolveApiUrl(originalUrl);
        const rewrittenInit = appendAuthHeader(init);
        const url = new URL(rewrittenUrl);
        const method = (rewrittenInit.method || 'GET').toUpperCase();

        if (url.pathname === '/users/' && method === 'GET' && !getStoredToken()) {
            // 토큰이 없을 때 인증 확인 요청을 네트워크로 보내지 않고 즉시 미인증 응답을 반환한다.
            return Promise.resolve(
                new Response(
                    JSON.stringify({
                        success: false,
                        message: '인증에 실패하였습니다.',
                        data: { error: '토큰이 없습니다.' },
                    }),
                    {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' },
                    },
                ),
            );
        }

        if (/\/users\/profileImage$/.test(url.pathname)) {
            // 구 API의 프로필 이미지 업로드 메서드를 현재 백엔드가 받는 PUT으로 보정한다.
            rewrittenInit.method = 'PUT';
        }
        if (/\/auth\/delete$/.test(url.pathname)) {
            rewrittenInit.method = 'POST';
        }

        return nativeFetch(rewrittenUrl, rewrittenInit);
    };
    window.__API_FETCH_ADAPTER__ = true;
};

installFetchAdapter();
