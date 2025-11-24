// src/hooks/useSocialAuth.ts
import { useState, useEffect } from 'react';
import { authAPI } from '@/services/authService';

declare global {
  interface Window {
    google: any;
    FB: any;
  }
}

export const useSocialAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientConfig, setClientConfig] = useState<{
    googleClientId: string;
    facebookAppId: string;
  } | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // 🔥 LẤY CONFIG TỪ BACKEND KHI HOOK ĐƯỢC KHỞI TẠO
  useEffect(() => {
    const fetchClientConfig = async () => {
      try {
        console.log('🚀 Fetching client config from backend...');
        const response = await authAPI.getClientConfig();
        
        if (response.data.success) {
          setClientConfig(response.data.data);
          console.log('✅ Client config loaded:', {
            hasGoogleId: !!response.data.data.googleClientId,
            hasFacebookId: !!response.data.data.facebookAppId
          });
        } else {
          throw new Error(response.data.message || 'Failed to load config');
        }
      } catch (err: any) {
        console.error('❌ Error loading client config:', err);
        setError('Không thể tải cấu hình từ server');
      } finally {
        setConfigLoading(false);
      }
    };

    fetchClientConfig();
  }, []);

  // Khởi tạo Google Auth
  const initializeGoogle = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.google) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('✅ Google SDK loaded');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Failed to load Google SDK');
        reject(new Error('Không thể tải Google SDK'));
      };
      document.head.appendChild(script);
    });
  };

  // Khởi tạo Facebook SDK
  const initializeFacebook = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.FB) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/vi_VN/sdk.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('✅ Facebook SDK loaded');
        
        if (!clientConfig?.facebookAppId) {
          reject(new Error('Facebook App ID chưa được cấu hình'));
          return;
        }

        window.FB.init({
          appId: clientConfig.facebookAppId,
          cookie: true,
          xfbml: true,
          version: 'v19.0'
        });
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Failed to load Facebook SDK');
        reject(new Error('Không thể tải Facebook SDK'));
      };
      document.head.appendChild(script);
    });
  };

  // Đăng nhập Google
  const loginWithGoogle = async () => {
  try {
    if (!clientConfig?.googleClientId) {
      throw new Error('Google Client ID chưa được cấu hình. Vui lòng thử lại sau.');
    }

    setLoading(true);
    setError(null);
    
    console.log('🚀 Starting Google login...');

    await initializeGoogle();

    return new Promise<void>((resolve, reject) => {
      console.log('🔧 Initializing Google Identity Services...');
      
      window.google.accounts.id.initialize({
        client_id: clientConfig.googleClientId,
        callback: async (response: any) => {
          console.log('🔧 Google callback received');
          
          if (response.credential) {
            console.log('✅ Google ID Token received');
            try {
              // 🔥 FIX: ĐỢI response và xử lý
              const apiResponse = await authAPI.googleLogin({ token: response.credential });
              console.log('✅ Google login successful', apiResponse.data);
              
              // 🔥 THÊM: Dispatch event để cập nhật UI
              window.dispatchEvent(new Event("authChange"));
              resolve();
            } catch (err: any) {
              console.error('❌ Google login API error:', err);
              const errorMsg = err.response?.data?.message || 'Lỗi đăng nhập Google';
              setError(errorMsg);
              reject(new Error(errorMsg));
            }
          } else {
            console.error('❌ No credential in Google response');
            const error = new Error('Đăng nhập Google bị hủy');
            setError(error.message);
            reject(error);
          }
        }
      });

      console.log('🔧 Showing Google prompt...');
      window.google.accounts.id.prompt();
    });
  } catch (err: any) {
    console.error('❌ Google login error:', err);
    const errorMsg = err.message || 'Lỗi đăng nhập Google';
    setError(errorMsg);
    throw new Error(errorMsg);
  } finally {
    setLoading(false);
  }
};

  // Đăng nhập Facebook
  const loginWithFacebook = async () => {
    try {
      if (!clientConfig?.facebookAppId) {
        throw new Error('Facebook App ID chưa được cấu hình. Vui lòng thử lại sau.');
      }

      setLoading(true);
      setError(null);
      
      console.log('🚀 Starting Facebook login...');
      console.log('🔧 Using Facebook App ID from backend config');
      
      await initializeFacebook();

      return new Promise<void>((resolve, reject) => {
        console.log('🔧 Opening Facebook login dialog...');
        
        window.FB.login((response: any) => {
          console.log('🔧 Facebook login response:', response);
          
          if (response.authResponse) {
            console.log('✅ Facebook auth response received');
            authAPI.facebookLogin({ accessToken: response.authResponse.accessToken })
              .then(() => {
                console.log('✅ Facebook login successful');
                resolve();
              })
              .catch((err: any) => {
                console.error('❌ Facebook login API error:', err);
                const errorMsg = err.response?.data?.message || 'Lỗi đăng nhập Facebook';
                setError(errorMsg);
                reject(new Error(errorMsg));
              });
          } else {
            console.error('❌ Facebook login cancelled');
            const error = new Error('Đăng nhập Facebook bị hủy');
            setError(error.message);
            reject(error);
          }
        }, { scope: 'email,public_profile' });
      });
    } catch (err: any) {
      console.error('❌ Facebook login error:', err);
      const errorMsg = err.message || 'Lỗi đăng nhập Facebook';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading: loading || configLoading,
    error,
    loginWithGoogle,
    loginWithFacebook,
    configLoaded: !configLoading && !!clientConfig,
  };
};