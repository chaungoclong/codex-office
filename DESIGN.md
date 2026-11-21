# MASTER PROMPT — CODEX AGENT OFFICE

## 1. Vai trò và mục tiêu

Bạn là Senior Software Architect, Full-stack Developer và AI Agent Engineer.

Hãy thiết kế, xây dựng và kiểm thử hoàn chỉnh một ứng dụng có tên **Codex Agent Office**.

Đây là ứng dụng quản lý AI agent theo mô hình công ty ảo, lấy cảm hứng từ OpenCode và giao diện văn phòng 2D.

Ứng dụng phải cho phép người dùng tổ chức các Codex agent thành phòng ban, giao nhiệm vụ, theo dõi hoạt động và điều phối nhiều agent làm việc song song trên các dự án phần mềm.

Yêu cầu bắt buộc:

- Chạy hoàn toàn trên máy local về mặt lưu trữ và điều phối.
- Sử dụng Codex CLI và Codex App Server làm agent engine.
- Không sử dụng Codex Cloud.
- Tận dụng cơ chế xác thực Codex hiện có.
- Không yêu cầu API key riêng nếu Codex đã đăng nhập hợp lệ.
- Không sử dụng dữ liệu giả để thay thế chức năng thực tế.
- Không sửa mã nguồn Codex CLI.
- Xây dựng ứng dụng độc lập, có khả năng mở rộng.

## 2. Technology Stack

Sử dụng kiến trúc monorepo TypeScript.

Frontend:

- React.
- Vite.
- TypeScript.
- Tailwind CSS.
- Zustand.
- TanStack Query.
- React Flow cho sơ đồ tổ chức.
- PixiJS cho giao diện văn phòng 2D.
- Lucide Icons.
- xterm.js cho terminal và log.

Backend:

- Node.js.
- Fastify.
- TypeScript.
- WebSocket.
- SQLite.
- Drizzle ORM.
- Zod.

Testing:

- Vitest.
- Playwright.
- Integration tests cho Codex App Server.

Package manager: pnpm workspace.

Ưu tiên các phiên bản stable tương thích với nhau.

## 3. Kiến trúc hệ thống

Xây dựng các module độc lập:

- Office UI.
- Project Management.
- Agent Management.
- Department Management.
- Task Management.
- Workflow Engine.
- Agent Orchestrator.
- Codex App Server Adapter.
- Approval Manager.
- Event Bus.
- Session Manager.
- Git Worktree Manager.
- Local Database.
- Audit Logger.

Frontend giao tiếp với backend qua REST API và WebSocket.

Backend giao tiếp với Codex App Server bằng JSON-RPC qua stdio.

Không phụ thuộc vào công cụ nội bộ `codex_tui.create_thread` nếu công cụ đó không phải public API ổn định.

Sử dụng tài liệu Codex App Server chính thức:

https://developers.openai.com/codex/app-server

Sử dụng tài liệu multi-agent:

https://developers.openai.com/codex/multi-agent

Đọc tài liệu và xác minh với phiên bản Codex CLI thực tế trước khi triển khai protocol.

## 4. Cấu trúc thư mục

Thiết kế monorepo:

- apps/web
- apps/server
- packages/codex-adapter
- packages/orchestrator
- packages/workflow-engine
- packages/shared
- packages/database
- packages/ui
- config
- docs
- scripts
- tests

Tạo các tài liệu quản lý phát triển:

- AGENTS.md
- README.md
- PLAN.md
- ARCHITECTURE.md
- SECURITY.md
- TASKS.md
- tasks/

Mỗi feature quan trọng phải có task riêng trong thư mục tasks.

## 5. Tích hợp Codex App Server

Triển khai một Codex Adapter chịu trách nhiệm:

- Kiểm tra Codex đã được cài đặt chưa.
- Kiểm tra phiên bản.
- Kiểm tra trạng thái đăng nhập.
- Khởi tạo Codex App Server.
- Thực hiện JSON-RPC handshake.
- Tạo thread.
- Resume thread.
- Liệt kê thread.
- Gửi prompt.
- Theo dõi streaming response.
- Nhận sự kiện thực thi tool.
- Nhận log.
- Nhận trạng thái agent.
- Dừng agent.
- Xử lý approval request.
- Khôi phục kết nối khi App Server gặp lỗi.

Hỗ trợ các phương thức đã được xác minh như:

- initialize
- initialized
- thread/start
- thread/resume
- thread/list
- turn/start
- turn/steer
- turn/interrupt

Không tự suy đoán tên phương thức hoặc schema chưa được xác minh.

Mỗi agent phải được liên kết với threadId thực tế.

Lưu threadId vào SQLite để có thể khôi phục phiên làm việc sau khi restart ứng dụng.

Phân biệt rõ independent thread và native subagent. Không giả định hai khái niệm này giống nhau.

## 6. Mô hình công ty ảo

Tạo các phòng ban mặc định:

### Management Department

Project Manager:

- Phân tích yêu cầu người dùng.
- Chia nhỏ công việc.
- Lập kế hoạch.
- Phân công task.
- Theo dõi tiến độ.
- Điều phối các agent.
- Tổng hợp kết quả.

### Business Analysis Department

Business Analyst:

- Phân tích nghiệp vụ.
- Viết requirement.
- Viết acceptance criteria.
- Phát hiện yêu cầu chưa rõ ràng.
- Chuẩn bị task cho Architect.

### Architecture Department

Software Architect:

- Phân tích kiến trúc.
- Thiết kế module.
- Thiết kế database.
- Thiết kế API.
- Kiểm tra dependency.
- Đề xuất giải pháp kỹ thuật.

### Development Department

Backend Developer:

- Implement backend.
- Xử lý database.
- Xây dựng API.
- Sửa lỗi backend.

Frontend Developer:

- Implement UI.
- Xây dựng component.
- Tích hợp API.
- Sửa lỗi frontend.

Full-stack Developer:

- Xử lý task đa nền tảng khi được chỉ định.

### Quality Assurance Department

Tester:

- Đọc acceptance criteria.
- Viết test.
- Chạy test.
- Báo cáo lỗi.
- Không tự sửa implementation nếu không được giao.

### Code Review Department

Reviewer:

- Review source code.
- Kiểm tra logic.
- Kiểm tra coding convention.
- Phát hiện regression.
- Kiểm tra test coverage.

### Security Department

Security Engineer:

- Phân tích lỗ hổng.
- Kiểm tra authentication.
- Kiểm tra permission.
- Kiểm tra dependency.
- Kiểm tra secrets.

### DevOps Department

DevOps Engineer:

- Docker.
- Docker Compose.
- Build.
- CI/CD.
- Deployment configuration.
- Environment configuration.

Cho phép người dùng tạo, sửa và xóa phòng ban hoặc agent tùy chỉnh.

## 7. Agent Configuration

Mỗi agent có:

- ID.
- Tên.
- Avatar.
- Phòng ban.
- Vai trò.
- Description.
- System instructions.
- Model.
- Reasoning effort.
- Working directory.
- Thread ID.
- Permission profile.
- Trạng thái.
- Task hiện tại.
- Danh sách tool được phép.
- Giới hạn thời gian chạy.
- Retry policy.
- Concurrency policy.

Hỗ trợ import custom agent từ:

- ~/.codex/agents/
- .codex/agents/

Không chỉnh sửa cấu hình Codex toàn cục nếu chưa được người dùng phê duyệt.

## 8. Agent Lifecycle

Thiết kế state machine với các trạng thái:

- offline
- idle
- starting
- planning
- working
- running_tool
- waiting_approval
- waiting_dependency
- testing
- reviewing
- paused
- completed
- failed
- stopped

Agent status phải phản ánh event thực tế từ Codex.

Không sử dụng timer giả để mô phỏng tiến độ.

Cho phép:

- Start.
- Stop.
- Pause khi được hỗ trợ.
- Resume.
- Restart thread.
- Gửi chỉ dẫn bổ sung.
- Mở lịch sử hội thoại.
- Xem chi tiết tool call.
- Xem file đã thay đổi.

## 9. Virtual Office UI

Tạo giao diện văn phòng 2D dạng top-down, phong cách pixel art hiện đại.

Sử dụng PixiJS để render.

Giao diện gồm:

- Phòng Project Manager.
- Phòng Business Analysis.
- Phòng Architecture.
- Phòng Development.
- Phòng Testing.
- Phòng Security.
- Phòng DevOps.
- Phòng họp.
- Khu vực idle.

Mỗi agent là một nhân vật có avatar riêng.

Animation:

- Idle: đứng hoặc ngồi nghỉ.
- Working: gõ bàn phím.
- Planning: đọc tài liệu.
- Running tool: tương tác máy tính.
- Waiting approval: hiển thị biểu tượng cảnh báo.
- Testing: tương tác màn hình kiểm thử.
- Completed: hiển thị dấu hoàn thành.
- Failed: hiển thị cảnh báo lỗi.

Animation chỉ phản ánh trạng thái thực tế, không ảnh hưởng logic công việc.

Khi click vào agent, mở panel hiển thị:

- Tên và vai trò.
- Trạng thái.
- Task hiện tại.
- Model.
- Thread ID.
- Thời gian chạy.
- Chat history.
- Tool calls.
- Logs.
- Files changed.
- Approval requests.

Hỗ trợ chuyển đổi giữa Office View và List View.

## 10. Dashboard

Xây dựng các màn hình:

### Overview

- Tổng số dự án.
- Tổng số agent.
- Agent đang chạy.
- Agent đang chờ approval.
- Task đang xử lý.
- Task thất bại.
- Task hoàn thành.

### Office

- Bản đồ văn phòng 2D.
- Agent hoạt động realtime.
- Phòng ban.
- Task hiện tại của từng agent.

### Organization

- Sơ đồ tổ chức bằng React Flow.
- Quan hệ giữa phòng ban.
- Quan hệ quản lý giữa agent.
- Quan hệ dependency.

### Projects

- Thêm dự án local.
- Chọn thư mục project.
- Import repository.
- Chọn branch.
- Xem git status.
- Xem AGENTS.md.
- Xem PLAN.md.
- Xem danh sách task.

### Agents

- Danh sách agent.
- Editor cấu hình agent.
- Chi tiết thread.
- Lịch sử phiên làm việc.
- Các nút điều khiển.

### Tasks

- Kanban board.
- Task list.
- Dependency graph.
- Task detail.
- Acceptance criteria.
- Agent được phân công.
- Execution history.

### Approvals

- Pending approvals.
- Command cần thực thi.
- Agent yêu cầu.
- Working directory.
- Lý do yêu cầu.
- Approve.
- Reject.

### Activity

- Realtime event stream.
- Agent activity.
- Tool execution.
- Error log.
- Workflow transition.

### Settings

- Codex configuration.
- Default model.
- Maximum concurrent agents.
- Default permission profile.
- Theme.
- Database settings.
- Project configuration.

Hỗ trợ dark mode và light mode.

## 11. Task Management

Task phải có:

- ID.
- Title.
- Description.
- Project ID.
- Priority.
- Status.
- Assigned agent.
- Department.
- Dependencies.
- Acceptance criteria.
- Self-test requirements.
- Result.
- Test report.
- Review report.
- Created at.
- Updated at.

Workflow mặc định:

pending → analyzing → planning → in_progress → ready_for_test → testing → ready_for_review → reviewing → done.

Nếu test thất bại:

testing → in_progress.

Nếu review thất bại:

reviewing → in_progress.

Nếu có lỗi không thể tự giải quyết:

→ blocked.

Chỉ cho phép chuyển trạng thái khi đáp ứng điều kiện của bước trước.

Coder không được tự đánh dấu task là done.

Task chỉ được đánh dấu done khi:

- Acceptance criteria hoàn thành.
- Self-test pass.
- Tester xác nhận pass.
- Reviewer xác nhận pass.
- Không còn lỗi blocking.

## 12. Hỗ trợ hệ thống Markdown Task hiện có

Ứng dụng phải có khả năng import dự án sử dụng:

- agents.md hoặc AGENTS.md
- plan.md hoặc PLAN.md
- tasks/001-*.md
- tasks/002-*.md
- tasks/003-*.md

Đọc cấu trúc file thực tế thay vì giả định định dạng.

Cho phép:

- Import task Markdown vào database.
- Phát hiện thay đổi file.
- Đồng bộ task status.
- Giao task cho agent.
- Ghi kết quả thực hiện vào file task.
- Ghi test report.
- Ghi review report.

Giữ nguyên các phần nội dung Markdown không thuộc phạm vi cập nhật.

Database và Markdown phải có cơ chế giải quyết xung đột, tránh ghi đè thay đổi của người dùng.

## 13. Multi-agent Orchestration

Xây dựng Agent Orchestrator có khả năng:

- Phân chia nhiệm vụ.
- Chọn agent theo role.
- Kiểm tra dependency.
- Tạo hàng đợi task.
- Chạy nhiều task song song.
- Giới hạn concurrency.
- Kiểm tra agent availability.
- Chuyển task giữa các phòng ban.
- Retry lỗi tạm thời với backoff.
- Tạm dừng workflow khi cần approval.
- Tự động tiếp tục sau approval hợp lệ.

Mặc định tối đa 4 agent chạy đồng thời; cho phép người dùng cấu hình.

Hỗ trợ hai chế độ:

**Manual Mode:** Người dùng giao từng task và phê duyệt từng bước.

**Orchestrated Mode:** Project Manager tự điều phối trong phạm vi workflow được người dùng cho phép.

Không cho phép workflow tự động thực hiện deployment, push code hoặc tác vụ phá hủy dữ liệu khi chưa được phê duyệt.

## 14. Git Worktree Isolation

Hỗ trợ hai chế độ làm việc:

- Shared working directory.
- Isolated Git worktree.

Khuyến nghị Git worktree cho các task thay đổi code song song.

Mỗi task có thể được cấp một branch và worktree riêng.

Ví dụ:

- agent/001-coder
- agent/002-backend
- agent/003-frontend

Không cho phép nhiều agent sửa cùng một phạm vi file mà không có cơ chế khóa hoặc điều phối.

Không tự động merge nếu có conflict.

Hiển thị diff, branch và worktree cho người dùng.

## 15. Approval và Security

Ứng dụng phải xử lý đúng approval request của Codex.

Khi agent cần lệnh như Docker, network access, truy cập ngoài workspace hoặc thao tác nhạy cảm, hiển thị yêu cầu phê duyệt.

Không tự động bypass sandbox.

Không sử dụng quyền truy cập toàn hệ thống mặc định.

Yêu cầu:

- Backend chỉ listen localhost mặc định.
- Kiểm tra Origin cho HTTP và WebSocket.
- Sử dụng local authentication token.
- Validate mọi API input.
- Chống path traversal.
- Không expose secrets.
- Không lưu auth.json hoặc access token của Codex vào database.
- Không gửi source code hoặc log tới hệ thống telemetry bên thứ ba.
- Không thực hiện cloud delegation.
- Có audit log cho approval và thay đổi trạng thái.

Giải thích rõ rằng model inference vẫn được xử lý bởi OpenAI.

## 16. Database Design

Thiết kế các bảng tối thiểu:

- projects
- departments
- agents
- agent_sessions
- tasks
- task_dependencies
- task_assignments
- workflows
- workflow_runs
- workflow_steps
- approval_requests
- agent_events
- audit_logs
- test_reports
- review_reports
- settings

Tạo migrations, foreign keys và indexes phù hợp.

Dữ liệu phải được lưu local.

Không mất task hoặc thread mapping khi restart ứng dụng.

## 17. Real-time Event System

Thiết kế event bus nội bộ.

Các domain event tối thiểu:

- agent.started
- agent.idle
- agent.working
- agent.failed
- agent.completed
- agent.message
- agent.tool.started
- agent.tool.completed
- task.assigned
- task.status_changed
- approval.requested
- approval.resolved
- workflow.started
- workflow.completed

Đây là domain event của ứng dụng, không phải tên event mặc định của Codex API.

Adapter chịu trách nhiệm chuyển event Codex thực tế thành domain event tương ứng.

Sử dụng event ID và timestamp để xử lý duplicate, reconnect và resume.

## 18. Testing Requirements

Viết test cho:

- JSON-RPC adapter.
- Event parsing.
- Agent state machine.
- Task state machine.
- Task dependency.
- Workflow orchestration.
- Concurrent agent limit.
- Approval handling.
- Git worktree.
- Markdown synchronization.
- Database persistence.
- WebSocket reconnect.
- Security validation.

Tạo mock App Server dành riêng cho automated test.

Không dùng mock server thay thế production integration.

Thực hiện smoke test với Codex CLI thực tế khi môi trường và tài khoản cho phép.

Nếu chưa thể kiểm thử integration vì thiếu Codex, authentication hoặc permission, ghi rõ giới hạn và không tuyên bố integration đã pass.

## 19. Kế hoạch triển khai

Chia quá trình thành các phase.

**Phase 1 — Foundation:** Khởi tạo monorepo, database, backend, frontend và documentation.

**Phase 2 — Codex Integration:** JSON-RPC adapter, tạo thread, gửi prompt, streaming và approvals.

**Phase 3 — Agent Management:** Department, agent configuration và lifecycle.

**Phase 4 — Task Management:** Task database, Kanban, Markdown import và state machine.

**Phase 5 — Multi-agent Orchestration:** Workflow engine, PM agent, dependencies và concurrency.

**Phase 6 — Virtual Office:** Office 2D, animation, agent inspector và realtime dashboard.

**Phase 7 — Quality and Security:** Worktree isolation, security hardening, integration test và E2E test.

**Phase 8 — Packaging:** Build production, startup scripts, installation guide và troubleshooting.

Ưu tiên hoàn thành vertical slice thực tế ở Phase 2 trước khi triển khai toàn bộ giao diện.

## 20. Quy tắc làm việc

- Đọc repository trước khi sửa.
- Kiểm tra environment, Codex version và các dependency.
- Viết PLAN.md và ARCHITECTURE.md trước khi triển khai.
- Tạo task Markdown cho từng feature.
- Sử dụng native multi-agent khi có thể.
- Phân công Architect, Coder, Tester và Reviewer độc lập.
- Không để nhiều agent sửa cùng một file đồng thời.
- Không xóa hoặc ghi đè file người dùng ngoài phạm vi task.
- Không sử dụng dependency thiếu lý do.
- Không bỏ qua lỗi build hoặc test.
- Không đánh dấu task done khi chưa đủ điều kiện.
- Không dùng hardcode giả để chứng minh feature hoạt động.
- Cập nhật tiến độ sau mỗi phase.
- Tiếp tục triển khai các phase khi không có blocker thực sự.
- Chỉ hỏi người dùng khi cần quyết định quan trọng hoặc phê duyệt quyền.

## 21. Definition of Done

Ứng dụng được xem là hoàn thành khi người dùng có thể:

1. Cài đặt và chạy ứng dụng local.
2. Kết nối Codex App Server thực tế.
3. Thêm một dự án local.
4. Tạo phòng ban và agent.
5. Import task Markdown.
6. Giao task cho agent.
7. Quan sát agent làm việc realtime.
8. Chat trực tiếp với agent.
9. Phê duyệt hoặc từ chối command.
10. Chạy nhiều agent song song.
11. Chuyển task từ Coder sang Tester và Reviewer.
12. Xem source code diff và execution history.
13. Restart ứng dụng và khôi phục thread mapping, task và workflow.
14. Sử dụng ứng dụng mà không cần Codex Cloud.

## 22. Bắt đầu ngay

Hãy kiểm tra môi trường hiện tại, xác minh Codex App Server protocol, đề xuất kiến trúc và tạo kế hoạch triển khai chi tiết.

Sau đó hãy trực tiếp tạo các file cần thiết, viết source code, chạy build và test.

Không dừng lại ở việc giải thích kiến trúc hoặc tạo mockup.

Mục tiêu cuối cùng là một ứng dụng Codex Agent Office có thể chạy và điều phối Codex agent thực tế trên máy local.
