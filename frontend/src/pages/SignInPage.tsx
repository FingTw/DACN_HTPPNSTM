import React from "react";
import { LoginForm } from "../components/auth/login-form";

const SignInPage: React.FC = () => {
  return (
    <div className="min-h-screen relative">
      {/* Background Image - ở đằng sau */}
      <div className="absolute inset-0 z-0">
        <img
          src="/format.jpeg"
          alt="Office workspace"
          className="h-full w-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/40 to-yellow-600/50 flex items-center justify-center">
          <div className="text-center text-white p-8 max-w-md">
            {/* Có thể thêm nội dung ở đây nếu cần */}
          </div>
        </div>
      </div>

      {/* Form - ở chính giữa phía trước */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="SAP Logo" 
                className="h-20 w-auto"
              />
              <div className="flex flex-col items-start ml-3">
                <span className="text-white font-bold text-2xl">SAP</span>
                <span className="text-sm text-gray-200 mt-1">NÔNG SẢN VIỆT</span>
              </div>
            </div>
          </div>
          
          {/* Form Container với background */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;