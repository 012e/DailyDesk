import { Button } from "@/components/ui/button";
import { LogIn, Shield, Workflow } from "lucide-react";
import type { MouseEventHandler } from "react";

export default function PleaseLogin({
  onClick,
}: {
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <div className="flex flex-col justify-center items-center w-screen h-screen bg-white dark:bg-gray-950">
      <div className="max-w-md w-full mx-auto px-6">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-8">
          <div className="bg-blue-600 p-5 rounded-2xl shadow-lg">
            <Workflow className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Vui lòng đăng nhập để truy cập vào <span className="font-semibold text-blue-600 dark:text-blue-400">DailyDesk</span> - 
            hệ thống quản lý workflow cá nhân của bạn.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Secure Access
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Xác thực an toàn với Auth0
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Workflow className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Personal Workspace
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Quản lý boards và tasks riêng tư
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={onClick}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base py-6"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Sign In to Continue
          </Button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-500 mt-6">
          Chưa có tài khoản? Đăng ký miễn phí khi đăng nhập
        </p>
      </div>
    </div>
  );
}
