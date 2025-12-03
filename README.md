# Confluence Webhook Service

这是一个基于Azure Functions的Confluence webhook集成服务，支持处理Confluence事件并自动执行相应的操作。

## 功能特性

- 📝 处理Confluence webhook事件（页面创建、更新、发布、删除）
- 🔄 支持多种HTTP方法（GET、POST、PUT、DELETE）
- 🏷️ 自动添加页面标签和评论
- 📊 批量处理页面操作
- 🔒 支持Confluence API Token认证

## 环境配置

在 `local.settings.json` 中配置以下环境变量：

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "your-storage-connection-string",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "CONFLUENCE_BASE_URL": "https://your-domain.atlassian.net",
    "CONFLUENCE_USERNAME": "your-email@example.com",
    "CONFLUENCE_API_TOKEN": "your-api-token"
  }
}
```

### 获取Confluence API Token

1. 登录到 [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. 点击 "Create API token"
3. 输入标签名称并创建
4. 复制生成的token到配置中

## API接口

### 1. GET - 健康检查
```
GET /api/confluencewebhook
```
返回服务状态和支持的HTTP方法。

### 2. POST - Webhook事件处理
```
POST /api/confluencewebhook
Content-Type: application/json

{
  "eventType": "page_created",
  "user": {
    "displayName": "用户名",
    "userKey": "user-key",
    "email": "user@example.com"
  },
  "page": {
    "id": "123456",
    "title": "页面标题",
    "status": "current",
    "space": {
      "key": "SPACE",
      "name": "空间名称"
    },
    "version": {
      "number": 1
    }
  },
  "timestamp": 1634567890000
}
```

支持的事件类型：
- `page_created` - 页面创建
- `page_updated` - 页面更新
- `page_published` - 页面发布
- `page_removed` - 页面删除

### 3. PUT - 页面操作
```
PUT /api/confluencewebhook
Content-Type: application/json

{
  "pageId": "123456",
  "operation": "addLabel",
  "labelName": "important"
}
```

支持的操作：
- `updateStatus` - 更新页面状态（需要 `status` 参数）
- `addLabel` - 添加标签（需要 `labelName` 参数）
- `addComment` - 添加评论（需要 `comment` 参数）

### 4. DELETE - 删除相关操作
```
DELETE /api/confluencewebhook?pageId=123456&operation=getInfo
```

支持的操作：
- `getInfo` - 获取页面信息（删除前确认）
- `addDeletedLabel` - 标记页面为删除状态

## 部署

### 本地开发
```bash
# 安装依赖
npm install

# 启动本地开发服务器
npm start
```

### Azure部署
1. 创建Azure Function App
2. 配置环境变量
3. 部署代码到Azure

## Confluence Webhook配置

在Confluence中配置webhook：

1. 进入空间或全局设置
2. 选择 "Webhooks"
3. 添加新的webhook
4. 设置URL为您的Azure Function URL
5. 选择要监听的事件

## 示例使用场景

### 1. 页面创建时自动添加标签
当有新页面创建时，webhook会自动：
- 添加 "auto-processed" 标签
- 添加处理时间评论

### 2. 页面发布时的通知
当页面发布时，webhook会：
- 添加 "published" 标签
- 添加发布时间评论

### 3. 批量页面管理
使用PUT请求可以批量处理多个页面：
- 批量添加标签
- 批量添加评论
- 批量更新状态

## 错误处理

服务包含完整的错误处理机制：
- HTTP状态码返回
- 详细错误信息
- 日志记录（在Azure Function Logs中查看）

## 安全考虑

- 使用API Token而非密码认证
- 可以配置authLevel为'function'以增加安全性
- 建议在生产环境中启用HTTPS
- 考虑添加webhook签名验证

## 监控和日志

- Azure Function提供内置监控
- 所有操作都会记录到Application Insights
- 可以设置告警和通知

## 扩展功能

服务架构支持轻松扩展：
- 添加新的webhook事件类型
- 集成其他Atlassian产品（Jira等）
- 连接到其他Azure服务（Logic Apps、Storage等）
