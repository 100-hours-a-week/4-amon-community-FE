# S3 및 CloudFront 배포

`main` 브랜치에 코드가 push되면 `.github/workflows/cd.yml`이 정적 파일을 S3에 동기화하고 CloudFront 캐시를 무효화한다. GitHub Actions 화면에서 수동 실행할 수도 있다.

## GitHub 설정

GitHub 저장소의 `Settings > Environments`에서 `production` 환경을 만든 후 다음 값을 등록한다.

| 구분 | 이름 | 값 |
| --- | --- | --- |
| Environment secret | `AWS_ROLE_ARN` | GitHub OIDC가 Assume할 AWS IAM Role ARN |
| Environment variable | `AWS_REGION` | S3 버킷 리전(예: `ap-northeast-2`) |
| Environment variable | `S3_BUCKET` | 버킷 이름(`s3://` 제외) |
| Environment variable | `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront 배포 ID |

장기 Access Key를 GitHub에 저장하지 않고 OIDC로 임시 자격 증명을 발급받는다. AWS IAM의 GitHub OIDC Provider와 Role 신뢰 정책을 먼저 설정해야 하며, 신뢰 정책의 `sub` 조건은 이 저장소의 `production` 환경으로 제한한다.

```json
{
  "Effect": "Allow",
  "Principal": {
    "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
  },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
      "token.actions.githubusercontent.com:sub": "repo:<GITHUB_OWNER>/<GITHUB_REPOSITORY>:environment:production"
    }
  }
}
```

Role에는 최소한 다음 작업 권한이 필요하다.

- 대상 버킷의 `s3:ListBucket`
- 대상 버킷 객체의 `s3:PutObject`, `s3:DeleteObject`
- 대상 CloudFront 배포의 `cloudfront:CreateInvalidation`

`aws s3 sync --delete`를 사용하므로 저장소에서 제거된 정적 파일은 S3에서도 제거된다. 워크플로는 `config.js`, `api`, `component`, `css`, `html`, `js`, `public`, `utils`만 배포하며 Node 서버 파일, Dockerfile, GitHub 설정 파일은 업로드하지 않는다.

## 별도 CI 파일을 두지 않는 이유

현재 프로젝트에는 컴파일 또는 번들링 단계가 없고, `package.json`에도 `test`, `lint`, `build` 스크립트가 없다. 따라서 현시점에 별도의 CI 워크플로를 만들어도 자동으로 검증할 실행 항목이 없으며, 빈 CI는 성공 표시만 만들 뿐 코드 품질을 보장하지 않는다.

CD 워크플로는 배포 대상 파일을 명시적으로 선별하므로 배포 패키징 역할도 자체적으로 수행한다. 이 판단은 “프론트엔드에는 CI가 필요 없다”는 일반 원칙이 아니라 **현재 저장소에 자동 검증 수단이 아직 없기 때문**이다.

다음 중 하나가 추가되면 별도 CI를 만들고, CI 성공 후에만 CD가 실행되도록 전환한다.

- ESLint, Prettier 검사
- 단위 테스트 또는 브라우저 E2E 테스트
- 번들러를 이용한 프로덕션 빌드
- HTML 링크 및 정적 리소스 유효성 검사

그 전까지는 PR 리뷰와 로컬 브라우저 확인이 품질 검증을 담당하고, CD는 `main`에 반영된 결과의 배포만 담당한다.
