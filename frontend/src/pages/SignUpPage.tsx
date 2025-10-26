import React from "react";
import { GalleryVerticalEnd } from "lucide-react";
import { SignupForm } from "../components/auth/signup-form";

const SignupPage: React.FC = () => {
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
            {/* <h2 className="text-3xl font-bold mb-4">Welcome to SAP Service</h2>
            <p className="text-lg text-white/90">
              Join thousands of satisfied customers who trust our platform.
            </p> */}
          </div>
        </div>
      </div>

      {/* Form - ở chính giữa phía trước */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <a href="#" className="flex items-center font-medium text-lg">
              <img 
                src="/logo.png" 
                alt="SAP Logo" 
                className="h-20 w-auto"
              />
              <div className="flex flex-col items-start">
                <span className="text-white font-medium text-lg">SAP</span>
                <span className="text-xs text-gray-300 mt-0">NÔNG SẢN vIỆT</span>
              </div>
            </a>
          </div>
          
          {/* Form Container với background */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8">
            <SignupForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;