import React from "react";
import { GalleryVerticalEnd } from "lucide-react";
import { SignupForm } from "../components/auth/signup-form";

const SignupPage: React.FC = () => {
  return (
    <div className="bg-gradient-to-t from-green-600 to-white overflow-y-clip">
      <div className="min-h-screen relative ">
        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <div className="w-full max-w-4xl">
            <SignupForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
