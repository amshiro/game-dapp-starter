# Fast Autonomous Development Mode

User confirmed：本项目以验证完整前端工程流程为目标，非生产上线目标。当前模式覆盖旧项目文档中“普通工程实现必须逐个Human Gate”的推断，不解除资金、安全和生产边界。

## Feature Freeze

User Confirmed：ORI 已进入最终收口阶段，不再新增业务功能，也不再自动推进下一张 Feature。只允许 bug 修复、回归测试、明显 UI / Figma 偏差修复、构建 / 部署修复及必要文档同步。

当前发布目标为 **Development / Demo，BSC Testnet Chain 97**，不是 Production-ready。最终收口任务已明确授权 QA 通过后的 checkpoint、`main → origin/main` push 和现有 Cloudflare Demo workflow；该授权不包含主网、真实签名或资金交易。所有已有 **RUNTIME QA PENDING** 必须保留，不能以自动化测试或页面正常展示替代真实环境验收。部署步骤见 [Environment Contract](./environment.md#demo-deployment)。

## 人工决定与工程自治

人类负责技术栈、产品/Figma意图、API/合约来源，以及会改变用户行为、业务含义、金额/费用/奖励、钱包交易行为、权限/安全的决定。API/合约字段存在多种业务解释或Figma与明确产品规则冲突时，不能由Agent随意选择。

Agent在既有仓库规范内自主完成Feature-local结构、组件/hooks/queries、DTO/mapper、state owner/query key、类型、错误/加载状态、可访问性、测试、正常重构、注释、browser QA与文档。无需为这些普通工程细节单独请求批准。

完整Feature默认：需求/Figma全状态读取 → 已知API/ABI mapping → implementation → tests → browser QA → docs → report。可继续的工作继续；真正需要产品选择的问题集中为HUMAN QUESTIONS，不逐个暂停整个Feature。

## Source priority

Human explicit decision → current ORI-AI测试 → current repository requirements/docs → Mine Historical Functional Baseline → runtime/API/ABI技术证据。Contract capability != product requirement。发现明确反证仍要报告，不把未知的高风险资金行为当作普通实现。

## Runtime / Git

Development97可以implementation first、real QA later：有合理ABI/runtime路径证据且无明确反证时，缺真实环境验收记 **RUNTIME QA PENDING**，不伪造VERIFIED，也不无意义阻塞研发。Production56保持独立Release Gate。

完整Feature automated QA PASS、browser QA PASS且无已知implementation blocker即可创建本地checkpoint；只缺RUNTIME QA PENDING可以如实记录后提交。不因此获得真实签名、广播、自动资金操作、push、deploy、force push、merge或生产账户操作的授权。

M4 execution fee deduction维持RUNTIME QA PENDING；Stake Real Tx QA=DEFERRED — TEST ORI REQUIRED。两者不阻塞其他Development Feature。对真实交易行为/新资金路径的产品授权和技术检查仍有效。

## Feature连续推进与补充检查

Feature Freeze 期间不进入新 Feature。修复前必须检查尚未同步的 Human Decision / 用户补充；真正涉及产品行为、金额、权限或钱包资金行为的变化集中列为 HUMAN QUESTIONS，不受影响的回归工作继续执行。当前任务更具体的 Git / deploy 限制优先于模式默认授权。
