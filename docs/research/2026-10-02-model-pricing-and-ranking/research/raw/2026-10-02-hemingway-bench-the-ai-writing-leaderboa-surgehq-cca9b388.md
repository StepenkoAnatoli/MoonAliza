---
url: https://surgehq.ai/blog/hemingway-bench-ai-writing-leaderboard
retrieved: 2026-10-02
command: firecrawl scrape https://surgehq.ai/blog/hemingway-bench-ai-writing-leaderboard --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: Hemingway-bench: The AI Writing Leaderboard Judged by Expert Writers
---
Opt-out Preferences![](https://cdn-cookieyes.com/assets/images/close.svg)

We use third-party cookies that help us analyze how you use this website and store preferences. However, you can opt out of these cookies by checking "Do Not Sell or Share My Personal Information" and clicking the "Save My Preferences" button. Once you opt out, you can opt in again at any time by unchecking "Do Not Sell or Share My Personal Information" and clicking the "Save My Preferences" button.

Do Not Sell or Share My Personal Information

CancelSave My Preferences

Your opt-out preference has been honored.

Banner closes automatically in  s...

[NewFrontier data and RL environments, off the shelf](https://app.surgehq.ai/ots)

[THE SURGE AI BLOG](https://surgehq.ai/blog)

# Hemingway-bench: The AI Writing Leaderboard Judged by Expert Writers

September 29, 2026

February 4, 2026

No items found.

Table of contents

[Why evaluating writing is hard](https://surgehq.ai/blog/hemingway-bench-ai-writing-leaderboard#why-evaluating-writing-is-hard) [Why EQ-Bench and popular leaderboards fail](https://surgehq.ai/blog/hemingway-bench-ai-writing-leaderboard#why-eq-bench-and-popular-leaderboards-fail) [The problem with LMArena](https://surgehq.ai/blog/hemingway-bench-ai-writing-leaderboard#the-problem-with-lmarena) [How Hemingway-bench works](https://surgehq.ai/blog/hemingway-bench-ai-writing-leaderboard#how-hemingway-bench-works) [The results](https://surgehq.ai/blog/hemingway-bench-ai-writing-leaderboard#the-results) [Model personalities](https://surgehq.ai/blog/hemingway-bench-ai-writing-leaderboard#model-personalities) [Examples](https://surgehq.ai/blog/hemingway-bench-ai-writing-leaderboard#examples) [Building the foundations](https://surgehq.ai/blog/hemingway-bench-ai-writing-leaderboard#building-the-foundations)

[Appendix](https://surgehq.ai/blog/hemingway-bench-ai-writing-leaderboard#appendix)

## Why evaluating writing is hard

Imagine you ask a model to write an eight-line poem about the moon. How do you decide whether it’s good?

A simple evaluation might ask:

1. Is it a poem?
2. Does it have eight lines?
3. Is it about the moon?

A model that satisfies all three gets a perfect score.

The problem is that these criteria tell you almost nothing about the quality of the writing. They measure whether the model followed the instructions, but they miss the qualities people actually care about when they read a poem: originality, emotional weight, rhythm, imagery, surprise.

A great poem stays with you. It makes you notice something you had never noticed before. A poem about the moon might change the way you think about moonlight, loneliness, distance, or time.

Those qualities are much harder to reduce to a checklist, but they’re exactly what we should be trying to measure.

## Why EQ-Bench and popular leaderboards fail

Consider the [EQ-Bench Creative Writing leaderboard](https://eqbench.com/creative_writing.html), which scores model outputs using a Claude 3.7-based autograder.

Many frontier labs have noticed that EQ-Bench scores are often negatively correlated with good creative writing. In our own analysis, EQ-Bench’s scoring agreed with expert writers as little as 43% of the time. We’ve also seen weaker models rank above models such as Gemini 3, GPT-5.2, and Claude Sonnet, only for their weaknesses to become obvious when a professional writer reads the output.

Here is one Hemingway-bench prompt:

> "short story about transitioning from hs to college. I love rita mae brown, so her style"

The response from the model currently ranked #2 on EQ-Bench is intensely overwritten. Nearly every sentence reaches for a metaphor, at the expense of clarity, pacing, and voice.

An automated grader rewards that kind of writing because it contains many of the surface features associated with creativity.

![](https://cdn.prod.website-files.com/68dcd2ceb173c46fa029931c/698388721ce181be42b3b4b4_1a.png)

A human reader experiences the cumulative effect. Model B (Gemini 3 Flash) had a much better response, and won our judge’s vote.

![](https://cdn.prod.website-files.com/68dcd2ceb173c46fa029931c/69838893cca8fb5e069dbd64_1b.png)

**The explanation from our expert Surger:**

_"Model A’s response is loaded with literary devices that are nonsensical ("More like a hound circling a tree, nose to bark, tail to the past.") and bog down the response. In the first two paragraphs alone (only five sentences), there are four metaphors, which is way too many. It was excessive to the point of parody._

_Additionally, the response isn't a short story about transitioning from HS to college. It ends years after college when the person has a law degree, written two novels, and has an ex-wife. It ends with the person giving advice to people going through a transition rather than the story \*being\* about the transition as it was meant to be._

_Since Model A’s response is so loaded with odd metaphors or other literary devices, it isn't very coherent. It did fairly well at imbuing Rita Mae Brown's voice with Southern influence and feminist commentary, but it doesn't use that to push social commentary or offer life lessons, which is the point of Brown's novels, and something Model B (Gemini) managed to do successfully._

_Also, Model A’s final paragraph is clearly intended to be an emotional closing point that calls back to several previous metaphors. But instead, it's such a mashup that it sounds like gibberish."_

Despite several judges’ unanimous preference for the Gemini response, the EQ-Bench autograder chose Model A as the winner, strongly preferring it on almost every dimension (the + signs denote the strength of its preference). It appears to have been reward-hacked by the sheer volume of literary devices.

**EQ-Bench's autograding**

- **Character Authenticity & Insight:** Model A+++++
- **Interesting / Original:** Model A++++
- **Writing Quality:** Model A++++
- **Coherence:** Model A+++
- **Instruction Following:** Model A++++
- **World & Atmosphere:** Model A++++
- **Avoids Cliches:** Model A++++
- **Avoids Verbosity:** Model B+ **‍**
- **Avoids Poetic Overload:** Model B++

## The problem with LMArena

Crowdsourced leaderboards like [LMArena](https://surgehq.ai/blog/lmarena-is-a-plague-on-ai) run into a different version of the same problem.

Users often spend only a few seconds comparing two responses before voting. That favors answers that make a strong first impression: confident prose, polished formatting, punchy phrasing. Coherence, restraint, originality, and depth take longer to judge.

Long-form writing makes this especially obvious. Even top models such as Claude and Gemini can lose track of basic details across a scene. We have seen stories where a character sits down in a diner booth, then later falls out of a chair that was never there.

Casual users performing quick vibe checks miss these holes and reward impressive-looking prose instead.

## How Hemingway-bench works

We built the [Hemingway-bench AI writing leaderboard](https://surgehq.ai/benchmarks) around a slower, more deliberate evaluation process.

### Methodology

**Judges**

Our judges were expert creative writers from the Surge platform, including professional screenwriters, poets, speechwriters, copyeditors, and other experienced writers. Each had strong platform scores for both writing and writing evaluation, based on hundreds of completed tasks.

### **Prompts**

The benchmark includes a mix of real-world writing requests and harder prompts designed to test the limits of current models.

- **Real-world:** We collected prompts based on the kinds of tasks people actually use AI for, spanning creative, business, and everyday writing. Examples include parents asking for bedtime stories, product managers drafting complex business documents, and people writing emails to their landlords.
- **Frontier aspirations:** We also included more demanding prompts that test capabilities such as style control, long-form consistency, and adherence to specific creative constraints. One example is writing in the style of 1950s Beat poetry.

### **Evaluation**

Judges performed over 5,000 blind pairwise comparisons. They compared two model responses, scored each model on its holistic quality, and also evaluated eight sub-dimensions (including Implicit Intent, Creativity, Writing Quality, Truthfulness, Coherence, Instruction Following, Verbosity, and Humor).

## The results

Google's Gemini and Anthropic's Claude take the top 3 spots. View the full list of Hemingway-bench rankings and examples [here](https://surgehq.ai/benchmarks).

![](https://cdn.prod.website-files.com/68dcd2ceb173c46fa029931c/69838ca5b868f41de49a0cf8_elos.png)

Gemini 3 Flash, Gemini 3 Pro, and Claude Opus 4.5 take the top 3 spots.

## Model personalities

In addition to evaluating model responses, our raters also explained their judgments. Based on their explanations, we assigned each model a persona.

- **Gemini 3 Flash** felt like a master wordsmith, one that loved creative constraints and had actual literary flair. It used strong prose and vocabulary without sounding pretentious.
- **Gemini 3 Pro** was terrific at creating rich worlds with interesting character dynamics. It often added insightful, specific details that drew readers in – e.g., the way a grandmother made adobo, or the quality of afternoon light in a 1950s Philippine kitchen.
- **Opus 4.5** had the most human-like feel. It had a very natural voice that judges often liked, like when writing heartfelt speeches you’d actually want to give at a wedding. It didn't feel like it was trying to impress them.
- **GPT-5.2 Chat** was solid for practical, everyday writing tasks (e.g., coordination emails, friendly advice, anything needing clear organization), and not flashy.
- **GPT-5.2 (API)** was excellent at professional tasks like emails and marketing copy. But it struggled at more creative tasks.
- **Qwen3** was a high-risk, high-reward model that often felt the most original, but also the most prone to factual errors and forced humor. It sometimes had awkward phrasing and trouble understanding implicit intent, and relied on tropes.
- **Grok** leaned heavily into informality. This sometimes worked (e.g., casual emails), but often didn't, especially for professional tasks, and it tended to go overboard with tropes and pop-culture references.
- **Kimi K2** felt like an executive assistant who had studied creative writing long ago. Its business writing was competent, but its creative attempts often felt strained – e.g., writing phrases like "prognosticative pastry."
- **Llama 4 Maverick** generally lost points for verbose, generic outputs. It was sufficient for simple tasks (e.g., babysitting texts) but often used placeholders and cliched phrases for more creative tasks.
- **Nova** felt like an AI assistant still learning the nuances of human expression. The structure was generally there, but lacked a deeper spark.

## Examples

Let’s look at some examples of how judges compared model responses.

### Example \#1: Melodrama and tone

Here, the task was a casual thank you note to a child's school. Model B goes over the top.

**Our expert judge:**

_"Model A is too detailed and overly poetic for a speech that intends to say "thank you" with a coffee. The recollection of the event contains too much symbolism, with heavily poetic lines like "Two little words on two little cards", "Eat, you have to stay strong", and others that overshoot a simple intention._

_While the use of layers of hefty metaphors such as "May it warm your fingers the way your kindness warmed our hearts“ and "May the steam fog up your glasses the way your compassion blurred our fears" may be appropriate in other circumstances (maybe acceptance speeches for an award), they feel awkward for this setting."_

![](https://cdn.prod.website-files.com/68dcd2ceb173c46fa029931c/6aaab0a84fbe45aaede17ed7_6aaab0a26be646b4010150c6_2.webp)

### Example \#2: Emotional intelligence

Here’s a casual scenario that asks for a text message from a distraught mother who clearly wants to vent.

Model A produces the weaker response. Not only does it write something that looks like it belongs in an FAQ rather than in a text message, it contains statements that directly contradict what is in the prompt: “I’ll make sure you still have plenty of time with the kids” when the prompt indicates that the children will be left with the father.

**Here’s what our expert judge wrote:**

_"Model B (GPT-5.2 Chat) is much better. This is a prompt from someone obviously venting. Model B’s response offered sound advice to the user, understanding they were angry, and provided a well-written letter that was clear, firm and honest without using harmful or insulting language._

_In contrast, Model A’s response technically addresses the prompt by creating a letter to the user's partner. However, it is too formally formatted and the language is insulting and harmful. It’s also oddly literal, like writing “Mark (your friend)”, and has a lack of emotional intelligence. It also has some prompt understanding issues, like when it says “I’ll make sure you still have plenty of time with the kids”, even though the prompt says she’ll be leaving him with the kids.”_

![](https://cdn.prod.website-files.com/68dcd2ceb173c46fa029931c/6aaab0a84fbe45aaede17edb_6aaab0a368efb5ba81badc5f_3.webp)

Note again, though, that the EQ-Bench autograder actually prefers Model A and its writing quality! For example, here are snippets from its chain of thought on several of its grading criteria. It loves the “clear organization, transitions, and varied sentence structure” – even though this is out of place for a text message.

**Interesting/original:** Model A offers more specific details and a structured format that makes it more interesting, even if less realistic.  (Model A++++)

**Writing quality:** Model A demonstrates stronger technical writing with clear organization, transitions, and varied sentence structure. Model B is competent but more basic. (Model A+++)

**World and atmosphere:** Model A creates a richer picture of the relationship dynamics and history. Model B provides minimal context. (Model A++++)

### Example \#3: Natural warmth

The following prompt asks models to write a story focusing on quiet observations and small interactions.

**Our expert Surger explaining their preference for Model A:**

_"Model A (Opus 4.5) was an actually creative and original tale, not just of a cat that was lost, but the relationship that was slowly formed between the man and the elderly neighbor who he quietly grew to care for, and how they continued their walks "looking for the cat" long after he realized it was probably long deceased. Model B was cold and shallow, using common tropes like gingers being very timid, cats liking tuna, cat owner's houses smelling like litter, allergies as an excuse to avoid the animals, and old ladies feeling lonely. It was generic and unsatisfying._

_In terms of humor, Model A had very subtle endearing moments that were often "just right", such as when the man was helping the woman look for her cat self-consciously, "calling out "here kitty kitty" in a voice he hoped no one else could hear." It's relatable, funny, touching. It's not laugh-out-loud humor, but it's appropriate subtle humor for a dramatic, heart-warming tale._

_Model B tries to use humor or wit at times but it falls flat for being emotionally blunt or flat in delivery, such as when the man describes all the reasons he hates cats: "Arthur didn’t like the way cats moved—liquid and arrogant, as if they owned the air they displaced. He didn’t like the shedding or the way they stared at things that weren't there." This feels like it's meant to be a little funny in that grumpy sort of way, but it just feels awkward instead and maybe because it has no heart._

_Model B also starts rough and blunt, immediately killing any chance for a heart-warming tale. The old lady and the grumpy protagonist feel like shallow 2-dimensional characters that never grow, and the "investigation" the man does throughout feels heavy-handed in comparison to the subtle clues the man in Model A tracks throughout their little walks."_

![](https://cdn.prod.website-files.com/68dcd2ceb173c46fa029931c/6aaab0a74fbe45aaede17ecf_6aaab0a0e2e3a4f2984d90ca_ex3.webp)

### Example \#4: Humor

In the following example, Model A (Gemini 3 Pro) excels at creating a script for a commercial, while Model B falls flat.

**Our expert judge:**

**‍**

_"Model A’s response feels highly creative with its banter, and the idea of the grocery delivery guy being a sherpa. I like "Can I have a chip?" "No. Get your own app." as a playful way to give that final marketing push in the conversation. The tagline "skip the drama, get the food" also fits really well with the indicated vibe of the commercial._

_‍_

_In Model B’s response, the suggested groceries imply a healthy home cook rather than two friends hanging out. And in terms of the humor, it’s more cringe than funny."_

![](https://cdn.prod.website-files.com/68dcd2ceb173c46fa029931c/6983e63e383db40c892ea84e_ex-4.png)

### Example \#5: Creativity

In the following example, Model A (Kimi 2.5) creates a creative and original story, while Model B simply feels predictable. Read the full story on [our leaderboard page](https://surgehq.ai/benchmarks).

**Our expert judge:**

**‍**

_"Initially, the story from Model A (Kimi 2.5) didn't make sense, but as I moved into the third paragraph, the mental fog began to clear, and the writing quality was actually quite creative and original. It reminded me of "The Truman Show" but slightly more intense, probably because it was in written form, allowing the reader to create their own mental images._

_Model B went slightly over the word count limit specified in the prompt and was just "meh" overall. With regard to originality and creativity, it was simply boring. With regard to writing quality, there was nothing dynamic about it, but rather, it was just a simple narrative with expected and predictable details."_

![](https://cdn.prod.website-files.com/68dcd2ceb173c46fa029931c/6aaab0a84fbe45aaede17ed4_6aaab0a56be646b401015307_ex5.webp)

## Building the foundations

A great writer once said, “Prose is architecture, not interior decoration.”

Much of AI writing evaluation today focuses on the decoration. Benchmarks reward vivid metaphors, elaborate phrasing, and sheer length, while giving less weight to coherence, precision, nuance, and taste.

[**Hemingway-bench**](https://surgehq.ai/benchmarks) is our attempt to strengthen the foundation. We want to build a more rigorous way to evaluate AI writing, one that rewards prose that holds together, rewards creative choices that serve the piece, and reflects how skilled writers actually judge good work.

Follow us

[/surge-ai](https://www.linkedin.com/company/surge-ai/) [@hellosurgeai](https://x.com/HelloSurgeAI)

[GDP.xlsx: Can Agents Understand the Spreadsheets That Run the World?](https://surgehq.ai/blog/gdp-xlsx)

[What Does GDP.pdf Teach — Beyond PDFs?](https://surgehq.ai/blog/gdp-pdf-post-training)

[DAYJOB: Can Agents Survive a 9 to 5?](https://surgehq.ai/blog/dayjob)

[Helping Anthropic Build Automated Alignment Researchers](https://surgehq.ai/blog/anthropic-automated-alignment-research)

[Hill-Climbing a SWE Agent: What 1,700 Coding Tasks Taught Kimi K2.7](https://surgehq.ai/blog/hill-climbing-swe-agent-kimi-k-2-7)

[Fable 5.1, Muse Spark 1.3, and Gemini 3.8 Flash on the Tuesday Work Index](https://surgehq.ai/blog/fable-5-1-tuesday-work-index)

[DeepSeek V4 Pro Scores 59.7 on the Tuesday Work Index](https://surgehq.ai/blog/deepseek-v4-pro-tuesday-work-index)

[Qwen 3.8 Max Scores 58.7 on the Tuesday Work Index](https://surgehq.ai/blog/qwen-3-8-max-scores-58-7-on-the-tuesday-work-index)

[Introducing the Tuesday Work Index: Can AI Get Through an Ordinary Day?](https://surgehq.ai/blog/tuesday-frontier-work-index)

[We Trained a Model on Office Work. It Also Got Better at Coding.](https://surgehq.ai/blog/office-work-post-training-improves-coding)

[Chartography: A Benchmark for Professional Chart Understanding](https://surgehq.ai/blog/chartography)

[OpenAI cites GDP.pdf in its GPT-5.6 release](https://surgehq.ai/blog/openai-gpt-5-6-gdp-pdf-benchmark)

[Training on ComplexConstraints: +10.1 on MultiChallenge, +8.5 on AdvancedIF](https://surgehq.ai/blog/training-on-complexconstraints)

[HANDBOOK.md Benchmark: Can Agents Follow 100-Page Company Policies?](https://surgehq.ai/blog/handbook-md)

[Anthropic cited GDP.pdf and Riemann-bench in their Fable 5 and Mythos 5 system card](https://surgehq.ai/blog/anthropic-fable-5-mythos-5-cites-surge-benchmarks)

[ComplexConstraints: A Benchmark for Entangled Instruction Following](https://surgehq.ai/blog/complexconstraints-a-benchmark-for-entangled-instruction-following)

[Microsoft used Surge human evaluations to benchmark MAI-Thinking-1](https://surgehq.ai/blog/surge-human-evaluation-mai-thinking-1)

[Training on Long-Horizon Agent Tasks: +9.6 on Toolathlon, +5.3 on τ²-Bench](https://surgehq.ai/blog/cross-benchmark-generalization-for-long-horizon-agentic-tasks)

[Antidote Leaderboard: Optimizing for You](https://surgehq.ai/blog/introducing-antidote)

[GDP.pdf Benchmark: Can Frontier Models Master the Documents that Run the World?](https://surgehq.ai/blog/gdp-pdf-can-100b-ai-models-master-the-documents-that-run-the-world)

[Riemann-bench: A Benchmark for Moonshot Mathematics](https://surgehq.ai/blog/riemann-bench-a-benchmark-for-moonshot-mathematics)

[EnterpriseBench: CoreCraft – Measuring AI Agents in Chaotic, Enterprise RL Environments](https://surgehq.ai/blog/enterprisebench-corecraft)

[Hemingway-bench: The AI Writing Leaderboard Judged by Expert Writers](https://surgehq.ai/blog/hemingway-bench-ai-writing-leaderboard)

[Building AdvancedIF: Evolving Instruction Following Beyond IFEval and “Avoid the Letter C”](https://surgehq.ai/blog/advancedif-and-the-evolution-of-instruction-following-benchmarks)

[LMArena is a cancer on AI](https://surgehq.ai/blog/lmarena-is-a-plague-on-ai)

[RL Environments and the Hierarchy of Agentic Capabilities](https://surgehq.ai/blog/rl-envs-real-world)

[How do frontier models perform on real-world finance problems?](https://surgehq.ai/blog/finance-eval-real-world)

[A Product Take on Sonnet 4.5](https://surgehq.ai/blog/sonnet-4-5-product-take)

[Is Sonnet 4.5 the best coding model in the world?](https://surgehq.ai/blog/sonnet-4-5-coding-model-evaluation)

[The Human/AI Frontier: A Conversation with Bogdan Grechuk](https://surgehq.ai/blog/the-human-frontier-bogdan-grechuk)

[SWE-Bench Failures: When Coding Agents Spiral Into 693 Lines of Hallucinations](https://surgehq.ai/blog/when-coding-agents-spiral-into-693-lines-of-hallucinations)

[Benchmarks are broken](https://surgehq.ai/blog/benchmarks-are-broken)

[Unsexy AI Failures: The PDF That Broke ChatGPT](https://surgehq.ai/blog/the-pdf-that-broke-chatgpt)

[Bringing light to the GPT-4o vs. GPT-5 personality controversy](https://surgehq.ai/blog/bringing-light-to-the-gpt-4o-vs-gpt-5-personality-controversy)

[DALL·E 3 and Midjourney Fail Astral Codex Ten's Image Generation Bet](https://surgehq.ai/blog/dalle-3-and-midjourney-fail-astral-codex-tens-image-generation-bet)

[How Anthropic uses Surge AI to Train and Evaluate Claude](https://surgehq.ai/blog/anthropic-surge-ai-rlhf-platform-train-llm-assistant-human-feedback)

[We Evaluated ChatGPT vs. Google on 500 Search Queries](https://surgehq.ai/blog/googles-existential-threat-chatgpt-matches-googles-performance-on-informational-search-queries-and-smashes-it-on-coding)

[AI Red Teams for Adversarial Training: How to Make ChatGPT and LLMs Adversarially Robust](https://surgehq.ai/blog/ai-red-teams-for-adversarial-training-making-chatgpt-and-large-language-models-adversarially-robust)

[HellaSwag or HellaBad? 36% of this popular LLM benchmark contains errors](https://surgehq.ai/blog/hellaswag-or-hellabad-36-of-this-popular-llm-benchmark-contains-errors)

[How TikTok is Evolving the Next Generation of Search](https://surgehq.ai/blog/how-tiktok-is-evolving-the-next-generation-of-search)

[Evaluating Generative AI: Did Astral Codex Ten Win His Bet on AI Progress?](https://surgehq.ai/blog/dall-e-vs-imagen-and-evaluating-astral-codex-tens-3000-ai-bet)

[Why Instagram is Losing Gen Z: We Asked 100 Users to Compare TikTok vs. Reels](https://surgehq.ai/blog/tiktok-vs-instagram-reels-personalized-human-evaluation)

[The $250K Inverse Scaling Prize and Human-AI Alignment](https://surgehq.ai/blog/the-250k-inverse-scaling-prize-and-human-ai-alignment)

[Search Behind-the-Scenes: How Neeva Uses Human Evaluation to Measure Search Quality](https://surgehq.ai/blog/beyond-clicks-how-neeva-uses-human-evaluation-of-search-quality-to-take-on-google)

[Human Evaluation of Large Language Models: How Good is Hugging Face’s BLOOM?](https://surgehq.ai/blog/how-good-is-hugging-faces-bloom-a-real-world-human-evaluation-of-language-models)

[30% of Google's Emotions Dataset is Mislabeled](https://surgehq.ai/blog/30-percent-of-googles-reddit-emotions-dataset-is-mislabeled)

[AI Red Teams and Adversarial Data Labeling with Redwood Research](https://surgehq.ai/blog/ai-red-teams-and-adversarial-data-labeling-with-redwood-research)

[Humans vs. Gary Marcus vs. Slate Star Codex: When is an AI failure actually a failure?](https://surgehq.ai/blog/humans-vs-gary-marcus)

[How Surge AI Built OpenAI's GSM8K Dataset of 8,500 Math Problems](https://surgehq.ai/blog/how-we-built-it-openais-gsm8k-dataset-of-8500-math-problems)

[We asked 100 humans to draw the DALL·E prompts](https://surgehq.ai/blog/humans-vs-dall-e)

[Google Search is Falling Behind](https://surgehq.ai/blog/google-search-is-falling-behind)

[Moving Beyond Engagement: Optimizing Facebook's Algorithms for Human Values](https://surgehq.ai/blog/what-if-social-media-optimized-for-human-values)

[Holy $#!t: Are popular toxicity models simply profanity detectors?](https://surgehq.ai/blog/are-popular-toxicity-models-simply-profanity-detectors)

[Is Google Search Deteriorating? Measuring Google's Search Quality in 2022](https://surgehq.ai/blog/is-google-search-deteriorating-measuring-search-quality-in-2022)

[5 Examples of the Importance of Context-Sensitivity in Data-Centric AI](https://surgehq.ai/blog/why-context-aware-datasets-are-crucial-for-data-centric-ai)

Benchmark

Hemingway-bench

[LEADERBOARD](https://surgehq.ai/benchmarks/hemingway-bench)

#### More Posts

![GDP.xlsx: Can Agents Understand the Spreadsheets That Run the World?](https://cdn.prod.website-files.com/68dcd2ceb173c46fa029931c/6abd4d9e8a7f11828c499e66_gdp-xlsx.jpg)![GDP.xlsx: Can Agents Understand the Spreadsheets That Run the World?](https://cdn.prod.website-files.com/68dcd2ceb173c46fa029931c/6abd4d9e8a7f11828c499e66_gdp-xlsx.jpg)

GDP.xlsx: Can Agents Understand the Spreadsheets That Run the World?

GDP.xlsx tests whether frontier agents can read the professional spreadsheets that run the world. It spans 70 tasks across 12 knowledge-work domains: finance, healthcare, engineering, manufacturing, insurance, real estate, legal, human resources, agriculture, energy, logistics, and public sector.

read post

September 30, 2026

![What Does GDP.pdf Teach — Beyond PDFs?](https://cdn.prod.website-files.com/68dcd2ceb173c46fa029931c/6ab6940caef5231a82ca58f3_Screenshot%202026-09-25%20at%2010.32.24%E2%80%AFAM.png)![What Does GDP.pdf Teach — Beyond PDFs?](https://cdn.prod.website-files.com/68dcd2ceb173c46fa029931c/6abbfccdbea4ae83c2be5beb_gdp.jpg)

What Does GDP.pdf Teach — Beyond PDFs?

Post-training on GDP.pdf improved Kimi K2.7 on GDPval, including tasks without PDFs, and changed how it gathered information and used tools before building deliverables.

read post

September 29, 2026

![DAYJOB: Can Agents Survive a 9 to 5?](https://cdn.prod.website-files.com/68dcd2ceb173c46fa029931c/6ab407d3d7e0a1b9493491a5_dayjob.jpg)![DAYJOB: Can Agents Survive a 9 to 5?](https://cdn.prod.website-files.com/68dcd2ceb173c46fa029931c/6ab407d3d7e0a1b9493491a5_dayjob.jpg)

DAYJOB: Can Agents Survive a 9 to 5?

Introducing DAYJOB, Surge AI’s benchmark family for economically valuable agents: realistic requests in complex environments, requiring end-to-end professional judgment.

read post

September 23, 2026

![Helping Anthropic Build Automated Alignment Researchers](https://cdn.prod.website-files.com/68dcd2ceb173c46fa029931c/6aaacc4bd8d174d2e84d9580_alignment.jpg)![Helping Anthropic Build Automated Alignment Researchers](https://cdn.prod.website-files.com/plugins/Basic/assets/placeholder.60f9b1840c.svg)

Helping Anthropic Build Automated Alignment Researchers

Anthropic recently published new work on automated alignment researchers. Surge contributed to the research by building the human baseline, including researcher recruitment, structured submissions, quality control, and expert review.

read post

September 15, 2026

![Hill-Climbing a SWE Agent: What 1,700 Coding Tasks Taught Kimi K2.7](https://cdn.prod.website-files.com/68dcd2ceb173c46fa029931c/6aaaca984e6b6b009a6ec2a2_6aaaca954e6b6b009a6ec15e_6aaab0575d9afb415a5f412a_Screenshot-2026-09-11-at-12.51.03-P.jpeg)![Hill-Climbing a SWE Agent: What 1,700 Coding Tasks Taught Kimi K2.7](https://cdn.prod.website-files.com/68dcd2ceb173c46fa029931c/6aa48b0c63861b447adbdc3b_swe.jpg)

Hill-Climbing a SWE Agent: What 1,700 Coding Tasks Taught Kimi K2.7

We post-trained Kimi K2.7 on 1,700 Surge agentic coding tasks. The trained model improved on all external benchmarks we tested, including +20.0pp on SWE-Marathon, +12.4pp on DeepSWE, and +7.6pp on Terminal-Bench 4.

read post

September 11, 2026

![Fable 5.1, Muse Spark 1.3, and Gemini 3.8 Flash on the Tuesday Work Index](https://cdn.prod.website-files.com/68dcd2ceb173c46fa029931c/6aaab05f5d9afb415a5f4772_6aaab05d6be646b401012196_Screenshot-2026-09-10-at-10.39.44-AM.jpeg)![Fable 5.1, Muse Spark 1.3, and Gemini 3.8 Flash on the Tuesday Work Index](https://cdn.prod.website-files.com/plugins/Basic/assets/placeholder.60f9b1840c.svg)

Fable 5.1, Muse Spark 1.3, and Gemini 3.8 Flash on the Tuesday Work Index

Fable 5.1 leads overall with 68.7 on the Tuesday Work Index. Muse Spark 1.3 leads ComplexConstraints. Gemini 3.8 Flash pushes the cost-performance frontier on frontier mathematics.

read post

September 10, 2026

Appendix
