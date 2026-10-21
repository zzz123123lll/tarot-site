// 由 scripts/build-rubrics.mjs 自动生成，不要手改。
// 来源：站点 content/levels/*.json 的 exercise.criteria
// 重新生成：node scripts/build-rubrics.mjs "<site-work 目录>"
// 生成时间：2026-10-21
// 关卡数：36

export const generatedRubrics = {

  "agents-01": {
    title: "Agent 核心循环与框架选型(Lessons 01‒03: Intro, Frameworks & Patterns)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "明确写出 Agent 的四步 ReAct 推理轨迹模板:Though…",
        weight: 4.5,
        need: "明确写出 Agent 的四步 ReAct 推理轨迹模板:Thought → Action → Observation → Final Decision (4.5 分)",
        cues: [
          "thought",
          "action",
          "observation",
          "final decision"
        ],
        groups: 4
      },
      {
        id: "c2",
        title: "定义清晰的触发条件(差价 ≥ 200 元且扣除改签手续费后净省 > …",
        weight: 4,
        need: "定义清晰的触发条件(差价 ≥ 200 元且扣除改签手续费后净省 > 0 元)(4 分)",
        cues: [
          "差价",
          "200",
          "净省",
          "手续费"
        ],
        groups: 2
      },
      {
        id: "c3",
        title: "设置防死循环与异常熔断规则(如查询接口连续失败 2 次或总步数达 4…",
        weight: 4,
        need: "设置防死循环与异常熔断规则(如查询接口连续失败 2 次或总步数达 4 步立即停止并告警)(4 分)",
        cues: [
          "死循环",
          "熔断",
          "失败",
          "2 次",
          "停止",
          "告警"
        ],
        groups: 3
      }
    ]
  },
  "agents-02": {
    title: "工具调用设计模式(Lesson 04: Tool Use Design Pattern)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "编写完整的 OpenAI/Pydantic 兼容 JSON Sche…",
        weight: 4.5,
        need: "编写完整的 OpenAI/Pydantic 兼容 JSON Schema,包含工具名、详细调用前提说明(description) 与 required 必填字段列表(4.5 分)",
        cues: [
          "json schema",
          "description",
          "required"
        ],
        groups: 3
      },
      {
        id: "c2",
        title: "为 order_id、refund_amount_cny(设定单笔上…",
        weight: 5,
        need: "为 order_id、refund_amount_cny(设定单笔上限说明)、reason_category(设定枚举值 enum)三个参数 提供精确类型与业务约束(5 分)",
        cues: [
          "order_id",
          "refund_amount_cny",
          "reason_category",
          "enum"
        ],
        groups: 4
      },
      {
        id: "c3",
        title: "设计当参数校验失败时返回给 Agent 的结构化错误提示格式,引导 …",
        weight: 3,
        need: "设计当参数校验失败时返回给 Agent 的结构化错误提示格式,引导 Agent 向用戶追问缺失信息而非盲 目报错(3 分)。 第二阶段:核心能力篇(第 3‒4 关)——目标规划拆解与智能体记忆系统",
        cues: [
          "结构化错误",
          "error",
          "追问",
          "缺失"
        ],
        groups: 2
      }
    ]
  },
  "agents-03": {
    title: "任务规划与动态拆解模式(Lesson 07: Planning Design Pattern)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "设计 Planner 输出的结构化 JSON 计划表格式,每个子任务…",
        weight: 5,
        need: "设计 Planner 输出的结构化 JSON 计划表格式,每个子任务需包含 step_id、tool_name、depends_on (前置依赖数组)与 expected_output(5 分)",
        cues: [
          "json",
          "step_id",
          "tool_name",
          "depends_on",
          "expected_output"
        ],
        groups: 5
      },
      {
        id: "c2",
        title: "准确区分并行阶段(工商信息查询、新闻检索、官网产品抓取互不依赖,可并…",
        weight: 4.5,
        need: "准确区分并行阶段(工商信息查询、新闻检索、官网产品抓取互不依赖,可并发执行)与串行汇总阶 段(4.5 分)",
        cues: [
          "并行",
          "串行"
        ],
        groups: 2
      },
      {
        id: "c3",
        title: "设计动态重规划分支:若第一步工商核查发现该公司“已注销或被列为失信被…",
        weight: 3,
        need: "设计动态重规划分支:若第一步工商核查发现该公司“已注销或被列为失信被执行人”,立即终止后续 新闻检索并直接输出⻛险拦截报告(3 分)",
        cues: [
          "重规划",
          "replan",
          "注销",
          "失信",
          "终止",
          "拦截"
        ],
        groups: 3
      }
    ]
  },
  "agents-04": {
    title: "智能体检索与分层记忆管理(Lessons 05 & 13: Agentic RAG & Agent Memory)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "设计检索分流逻辑:从【长期用戶画像记忆库】读取用戶的历史⻛险等级与持…",
        weight: 4.5,
        need: "设计检索分流逻辑:从【长期用戶画像记忆库】读取用戶的历史⻛险等级与持仓偏好,同时通过【主 动文档检索工具】查询今日新基金招募说明书(4.5 分)",
        cues: [
          "长期",
          "画像",
          "记忆",
          "检索",
          "招募说明书"
        ],
        groups: 2
      },
      {
        id: "c2",
        title: "设计 Agentic RAG 自检判定规则:若首次检索仅拿到基金名称…",
        weight: 5,
        need: "设计 Agentic RAG 自检判定规则:若首次检索仅拿到基金名称而缺少“最大回撤、久期、信用评级分 布”关键字段,自动生成二次精准检索词(5 分)",
        cues: [
          "二次检索",
          "重新检索",
          "最大回撤",
          "久期",
          "信用评级"
        ],
        groups: 2
      },
      {
        id: "c3",
        title: "设计对话结束后的记忆更新机制(Memory Write-back):…",
        weight: 3,
        need: "设计对话结束后的记忆更新机制(Memory Write-back):判断本次对话中哪些新信息值得写入长期记 忆,哪些仅保留在短期会话中(3 分)。 第三阶段:进阶编排篇(第 5‒6 关)——元认知自我反思与多智能体协同",
        cues: [
          "写回",
          "write-back",
          "更新记忆",
          "长期",
          "短期"
        ],
        groups: 2
      }
    ]
  },
  "agents-05": {
    title: "元认知与自我反思机制(Lesson 09: Metacognition Design Pattern)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "设计 Generator → Validator → Refiner…",
        weight: 4,
        need: "设计 Generator → Validator → Refiner 三步元认知工作流(4 分)",
        cues: [
          "generator",
          "validator",
          "refiner"
        ],
        groups: 3
      },
      {
        id: "c2",
        title: "在 Validator 阶段同时设置【确定性规则检查】(如拦截 DR…",
        weight: 5.5,
        need: "在 Validator 阶段同时设置【确定性规则检查】(如拦截 DROP/DELETE/UPDATE、强制检查是否包含 LIMIT 与分区日期过滤)与【语义对⻬检查】(核对是否遗漏业务口径)(5.5 分)",
        cues: [
          "drop",
          "delete",
          "update",
          "limit",
          "日期",
          "分区",
          "语义",
          "业务口径"
        ],
        groups: 4
      },
      {
        id: "c3",
        title: "定义带着数据库报错堆栈(Error Traceback)回传给 Re…",
        weight: 3,
        need: "定义带着数据库报错堆栈(Error Traceback)回传给 Refiner 的结构化修复模板与最大重试上限(3 分)",
        cues: [
          "traceback",
          "报错",
          "重试",
          "上限"
        ],
        groups: 2
      }
    ]
  },
  "agents-06": {
    title: "多智能体协作编排模式(Lesson 08: Multi-Agent Design Pattern)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "明确定义 4 个子智能体的专属名称、唯一职责边界与各自挂载的独立工具…",
        weight: 5,
        need: "明确定义 4 个子智能体的专属名称、唯一职责边界与各自挂载的独立工具集(严禁工具跨角色混用) (5 分)",
        cues: [
          "4 个",
          "四个",
          "子智能体",
          "职责",
          "工具"
        ],
        groups: 4
      },
      {
        id: "c2",
        title: "设计各 Agent 之间传递的结构化交接数据包(State Payl…",
        weight: 4.5,
        need: "设计各 Agent 之间传递的结构化交接数据包(State Payload / Handoff Schema),避免把冗长的无关 思考过程传给下游(4.5 分)",
        cues: [
          "handoff",
          "交接",
          "schema",
          "payload"
        ],
        groups: 2
      },
      {
        id: "c3",
        title: "设计“一票否决回退机制”:若合规⻛控 Agent 发现外观专利侵权⻛…",
        weight: 3,
        need: "设计“一票否决回退机制”:若合规⻛控 Agent 发现外观专利侵权⻛险,如何直接打回选品阶段而非继 续生成详情页(3 分)。 第四阶段:生产落地篇(第 7‒8 关)——标准化协议、上下文工程与安全护栏",
        cues: [
          "一票否决",
          "回退",
          "专利",
          "侵权",
          "打回",
          "选品"
        ],
        groups: 3
      }
    ]
  },
  "agents-07": {
    title: "智能体通信协议与上下文工程(Lessons 11‒12: Protocols & Context Engineering)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "制定工具返回值的【入窗截断与摘要规则】(如超过 1,000 字符的原…",
        weight: 5,
        need: "制定工具返回值的【入窗截断与摘要规则】(如超过 1,000 字符的原始日志先提取错误码与关键堆栈 行,原始全量文件仅存本地路径引用)(5 分)",
        cues: [
          "截断",
          "摘要",
          "1000",
          "1,000",
          "错误码",
          "堆栈",
          "路径",
          "引用"
        ],
        groups: 4
      },
      {
        id: "c2",
        title: "设计历史轮次的【滑动窗口 + 里程碑状态压缩(State Compa…",
        weight: 4.5,
        need: "设计历史轮次的【滑动窗口 + 里程碑状态压缩(State Compaction)】策略,保留已验证结论、丢弃冗 余试错过程(4.5 分)",
        cues: [
          "滑动窗口",
          "压缩",
          "compaction",
          "结论",
          "试错"
        ],
        groups: 3
      },
      {
        id: "c3",
        title: "说明如何利用子智能体上下文隔离(Sub-agent Context …",
        weight: 3,
        need: "说明如何利用子智能体上下文隔离(Sub-agent Context Isolation)让主控 Agent 只接收最终 200 字 排查结论(3 分)",
        cues: [
          "子智能体",
          "隔离",
          "200 字",
          "200字"
        ],
        groups: 2
      }
    ]
  },
  "agents-08": {
    title: "可信护栏与生产级安全架构(Lessons 06, 10, 18: Trustworthy & Securing AI Agents)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "将 Agent 的全部工具划分为【L1 自动执行级】、【L2 需人类…",
        weight: 4.5,
        need: "将 Agent 的全部工具划分为【L1 自动执行级】、【L2 需人类确认级(HITL)】与【L3 严禁外发敏感数据 级】三档(4.5 分)",
        cues: [
          "l1",
          "l2",
          "hitl",
          "l3"
        ],
        groups: 3
      },
      {
        id: "c2",
        title: "设计针对外部邮件内容的【数据与指令硬隔离 + 出站收件人白名单校验】…",
        weight: 5,
        need: "设计针对外部邮件内容的【数据与指令硬隔离 + 出站收件人白名单校验】机制,彻底阻断钓⻥邮件的 跨工具数据窃取(5 分)",
        cues: [
          "隔离",
          "指令",
          "白名单",
          "钓鱼",
          "注入"
        ],
        groups: 3
      },
      {
        id: "c3",
        title: "设计当触发 L2 高⻛险操作时,向人类用戶展示的【待审批确认卡片】核…",
        weight: 3,
        need: "设计当触发 L2 高⻛险操作时,向人类用戶展示的【待审批确认卡片】核心字段(操作类型、目标对 象、影响范围、批准/拒绝按钮)(3 分)。 全关卡标准",
        cues: [
          "审批",
          "确认卡片",
          "操作类型",
          "目标对象",
          "影响范围",
          "批准",
          "拒绝"
        ],
        groups: 5
      }
    ]
  },
  "llm-01": {
    title: "现代 LLM 架构与解码采样策略(Scientist 1: LLM Architecture & Decoding)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "分别为上述三个场景配置最优的 temperature、top_p、r…",
        weight: 6,
        need: "分别为上述三个场景配置最优的 temperature、top_p、repetition_penalty 参数组合并说明理由(6 分)",
        cues: [
          "医疗",
          "medical",
          "temperature",
          "0.0",
          "temp=0",
          "小说",
          "creative",
          "0.85",
          "算法",
          "pass@5",
          "n=5",
          "n = 5"
        ],
        groups: 6
      },
      {
        id: "c2",
        title: "解释为什么在医疗 JSON 提取场景中,通常建议“调低 temper…",
        weight: 3.5,
        need: "解释为什么在医疗 JSON 提取场景中,通常建议“调低 temperature 或调小 top_p 二选一”,而不建议 同时将两者设得极度激进(3.5 分)",
        cues: [
          "temperature",
          "top_p",
          "极端",
          "双重",
          "同时"
        ],
        groups: 3
      },
      {
        id: "c3",
        title: "简述 GQA(Grouped-Query Attention)相比传…",
        weight: 3,
        need: "简述 GQA(Grouped-Query Attention)相比传统多头注意力(MHA)是如何节省推理阶段 KV Cache 显存的(3 分)",
        cues: [
          "gqa",
          "分组查询",
          "kv cache",
          "kv",
          "共享",
          "1/4",
          "四分之一"
        ],
        groups: 3
      }
    ]
  },
  "llm-02": {
    title: "后训练数据集构建与对话模板映射(Scientist 3: Post-Training Datasets)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "将该样本重构为包含 system、user、assistant 三角…",
        weight: 4.5,
        need: "将该样本重构为包含 system、user、assistant 三角色的 ShareGPT/OpenAI 标准 JSON 数组格式(4.5 分)",
        cues: [
          "system",
          "user",
          "assistant",
          "messages",
          "json"
        ],
        groups: 4
      },
      {
        id: "c2",
        title: "写出映射为 ChatML 模板后的完整纯文本字符串(必须显式包含 <…",
        weight: 4.5,
        need: "写出映射为 ChatML 模板后的完整纯文本字符串(必须显式包含 <|im_start|> 与 <|im_end|> 特殊标记) (4.5 分)",
        cues: [
          "im_start",
          "im_end",
          "eos",
          "结束符"
        ],
        groups: 3
      },
      {
        id: "c3",
        title: "列出将数据集送入 SFTTrainer 前必做的 3 项数据清洗检查…",
        weight: 3.5,
        need: "列出将数据集送入 SFTTrainer 前必做的 3 项数据清洗检查(如近重复去重 MinHash、长度截断检查、 低质回复过滤)(3.5 分)。 第二阶段:微调核心篇(第 3‒4 关)——LoRA/QLoRA 高效微调与训练曲线排障",
        cues: [
          "去重",
          "minhash",
          "截断",
          "长度",
          "max_seq_length",
          "completion-only",
          "-100"
        ],
        groups: 3
      }
    ]
  },
  "llm-03": {
    title: "LoRA 与 QLoRA 高效参数微调实战(Scientist 4: Supervised Fine-Tuning)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "写出完整的 LoRA 配置字典(含 r、lora_alpha、tar…",
        weight: 5,
        need: "写出完整的 LoRA 配置字典(含 r、lora_alpha、target_modules 全 7 层挂载及 use_gradient_checkpointing)(5 分)",
        cues: [
          "r",
          "rank",
          "lora_alpha",
          "alpha",
          "target_modules",
          "q_proj",
          "k_proj",
          "gradient_checkpointing"
        ],
        groups: 4
      },
      {
        id: "c2",
        title: "通过调整 per_device_train_batch_size 与…",
        weight: 4.5,
        need: "通过调整 per_device_train_batch_size 与 gradient_accumulation_steps,在单步仅占极小显存的前提 下实现等效 Batch Size = 16(4.5 分)",
        cues: [
          "batch_size",
          "gradient_accumulation",
          "16"
        ],
        groups: 3
      },
      {
        id: "c3",
        title: "指定兼顾省显存与稳定性的优化器(如 adamw_8bit)、学习率(…",
        weight: 3,
        need: "指定兼顾省显存与稳定性的优化器(如 adamw_8bit)、学习率(如 2e-4)与训练轮数 (num_train_epochs)(3 分)",
        cues: [
          "adamw_8bit",
          "2e-4",
          "num_train_epochs",
          "epochs"
        ],
        groups: 3
      }
    ]
  },
  "llm-04": {
    title: "训练曲线诊断与过拟合排障(Training Monitoring & Loss Audit)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "针对实验1(过拟合),给出至少 3 项具体的参数调整或数据改进措施",
        weight: 4.5,
        need: "针对实验1(过拟合),给出至少 3 项具体的参数调整或数据改进措施(4.5 分)",
        cues: [
          "early stopping",
          "dropout",
          "weight decay",
          "epoch",
          "数据",
          "增强"
        ],
        groups: 3
      },
      {
        id: "c2",
        title: "针对实验2(开局梯度爆炸 NaN),从学习率调度(Warmup)、梯…",
        weight: 4.5,
        need: "针对实验2(开局梯度爆炸 NaN),从学习率调度(Warmup)、梯度裁剪(max_grad_norm)与脏数据 排查三个角度给出修复方案(4.5 分)",
        cues: [
          "warmup",
          "max_grad_norm",
          "梯度裁剪",
          "nan",
          "inf",
          "脏数据"
        ],
        groups: 3
      },
      {
        id: "c3",
        title: "针对实验3,从“SFT 与 RAG 的职责边界”角度解释为什么用 5…",
        weight: 3.5,
        need: "针对实验3,从“SFT 与 RAG 的职责边界”角度解释为什么用 500 条问答微调记不住精确价格表,并 给出正确架构建议(3.5 分)。 第三阶段:对⻬与融合篇(第 5‒6 关)——偏好对⻬(DPO/GRPO)、模型融合 与科学评测",
        cues: [
          "sft",
          "微调",
          "rag",
          "检索",
          "新事实",
          "实时",
          "价格表"
        ],
        groups: 3
      }
    ]
  },
  "llm-05": {
    title: "人类偏好对⻬ DPO、ORPO 与 GRPO(Scientist 5: Preference Alignment)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "编写一条标准的 DPO 训练数据 JSON 样本,包含 prompt…",
        weight: 5,
        need: "编写一条标准的 DPO 训练数据 JSON 样本,包含 prompt、chosen(干脆利落直奔主题的回答)与 rejected(充满 AI 套话与端水说教的回答)(5 分)",
        cues: [
          "prompt",
          "chosen",
          "rejected"
        ],
        groups: 3
      },
      {
        id: "c2",
        title: "说明为什么 DPO 的学习率(如 5e-6)必须比 SFT 阶段(2…",
        weight: 4.5,
        need: "说明为什么 DPO 的学习率(如 5e-6)必须比 SFT 阶段(2e-4)小一到两个数量级,并解释温度超参数 beta(通常取 0.1)的作用(4.5 分)",
        cues: [
          "5e-6",
          "学习率",
          "beta",
          "0.1"
        ],
        groups: 2
      },
      {
        id: "c3",
        title: "对比说明什么场景该选 DPO、什么场景该选基于规则奖励的 GRPO",
        weight: 3,
        need: "对比说明什么场景该选 DPO、什么场景该选基于规则奖励的 GRPO(3 分)",
        cues: [
          "dpo",
          "grpo",
          "规则奖励",
          "组内",
          "可验证"
        ],
        groups: 3
      }
    ]
  },
  "llm-06": {
    title: "模型权重融合(MergeKit)与评测防污染(Scientist 6 & 8: Evaluation & Merging)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "编写一份采用 dare_ties 或 slerp 方法的 Merge…",
        weight: 5,
        need: "编写一份采用 dare_ties 或 slerp 方法的 MergeKit YAML 核心配置结构(包含基座模型声明、待融合模 型路径、density 与 weight 权重分配)(5 分)",
        cues: [
          "mergekit",
          "yaml",
          "dare_ties",
          "slerp",
          "density",
          "weight"
        ],
        groups: 5
      },
      {
        id: "c2",
        title: "指出使用 GPT-6 Sol / Claude Opus 5.5 作…",
        weight: 4,
        need: "指出使用 GPT-6 Sol / Claude Opus 5.5 作为 LLM-as-a-Judge 评测两个模型胜率(Win Rate)时的三 大常见偏见(位置偏见、长度偏见、自我偏好偏见)(4 分)",
        cues: [
          "位置偏见",
          "长度偏见",
          "自我偏好",
          "self-preference"
        ],
        groups: 3
      },
      {
        id: "c3",
        title: "设计消除上述裁判偏见的实操对策(如正反交换 AB 顺序双次打分、字数…",
        weight: 3.5,
        need: "设计消除上述裁判偏见的实操对策(如正反交换 AB 顺序双次打分、字数归一化约束、构建业务私有黄 金测试集)(3.5 分)。 第四阶段:量化与部署篇(第 7‒8 关)——低比特量化压缩与 vLLM 高并发推理 服务",
        cues: [
          "交换",
          "ab",
          "顺序",
          "归一",
          "字数",
          "私有",
          "黄金",
          "测试集"
        ],
        groups: 3
      }
    ]
  },
  "llm-07": {
    title: "低比特模型量化实战(Scientist 7: Quantization ― GGUF, AWQ & GPTQ)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "写出大模型推理总显存占用的快速估算公式(模型权重显存 + KV Ca…",
        weight: 5.5,
        need: "写出大模型推理总显存占用的快速估算公式(模型权重显存 + KV Cache 动态显存 + 激活值开销),并 分别计算 8B 与 32B 模型在 FP16 与 4-bit 量化下的权重显存大小(5.5 分)",
        cues: [
          "权重显存",
          "参数",
          "2 字节",
          "kv cache",
          "fp16",
          "4-bit",
          "0.5"
        ],
        groups: 4
      },
      {
        id: "c2",
        title: "分别为环境1(Mac 本地离线)和环境2(单卡 24GB 4090 …",
        weight: 4.5,
        need: "分别为环境1(Mac 本地离线)和环境2(单卡 24GB 4090 跑 32B 模型)指定最匹配的量化格式、推 荐量化档位及运行引擎(4.5 分)",
        cues: [
          "gguf",
          "llama.cpp",
          "mac",
          "awq",
          "gptq",
          "24gb",
          "4090"
        ],
        groups: 3
      },
      {
        id: "c3",
        title: "说明为什么做 AWQ/GPTQ 4-bit 量化时需要提供一个校准数…",
        weight: 2.5,
        need: "说明为什么做 AWQ/GPTQ 4-bit 量化时需要提供一个校准数据集(Calibration Dataset),且校准集应 如何选取(2.5 分)",
        cues: [
          "校准",
          "calibration",
          "数据",
          "样本"
        ],
        groups: 2
      }
    ]
  },
  "llm-08": {
    title: "vLLM 高吞吐生产级部署(The LLM Engineer: vLLM & Production Serving)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "写出完整的 vllm serve 启动命令及核心生产参数(含量化格式…",
        weight: 5.5,
        need: "写出完整的 vllm serve 启动命令及核心生产参数(含量化格式、最大上下文长度限制、GPU 显存预留 比例、前缀缓存开关与多 LoRA 模块路径映射)(5.5 分)",
        cues: [
          "vllm serve",
          "awq",
          "max-model-len",
          "gpu-memory-utilization",
          "prefix-caching",
          "lora-modules"
        ],
        groups: 6
      },
      {
        id: "c2",
        title: "写出客戶端通过标准 OpenAI Python SDK 指定调用其中…",
        weight: 3.5,
        need: "写出客戶端通过标准 OpenAI Python SDK 指定调用其中“法务审查 LoRA”的请求代码(3.5 分)",
        cues: [
          "openai",
          "client",
          "model",
          "base_url"
        ],
        groups: 4
      },
      {
        id: "c3",
        title: "明确定义生产压测必看的三大核心性能指标:TTFT(首 Token 延…",
        weight: 3.5,
        need: "明确定义生产压测必看的三大核心性能指标:TTFT(首 Token 延迟)、TPOT / ITL(Token 间生成延 迟) 与 Throughput(系统总吞吐 tokens/s) 的含义与达标基线(3.5 分)。 全关卡标准",
        cues: [
          "ttft",
          "tpot",
          "itl",
          "throughput",
          "吞吐"
        ],
        groups: 3
      }
    ]
  },
  "neigong-01": {
    title: "大语言模型底层运作原理",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "token 分词与 token id",
        weight: 20,
        need: "这一册只解决一件事：把大模型的黑盒拆成四层——分词、向量、注意力、采样。看懂后，计数、幻觉、随机性都能解释",
        cues: [
          "token",
          "分词"
        ],
        groups: 1
      },
      {
        id: "c2",
        title: "self-attention 机制",
        weight: 20,
        need: "这一册只解决一件事：把大模型的黑盒拆成四层——分词、向量、注意力、采样。看懂后，计数、幻觉、随机性都能解释",
        cues: [
          "attention",
          "注意力",
          "self-attention"
        ],
        groups: 1
      },
      {
        id: "c3",
        title: "temperature 与 top-p 采样",
        weight: 20,
        need: "这一册只解决一件事：把大模型的黑盒拆成四层——分词、向量、注意力、采样。看懂后，计数、幻觉、随机性都能解释",
        cues: [
          "temperature",
          "top-p",
          "采样"
        ],
        groups: 1
      }
    ]
  },
  "neigong-02": {
    title: "提示词工程科学",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "条件概率窄化",
        weight: 20,
        need: "这一册只解决一件事：提示词不是咒语，而是用条件把模型散漫的概率分布收窄到专业子空间",
        cues: [
          "条件概率",
          "概率",
          "条件"
        ],
        groups: 1
      },
      {
        id: "c2",
        title: "角色与 XML 边界",
        weight: 20,
        need: "这一册只解决一件事：提示词不是咒语，而是用条件把模型散漫的概率分布收窄到专业子空间",
        cues: [
          "角色",
          "xml",
          "边界"
        ],
        groups: 1
      },
      {
        id: "c3",
        title: "少样本与结构化控制",
        weight: 20,
        need: "这一册只解决一件事：提示词不是咒语，而是用条件把模型散漫的概率分布收窄到专业子空间",
        cues: [
          "少样本",
          "示例",
          "结构"
        ],
        groups: 1
      }
    ]
  },
  "neigong-03": {
    title: "深度推理模型与思维链机制",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "Test-Time Compute",
        weight: 20,
        need: "这一册只解决一件事：深度推理模型为什么“先想再答”，以及为什么旧的分步提示词不再适用",
        cues: [
          "test-time compute",
          "推理时计算",
          "测试时计算"
        ],
        groups: 1
      },
      {
        id: "c2",
        title: "CoT 思维链",
        weight: 20,
        need: "这一册只解决一件事：深度推理模型为什么“先想再答”，以及为什么旧的分步提示词不再适用",
        cues: [
          "cot",
          "思维链",
          "chain-of-thought"
        ],
        groups: 1
      },
      {
        id: "c3",
        title: "GRPO/R1 强化学习",
        weight: 20,
        need: "这一册只解决一件事：深度推理模型为什么“先想再答”，以及为什么旧的分步提示词不再适用",
        cues: [
          "grpo",
          "r1",
          "强化学习"
        ],
        groups: 1
      }
    ]
  },
  "neigong-04": {
    title: "上下文工程与幻觉控制",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "上下文窗口",
        weight: 20,
        need: "这一册只解决一件事：从“写好一句话”升级为“管理整个信息场”，包括窗口、缓存、记忆与幻觉",
        cues: [
          "context",
          "上下文",
          "窗口"
        ],
        groups: 1
      },
      {
        id: "c2",
        title: "Lost in the Middle",
        weight: 20,
        need: "这一册只解决一件事：从“写好一句话”升级为“管理整个信息场”，包括窗口、缓存、记忆与幻觉",
        cues: [
          "lost in the middle",
          "迷失中间",
          "中间"
        ],
        groups: 1
      },
      {
        id: "c3",
        title: "KV Cache 与幻觉",
        weight: 20,
        need: "这一册只解决一件事：从“写好一句话”升级为“管理整个信息场”，包括窗口、缓存、记忆与幻觉",
        cues: [
          "kv cache",
          "幻觉",
          "hallucination"
        ],
        groups: 1
      }
    ]
  },
  "rag-01": {
    title: "向量表示与余弦相似度基础(Module 1: CosineExplorer)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "正确写出包含 L2 范数(模长)归一化的余弦相似度计算公式并防范除零…",
        weight: 4.5,
        need: "正确写出包含 L2 范数(模长)归一化的余弦相似度计算公式并防范除零异常(4.5 分)",
        cues: [
          "l2",
          "范数",
          "np.linalg.norm",
          "norm",
          "余弦",
          "cosine",
          "similarity",
          "除零",
          "1e-10",
          "epsilon"
        ],
        groups: 3
      },
      {
        id: "c2",
        title: "加入最低相似度阈值过滤(min_score = 0.75),当所有候…",
        weight: 5,
        need: "加入最低相似度阈值过滤(min_score = 0.75),当所有候选文档得分均低于阈值时返回空列表而非强 行凑够 Top-K(5 分)",
        cues: [
          "阈值",
          "min_score",
          "0.75",
          "空列表",
          "返回空",
          "return []",
          "top_k",
          "top-k"
        ],
        groups: 2
      },
      {
        id: "c3",
        title: "按相似度从高到低排序并返回包含 {\"doc_id\", \"score\"…",
        weight: 3,
        need: "按相似度从高到低排序并返回包含 {\"doc_id\", \"score\", \"text\"} 的结构化列表(3 分)",
        cues: [
          "doc_id",
          "score",
          "text",
          "排序",
          "降序",
          "argsort",
          "[::-1]"
        ],
        groups: 4
      }
    ]
  },
  "rag-02": {
    title: "文档解析与黄金分块策略(Document Chunking & Overlap)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "设定分层切分优先级分隔符列表(优先按二级/三级标题、段落换行、句号切…",
        weight: 4.5,
        need: "设定分层切分优先级分隔符列表(优先按二级/三级标题、段落换行、句号切分,严禁在句子中间硬切) (4.5 分)",
        cues: [
          "分隔符",
          "标题",
          "段落",
          "句号"
        ],
        groups: 1
      },
      {
        id: "c2",
        title: "配置合理的 chunk_size(如 400‒600 字符)、chu…",
        weight: 4,
        need: "配置合理的 chunk_size(如 400‒600 字符)、chunk_overlap(如 60‒80 字符)及表格整体保留策略(4 分)",
        cues: [
          "chunk_size",
          "400",
          "600",
          "chunk_overlap",
          "60",
          "80",
          "表格"
        ],
        groups: 3
      },
      {
        id: "c3",
        title: "设计分块元数据注入模板:在每个 Chunk 文本开头自动拼接 【来源…",
        weight: 4,
        need: "设计分块元数据注入模板:在每个 Chunk 文本开头自动拼接 【来源文档:员工手册v2 | 所属章节:第 四章 > 4.2 病假薪资标准】(4 分)。 第二阶段:核心引擎篇(第 3‒4 关)——语义检索引擎、混合检索与重排序",
        cues: [
          "来源",
          "章节",
          "元数据",
          "chunk"
        ],
        groups: 1
      }
    ]
  },
  "rag-03": {
    title: "语义检索引擎构建(Module 2: SemanticSeek)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "设计文档入库(Upsert)时的三维结构:id、document_t…",
        weight: 4.5,
        need: "设计文档入库(Upsert)时的三维结构:id、document_text、embedding 与 metadata(含版本号、生效 状态 is_active、适用部门)(4.5 分)",
        cues: [
          "id",
          "document_text",
          "embedding",
          "metadata",
          "is_active"
        ],
        groups: 4
      },
      {
        id: "c2",
        title: "编写检索查询逻辑,在计算向量相似度前先通过 where={\"is_a…",
        weight: 5,
        need: "编写检索查询逻辑,在计算向量相似度前先通过 where={\"is_active\": True} 过滤掉历史废止文档(5 分)",
        cues: [
          "where",
          "is_active",
          "过滤"
        ],
        groups: 1
      },
      {
        id: "c3",
        title: "说明为什么查询向量(Query Embedding)与文档入库向量必…",
        weight: 3,
        need: "说明为什么查询向量(Query Embedding)与文档入库向量必须使用完全相同的 Embedding 模型与 归一化方式(3 分)",
        cues: [
          "同一个",
          "相同",
          "embedding 模型",
          "归一化"
        ],
        groups: 2
      }
    ]
  },
  "rag-04": {
    title: "混合检索与重排序优化(Hybrid Search & Cross-Encoder Reranking)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "写出标准 RRF(Reciprocal Rank Fusion)打分…",
        weight: 5.5,
        need: "写出标准 RRF(Reciprocal Rank Fusion)打分公式(含平滑常数 k = 60)及 Python 融合排序实现 (5.5 分)",
        cues: [
          "rrf",
          "k = 60",
          "k=60",
          "60",
          "公式"
        ],
        groups: 3
      },
      {
        id: "c2",
        title: "设计粗排(Recall Top-20)→ Reranker 精排(S…",
        weight: 4,
        need: "设计粗排(Recall Top-20)→ Reranker 精排(Select Top-4)的两阶段调用流程(4 分)",
        cues: [
          "粗排",
          "top-20",
          "重排",
          "reranker",
          "top-4"
        ],
        groups: 2
      },
      {
        id: "c3",
        title: "解释为什么不能直接用 Cross-Encoder Reranker …",
        weight: 3,
        need: "解释为什么不能直接用 Cross-Encoder Reranker 对全库 10 万篇文档做第一阶段暴力检索(3 分)。 第三阶段:生成演进篇(第 5‒6 关)——溯源生成闭环与多轮对话记忆",
        cues: [
          "cross-encoder",
          "全库",
          "10 万",
          "暴力"
        ],
        groups: 2
      }
    ]
  },
  "rag-05": {
    title: "核心 RAG 闭环与引用溯源控制(Module 3: SimpleRAG)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "用带 id 与 source 属性的 XML 标签(如 <conte…",
        weight: 4.5,
        need: "用带 id 与 source 属性的 XML 标签(如 <context id=\"1\" source=\"医保手册_p12.pdf\">)结构化封装检 索片段(4.5 分)",
        cues: [
          "context",
          "xml",
          "id",
          "source"
        ],
        groups: 3
      },
      {
        id: "c2",
        title: "强制规定输出中的每一个事实断言末尾必须紧跟 [来源X] 角标引用",
        weight: 4.5,
        need: "强制规定输出中的每一个事实断言末尾必须紧跟 [来源X] 角标引用(4.5 分)",
        cues: [
          "来源",
          "角标",
          "引用"
        ],
        groups: 1
      },
      {
        id: "c3",
        title: "规定当所有检索片段与问题无关时,直接输出固定拒答话术且不附带虚假引用",
        weight: 3.5,
        need: "规定当所有检索片段与问题无关时,直接输出固定拒答话术且不附带虚假引用(3.5 分)",
        cues: [
          "拒答",
          "无法",
          "无",
          "虚假引用"
        ],
        groups: 2
      }
    ]
  },
  "rag-06": {
    title: "多轮对话与查询改写(Module 4: ConvoRAG & Query Transformation)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "设计前置 Query Rewriter 提示词:结合历史对话 <ch…",
        weight: 4.5,
        need: "设计前置 Query Rewriter 提示词:结合历史对话 <chat_history> 与当前追问 <latest_question>,将含 代词“它”的句子改写为主语完整、可独立检索的句子(4.5 分)",
        cues: [
          "rewriter",
          "query",
          "历史",
          "chat_history",
          "代词",
          "它"
        ],
        groups: 3
      },
      {
        id: "c2",
        title: "针对“A 与 B 有什么区别”这类对比型问题,设计拆解为两条独立检索…",
        weight: 5,
        need: "针对“A 与 B 有什么区别”这类对比型问题,设计拆解为两条独立检索子查询(Sub-queries)的 JSON 输出格式,避免单次检索只召回 A 而漏掉 B(5 分)",
        cues: [
          "子查询",
          "sub-query",
          "json"
        ],
        groups: 2
      },
      {
        id: "c3",
        title: "说明若用戶第 2 轮只是说“谢谢,讲得很清楚”,系统应如何跳过向量库…",
        weight: 3,
        need: "说明若用戶第 2 轮只是说“谢谢,讲得很清楚”,系统应如何跳过向量库检索以节省延迟(3 分)。 第四阶段:高阶生产篇(第 7‒8 关)——知识图谱 GraphRAG、流式应用与评估 体系",
        cues: [
          "跳过",
          "检索",
          "谢谢",
          "寒暄",
          "闲聊"
        ],
        groups: 2
      }
    ]
  },
  "rag-07": {
    title: "知识图谱增强检索(Advanced: Microsoft GraphRAG)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "定义面向产业链研报的实体类型(如公司、核心原材料、产能指标、技术路线…",
        weight: 5,
        need: "定义面向产业链研报的实体类型(如公司、核心原材料、产能指标、技术路线)与关系三元组 (Head, Relation, Tail) 抽取 JSON 格式(5 分)",
        cues: [
          "实体",
          "公司",
          "原材料",
          "产能",
          "三元组",
          "head",
          "relation",
          "tail",
          "json"
        ],
        groups: 3
      },
      {
        id: "c2",
        title: "设计查询路由器(Query Router):准确判断哪些用戶提问应路…",
        weight: 4.5,
        need: "设计查询路由器(Query Router):准确判断哪些用戶提问应路由至标准向量/Local Search,哪些宏 观综述提问必须路由至 GraphRAG Global Search(4.5 分)",
        cues: [
          "路由",
          "router",
          "local search",
          "向量",
          "graphrag",
          "global"
        ],
        groups: 3
      },
      {
        id: "c3",
        title: "简述 GraphRAG 索引构建成本高的原因及如何仅对高价值核心文档…",
        weight: 3,
        need: "简述 GraphRAG 索引构建成本高的原因及如何仅对高价值核心文档启用图谱抽取(3 分)",
        cues: [
          "成本",
          "索引",
          "高价值",
          "核心文档"
        ],
        groups: 2
      }
    ]
  },
  "rag-08": {
    title: "流式交互应用与 RAG 黄金评估体系(Module 5: RAGStream & RAG Evaluation)",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "构建包含【Context Recall 低 vs. 高】与【Fait…",
        weight: 6,
        need: "构建包含【Context Recall 低 vs. 高】与【Faithfulness 低 vs. 高】的 4 类故障现象诊断与对应修复方 案矩阵(6 分)",
        cues: [
          "context recall",
          "faithfulness",
          "4 类",
          "四类",
          "修复"
        ],
        groups: 4
      },
      {
        id: "c2",
        title: "参照 RAGStream.py 架构,列出在 Streamlit 界…",
        weight: 4,
        need: "参照 RAGStream.py 架构,列出在 Streamlit 界面侧边栏或折叠面板(st.expander)中应向用戶展示的 3 项透明化调试信息(4 分)",
        cues: [
          "streamlit",
          "调试",
          "透明",
          "3 项",
          "三项"
        ],
        groups: 3
      },
      {
        id: "c3",
        title: "设计一条用于自动评测 Faithfulness(忠实度)的 LLM-…",
        weight: 2.5,
        need: "设计一条用于自动评测 Faithfulness(忠实度)的 LLM-as-a-Judge 裁判提示词(2.5 分)。 全关卡标准",
        cues: [
          "judge",
          "裁判",
          "faithfulness",
          "忠实度"
        ],
        groups: 2
      }
    ]
  },
  "tools-01": {
    title: "主流云端大模型全景实操",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "四家模型能力边界",
        weight: 15,
        need: "这一册只解决一件事：四大云端模型的能力边界不同，且它们早就不只是聊天框，而是带代码沙盒、画布和项目空间的工作台",
        cues: [
          "gemini",
          "claude",
          "chatgpt",
          "deepseek"
        ],
        groups: 1
      },
      {
        id: "c2",
        title: "代码沙盒与画布",
        weight: 15,
        need: "这一册只解决一件事：四大云端模型的能力边界不同，且它们早就不只是聊天框，而是带代码沙盒、画布和项目空间的工作台",
        cues: [
          "code interpreter",
          "沙盒",
          "artifact",
          "canvas"
        ],
        groups: 1
      },
      {
        id: "c3",
        title: "API 与统一推理",
        weight: 20,
        need: "这一册只解决一件事：四大云端模型的能力边界不同，且它们早就不只是聊天框，而是带代码沙盒、画布和项目空间的工作台",
        cues: [
          "api",
          "reasoning_effort",
          "统一推理"
        ],
        groups: 1
      }
    ]
  },
  "tools-02": {
    title: "零代码个人智库与深度研究",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "Source-grounded 智库",
        weight: 15,
        need: "这一册只解决一件事：向内深读私有资料用源接地智库，向外做全网考证用 Deep Research",
        cues: [
          "source-grounding",
          "源接地",
          "notebooklm"
        ],
        groups: 1
      },
      {
        id: "c2",
        title: "Deep Research 多跳",
        weight: 15,
        need: "这一册只解决一件事：向内深读私有资料用源接地智库，向外做全网考证用 Deep Research",
        cues: [
          "deep research",
          "多跳",
          "研究"
        ],
        groups: 1
      },
      {
        id: "c3",
        title: "内联引用",
        weight: 20,
        need: "这一册只解决一件事：向内深读私有资料用源接地智库，向外做全网考证用 Deep Research",
        cues: [
          "引用",
          "citation",
          "角标"
        ],
        groups: 1
      }
    ]
  },
  "tools-03": {
    title: "Cursor AI 原生编程",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "AST 全仓索引",
        weight: 15,
        need: "这一册只解决一件事：Cursor 不是网页聊天框，而是带 AST 全仓索引、局部 Diff 和 Plan/Act 权限边界的编程环境",
        cues: [
          "ast",
          "索引",
          "全仓"
        ],
        groups: 1
      },
      {
        id: "c2",
        title: "局部 Diff 补丁",
        weight: 15,
        need: "这一册只解决一件事：Cursor 不是网页聊天框，而是带 AST 全仓索引、局部 Diff 和 Plan/Act 权限边界的编程环境",
        cues: [
          "diff",
          "补丁",
          "fast apply"
        ],
        groups: 1
      },
      {
        id: "c3",
        title: "Plan/Act 与规则",
        weight: 20,
        need: "这一册只解决一件事：Cursor 不是网页聊天框，而是带 AST 全仓索引、局部 Diff 和 Plan/Act 权限边界的编程环境",
        cues: [
          "plan",
          "act",
          ".mdc",
          "规则"
        ],
        groups: 1
      }
    ]
  },
  "tools-04": {
    title: "Claude Code 与 OpenAI Codex",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "本地终端代理",
        weight: 15,
        need: "这一册只解决一件事：网页版 AI 被困在浏览器沙盒，终端 Agent 才能直接操作你电脑上的文件、命令和项目",
        cues: [
          "claude code",
          "codex",
          "终端"
        ],
        groups: 1
      },
      {
        id: "c2",
        title: "沙盒与权限",
        weight: 15,
        need: "这一册只解决一件事：网页版 AI 被困在浏览器沙盒，终端 Agent 才能直接操作你电脑上的文件、命令和项目",
        cues: [
          "沙盒",
          "权限",
          "sandbox"
        ],
        groups: 1
      },
      {
        id: "c3",
        title: "AGENTS.md/CLAUDE.md",
        weight: 20,
        need: "这一册只解决一件事：网页版 AI 被困在浏览器沙盒，终端 Agent 才能直接操作你电脑上的文件、命令和项目",
        cues: [
          "agents.md",
          "claude.md",
          "规范"
        ],
        groups: 1
      }
    ]
  },
  "tools-05": {
    title: "MCP 模型上下文协议",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "Host/Client/Server",
        weight: 15,
        need: "这一册只解决一件事：MCP 用统一协议把 AI 和外部工具连接起来，本地走 stdio，远程走 Streamable HTTP",
        cues: [
          "host",
          "client",
          "server"
        ],
        groups: 1
      },
      {
        id: "c2",
        title: "stdio 与 Streamable HTTP",
        weight: 15,
        need: "这一册只解决一件事：MCP 用统一协议把 AI 和外部工具连接起来，本地走 stdio，远程走 Streamable HTTP",
        cues: [
          "stdio",
          "streamable http",
          "http"
        ],
        groups: 1
      },
      {
        id: "c3",
        title: "工具/资源暴露",
        weight: 20,
        need: "这一册只解决一件事：MCP 用统一协议把 AI 和外部工具连接起来，本地走 stdio，远程走 Streamable HTTP",
        cues: [
          "tool",
          "resource",
          "server"
        ],
        groups: 1
      }
    ]
  },
  "tools-06": {
    title: "Dify 可视化 AI 工作流",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "Workflow 与 Agent 边界",
        weight: 15,
        need: "这一册只解决一件事：能用确定性 DAG 工作流解决的任务，不要交给自由 Agent 随机决策",
        cues: [
          "workflow",
          "agent",
          "边界"
        ],
        groups: 1
      },
      {
        id: "c2",
        title: "DAG 节点分治",
        weight: 15,
        need: "这一册只解决一件事：能用确定性 DAG 工作流解决的任务，不要交给自由 Agent 随机决策",
        cues: [
          "dag",
          "节点",
          "分治"
        ],
        groups: 1
      },
      {
        id: "c3",
        title: "变量池与父子检索",
        weight: 20,
        need: "这一册只解决一件事：能用确定性 DAG 工作流解决的任务，不要交给自由 Agent 随机决策",
        cues: [
          "变量",
          "父子",
          "检索"
        ],
        groups: 1
      }
    ]
  },
  "tools-07": {
    title: "n8n 跨软件自动化",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "事件触发",
        weight: 15,
        need: "这一册只解决一件事：n8n 用事件触发器主动监听外部世界，用 JSON Items 数组自动逐条处理数据",
        cues: [
          "trigger",
          "触发器",
          "webhook",
          "cron"
        ],
        groups: 1
      },
      {
        id: "c2",
        title: "JSON 数组流",
        weight: 15,
        need: "这一册只解决一件事：n8n 用事件触发器主动监听外部世界，用 JSON Items 数组自动逐条处理数据",
        cues: [
          "item",
          "json",
          "数组"
        ],
        groups: 1
      },
      {
        id: "c3",
        title: "跨软件连接",
        weight: 20,
        need: "这一册只解决一件事：n8n 用事件触发器主动监听外部世界，用 JSON Items 数组自动逐条处理数据",
        cues: [
          "节点",
          "node",
          "集成"
        ],
        groups: 1
      }
    ]
  },
  "tools-08": {
    title: "Ollama 与 RAGFlow 本地生态",
    version: "generated-2026.10.23",
    minLength: 40,
    items: [
      {
        id: "c1",
        title: "GGUF 与异构卸载",
        weight: 15,
        need: "这一册只解决一件事：本地跑模型靠 GGUF 量化 + 异构卸载；解析复杂 PDF 靠 RAGFlow DeepDoc 的版面与表格识别",
        cues: [
          "gguf",
          "ollama",
          "卸载"
        ],
        groups: 1
      },
      {
        id: "c2",
        title: "RAGFlow/DeepDoc",
        weight: 15,
        need: "这一册只解决一件事：本地跑模型靠 GGUF 量化 + 异构卸载；解析复杂 PDF 靠 RAGFlow DeepDoc 的版面与表格识别",
        cues: [
          "ragflow",
          "deepdoc",
          "解析"
        ],
        groups: 1
      },
      {
        id: "c3",
        title: "本地隐私与量化",
        weight: 20,
        need: "这一册只解决一件事：本地跑模型靠 GGUF 量化 + 异构卸载；解析复杂 PDF 靠 RAGFlow DeepDoc 的版面与表格识别",
        cues: [
          "本地",
          "量化",
          "隐私"
        ],
        groups: 1
      }
    ]
  }
};

export function getGeneratedRubric(id) {
  return generatedRubrics[String(id || "").trim()] || null;
}
