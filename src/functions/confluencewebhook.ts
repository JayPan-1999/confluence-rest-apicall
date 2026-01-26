import {
    app,
    HttpRequest,
    HttpResponseInit,
    InvocationContext,
} from "@azure/functions";
import {
    ConfluenceService,
    ConfluenceWebhookEvent,
} from "../services/confluenceService";

export async function confluencewebhook(
    request: HttpRequest,
    context: InvocationContext,
): Promise<HttpResponseInit> {
    context.log(`Confluence webhook received request for url "${request.url}"`);
    context.log(`Method: ${request.method}`);
    context.log(
        `Headers: ${JSON.stringify(Object.fromEntries(request.headers.entries()))}`,
    );

    try {
        // GET请求用于健康检查或验证
        if (request.method === "GET") {
            return {
                status: 200,
                body: JSON.stringify({
                    message: "Confluence Webhook Service is running",
                    timestamp: new Date().toISOString(),
                    service: "Azure Functions Confluence Integration",
                    supportedMethods: ["GET", "POST", "PUT", "DELETE"],
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            };
        }

        // POST请求处理webhook事件
        if (request.method === "POST") {
            const rawBody = await request.text();
            context.log(`Raw webhook body: ${rawBody}`);

            if (!rawBody) {
                return {
                    status: 400,
                    body: JSON.stringify({ error: "Empty request body" }),
                    headers: { "Content-Type": "application/json" },
                };
            }

            let webhookEvent: ConfluenceWebhookEvent;
            try {
                webhookEvent = JSON.parse(rawBody);
            } catch (parseError) {
                context.log(`JSON parse error: ${parseError}`);
                return {
                    status: 400,
                    body: JSON.stringify({
                        error: "Invalid JSON in request body",
                    }),
                    headers: { "Content-Type": "application/json" },
                };
            }

            context.log(`Webhook event type: ${webhookEvent.eventType}`);
            context.log(`Event details: ${JSON.stringify(webhookEvent)}`);

            // 验证webhook事件结构
            if (!webhookEvent.eventType) {
                return {
                    status: 400,
                    body: JSON.stringify({
                        error: "Missing eventType in webhook data",
                    }),
                    headers: { "Content-Type": "application/json" },
                };
            }

            // 初始化Confluence服务
            let confluenceService: ConfluenceService;
            try {
                confluenceService = new ConfluenceService();
            } catch (configError) {
                context.log(`Configuration error: ${configError}`);
                return {
                    status: 500,
                    body: JSON.stringify({
                        error: "Confluence service configuration error",
                        details:
                            configError instanceof Error
                                ? configError.message
                                : "Unknown error",
                    }),
                    headers: { "Content-Type": "application/json" },
                };
            }

            // 处理webhook事件
            try {
                const result =
                    await confluenceService.handleWebhookEvent(webhookEvent);
                context.log(`Processing result: ${JSON.stringify(result)}`);

                return {
                    status: 200,
                    body: JSON.stringify({
                        message: "Webhook processed successfully",
                        timestamp: new Date().toISOString(),
                        eventType: webhookEvent.eventType,
                        result: result,
                    }),
                    headers: { "Content-Type": "application/json" },
                };
            } catch (processingError) {
                context.log(`Processing error: ${processingError}`);
                return {
                    status: 500,
                    body: JSON.stringify({
                        error: "Error processing webhook event",
                        eventType: webhookEvent.eventType,
                        details:
                            processingError instanceof Error
                                ? processingError.message
                                : "Unknown error",
                    }),
                    headers: { "Content-Type": "application/json" },
                };
            }
        }
        // 不支持的HTTP方法
        return {
            status: 405,
            body: JSON.stringify({
                error: `Method ${request.method} not allowed`,
                supportedMethods: ["GET", "POST", "PUT", "DELETE"],
            }),
            headers: { "Content-Type": "application/json" },
        };
    } catch (error) {
        context.log(`Unexpected error: ${error}`);
        return {
            status: 500,
            body: JSON.stringify({
                error: "Internal server error",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            }),
            headers: { "Content-Type": "application/json" },
        };
    }
}

app.http("confluencewebhook", {
    methods: ["GET", "POST", "PUT", "DELETE"],
    authLevel: "function",
    handler: confluencewebhook,
});
