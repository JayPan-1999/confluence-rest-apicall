# Confluence Webhook 测试示例

这个文件包含了测试Confluence webhook服务的示例请求。

## 测试工具

推荐使用以下工具进行测试：
- **VS Code REST Client Extension**
- **Postman**
- **curl命令**

## 测试请求示例

### 1. 健康检查 (GET)
```http
GET http://localhost:7071/api/confluencewebhook
```

### 2. 模拟页面创建事件 (POST)
```http
POST http://localhost:7071/api/confluencewebhook
Content-Type: application/json

{
  "eventType": "page_created",
  "user": {
    "displayName": "测试用户",
    "userKey": "test-user-key",
    "email": "test@example.com"
  },
  "page": {
    "id": "123456789",
    "title": "测试页面标题",
    "status": "current",
    "space": {
      "key": "TEST",
      "name": "测试空间"
    },
    "version": {
      "number": 1
    }
  },
  "timestamp": 1700000000000
}
```

### 3. 模拟页面发布事件 (POST)
```http
POST http://localhost:7071/api/confluencewebhook
Content-Type: application/json

{
  "eventType": "page_published",
  "user": {
    "displayName": "发布用户",
    "userKey": "publisher-key",
    "email": "publisher@example.com"
  },
  "page": {
    "id": "987654321",
    "title": "已发布页面",
    "status": "current",
    "space": {
      "key": "PROD",
      "name": "生产空间"
    },
    "version": {
      "number": 2
    }
  },
  "timestamp": 1700001000000
}
```

### 4. 添加页面标签 (PUT)
```http
PUT http://localhost:7071/api/confluencewebhook
Content-Type: application/json

{
  "pageId": "123456789",
  "operation": "addLabel",
  "labelName": "urgent"
}
```

### 5. 添加页面评论 (PUT)
```http
PUT http://localhost:7071/api/confluencewebhook
Content-Type: application/json

{
  "pageId": "123456789",
  "operation": "addComment",
  "comment": "这是一个自动添加的测试评论"
}
```

### 6. 更新页面状态 (PUT)
```http
PUT http://localhost:7071/api/confluencewebhook
Content-Type: application/json

{
  "pageId": "123456789",
  "operation": "updateStatus",
  "status": "draft"
}
```

### 7. 获取页面信息 (DELETE)
```http
DELETE http://localhost:7071/api/confluencewebhook?pageId=123456789&operation=getInfo
```

### 8. 标记页面为删除 (DELETE)
```http
DELETE http://localhost:7071/api/confluencewebhook?pageId=123456789&operation=addDeletedLabel
```

## curl 命令示例

### 健康检查
```bash
curl -X GET http://localhost:7071/api/confluencewebhook
```

### 模拟webhook事件
```bash
curl -X POST http://localhost:7071/api/confluencewebhook \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "page_created",
    "user": {
      "displayName": "测试用户",
      "userKey": "test-user",
      "email": "test@example.com"
    },
    "page": {
      "id": "123456",
      "title": "测试页面",
      "status": "current",
      "space": {
        "key": "TEST",
        "name": "测试空间"
      },
      "version": {
        "number": 1
      }
    },
    "timestamp": 1700000000000
  }'
```

### 添加标签
```bash
curl -X PUT http://localhost:7071/api/confluencewebhook \
  -H "Content-Type: application/json" \
  -d '{
    "pageId": "123456",
    "operation": "addLabel",
    "labelName": "test-label"
  }'
```

## 期望响应格式

### 成功响应示例
```json
{
  "message": "Webhook processed successfully",
  "timestamp": "2024-11-25T10:30:00.000Z",
  "eventType": "page_created",
  "result": {
    "success": true,
    "eventType": "page_created",
    "pageId": "123456789",
    "pageTitle": "测试页面标题",
    "result": {
      // Confluence API 返回的数据
    }
  }
}
```

### 错误响应示例
```json
{
  "error": "Error processing webhook event",
  "eventType": "page_created",
  "details": "Confluence service configuration error"
}
```

## 测试注意事项

1. **本地测试**: 确保已启动本地Azure Functions服务
2. **环境配置**: 确保`local.settings.json`中的Confluence配置正确
3. **页面ID**: 使用实际存在的Confluence页面ID进行测试
4. **权限**: 确保API Token有足够的权限执行相应操作
5. **网络**: 确保能够访问Confluence实例

## 调试建议

1. 查看Azure Functions本地日志输出
2. 检查Confluence API Token权限
3. 验证页面ID是否存在
4. 确认网络连接到Confluence实例
5. 使用浏览器开发者工具查看详细错误信息
