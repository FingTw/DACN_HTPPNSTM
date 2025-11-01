import BannerCarousel from "../home/Banner";
import { Header } from "../layout/Header";
import StoreRegistration from "./StoreSidebar";

export default function Page() {
  return (
    <div className=" min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex flex-1 ">
        {/* Sidebar - Fixed position */}
        <aside className="w-64 flex-shrink-0">
          <div className="sticky top-0">
            <StoreRegistration />
          </div>
        </aside>

        <main className="flex-1 bg-gray-100 flex flex-col space-y-4 p-2">
          <div className="card rounded-xl bg-white p-2 ">
            <BannerCarousel />
          </div>
        </main>
      </div>
    </div>
  );
}
