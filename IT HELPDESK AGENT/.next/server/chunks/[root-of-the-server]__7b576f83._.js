module.exports = [
"[project]/.next-internal/server/app/api/chat/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/lyzr-api.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Lyzr Agent API Configuration
__turbopack_context__.s([
    "LYZR_CONFIG",
    ()=>LYZR_CONFIG,
    "generateMessageId",
    ()=>generateMessageId,
    "generateSessionId",
    ()=>generateSessionId
]);
const LYZR_CONFIG = {
    endpoint: "https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
    apiKey: "sk-default-eE6EHcdIhXl61H4mK4YKZFqISTGrruf1",
    agentId: "692fd2f06b01be7c2f9f8b73",
    defaultUserId: "suyash@lyzr.ai"
};
function generateSessionId(agentId) {
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `${agentId}-${randomPart}`;
}
function generateMessageId() {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
}),
"[project]/src/app/api/chat/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$lyzr$2d$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/lyzr-api.ts [app-route] (ecmascript)");
;
;
async function POST(request) {
    try {
        const body = await request.json();
        const { message, session_id, user_id } = body;
        if (!message) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Message is required"
            }, {
                status: 400
            });
        }
        const response = await fetch(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$lyzr$2d$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LYZR_CONFIG"].endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$lyzr$2d$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LYZR_CONFIG"].apiKey
            },
            body: JSON.stringify({
                user_id: user_id || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$lyzr$2d$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LYZR_CONFIG"].defaultUserId,
                agent_id: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$lyzr$2d$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LYZR_CONFIG"].agentId,
                session_id: session_id,
                message: message
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Lyzr API error:", errorText);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Failed to get response from AI agent"
            }, {
                status: response.status
            });
        }
        const data = await response.json();
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(data);
    } catch (error) {
        console.error("Chat API error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Internal server error"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__7b576f83._.js.map