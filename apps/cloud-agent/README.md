# OCode.js Cloud Agent — MVP

Ứng dụng Next.js PWA độc lập trong `apps/cloud-agent`; không thay đổi package hay module gốc của thư viện OCode.js.

## Có trong MVP
- Chat responsive/PWA, đăng nhập GitHub OAuth và allowlist username, cookie HttpOnly ký HMAC.
- Chat API, lịch sử, task status, health check và OpenAPI contract.
- PostgreSQL làm persistent store/queue; worker chạy process riêng.
- Skills allowlist: `/status`, `/echo ...`, mặc định tạo kế hoạch. Runtime không có shell tùy ý, sửa repository hoặc deploy production.
- Không có DATABASE_URL: demo trong bộ nhớ cùng process, mất dữ liệu khi restart; health trả 503 và worker không chạy. Không dùng chế độ này cho cloud.

## OAuth Authorization Portal

Mở `/authorize` để chọn GitHub, Google hoặc Discord. Đăng ký callback URL tương ứng: `APP_ORIGIN/api/auth/callback` (GitHub), `APP_ORIGIN/api/auth/callback/google`, `APP_ORIGIN/api/auth/callback/discord`. Cấu hình client ID/secret và allowlist riêng (`GITHUB_ALLOWED_USERS`, `GOOGLE_ALLOWED_USERS`, `DISCORD_ALLOWED_USERS`) trong environment của server. Google allowlist dùng email đã xác minh; GitHub/Discord dùng username. Không đặt client secret trong biến `NEXT_PUBLIC_*`.

## Custom OAuth 2.0 provider

Portal có lựa chọn **Custom OAuth 2.0** tại `/authorize`. Cấu hình `CUSTOM_OAUTH_AUTHORIZATION_URL`, `CUSTOM_OAUTH_TOKEN_URL`, `CUSTOM_OAUTH_USERINFO_URL`, `CUSTOM_OAUTH_CLIENT_ID`, `CUSTOM_OAUTH_CLIENT_SECRET`, `CUSTOM_OAUTH_ALLOWED_USERS` và `APP_ORIGIN`. Callback URL cần đăng ký ở identity provider là `${APP_ORIGIN}/api/auth/custom/callback`. Mặc định scope là `openid email profile`; có thể đổi bằng `CUSTOM_OAUTH_SCOPE`. Userinfo mặc định đọc `email` làm login và `sub` làm provider ID; dùng `CUSTOM_OAUTH_LOGIN_FIELD` / `CUSTOM_OAUTH_ID_FIELD` với dot-path nếu provider trả schema khác. Token endpoint mặc định dùng `client_secret_post`; có thể đặt `CUSTOM_OAUTH_TOKEN_AUTH_METHOD=client_secret_basic`. PKCE S256 và state cookie HttpOnly được bật trong authorization flow. Allowlist dùng `CUSTOM_OAUTH_ALLOWED_USERS` (danh sách email/username, phân tách bằng dấu phẩy). Authorization URL, token URL và userinfo URL phải dùng HTTPS (ngoại trừ localhost). Client secret chỉ ở server environment, tuyệt đối không dùng `NEXT_PUBLIC_*`.

## Chạy local
Yêu cầu Node.js >=20.9 và npm.
```sh
cd apps/cloud-agent
cp .env.example .env
# Tạo GitHub OAuth App; callback URL: http://localhost:3000/api/auth/callback
# Điền GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_ALLOWED_USERS và SESSION_SECRET.
npm install
npm run dev
```
Mở http://localhost:3000. Để queue/history bền vững, đặt DATABASE_URL tới PostgreSQL sẵn có rồi chạy `npm run worker` ở terminal khác. Không tự tạo database hoặc dịch vụ trả phí. Trên cloud, web và worker phải là hai process dùng chung PostgreSQL.

## Kiểm tra
```sh
npm test
npm run typecheck
npm run build
```

## Trước production
Cấu hình OAuth client secret và SESSION_SECRET qua dashboard host; allowlist chỉ các GitHub username được duyệt. APP_ORIGIN phải là origin HTTPS chính xác và callback URL của GitHub OAuth App phải khớp tuyệt đối. Xác minh TLS và backup PostgreSQL; bật HTTPS; bổ sung rate limit dùng chung cho nhiều instance, audit/logging/alerting; thêm approval workflow và sandbox riêng trước khi mở skill có tác động. Không commit secrets.
