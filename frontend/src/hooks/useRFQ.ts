// src/hooks/useRFQ.ts
import { useState, useEffect, useCallback } from "react";
import rfqService from "../services/rfqService";
import type {
  BuyerRequest,
  Proposal,
  Product,
  BuyerStatistics,
  SellerStatistics,
} from "../services/rfqService";

// ============================================
// 📋 HOOK CHO NGƯỜI MUA
// ============================================

export const useBuyerRequests = (
  autoFetch: boolean = true,
  filters?: { TrangThai?: string; page?: number; limit?: number }
) => {
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await rfqService.getMyRequests(filters);
      setRequests(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (autoFetch) {
      fetchRequests();
    }
  }, [autoFetch, fetchRequests]);

  return { requests, loading, error, pagination, refetch: fetchRequests };
};

export const useCreateRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRequest = async (requestData: {
    MaDM?: string;
    TenSP_YeuCau: string;
    SoLuongYeuCau: number;
    ChatLuongYeuCau?: string;
    GiaMongMuon?: number;
    ThoiHan?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await rfqService.createRequest(requestData);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createRequest, loading, error };
};

export const useProposalsForRequest = (MaYCDH: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProposals = useCallback(async () => {
    if (!MaYCDH) return;
    setLoading(true);
    setError(null);
    try {
      const response = await rfqService.getProposalsForRequest(MaYCDH);
      setData(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [MaYCDH]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  return { data, loading, error, refetch: fetchProposals };
};

export const useAcceptProposal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptProposal = async (acceptData: {
    MaDNCC: string;
    SoLuongMua?: number;
    GhiChu?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await rfqService.acceptProposal(acceptData);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { acceptProposal, loading, error };
};

export const useRejectProposal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rejectProposal = async (MaDNCC: string, LyDoTuChoi?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await rfqService.rejectProposal(MaDNCC, LyDoTuChoi);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { rejectProposal, loading, error };
};

export const useBuyerStatistics = () => {
  const [stats, setStats] = useState<BuyerStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await rfqService.getBuyerStatistics();
      setStats(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};

// ============================================
// 🏪 HOOK CHO NGƯỜI BÁN
// ============================================

export const useSellerRequests = (
  autoFetch: boolean = true,
  filters?: {
    MaDM?: string;
    keyword?: string;
    page?: number;
    limit?: number;
  }
) => {
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await rfqService.getAllOpenRequests(filters);
      setRequests(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (autoFetch) {
      fetchRequests();
    }
  }, [autoFetch, fetchRequests]);

  return { requests, loading, error, pagination, refetch: fetchRequests };
};

export const useNewRequests = () => {
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNewRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await rfqService.getNewRequests();
      setRequests(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNewRequests();
  }, [fetchNewRequests]);

  return { requests, loading, error, refetch: fetchNewRequests };
};

export const useSellerProducts = (
  autoFetch: boolean = true,
  filters?: {
    keyword?: string;
    MaDM?: string;
    page?: number;
    limit?: number;
  }
) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await rfqService.getMyProducts(filters);
      setProducts(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch, fetchProducts]);

  return { products, loading, error, pagination, refetch: fetchProducts };
};

export const useSubmitProposal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitProposal = async (proposalData: {
    MaYCDH: string;
    MaSP: string;
    SoLuongCungCap: number;
    GiaDeNghi: number;
    ChatLuongDeNghi?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await rfqService.submitProposal(proposalData);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submitProposal, loading, error };
};

export const useSellerProposals = (
  autoFetch: boolean = true,
  filters?: { TrangThai?: string; page?: number; limit?: number }
) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await rfqService.getMyProposals(filters);
      setProposals(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (autoFetch) {
      fetchProposals();
    }
  }, [autoFetch, fetchProposals]);

  return { proposals, loading, error, pagination, refetch: fetchProposals };
};

export const useUpdateProposal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProposal = async (
    MaDNCC: string,
    updateData: {
      SoLuongCungCap?: number;
      GiaDeNghi?: number;
      ChatLuongDeNghi?: string;
    }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await rfqService.updateProposal(MaDNCC, updateData);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateProposal, loading, error };
};

export const useCancelProposal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelProposal = async (MaDNCC: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await rfqService.cancelProposal(MaDNCC);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { cancelProposal, loading, error };
};

export const useSellerStatistics = () => {
  const [stats, setStats] = useState<SellerStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await rfqService.getSellerStatistics();
      setStats(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};
