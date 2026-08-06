const CJK_PATTERN = /[\u3400-\u9fff]/
const ENGLISH_PATTERN = /[A-Za-z]{3,}/
const SAFE_CLINICAL_TOKENS = new Set([
  'North', 'Star', 'LT4', 'FDA', 'CoQ10', 'FibroTouchI', 'Tarlatamab', 'Ad5', 'PSA', 'MUC', 'Brachyury',
  'TriAdeno', 'IL', 'ALG', 'AZD', 'GC101', 'PREDICT', 'IGNITE', 'Tirabrutinib', 'Rituximab', 'Temozolomide',
  'Enlicitide', 'MK', 'mRNA', 'Shingrix', 'Emapalumab', 'APECED', 'PCNSL', 'MuSK', 'GWAS', 'CINV', 'HSCT',
  'SDOH', 'MIP', 'MEP', 'CFS', 'STAI', 'ICU', 'ASA', 'NIR', 'TMS', 'tDCS', 'MRS', 'MRI', 'CT', 'PET', 'AUC',
  'Cmax', 'Cmin', 'PFS', 'DCR', 'DOR', 'OS', 'RECIST', 'BIRC', 'IPCG', 'CR', 'CRu', 'BOR', 'OGTT', 'HOMA',
  'NIHSS', 'RFB', 'HRV', 'BF', 'UA', 'IM', 'RSV', 'M3', 'Ropivacaine', 'Hannallah', 'Paracetamol'
])

const EXACT_TRANSLATIONS = [
  ['Diagnosed with primary hypothyroidism, including Hashimoto\'s Thyroiditis, and on therapy with a stable dose of LT4 (minimum 50 mcg per day, administered 7 days per week) for at least 12 weeks prior to Screening', '诊断为原发性甲状腺功能减退症，包括桥本甲状腺炎；筛查前至少 12 周一直使用稳定剂量的 LT4 治疗，最低剂量为每日 50 微克、每周给药 7 天。'],
  ['Have had euthyroid status for at least 6 weeks and up to 12 months prior to Screening (Visit 1), with at least one documented minimum stable dose of 50 mcg LT4.', '筛查（第 1 次访视）前至少 6 周且最长 12 个月内处于甲状腺功能正常状态，并有至少一次记录显示 LT4 稳定剂量不低于 50 微克。'],
  ['Agree to practice a method of contraception', '同意采取避孕措施。'],
  ['Female patients not pregnant or lactating at Screening', '女性患者在筛查时未妊娠且未哺乳。'],
  ['Agree to practice a method of contraception of greater than 90% reliability', '同意采取可靠性超过 90% 的避孕方法。'],
  ['Willing to give written informed consent for the Study', '愿意为本研究签署书面知情同意书。'],
  ['Provide written authorization for use and disclosure of protected health information', '提供书面授权，同意使用和披露受保护的健康信息。'],
  ['Any clinical condition or previous surgery that might affect the absorption, distribution, biotransformation or excretion of North Star', '存在任何可能影响研究药物吸收、分布、生物转化或排泄的临床状况或既往手术史。'],
  ['Hospitalization for a major illness within 5 weeks prior to Screening', '筛查前 5 周内曾因重大疾病住院。'],
  ['Concomitant use of prohibited medications or supplements', '同时使用禁用药物或补充剂。'],
  ['Have uncontrolled diabetes', '存在未控制的糖尿病。'],
  ['Taking or having taken prescription or over-the-counter weight loss medications within 6 weeks prior to Screening', '筛查前 6 周内正在使用或曾使用处方或非处方减重药物。'],
  ['Participated in another investigational new drug study within 30 days or 5 half-lives of the IMP, whichever is longer, prior to the first study drug administration.', '首次使用研究药物前 30 天内，或研究用药物 5 个半衰期内（以较长者为准），参加过另一项试验性新药研究。'],
  ['For female subjects, be pregnant, nursing or planning to become pregnant during the study', '女性受试者在研究期间妊娠、哺乳或计划妊娠。'],
  ['18 years or older.', '年龄 18 岁或以上。'],
  ['Hospitalized as potential candidates for single- or bilateral-lung transplant surgery.', '作为单肺或双肺移植手术的潜在候选者住院。'],
  ['Hemodynamically stable for out-of-bed mobilization', '血流动力学稳定，可以进行离床活动。'],
  ['Baseline cognitive impairment', '基线存在认知障碍。'],
  ['History of previous solid organ transplantation or thoracic surgery', '既往有实体器官移植或胸外科手术史。'],
  ['Existing phrenic nerve lesion', '存在膈神经损伤。'],
  ['Lower limb amputation or fracture', '存在下肢截肢或骨折。'],
  ['External fixators or open wounds of the lower extremities', '下肢存在外固定器或开放性伤口。'],
  ['Diagnosed neuromuscular disorder.', '已诊断神经肌肉疾病。'],
  ['Morbid obesity (body mass index \\>45 kg/m²).', '病态肥胖，体重指数大于 45 kg/m²。'],
  ['Morbid obesity (body mass index >45 kg/m²).', '病态肥胖，体重指数大于 45 kg/m²。'],
  ['Any other medical condition that, in the opinion of the investigators, would make participation unsuitable.', '研究者认为存在任何其他不适合参加本研究的医学状况。'],
  ['A Phase 3, randomized study to evaluate progression-free survival in patients with non-small cell lung cancer.', '一项评估非小细胞肺癌患者无进展生存期的 III 期随机研究。'],
  ['Caudal Block v/s Local Wound Infiltration for Pain Control in Pediatric Patients After Operation for Inguinal Hernia', '比较骶管阻滞与局部伤口浸润麻醉用于儿童腹股沟疝术后疼痛控制的研究'],
  ['Effects of Urolithin A Supplementation on Glucose Metabolism in Healthy Adults 55 >= Years Old: A Randomized Triple-Masked Controlled Clinical Trial', '尿石素 A 补充对 55 岁及以上健康成人葡萄糖代谢影响的随机、三盲、对照临床试验'],
  ['Electrical Brain Stimulation for Treatment of Secondary Symptoms in Multiple Sclerosis', '脑电刺激用于治疗多发性硬化相关继发症状的研究'],
  ['New Technique and Product for Chin Enhancement', '用于下巴改善/颏部塑形的新技术和产品研究'],
  ['Respiratory, Limb Muscle Properties, and Physical Performance in Adult Lung Transplant Recipients', '成人肺移植受者的呼吸功能、肢体肌肉特性和身体功能表现研究'],
  ['Cognitive Intervention for Cognitive Impairment', '认知干预用于认知障碍的研究'],
  ['Developing Transcranial Neuromodulation Protocols for Learning and Decision-Making', '开发用于学习和决策能力的经颅神经调控方案'],
  ['A Phase II Study of GC101 in NSCLC', '一项评估 GC101 用于非小细胞肺癌的 II 期研究'],
  ['Pilot Intervention With Near Infrared Stimulation', '近红外刺激试点干预研究'],
  ['Study of a Respiratory Syncytial Virus Candidate Encapsulated in a Lipid Nanoparticle Based Formulation in Adults Aged 18 to 50 Years and 60 Years and Older', '一项关于脂质纳米颗粒制剂包封的呼吸道合胞病毒候选制剂在 18 至 50 岁成人及 60 岁以上成人中的研究'],
  ['CoQ10 Effects on MDM Liver Fat Via FibroTouchI.', '通过 FibroTouchI 评估 CoQ10 对线粒体糖尿病相关肝脏脂肪的影响'],
  ['Acupuncture to Prevent Nausea and Vomiting After Stem Cell Transplant', '针灸用于预防干细胞移植后恶心和呕吐的研究'],
  ['SCLC Tarlatamab Blood Collection', '小细胞肺癌 Tarlatamab 相关血液样本采集研究'],
  ['Multitargeted Recombinant Ad5 PSA/MUC-1/Brachyury-Based Immunotherapy (TriAdeno) Vaccine With IL-15 Superagonist N-803 in Participants With Clinically Localized Prostate Cancer Undergoing Active Surveillance', '多靶点重组 Ad5 PSA/MUC-1/Brachyury 免疫治疗疫苗（TriAdeno）联合 IL-15 超激动剂 N-803 用于接受主动监测的临床局限性前列腺癌受试者的研究'],
  ['A Study to Evaluate the Pharmacokinetics, Safety and Tolerability of ALG-097558 in Subjects With Hepatic Impairment and in Healthy Subjects With Normal Hepatic Function', '一项评估 ALG-097558 在肝功能损害受试者及肝功能正常健康受试者中的药代动力学、安全性和耐受性的研究'],
  ['Screening for Social Determinants of Health (SDOH) and Cognitive Function in Individuals With History of Stroke', '对有卒中病史人群进行健康社会决定因素（SDOH）和认知功能筛查的研究'],
  ['A Study to Investigate Safety, Tolerability, Pharmacokinetics, and Pharmacodynamics of AZD1705 in Participants With Dyslipidemia', '一项评估 AZD1705 在血脂异常受试者中的安全性、耐受性、药代动力学和药效学的研究'],
  ['Targeted Treatment for Metastatic Prostate Cancer, The PREDICT Trial', 'PREDICT 试验：转移性前列腺癌的靶向治疗研究'],
  ['Effect of Transcranial Direct Current Stimulation on Hand Recovery and Quality of Life in Hemiparetic Cerebral Palsied Children', '经颅直流电刺激对偏瘫型脑瘫儿童手功能恢复和生活质量影响的研究'],
  ['[Trial of device that is not approved or cleared by the U.S. FDA]', '一项关于尚未获得美国 FDA 批准或许可医疗器械的试验'],
  ['MuSK Myasthenia 1000 Study', 'MuSK 抗体相关重症肌无力 1000 研究'],
  ['Ustekinumab Real World Evidence Study', '乌司奴单抗真实世界证据研究'],
  ['Effects of Autonomic Nervous System Modulation by Heart Rate Variability Biofeedback Training With Resonant Frequency Breathing on Glucose Metabolism in Individuals With Prediabetes', '心率变异性生物反馈训练结合共振频率呼吸调节自主神经系统对糖尿病前期人群葡萄糖代谢影响的研究'],
  ['Randomized Stepped Wedge Study of Emapalumab in APECED Enteritis', 'Emapalumab 用于 APECED 相关肠炎的随机阶梯楔形研究'],
  ['A Study to Evaluate the Safety, Reactogenicity, and Immunogenicity of mRNA-1468 in Healthy Adults ≥50 Years of Age', '一项评估 mRNA-1468 在 50 岁及以上健康成人中的安全性、反应原性和免疫原性的研究'],
  ['IGNITE: Study of Tirabrutinib vs Rituximab/Temozolomide for Relapsed/Refractory Primary Central Nervous System Lymphoma (PCNSL)', 'IGNITE：Tirabrutinib 对比利妥昔单抗/替莫唑胺用于复发/难治性原发性中枢神经系统淋巴瘤（PCNSL）的研究'],
  ['A Clinical Study of MK-7262 and Enlicitide in Healthy Participants (MK-7262-003)', '一项 MK-7262 和 Enlicitide 用于健康受试者的临床研究（MK-7262-003）'],
  ['Effect of Tele-exercise on Cardiorespiratory Fitness in Paediatrics', '远程运动对儿童心肺适能影响的研究'],
  ['Impact of Insulin Deprivation and Hyperglycemia on Plasma Protein Synthesis in People With Type 1 Diabetes Mellitus', '胰岛素不足和高血糖对 1 型糖尿病患者血浆蛋白合成影响的研究']
  ,['COMPARISON OF ANALGESIC EFFECTS OF WOUND INFILTRATION WITH ROPIVACAINE VERSUS CAUDAL BLOCK WITH ROPIVACAINE IN PEDIATRIC PATIENTS UNDERGOING INGUINAL HERNIOTOMY INTRODUCTION', '比较罗哌卡因伤口浸润与罗哌卡因骶管阻滞在接受腹股沟疝切开修补术儿童患者中的镇痛效果（引言）']
  ,['This randomized controlled trial aims to compare the analgesic efficacy of local wound infiltration with Ropivacaine versus Caudal Block with Ropivacaine in pediatric patients undergoing surgery for inguinal hernia', '本随机对照试验旨在比较罗哌卡因局部伤口浸润与罗哌卡因骶管阻滞用于接受腹股沟疝手术儿童患者的镇痛效果。']
  ,['Administered after surgery using the landmark technique with 0.25% ropivacaine at a dose of 2mg/kg body weight.', '术后采用解剖标志定位技术给药，使用浓度为 0.25% 的罗哌卡因，剂量为 2 毫克/千克体重。']
  ,['Administered after surgery by pediatric surgeons using 0.5% ropivacaine at a dose of 2mg/kg body weight into the groin skin crease incision.', '术后由儿科外科医生将浓度为 0.5% 的罗哌卡因，以 2 毫克/千克体重的剂量注入腹股沟皮肤皱褶切口处。']
  ,['Administered as rescue analgesia at a dose of 15 ml/kg body weight if the patient\'s postoperative pain score reaches 3 or higher on the Hannallah Modified Objective Pain Scale.', '如果患者在汉纳拉改良客观疼痛量表上的术后疼痛评分达到 3 分或以上，则以 15 毫升/千克体重的剂量静脉给予对乙酰氨基酚混悬液作为补救性镇痛。']
  ,['Pediatric patients undergoing open elective inguinal herniotomy who receive a post-operative caudal block.', '接受择期开放性腹股沟疝切开修补术并接受术后骶管阻滞的儿童患者。']
  ,['Pediatric patients undergoing open elective inguinal herniotomy who receive post-operative local wound infiltration.', '接受择期开放性腹股沟疝切开修补术并接受术后局部伤口浸润麻醉的儿童患者。']
  ,['Postoperative Analgesic Requirement', '术后镇痛药物使用需求']
  ,['Postoperative Analgesia requirement', '术后镇痛药物使用需求']
  ,['Post-operative pain will be assessed at 30 minutes, and 1, 2, 4, 6, and 8 hours using the Hannallah Modified Objective Pain Scale. At any stage, if a pain score of 3 or more is observed, it will be considered severe pain, and rescue analgesia in intravenous paracetamol suspension at 15 ml/kg body weight will be administered.', '将使用汉纳拉改良客观疼痛量表在术后 30 分钟以及术后 1、2、4、6 和 8 小时评估疼痛。如果任何时点评分达到 3 分或以上，则视为重度疼痛，并给予剂量为 15 毫升/千克体重的静脉对乙酰氨基酚混悬液进行补救性镇痛。']
  ,['Within first 8 hours after surgery', '术后最初 8 小时内']
  ,['Male and female patients aged 2-10 years.', '年龄为 2 至 10 岁的男性和女性患者。']
  ,['Patients undergoing open elective herniotomy.', '接受择期开放性疝切开修补术的患者。']
  ,['Patients classified as ASA (American Society of Anesthesiologists) classes I and II.', '美国麻醉医师协会（ASA）身体状况分级为 I 级或 II 级的患者。']
  ,['Patients with recurrent, bilateral, complicated, or obstructed hernias.', '患有复发性、双侧、复杂性或梗阻性疝的患者。']
  ,['History of bleeding disorders.', '有出血性疾病史。']
  ,['Presence of congenital anomalies of the spine.', '存在脊柱先天性畸形。']
  ,['History of drug allergy.', '有药物过敏史。']
  ,['Infection at the caudal injection site.', '骶管注射部位存在感染。']
  ,['Caudal Block with Ropivacaine Intervention', '罗哌卡因骶管阻滞干预']
  ,['Local Wound Infiltration with Ropivacaine Intervention', '罗哌卡因局部伤口浸润麻醉干预']
  ,['Intravenous Paracetamol Suspension Intervention', '静脉注射对乙酰氨基酚混悬液干预']
  ,['Group A: Caudal Block Group', 'A 组：骶管阻滞组']
  ,['Group B: Local wound infiltration', 'B 组：局部伤口浸润麻醉组']
  ,['Adult Lung Transplant Candidates', '成人肺移植候选者']
  ,['Respiratory and Limb Muscle Assessment', '呼吸肌和肢体肌肉评估']
  ,['The goal of this observational study is to evaluate respiratory and limb muscle properties in adults awaiting lung transplantation and determine how these measures relate to physical performance, symptoms, and recovery after transplantation. Respiratory and limb muscle weakness may contribute to impaired mobility, frailty, and delayed postoperative recovery, but their specific role in lung transplant candidates is not well understood. Participants will undergo muscle ultrasound imaging at weekly basis, respiratory and limb strength testing, physical performance assessments, and symptom questionnaires once before and after transplantation. Researchers will also collect information from medical records regarding intensive care unit stay, hospital length of stay, rehabilitation participation, and postoperative recovery outcomes.', '本观察性研究旨在评估等待肺移植成人的呼吸肌和肢体肌肉特性，并确定这些指标与肺移植后的身体功能、症状及恢复情况之间的关系。呼吸肌和肢体肌肉无力可能导致活动能力受损、衰弱以及术后恢复延迟，但其在肺移植候选者中的具体作用尚未得到充分了解。受试者将在移植前后分别接受一次肌肉超声检查、呼吸肌和肢体肌力测试、身体功能评估及症状问卷，并每周进行肌肉超声影像检查。研究人员还将从病历中收集重症监护病房住院时间、住院总时长、康复参与情况及术后恢复结局等信息。']
  ,['Participants undergo serial assessments of respiratory and limb muscle structure and function before and after lung transplantation. Assessments include ultrasound imaging of the diaphragm, rectus abdominis, and quadriceps muscles; respiratory muscle strength testing; handgrip strength testing; knee extension strength testing; physical performance measures; and patient-reported outcome questionnaires.', '受试者将在肺移植前后接受呼吸肌和肢体肌肉结构及功能的系列评估。评估内容包括膈肌、腹直肌和股四头肌的超声影像检查，呼吸肌力测试，握力测试，膝关节伸展肌力测试，身体功能指标评估以及患者报告结局问卷。']
  ,['adults enrolled for in-hospital evaluation for lung transplant and listed for surgery who undergo serial assessments of respiratory and limb muscle properties before transplantation and during the early postoperative period. Assessments include ultrasound imaging, respiratory and limb strength testing, physical performance measures, patient-reported outcomes, and collection of clinical outcomes from the medical record.', '因住院接受肺移植评估并已列入手术候选名单的成人；受试者将在移植前及术后早期接受呼吸肌和肢体肌肉特性的系列评估。评估包括超声影像检查、呼吸肌和肢体肌力测试、身体功能指标、患者报告结局以及从病历中收集临床结局。']
  ,['Diaphragm structure', '膈肌结构']
  ,['Diaphragm thickness (unit of measure: mm) assessed by ultrasonography', '通过超声检查评估膈肌厚度，计量单位为毫米。']
  ,['Weekly from baseline through postoperative day 14 (±2 days)', '从基线至术后第 14 天，每周评估一次（允许偏差 ±2 天）。']
  ,['Respiratory Muscle Strength', '呼吸肌力']
  ,['Maximal inspiratory pressure (MIP) and maximal expiratory pressure (MEP) obtained during maximal respiratory efforts against a one-way valve.', '受试者通过单向阀进行最大用力呼吸时测量最大吸气压（MIP）和最大呼气压（MEP）。']
  ,['Baseline and at postoperative day 14 (±2 days)', '基线及术后第 14 天评估（允许偏差 ±2 天）。']
  ,['Abdominal muscle structure', '腹肌结构']
  ,['Rectus abdominis muscle thickness (measurement unit: mm) assessed by ultrasonography.', '通过超声检查评估腹直肌厚度，计量单位为毫米。']
  ,['Baseline through postoperative day 14 (±2 days)', '从基线至术后第 14 天评估（允许偏差 ±2 天）。']
  ,['Limb muscle strength', '肢体肌力']
  ,['Handgrip force and knee extension force measured using dynamometry.', '使用测力法测量握力和膝关节伸展力。']
  ,['At the first baseline visit and postoperative day 14 (±2 days)', '首次基线访视及术后第 14 天评估（允许偏差 ±2 天）。']
  ,['Rectus femoris thickness', '股直肌厚度']
  ,['Rectus femoris muscle thickness (unit of measurement: mm) assessed by ultrasonography.', '通过超声检查评估股直肌厚度，计量单位为毫米。']
  ,['Five-Repetition Sit-to-Stand Test', '五次坐站试验']
  ,['Time required to complete five sit-to-stand repetitions as a measure of physical performance. Retrieved from the medical record.', '完成五次坐站动作所需的时间，用于评估身体功能；数据从病历中提取。']
  ,['Baseline and hospital discharge', '基线及出院时评估。']
  ,['Frailty Status', '衰弱状态']
  ,['Frailty assessed using the Clinical Frailty Scale (CFS), a 9-point scale ranging from 1 to 9, where 1 = Very Fit and 9 = Terminally Ill. Higher scores indicate greater frailty and a worse clinical status.', '使用临床衰弱量表（CFS）评估衰弱程度。该量表为 1 至 9 分的九级量表，其中 1 分表示身体状况非常好，9 分表示终末期疾病；分数越高表示衰弱程度越重、临床状态越差。']
  ,['patient-reported symptoms', '患者报告的症状']
  ,['Dyspnea, physical fatigue, and pain assessed using an 11-point numeric rating scale ranging from 0 to 10, where 0 indicates no symptom and 10 indicates the worst symptom severity ever experienced. Higher scores indicate worse symptom burden.', '使用 0 至 10 分的 11 点数字评分量表评估呼吸困难、身体疲劳和疼痛，其中 0 分表示无症状，10 分表示曾经历的最严重症状；分数越高表示症状负担越重。']
  ,['Six-Minute Walk Distance', '六分钟步行距离']
  ,['Distance walked during the Six-Minute Walk Test (6MWT), retrieved from the medical record.', '六分钟步行试验（6MWT）期间行走的距离，数据从病历中提取。']
  ,['Baseline and at hospital discharge, an average of 3 weeks after surgery.', '基线及出院时评估，出院时间通常为术后平均 3 周。']
  ,['Anxiety', '焦虑']
  ,['Anxiety assessed using the State-Trait Anxiety Inventory (STAI). The STAI score ranges from 20 to 80, with higher scores indicating greater anxiety and a worse outcome. Data will be retrieved from the medical record.', '使用状态-特质焦虑问卷（STAI）评估焦虑程度。STAI 评分范围为 20 至 80 分，分数越高表示焦虑程度越重、结局越差；数据将从病历中提取。']
  ,['Baseline and at hospital discharge, up to an average of 3 weeks after surgery.', '基线及出院时评估，最晚为术后平均 3 周。']
  ,['Duration of Mechanical Ventilation', '机械通气持续时间']
  ,['Total duration of postoperative invasive mechanical ventilation, measured in days.', '术后有创机械通气的总持续时间，以天数计。']
  ,['From surgery through hospital discharge, up to an average of 3 weeks after surgery.', '从手术至出院，最长至术后平均 3 周。']
  ,['Intensive Care Unit Length of Stay', '重症监护病房住院时间']
  ,['Number of days from intensive care unit (ICU) admission to ICU discharge.', '从入住重症监护病房（ICU）至离开 ICU 的天数。']
  ,['From ICU admission through ICU discharge, up to an average of two weeks after surgery.', '从入住 ICU 至离开 ICU，最长至术后平均 2 周。']
  ,['Hospital Length of Stay', '住院时间']
  ,['Number of days from ICU admission to hospital discharge', '从入住 ICU 至出院的天数。']
  ,['From ICU admission through hospital discharge, up to an average of 3 weeks after surgery.', '从入住 ICU 至出院，最长至术后平均 3 周。']
]

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
  ['caudal block', '骶管阻滞'],
  ['local wound infiltration', '局部伤口浸润麻醉'],
  ['pain control', '疼痛控制'],
  ['inguinal hernia', '腹股沟疝'],
  ['pediatric patients', '儿童患者'],
  ['after operation', '术后'],
  ['glucose metabolism', '葡萄糖代谢'],
  ['Urolithin A supplementation', '尿石素 A 补充'],
  ['healthy adults', '健康成人'],
  ['triple-masked', '三盲'],
  ['electrical brain stimulation', '脑电刺激'],
  ['secondary symptoms', '继发症状'],
  ['chin enhancement', '下巴改善/颏部塑形'],
  ['limb muscle properties', '肢体肌肉特性'],
  ['physical performance', '身体功能表现'],
  ['lung transplant recipients', '肺移植受者'],
  ['transcranial neuromodulation', '经颅神经调控'],
  ['learning and decision-making', '学习和决策'],
  ['near infrared stimulation', '近红外刺激'],
  ['respiratory syncytial virus candidate', '呼吸道合胞病毒候选疫苗'],
  ['lipid nanoparticle based formulation', '脂质纳米颗粒制剂'],
  ['stem cell transplant', '干细胞移植'],
  ['nausea and vomiting', '恶心和呕吐'],
  ['blood collection', '血液样本采集'],
  ['real world evidence study', '真实世界证据研究'],
  ['real-world evidence study', '真实世界证据研究'],
  ['social determinants of health', '健康社会决定因素'],
  ['cognitive function', '认知功能'],
  ['hepatic impairment', '肝功能损害'],
  ['normal hepatic function', '肝功能正常'],
  ['reactogenicity', '反应原性'],
  ['immunogenicity', '免疫原性'],
  ['dyslipidemia', '血脂异常'],
  ['localized prostate cancer', '局限性前列腺癌'],
  ['active surveillance', '主动监测'],
  ['hand recovery', '手功能恢复'],
  ['hemiparetic cerebral palsied children', '偏瘫型脑瘫儿童'],
  ['heart rate variability biofeedback training', '心率变异性生物反馈训练'],
  ['autonomic nervous system modulation', '自主神经系统调节'],
  ['resonant frequency breathing', '共振频率呼吸'],
  ['insulin deprivation', '胰岛素剥夺'],
  ['hyperglycemia', '高血糖'],
  ['plasma protein synthesis', '血浆蛋白合成'],
  ['people with', '患有'],
  ['individuals with', '患有'],
  ['participants with', '伴有'],
  ['subjects with', '伴有'],
  ['adults aged', '成人，年龄'],
  ['years of age', '岁'],
  ['years old', '岁'],
  ['older', '以上'],
  ['candidate', '候选制剂'],
  ['encapsulated', '包封'],
  ['formulation', '制剂'],
  ['screening', '筛查'],
  ['impact', '影响'],
  ['effect', '影响'],
  ['effects', '影响'],
  ['developing', '开发'],
  ['new technique', '新技术'],
  ['product', '产品'],
  ['pilot intervention', '试点干预'],
  ['recipient', '受者'],
  ['recipients', '受者'],
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
  ['NSCLC', '非小细胞肺癌'],
  ['SCLC', '小细胞肺癌'],
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
  ['vs.', '对比'],
  ['randomized controlled trial', '随机对照试验'],
  ['randomized controlled', '随机对照'],
  ['aims to compare', '旨在比较'],
  ['analgesic efficacy', '镇痛效果'],
  ['analgesic effects', '镇痛效果'],
  ['analgesic requirement', '镇痛药物使用需求'],
  ['undergoing surgery', '接受手术'],
  ['undergoing', '接受'],
  ['post-operative', '术后'],
  ['postoperative', '术后'],
  ['landmark technique', '解剖标志定位技术'],
  ['pediatric surgeons', '儿科外科医生'],
  ['groin skin crease incision', '腹股沟皮肤皱褶切口'],
  ['rescue analgesia', '补救性镇痛'],
  ['pain score', '疼痛评分'],
  ['severe pain', '重度疼痛'],
  ['intravenous paracetamol suspension', '静脉注射对乙酰氨基酚混悬液'],
  ['body weight', '体重'],
  ['dose of', '剂量为'],
  ['male and female', '男性和女性'],
  ['aged', '年龄为'],
  ['classified as', '分为'],
  ['American Society of Anesthesiologists', '美国麻醉医师协会'],
  ['classes', '级'],
  ['recurrent', '复发性'],
  ['bilateral', '双侧'],
  ['complicated', '复杂性'],
  ['obstructed', '梗阻性'],
  ['hernias', '疝'],
  ['bleeding disorders', '出血性疾病'],
  ['presence of', '存在'],
  ['congenital anomalies', '先天性畸形'],
  ['spine', '脊柱'],
  ['drug allergy', '药物过敏'],
  ['injection site', '注射部位'],
  ['respiratory and limb muscle properties', '呼吸肌和肢体肌肉特性'],
  ['respiratory and limb muscle structure and function', '呼吸肌和肢体肌肉结构及功能'],
  ['respiratory muscle strength', '呼吸肌力'],
  ['limb muscle strength', '肢体肌力'],
  ['physical performance', '身体功能'],
  ['lung transplantation', '肺移植'],
  ['lung transplant', '肺移植'],
  ['postoperative day', '术后第'],
  ['hospital discharge', '出院'],
  ['medical record', '病历'],
  ['ultrasound imaging', '超声影像检查'],
  ['ultrasonography', '超声检查'],
  ['muscle thickness', '肌肉厚度'],
  ['muscle structure', '肌肉结构'],
  ['muscle function', '肌肉功能'],
  ['handgrip strength', '握力'],
  ['knee extension strength', '膝关节伸展肌力'],
  ['physical performance measures', '身体功能指标'],
  ['patient-reported outcomes', '患者报告结局'],
  ['clinical frailty scale', '临床衰弱量表'],
  ['frailty', '衰弱'],
  ['dyspnea', '呼吸困难'],
  ['fatigue', '疲劳'],
  ['anxiety', '焦虑'],
  ['mechanical ventilation', '机械通气'],
  ['intensive care unit', '重症监护病房'],
  ['hospital length of stay', '住院时间'],
  ['time required', '所需时间'],
  ['repetitions', '重复动作次数'],
  ['sit-to-stand', '坐站'],
  ['numeric rating scale', '数字评分量表'],
  ['symptom burden', '症状负担'],
  ['baseline', '基线'],
  ['weekly', '每周'],
  ['through', '至'],
  ['from', '从'],
  ['after surgery', '术后'],
  ['at hospital discharge', '出院时'],
  ['within', '内'],
  ['first', '最初'],
  ['hours', '小时'],
  ['hour', '小时'],
  ['postoperative', '术后'],
  ['and', '和'],
  ['or', '或'],
  ['the', ''],
  ['this', '本'],
  ['study', '研究'],
  ['trial', '试验'],
  ['aims', '旨在'],
  ['will', '将'],
  ['be', '被'],
  ['is', '是'],
  ['are', '是'],
  ['of', '的'],
  ['with', '伴有'],
  ['in', '在'],
  ['for', '用于'],
  ['to', '至'],
  ['patients', '患者'],
  ['participants', '受试者'],
  ['subjects', '受试者'],
  ['individuals', '人群'],
  ['people', '人群'],
  ['using', '使用'],
  ['assessed', '评估'],
  ['assessment', '评估'],
  ['assessments', '评估'],
  ['measured', '测量'],
  ['obtained', '获得'],
  ['collect', '收集'],
  ['collected', '收集'],
  ['information', '信息'],
  ['regarding', '关于'],
  ['including', '包括'],
  ['receive', '接受'],
  ['received', '接受'],
  ['provide', '提供'],
  ['higher', '更高'],
  ['lower', '更低'],
  ['greater', '更大'],
  ['worse', '更差'],
  ['better', '更好'],
  ['normal', '正常'],
  ['specific', '具体'],
  ['common', '常见'],
  ['related', '相关'],
  ['associated', '相关'],
  ['following', '随后'],
  ['during', '期间'],
  ['before', '之前'],
  ['after', '之后'],
  ['once', '一次'],
  ['each', '每次'],
  ['day', '天'],
  ['days', '天'],
  ['week', '周'],
  ['weeks', '周'],
  ['month', '个月'],
  ['months', '个月'],
  ['year', '年'],
  ['years', '年'],
  ['hours', '小时']
]

const SENTENCE_PATTERNS = [
  [/^(.+?)\s+v\/s\s+(.+?)\s+for\s+pain\s+control\s+in\s+pediatric\s+patients\s+after\s+operation\s+for\s+(.+?)\.?$/i, '比较 $1 与 $2 用于儿童患者 $3 术后疼痛控制的研究'],
  [/^effects?\s+of\s+(.+?)\s+on\s+(.+?)\s+in\s+(.+?)\.?$/i, '评估 $1 对 $3 中 $2 的影响'],
  [/^effect\s+of\s+(.+?)\s+on\s+(.+?)\s+and\s+(.+?)\s+in\s+(.+?)\.?$/i, '评估 $1 对 $4 中 $2 和 $3 的影响'],
  [/^electrical\s+brain\s+stimulation\s+for\s+treatment\s+of\s+(.+?)\s+in\s+(.+?)\.?$/i, '脑电刺激用于治疗 $2 相关 $1 的研究'],
  [/^new\s+technique\s+and\s+product\s+for\s+(.+?)\.?$/i, '用于 $1 的新技术和产品研究'],
  [/^developing\s+(.+?)\s+protocols\s+for\s+(.+?)\.?$/i, '开发用于 $2 的 $1 方案'],
  [/^a\s+phase\s+([ivx0-9/]+)\s+study\s+of\s+(.+?)\s+in\s+(.+?)\.?$/i, '一项 $1 期研究，评估 $2 用于 $3'],
  [/^study\s+of\s+(.+?)\s+in\s+(.+?)\.?$/i, '一项关于 $1 用于 $2 的研究'],
  [/^a\s+clinical\s+study\s+of\s+(.+?)\s+in\s+(.+?)\.?$/i, '一项关于 $1 用于 $2 的临床研究'],
  [/^acupuncture\s+to\s+prevent\s+(.+?)\s+after\s+(.+?)\.?$/i, '针灸用于预防 $2 后 $1 的研究'],
  [/^(.+?)\s+real\s+world\s+evidence\s+study\.?$/i, '$1 真实世界证据研究'],
  [/^(.+?)\s+blood\s+collection\.?$/i, '$1 血液样本采集研究'],
  [/^an?\s+open-label,\s+single-arm\s+study\s+to\s+investigate\s+the\s+efficacy\s+and\s+safety\s+of\s+(.+?)\.?$/i, '一项开放标签、单臂研究，旨在评估 $1 的有效性和安全性。'],
  [/^an?\s+open-label,\s+single-arm\s+study\s+to\s+evaluate\s+the\s+efficacy\s+and\s+safety\s+of\s+(.+?)\.?$/i, '一项开放标签、单臂研究，旨在评估 $1 的有效性和安全性。'],
  [/^an?\s+open-label\s+study\s+to\s+investigate\s+the\s+efficacy\s+and\s+safety\s+of\s+(.+?)\.?$/i, '一项开放标签研究，旨在评估 $1 的有效性和安全性。'],
  [/^an?\s+single-arm\s+study\s+to\s+investigate\s+the\s+efficacy\s+and\s+safety\s+of\s+(.+?)\.?$/i, '一项单臂研究，旨在评估 $1 的有效性和安全性。'],
  [/^an?\s+(.+?)\s+study\s+to\s+investigate\s+the\s+efficacy\s+and\s+safety\s+of\s+(.+?)\.?$/i, '一项$1研究，旨在评估 $2 的有效性和安全性。'],
  [/^a study of (.+) in (.+)$/i, '一项关于 $1 用于 $2 的研究'],
  [/^a study to evaluate (.+)$/i, '一项评估 $1 的研究'],
  [/^a study to investigate (.+)$/i, '一项研究，旨在评估 $1'],
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
  const exact = EXACT_TRANSLATIONS.find(([english]) => normalizeSpaces(english).toLowerCase() === normalized)
  if (exact) return exact[1]
  const match = PHRASES.find(([english]) => normalizeSpaces(english).toLowerCase() === normalized)
  return match?.[1] || ''
}

function hasIncompleteCommonEnglish(text) {
  const tokens = String(text || '').match(/[A-Za-z]{3,}/g) || []
  return tokens.some((token) => {
    if (SAFE_CLINICAL_TOKENS.has(token)) return false
    if (/^[A-Z]{3,}$/.test(token)) return false
    return true
  })
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
    .map((line) => translateSegment(line.replace(/^[-*•]\s+/, '').replace(/^\d+[.)]\s+/, '')))
    .filter(Boolean)
    .join('\n')

  if (!translated || translated.toLowerCase() === normalizeSpaces(text).toLowerCase()) return ''
  if (!exactPhraseTranslation(text) && hasIncompleteCommonEnglish(translated)) return ''
  return translated.length > maxChars ? `${translated.slice(0, maxChars)}...` : translated
}

export function inlineChineseName(value) {
  const source = String(value || '').trim()
  const translated = exactPhraseTranslation(source) || chineseReference(source, { maxChars: 80 })
  if (!translated || translated === source) return source
  return `${source}（${translated}）`
}
