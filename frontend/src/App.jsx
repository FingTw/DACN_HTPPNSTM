import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import { HomePage } from './pages/HomePage';
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <Toaster richColors/>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<SignInPage />} />        
          <Route path="/signup" element={<SignUpPage />} />
          {/* Private routes - có thể thêm sau */}
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;