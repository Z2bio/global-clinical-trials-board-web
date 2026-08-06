const CJK_PATTERN = /[\u3400-\u9fff]/
const ENGLISH_PATTERN = /[A-Za-z]{3,}/

const PHRASES = [
  ['hypothyroidism', '甲状腺功能减退症'],
  ['hyperthyroidism', '甲状腺功能亢进症'],
  ['thyroid cancer', '甲状腺癌'],
  ['thyroid disease', '甲状腺疾病'],
  ['thyroid hormone', '甲状腺激素'],
  ['desiccated porcine thyroid extract tablets', '干燥猪甲状腺提取物片剂'],
  ['desiccated porcine thyroid extract', '干燥猪甲状腺提取物'],
  ['porcine thyroid extract', '猪甲状腺提取物'],
  ['thyroid extract tablets', '甲状腺提取物片剂'],
  ['autoimmune polyendocrinopathy candidiasis ectodermal dystrophy enteritis', '自身免疫性多内分泌病-念珠菌病-外胚层营养不良-肠炎'],
  ['relapsed/refractory primary central nervous system lymphoma', '复发/难治性原发性中枢神经系统淋巴瘤'],
  ['chemotherapy-induced nausea and vomiting (CINV)', '化疗引起的恶心和呕吐（CINV）'],
  ['hematopoietic stem cell transplantation (HSCT)', '造血干细胞移植（HSCT）'],
  ['respiratory syncytial virus immunization', '呼吸道合胞病毒免疫接种'],
  ['castration-resistant prostate carcinoma', '去势抵抗性前列腺癌'],
  ['stage IVB prostate cancer AJCC v8', 'AJCC 第 8 版 IVB 期前列腺癌'],
  ['neoplasms, glandular and epithelial', '腺体和上皮性肿瘤'],
  ['neoplasms by histologic type', '按组织学类型分类的肿瘤'],
  ['non small cell lung cancer', '非小细胞肺癌'],
  ['non-small cell lung cancer', '非小细胞肺癌'],
  ['small cell lung cancer', '小细胞肺癌'],
  ['small-cell lung cancer', '小细胞肺癌'],
  ['triple-negative breast cancer', '三阴性乳腺癌'],
  ['hormone receptor positive', '激素受体阳性'],
  ['HER2 positive', 'HER2 阳性'],
  ['HER2 negative', 'HER2 阴性'],
  ['breast cancer', '乳腺癌'],
  ['gastric cancer', '胃癌'],
  ['colorectal cancer', '结直肠癌'],
  ['pancreatic cancer', '胰腺癌'],
  ['liver cancer', '肝癌'],
  ['hepatocellular carcinoma', '肝细胞癌'],
  ['prostate cancer', '前列腺癌'],
  ['ovarian cancer', '卵巢癌'],
  ['cervical cancer', '宫颈癌'],
  ['renal cell carcinoma', '肾细胞癌'],
  ['urothelial carcinoma', '尿路上皮癌'],
  ['head and neck squamous cell carcinoma', '头颈部鳞状细胞癌'],
  ['squamous cell carcinoma', '鳞状细胞癌'],
  ['adenocarcinoma', '腺癌'],
  ['melanoma', '黑色素瘤'],
  ['lymphoma', '淋巴瘤'],
  ['leukemia', '白血病'],
  ['multiple myeloma', '多发性骨髓瘤'],
  ['primary central nervous system lymphoma', '原发性中枢神经系统淋巴瘤'],
  ['central nervous system lymphoma', '中枢神经系统淋巴瘤'],
  ['prostate carcinoma', '前列腺癌'],
  ['neoplasms', '肿瘤'],
  ['neoplasm', '肿瘤'],
  ['carcinoma', '癌'],
  ['solid tumor', '实体瘤'],
  ['solid tumors', '实体瘤'],
  ['brain disease', '脑部疾病'],
  ['cerebral palsy', '脑性瘫痪'],
  ['cerebrovascular disorder', '脑血管疾病'],
  ['mild cognitive impairment', '轻度认知障碍'],
  ['cognitive impairment', '认知障碍'],
  ['cognitive intervention', '认知干预'],
  ['multiple sclerosis', '多发性硬化'],
  ['myasthenia gravis', '重症肌无力'],
  ['MuSK myasthenia gravis', 'MuSK 抗体相关重症肌无力'],
  ['MuSK MG', 'MuSK 抗体相关重症肌无力'],
  ['stroke', '卒中'],
  ['Alzheimer disease', '阿尔茨海默病'],
  ['Alzheimer’s disease', '阿尔茨海默病'],
  ['Alzheimer', '阿尔茨海默病'],
  ['Parkinson disease', '帕金森病'],
  ['Parkinson’s disease', '帕金森病'],
  ['epilepsy', '癫痫'],
  ['migraine', '偏头痛'],
  ['diabetes mellitus', '糖尿病'],
  ['type 1 diabetes', '1 型糖尿病'],
  ['type 2 diabetes', '2 型糖尿病'],
  ['mitochondrial diabetes', '线粒体糖尿病'],
  ['prediabetes', '糖尿病前期'],
  ['insulin resistance', '胰岛素抵抗'],
  ['obesity', '肥胖'],
  ['overweight', '超重'],
  ['metabolic syndrome', '代谢综合征'],
  ['cardiorespiratory fitness', '心肺适能'],
  ['cardiovascular disease', '心血管疾病'],
  ['cardiovascular diseases', '心血管疾病'],
  ['cardiovascular', '心血管疾病'],
  ['vascular diseases', '血管疾病'],
  ['vascular disease', '血管疾病'],
  ['hypertension', '高血压'],
  ['heart failure', '心力衰竭'],
  ['coronary artery disease', '冠状动脉疾病'],
  ['atrial fibrillation', '心房颤动'],
  ['myocardial infarction', '心肌梗死'],
  ['end stage lung disease', '终末期肺病'],
  ['lung transplantation', '肺移植'],
  ['lung transplant', '肺移植'],
  ['chronic obstructive pulmonary disease', '慢性阻塞性肺疾病'],
  ['COPD', '慢性阻塞性肺疾病'],
  ['asthma', '哮喘'],
  ['pulmonary fibrosis', '肺纤维化'],
  ['respiratory syncytial virus', '呼吸道合胞病毒'],
  ['COVID-19', '新型冠状病毒感染'],
  ['herpes zoster', '带状疱疹'],
  ['influenza', '流感'],
  ['HIV infection', 'HIV 感染'],
  ['HIV', '人类免疫缺陷病毒'],
  ['Crohn\'s disease', '克罗恩病'],
  ['ulcerative colitis', '溃疡性结肠炎'],
  ['inflammatory bowel disease', '炎症性肠病'],
  ['irritable bowel syndrome', '肠易激综合征'],
  ['nonalcoholic steatohepatitis', '非酒精性脂肪性肝炎'],
  ['NASH', '非酒精性脂肪性肝炎'],
  ['chronic kidney disease', '慢性肾脏病'],
  ['renal failure', '肾衰竭'],
  ['end stage renal disease', '终末期肾病'],
  ['rheumatoid arthritis', '类风湿关节炎'],
  ['systemic lupus erythematosus', '系统性红斑狼疮'],
  ['psoriasis', '银屑病'],
  ['psoriatic arthritis', '银屑病关节炎'],
  ['atopic dermatitis', '特应性皮炎'],
  ['autoimmune disease', '自身免疫性疾病'],
  ['postoperative pain', '术后疼痛'],
  ['chronic pain', '慢性疼痛'],
  ['acute pain', '急性疼痛'],
  ['depression', '抑郁症'],
  ['major depressive disorder', '重性抑郁障碍'],
  ['anxiety disorder', '焦虑障碍'],
  ['schizophrenia', '精神分裂症'],
  ['bipolar disorder', '双相情感障碍'],
  ['healthy volunteer', '健康志愿者'],
  ['healthy volunteers', '健康志愿者'],
  ['healthy', '健康人群'],
  ['elderly adults', '老年成人'],
  ['normal physiology', '正常生理'],
  ['aging', '衰老'],
  ['aesthetic', '医学美容/审美相关'],
  ['advanced', '晚期'],
  ['metastatic', '转移性'],
  ['unresectable', '不可切除'],
  ['locally advanced', '局部晚期'],
  ['recurrent', '复发性'],
  ['relapsed', '复发'],
  ['refractory', '难治性'],
  ['previously treated', '既往接受过治疗'],
  ['untreated', '未接受过治疗'],
  ['first-line', '一线'],
  ['second-line', '二线'],
  ['third-line', '三线'],
  ['targeted therapy', '靶向治疗'],
  ['immunotherapy', '免疫治疗'],
  ['chemotherapy', '化疗'],
  ['radiotherapy', '放疗'],
  ['radiation therapy', '放射治疗'],
  ['surgery', '手术'],
  ['combination therapy', '联合治疗'],
  ['standard of care', '标准治疗'],
  ['best supportive care', '最佳支持治疗'],
  ['placebo', '安慰剂'],
  ['overall survival', '总生存期'],
  ['progression-free survival', '无进展生存期'],
  ['objective response rate', '客观缓解率'],
  ['overall response rate', '总缓解率'],
  ['disease control rate', '疾病控制率'],
  ['duration of response', '缓解持续时间'],
  ['complete response', '完全缓解'],
  ['partial response', '部分缓解'],
  ['stable disease', '疾病稳定'],
  ['progressive disease', '疾病进展'],
  ['adverse event', '不良事件'],
  ['adverse events', '不良事件'],
  ['serious adverse event', '严重不良事件'],
  ['serious adverse events', '严重不良事件'],
  ['dose-limiting toxicity', '剂量限制性毒性'],
  ['maximum tolerated dose', '最大耐受剂量'],
  ['recommended phase 2 dose', '推荐 II 期剂量'],
  ['safety and tolerability', '安全性和耐受性'],
  ['efficacy and safety', '有效性和安全性'],
  ['pharmacokinetics', '药代动力学'],
  ['pharmacodynamics', '药效学'],
  ['biomarker', '生物标志物'],
  ['biomarkers', '生物标志物'],
  ['quality of life', '生活质量'],
  ['clinical benefit', '临床获益'],
  ['clinical trial', '临床试验'],
  ['clinical study', '临床研究'],
  ['interventional study', '干预性研究'],
  ['observational study', '观察性研究'],
  ['expanded access', '扩大使用'],
  ['randomized', '随机'],
  ['randomised', '随机'],
  ['double-blind', '双盲'],
  ['single-blind', '单盲'],
  ['open-label', '开放标签'],
  ['placebo-controlled', '安慰剂对照'],
  ['active-controlled', '阳性药对照'],
  ['controlled', '对照'],
  ['multicenter', '多中心'],
  ['multi-center', '多中心'],
  ['single-center', '单中心'],
  ['parallel assignment', '平行分组'],
  ['single group assignment', '单组分配'],
  ['dose escalation', '剂量递增'],
  ['dose expansion', '剂量扩展'],
  ['phase 1/2', 'I/II 期'],
  ['phase 2/3', 'II/III 期'],
  ['phase 1', 'I 期'],
  ['phase 2', 'II 期'],
  ['phase 3', 'III 期'],
  ['phase 4', 'IV 期'],
  ['early phase 1', '早期 I 期'],
  ['male or female', '男性或女性'],
  ['adult', '成人'],
  ['adults', '成人'],
  ['pediatric', '儿童'],
  ['children', '儿童'],
  ['healthy volunteers', '健康志愿者'],
  ['inclusion criteria', '入选标准'],
  ['exclusion criteria', '排除标准'],
  ['eligible patients', '符合条件的患者'],
  ['participants', '受试者'],
  ['participant', '受试者'],
  ['subjects', '受试者'],
  ['patients', '患者'],
  ['patient', '患者'],
  ['histologically confirmed', '经组织学确认'],
  ['cytologically confirmed', '经细胞学确认'],
  ['measurable disease', '可测量病灶'],
  ['adequate organ function', '器官功能充足'],
  ['adequate bone marrow function', '骨髓功能充足'],
  ['ECOG performance status', 'ECOG 体能状态评分'],
  ['life expectancy', '预期寿命'],
  ['informed consent', '知情同意'],
  ['written informed consent', '书面知情同意'],
  ['prior therapy', '既往治疗'],
  ['prior treatment', '既往治疗'],
  ['prior systemic therapy', '既往全身治疗'],
  ['active infection', '活动性感染'],
  ['uncontrolled infection', '未控制感染'],
  ['active brain metastases', '活动性脑转移'],
  ['central nervous system metastases', '中枢神经系统转移'],
  ['pregnant or breastfeeding', '妊娠或哺乳'],
  ['pregnant', '妊娠'],
  ['breastfeeding', '哺乳'],
  ['clinically significant', '具有临床意义的'],
  ['major surgery', '大型手术'],
  ['autoimmune disease', '自身免疫性疾病'],
  ['human immunodeficiency virus', '人类免疫缺陷病毒'],
  ['hepatitis b', '乙型肝炎'],
  ['hepatitis c', '丙型肝炎'],
  ['estimated enrollment', '预计入组人数'],
  ['actual enrollment', '实际入组人数'],
  ['primary outcome measure', '主要结局指标'],
  ['primary outcome measures', '主要结局指标'],
  ['secondary outcome measure', '次要结局指标'],
  ['secondary outcome measures', '次要结局指标'],
  ['time frame', '时间范围'],
  ['up to', '最长至'],
  ['at least', '至少'],
  ['every', '每'],
  ['once daily', '每日一次'],
  ['twice daily', '每日两次'],
  ['weekly', '每周'],
  ['monthly', '每月'],
  ['cycle', '周期'],
  ['cycles', '周期'],
  ['day', '天'],
  ['days', '天'],
  ['week', '周'],
  ['weeks', '周'],
  ['month', '个月'],
  ['months', '个月'],
  ['year', '年'],
  ['years', '年'],
  ['tablet', '片剂'],
  ['capsule', '胶囊'],
  ['injection', '注射剂'],
  ['intravenous', '静脉给药'],
  ['subcutaneous', '皮下注射'],
  ['oral', '口服'],
  ['administered', '给药'],
  ['treatment', '治疗'],
  ['therapy', '治疗'],
  ['study drug', '研究药物'],
  ['investigational drug', '试验药物'],
  ['evaluate', '评估'],
  ['assess', '评估'],
  ['compare', '比较'],
  ['determine', '确定'],
  ['efficacy', '有效性'],
  ['safety', '安全性'],
  ['tolerability', '耐受性'],
  ['diagnosis', '诊断'],
  ['disease', '疾病'],
  ['condition', '疾病/状况'],
  ['condition or disease', '疾病或状况'],
  ['arm', '研究组'],
  ['group', '组'],
  ['cohort', '队列'],
  ['with', '伴有'],
  ['without', '无'],
  ['and', '和'],
  ['or', '或'],
  ['of', '的'],
  ['in', '在'],
  ['for', '用于'],
  ['to', '至'],
  ['versus', '对比'],
  ['vs.', '对比']
]

const SENTENCE_PATTERNS = [
  [/^an?\s+open-label,\s+single-arm\s+study\s+to\s+investigate\s+the\s+efficacy\s+and\s+safety\s+of\s+(.+?)\.?$/i, '一项开放标签、单臂研究，旨在评估 $1 的有效性和安全性。'],
  [/^an?\s+open-label,\s+single-arm\s+study\s+to\s+evaluate\s+the\s+efficacy\s+and\s+safety\s+of\s+(.+?)\.?$/i, '一项开放标签、单臂研究，旨在评估 $1 的有效性和安全性。'],
  [/^an?\s+open-label\s+study\s+to\s+investigate\s+the\s+efficacy\s+and\s+safety\s+of\s+(.+?)\.?$/i, '一项开放标签研究，旨在评估 $1 的有效性和安全性。'],
  [/^an?\s+single-arm\s+study\s+to\s+investigate\s+the\s+efficacy\s+and\s+safety\s+of\s+(.+?)\.?$/i, '一项单臂研究，旨在评估 $1 的有效性和安全性。'],
  [/^an?\s+(.+?)\s+study\s+to\s+investigate\s+the\s+efficacy\s+and\s+safety\s+of\s+(.+?)\.?$/i, '一项$1研究，旨在评估 $2 的有效性和安全性。'],
  [/^a study of (.+) in (.+)$/i, '一项关于 $1 用于 $2 的研究'],
  [/^a study to evaluate (.+)$/i, '一项用于评估 $1 的研究'],
  [/^a trial of (.+) in (.+)$/i, '一项关于 $1 用于 $2 的试验'],
  [/^this study (is designed to|will) evaluate (.+)$/i, '本研究旨在评估 $2'],
  [/^the purpose of this study is to (.+)$/i, '本研究的目的是$1'],
  [/^participants must (.+)$/i, '受试者必须$1'],
  [/^participants with (.+)$/i, '伴有$1的受试者'],
  [/^patients with (.+)$/i, '伴有$1的患者'],
  [/^history of (.+)$/i, '有$1病史'],
  [/^known (.+)$/i, '已知$1']
]

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hasEnglish(value) {
  return ENGLISH_PATTERN.test(String(value || ''))
}

function hasChinese(value) {
  return CJK_PATTERN.test(String(value || ''))
}

function normalizeSpaces(value) {
  return String(value || '')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:)])/g, '$1')
    .replace(/([(])\s+/g, '$1')
    .trim()
}

function applySentencePatterns(text) {
  for (const [pattern, replacement] of SENTENCE_PATTERNS) {
    if (pattern.test(text)) return text.replace(pattern, replacement)
  }
  return text
}

function exactPhraseTranslation(text) {
  const normalized = normalizeSpaces(text).toLowerCase()
  const match = PHRASES.find(([english]) => normalizeSpaces(english).toLowerCase() === normalized)
  return match?.[1] || ''
}

function translateSegment(segment) {
  let output = normalizeSpaces(segment)
  if (!output) return ''
  const exact = exactPhraseTranslation(output)
  if (exact) return exact

  output = applySentencePatterns(output)
  const sorted = [...PHRASES].sort((a, b) => b[0].length - a[0].length)
  for (const [english, chinese] of sorted) {
    output = output.replace(new RegExp(`\\b${escapeRegExp(english)}\\b`, 'gi'), chinese)
  }

  return output
    .replace(/\b(\d+)\s*-\s*(\d+)\s*周/g, '$1-$2 周')
    .replace(/\b(\d+)\s*-\s*(\d+)\s*天/g, '$1-$2 天')
    .replace(/\s+/g, ' ')
    .replace(/\s+的/g, '的')
    .replace(/\s+研究/g, '研究')
    .replace(/\s+，/g, '，')
    .replace(/\s*([，。；：、])\s*/g, '$1')
    .replace(/,\s*/g, '，')
    .replace(/;\s*/g, '；')
    .replace(/:\s*/g, '：')
    .trim()
}

function splitLines(text) {
  return String(text || '')
    .replace(/\r/g, '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export function needsChineseReference(value) {
  const text = String(value || '').trim()
  return text.length >= 4 && hasEnglish(text) && !hasChinese(text)
}

export function chineseReference(value, { maxChars = 1200 } = {}) {
  const text = String(value || '').trim()
  if (!needsChineseReference(text)) return ''

  const lines = splitLines(text)
  const sourceLines = lines.length ? lines : [text]
  const translated = sourceLines
    .map((line) => translateSegment(line.replace(/^[-*•\d.)\s]+/, '')))
    .filter(Boolean)
    .join('\n')

  if (!translated || translated.toLowerCase() === normalizeSpaces(text).toLowerCase()) return ''
  return translated.length > maxChars ? `${translated.slice(0, maxChars)}...` : translated
}

export function inlineChineseName(value) {
  const source = String(value || '').trim()
  const translated = exactPhraseTranslation(source) || chineseReference(source, { maxChars: 80 })
  if (!translated || translated === source) return source
  return `${source}（${translated}）`
}
