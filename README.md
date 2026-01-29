# CloudFlare Tools

<img width="192" height="54" alt="image" src="https://github.com/user-attachments/assets/9b112cbd-a7f2-4539-8c8a-23f3a4c593b8" />
<img width="192" height="91" alt="image" src="https://github.com/user-attachments/assets/c597e2c0-ff8f-45b4-8edd-9bf1732f8db6" />
<img width="192" height="91" alt="image" src="https://github.com/user-attachments/assets/3ae7f217-aa8c-4ae8-9256-d8ba623266b2" />


## 功能特性

### 域名解析管理
- **批量添加域名** - 快速将多个域名添加到 CloudFlare
- **批量解析记录** - 支持每个域名解析到不同的 IP
- **批量删除解析** - 清空或删除指定解析记录
- **批量开关代理** - 一键开启/关闭 CDN 代理
- **批量删除域名** - 批量移除 Zone
- **批量导出域名** - 导出域名列表及状态

### 安全规则
- **SSL/HTTPS 设置** - 批量配置 SSL 模式、TLS 版本、HTTPS 重定向
- **批量复制规则** - 复制页面规则、防火墙规则、速率限制
- **批量删除规则** - 清空各类规则配置

### 高级设置
- **缓存管理** - 批量清除缓存、设置缓存级别、Always Online
- **性能优化** - 代码压缩、Brotli、HTTP/2、HTTP/3、图像优化
- **批量配置** - 安全级别、浏览器检查、防盗链等批量设置

### 账号管理
- 多账号管理
- 账号连接测试
- 搜索和筛选
- 批量检测和删除
- 状态监控(正常/失效)

## 技术栈

- **后端**: Go + Gin
- **前端**: 原生 JavaScript + Vite + Tabler UI
- **部署**: 单文件二进制(内嵌前端资源)

## 快速开始

### 环境要求

- Go 1.19+
- Node.js 16+
- npm 或 yarn

### 安装步骤

1. 克隆项目
```bash
git clone https://github.com/xkatld/Cloudflare-Tools.git
cd Cloudflare-Tools
```

2. 配置管理员账号
```bash
cp Server/config.yaml.example Server/config.yaml
# 编辑 config.yaml 设置管理员用户名和密码

```
3. 生产构建
```bash
chmod +x build.sh
./build.sh
```

构建完成后会在 `releases/` 目录生成可执行文件。

### 使用方法

1. 启动程序后访问 `http://localhost:8080`
2. 使用配置的管理员账号登录
3. 在账号管理中添加 CloudFlare API 密钥
4. 开始使用各项批量操作功能

## 配置说明

### config.yaml

```yaml
admin:
  username: 'admin'
  password: 'your-secure-password'
```

### CloudFlare API 密钥

需要在 CloudFlare 控制台获取:
1. 登录 CloudFlare
2. 进入 "我的个人资料" > "API 令牌"
3. 查看 "Global API Key"
4. 在工具中添加邮箱和 API Key

## 贡献

欢迎提交 Issue 和 Pull Request!

## 许可证

本项目采用 GNU Affero General Public License v3.0 (AGPL-3.0) 开源协议。

- ✅ 必须保留原作者署名
- ✅ 衍生作品必须开源
- ✅ 网络服务必须提供源代码
- ✅ 修改必须说明

详见 [LICENSE](LICENSE) 文件。

## 免责声明

本工具仅供学习和合法用途使用。使用本工具产生的任何后果由使用者自行承担。

## 联系方式

- Issues: [GitHub Issues](https://github.com/xkatld/Cloudflare-Tools/issues)
- 项目地址: https://github.com/xkatld/Cloudflare-Tools

---

⭐ 如果这个项目对你有帮助,请给个 Star!
# Cloudflare-Tools
