import React from 'react';
import { Link } from 'react-router-dom';
import { navigation } from '../data/mockData';

export const Header: React.FC = () => {
  return (
    <>
      {/* Main Header */}
      <header className="bg-green-700 border-b border-green-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-8">
            
            {/* Main Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase()}`}
                  className="text-white hover:text-green-200 px-1 py-2 text-sm font-medium transition-all duration-300 hover:scale-105"
                >
                  {item}
                </Link>
              ))}
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-2 ml-auto">
              <Link 
                to="/signin" 
                className="flex items-center text-white hover:text-green-200 text-sm font-medium transition-all duration-300 px-2 py-1 hover:scale-105"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Sign In
              </Link>
              <span className="text-white">|</span>
              <Link 
                to="/signup" 
                className="flex items-center text-white hover:text-green-200 text-sm font-medium transition-all duration-300 px-2 py-1 hover:scale-105"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Category Navigation - Thêm sticky và thanh tìm kiếm + giỏ hàng */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-2">
            {/* Logo và Categories */}
            <div className="flex items-center space-x-6">
              {/* Logo */}
              <div className="flex items-center">
                <img 
                  src="/logo.png" 
                  alt="Farm Fresh Logo" 
                  className="h-12 w-auto" 
                />
              </div>
              
              {/* Categories */}
                <nav className="flex space-x-9">
                {['Farm Boxes', 'Nông sản', 'Sữa & Trứng', 'Bánh mì & Ngũ cốc', 'Món ăn nhẹ', 'Đồ uống', 'Mới & Theo mùa'].map((item, index) => (
                    <div key={index} className="flex items-center">
                    <Link
                        to={`/category/${item.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '-')}`}
                        className="text-gray-800 hover:text-green-600 text-sm font-medium whitespace-nowrap transition-all duration-300 hover:scale-105"
                    >
                        {item}
                    </Link>
                    {/* Thêm dấu | sau Farm Boxes và trước Mới & Theo mùa */}
                    {index === 0 && ( // Sau Farm Boxes (index 0)
                        <span className="text-gray-400 mx-2">|</span>
                    )}
                    {index === 5 && ( // Trước Mới & Theo mùa (sau Đồ uống - index 5)
                        <span className="text-gray-400 mx-2">|</span>
                    )}
                    </div>
                ))}
                </nav>
            </div>

            {/* Thanh tìm kiếm và Giỏ hàng */}
            <div className="flex items-center space-x-4">
              {/* Thanh tìm kiếm */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-64 px-4 py-1.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>

              {/* Icon giỏ hàng */}
              <Link 
                to="/cart" 
                className="relative p-2 text-gray-700 hover:text-green-600 transition-all duration-300 hover:scale-110"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M7 13l2.5 5.5m0 0L17 21m-7.5-2.5h7.5" />
                </svg>
                {/* Badge số lượng sản phẩm trong giỏ */}
                <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  0
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};