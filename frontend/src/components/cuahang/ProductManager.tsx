// components/cuahang/ProductManager.tsx
import React, { useState, useEffect, useCallback } from "react";
import type { Store, Product, DanhMuc, ProductFormData } from "./store";
import categoryService from "@/services/categoryService";

interface ProductManagerProps {
  store: Store;
  isOwner: boolean;
  onProductsUpdate?: () => void;
}

interface UserData {
  MaTK: string;
  TenDangNhap: string;
  Email: string;
  LoaiTaiKhoan: string;
  token?: string;
}

// 🟢 CONSTANTS
const API_BASE_URL = "http://localhost:3000/api";
const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// 🟢 UTILITY FUNCTIONS
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const getAuthToken = (): string | null => {
  const tokenKeys = ["token", "authToken", "accessToken", "jwtToken"];
  for (const key of tokenKeys) {
    const token = localStorage.getItem(key);
    if (token) return token;
  }

  const userDataString = localStorage.getItem("userData");
  if (userDataString) {
    try {
      const userData: UserData = JSON.parse(userDataString);
      return userData.token || null;
    } catch {
      console.error("Không thể parse userData");
    }
  }

  return null;
};

// 🟢 SMART CATEGORY SELECTOR COMPONENT VỚI AI INTEGRATION
interface SmartCategorySelectorProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  allCategories: DanhMuc[];
  productImages?: File[];
  productName?: string;
  productDescription?: string;
}

// 🟢 MAP TỪ TÊN RAU CỦ QUẢ SANG DANH MỤC
const FOOD_CATEGORY_MAPPING: { [key: string]: string[] } = {
  // Trái cây
  apple: ["Trái cây", "Trái cây nhập khẩu"],
  banana: ["Trái cây", "Chuối"],
  grapes: ["Trái cây", "Nho"],
  mango: ["Trái cây", "Xoài"],
  orange: ["Trái cây", "Cam"],
  lemon: ["Trái cây", "Chanh"],
  kiwi: ["Trái cây", "Trái cây nhập khẩu"],
  pear: ["Trái cây", "Lê"],
  pineapple: ["Trái cây", "Dứa"],
  pomegranate: ["Trái cây", "Lựu"],
  watermelon: ["Trái cây", "Dưa hấu"],

  // Rau củ
  cabbage: ["Rau củ", "Bắp cải"],
  carrot: ["Rau củ", "Cà rốt"],
  cauliflower: ["Rau củ", "Súp lơ"],
  cucumber: ["Rau củ", "Dưa leo"],
  eggplant: ["Rau củ", "Cà tím"],
  lettuce: ["Rau củ", "Xà lách"],
  potato: ["Rau củ", "Khoai tây"],
  spinach: ["Rau củ", "Rau chân vịt"],
  tomato: ["Rau củ", "Cà chua"],
  "bell pepper": ["Rau củ", "Ớt chuông"],
  "chilli pepper": ["Rau củ", "Ớt"],
  jalepeno: ["Rau củ", "Ớt"],
  paprika: ["Rau củ", "Ớt bột"],

  // Củ
  beetroot: ["Rau củ", "Củ dền"],
  garlic: ["Rau củ", "Tỏi"],
  ginger: ["Rau củ", "Gừng"],
  onion: ["Rau củ", "Hành tây"],
  raddish: ["Rau củ", "Củ cải"],
  sweetpotato: ["Rau củ", "Khoai lang"],
  turnip: ["Rau củ", "Củ cải turnip"],

  // Ngũ cốc & Đậu
  corn: ["Ngũ cốc", "Bắp"],
  sweetcorn: ["Ngũ cốc", "Bắp ngọt"],
  peas: ["Rau củ", "Đậu Hà Lan"],
  "soy beans": ["Ngũ cốc", "Đậu nành"],
};

const SmartCategorySelector: React.FC<SmartCategorySelectorProps> = ({
  selectedCategories,
  onCategoriesChange,
  allCategories,
  productImages,
  productName,
  productDescription,
}) => {
  const [suggestedCategories, setSuggestedCategories] = useState<DanhMuc[]>([]);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAnalyzingImages, setIsAnalyzingImages] = useState(false);
  const [aiPredictions, setAiPredictions] = useState<
    Array<{
      class: string;
      confidence: number;
      class_original: string;
    }>
  >([]);

  // 🟢 GỢI Ý DANH MỤC TỰ ĐỘNG - ĐÃ TÍCH HỢP AI
  useEffect(() => {
    const analyzeAndSuggest = async () => {
      console.log("🔄 Bắt đầu phân tích để gợi ý...");
      console.log("📝 Tên sản phẩm:", productName);
      console.log("📝 Mô tả sản phẩm:", productDescription);
      console.log("🖼️ Số lượng ảnh:", productImages?.length);

      if (!productName && !productImages?.length) {
        console.log("❌ Không có dữ liệu để phân tích");
        setSuggestedCategories([]);
        return;
      }

      setIsAnalyzingImages(true);

      try {
        const keywords = extractKeywords(
          (productName || "") + " " + (productDescription || "")
        );
        console.log("🔑 Từ khóa từ văn bản:", keywords);

        let aiKeywords: string[] = [];
        if (productImages && productImages.length > 0) {
          try {
            console.log("🤖 Bắt đầu phân tích AI...");
            const predictions = await analyzeImagesWithAI(productImages);
            setAiPredictions(predictions);
            aiKeywords = predictions.map((p) => p.class_original);
            console.log("✅ Kết quả AI:", predictions);
          } catch (error) {
            console.error("❌ Lỗi phân tích AI:", error);
            aiKeywords = extractKeywordsFromImageNames(productImages);
            console.log("🔑 Từ khóa từ tên file (fallback):", aiKeywords);
          }
        }

        const allKeywords = [...keywords, ...aiKeywords];
        console.log("🎯 Tất cả từ khóa:", allKeywords);

        const suggestions = getCategorySuggestions(allKeywords, allCategories);
        console.log(
          "💡 Danh mục được gợi ý:",
          suggestions.map((s) => `${s.TenDM} (${s.score})`)
        );

        setSuggestedCategories(suggestions.slice(0, 5));
      } catch (error) {
        console.error("❌ Lỗi trong quá trình phân tích:", error);
        setSuggestedCategories([]);
      } finally {
        setIsAnalyzingImages(false);
      }
    };

    analyzeAndSuggest();
  }, [productName, productImages, productDescription, allCategories]);

  // 🟢 PHÂN TÍCH ẢNH VỚI AI MODEL
  const analyzeImagesWithAI = async (
    images: File[]
  ): Promise<
    Array<{
      class: string;
      confidence: number;
      class_original: string;
    }>
  > => {
    const predictions = [];

    console.log(`📤 Gửi ${Math.min(images.length, 3)} ảnh đến AI server...`);

    for (const image of images.slice(0, 3)) {
      try {
        console.log(`🖼️ Đang xử lý ảnh: ${image.name}`);
        const formData = new FormData();
        formData.append("file", image);

        const response = await fetch("http://localhost:5000/predict", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            predictions.push(result.data);
            console.log(
              `✅ AI nhận diện: ${result.data.class} (${result.data.confidence}%)`
            );
          } else {
            console.warn(`⚠️ AI prediction failed: ${result.message}`);
          }
        } else {
          console.warn(`⚠️ Lỗi AI server: ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ Lỗi phân tích ảnh ${image.name}:`, error);
      }
    }

    console.log(`📊 Tổng kết AI: ${predictions.length} kết quả`);
    return predictions;
  };

  // 🟢 TRÍCH XUẤT TỪ KHÓA TỪ TÊN FILE ẢNH
  const extractKeywordsFromImageNames = (images: File[]): string[] => {
    const keywords: string[] = [];

    images.forEach((file) => {
      const fileName = file.name.toLowerCase();
      const cleanName = fileName
        .replace(/\.[^/.]+$/, "")
        .replace(
          /[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]/g,
          ""
        );

      const words = cleanName
        .split(/[\s-_]+/)
        .filter((word) => word.length > 1);
      keywords.push(...words);
    });

    return [...new Set(keywords)];
  };

  // 🟢 TRÍCH XUẤT TỪ KHÓA
  const extractKeywords = (text: string): string[] => {
    if (!text || text.trim() === "") return [];

    const commonWords = [
      "và",
      "của",
      "cho",
      "từ",
      "với",
      "các",
      "những",
      "sản",
      "phẩm",
      "mới",
      "chất",
      "lượng",
      "tốt",
      "đẹp",
      "ngon",
      "tươi",
      "sạch",
      "hình",
      "ảnh",
      "image",
      "img",
      "pic",
      "photo",
      "product",
      "item",
      "good",
      "best",
      "new",
      "fresh",
      "quality",
      "có",
      "là",
      "các",
      "như",
    ];

    const words = text
      .toLowerCase()
      .replace(
        /[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g,
        " "
      )
      .split(/\s+/)
      .filter((word) => word.length > 2 && !commonWords.includes(word));

    return [...new Set(words)];
  };

  // 🟢 GỢI Ý DANH MỤC DỰA TRÊN TỪ KHÓA - ĐÃ TÍCH HỢP AI MAPPING
  const getCategorySuggestions = (
    keywords: string[],
    categories: DanhMuc[]
  ): Array<DanhMuc & { score: number }> => {
    if (keywords.length === 0) return [];

    const scoredCategories = categories.map((category) => {
      let score = 0;
      const categoryText = (
        category.TenDM +
        " " +
        (category.MoTa || "")
      ).toLowerCase();

      aiPredictions.forEach((prediction) => {
        const aiCategories =
          FOOD_CATEGORY_MAPPING[prediction.class_original] || [];
        if (
          aiCategories.some((aiCat) =>
            category.TenDM.toLowerCase().includes(aiCat.toLowerCase())
          )
        ) {
          const aiScore = 15 + prediction.confidence / 10;
          score += aiScore;
          console.log(
            `🎯 AI khớp: ${prediction.class_original} -> ${
              category.TenDM
            } (+${aiScore.toFixed(1)} điểm)`
          );
        }
      });

      keywords.forEach((keyword) => {
        if (categoryText.includes(keyword)) {
          score += 5;
          console.log(
            `🔤 Từ khóa khớp: "${keyword}" trong "${category.TenDM}" (+5 điểm)`
          );
        } else if (
          categoryText.split(" ").some((word) => word.includes(keyword)) ||
          keyword.includes(categoryText) ||
          category.TenDM.toLowerCase().includes(keyword)
        ) {
          score += 2;
        }
      });

      if (category.SoLuongSP && category.SoLuongSP > 0) {
        const popularityBonus = Math.min(Math.log(category.SoLuongSP + 1), 3);
        score += popularityBonus;
      }

      return { ...category, score };
    });

    const filtered = scoredCategories.filter((cat) => cat.score > 0);
    const sorted = filtered.sort((a, b) => b.score - a.score);

    console.log(
      `🏆 Top danh mục được gợi ý:`,
      sorted.slice(0, 3).map((c) => `${c.TenDM} (${c.score.toFixed(1)})`)
    );
    return sorted;
  };

  // 🟢 XỬ LÝ CHỌN DANH MỤC
  const handleCategoryToggle = (categoryId: string) => {
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];

    onCategoriesChange(newSelected);
  };

  // 🟢 THÊM DANH MỤC TÙY CHỈNH
  const handleAddCustomCategory = () => {
    if (customCategory.trim()) {
      const newCategory: DanhMuc = {
        MaDM: `CUSTOM_${Date.now()}`,
        TenDM: customCategory.trim(),
        MoTa: "Danh mục tùy chỉnh",
      };

      handleCategoryToggle(newCategory.MaDM);
      setCustomCategory("");
      setShowCustomInput(false);
    }
  };

  // 🟢 TẢI LẠI PHÂN TÍCH ẢNH
  const handleReanalyzeImages = async () => {
    if (productImages && productImages.length > 0) {
      setIsAnalyzingImages(true);
      try {
        console.log("🔄 Bắt đầu phân tích lại ảnh...");
        const predictions = await analyzeImagesWithAI(productImages);
        setAiPredictions(predictions);

        const keywords = extractKeywords(
          (productName || "") + " " + (productDescription || "")
        );
        const aiKeywords = predictions.map((p) => p.class_original);
        const allKeywords = [...keywords, ...aiKeywords];

        const suggestions = getCategorySuggestions(allKeywords, allCategories);
        setSuggestedCategories(suggestions.slice(0, 5));

        console.log("✅ Phân tích lại hoàn tất");
      } catch (error) {
        console.error("❌ Lỗi phân tích lại ảnh:", error);
      } finally {
        setIsAnalyzingImages(false);
      }
    }
  };

  // 🟢 LỌC DANH MỤC THEO TỪ KHÓA TÌM KIẾM
  const filteredCategories = allCategories.filter(
    (category) =>
      category.TenDM.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.MoTa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* 🟢 DEBUG INFO */}
      {import.meta.env?.DEV && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm font-medium text-yellow-800">Debug Info:</p>
          <div className="text-xs text-yellow-700 space-y-1">
            <p>• Ảnh: {productImages?.length || 0}</p>
            <p>• Kết quả AI: {aiPredictions.length}</p>
            <p>• Gợi ý: {suggestedCategories.length}</p>
            <p>
              • Từ khóa:{" "}
              {productName ? extractKeywords(productName).join(", ") : "none"}
            </p>
          </div>
        </div>
      )}

      {/* 🟢 THÔNG BÁO PHÂN TÍCH ẢNH */}
      {isAnalyzingImages && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Đang phân tích hình ảnh
              </p>
              <p className="text-xs text-blue-600">
                Hệ thống AI đang nhận diện sản phẩm từ ảnh của bạn...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 KẾT QUẢ AI PHÂN TÍCH */}
      {aiPredictions.length > 0 && !isAnalyzingImages && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-green-800 flex items-center gap-2">
              <span className="text-lg">🤖</span>
              AI đã nhận diện được
            </h4>
            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
              {aiPredictions.length} kết quả
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiPredictions.map((prediction, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm"
              >
                <span className="font-medium">{prediction.class}</span>
                <span className="text-xs bg-green-600 px-2 py-1 rounded-full">
                  {prediction.confidence}% chắc chắn
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🟢 GỢI Ý DANH MỤC THÔNG MINH */}
      {suggestedCategories.length > 0 && !isAnalyzingImages && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-blue-800 flex items-center gap-2">
              <span className="text-lg">🎯</span>
              Gợi ý danh mục thông minh
              {productImages && productImages.length > 0 && (
                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                  {aiPredictions.length > 0 ? "từ AI" : "từ phân tích"}
                </span>
              )}
            </h4>
            {productImages && productImages.length > 0 && (
              <button
                onClick={handleReanalyzeImages}
                disabled={isAnalyzingImages}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors font-medium"
              >
                {isAnalyzingImages ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    Phân tích lại
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm text-blue-700">
              {aiPredictions.length > 0
                ? "Dựa trên phân tích AI, chúng tôi đề xuất các danh mục phù hợp:"
                : "Chúng tôi đề xuất các danh mục phù hợp với sản phẩm của bạn:"}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedCategories.map((category) => {
                const isAISuggestion = aiPredictions.some((pred) => {
                  const aiCates =
                    FOOD_CATEGORY_MAPPING[pred.class_original] || [];
                  return aiCates.some((aiCat) =>
                    category.TenDM.toLowerCase().includes(aiCat.toLowerCase())
                  );
                });

                return (
                  <button
                    key={category.MaDM}
                    type="button"
                    onClick={() => handleCategoryToggle(category.MaDM)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-3 shadow-sm ${
                      selectedCategories.includes(category.MaDM)
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105"
                        : "bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:shadow-md"
                    }`}
                  >
                    <span className="font-semibold">{category.TenDM}</span>

                    {category.SoLuongSP !== undefined &&
                      category.SoLuongSP > 0 && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            selectedCategories.includes(category.MaDM)
                              ? "bg-blue-300 text-blue-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {category.SoLuongSP} sản phẩm
                        </span>
                      )}

                    {isAISuggestion && (
                      <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full flex items-center gap-1">
                        <span>AI</span>
                        <span>🤖</span>
                      </span>
                    )}

                    {!selectedCategories.includes(category.MaDM) && (
                      <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                        + Thêm
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 🟢 TÌM KIẾM DANH MỤC */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-gray-800">
            Danh mục sản phẩm *
            <span className="text-xs text-gray-500 font-normal ml-2">
              ({selectedCategories.length} danh mục đã chọn)
            </span>
          </label>

          {suggestedCategories.length === 0 &&
            !isAnalyzingImages &&
            productName && (
              <span className="text-xs text-gray-500">
                Nhập tên hoặc mô tả để được gợi ý
              </span>
            )}
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            placeholder="🔍 Tìm kiếm danh mục..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50"
          />
        </div>

        {/* 🟢 DANH SÁCH DANH MỤC */}
        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm
                ? "Không tìm thấy danh mục phù hợp"
                : "Đang tải danh mục..."}
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {filteredCategories.map((category) => (
                <label
                  key={category.MaDM}
                  className="flex items-center gap-3 p-3 hover:bg-purple-50 rounded-lg cursor-pointer transition-all duration-200 border border-transparent hover:border-purple-200"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.MaDM)}
                    onChange={() => handleCategoryToggle(category.MaDM)}
                    className="rounded text-purple-500 focus:ring-purple-500 w-5 h-5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {category.TenDM}
                      {category.SoLuongSP !== undefined &&
                        category.SoLuongSP > 0 && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            {category.SoLuongSP}
                          </span>
                        )}
                    </div>
                    {category.MoTa && (
                      <div className="text-sm text-gray-600 mt-1">
                        {category.MoTa}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 🟢 THÊM DANH MỤC MỚI */}
        <div className="mt-4">
          {showCustomInput ? (
            <div className="space-y-3">
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Nhập tên danh mục mới..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) =>
                  e.key === "Enter" && handleAddCustomCategory()
                }
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  disabled={!customCategory.trim()}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-400 text-white py-2 rounded-lg font-medium transition-all duration-200 shadow-sm"
                >
                  Thêm danh mục
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomCategory("");
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors shadow-sm"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="w-full flex items-center justify-center gap-2 text-purple-600 hover:text-purple-800 font-medium py-3 border-2 border-dashed border-purple-300 rounded-xl hover:bg-purple-50 transition-all duration-200"
            >
              <span className="text-lg">+</span>
              Thêm danh mục mới
            </button>
          )}
        </div>
      </div>

      {/* 🟢 DANH MỤC ĐÃ CHỌN */}
      {selectedCategories.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
            <span className="text-lg">✅</span>
            Danh mục đã chọn ({selectedCategories.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((categoryId) => {
              const category = allCategories.find(
                (cat) => cat.MaDM === categoryId
              );
              return category ? (
                <span
                  key={categoryId}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm"
                >
                  <span className="font-medium">{category.TenDM}</span>
                  <button
                    type="button"
                    onClick={() => handleCategoryToggle(categoryId)}
                    className="hover:bg-green-600 rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors"
                  >
                    ×
                  </button>
                </span>
              ) : (
                <span
                  key={categoryId}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm"
                >
                  <span className="font-medium">
                    {categoryId.replace("CUSTOM_", "")}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCategoryToggle(categoryId)}
                    className="hover:bg-green-600 rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 🟢 THÔNG TIN HỖ TRỢ */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-blue-500 text-lg mt-0.5">💡</span>
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-800 mb-2">
              Mẹo chọn danh mục:
            </p>
            <ul className="space-y-1">
              <li>
                • <span className="font-medium">Hệ thống AI</span> tự động nhận
                diện sản phẩm từ hình ảnh
              </li>
              <li>
                •{" "}
                <span className="font-medium">Chọn danh mục phù hợp nhất</span>{" "}
                với đặc điểm sản phẩm
              </li>
              <li>
                •{" "}
                <span className="font-medium">Có thể chọn nhiều danh mục</span>{" "}
                nếu sản phẩm thuộc nhiều loại
              </li>
              {productImages && productImages.length > 0 && (
                <li>
                  • <span className="font-medium">Tải lại phân tích</span> nếu
                  kết quả AI chưa chính xác
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🟢 IMAGE UPLOAD COMPONENT
interface ImageUploadProps {
  images: File[];
  previews: string[];
  onImagesChange: (files: File[]) => void;
  onImageRemove: (index: number) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  previews,
  onImagesChange,
  onImageRemove,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const validFiles: File[] = [];

    newFiles.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        alert(`File ${file.name} không phải là hình ảnh`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert(`File ${file.name} vượt quá 5MB`);
        return;
      }
      validFiles.push(file);
    });

    const totalFiles = images.length + validFiles.length;
    if (totalFiles > MAX_IMAGES) {
      alert(`Chỉ được upload tối đa ${MAX_IMAGES} hình ảnh`);
      return;
    }

    onImagesChange(validFiles);
  };

  const totalImages = images.length + previews.length;

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-800">
        Hình ảnh sản phẩm ({totalImages}/{MAX_IMAGES})
      </h4>

      {(previews.length > 0 || images.length > 0) && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
          {previews.map((preview, index) => (
            <div key={`existing-${index}`} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-gray-300 shadow-sm"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm opacity-0 group-hover:opacity-100 font-medium">
                  Ảnh hiện có
                </span>
              </div>
            </div>
          ))}

          {images.map((file, index) => (
            <div key={`new-${index}`} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={`New ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-gray-300 shadow-sm"
              />
              <button
                type="button"
                onClick={() => onImageRemove(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-md"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gradient-to-br from-gray-50 to-blue-50 hover:from-gray-100 hover:to-blue-100 transition-all duration-200 shadow-sm">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-8 h-8 mb-4 text-gray-500"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 16"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
              />
            </svg>
            <p className="mb-2 text-sm text-gray-500 font-medium">
              <span className="font-semibold">Click để upload</span> hoặc kéo
              thả
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF (MAX. 5MB mỗi file)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
        </label>
      </div>
    </div>
  );
};

// 🟢 PRODUCT FORM COMPONENT
interface ProductFormProps {
  editingProduct: Product | null;
  formData: ProductFormData;
  danhMucs: DanhMuc[];
  uploadingImage: boolean;
  onInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  onCategoriesChange: (categories: string[]) => void;
  onImagesChange: (files: File[]) => void;
  onImageRemove: (index: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  editingProduct,
  formData,
  danhMucs,
  uploadingImage,
  onInputChange,
  onCategoriesChange,
  onImagesChange,
  onImageRemove,
  onSubmit,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800">
            {editingProduct ? "✏️ Chỉnh sửa sản phẩm" : "➕ Thêm sản phẩm mới"}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CỘT TRÁI - THÔNG TIN CƠ BẢN */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-5 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-4 text-lg">
                  Thông tin cơ bản
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tên sản phẩm *
                    </label>
                    <input
                      type="text"
                      name="TenSP"
                      value={formData.TenSP}
                      onChange={onInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
                      placeholder="Nhập tên sản phẩm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mô tả sản phẩm
                    </label>
                    <textarea
                      name="MoTa"
                      value={formData.MoTa}
                      onChange={onInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
                      placeholder="Mô tả chi tiết về sản phẩm..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-2xl p-5 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-4 text-lg">
                  Giá & Tồn kho
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Giá bán *
                    </label>
                    <input
                      type="number"
                      name="GiaBan"
                      value={formData.GiaBan}
                      onChange={onInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Số lượng *
                    </label>
                    <input
                      type="number"
                      name="SLTon"
                      value={formData.SLTon}
                      onChange={onInputChange}
                      required
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Đơn vị tính *
                    </label>
                    <input
                      type="text"
                      name="DVT"
                      value={formData.DVT}
                      onChange={onInputChange}
                      required
                      placeholder="kg, gói, hộp..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Trạng thái
                    </label>
                    <select
                      name="TrangThai"
                      value={formData.TrangThai}
                      onChange={onInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      <option value="active">Đang bán</option>
                      <option value="inactive">Ngừng bán</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI - DANH MỤC VÀ HÌNH ẢNH */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl p-5 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-4 text-lg">
                  Danh mục sản phẩm
                </h4>
                <SmartCategorySelector
                  selectedCategories={formData.danhMucIds}
                  onCategoriesChange={onCategoriesChange}
                  allCategories={danhMucs}
                  productImages={formData.HinhAnhs}
                  productName={formData.TenSP}
                  productDescription={formData.MoTa}
                />
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-pink-50 rounded-2xl p-5 border border-gray-200">
                <ImageUpload
                  images={formData.HinhAnhs}
                  previews={formData.HinhAnhPreviews}
                  onImagesChange={onImagesChange}
                  onImageRemove={onImageRemove}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={uploadingImage}
              className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {uploadingImage ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang xử lý...
                </>
              ) : editingProduct ? (
                "💾 Cập nhật sản phẩm"
              ) : (
                "➕ Thêm sản phẩm"
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={uploadingImage}
              className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Hủy bỏ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 🟢 EMPTY STATE COMPONENT
const EmptyProductState: React.FC<{ onAddProduct: () => void }> = ({
  onAddProduct,
}) => (
  <div className="text-center py-16">
    <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
      <span className="text-5xl">📦</span>
    </div>
    <h3 className="text-2xl font-bold text-gray-800 mb-3">
      Chưa có sản phẩm nào
    </h3>
    <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
      Hãy thêm sản phẩm đầu tiên để bắt đầu kinh doanh! Tạo sản phẩm mới và quản
      lý chúng một cách dễ dàng.
    </p>
    <button
      onClick={onAddProduct}
      className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
    >
      Thêm sản phẩm ngay
    </button>
  </div>
);

// 🟢 LOADING SPINNER COMPONENT
const LoadingSpinner: React.FC = () => (
  <div className="text-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
    <p className="text-gray-600 text-lg">Đang tải sản phẩm...</p>
  </div>
);

// 🟢 MAIN COMPONENT
const ProductManager: React.FC<ProductManagerProps> = ({
  store,
  isOwner,
  onProductsUpdate,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [danhMucs, setDanhMucs] = useState<DanhMuc[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  const [formData, setFormData] = useState<ProductFormData>({
    TenSP: "",
    MoTa: "",
    GiaBan: "",
    SLTon: "",
    DVT: "",
    TrangThai: "active",
    danhMucIds: [],
    HinhAnhs: [],
    HinhAnhPreviews: [],
  });

  // 🟢 API CONFIG
  const API_CONFIG = {
    products: `${API_BASE_URL}/sanpham/cua-hang/${store.MaCH}?include=hinhanh,danhmuc`,
    createProduct: `${API_BASE_URL}/sanpham/tao-moi`, // Lưu ý endpoint này phải khớp route backend
    updateProduct: (maSP: string) => `${API_BASE_URL}/sanpham/cap-nhat/${maSP}`,
    deleteProduct: (maSP: string) => `${API_BASE_URL}/sanpham/xoa/${maSP}`,
  };

  // 🟢 FETCH DATA
  const fetchDanhMucs = useCallback(async (): Promise<void> => {
    try {
      const data = await categoryService.getAllCategories();
      setDanhMucs(data);
    } catch (error) {
      console.error("❌ Lỗi khi tải danh mục:", error);
      setDanhMucs([]);
    }
  }, []);

  const fetchProducts = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch(API_CONFIG.products);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.success) {
        const productsData =
          data.data?.products || data.data || data.products || [];
        setProducts(Array.isArray(productsData) ? productsData : []);
      }
    } catch (error) {
      console.error("❌ Lỗi khi tải sản phẩm:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [store.MaCH]);

  useEffect(() => {
    if (store?.MaCH) {
      fetchProducts();
      fetchDanhMucs();
    }
  }, [store?.MaCH, fetchProducts, fetchDanhMucs]);

  // 🟢 FORM HANDLERS
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoriesChange = (newCategories: string[]): void => {
    setFormData((prev) => ({ ...prev, danhMucIds: newCategories }));
  };

  const handleImagesChange = (newFiles: File[]): void => {
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setFormData((prev) => ({
      ...prev,
      HinhAnhs: [...prev.HinhAnhs, ...newFiles],
      HinhAnhPreviews: [...prev.HinhAnhPreviews, ...newPreviews],
    }));
  };

  const handleRemoveImage = (index: number): void => {
    setFormData((prev) => {
      const newHinhAnhs = [...prev.HinhAnhs];
      const newHinhAnhPreviews = [...prev.HinhAnhPreviews];

      URL.revokeObjectURL(newHinhAnhPreviews[index]);
      newHinhAnhs.splice(index, 1);
      newHinhAnhPreviews.splice(index, 1);

      return {
        ...prev,
        HinhAnhs: newHinhAnhs,
        HinhAnhPreviews: newHinhAnhPreviews,
      };
    });
  };

  // 🟢 VALIDATION
  const validateForm = (): boolean => {
    if (!formData.TenSP.trim()) {
      alert("Vui lòng nhập tên sản phẩm");
      return false;
    }
    if (!formData.GiaBan || parseFloat(formData.GiaBan) <= 0) {
      alert("Vui lòng nhập giá bán hợp lệ");
      return false;
    }
    if (!formData.SLTon || parseInt(formData.SLTon) < 0) {
      alert("Vui lòng nhập số lượng tồn hợp lệ");
      return false;
    }
    if (!formData.DVT.trim()) {
      alert("Vui lòng nhập đơn vị tính");
      return false;
    }
    return true;
  };

  // 🟢 API CALLS
  const callProductAPI = async (
    url: string,
    method: string,
    body?: FormData
  ): Promise<any> => {
    const token = getAuthToken();
    if (!token) {
      alert("Bạn cần đăng nhập để thực hiện thao tác này");
      return null;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      return await response.json();
    } catch (error) {
      console.error("❌ Lỗi API:", error);
      throw error;
    }
  };

  // 🟢 PRODUCT OPERATIONS
  const handleAddProduct = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setUploadingImage(true);
      const formDataToSend = createFormData();
      const data = await callProductAPI(
        API_CONFIG.createProduct,
        "POST",
        formDataToSend
      );

      if (data?.success) {
        handleSuccess("Thêm sản phẩm thành công!");
      } else {
        alert(data?.message || "Lỗi khi thêm sản phẩm");
      }
    } catch (error) {
      alert("Lỗi khi thêm sản phẩm");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!editingProduct || !validateForm()) return;

    try {
      setUploadingImage(true);
      const formDataToSend = createFormData();
      const data = await callProductAPI(
        API_CONFIG.updateProduct(editingProduct.MaSP),
        "PUT",
        formDataToSend
      );

      if (data?.success) {
        handleSuccess("Cập nhật sản phẩm thành công!");
      } else {
        alert(data?.message || "Lỗi khi cập nhật sản phẩm");
      }
    } catch (error) {
      alert("Lỗi khi cập nhật sản phẩm");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteProduct = async (productId: string): Promise<void> => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

    try {
      const data = await callProductAPI(
        API_CONFIG.deleteProduct(productId),
        "DELETE"
      );

      if (data?.success) {
        fetchProducts();
        onProductsUpdate?.();
        alert("✅ Xóa sản phẩm thành công!");
      } else {
        alert(data?.message || "Lỗi khi xóa sản phẩm");
      }
    } catch (error) {
      alert("Lỗi khi xóa sản phẩm");
    }
  };

  // 🟢 HELPER FUNCTIONS
  const createFormData = (): FormData => {
    const formDataToSend = new FormData();
    formDataToSend.append("TenSP", formData.TenSP.trim());
    formDataToSend.append("MoTa", formData.MoTa || "");
    formDataToSend.append("GiaBan", formData.GiaBan);
    formDataToSend.append("SLTon", formData.SLTon);
    formDataToSend.append("DVT", formData.DVT.trim());
    formDataToSend.append(
      "TrangThai",
      formData.TrangThai === "active" ? "Đang bán" : "Ngừng bán"
    );

    const nonCustomCategories = formData.danhMucIds.filter(
      (id) => !id.startsWith("CUSTOM_")
    );
    nonCustomCategories.forEach((maDM) =>
      formDataToSend.append("danhMucIds", maDM)
    );

    formData.HinhAnhs.forEach((file) =>
      formDataToSend.append(editingProduct ? "hinhAnhMoi" : "images", file)
    );

    return formDataToSend;
  };

  const handleSuccess = (message: string): void => {
    setShowForm(false);
    resetForm();
    fetchProducts();
    onProductsUpdate?.();
    alert(`✅ ${message}`);
  };

  const startEditProduct = (product: Product): void => {
    setEditingProduct(product);
    setFormData({
      TenSP: product.TenSP || "",
      MoTa: product.MoTa || "",
      GiaBan: product.GiaBan?.toString() || "",
      SLTon: product.SLTon?.toString() || "",
      DVT: product.DVT || "",
      TrangThai: (product.TrangThai === "Đang bán" ? "active" : "inactive") as
        | "active"
        | "inactive",
      danhMucIds: product.MaDM_danhmucs?.map((dm) => dm.MaDM) || [],
      HinhAnhs: [],
      HinhAnhPreviews: product.hinhanhs?.map((h) => h.URL) || [],
    });
    setShowForm(true);
  };

  const resetForm = (): void => {
    formData.HinhAnhPreviews.forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    });

    setFormData({
      TenSP: "",
      MoTa: "",
      GiaBan: "",
      SLTon: "",
      DVT: "",
      TrangThai: "active",
      danhMucIds: [],
      HinhAnhs: [],
      HinhAnhPreviews: [],
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleAddProductClick = (): void => {
    setEditingProduct(null);
    setFormData({
      TenSP: "",
      MoTa: "",
      GiaBan: "",
      SLTon: "",
      DVT: "",
      TrangThai: "active",
      danhMucIds: [],
      HinhAnhs: [],
      HinhAnhPreviews: [],
    });
    setShowForm(true);
  };

  // 🟢 RENDER FUNCTIONS
  const renderProductImage = (product: Product): React.ReactElement => {
    const imageUrl = product.hinhanhs?.[0]?.URL || product.MaHA_SanPham;
    return (
      <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shadow-sm">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.TenSP}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-400 text-2xl">🖼️</span>
        )}
      </div>
    );
  };

  const renderProductCategories = (product: Product): React.ReactElement => {
    const categories = product.MaDM_danhmucs || [];

    return (
      <div className="flex flex-wrap gap-1 max-w-xs">
        {categories.length > 0 ? (
          <>
            {categories.slice(0, 3).map((dm) => (
              <span
                key={dm.MaDM}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 font-medium"
              >
                {dm.TenDM}
              </span>
            ))}
            {categories.length > 3 && (
              <span className="text-gray-500 text-xs font-medium">
                +{categories.length - 3} khác
              </span>
            )}
          </>
        ) : (
          <span className="text-gray-400 text-sm">Chưa có danh mục</span>
        )}
      </div>
    );
  };

  const renderStatusBadge = (product: Product): React.ReactElement => {
    const isActive =
      product.TrangThai === "active" || product.TrangThai === "Đang bán";
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
          isActive
            ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800"
            : "bg-gradient-to-r from-red-100 to-pink-100 text-red-800"
        }`}
      >
        {isActive ? "Đang bán" : "Ngừng bán"}
      </span>
    );
  };

  const renderStockBadge = (product: Product): React.ReactElement => {
    const stock = product.SLTon || 0;
    let className = "bg-gradient-to-r from-red-100 to-pink-100 text-red-800";

    if (stock > 10)
      className =
        "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800";
    else if (stock > 0)
      className =
        "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800";

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${className}`}
      >
        {stock} {product.DVT}
      </span>
    );
  };

  // 🟢 MAIN RENDER
  if (!isOwner) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl border border-gray-200 p-12 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-3xl">🚫</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">
          Không có quyền truy cập
        </h3>
        <p className="text-gray-600 text-lg">
          Chỉ chủ cửa hàng mới có quyền quản lý sản phẩm
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
          <div className="mb-6 lg:mb-0">
            <h2 className="text-3xl font-bold mb-3">Quản lý sản phẩm</h2>
            <p className="text-purple-100 text-lg">
              Quản lý và cập nhật danh sách sản phẩm của cửa hàng
            </p>
          </div>
          <button
            onClick={handleAddProductClick}
            className="bg-white text-purple-600 hover:bg-purple-50 px-8 py-4 rounded-xl font-bold transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl text-lg"
          >
            <span className="text-2xl">+</span>
            Thêm sản phẩm mới
          </button>
        </div>
      </div>

      {/* Debug Info */}
      {import.meta.env?.DEV && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 p-6 rounded-2xl shadow-sm">
          <p className="text-yellow-800 font-bold text-lg mb-2">Debug Info:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-semibold">showForm:</span>{" "}
              {showForm ? "true" : "false"}
            </div>
            <div>
              <span className="font-semibold">editingProduct:</span>{" "}
              {editingProduct ? editingProduct.MaSP : "null"}
            </div>
            <div>
              <span className="font-semibold">Products:</span> {products.length}
            </div>
            <div>
              <span className="font-semibold">Categories:</span>{" "}
              {danhMucs.length}
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          editingProduct={editingProduct}
          formData={formData}
          danhMucs={danhMucs} // Danh sách này giờ đã có dữ liệu từ service
          uploadingImage={uploadingImage}
          onInputChange={handleInputChange}
          onCategoriesChange={handleCategoriesChange}
          onImagesChange={handleImagesChange}
          onImageRemove={handleRemoveImage}
          onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
          onCancel={resetForm}
        />
      )}

      {/* Products List */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 lg:mb-0">
              Danh sách sản phẩm ({products.length})
            </h3>
            <div className="flex items-center gap-6">
              <span className="text-sm font-semibold text-gray-700 bg-white px-3 py-2 rounded-lg shadow-sm">
                Đang bán:{" "}
                {
                  products.filter(
                    (p) =>
                      p.TrangThai === "Đang bán" || p.TrangThai === "active"
                  ).length
                }
              </span>
              <span className="text-sm font-semibold text-gray-700 bg-white px-3 py-2 rounded-lg shadow-sm">
                Ngừng bán:{" "}
                {
                  products.filter(
                    (p) =>
                      p.TrangThai === "Ngừng bán" || p.TrangThai === "inactive"
                  ).length
                }
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {products.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Hình ảnh
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Tồn kho
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr
                    key={product.MaSP}
                    className="hover:bg-gradient-to-r from-gray-50 to-blue-50 transition-all duration-200"
                  >
                    <td className="px-8 py-6">{renderProductImage(product)}</td>
                    <td className="px-8 py-6">
                      <div>
                        <div className="font-bold text-gray-900 text-lg line-clamp-2 mb-2">
                          {product.TenSP}
                        </div>
                        {product.MoTa && (
                          <div className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                            {product.MoTa}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {renderProductCategories(product)}
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(product.GiaBan)}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">
                        / {product.DVT}
                      </div>
                    </td>
                    <td className="px-8 py-6">{renderStockBadge(product)}</td>
                    <td className="px-8 py-6">{renderStatusBadge(product)}</td>
                    <td className="px-8 py-6">
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEditProduct(product)}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200 border border-blue-200 hover:border-blue-300"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.MaSP)}
                          className="text-red-600 hover:text-red-800 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-red-50 transition-all duration-200 border border-red-200 hover:border-red-300"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyProductState onAddProduct={handleAddProductClick} />
          )}
        </div>

        {loading && <LoadingSpinner />}
      </div>
    </div>
  );
};

export default ProductManager;
