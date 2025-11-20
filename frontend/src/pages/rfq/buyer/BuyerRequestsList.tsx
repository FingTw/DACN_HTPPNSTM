// src/pages/rfq/buyer/BuyerRequestsList.tsx
import { useState } from "react";
import { useBuyerRequests } from "@/hooks/useRFQ";
import RequestCard from "@/components/rfq/RequestCard";
import Pagination from "@/components/rfq/Pagination";
import { Package } from "lucide-react";

export default function BuyerRequestsList() {
  const [filters, setFilters] = useState({
    TrangThai: undefined as string | undefined,
    page: 1,
    limit: 12,
  });
  const { requests, loading, pagination, refetch } = useBuyerRequests(
    true,
    filters
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Tất cả yêu cầu mua hàng
        </h1>

        <select
          value={filters.TrangThai}
          onChange={(e) =>
            setFilters({
              ...filters,
              TrangThai: e.target.value || undefined,
              page: 1,
            })
          }
          className="px-5 py-3 border rounded-lg text-lg"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Open">Đang mở</option>
          <option value="PartiallyFilled">Đang xử lý</option>
          <option value="Completed">Hoàn thành</option>
          <option value="Expired">Hết hạn</option>
          <option value="Cancelled">Đã hủy</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 animate-pulse rounded-xl h-56"
            />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-20 h-20 mx-auto text-gray-300 mb-6" />
          <p className="text-xl text-gray-600">Bạn chưa có yêu cầu nào</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((req) => (
              <RequestCard
                key={req.MaYCDH}
                request={req}
                link={`/rfq/buyer/requests/${req.MaYCDH}`}
              />
            ))}
          </div>

          <Pagination
            currentPage={pagination?.page || 1}
            totalPages={pagination?.totalPages || 1}
            onPageChange={(page) => setFilters({ ...filters, page })}
          />
        </>
      )}
    </div>
  );
}
