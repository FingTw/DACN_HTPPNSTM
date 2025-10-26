import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { authAPI } from "@/services/authService" // Sử dụng API service
import { toast } from "react-hot-toast"
import { useNavigate } from "react-router-dom"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    TenDangNhap: "",
    Email: "",
    MatKhau: "",
    confirmPassword: ""
  })
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.TenDangNhap.trim() || !formData.Email.trim() || !formData.MatKhau) {
      toast.error("Vui lòng điền đầy đủ thông tin")
      return
    }

    if (formData.MatKhau !== formData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp")
      return
    }

    if (formData.MatKhau.length < 8) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.Email)) {
      toast.error("Email không hợp lệ")
      return
    }

    setIsLoading(true)

    try {
      // Sử dụng API service
      const response = await authAPI.register({
        TenDangNhap: formData.TenDangNhap.trim(),
        Email: formData.Email.trim(),
        MatKhau: formData.MatKhau
      })

      toast.success(response.data.message || "Đăng ký thành công!")
      
      // Reset form
      setFormData({
        TenDangNhap: "",
        Email: "",
        MatKhau: "",
        confirmPassword: ""
      })

      // Redirect đến trang login sau 2 giây
      setTimeout(() => {
        navigate('/signin', { replace: true })
      }, 2000)

    } catch (error: any) {
      console.error('Signup error:', error)
      const errorMessage = error.response?.data?.message || "Đăng ký thất bại"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className={cn("flex flex-col gap-4", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup className="space-y-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Tạo tài khoản mới</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Điền thông tin bên dưới để tạo tài khoản
          </p>
        </div>

        {/* Tên đăng nhập */}
        <Field>
          <FieldLabel htmlFor="TenDangNhap" className="text-sm font-medium text-gray-700">
            Tên đăng nhập *
          </FieldLabel>
          <Input 
            id="TenDangNhap"
            name="TenDangNhap"
            type="text" 
            placeholder="Nhập tên đăng nhập" 
            required 
            value={formData.TenDangNhap}
            onChange={handleChange}
            disabled={isLoading}
            className="mt-1 placeholder-gray-400"
          />
        </Field>

        {/* Email */}
        <Field>
          <FieldLabel htmlFor="Email" className="text-sm font-medium text-gray-700">
            Email *
          </FieldLabel>
          <Input 
            id="Email"
            name="Email"
            type="email" 
            placeholder="example@email.com" 
            required 
            value={formData.Email}
            onChange={handleChange}
            disabled={isLoading}
            className="mt-1 placeholder-gray-400"
          />
          <FieldDescription>
            Chúng tôi sẽ sử dụng email để liên hệ. Chúng tôi không chia sẻ email của bạn với bên thứ ba.
          </FieldDescription>
        </Field>

        {/* Mật khẩu */}
        <Field>
          <FieldLabel htmlFor="MatKhau" className="text-sm font-medium text-gray-700">
            Mật khẩu *
          </FieldLabel>
          <Input 
            id="MatKhau"
            name="MatKhau"
            type="password" 
            required 
            placeholder="Mật khẩu ít nhất 8 ký tự"
            value={formData.MatKhau}
            onChange={handleChange}
            disabled={isLoading}
            className="mt-1 placeholder-gray-400"
          />
          <FieldDescription className="text-xs text-gray-500">
            ⚠️ Mật khẩu phải có ít nhất 8 ký tự
          </FieldDescription>
        </Field>

        {/* Xác nhận mật khẩu */}
        <Field>
          <FieldLabel htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
            Xác nhận mật khẩu *
          </FieldLabel>
          <Input 
            id="confirmPassword"
            name="confirmPassword"
            type="password" 
            required 
            placeholder="Nhập lại mật khẩu"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
            className="mt-1 placeholder-gray-400"
          />
        </Field>

        {/* Submit Button */}
        <Field>
          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Đang xử lý...
              </>
            ) : "Đăng ký"}
          </Button>
        </Field>

        <FieldSeparator>Hoặc tiếp tục với</FieldSeparator>

        <Field>
          <Button 
            variant="outline" 
            type="button" 
            className="w-full"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2">
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                fill="currentColor"
              />
            </svg>
            Đăng ký với GitHub
          </Button>
          <FieldDescription className="text-center mt-4">
            Đã có tài khoản?{" "}
            <Link 
              to="/signin" 
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              onClick={(e) => isLoading && e.preventDefault()}
            >
              Đăng nhập
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}