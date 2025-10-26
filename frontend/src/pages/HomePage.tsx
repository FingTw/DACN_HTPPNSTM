import React from 'react';
import { Header } from '@/components/layout/Header';
// import  CategorySection  from '@/components/home/CategorySection';
import { HeroSection } from '@/components/home/HeroSection';
import { Footer } from '@/components/layout/Footer';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* <CategorySection /> FARM & PEOPLE section nằm ở đây */}
      
      <main className="flex-1">
        <HeroSection />
        
        {/* Featured Products Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Product cards will go here */}
              <div className="text-center p-8 border border-gray-200 rounded-lg">
                <p className="text-gray-500">Product cards coming soon...</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};