import React from "react";

export const HeroSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-r from-green-100 to-emerald-300 py-20 rounded-xl ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Hương vị quê nhà, lan tỏa muôn nơi
          </h1>
          <p className="text-xl text-red-400 mb-8 max-w-2xl mx-auto font-bold">
            Sự hài lòng của bạn là thành công của chúng tôi
          </p>
          <button className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors shadow-lg">
            SHOP NOW
          </button>
        </div>
      </div>
    </section>
  );
};
