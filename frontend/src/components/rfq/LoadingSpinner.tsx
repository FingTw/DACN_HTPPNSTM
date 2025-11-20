// src/components/rfq/LoadingSpinner.tsx
export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-6 text-xl text-gray-600">Đang tải dữ liệu...</p>
    </div>
  );
}
