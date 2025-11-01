import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    main: {
      img: "/banner1.jpg",
      link: "/organic",
    },
    side: {
      img: "/banner2.jpg",
      link: "/fruits",
    },
  },
  {
    main: {
      img: "benner3.jpg",
      link: "/vegetables",
    },
    side: {
      img: "banner4.jpg",
      link: "/premium",
    },
  },
  {
    main: {
      img: "banner4.jpg",
      link: "/dairy",
    },
    side: {
      img: "banner1.jpg",
      link: "/meat",
    },
  },
];

export default function BannerCarousel() {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto slide every 4 seconds
  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [isHovered]);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      className="relative w-full max-w-7xl mx-auto px-4 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slides Container */}
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={index} className="min-w-full">
              <div className="flex gap-4">
                {/* Main Banner - Lớn bên trái */}
                <a
                  href={slide.main.link}
                  className="flex-[2] block overflow-hidden rounded-2xl group/item"
                >
                  <img
                    src={slide.main.img}
                    alt="Main banner"
                    className="w-full h-64 md:h-80 lg:h-96 object-cover transition-transform duration-500 group-hover/item:scale-105"
                  />
                </a>

                {/* Side Banner - Nhỏ hơn bên phải */}
                <a
                  href={slide.side.link}
                  className="flex-1 block overflow-hidden rounded-2xl group/item hidden md:block"
                >
                  <img
                    src={slide.side.img}
                    alt="Side banner"
                    className="w-full h-64 md:h-80 lg:h-96 object-cover transition-transform duration-500 group-hover/item:scale-105"
                  />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons - Show on hover */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-gray-700" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-gray-700" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 bg-black/20 backdrop-blur-[2px] px-3 py-1 rounded-full z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`transition-all duration-300 rounded-full ${
              current === index
                ? "w-8 h-[2px] bg-white/90 shadow-sm"
                : "w-2 h-[2px] bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
    </div>
  );
}
