import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Bot } from "lucide-react";
import ChatProductCard, { type ChatProduct } from "./ChatProductCard";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  suggestedProduct?: ChatProduct;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      text: "Xin chào! Tôi là trợ lý ảo của SAP. Tôi có thể giúp gì cho bạn về nông sản sạch?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Chuẩn bị history để gửi lên server (để AI nhớ ngữ cảnh)
      const history = messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        text: msg.text,
      }));

      const response = await fetch("http://localhost:3000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMsg.text,
          history: history, // Gửi kèm lịch sử
        }),
      });

      const data = await response.json();

      if (data) {
        let aiMsg: Message;
        if (data.type === "product_suggestion" && data.product) {
          aiMsg = {
            id: (Date.now() + 1).toString(),
            role: "ai",
            text: data.message || "Tôi có một gợi ý cho bạn:",
            suggestedProduct: data.product,
          };
        } else {
          aiMsg = {
            id: (Date.now() + 1).toString(),
            role: "ai",
            text: data.content || "Xin lỗi, tôi không hiểu ý bạn.",
          };
        }

        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          text: "Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* CỬA SỔ CHAT */}
      {isOpen && (
        <div className="bg-white/20 backdrop-blur-sm w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
          {/* Header */}
          <div className="bg-green-500 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Trợ lý AI SAP</h3>
                <span className="flex items-center gap-1 text-xs text-green-100">
                  <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                  Đang hoạt động
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nội dung tin nhắn */}
          <div className="bg-white/20 backdrop-blur-sm flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-green-500 text-white rounded-br-none shadow-lg"
                      : "bg-gray-100 text-black rounded-bl-none shadow-lg"
                  }`}
                >
                  {msg.text}
                  {msg.role === "ai" && msg.suggestedProduct && (
                    <div className="mt-2 ml-1">
                      <ChatProductCard product={msg.suggestedProduct} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className=" p-3 bg-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Hỏi gì đó..."
                className="bg-white flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white p-2 rounded-full transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-center text-[10px] text-green-400 mt-2">
              AI có thể đưa ra thông tin chưa chính xác.
            </p>
          </div>
        </div>
      )}

      {/* NÚT MỞ CHAT */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/20 backdrop-blur-sm text-green-500 p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group"
      >
        {isOpen ? (
          <X className="w-6 h-6 font-bold " />
        ) : (
          <MessageSquare className="w-6 h-6 font-bold" />
        )}
      </button>
    </div>
  );
}
