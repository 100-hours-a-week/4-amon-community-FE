import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();

dotenv.config();

// 백엔드 CORS 허용 origin에 맞춰 로컬 프론트 서버를 3000 포트로 띄운다.
const port = 3000;

// 현재 파일의 URL에서 디렉토리 경로를 추출
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.get('/config.js', (req, res) => {
    // 로컬 실행 시 .env의 API 주소를 브라우저 전역 설정으로 내려준다.
    const apiBaseUrl =
        process.env.API_BASE_URL || 'http://localhost:8080';
    res.set('Cache-Control', 'no-store');
    res.type('application/javascript').send(
        `window.__APP_CONFIG__ = ${JSON.stringify({
            API_BASE_URL: apiBaseUrl,
        })};`,
    );
});

// config.js는 로컬 실행 설정을 우선해야 하므로 정적 파일 제공보다 먼저 등록한다.
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.redirect('/html/index.html');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
