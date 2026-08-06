import test from 'node:test'
import assert from 'node:assert/strict'
import { chineseReference, inlineChineseName, needsChineseReference } from '../assets/js/translator.js'

test('generates Chinese reference text for English clinical trial copy', () => {
  const translated = chineseReference('A Phase 3, randomized study to evaluate progression-free survival in patients with non-small cell lung cancer.')
  assert.match(translated, /III 期|3/)
  assert.match(translated, /随机/)
  assert.match(translated, /无进展生存期/)
  assert.match(translated, /非小细胞肺癌/)
})

test('does not duplicate translation for existing Chinese text', () => {
  assert.equal(needsChineseReference('非小细胞肺癌临床试验'), false)
  assert.equal(chineseReference('非小细胞肺癌临床试验'), '')
})

test('does not expose a partially translated mixed-language sentence', () => {
  const source = 'Pediatric patients undergoing inguinal hernia surgeries experience postoperative pain. Conventional pain management methods may pose significant side effects.'
  assert.equal(chineseReference(source), '')
})

test('translates open-label single-arm thyroid study title precisely', () => {
  const translated = chineseReference('An Open-Label, Single-Arm Study to Investigate the Efficacy and Safety of North Star Desiccated Porcine Thyroid Extract Tablets.')
  assert.equal(translated, '一项开放标签、单臂研究，旨在评估 North Star 干燥猪甲状腺提取物片剂的有效性和安全性。')
})

test('renders disease names as English with precise Chinese name', () => {
  assert.equal(inlineChineseName('Hypothyroidism'), 'Hypothyroidism（甲状腺功能减退症）')
})

test('covers current public-board condition names with Chinese disease labels', () => {
  const conditions = [
    'Adenocarcinoma',
    'Aesthetic',
    'Aging',
    'Autoimmune Polyendocrinopathy Candidiasis Ectodermal Dystrophy Enteritis',
    'Brain Disease',
    'COVID-19',
    'Carcinoma',
    'Cardiorespiratory Fitness',
    'Cardiovascular',
    'Castration-Resistant Prostate Carcinoma',
    'Cerebral Palsy',
    'Cerebrovascular Disorder',
    'Chemotherapy-Induced Nausea and Vomiting (CINV)',
    'Cognitive Intervention',
    'Crohn\'s Disease',
    'Diabetes Mellitus',
    'Elderly Adults',
    'End Stage Lung Disease',
    'Healthy',
    'Healthy Volunteer',
    'Hematopoietic Stem Cell Transplantation (HSCT)',
    'Herpes Zoster',
    'Hypothyroidism',
    'Insulin Resistance',
    'Lung Transplantation',
    'Mild Cognitive Impairment',
    'Mitochondrial Diabetes',
    'MuSK MG',
    'MuSK Myasthenia Gravis',
    'Multiple Sclerosis',
    'Myasthenia Gravis',
    'Neoplasms',
    'Neoplasms by Histologic Type',
    'Neoplasms, Glandular and Epithelial',
    'Non Small Cell Lung Cancer',
    'Normal Physiology',
    'Postoperative Pain',
    'Prediabetes',
    'Prostate Cancer',
    'Relapsed/Refractory Primary Central Nervous System Lymphoma',
    'Respiratory Syncytial Virus Immunization',
    'Small-cell Lung Cancer',
    'Stage IVB Prostate Cancer AJCC v8',
    'Stroke',
    'Type 1 Diabetes',
    'Vascular Diseases'
  ]

  for (const condition of conditions) {
    assert.match(inlineChineseName(condition), /（.+）/, condition)
  }
})

test('renders current public-board titles as complete Chinese reference text', () => {
  const titles = [
    'Caudal Block v/s Local Wound Infiltration for Pain Control in Pediatric Patients After Operation for Inguinal Hernia',
    'Effects of Urolithin A Supplementation on Glucose Metabolism in Healthy Adults 55 >= Years Old: A Randomized Triple-Masked Controlled Clinical Trial',
    'Respiratory, Limb Muscle Properties, and Physical Performance in Adult Lung Transplant Recipients',
    'A Study to Evaluate the Pharmacokinetics, Safety and Tolerability of ALG-097558 in Subjects With Hepatic Impairment and in Healthy Subjects With Normal Hepatic Function',
    'Impact of Insulin Deprivation and Hyperglycemia on Plasma Protein Synthesis in People With Type 1 Diabetes Mellitus'
  ]
  const incompleteEnglish = /\b(?:study|trial|effect|effects|for|with|in|on|of|and|or|the|patients|participants|subjects|individuals|history|device|approved|cleared|treatment|protocols|developing|new|technique|product|respiratory|adult|paediatrics|pediatrics|children|candidate|formulation|undergoing|clinically|normal|function|aged|older|years|age|evaluate|investigate|randomized|controlled)\b/i

  for (const title of titles) {
    const translated = chineseReference(title)
    assert.ok(translated, title)
    assert.doesNotMatch(translated, incompleteEnglish, title)
  }
})

test('translates eligibility criteria into complete Chinese without mixed common English', () => {
  const criteria = [
    ['Agree to practice a method of contraception', '同意采取避孕措施。'],
    ['Female patients not pregnant or lactating at Screening', '女性患者在筛查时未妊娠且未哺乳。'],
    ['Agree to practice a method of contraception of greater than 90% reliability', '同意采取可靠性超过 90% 的避孕方法。'],
    ['Willing to give written informed consent for the Study', '愿意为本研究签署书面知情同意书。'],
    ['Provide written authorization for use and disclosure of protected health information', '提供书面授权，同意使用和披露受保护的健康信息。'],
    ['Any clinical condition or previous surgery that might affect the absorption, distribution, biotransformation or excretion of North Star', '存在任何可能影响研究药物吸收、分布、生物转化或排泄的临床状况或既往手术史。'],
    ['Hospitalization for a major illness within 5 weeks prior to Screening', '筛查前 5 周内曾因重大疾病住院。'],
    ['18 years or older.', '年龄 18 岁或以上。'],
    ['Hospitalized as potential candidates for single- or bilateral-lung transplant surgery.', '作为单肺或双肺移植手术的潜在候选者住院。'],
    ['Hemodynamically stable for out-of-bed mobilization', '血流动力学稳定，可以进行离床活动。'],
    ['History of previous solid organ transplantation or thoracic surgery', '既往有实体器官移植或胸外科手术史。']
  ]

  for (const [source, expected] of criteria) {
    const translated = chineseReference(source)
    assert.equal(translated, expected)
    assert.doesNotMatch(translated, /\b(?:Agree|Female|patients|Screening|Provide|written|authorization|protected|health|information|Any|previous|surgery|Hospitalized|History|thoracic)\b/)
  }
})
