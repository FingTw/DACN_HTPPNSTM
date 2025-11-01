// Dữ liệu categories và navigation
export const categories = [
  {
    title: "FARM & PEOPLE",
    items: [
      "Sản Phẩm |",
      "Nông sản",
      "Sữa & Trứng",
      "Đặc sản vùng miền",
      "Hoa quả & Hạt",
      "rau cũa & Cây trồng",
      "| Mới & Theo mùa",
      "| Đặc Trước",
    ],
  },
];

export const navigation = [
  "Giới thiệu",
  "Nhà sản xuất",
  "Trợ giúp",
  "Sự kiện",
  "Thẻ quà tặng",
];

// Dữ liệu fallback khi API không hoạt động
export const fallbackProducts = [
  {
    id: 1,
    name: "Organic Farm Box",
    price: 45.99,
    image: "/images/farm-box.jpg",
    category: "Farm Boxes",
  },
  {
    id: 2,
    name: "Fresh Vegetables",
    price: 12.99,
    image: "/images/vegetables.jpg",
    category: "Produce",
  },
];
