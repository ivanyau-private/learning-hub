/* =========================================================================
   Learning Hub — the three books
   Chapter maps, a day-by-day reading schedule woven into the 60-day AI
   course, and a decoder that names the things Ivan already does at work.

   Page numbers are PDF page numbers, so they match what the reader shows.
   ========================================================================= */

var BOOKS = {
  ai: {
    key: "ai",
    title: "AI Engineering",
    sub: "Building Applications with Foundation Models",
    author: "Chip Huyen · O'Reilly, 2025",
    pages: 925,
    role: "The spine of month 1. Written for exactly your situation — someone shipping " +
          "with foundation models who wants the vocabulary and the failure taxonomy behind it.",
    toc: [
      ["1", "Introduction to Building AI Applications", 32, "Rise of AI engineering · use cases · planning · the AI stack · AI vs ML vs full-stack engineering"],
      ["2", "Understanding Foundation Models", 119, "Training data · architecture · model size · post-training · sampling · structured outputs"],
      ["3", "Evaluation Methodology", 232, "Language-modelling metrics · exact evaluation · embeddings · AI as a judge · comparative ranking"],
      ["4", "Evaluate AI Systems", 315, "Evaluation criteria · cost and latency · model selection · build vs buy · benchmarks · eval pipelines"],
      ["5", "Prompt Engineering", 416, "In-context learning · system vs user prompt · context efficiency · best practices · defensive prompting"],
      ["6", "RAG and Agents", 494, "Retrieval algorithms and optimisation · agent overview · tools · planning · failure modes · memory"],
      ["7", "Finetuning", 594, "When to finetune · memory bottlenecks · quantisation · PEFT / LoRA · model merging · tactics"],
      ["8", "Dataset Engineering", 694, "Data curation · quality, coverage, quantity · synthesis · distillation · processing"],
      ["9", "Inference Optimization", 773, "Inference metrics · accelerators · model optimisation · service optimisation"],
      ["10", "AI Engineering Architecture and User Feedback", 852, "Context, guardrails, routers, caches, agent patterns · monitoring · orchestration · feedback design"]
    ]
  },
  dmls: {
    key: "dmls",
    title: "Designing Machine Learning Systems",
    sub: "An Iterative Process for Production-Ready Applications",
    author: "Chip Huyen · O'Reilly, 2022",
    pages: 423,
    role: "The production half. Everything about what happens after the demo works — " +
          "drift, monitoring, continual learning, and the organisational reality.",
    toc: [
      ["1", "Overview of Machine Learning Systems", 18, "When to use ML · what makes ML systems different"],
      ["2", "Introduction to ML Systems Design", 45, "Business vs ML objectives · requirements · the iterative process · framing ML problems"],
      ["3", "Data Engineering Fundamentals", 71, "Sources · formats · models · storage engines · dataflow · batch vs stream"],
      ["4", "Training Data", 108, "Sampling · labelling · class imbalance · augmentation"],
      ["5", "Feature Engineering", 153, "Learned vs engineered features · common operations · data leakage · good features"],
      ["6", "Model Development and Offline Evaluation", 185, "Model development · ensembles · experiment tracking · offline evaluation"],
      ["7", "Model Deployment and Prediction Service", 233, "Deployment myths · batch vs online · compression · cloud and edge"],
      ["8", "Data Distribution Shifts and Monitoring", 272, "Causes of failure · distribution shift · monitoring and observability"],
      ["9", "Continual Learning and Test in Production", 315, "Continual learning · shadow deploys · A/B · canary · interleaving · bandits"],
      ["10", "Infrastructure and Tooling for MLOps", 349, "Storage and compute · dev environment · resource management · ML platform · build vs buy"],
      ["11", "The Human Side of Machine Learning", 394, "User experience · team structure · responsible AI"]
    ]
  },
  iml: {
    key: "iml",
    title: "Introduction to Machine Learning with Python",
    sub: "A Guide for Data Scientists",
    author: "Müller & Guido · O'Reilly",
    pages: 380,
    role: "Month 2's classical-ML gap filler. Hands-on scikit-learn, and the only one " +
          "of the three that makes you write model code rather than reason about systems.",
    toc: [
      ["1", "Introduction", 15, "Why ML · scikit-learn · essential libraries · a first application"],
      ["2", "Supervised Learning", 39, "Classification vs regression · overfitting · linear models, trees, ensembles, SVM, NN · uncertainty estimates"],
      ["3", "Unsupervised Learning and Preprocessing", 145, "Scaling · PCA, NMF, t-SNE · clustering (k-means, agglomerative, DBSCAN)"],
      ["4", "Representing Data and Engineering Features", 225, "Categorical variables · binning · interactions · transformations · feature selection"],
      ["5", "Model Evaluation and Improvement", 265, "Cross-validation · grid search · metrics and scoring · imbalanced data"],
      ["6", "Algorithm Chains and Pipelines", 319, "Building pipelines · pipelines in grid search · grid-searching preprocessing"],
      ["7", "Working with Text Data", 337, "Bag of words · stopwords · tf–idf · n-grams · stemming · topic modelling"],
      ["8", "Wrapping Up", 371, "Approaching an ML problem · prototype to production · testing production systems"]
    ]
  }
};

/* -------------------------------------------------------------------------
   Reading schedule — one entry per day of the 60-day AI course.
   ~30–40 minutes a day. Each is chosen to arrive the same day the course
   makes you build the thing it describes.
   ------------------------------------------------------------------------- */
var READINGS = {
  /* ---- W1 · Foundations & your first LLM app ---- */
  1:  ["ai", "Ch 1 — The Rise of AI Engineering, pp. 34–57; then AI Engineering vs Full-Stack Engineering, pp. 112–118", "Start here. The last section argues your full-stack background is an advantage, not a deficit — it names the shift you have already lived through."],
  2:  ["ai", "Ch 2 — Sampling Fundamentals & Strategies, pp. 187–199", "Why the same prompt gives different answers, and what temperature and top-p actually do to the distribution."],
  3:  ["ai", "Ch 1 — The AI Engineering Stack, pp. 91–113", "Three layers: application development, model development, infrastructure. Work out loud which layer your job sits in."],
  4:  ["ai", "Ch 5 — Introduction to Prompting + Best Practices, pp. 417–452; Ch 2 — Structured Outputs, pp. 206–214", "The single densest reading of week 1. Everything you do by instinct, written down as technique."],
  5:  ["ai", "Ch 2 — The Probabilistic Nature of AI, pp. 214–225; Ch 4 — Cost and Latency, pp. 351–355", "Why you cannot make an LLM deterministic, and what that means for caching and for your bill."],
  6:  ["ai", "Ch 1 — Planning AI Applications, pp. 78–91", "Use-case evaluation, setting expectations, milestone planning. Read it before you ship v1, not after."],
  7:  ["ai", "Ch 5 — Iterate on Your Prompts + Organize and Version Prompts, pp. 452–462", "Light rest-day reading. Prompts are software: they get versioned, reviewed and rolled back."],

  /* ---- W2 · Retrieval, context engineering & evals ---- */
  8:  ["ai", "Ch 3 — Introduction to Embedding, pp. 267–271; Ch 6 — Retrieval Algorithms, pp. 500–520", "Term-based vs embedding-based retrieval, and why hybrid beats pure vector search in practice."],
  9:  ["ai", "Ch 6 — RAG Architecture, pp. 495–500; Retrieval Optimization, pp. 520–530", "Chunking, reranking, query rewriting — the levers that actually move retrieval quality."],
  10: ["ai", "Ch 6 — RAG Beyond Texts, pp. 530–535; DMLS Ch 8 — Causes of ML System Failures, pp. 273–283", "Two books on one topic: how retrieval fails, and the general taxonomy of production failure it belongs to."],
  11: ["ai", "Ch 3 — Challenges of Evaluating Foundation Models + Exact Evaluation, pp. 232–271", "The most important reading in month 1. Entropy, cross-entropy, perplexity, functional correctness, similarity measures."],
  12: ["ai", "Ch 3 — AI as a Judge, pp. 271–295", "How to use it, why it is biased, which models can judge. Read the limitations section twice."],
  13: ["ai", "Ch 5 — Context Length and Context Efficiency, pp. 428–431; Ch 6 — Memory, pp. 581–589", "Internal knowledge vs short-term memory (context) vs long-term memory (retrieval). This framing is the whole of context engineering."],
  14: ["ai", "Ch 4 — Design Your Evaluation Pipeline, pp. 393–409", "Rest-day reading. Three steps: evaluate every component, write a guideline, then pick methods and data."],

  /* ---- W3 · Agents & the harness ---- */
  15: ["ai", "Ch 6 — Agent Overview, pp. 535–540", "The formal definition: environment, tool inventory, planner. Map it onto the harness you already drive at work."],
  16: ["ai", "Ch 6 — Tools, pp. 540–546", "Knowledge, capability and write actions. Tool design is the highest-leverage skill in agent work and the one most people skip."],
  17: ["ai", "Ch 10 — Step 1 Enhance Context + Step 3 Model Router and Gateway, pp. 853–871", "What MCP is solving, architecturally, and where a gateway belongs in the stack."],
  18: ["ai", "Ch 6 — Memory, pp. 581–589 (full section)", "Read properly today. Every agent memory bug you have hit is one of these three mechanisms being asked to do another one's job."],
  19: ["ai", "Ch 5 — Evaluate Prompt Engineering Tools, pp. 453–458; Ch 1 — Three Layers of the AI Stack, pp. 93–97", "How to judge a framework rather than collect them. Useful on the day you commit to one."],
  20: ["ai", "Ch 6 — Planning, pp. 546–576", "Plan generation, function calling, reflection, multi-agent patterns. Long but it is the core of the week."],
  21: ["ai", "Ch 10 — Step 5 Add Agent Patterns + AI Pipeline Orchestration, pp. 875–894", "Rest-day reading — the architecture view of everything you built this week."],

  /* ---- W4 · Production hardening + capstone ---- */
  22: ["ai", "Ch 10 — Monitoring and Observability, pp. 877–890; DMLS Ch 8 — Monitoring and Observability, pp. 296–309", "The same author, three years apart, on logs, traces and metrics. The DMLS version is more rigorous; read both."],
  23: ["ai", "Ch 5 — Defensive Prompt Engineering, pp. 462–490", "Jailbreaking, direct and indirect prompt injection, information extraction, defences at model / prompt / system level. Note the two metrics: violation rate and false refusal rate."],
  24: ["ai", "Ch 9 — Inference Performance Metrics, pp. 784–796; Inference Service Optimization, pp. 833–845", "TTFT, TPOT, throughput vs latency, batching. The vocabulary you need to argue about cost with a straight face."],
  25: ["ai", "Ch 6 — Agent Failure Modes and Evaluation, pp. 576–581; Ch 4 — Evaluation Criteria, pp. 316–355", "Invalid tool, valid tool with invalid parameters, goal failure, reflection failure — each with a way to measure it."],
  26: ["ai", "Ch 10 — AI Engineering Architecture, pp. 853–877 (all five steps)", "Capstone reference. Context, guardrails, router and gateway, caches, agent patterns — build your capstone against this checklist."],
  27: ["ai", "Ch 10 — User Feedback, pp. 894–925", "Conversational feedback extraction, feedback design, limitations. Almost nobody self-taught reads this, and it shows in interviews."],
  28: ["ai", "Ch 1 — AI Engineering Versus ML Engineering, pp. 97–112", "Read on packaging day. This section is, more or less, the script for how you position yourself."],

  /* ---- W5 · Math refresher + the ML you skipped ---- */
  29: ["iml", "Ch 1 — Introduction + A First Application: Classifying Iris, pp. 15–38", "Switch books. Type the iris example out by hand rather than reading it — you want the scikit-learn muscle memory."],
  30: ["ai", "Ch 7 — Backpropagation and Trainable Parameters, pp. 620–627", "Backprop framed by memory cost rather than by calculus. It complements the maths you are doing today."],
  31: ["iml", "Ch 2 — Uncertainty Estimates from Classifiers, pp. 133–145", "decision_function vs predict_proba, and calibration. Directly relevant to anything where you route on model confidence."],
  32: ["iml", "Ch 2 — Supervised ML Algorithms, pp. 43–133", "Big one — skim rather than study. You need the shape of each family: linear, trees, ensembles, SVM, neural. Come back later for depth."],
  33: ["iml", "Ch 5 — Model Evaluation and Improvement, pp. 265–316", "Cross-validation, grid search, the metrics zoo, imbalanced data. This is the chapter that makes ML screens survivable."],
  34: ["iml", "Ch 6 — Algorithm Chains and Pipelines, pp. 319–336; Ch 8 — Approaching an ML Problem, pp. 371–380", "Pipelines are how you avoid leaking test data into preprocessing. Use one in today's project."],
  35: ["dmls", "Ch 2 — Framing ML Problems, pp. 55–67", "Rest-day reading. Turning a business problem into an ML problem is the step people most often get wrong."],

  /* ---- W6 · PyTorch fluency + training real networks ---- */
  36: ["iml", "Ch 3 — Preprocessing and Scaling, pp. 146–154", "Short and practical. Scaling bugs are the most common silent failure in a training pipeline."],
  37: ["dmls", "Ch 6 — Model Development and Training, pp. 185–216", "Baselines, ensembling, experiment tracking, debugging ML models. Read it the day you first fight a training loop."],
  38: ["iml", "Ch 7 — Working with Text Data, pp. 337–361", "Bag of words, tf–idf, n-grams. The pre-transformer view of text, which is what makes tokenisers make sense."],
  39: ["ai", "Ch 2 — Model Architecture, pp. 135–151", "Read alongside building GPT from scratch. Attention, transformer blocks, and what the alternatives to transformers look like."],
  40: ["dmls", "Ch 3 — Data Engineering Fundamentals, pp. 71–104", "Formats, storage engines, dataflow, batch vs stream. The part of ML work that is actually just engineering — your home turf."],
  41: ["dmls", "Ch 4 — Training Data, pp. 108–148", "Sampling, labelling, class imbalance, augmentation. Where most real accuracy is won or lost."],
  42: ["dmls", "Ch 5 — Data Leakage, pp. 171–182", "Rest-day reading, and the highest value-per-page in the book. Ten ways your model cheats without telling you."],

  /* ---- W7 · LLM internals + fine-tuning on your Mac ---- */
  43: ["ai", "Ch 2 — Post-Training, pp. 169–187", "Supervised finetuning and preference finetuning. The step that turns a language model into something that follows instructions."],
  44: ["ai", "Ch 2 — Model Size, pp. 151–169", "Parameter counts, training compute, scaling and the bottlenecks. Pairs with the architecture-variants work today."],
  45: ["ai", "Ch 7 — Memory Math, Numerical Representations, Quantization, pp. 622–638", "Work out the memory arithmetic on paper for a model you actually want to run. It makes scaling laws concrete."],
  46: ["ai", "Ch 9 — AI Accelerators, pp. 796–808; Model Optimization, pp. 808–833", "Read on MLX day. Why your unified-memory Mac has a different performance profile from a CUDA box."],
  47: ["ai", "Ch 7 — Parameter-Efficient Finetuning, pp. 639–664", "LoRA properly: what it factorises, which layers to target, how to choose rank. Read before you run the fine-tune, not after."],
  48: ["ai", "Ch 2 — Preference Finetuning, pp. 179–187; Ch 7 — Finetuning Tactics, pp. 680–694", "RLHF, DPO and the practical tactics — hyperparameters, when to stop, what to log."],
  49: ["ai", "Ch 7 — When to Finetune + Finetuning and RAG, pp. 601–618", "Rest-day reading, and the argument you will have most often at work: finetune, or retrieve, or just prompt better."],

  /* ---- W8 · Research practice + capstone ---- */
  50: ["ai", "Ch 4 — Navigate Public Benchmarks, pp. 377–393", "How to read a benchmark claim sceptically — contamination, selection, aggregation. Good grounding for paper-reading day."],
  51: ["ai", "Ch 8 — Data Curation, pp. 697–726", "Quality, coverage, quantity, acquisition and annotation. Reproducing a result is mostly a data problem."],
  52: ["dmls", "Ch 9 — Test in Production, pp. 335–349; IML Ch 5 — Cross-Validation, pp. 266–274", "Shadow deploys, A/B, canary, interleaving, bandits — plus the offline discipline underneath them."],
  53: ["dmls", "Ch 7 — Model Deployment and Prediction Service, pp. 233–272", "Capstone reference. Deployment myths, batch vs online prediction, compression, cloud vs edge."],
  54: ["dmls", "Ch 8 — Data Distribution Shifts, pp. 283–296; Ch 9 — Continual Learning, pp. 316–335", "Interview gold. Covariate, label and concept drift, plus the four stages of continual learning."],
  55: ["dmls", "Ch 11 — The Human Side of Machine Learning, pp. 394–423", "User experience, team structure, responsible AI. Read it on positioning day — it is what senior candidates talk about."],
  56: ["dmls", "Ch 10 — Infrastructure and Tooling for MLOps, pp. 349–393 (skim); AI Eng Ch 8 — Data Synthesis, pp. 726–768", "Closing survey. Use it to decide which of the two directions — platform or data — you want the next three months to go."]
};

/* -------------------------------------------------------------------------
   The decoder — things Ivan already does at work, given their proper names.
   ------------------------------------------------------------------------- */
var DECODER = [
  {
    you: "You wire up a harness — a loop that calls the model, runs tools, feeds results back.",
    name: "Agent",
    body: "Formally: a model plus an <b>environment</b> it can act in, plus a <b>tool inventory</b>, plus a <b>planner</b>. " +
          "Success depends on exactly two things — the tool inventory and the planning capability. If an agent of yours " +
          "is bad, one of those two is the cause, and it is worth knowing which before you touch the prompt.",
    ref: "AI Engineering, Ch 6 — Agent Overview, p. 535"
  },
  {
    you: "You write skills the agent can pick up and reuse later.",
    name: "Skill library",
    body: "Voyager's term. A skill is a program; when one demonstrably helps finish a task, a skill manager adds it to the " +
          "library so it can be retrieved for future tasks. Conceptually it is a tool inventory that grows itself. " +
          "You have been running one by hand.",
    ref: "AI Engineering, Ch 6 — Planning, p. 576"
  },
  {
    you: "The agent calls a tool that doesn't exist, or calls a real one with the wrong arguments.",
    name: "Planning failure — and there are three distinct kinds",
    body: "<b>Invalid tool</b>: it invents <code>bing_search</code> that isn't in the inventory. " +
          "<b>Valid tool, invalid parameters</b>: it calls <code>lbs_to_kg</code> with two arguments when it takes one. " +
          "<b>Valid tool, incorrect parameter values</b>: right shape, wrong number. " +
          "These are separately measurable — build a planning dataset of <code>(task, tool inventory)</code> pairs, generate K plans each, " +
          "and count how often each kind occurs. That is an agent eval.",
    ref: "AI Engineering, Ch 6 — Agent Failure Modes, p. 576"
  },
  {
    you: "The agent tells you it's finished when it plainly hasn't.",
    name: "Reflection failure",
    body: "Distinct from <b>goal failure</b>, where it solves the wrong problem or ignores a constraint. Huyen's example: asked to " +
          "assign 50 people to 30 rooms, the agent assigns 40 and insists it's done. Also worth knowing: <b>time</b> is a constraint " +
          "almost every agent eval forgets — an agent that produces a correct grant proposal after the deadline has failed.",
    ref: "AI Engineering, Ch 6 — Agent Failure Modes, p. 577"
  },
  {
    you: "You keep a CLAUDE.md / system prompt and assume the model treats it as more authoritative than user text.",
    name: "System prompt vs user prompt — and why injection works",
    body: "It mostly doesn't. Both get concatenated into one blob of instructions before they reach the model, which is precisely why " +
          "prompt injection works at all. Post-training can teach a model to privilege the system prompt, but it is a tendency, " +
          "not a boundary. Defences exist at model, prompt and system level; none of them is complete.",
    ref: "AI Engineering, Ch 5 — Defenses Against Prompt Attacks, p. 483"
  },
  {
    you: "You trim and reorder context to make things fit.",
    name: "Context efficiency — and three separate memory mechanisms",
    body: "<b>Internal knowledge</b> lives in the weights and doesn't change without retraining. <b>Short-term memory</b> is the context " +
          "window: fast, limited, gone after the task. <b>Long-term memory</b> is retrieval: persistent, slower, unbounded. " +
          "Most 'the agent forgot' bugs are one of these three being asked to do another one's job.",
    ref: "AI Engineering, Ch 6 — Memory, p. 581"
  },
  {
    you: "You've noticed the same prompt gives different answers and worked around it.",
    name: "Sampling — it's a feature of the architecture, not a bug",
    body: "The model produces a probability distribution over next tokens; temperature, top-k and top-p reshape it before a token is drawn. " +
          "You cannot make it deterministic from the outside, and 'the probabilistic nature of AI' is the section to quote when someone " +
          "asks you to guarantee identical outputs.",
    ref: "AI Engineering, Ch 2 — Sampling, p. 187 · The Probabilistic Nature of AI, p. 214"
  },
  {
    you: "You force JSON out of the model with a schema or a retry loop.",
    name: "Structured outputs / constrained decoding",
    body: "Three ways to get there: prompting, post-processing, or constraining the sampler so invalid tokens are never drawn. " +
          "Only the third actually guarantees the shape. Knowing which one your library uses tells you whether your retry loop " +
          "is a safety net or the load-bearing part.",
    ref: "AI Engineering, Ch 2 — Structured Outputs, p. 206"
  },
  {
    you: "You ship when it works in your own testing.",
    name: "You don't have an evaluation pipeline yet",
    body: "The pipeline is three steps: evaluate every component in the system separately, write an evaluation guideline that defines what " +
          "good looks like, then choose methods and data. Without it a model swap is a coin flip. This is the single biggest gap between " +
          "people who use AI at work and people who are paid to build it.",
    ref: "AI Engineering, Ch 4 — Design Your Evaluation Pipeline, p. 393"
  },
  {
    you: "You tighten prompts until output looks right, then move on.",
    name: "Prompts are versioned software",
    body: "Organise and version them, keep them out of application code, and treat a prompt change like a code change — reviewable, " +
          "diffable, revertable, and gated on an eval run. The reason this feels excessive is that you have never had a prompt " +
          "regression you couldn't explain. You will.",
    ref: "AI Engineering, Ch 5 — Organize and Version Prompts, p. 458"
  },
  {
    you: "You build the product first and worry about data and models later.",
    name: "That is the AI engineering workflow, not a shortcut",
    body: "Traditional ML goes data → model → product. With foundation models available off the shelf, the order inverts: product first, " +
          "then invest in data and models once it shows promise. Huyen is explicit that full-stack engineers have the advantage here — " +
          "the ability to turn an idea into a demo and iterate is the scarce skill, not model training.",
    ref: "AI Engineering, Ch 1 — AI Engineering Versus Full-Stack Engineering, p. 112"
  },
  {
    you: "You swap to a newer model when one comes out and it seems better.",
    name: "Model selection without an eval is a vibe",
    body: "The workflow is: filter by hard constraints (cost, latency, licence, privacy), then evaluate the shortlist on <i>your</i> data " +
          "against <i>your</i> criteria, then decide build vs buy. Public benchmarks help you shortlist and nothing more — contamination and " +
          "selective reporting make them unusable as a decision. Re-running your own eval suite against each new model is the habit that " +
          "separates knowing the field from following it.",
    ref: "AI Engineering, Ch 4 — Model Selection, p. 355 · Navigate Public Benchmarks, p. 377"
  }
];
