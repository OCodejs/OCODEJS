export const PLUGIN_CATALOG = [
  {id:"skill-code-review",name:"Code Review Assistant",type:"Skills",icon:"⌘",tagline:"Checklist và quy trình review thay đổi mã nguồn.",description:"Skill mẫu hướng dẫn agent đọc diff, kiểm tra lỗi logic, rủi ro bảo mật, khả năng bảo trì và viết nhận xét có dẫn chứng.",tags:["Code quality","Review","Git"],version:"Sample",command:"npx skills add <owner/repo>",steps:["Xác định repository nguồn và kiểm tra tác giả.","Đọc SKILL.md cùng mọi script đi kèm.","Cài vào agent hỗ trợ Skills theo hướng dẫn của nguồn."],note:"Tên và lệnh minh họa; thay bằng repository đã được xác minh."},
  {id:"skill-frontend",name:"Frontend Design Workflow",type:"Skills",icon:"✳",tagline:"Quy trình thiết kế giao diện responsive và accessible.",description:"Skill mẫu cho các tác vụ lập kế hoạch UI, thiết kế component, responsive layout và kiểm tra accessibility.",tags:["Frontend","UI/UX","Accessibility"],version:"Sample",command:"npx skills add <owner/repo>",steps:["Kiểm tra nền tảng agent có hỗ trợ Skills.","Xem nội dung hướng dẫn và script trước khi cài.","Thêm skill theo lệnh chính thức của repository."],note:"Không đại diện cho một package đã được kiểm thử hoặc phát hành."},
  {id:"skill-testing",name:"Testing & TDD Coach",type:"Skills",icon:"✓",tagline:"Lập kế hoạch test, viết test trước và kiểm tra edge cases.",description:"Skill mẫu giúp agent đề xuất test cases, tái hiện lỗi, áp dụng TDD và rà soát độ bao phủ.",tags:["Testing","TDD","Quality"],version:"Sample",command:"npx skills add <owner/repo>",steps:["Xác minh repo và giấy phép.","Đọc hướng dẫn cài đặt dành cho agent của bạn.","Chạy thử trong nhánh riêng và review thay đổi."],note:"Cần thay placeholder bằng nguồn chính thức."},
  {id:"mcp-browser",name:"Browser Automation MCP",type:"MCP",icon:"◎",tagline:"Cung cấp browser tools cho workflow tự động hóa.",description:"Mẫu tích hợp MCP server cho các thao tác trình duyệt có kiểm soát như điều hướng, đọc trang và thao tác form.",tags:["Browser","Automation","MCP"],version:"Blueprint",command:"Add the verified MCP server command to your client configuration.",steps:["Chọn MCP server và xác minh publisher.","Đọc danh sách tools, quyền truy cập và network behavior.","Thêm cấu hình server vào client MCP; không chia sẻ secrets trong file công khai."],note:"Chưa kết nối server thật trong bản preview này."},
  {id:"mcp-github",name:"GitHub Workflow MCP",type:"MCP",icon:"⑂",tagline:"Kết nối issue, pull request và quy trình repository.",description:"Blueprint MCP cho phép agent làm việc với GitHub theo quyền tối thiểu, có thể giới hạn theo repository.",tags:["GitHub","Developer tools","MCP"],version:"Blueprint",command:"Configure a trusted GitHub MCP server with least-privilege access.",steps:["Xác minh mã nguồn server và quyền OAuth/PAT cần thiết.","Chỉ cấp quyền trên repository cần thao tác.","Kiểm tra thao tác ghi trước khi cho phép chạy tự động."],note:"Không tự động cấp quyền hoặc tạo token."},
  {id:"integration-openai",name:"ChatGPT & Codex Connector",type:"Integration",icon:"◈",tagline:"Khung tích hợp tool, Skills và MCP cho agent.",description:"Mẫu kiến trúc để lập kế hoạch use case, định nghĩa tools, xác thực, bảo vệ dữ liệu và kiểm thử workflow.",tags:["ChatGPT","Codex","API"],version:"Guide",command:"See docs/OPENAI-PLUGIN-DEVELOPMENT.md",steps:["Mô tả use case và dữ liệu cần truy cập.","Thiết kế tool schema và xác thực phía server.","Kiểm thử quyền, lỗi, privacy và giao diện tùy chọn."],note:"Đây là hướng dẫn kiến trúc, không phải plugin cài một chạm."},
  {id:"template-mcp",name:"MCP Server Starter",type:"Template",icon:"⌘",tagline:"Bộ khung khởi tạo MCP server có cấu trúc rõ ràng.",description:"Template tham khảo cho manifest, tool definitions, input validation, error handling và hướng dẫn chạy local.",tags:["Starter","TypeScript","MCP"],version:"Template",command:"Create a server project from a reviewed starter repository.",steps:["Chọn SDK MCP chính thức phù hợp runtime.","Tạo tool schema rõ ràng và validate mọi input.","Viết test cho success, failure và quyền truy cập."],note:"Chưa có template repository được liên kết trong catalog."},
  {id:"template-plugin",name:"Plugin Manifest Template",type:"Template",icon:"▤",tagline:"Mẫu metadata và tài liệu cho catalog plugin.",description:"Template dữ liệu để mô tả tên, phiên bản, publisher, quyền, nền tảng hỗ trợ, hướng dẫn và changelog.",tags:["Manifest","Registry","Docs"],version:"Template",command:"Create a manifest using the schema agreed by your plugin registry.",steps:["Chuẩn hóa schema manifest và versioning.","Bắt buộc publisher, source URL, permissions và compatibility.","Xác thực manifest trong CI trước khi publish."],note:"Schema manifest chính thức cần được thiết kế cùng backend registry."}
 ];

export function filterPlugins(plugins, { query = "", category = "all", installed = new Set(), sort = "featured" } = {}) {
  const needle = String(query).trim().toLowerCase();
  const result = plugins.filter((plugin) => {
    const matchesCategory = category === "all" || category === "installed" || plugin.type === category;
    const matchesInstalled = category !== "installed" || installed.has(plugin.id);
    const searchable = [plugin.name, plugin.type, plugin.tagline, plugin.description, ...(plugin.tags ?? [])].join(" ").toLowerCase();
    return matchesCategory && matchesInstalled && (!needle || searchable.includes(needle));
  });

  if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "type") result.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  return result;
}

export function readInstalled(storage, key, validIds = []) {
  try {
    if (!storage) throw new Error("Browser storage is unavailable.");
    const parsed = JSON.parse(storage.getItem(key) || "[]");
    if (!Array.isArray(parsed)) throw new Error("Saved plugin selection is invalid.");
    const allowed = new Set(validIds);
    return { installed: new Set(parsed.filter((id) => typeof id === "string" && allowed.has(id))), ok: true, error: null };
  } catch (error) {
    return { installed: new Set(), ok: false, error };
  }
}

export function writeInstalled(storage, key, ids) {
  try {
    if (!storage) throw new Error("Browser storage is unavailable.");
    storage.setItem(key, JSON.stringify([...ids]));
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error };
  }
}

export function toggleSelection(current, id) {
  const next = new Set(current);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}
