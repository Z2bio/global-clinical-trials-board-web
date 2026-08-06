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
