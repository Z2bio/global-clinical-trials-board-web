# 技术架构

## 部署结构

```text
GitHub Pages 静态站点
        │
        ├── HTML / CSS / 原生 ES Modules
        ├── 浏览器 localStorage：查询缓存、收藏快照
        ├── Service Worker：只缓存网页静态资源
        │
        └── 浏览器直接请求 ClinicalTrials.gov API V2
```

## 查询流程

1. 根据关键词和公开状态构造 API 请求。
2. 如果本地存在相同请求的缓存，先用于页面预览。
3. 同时进行网络请求。
4. 成功后标准化字段并覆盖缓存。
5. 失败后继续显示缓存，并展示缓存年龄和失败原因。
6. 无缓存时展示明确错误和官方站点入口。

## 为什么不在 GitHub 中保存全部临床试验数据

- 避免产生过时的静态数据副本。
- 避免仓库体积持续增长。
- 减少数据同步和数据库维护成本。
- 每次访问以官方 API 当前返回为准。

## 隐私设计

- 不设置登录系统。
- 不请求身份信息和健康信息。
- 收藏对象以 NCT 编号为键，只保存在 localStorage。
- 清除浏览器站点数据或点击页脚“清除本地缓存与收藏”即可删除。

## 未来可升级路径

如果需要跨设备收藏、状态变更主动提醒、历史版本对比或更稳定的中国大陆访问，可增加：

```text
GitHub Pages / Cloudflare Pages
              ↓
Cloudflare Worker / Vercel Function / 自有 API
              ↓
缓存数据库 + 定时同步 + 历史版本表
              ↓
ClinicalTrials.gov API
```
