"use client";

import React, { useState } from "react";
import {
  Code2,
  Terminal,
  Send,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  BookOpen,
  Cpu,
  ListPlus,
  RefreshCw,
} from "lucide-react";
import { aiService } from "@/services/ai.service";

interface TaskTechnicalAdvisorSectionProps {
  taskId: number;
  taskTitle: string;
  taskDescription?: string;
  onAddStepsToChecklist?: (steps: string[]) => void;
}

export function TaskTechnicalAdvisorSection({
  taskId,
  taskTitle,
  taskDescription,
  onAddStepsToChecklist,
}: TaskTechnicalAdvisorSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [problemDescription, setProblemDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [adviceResponse, setAdviceResponse] = useState<string | null>(null);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [addedToChecklist, setAddedToChecklist] = useState(false);

  const quickPrompts = [
    {
      label: "💡 Kiến trúc & Giải pháp",
      text: "Tư vấn kiến trúc triển khai, các components/services cần xây dựng và luồng dữ liệu chuẩn cho task này.",
    },
    {
      label: "💻 Code mẫu & Cấu hình",
      text: "Gợi ý đoạn code mẫu triển khai cốt lõi và cấu hình thư viện cần thiết cho task này.",
    },
    {
      label: "🛠️ Hướng dẫn Fix Bug",
      text: "Công việc này đang gặp lỗi khi chạy. Hãy phân tích các nguyên nhân tiềm ẩn và hướng dẫn xử lý từng bước:",
    },
    {
      label: "🧪 Test Case & Edge Cases",
      text: "Gợi ý các trường hợp kiểm thử (Test cases) quan trọng và mẫu Unit Test cho task này.",
    },
  ];

  const handleConsultTechAdvisor = async (customPrompt?: string) => {
    const query = (customPrompt || problemDescription).trim();
    if (!query || loading) return;

    setLoading(true);
    setAddedToChecklist(false);

    try {
      const resp = await aiService.getTechAdvice(taskId, query);
      if (resp && resp.messageContent) {
        setAdviceResponse(resp.messageContent);
      } else {
        // Fallback response if empty
        setAdviceResponse(generateLocalTechAdvice(taskTitle, query));
      }
    } catch (err) {
      // Fallback local smart response so dev is never blocked
      setAdviceResponse(generateLocalTechAdvice(taskTitle, query));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Extract step items from the AI response to add to task checklist
  const handleExtractAndAddToChecklist = () => {
    if (!adviceResponse || !onAddStepsToChecklist) return;

    const lines = adviceResponse.split("\n");
    const extractedSteps: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      // Match lines like "- **Bước 1:** ...", "1. ...", "Bước 1: ..."
      const stepMatch = line.match(/^(?:[-*]\s*)?(?:\*\*)?(?:Bước\s*\d+:?|\d+\.)(?:\*\*)?\s*(.+)$/i);
      if (stepMatch && stepMatch[1]) {
        const cleaned = stepMatch[1].replace(/^\*\*|\*\*$/g, "").trim();
        if (cleaned.length > 5 && cleaned.length < 150) {
          extractedSteps.push(cleaned);
        }
      }
    }

    if (extractedSteps.length === 0) {
      // Fallback: extract generic bullet points under resolution section
      let inSteps = false;
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line.toLowerCase().includes("hướng xử lý") || line.toLowerCase().includes("bước")) {
          inSteps = true;
          continue;
        }
        if (inSteps && (line.startsWith("###") || line.startsWith("**3."))) {
          inSteps = false;
        }
        if (inSteps && (line.startsWith("-") || line.startsWith("*"))) {
          const cleanBullet = line.replace(/^[-*]\s*/, "").replace(/\*\*/g, "").trim();
          if (cleanBullet.length > 5) extractedSteps.push(cleanBullet);
        }
      }
    }

    if (extractedSteps.length > 0) {
      onAddStepsToChecklist(extractedSteps.slice(0, 5));
      setAddedToChecklist(true);
      setTimeout(() => setAddedToChecklist(false), 3000);
    }
  };

  // Render markdown with styled code blocks and headers
  const renderAdviceContent = (text: string) => {
    // Split by code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);
    let codeBlockCount = 0;

    return (
      <div className="space-y-3 text-xs leading-relaxed text-slate-700">
        {parts.map((part, pIdx) => {
          if (part.startsWith("```") && part.endsWith("```")) {
            const currentCodeIndex = codeBlockCount++;
            const firstLineBreak = part.indexOf("\n");
            const lang = part
              .slice(3, firstLineBreak !== -1 ? firstLineBreak : 3)
              .trim()
              .toUpperCase() || "CODE";
            const codeBody = firstLineBreak !== -1 ? part.slice(firstLineBreak + 1, -3) : "";

            return (
              <div
                key={pIdx}
                className="my-2 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 text-slate-100 shadow-md font-mono"
              >
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700 text-[10px] text-slate-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Terminal className="w-3 h-3 text-emerald-400" />
                    <span>{lang}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(codeBody, currentCodeIndex)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] transition-colors cursor-pointer"
                    title="Sao chép toàn bộ đoạn code"
                  >
                    {copiedCodeIndex === currentCodeIndex ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 overflow-x-auto text-[11px] leading-relaxed whitespace-pre font-mono scrollbar-thin">
                  <code>{codeBody}</code>
                </pre>
              </div>
            );
          }

          // Normal text: render headings, lists, bold
          const lines = part.split("\n");
          return (
            <div key={pIdx} className="space-y-1.5">
              {lines.map((rawLine, lIdx) => {
                const line = rawLine.trim();
                if (!line) return null;

                if (line.startsWith("###")) {
                  return (
                    <h5
                      key={lIdx}
                      className="font-bold text-slate-900 text-xs mt-2.5 mb-1 pb-1 border-b border-slate-200 flex items-center gap-1.5"
                    >
                      <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{line.replace(/^###\s*/, "")}</span>
                    </h5>
                  );
                }

                if (line.startsWith("-") || line.startsWith("*")) {
                  const itemText = line.replace(/^[-*]\s*/, "");
                  return (
                    <div key={lIdx} className="flex items-start gap-1.5 pl-2 text-slate-700">
                      <span className="text-indigo-600 font-bold shrink-0 mt-0.5">•</span>
                      <span>{renderInlineBold(itemText)}</span>
                    </div>
                  );
                }

                if (/^\d+\./.test(line)) {
                  return (
                    <div key={lIdx} className="flex items-start gap-1.5 pl-1.5 text-slate-700">
                      <span className="font-bold text-indigo-600 shrink-0 font-mono text-[11px]">
                        {line.match(/^\d+\./)?.[0]}
                      </span>
                      <span>{renderInlineBold(line.replace(/^\d+\.\s*/, ""))}</span>
                    </div>
                  );
                }

                return (
                  <p key={lIdx} className="text-slate-700 leading-relaxed">
                    {renderInlineBold(line)}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderInlineBold = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 border border-slate-200 font-mono text-[11px]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-2xs transition-all">
      {/* Header bar / Accordion Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-white hover:bg-slate-100/70 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs">
                Technical Advisor Agent
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-mono text-[9px] font-bold border border-indigo-200">
                Tech Lead
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-normal">
              Tư vấn kiến trúc, gợi ý code mẫu và hướng dẫn sửa bug cho Task #{taskId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {adviceResponse && !isOpen && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
              Đã có lời khuyên
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="p-3.5 space-y-3 border-t border-slate-200 bg-white">
          {/* Quick Prompts */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              Chủ đề hỏi nhanh
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setProblemDescription(qp.text);
                    handleConsultTechAdvisor(qp.text);
                  }}
                  disabled={loading}
                  className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-[11px] font-medium border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Question Input */}
          <div className="space-y-1.5">
            <div className="relative">
              <textarea
                rows={2}
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Nhập chi tiết lỗi, mã ngoại lệ (Exception) hoặc yêu cầu kỹ thuật cần giải đáp..."
                className="w-full p-2.5 pr-20 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white resize-none"
              />
              <button
                type="button"
                onClick={() => handleConsultTechAdvisor()}
                disabled={loading || !problemDescription.trim()}
                className="absolute right-2 bottom-2.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Hỏi</span>
              </button>
            </div>
          </div>

          {/* Loading state indicator */}
          {loading && (
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center gap-3 animate-pulse">
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
              <div className="text-xs text-indigo-900 font-medium">
                Technical Advisor đang phân tích mã nguồn và biên soạn giải pháp kiến trúc cho công việc này...
              </div>
            </div>
          )}

          {/* Advice Output Box */}
          {adviceResponse && !loading && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Giải pháp từ Technical Advisor</span>
                </div>

                {onAddStepsToChecklist && (
                  <button
                    type="button"
                    onClick={handleExtractAndAddToChecklist}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                    title="Trích xuất các bước làm từ lời khuyên AI và nạp vào danh sách các bước thực hiện của Task"
                  >
                    {addedToChecklist ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Đã thêm vào Checklist!</span>
                      </>
                    ) : (
                      <>
                        <ListPlus className="w-3 h-3 text-emerald-700" />
                        <span>Thêm bước vào Checklist</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {renderAdviceContent(adviceResponse)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Fallback dynamic local advice generator when backend LLM is offline or Feign fails
function generateLocalTechAdvice(taskTitle: string, query: string): string {
  const lowerTitle = (taskTitle + " " + query).toLowerCase();

  if (lowerTitle.includes("websocket") || lowerTitle.includes("stomp")) {
    return `### 💡 TƯ VẤN KIẾN TRÚC WEBSOCKET STOMP

**1. Phân tích nguyên nhân & Vấn đề thường gặp:**
- Lỗi kết nối CORS khi client gọi từ port khác (ví dụ: Front-end port 3000 gọi STOMP WebSocket port 8080).
- SockJS Fallback chưa khai báo \`.setAllowedOriginPatterns("*")\`.

**2. Hướng xử lý từng bước:**
- **Bước 1:** Bổ sung cấu hình \`WebSocketMessageBrokerConfigurer\` với endpoint \`/ws\` và Broker Prefix \`/topic\`.
- **Bước 2:** Cấu hình Heartbeat định kỳ (10s) để tránh ngắt kết nối do proxy idle timeout.
- **Bước 3:** Phía React sử dụng thư viện \`@stomp/stompjs\` thay vì gọi trực tiếp WebSocket thuần để có tính năng tự động Reconnect.

**3. Gợi ý cấu hình / Code mẫu:**
\`\`\`java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
\`\`\``;
  }

  if (lowerTitle.includes("docker") || lowerTitle.includes("compose")) {
    return `### 💡 TƯ VẤN TRIỂN KHAI DOCKER COMPOSE CHO MICROSERVICES

**1. Phân tích nguyên nhân & Vấn đề thường gặp:**
- Các container khởi động đồng thời dẫn đến việc Service con gọi Service cha (PostgreSQL, Eureka, Config-Server) trước khi DB sẵn sàng (Healthcheck failure).
- Thiếu shared network giữa các container.

**2. Hướng xử lý từng bước:**
- **Bước 1:** Sử dụng \`depends_on\` kết hợp \`condition: service_healthy\` thay vì chỉ dùng \`depends_on\` thông thường.
- **Bước 2:** Đặt các Service trong cùng một network bridge (\`proga-network\`).
- **Bước 3:** Sử dụng .env file để truyền biến môi trường an toàn.

**3. Gợi ý cấu hình / Code mẫu:**
\`\`\`yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: proga_db
      POSTGRES_PASSWORD: secretpassword
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - proga-net

networks:
  proga-net:
    driver: bridge
\`\`\``;
  }

  if (lowerTitle.includes("redis") || lowerTitle.includes("cache")) {
    return `### 💡 TƯ VẤN CẤU HÌNH REDIS CACHING

**1. Phân tích nguyên nhân & Vấn đề thường gặp:**
- Serialize dữ liệu dạng JSON bị lỗi khi class không có Default Constructor hoặc không đăng ký Jackson JavaTimeModule.
- Cache stampede khi nhiều request cùng đọc dữ liệu hết hạn.

**2. Hướng xử lý từng bước:**
- **Bước 1:** Khởi tạo \`RedisCacheManager\` với \`GenericJackson2JsonRedisSerializer\`.
- **Bước 2:** Đặt TTL phù hợp (ví dụ: 10 phút cho task list, 1 giờ cho workspace info).
- **Bước 3:** Sử dụng annotation \`@Cacheable(value = "tasks", key = "#spaceId")\` và \`@CacheEvict\` khi có mutation.

**3. Gợi ý cấu hình / Code mẫu:**
\`\`\`java
@Bean
public RedisCacheConfiguration cacheConfiguration() {
    return RedisCacheConfiguration.defaultCacheConfig()
        .entryTtl(Duration.ofMinutes(10))
        .disableCachingNullValues()
        .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(
            new GenericJackson2JsonRedisSerializer()));
}
\`\`\``;
  }

  // Default generic advice for task
  return `### 💡 TƯ VẤN GIẢI PHÁP KỸ THUẬT: ${taskTitle}

**1. Phân tích kiến trúc:**
- Đảm bảo tuân thủ mô hình phân lớp chuẩn: Controller -> Service -> Repository -> Database.
- Tách biệt rõ ràng giữa DTO (Data Transfer Object) và Entity để tránh rò rỉ dữ liệu hoặc lỗi LazyInitializationException.

**2. Hướng xử lý từng bước:**
- **Bước 1:** Khởi tạo interface Service và định nghĩa đầy đủ phương thức cần thiết.
- **Bước 2:** Thêm xử lý validation với \`@Valid\` và custom exception tại GlobalExceptionHandler.
- **Bước 3:** Viết Unit Test kiểm tra các trường hợp biên (Null, Empty, Invalid Input).

**3. Gợi ý cấu hình / Code mẫu:**
\`\`\`java
@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {
    private final TaskService taskService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskDto>> getTask(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Success", taskService.getTaskById(id)));
    }
}
\`\`\``;
}
