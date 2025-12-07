import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Need Help Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Need Help?</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  Shipping Info
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  Returns
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quản lý</h3>
            <ul className="space-y-2">
              <li>
                <a href="/admin" className="text-gray-300 hover:text-white">
                  Admin
                </a>
              </li>
              <li>
                <a href="/employee" className="text-gray-300 hover:text-white">
                  Nhân viên
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  Shipping Info
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  Returns
                </a>
              </li>
            </ul>
          </div>

          {/* Additional footer sections can be added here */}
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 FarmFresh. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
