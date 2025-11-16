# DailyDesk

## Cách chạy

Lần đầu chạy sẽ cần cài đặt `pnpm`. Chạy lệnh sau:
```bash
npm install -g pnpm@latest
```

Sau đó chạy dự án bình thường:
1. Cài đặt dependency:
```bash
pnpm install
```

2. Cập nhật database
```bash
pnpm update-db
```

3. Chạy code: 
```bash
pnpm dev
```

Trang web giờ đang ở http://localhost:5173.

## Cách gọi api


Trước hết ta xem có API nào để gọi. Có thể truy cập trang http://localhost:5173/doc để xem danh sách tất cả API của backend.
<img width="1609" height="1012" alt="image" src="https://github.com/user-attachments/assets/15294ae1-5039-4380-926f-3b0024ce9391" />

Sau khi biết có API thì sử dụng httpClient từ `@/lib/client`
```tsx
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "./components/ui/button";
import httpClient from "@/lib/client";

function App() {
  async function doSomething() {
    await httpClient.get("/boards");
  }
  return (
    <div>
      <h1>Welcome to the App!</h1>
      <Button onClick={doSomething}>Hello</Button>
    </div>
  );
}

export default App;
```
