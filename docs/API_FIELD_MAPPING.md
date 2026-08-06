# ClinicalTrials.gov API V2 字段映射

| 网页公示字段 | API V2 路径 | 处理说明 |
|---|---|---|
| NCT 编号 | `protocolSection.identificationModule.nctId` | 作为全球记录主键和官方链接参数 |
| 标题 | `identificationModule.briefTitle / officialTitle` | 列表使用简短标题，详情优先官方标题 |
| 公开状态 | `statusModule.overallStatus` | 转换为中文状态并附通俗说明 |
| 状态核验日期 | `statusModule.statusVerifiedDate` | 表示登记方最近核验状态的月份 |
| 研究分期 | `designModule.phases` | 转换为Ⅰ、Ⅱ、Ⅲ、Ⅳ期等中文标签 |
| 研究类型 | `designModule.studyType` | 干预性、观察性或扩大使用 |
| 招募人数 | `designModule.enrollmentInfo` | 区分 `ACTUAL` 与 `ESTIMATED` |
| 疾病 | `conditionsModule.conditions` | 列表与详情展示 |
| 关键词 | `conditionsModule.keywords` | 用于补充疾病与研究主题 |
| 主要申办方 | `sponsorCollaboratorsModule.leadSponsor` | 展示名称和机构类型 |
| 合作方 | `sponsorCollaboratorsModule.collaborators` | 展示公开合作机构 |
| 干预措施 | `armsInterventionsModule.interventions` | 展示名称、类型和原文说明 |
| 研究分组 | `armsInterventionsModule.armGroups` | 展示分组和方案原文 |
| 疗程摘要 | 干预/分组描述派生 | 仅提取可识别的 day/week/month/year/cycle 时间片段 |
| 执行中心 | `contactsLocationsModule.locations` | 展示中心、国家、城市、中心状态和联系人 |
| 总体联系人 | `contactsLocationsModule.centralContacts` | 展示公开电话和邮箱 |
| 研究负责人 | `contactsLocationsModule.overallOfficials` | 展示姓名、角色和机构 |
| 入排标准 | `eligibilityModule.eligibilityCriteria` | 尝试按 Inclusion/Exclusion 标题分离，并保留完整原文 |
| 年龄/性别 | `eligibilityModule` | 转换为中文标签 |
| 主要结局 | `outcomesModule.primaryOutcomes` | 展示指标和时间范围 |
| 次要结局 | `outcomesModule.secondaryOutcomes` | 默认最多显示前10项 |
| 研究日期 | `statusModule.*DateStruct` | 展示开始、主要完成、整体完成、首次公示和最近更新 |
| 结果状态 | 顶层 `hasResults` | 仅表示记录中是否存在结果模块 |
