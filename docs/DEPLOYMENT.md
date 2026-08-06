# GitHub Pages 部署与上线检查

## 发布前检查

- [ ] 仓库为公开仓库，或当前 GitHub 套餐支持私有仓库 Pages。
- [ ] 所有文件位于仓库根目录。
- [ ] 默认分支名称与工作流中的 `main` 一致。
- [ ] `Settings → Pages → Source` 选择 GitHub Actions。
- [ ] Actions 中 `Deploy static site to GitHub Pages` 执行成功。
- [ ] 首页、检索、筛选、详情和收藏在桌面与手机宽度下正常。
- [ ] 浏览器开发者工具未出现 JavaScript 错误。
- [ ] 实际网络可以访问 ClinicalTrials.gov API。
- [ ] 页脚免责声明、数据来源和隐私说明可见。

## 自定义域名

可在 `Settings → Pages → Custom domain` 中填写，例如：

```text
trials.example.com
```

然后在域名 DNS 服务商添加 GitHub Pages 要求的 CNAME 或 A/AAAA 记录。不要在代码包中预先创建未知域名的 `CNAME` 文件，否则会导致默认 GitHub Pages 地址异常。

## API 无法直接访问时

可能原因包括：

- 用户网络无法访问 ClinicalTrials.gov；
- 官方接口临时不可用；
- 浏览器跨域策略发生变化；
- 请求频率过高或连接超时。

当前版本会回退到浏览器中最近一次成功缓存。若需要保证可用性，应增加代理层并将 `assets/js/config.js` 中的 `apiBase` 改为代理地址。

## 中国大陆正式运营提示

GitHub Pages 适合作为公开展示、原型验证和海外可访问页面。若后续面向中国大陆长期正式运营，应另行评估访问速度、域名备案、内容合规、日志、安全和服务稳定性。
