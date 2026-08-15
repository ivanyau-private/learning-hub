/* Auto-extracted plan data — AI 60-day course */
const A=(t,u)=>`<a href="${u}" target="_blank" rel="noopener">${t}</a>`;

/* ============ MONTH 1 ============ */
const M1_WEEKS=[
{n:1,title:"Week 1 — Foundations & Your First LLM App",goal:"Goal: understand what a model actually does, and build reliable structured LLM calls.",days:[
 {d:"Day 1",t:"Mental model",items:[
  `Watch: Karpathy — ${A("Deep Dive into LLMs like ChatGPT","https://www.youtube.com/@AndrejKarpathy")} (3.5 hr, the best foundations video that exists)`,
  `Read: ${A("Anthropic — Building Effective Agents","https://www.anthropic.com/engineering/building-effective-agents")} (first pass)`,
  "Build: repo + Python env (uv), Anthropic + OpenAI API keys, first API call",
  "Log: your own one-paragraph explanation of 'what is an LLM'"]},
 {d:"Day 2",t:"Tokens, embeddings, decoding",items:[
  `Watch: ${A("3Blue1Brown — Neural Networks ch. 5–6","https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi")}`,
  `Play: ${A("tiktokenizer","https://tiktokenizer.vercel.app/")}`,
  "Build: tokenize + cost script; sample one prompt 10× across temperature/top_p",
  "Concept check: why can't the model count the r's in 'strawberry'?"]},
 {d:"Day 3",t:"The API surface, properly",items:[
  `Course: ${A("Anthropic Academy","https://anthropic.skilljar.com/")} → Claude Platform 101`,
  "Build: streaming, system prompts, multi-turn state, token counting, retries + backoff",
  "Log: diagram the request/response lifecycle"]},
 {d:"Day 4",t:"Prompting & structured output",tag:"KEY",items:[
  `Read: ${A("Anthropic prompt engineering docs","https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview")} — all of it`,
  "<b>Build: structured extraction service</b> — messy text in, validated JSON out (Pydantic + tool-forced output) with schema-violation retries",
  "Most 'AI features' in real products are exactly this"]},
 {d:"Day 5",t:"Determinism, cost, caching",items:[
  "Read: prompt caching + batch API docs",
  "Build: add prompt caching, measure cost delta, add per-request cost logger",
  `Fill gaps: ${A("IBM Technology","https://www.youtube.com/@IBMTechnology")} 5-min explainers`]},
 {d:"Day 6",t:"Project day — ship v1",items:[
  "Build: FastAPI endpoint, streaming, config-driven prompts, 20-example test file, README",
  "Deploy to Railway / Fly / Render free tier"]},
 {d:"Day 7",t:"Rest / catch-up / write",tag:"REST",items:[
  "Public post: 'What I learned in week 1 moving from full-stack to AI'",
  "Public learning compounds — it's how AI engineer roles find you"]}
]},
{n:2,title:"Week 2 — Retrieval, Context Engineering & Evals",goal:"Goal: build a grounded RAG system AND prove it works with numbers.",days:[
 {d:"Day 8",t:"Embeddings & vector search from scratch",items:[
  "<b>No framework:</b> chunk, embed, store in numpy/pgvector, cosine search by hand",
  "Read: chunking strategies (fixed vs. semantic vs. structural)"]},
 {d:"Day 9",t:"Real RAG pipeline",items:[
  `Watch: ${A("LangChain — RAG from scratch","https://www.youtube.com/@LangChain")}`,
  "Build: hybrid search (BM25 + dense) + reranking",
  "Compare vs. pure vector on 20 questions. <b>Write down the numbers.</b>"]},
 {d:"Day 10",t:"RAG failure modes",items:[
  `Read: ${A("Eugene Yan","https://eugeneyan.com/writing/")} on retrieval evaluation`,
  "Build: recall@k on a labeled set; query rewriting; citations on every answer",
  "Break it: ask unanswerable questions — hallucinate or refuse?"]},
 {d:"Day 11",t:"EVALS — most important day of the month",tag:"KEY",items:[
  `Read: ${A("Hamel Husain's evals posts","https://hamel.dev/blog/posts/evals/")} — all of them`,
  `Course: ${A("DeepLearning.AI — Agentic AI","https://learn.deeplearning.ai/courses/agentic-ai")} evals module`,
  "<b>Error analysis FIRST:</b> read 50 real outputs, categorize failures in a spreadsheet",
  "Then write assertions catching your top 3 failure categories"]},
 {d:"Day 12",t:"LLM-as-judge & regression suites",items:[
  "Build: LLM judge with a rubric; validate against your own labels (>20% disagreement = broken rubric)",
  "Wire evals into GitHub Actions — run on every commit",
  `Use ${A("Ragas","https://docs.ragas.io/")} or ${A("DeepEval","https://docs.confident-ai.com/")}, don't roll your own metrics`]},
 {d:"Day 13",t:"Context engineering",items:[
  `Read: ${A("Context engineering guide","https://sourcegraph.com/blog/context-engineering")} + context rot research`,
  "Build: memory with summarization/compaction; instrument context usage per turn",
  "Test behaviour at 80% context full vs. 20%",
  `Learn ${A("DSPy","https://dspy.ai/")} — programmatic, eval-driven prompt optimization instead of hand-tuning strings. Increasingly the production context-engineering toolchain.`]},
 {d:"Day 14",t:"Rest / catch-up",tag:"REST",items:["Second read of Building Effective Agents — it should click completely now"]}
]},
{n:3,title:"Week 3 — Agents & the Harness",goal:"Goal: build an agent from primitives and reason about architecture, not just wire a framework.",days:[
 {d:"Day 15",t:"The agent loop & the harness",tag:"KEY",items:[
  "<b>Build the ReAct loop with zero frameworks</b> — while-loop, tool schemas, dispatch, observation into context, termination + max-step guard (~150 lines)",
  "<b>Name what you built: the harness.</b> Everything between the model and the world — execution substrate, tool dispatch, context assembly, loop control, state, observability hooks, permissions",
  `Read: ${A("Agent Harness Engineering: A Survey","https://picrew.github.io/LLM-Harness/")} · ${A("Model or Harness? Localizing Agent Failures","https://arxiv.org/html/2607.28802")}`,
  `Read: ${A("12-Factor Agents","https://github.com/humanlayer/12-factor-agents")} — own your prompts, own your control flow, stateless reducer, own your context window, compact errors, small focused agents. The production-agent principles everyone converged on independently.`,
  "<b>Mental model:</b> the model decides <i>what</i>; the harness decides <i>what's possible</i>. Most 'the model is dumb' complaints are harness bugs."]},
 {d:"Day 16",t:"Tool design",tag:"KEY",items:[
  `Read: ${A("Anthropic — Writing Tools for Agents","https://www.anthropic.com/engineering/writing-tools-for-agents")}`,
  "Build: 5 real tools (file r/w, shell w/ allowlist, HTTP fetch, search, code exec)",
  "Rewrite every tool description, measure the accuracy difference — you'll be shocked",
  "Learn: token-efficient tool results; error messages written <i>for the model</i>"]},
 {d:"Day 17",t:"MCP",items:[
  `Course: ${A("Anthropic Academy → Intro to MCP","https://anthropic.skilljar.com/")} · ${A("MCP docs","https://modelcontextprotocol.io/")}`,
  "Build: your own MCP server exposing company tools (or a mock); connect to Claude Desktop/Code and use it",
  `Also know ${A("A2A (Agent-to-Agent)","https://a2a-protocol.org/")} — Linux Foundation, 150+ orgs, integrated across Google/Microsoft/AWS. <b>MCP connects agents to tools; A2A connects agents to each other.</b> Interviewers ask the difference.`,
  "This is directly the 'developer work' part of your goal"]},
 {d:"Day 18",t:"Memory & state",tag:"KEY",items:[
  "Build: short-term + long-term (vector-backed) + scratchpad memory, persisted across sessions",
  "<b>State management is the most overlooked agent skill.</b> An agent that can plan is worthless if it can't track its own progress — without progress tracking you get hallucination loops: repeating steps, losing the goal, declaring a half-done task complete",
  "Build: an explicit task/progress ledger the agent reads and writes each step. Then remove it and watch the failure mode appear.",
  "Learn: launch/pause/resume — an agent you can checkpoint and restart is a different class of system",
  `Course: ${A("HF AI Agents Course","https://huggingface.co/learn/agents-course/unit0/introduction")} Units 1–2 (free certificate)`]},
 {d:"Day 19",t:"Frameworks — pick ONE",items:[
  `Rebuild Day 15's agent in ${A("LangGraph","https://langchain-ai.github.io/langgraph/")} or the Claude Agent SDK`,
  "Note what the framework gives you and what it costs you — great interview material"]},
 {d:"Day 20",t:"Multi-agent & orchestration",items:[
  "Build: orchestrator + specialized sub-agents",
  "<b>Then measure whether it's actually better</b> than one good agent — usually it isn't",
  "Add: human-in-the-loop approval gate for destructive actions",
  "<b>Watch for cascading errors:</b> one bad step poisons every downstream step. Where's the checkpoint?"]},
 {d:"Day 21",t:"Rest / catch-up",tag:"REST",items:["Publish your hand-rolled agent repo"]}
]},
{n:4,title:"Week 4 — Production Hardening + Capstone",goal:"Goal: something you could deploy at your company, plus breadth for interviews.",days:[
 {d:"Day 22",t:"Observability",items:[
  `Build: full tracing with ${A("Langfuse","https://langfuse.com/docs")} (self-host, free) or LangSmith`,
  "Every LLM call, tool call, latency, token count, cost — visible. Do it before you need it."]},
 {d:"Day 23",t:"Security — adversarial failure",tag:"KEY",items:[
  `Read: ${A("Simon Willison on prompt injection","https://simonwillison.net/tags/prompt-injection/")} · the 'lethal trifecta' · ${A("OWASP GenAI Top 10","https://genai.owasp.org/")}`,
  "<b>Three poisoning vectors:</b> direct goal manipulation · indirect instruction injection (hidden instructions in RAG content, docs, tool output) · recursive hijacking (agent poisons its own future context)",
  "Confused deputy & excessive agency — agent has permissions the requester doesn't",
  "Attack your own agent: plant payloads in retrieved docs, then in a <i>tool result</i>",
  "Defend: permission scoping, output validation, sandboxing, no-network-for-untrusted-content, provenance tagging",
  "<b>Write a threat model doc</b> — this alone will impress in interviews"]},
 {d:"Day 24",t:"Failure mechanisms, reliability & cost",tag:"KEY",items:[
  "<b>The six failure modes unique to agents:</b> tool misuse · context loss · goal drift · retry loops · cascading errors · silent quality degradation",
  "<b>Goal drift</b> is the sneaky one — recent context displaces the original instruction. Test with a long multi-step task.",
  "<b>Silent degradation</b> is the dangerous one — nothing throws, output just gets worse. Only evals + tracing catch it.",
  `Read: ${A("harness anti-patterns","https://atlan.com/know/agent-harness-failures-anti-patterns/")} · ${A("agent failure modes in production","https://www.trantorinc.com/blog/ai-agent-failure-modes-what-goes-wrong-design-resilience")}`,
  "<b>Error attribution drill:</b> label 20 of your failed traces — model's fault or harness's fault?",
  "Build defenses: model routing, fallbacks, timeouts, circuit breakers, loop/budget guards, semantic caching, budget caps",
  "Build recovery: self-correction, rollback of non-atomic tool calls, escalation to human",
  "Measure: p50/p95 latency, cost per task, success rate, steps-to-completion"]},
 {d:"Day 25",t:"Agent evals",items:[
  "Build: trajectory evaluation — right tools, sane order, task completed?",
  "30-task benchmark for your capstone. Baseline → improve → show before/after."]},
 {d:"Day 26–28",t:"CAPSTONE — Developer Work Agent",tag:"KEY",items:[
  "RAG over your repo + internal docs",
  "MCP tools: git ops, test runner, CI status, ticket lookup, code search",
  "Real workflow: <b>'triage this bug ticket → find the code → propose a fix → open a draft PR'</b>",
  "Must have: tracing, eval suite with a real score, cost tracking, human approval gate, threat model",
  "Must handle: step/budget limits, retry-loop detection, goal-drift check, rollback for non-atomic calls",
  "README with architecture diagram + <b>eval results table</b>"]},
 {d:"Day 29",t:"Breadth day",items:[
  "Fine-tuning: LoRA/QLoRA, when it's worth it (rarely), distillation, DPO — one small LoRA run on free Colab",
  "Open models & serving: vLLM, quantization/GGUF — run one local model with Ollama",
  "Classic ML vocabulary: train/val/test, overfitting, precision/recall/F1",
  "Multimodal & voice basics; batch/async patterns"]},
 {d:"Day 30",t:"Package & position",items:[
  "Write up the capstone: architecture, eval numbers, security model, cost analysis",
  "Update resume/LinkedIn with Pillar 4–9 vocabulary — what recruiters filter on",
  "Internal proposal: how your company should standardize agent development",
  "Publish the capstone"]}
]}
];

const M1_PILLARS=[
 {h:"1 · LLM Fundamentals",i:["Tokens & BPE tokenization","Embeddings & vector space","Transformer + attention (intuition only)","Pretraining → SFT → RLHF","Reasoning / thinking models","Temperature, top_p, top_k","Context window, KV cache, prompt caching","Frontier vs. open weights","Quantization (GGUF), serving (vLLM)"]},
 {h:"2 · Prompting & Context Engineering",i:["Structured output / JSON schema","System vs. user vs. assistant roles","Few-shot examples","Chain-of-thought & when it's redundant","Prompt caching strategy","Context rot","Compaction & summarization","Context budgeting","Prompt versioning"]},
 {h:"3 · Retrieval / RAG",i:["Chunking strategies","Embedding models","Vector DBs (pgvector, Qdrant, Chroma)","Hybrid search = BM25 + dense","Reranking (cross-encoders)","Query rewriting / HyDE","Metadata filtering","Citations & grounding","recall@k, MRR, nDCG","When RAG is the wrong answer"]},
 {h:"4 · Agents",i:["Tool / function calling","ReAct loop (think→act→observe)","Tool design as API design","Planning & decomposition","Memory: working / episodic / semantic","MCP (Model Context Protocol)","Sub-agents & orchestrator-workers","Code execution & sandboxing","Human-in-the-loop gates","Loop control: max steps, budgets","The 5 patterns: chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer"]},
 {h:"5 · The Harness Layer",i:["What a harness <i>is</i>: everything between the model and the world","Execution substrate: sandbox / container / VM","Tool interface + dispatch layer","Context assembly & control — what enters the window, and when","Orchestration: loop control, step limits, budgets, termination","State, checkpointing, resumability","Observability hooks built <i>into</i> the loop","Eval feedback wiring","Governance & permission constraints","<b>Model-vs-harness attribution</b> — is this failure the model's fault or your scaffolding's?"]},
 {h:"6 · Agent Failure Mechanisms",i:["<b>Tool misuse</b> — wrong tool, wrong args, right tool wrong time","<b>Context loss</b> — a constraint silently dropped mid-run","<b>Goal drift</b> — recent context displaces the original instruction","<b>Retry / infinite loops</b> — no progress, burning budget","<b>Cascading errors</b> — one bad step poisons everything downstream","<b>Silent quality degradation</b> — nothing errors, output just gets worse","Context poisoning: direct manipulation · indirect injection · recursive hijacking","Confused deputy & excessive agency","Partial failure & non-atomic tool calls","Recovery: self-correction, rollback, escalation"]},
 {h:"7 · Evaluation",i:["Error analysis on real traces (start here)","Assertion / code-based evals","LLM-as-judge + its biases","Trace-level vs. step-level eval","Task completion & tool-selection accuracy","Trajectory quality","Golden datasets & CI regression suites","Offline vs. online eval","A/B testing & canary rollouts"]},
 {h:"8 · Production Engineering",i:["Tracing & observability","Latency budgets & streaming","Cost tracking per request/user","Semantic + prompt caching","Model routing & fallbacks","Rate limits, retries, backoff","Idempotency for tool calls","Async / queued long-running agents","Prompt & model versioning","Graceful degradation"]},
 {h:"9 · Security & Safety",i:["Direct + indirect prompt injection","The lethal trifecta","Tool permission scoping / least privilege","Sandboxing code execution","Output validation","PII handling & redaction","Jailbreak resistance","Audit logging","OWASP LLM Top 10"]},
 {h:"10 · Model Customization (breadth)",i:["Fine-tune vs. prompt vs. RAG decision","LoRA / QLoRA","Instruction tuning","Distillation","Synthetic data generation","DPO basics","Embedding model fine-tuning","Evaluating a fine-tune vs. base"]}
];

const M1_RES={
 t1:[["Anthropic Academy","https://anthropic.skilljar.com/","17+ free certified courses: Claude API, Agent SDK, MCP, Agent Skills. Most directly relevant free training for your goal."],
 ["Building Effective Agents","https://www.anthropic.com/engineering/building-effective-agents","The canonical agent architecture essay. Read 3× over the month."],
 ["Writing Tools for Agents","https://www.anthropic.com/engineering/writing-tools-for-agents","Tool design = highest-leverage agent skill."],
 ["HF AI Agents Course","https://huggingface.co/learn/agents-course/unit0/introduction","Free + certified. smolagents, LangGraph, LlamaIndex, benchmarked final project."],
 ["DeepLearning.AI — Agentic AI","https://learn.deeplearning.ai/courses/agentic-ai","Andrew Ng, ~10 hr. Unusually good evals section. Free to audit."],
 ["DeepLearning.AI Short Courses","https://www.deeplearning.ai/courses","1-hour targeted courses on RAG, evals, MCP, memory."],
 ["OpenAI Cookbook","https://cookbook.openai.com/","Working code for every pattern."],
 ["MCP docs","https://modelcontextprotocol.io/","The interop standard you'll build against."],
 ["Berkeley — Agentic AI MOOC (CS294)","https://rdi.berkeley.edu/agentic-ai/","<b>Newly added.</b> 12-lecture series, 40k+ students, guest lecturers from OpenAI, DeepMind, NVIDIA, Meta. Systems, modeling, evaluation and safety perspectives. The most academically serious free agents course."],
 ["12-Factor Agents","https://github.com/humanlayer/12-factor-agents","<b>Newly added.</b> The production-agent principles repo everyone cites. Read it on Day 15 alongside your hand-rolled harness."],
 ["Microsoft — AI Agents for Beginners","https://github.com/microsoft/ai-agents-for-beginners","<b>Newly added.</b> Free, MIT, 15 lessons. Design patterns, agent security, memory, and the protocol layer (MCP + A2A). README + video + Python samples per lesson."],
 ["Google × Kaggle — 5-Day AI Agents Intensive","https://www.kaggle.com/learn-guide/5-day-agents","<b>Newly added.</b> Whitepapers + codelabs + capstone. 1.5M+ learners. Good structured week if you want a guided sprint."],
 ["Google × Kaggle — 5-Day Gen AI Intensive","https://www.kaggle.com/learn-guide/5-day-genai","<b>Newly added.</b> Foundation models, embeddings, agents, domain LLMs, MLOps."]],
 t2:[["Anthropic Prompt Engineering docs","https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview","Best free prompting reference anywhere."],
 ["Simon Willison","https://simonwillison.net/","Best running commentary on practical LLM engineering. Prompt injection series required."],
 ["Hamel Husain — Evals","https://hamel.dev/blog/posts/evals/","The reference text on LLM evals and error analysis."],
 ["Agent Harness Engineering survey","https://picrew.github.io/LLM-Harness/","The harness layer, formalized."],
 ["Model or Harness?","https://arxiv.org/html/2607.28802","Interaction-centric taxonomy for localizing agent failures."],
 ["Eugene Yan","https://eugeneyan.com/writing/","Patterns for building LLM systems, by a practitioner."],
 ["Chip Huyen — AI Engineering","https://huyenchip.com/2025/01/07/agents.html","<b>Newly added.</b> Her agents essay is free and excellent; the AI Engineering book is the field's best single overview if you ever buy one."],
 ["DSPy","https://dspy.ai/","<b>Newly added.</b> Programmatic, eval-driven prompt optimization. Replaces hand-tuning prompt strings with compiled, measurable programs."],
 ["A2A Protocol","https://a2a-protocol.org/","<b>Newly added.</b> Agent-to-agent interop, Linux Foundation. MCP = agent→tools; A2A = agent→agent."],
 ["LangGraph docs","https://langchain-ai.github.io/langgraph/","Most common agent framework in job postings."],
 ["OWASP GenAI Top 10","https://genai.owasp.org/","Security checklist."],
 ["Langfuse","https://langfuse.com/docs","Open-source tracing, self-host free."]],
 yt:[["Andrej Karpathy","https://www.youtube.com/@AndrejKarpathy","First-principles LLM internals","Wk 1"],
 ["3Blue1Brown","https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi","Visual intuition for attention & transformers","Wk 1"],
 ["LangChain","https://www.youtube.com/@LangChain","Official RAG + LangGraph patterns","Wk 2–3"],
 ["Cole Medin","https://www.youtube.com/@ColeMedin","Production AI agents. Most-recommended agent channel of 2026.","Wk 3–4"],
 ["AI Jason","https://www.youtube.com/@AIJasonZ","LLM application engineering","Wk 3"],
 ["AssemblyAI","https://www.youtube.com/@AssemblyAI","Practical LLM app tutorials","Wk 2"],
 ["IBM Technology","https://www.youtube.com/@IBMTechnology","5-min conceptual explainers","Anytime"],
 ["Latent Space","https://www.latent.space/","The AI engineer community's hub — 15 min/day","Daily"]]
};

const M1_INTQ=["When would you <b>not</b> use an agent? (Answer: most of the time — use a workflow)","RAG vs. long context vs. fine-tuning — how do you decide?","Your agent works in testing and fails in production. Walk me through debugging.","<b>An agent step went wrong. Model's fault or harness's? How do you tell?</b>","<b>Name three agent failure modes with no parallel in normal software.</b>","<b>What is goal drift and how would you detect it in production?</b>","How do you evaluate an agent when there's no single correct answer?","What's indirect prompt injection? What's recursive hijacking?","How do you cut LLM cost 10× without hurting quality?","Why does hybrid search usually beat pure vector search?","How do you version and roll back a prompt change?"];

/* ============ MONTH 2 ============ */
const M2_WEEKS=[
{n:5,title:"Week 5 — Math Refresher + The ML You Skipped",goal:"Goal: rebuild the math you need (not the math you don't), and own classic ML + statistics.",days:[
 {d:"Day 31",t:"Linear algebra, ML-flavoured",items:[
  `Watch: ${A("3Blue1Brown — Essence of Linear Algebra","https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab")} ch. 1–9`,
  `Read: ${A("Mathematics for Machine Learning","https://mml-book.github.io/")} ch. 2–4 — skim, reference not textbook`,
  "Build: matmul, dot product, projection, PCA in raw numpy",
  "Target intuition: a matrix is a transformation; attention is a weighted average"]},
 {d:"Day 32",t:"Calculus → backprop",tag:"KEY",items:[
  `Watch: ${A("3Blue1Brown — Essence of Calculus","https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr")} (derivatives + chain rule only)`,
  `Build: ${A("Karpathy — micrograd","https://github.com/karpathy/nn-zero-to-hero")} — scalar autograd engine from scratch, ~100 lines`,
  "<b>Best single use of a day this month.</b> After micrograd, backprop stops being magic permanently."]},
 {d:"Day 33",t:"Probability & statistics",items:[
  `Watch: ${A("StatQuest","https://www.youtube.com/@statquest")} — distributions, MLE, Bayes, hypothesis testing, p-values, CIs`,
  "Build: simulate a coin-flip A/B test; compute p-value and CI by hand and with scipy",
  "<b>Applied Scientist interviews test this harder than they test deep learning</b>"]},
 {d:"Day 34",t:"Classic ML fundamentals",items:[
  `Course: ${A("Stanford CS229","https://www.youtube.com/playlist?list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU")} — linear/logistic regression, bias-variance, regularization (skip heavy proofs)`,
  "Build from scratch in numpy: linear + logistic regression + gradient descent. No sklearn.",
  "Own the vocabulary: bias-variance, L1/L2, overfitting, cross-validation, feature scaling"]},
 {d:"Day 35",t:"Evaluation & experimental design",tag:"KEY",items:[
  "Metrics: precision, recall, F1, ROC-AUC vs. PR-AUC, calibration, when accuracy lies",
  "Class imbalance, train/val/test discipline, data leakage (the #1 real-world ML bug)",
  "Build: classifier on imbalanced data; plot ROC + PR; introduce leakage deliberately and watch the score lie",
  "Stats for experiments: A/B testing, power analysis, multiple comparisons"]},
 {d:"Day 36",t:"Project day — end-to-end classic ML",items:[
  `Pick a ${A("Kaggle","https://www.kaggle.com/competitions")} tabular comp: EDA → baseline → features → model → CV → error analysis → writeup`,
  "Goal isn't the leaderboard. It's a clean, honest, reproducible notebook you can talk through."]},
 {d:"Day 37",t:"Rest / catch-up",tag:"REST",items:["If micrograd didn't fully click, redo it. Do not move on without it."]}
]},
{n:6,title:"Week 6 — PyTorch Fluency + Training Real Networks",goal:"Goal: PyTorch becomes muscle memory, and you can diagnose a training run going wrong.",days:[
 {d:"Day 38",t:"PyTorch core",items:[
  `Work through ${A("PyTorch tutorials","https://pytorch.org/tutorials/beginner/basics/intro.html")} — tensors, autograd, nn.Module, DataLoader`,
  "<b>Mac:</b> use <code>device='mps'</code>; set <code>PYTORCH_ENABLE_MPS_FALLBACK=1</code> for ops that fall back to CPU",
  "Build: re-implement Day 34's logistic regression in PyTorch"]},
 {d:"Day 39",t:"Training loops & dynamics",tag:"KEY",items:[
  "Hand-write a training loop: forward, loss, backward, step, zero_grad, eval mode, checkpointing",
  "Learn: SGD/Adam/AdamW, LR schedules (warmup + cosine), weight decay, grad clipping, mixed precision",
  "<b>Diagnose deliberately:</b> make a run diverge, underfit, overfit. Learn what each looks like in the loss curve.",
  `Set up ${A("Weights & Biases","https://wandb.ai/site")} free — log every run from today onward`]},
 {d:"Day 40",t:"makemore",items:[
  `Build: ${A("Karpathy — makemore","https://github.com/karpathy/nn-zero-to-hero")} parts 1–3 (bigram → MLP → batchnorm/activations)`,
  "Where initialization, normalization and activation statistics finally make sense"]},
 {d:"Day 41",t:"Build GPT from scratch",tag:"KEY",items:[
  `Build: ${A("Karpathy — Let's build GPT","https://github.com/karpathy/nn-zero-to-hero")} (nanoGPT). Self-attention, multi-head, residuals, layernorm.`,
  "Train on your own dataset on the M4 Pro via MPS — small model, small data, runs fine locally",
  `Read alongside: ${A("The Illustrated Transformer","https://jalammar.github.io/illustrated-transformer/")}`]},
 {d:"Day 42",t:"Tokenizers + data pipelines",items:[
  `Build: ${A("minBPE","https://github.com/karpathy/minbpe")} — BPE from scratch`,
  "Learn: dataset curation, dedup, filtering, why data quality dominates architecture",
  "Build a cleaning pipeline; measure the effect on your Day 41 model"]},
 {d:"Day 43",t:"Project day — train and document",items:[
  "Train nanoGPT properly: scale up, track loss in W&B, run one real ablation",
  "Write a proper experiment log: hypothesis → setup → result → interpretation. <b>This format is the core of research work.</b>"]},
 {d:"Day 44",t:"Rest / catch-up",tag:"REST",items:["Publish your nanoGPT repo with the experiment writeup"]}
]},
{n:7,title:"Week 7 — LLM Internals + Fine-Tuning on Your Mac",goal:"Goal: understand how frontier models are built, and fine-tune one locally end-to-end.",days:[
 {d:"Day 45",t:"CS336 — the real curriculum",tag:"KEY",items:[
  `Course: ${A("Stanford CS336 — Language Modeling from Scratch","https://github.com/stanford-cs336")} · ${A("Spring 2026 lectures","https://www.youtube.com/watch?v=JuoVZkPBiKk")}`,
  "Lectures 1–3: overview, tokenization, architecture. Best free 'how LLMs are built' course in existence.",
  "Skim assignment 1 — you already built most of it in week 6, which is why week 6 came first"]},
 {d:"Day 46",t:"Architecture variants",items:[
  "RoPE · RMSNorm · SwiGLU · grouped-query attention · KV cache · MoE · flash attention (concept)",
  `Read: ${A("Lilian Weng","https://lilianweng.github.io/")} · ${A("Sebastian Raschka","https://sebastianraschka.com/blog/")}`,
  "Build: swap nanoGPT's learned positions for RoPE and LayerNorm for RMSNorm. Measure."]},
 {d:"Day 47",t:"Scaling laws & the training pipeline",items:[
  "Read: Chinchilla scaling laws · compute-optimal training · pretrain → SFT → RLHF/DPO",
  "Understand the economics: why nobody pretrains, why everyone fine-tunes"]},
 {d:"Day 48",t:"MLX — your Mac is a real ML machine",tag:"MAC",items:[
  `Learn: ${A("Apple MLX","https://github.com/ml-explore/mlx")} · ${A("mlx-examples","https://github.com/ml-explore/mlx-examples")} · ${A("mlx-lm","https://github.com/ml-explore/mlx-lm")}`,
  "Built for unified memory — no CPU↔GPU copies. Beats llama.cpp by 21–87% on Apple Silicon.",
  "Build: run a quantized 7B locally, then convert + quantize a model yourself",
  "Understand quantization: 4-bit/8-bit, what you lose, how to measure it"]},
 {d:"Day 49",t:"LoRA / QLoRA fine-tuning",tag:"KEY",items:[
  "Theory: low-rank adaptation, rank/alpha, target layers, why it works",
  `Build: LoRA fine-tune a 7B locally with ${A("mlx-lm","https://github.com/ml-explore/mlx-lm")} — fully doable on an M4 Pro`,
  `Cross-train on CUDA: same idea with ${A("HF PEFT + TRL","https://huggingface.co/docs/trl/index")} on free Colab (this is what job posts mean by QLoRA)`,
  "<b>Then evaluate against the base model.</b> A fine-tune without an eval is worthless."]},
 {d:"Day 50",t:"Preference tuning & alignment",items:[
  "SFT vs. DPO vs. RLHF/PPO — what each optimizes and when it's worth it",
  `Build: a small DPO run with ${A("TRL","https://huggingface.co/docs/trl/index")}`,
  "Also learn distillation — big model generates data, small model learns it. Very common in production."]},
 {d:"Day 51",t:"Rest / catch-up",tag:"REST",items:["Publish your fine-tune + eval comparison. Include where it got worse."]}
]},
{n:8,title:"Week 8 — Research Practice + Capstone",goal:"Goal: work the way a scientist works — read, reproduce, ablate, report honestly.",days:[
 {d:"Day 52",t:"How to read papers",items:[
  "3-pass method: title/abstract/figures → full read skipping proofs → reimplement mentally",
  `Sources: ${A("HF Daily Papers","https://huggingface.co/papers")} · ${A("alphaXiv","https://www.alphaxiv.org/")} · ${A("Papers with Code","https://paperswithcode.com/")}`,
  `Watch: ${A("Umar Jamil","https://www.youtube.com/@umarjamilai")} implementing papers from scratch · ${A("Yannic Kilcher","https://www.youtube.com/@YannicKilcher")} for breakdowns`,
  "Do: read 3 papers. 5-line summary each: problem, method, evidence, limitation, what you'd try next."]},
 {d:"Day 53",t:"Reproduce a paper",tag:"KEY",items:[
  "Pick a <b>small</b> paper with a clear claim — a LoRA variant, a prompting method, a sampling technique",
  "Reimplement it. Run it. Get a number. Compare to their reported number.",
  "<b>The single strongest signal you can send for an applied scientist role.</b> Almost no self-taught candidate does it."]},
 {d:"Day 54",t:"Experimental rigor",items:[
  "Seeds & determinism, controlling confounds, ablation design, error bars, why single-run results are meaningless",
  "Build: re-run a week 6–7 experiment across 3 seeds. Report mean ± std. Notice how much 'improvement' was noise.",
  "Reproducible template: config files, pinned deps, logged hyperparameters, saved checkpoints"]},
 {d:"Day 55–57",t:"CAPSTONE — research-flavoured project",tag:"KEY",items:[
  "A question answerable on an M4 Pro, e.g. <i>'How does LoRA rank affect quality vs. memory on task X?'</i>",
  "Required: clear hypothesis · controlled experiment · ≥1 ablation · multiple seeds · honest negative results",
  "Deliverable: repo + paper-style writeup (abstract, method, results table, limitations, future work)",
  "Add a plot. Applied scientists communicate with plots and tables.",
  "<b>Your portfolio centrepiece — what makes a hiring manager read you as a scientist.</b>"]},
 {d:"Day 58",t:"Interview prep",items:[
  "ML breadth: bias-variance, why Adam, vanishing gradients, batchnorm vs. layernorm, overfitting diagnosis",
  "Stats: p-values, CIs, power, Simpson's paradox, sample size",
  "Coding: write attention from memory; implement k-means; backprop for a 2-layer net",
  "ML system design: 'design a rec system', 'how would you detect data drift'",
  "Research discussion: defend every choice in your capstone"]},
 {d:"Day 59",t:"Positioning",items:[
  "Resume around the Applied Scientist keyword set: fine-tuning, LoRA/QLoRA, evaluation, experimentation, PyTorch, statistics",
  "<b>Lead with production metrics</b> (latency, cost, throughput), then model metrics, then frameworks",
  "Publish the capstone writeup"]},
 {d:"Day 60",t:"Plan the next 3 months",tag:"REST",items:[
  "Honest self-assessment against the gap list (Reality Check tab)",
  "Pick your next depth area: distributed training · RL/post-training · multimodal · efficient inference",
  "Start contributing to one open-source ML repo — fastest credibility path without a PhD"]}
]}
];

const M2_GAPS=[
 {h:"What Month 2 genuinely gives you",i:["Backprop and training dynamics understood, not memorized","PyTorch fluency — write and debug a training loop cold","A transformer you built and trained yourself","A real LoRA/QLoRA fine-tune with an honest eval vs. base","Statistics fluent enough for applied-scientist screens","One reproduced paper + one original experiment with ablations","A portfolio that reads as scientific, not tutorial-driven"]},
 {h:"What it does NOT give you (be honest in interviews)",i:["Distributed / multi-GPU training (FSDP, DeepSpeed, ZeRO)","Large-scale data engineering for pretraining corpora","Publications or peer review experience","Deep RL / RLHF at production scale","CUDA kernels, Triton, low-level performance work","Years of intuition for what fails at scale"]},
 {h:"Realistic timeline to the role",i:["Month 2: foundations + credible portfolio → you can pass ML screens","Months 3–5: depth in ONE area + open-source contributions → competitive","Months 6–12: internal transfer, or a role where your engineering strength is the differentiator","<b>Fastest real path:</b> take the AI Engineer role now, then move sideways into applied science from inside a company that has models and data. Internal transfer bars are far lower than external hiring bars."]},
 {h:"Your M4 Pro — what it can and can't do",i:["✅ MLX: run + LoRA fine-tune 7B–30B quantized models locally, fast","✅ PyTorch MPS: small transformers, all of nanoGPT, all classic ML","✅ Full week 5–6 curriculum with zero cloud spend","⚠️ Some PyTorch ops silently fall back to CPU on MPS — set PYTORCH_ENABLE_MPS_FALLBACK=1","❌ CUDA-only libs: bitsandbytes, flash-attention, most research repos → free Colab/Kaggle T4","❌ Full fine-tunes of large models, multi-GPU, long pretraining runs","<b>Strategy:</b> MLX locally for daily iteration, free Colab when you need CUDA. Costs $0."]}
];

const M2_RES={
 t1:[["Stanford CS336 — LLMs from Scratch","https://github.com/stanford-cs336","Best free 'how LLMs are actually built' course. Lectures + 5 assignments, all public."],
 ["Karpathy — Zero to Hero","https://github.com/karpathy/nn-zero-to-hero","micrograd → makemore → build GPT → build tokenizer. Non-negotiable."],
 ["Stanford CS229 — Machine Learning","https://www.youtube.com/playlist?list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU","Classic ML with real rigor. Skip proofs, keep intuition."],
 ["Stanford CS224N — NLP","https://web.stanford.edu/class/cs224n/","Manning's course. Free lectures + assignments."],
 ["fast.ai — Practical Deep Learning","https://course.fast.ai/","Top-down: build SOTA models first, theory after. Updated 2026."],
 ["Mathematics for Machine Learning","https://mml-book.github.io/","Free PDF. Reference, not cover-to-cover."],
 ["Dive into Deep Learning","https://d2l.ai/","Free interactive book, PyTorch code for everything."],
 ["PyTorch Tutorials","https://pytorch.org/tutorials/","Official. 60-minute blitz then full basics."]],
 t2:[["Apple MLX","https://github.com/ml-explore/mlx","Built for unified memory. Zero CPU↔GPU copies."],
 ["mlx-lm","https://github.com/ml-explore/mlx-lm","Run, quantize, LoRA fine-tune LLMs on your Mac. Your primary local training tool."],
 ["mlx-examples","https://github.com/ml-explore/mlx-examples","Working examples: LoRA, transformers, diffusion, whisper."],
 ["Fine-tuning on Apple Silicon with MLX","https://www.kdnuggets.com/fine-tuning-language-models-on-apple-silicon-with-mlx","Practical full LoRA walkthrough on Mac."],
 ["Google Colab","https://colab.research.google.com/","Free T4 GPU for anything CUDA-only."],
 ["Kaggle Notebooks","https://www.kaggle.com/code","Free GPU/TPU + datasets + competitions."],
 ["HF PEFT","https://huggingface.co/docs/peft/index","LoRA/QLoRA, the production default."],
 ["HF TRL","https://huggingface.co/docs/trl/index","SFT, DPO, PPO. Post-training in practice."],
 ["Weights & Biases","https://wandb.ai/site","Free experiment tracking."]],
 yt:[["Andrej Karpathy","https://www.youtube.com/@AndrejKarpathy","Zero to Hero — the foundation of weeks 5–6","Wk 5–6"],
 ["StatQuest","https://www.youtube.com/@statquest","Stats and classic ML explained clearly. Perfect for rusty math.","Wk 5"],
 ["3Blue1Brown","https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab","Linear algebra + calculus intuition, visually","Wk 5"],
 ["Umar Jamil","https://www.youtube.com/@umarjamilai","Implements papers from scratch line by line. Most-recommended on X for depth.","Wk 6–8"],
 ["Sebastian Raschka","https://sebastianraschka.com/blog/","LLM architecture comparisons, fine-tuning deep-dives","Wk 7"],
 ["Lilian Weng","https://lilianweng.github.io/","Best technical writing on LLM internals and RLHF anywhere","Wk 7"],
 ["Yannic Kilcher","https://www.youtube.com/@YannicKilcher","Paper breakdowns with genuine critique","Wk 8"],
 ["Stanford Online","https://www.youtube.com/@stanfordonline","CS229 / CS224N / CS336 official uploads","Wk 5–7"]]
};

const M2_INTQ=["Explain the bias-variance tradeoff — and how it shows up in a real training curve","Why AdamW over Adam? What does weight decay actually do?","Write self-attention from memory in numpy","Val loss plateaus while train loss keeps dropping. Your next 5 steps?","LoRA vs. full fine-tuning vs. prompting — pick one for a constraint and defend it","How would you tell if your A/B test result is real? What's the power?","What is data leakage? Three ways it sneaks into a pipeline.","Explain Chinchilla scaling and why it changed training practice","Your fine-tune beats base on your eval. How do you know it's not overfit to the eval?","Walk me through your capstone. Why that design? What would you do with 100× compute?"];

const DAILY_STEPS=[
 "<b>Skim the digest (5 min).</b> Read the model-update brief that lands in your chat each morning. Don't click through everything — you're scanning for <i>relevance to what you're building this week</i>, not completeness.",
 "<b>Classify each item (2 min).</b> Three buckets only: <span style='color:var(--red)'><b>Act</b></span> — changes something I'm building today · <span style='color:var(--warn)'><b>Track</b></span> — matters within a month, note it · <span style='color:var(--dim)'><b>Ignore</b></span> — hype, benchmarks with no method change, funding news.",
 "<b>Append one line to your learning log (2 min).</b> Date · what changed · which pillar it touches · Act/Track/Ignore. After 60 days this log <i>is</i> your evidence of staying current, and it's genuinely interview-usable.",
 "<b>If anything is 'Act' — fold it into today's build (6 min max).</b> New model with a better price/latency point? Add it to your router. New context-window size? Re-check your budgeting assumptions. New tool-calling feature? Try it in your harness.",
 "<b>Once a week: re-run your eval suite against the newest model.</b> This is the habit that separates people who know the field from people who follow it. Your evals, not the vendor's benchmarks."
];

const DAILY_SOURCES=[
 ["TLDR AI","https://tldr.tech/ai","Densest, least promotional daily scan. Headline + two sentences + link. Best single daily for engineers.","Daily"],
 ["Latent Space","https://www.latent.space/","The AI engineer community's hub. Deeper analysis, less news.","Weekly"],
 ["LLM-Stats changelog","https://llm-stats.com/llm-updates","Model releases, API changes, pricing updates across providers in one daily changelog.","Reference"],
 ["AI Release Tracker","https://aireleasetracker.com/","Continuously updated timeline of every major model with dates and benchmarks.","Reference"],
 ["The Batch","https://www.deeplearning.ai/the-batch/","Andrew Ng's weekly. Good judgment filter on what actually matters.","Weekly"],
 ["Anthropic release notes","https://docs.claude.com/en/release-notes/overview","Primary source. Read the actual changelog, not someone's summary of it.","Reference"],
 ["OpenAI changelog","https://help.openai.com/en/collections/3742473-changelog","Primary source.","Reference"],
 ["r/LocalLLaMA","https://reddit.com/r/LocalLLaMA","Best signal on open models and what actually runs locally.","Weekly"]
];

const WEEKLY_ROLLUP=[
 "Re-read your week's log lines. Anything you marked <b>Track</b> that's now <b>Act</b>?",
 "Re-run your eval suite against the newest model you have access to. Record the delta.",
 "One-sentence answer: what changed in the field this week that matters to what I'm building?",
 "If nothing changed that matters — write that down too. Most weeks that's the honest answer, and knowing it is a skill."
];
