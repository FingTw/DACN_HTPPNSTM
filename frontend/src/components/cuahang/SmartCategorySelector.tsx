// components/cuahang/SmartCategorySelector.tsx
import React, { useState, useEffect } from "react";

interface DanhMuc {
  MaDM: string;
  TenDM: string;
  MoTa?: string;
  SoLuongSP?: number;
}

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
  carrot: ["Rái củ", "Cà rốt"],
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

      // Nếu không có dữ liệu để phân tích
      if (!productName && !productImages?.length) {
        console.log("❌ Không có dữ liệu để phân tích");
        setSuggestedCategories([]);
        return;
      }

      setIsAnalyzingImages(true);

      try {
        // Phân tích từ khóa từ tên và mô tả
        const keywords = extractKeywords(
          (productName || "") + " " + (productDescription || "")
        );
        console.log("🔑 Từ khóa từ văn bản:", keywords);

        // 🟢 PHÂN TÍCH ẢNH BẰNG AI NẾU CÓ
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
            // Fallback: phân tích tên file nếu AI fail
            aiKeywords = extractKeywordsFromImageNames(productImages);
            console.log("🔑 Từ khóa từ tên file (fallback):", aiKeywords);
          }
        }

        // Kết hợp từ khóa
        const allKeywords = [...keywords, ...aiKeywords];
        console.log("🎯 Tất cả từ khóa:", allKeywords);

        // Lấy gợi ý danh mục
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

    // Chỉ phân tích 3 ảnh đầu để tránh quá tải
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

      // Loại bỏ extension và các ký tự đặc biệt
      const cleanName = fileName
        .replace(/\.[^/.]+$/, "")
        .replace(
          /[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]/g,
          ""
        );

      // Thêm từ khóa từ tên file
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

      // 🟢 ĐẶC BIỆT: GỢI Ý TỪ AI PREDICTIONS
      aiPredictions.forEach((prediction) => {
        const aiCategories =
          FOOD_CATEGORY_MAPPING[prediction.class_original] || [];
        if (
          aiCategories.some((aiCat) =>
            category.TenDM.toLowerCase().includes(aiCat.toLowerCase())
          )
        ) {
          const aiScore = 15 + prediction.confidence / 10; // Điểm cao cho AI
          score += aiScore;
          console.log(
            `🎯 AI khớp: ${prediction.class_original} -> ${
              category.TenDM
            } (+${aiScore.toFixed(1)} điểm)`
          );
        }
      });

      // 🟢 GỢI Ý TỪ TỪ KHÓA THÔNG THƯỜNG
      keywords.forEach((keyword) => {
        if (categoryText.includes(keyword)) {
          score += 5; // Tăng điểm cho khớp chính xác
          console.log(
            `🔤 Từ khóa khớp: "${keyword}" trong "${category.TenDM}" (+5 điểm)`
          );
        } else if (
          categoryText.split(" ").some((word) => word.includes(keyword)) ||
          keyword.includes(categoryText) ||
          category.TenDM.toLowerCase().includes(keyword)
        ) {
          score += 2; // Điểm cho khớp một phần
        }
      });

      // Ưu tiên danh mục có nhiều sản phẩm
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

        // Cập nhật gợi ý sau khi phân tích AI
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
      {/* 🟢 DEBUG INFO - Chỉ hiển thị trong môi trường development */}
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
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
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
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-green-800 flex items-center gap-2">
              <span>🤖</span>
              AI đã nhận diện được
            </h4>
            <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
              {aiPredictions.length} kết quả
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiPredictions.map((prediction, index) => (
              <div
                key={index}
                className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2"
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
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-blue-800 flex items-center gap-2">
              <span>🎯</span>
              Gợi ý danh mục thông minh
              {productImages && productImages.length > 0 && (
                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                  {aiPredictions.length > 0 ? "từ AI" : "từ phân tích"}
                </span>
              )}
            </h4>
            {productImages && productImages.length > 0 && (
              <button
                onClick={handleReanalyzeImages}
                disabled={isAnalyzingImages}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
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
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-3 ${
                      selectedCategories.includes(category.MaDM)
                        ? "bg-blue-500 text-white shadow-lg scale-105"
                        : "bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400 hover:shadow-md"
                    }`}
                  >
                    <span className="font-semibold">{category.TenDM}</span>

                    {/* Badge số lượng sản phẩm */}
                    {category.SoLuongSP !== undefined &&
                      category.SoLuongSP > 0 && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            selectedCategories.includes(category.MaDM)
                              ? "bg-blue-300 text-blue-800"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {category.SoLuongSP} sản phẩm
                        </span>
                      )}

                    {/* Badge AI gợi ý */}
                    {isAISuggestion && (
                      <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full flex items-center gap-1">
                        <span>AI</span>
                        <span>🤖</span>
                      </span>
                    )}

                    {/* Badge thêm/xóa */}
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
      <div className="bg-white border border-gray-300 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* 🟢 DANH SÁCH DANH MỤC */}
        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
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
                  className="flex items-center gap-3 p-3 hover:bg-white rounded-lg cursor-pointer transition-all duration-200 border border-transparent hover:border-gray-300 hover:shadow-sm"
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
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
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
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Thêm danh mục
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomCategory("");
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
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
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
            <span>✅</span>
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
                  className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2"
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
                  className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2"
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
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-blue-500 text-lg mt-0.5">💡</span>
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-800 mb-2">Mẹo chọn danh mục:</p>
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

export default SmartCategorySelector;
