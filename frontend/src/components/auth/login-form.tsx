import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { authAPI } from "@/services/authService";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// 🔥 IMPORT HOOK VÀ COMPONENT SOCIAL LOGIN
import { useSocialAuth } from "@/hooks/useSocialAuth";

// Định nghĩa interface cho response
interface LoginResponse {
  data?: {
    data?: {
      MaTK: string;
      TenDangNhap: string;
      Email: string;
      [key: string]: any;
    };
    message?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    TenDangNhap: "",
    MatKhau: "",
  });

  const navigate = useNavigate();

  // 🔥 SỬ DỤNG HOOK SOCIAL AUTH
  const { 
    loading: socialLoading, 
    error: socialError, 
    loginWithGoogle, 
    loginWithFacebook,
    configLoaded 
  } = useSocialAuth();

  // 🔥 HIỂN THỊ LOADING NẾU CONFIG CHƯA LOAD XONG
  if (!configLoaded) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden p-0 bg-gray-50 shadow-xl shadow-gray-500">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6 md:p-8">
              <div className="flex justify-center mb-8">
                <a href="/" className="flex items-center font-medium text-lg">
                  <img src="/logo.png" alt="SAP Logo" className="h-20 w-auto" />
                  <div className="flex flex-col items-start">
                    <span className="text-green-700 font-bold text-2xl">
                      SAP
                    </span>
                    <span className="text-gray-700 mt-1 text-sm">
                      NÔNG SẢN vIỆT
                    </span>
                  </div>
                </a>
              </div>
              <div className="flex justify-center items-center p-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span className="ml-2">Đang tải cấu hình...</span>
              </div>
            </div>
            {/* Right image */}
            <div className="bg-muted relative hidden md:block">
              <img
                src="/format.jpeg"
                alt="Image"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.TenDangNhap.trim() || !formData.MatKhau.trim()) {
      toast.error("Vui lòng nhập tên đăng nhập và mật khẩu");
      return;
    }

    setIsLoading(true);

    try {
      const response = (await authAPI.login({
        TenDangNhap: formData.TenDangNhap.trim(),
        MatKhau: formData.MatKhau,
      })) as LoginResponse;

      console.log("🔍 LOGIN RESPONSE:", response);

      // LƯU THÔNG TIN USER VÀO LOCALSTORAGE - CHỈ LƯU MaTK
      if (response.data && response.data.data) {
        const userData = response.data.data;

        // Chỉ lưu MaTK vào localStorage
        localStorage.setItem(
          "userData",
          JSON.stringify({
            MaTK: userData.MaTK, // Quan trọng: chỉ lưu MaTK
          })
        );

        console.log("💾 USER DATA SAVED:", {
          MaTK: userData.MaTK,
        });
      } else {
        console.log("❌ Không có user data trong response:", response.data);
      }

      toast.success(response.data?.message || "Đăng nhập thành công!");

      setFormData({
        TenDangNhap: "",
        MatKhau: "",
      });

      window.dispatchEvent(new Event("authChange"));

      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1000);
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.message || "Đăng nhập thất bại";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 HANDLE SOCIAL LOGIN
  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      if (provider === 'google') {
        await loginWithGoogle();
      } else {
        await loginWithFacebook();
      }
      
      // Nếu đăng nhập thành công, hook đã tự động xử lý
      toast.success(`Đăng nhập với ${provider === 'google' ? 'Google' : 'Facebook'} thành công!`);
      
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1000);
    } catch (error: any) {
      console.error(`${provider} login error:`, error);
      toast.error(error.message || `Đăng nhập ${provider} thất bại`);
    }
  };

  // Kiểm tra nếu đang loading
  const isAnyLoading = isLoading || socialLoading;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 bg-gray-50 shadow-xl shadow-gray-500">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex justify-center mb-8">
                <a href="/" className="flex items-center font-medium text-lg">
                  <img src="/logo.png" alt="SAP Logo" className="h-20 w-auto" />
                  <div className="flex flex-col items-start">
                    <span className="text-green-700 font-bold text-2xl">
                      SAP
                    </span>
                    <span className="text-gray-700 mt-1 text-sm">
                      NÔNG SẢN vIỆT
                    </span>
                  </div>
                </a>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your Acme Inc account
                </p>
              </div>

              {/* Email / Username */}
              <Field>
                <FieldLabel htmlFor="TenDangNhap">Username or Email</FieldLabel>
                <Input
                  id="TenDangNhap"
                  name="TenDangNhap"
                  type="text"
                  placeholder="Nhập tên đăng nhập hoặc email"
                  required
                  value={formData.TenDangNhap}
                  onChange={handleChange}
                  disabled={isAnyLoading}
                />
              </Field>

              {/* Password */}
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="MatKhau">Password</FieldLabel>
                  <a
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="MatKhau"
                  name="MatKhau"
                  type="password"
                  required
                  placeholder="Nhập mật khẩu"
                  value={formData.MatKhau}
                  onChange={handleChange}
                  disabled={isAnyLoading}
                />
              </Field>

              {/* Submit */}
              <Field>
                <Button
                  type="submit"
                  disabled={isAnyLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      Đang đăng nhập...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </Field>

              {/* Social login - ĐÃ CẬP NHẬT */}
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <Field className="grid grid-cols-2 gap-4">
                {/* Google Button */}
                <Button 
                  variant="outline" 
                  type="button" 
                  disabled={isAnyLoading}
                  onClick={() => handleSocialLogin('google')}
                  className="flex items-center justify-center gap-2"
                >
                  {socialLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  <span>Google</span>
                </Button>

                {/* Facebook Button */}
                <Button 
                  variant="outline" 
                  type="button" 
                  disabled={isAnyLoading}
                  onClick={() => handleSocialLogin('facebook')}
                  className="flex items-center justify-center gap-2"
                >
                  {socialLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  )}
                  <span>Facebook</span>
                </Button>
              </Field>

              {/* Sign up link */}
              <FieldDescription className="text-center">
                Don't have an account?{" "}
                <a href="/signup" className="text-blue-600 hover:text-blue-500">
                  Sign up
                </a>
              </FieldDescription>
            </FieldGroup>
          </form>

          {/* Right image */}
          <div className="bg-muted relative hidden md:block">
            <img
              src="/format.jpeg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center text-white">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and{" "}
        <a href="#" className="">
          Privacy Policy
        </a>
        .
      </FieldDescription>
    </div>
  );
}