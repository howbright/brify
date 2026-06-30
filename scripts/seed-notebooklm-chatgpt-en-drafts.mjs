import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();

function loadEnvFile(fileName) {
  const filePath = path.join(root, fileName);
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [
          line.slice(0, index).trim(),
          line.slice(index + 1).trim().replace(/^['"]|['"]$/g, ""),
        ];
      })
  );
}

const env = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local"), ...process.env };

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const imageUrl =
  "https://ojtkmpiiquwgetwyoyqy.supabase.co/storage/v1/object/public/blog-images/en/1781139691915-2a845d34-3b57-448b-a7b8-6626b7c23d2b-4.001.jpeg";
const bodyImageUrl =
  "https://ojtkmpiiquwgetwyoyqy.supabase.co/storage/v1/object/public/blog-images/ko/1780975282822-6cc628f6-a35f-47be-b13e-9bdfa6de3045-2026-06-09-12.20.23.png";
const bodyImageMarkdown = `![blog image](${bodyImageUrl})`;

function insertDefaultBodyImage(markdown) {
  const cleanMarkdown = markdown.trim();
  if (cleanMarkdown.includes(bodyImageUrl)) return cleanMarkdown;
  const lines = cleanMarkdown.split(/\r?\n/);
  const headings = lines
    .map((line, index) => (/^##\s+/.test(line.trim()) ? index : -1))
    .filter((index) => index > 0);
  const midpoint = Math.floor(lines.length / 2);
  const insertIndex =
    headings.find((index) => index >= midpoint) ?? headings[Math.floor(headings.length / 2)] ?? lines.length;
  lines.splice(insertIndex, 0, "", bodyImageMarkdown, "");
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const commonKeywords = [
  "NotebookLM alternative",
  "ChatGPT paper summary limitations",
  "AI paper summary tool",
  "paper structuring",
  "AI structure map",
  "Brify",
];

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## How to Turn It Into a Structure Map in Brify",
    `To use ${post.seo_keywords[0]} in a real workflow, do not treat an AI answer or summary as the final result. NotebookLM and ChatGPT can help you understand material quickly, but research papers and study materials often need to be checked, compared, rewritten, presented, or reused later.`,
    "In Brify, you can organize material into nodes such as research question, main claim, method, findings, evidence, limitations, points to verify, and how you plan to use the material. This makes it easier to return to the original source, compare multiple papers with the same criteria, and avoid losing the logic behind a fluent AI summary.",
    "For paper summaries, a natural-sounding paragraph is not enough. You need to know which part of the original source supports a claim, which conditions limit the conclusion, and whether the summary actually connects to your assignment, report, presentation, or research question.",
    "## When a Structure Map Matters More",
    "A structure map becomes especially useful when you have an AI summary but cannot remember where the evidence came from, when several papers start blending together, or when you need to explain the material in a report or presentation but only have a paragraph summary.",
    "It also matters when answers from NotebookLM or ChatGPT are copied into different places. Using more AI tools is not the same as having a better workflow. What matters is whether the results are gathered into one structure you can review and reuse.",
    "## A Quick Review Checklist",
    `If you are reviewing ${post.seo_keywords[0]} today, check four things: what is the core question, is the AI-generated conclusion connected to source evidence, are the method and limitations still visible, and can you reuse the material for writing, studying, or presenting?`,
    "If those four things are unclear, the summary may exist, but the organization is not finished. Turning the result into a Brify structure map connects fast understanding with verification, comparison, and reuse.",
    "## Final Thoughts",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    koSlug: "notebooklm-alternative-checklist",
    slug: "notebooklm-alternative-checklist",
    title: "Looking for a NotebookLM Alternative? What to Check First",
    excerpt:
      "When looking for a NotebookLM alternative, check not only summary quality, but also structure editing, source verification, multi-document management, and reuse.",
    seo_keywords: ["NotebookLM alternative", "apps like NotebookLM", "AI paper organization tool", "NotebookLM alternative for research", ...commonKeywords],
    intro:
      "Looking for a NotebookLM alternative is not just about finding a tool with similar features. People who already know or use NotebookLM usually want to understand whether their materials can be organized, edited, checked, and reused in a better workflow.",
    sections: [
      { heading: "Why People Look for a NotebookLM Alternative", paragraphs: ["NotebookLM is useful for adding sources, asking questions, and understanding material quickly.", "But if you need to edit the structure yourself, compare multiple sources with the same criteria, or reuse the material later, you may need a different kind of workflow."] },
      { heading: "Quick Understanding vs. Structure Management", paragraphs: ["Quick understanding helps you grasp the material right now.", "Structure management helps you reuse that material later for reports, literature reviews, assignments, presentations, or research notes."] },
      { heading: "Can You Check the Original Evidence?", paragraphs: ["For papers and professional documents, a summary alone is rarely enough.", "You need to see which evidence supports which claim and whether you can return to the original source when the summary needs verification."] },
      { heading: "Can You Compare and Reuse Multiple Sources?", paragraphs: ["Understanding one source is different from comparing many sources.", "When choosing an alternative, look beyond summary quality and ask whether the tool helps you accumulate and compare material in a structured way."] },
      { heading: "When Brify Fits and When It Does Not", paragraphs: ["If your main goal is fast question answering, NotebookLM may already be enough.", "If you want to edit the structure, keep evidence and limitations visible, and reuse material later, Brify’s structure map workflow may fit better."] },
    ],
    closing:
      "A NotebookLM alternative should fit the way you organize knowledge, not just offer more features. Brify is built for what happens after the first summary.",
  },
  {
    koSlug: "notebooklm-vs-brify",
    slug: "notebooklm-vs-brify",
    title: "NotebookLM vs. Brify: What Is the Difference?",
    excerpt:
      "Compare NotebookLM and Brify through quick understanding, structure editing, source checking, paper organization, and document reuse.",
    seo_keywords: ["NotebookLM vs Brify", "NotebookLM alternative", "NotebookLM comparison", "AI note tool comparison", ...commonKeywords],
    intro:
      "NotebookLM and Brify can both help with long materials, but they are built around different goals. NotebookLM is strong when you want to understand sources quickly and ask questions. Brify focuses on turning material into a structure you can edit, manage, and reuse.",
    sections: [
      { heading: "What NotebookLM Does Well", paragraphs: ["NotebookLM is useful for asking questions based on uploaded sources.", "It can help you quickly understand the broad flow of an unfamiliar document or paper."] },
      { heading: "What Brify Focuses On", paragraphs: ["Brify focuses less on receiving answers and more on leaving material as a structure map.", "It organizes key questions, claims, evidence, examples, limitations, and next actions in a visible structure."] },
      { heading: "When Summaries and Q&A Are Not Enough", paragraphs: ["Summaries and Q&A are fast, but they can become scattered when you revisit the material later.", "For multiple papers or long reports, the structure often needs to last longer than the answer."] },
      { heading: "Research and Workflows That Need Structure Maps", paragraphs: ["Literature reviews, paper comparison, report writing, and presentation preparation all need reusable structure.", "You are not only trying to understand the material; you need to track evidence and connect it to your own work."] },
      { heading: "How to Use Both Tools Together", paragraphs: ["You can use NotebookLM to get an initial understanding, then move the important parts into Brify as a structure map.", "This combines fast comprehension with longer-term organization."] },
    ],
    closing:
      "NotebookLM and Brify are not only competitors. They fit different stages of the workflow. Brify is strongest when understanding needs to become reusable structure.",
  },
  {
    koSlug: "chatgpt-paper-summary-limitations",
    slug: "chatgpt-paper-summary-limitations",
    title: "Where Do ChatGPT Paper Summary Limitations Come From?",
    excerpt:
      "ChatGPT paper summary limitations often come from missing source evidence, compressed methods, omitted conditions, and overstated conclusions.",
    seo_keywords: ["ChatGPT paper summary limitations", "ChatGPT paper summary errors", "AI paper summary limitations", "paper summary verification", ...commonKeywords],
    intro:
      "ChatGPT can summarize a research paper quickly, but paper summaries need more than fluent writing. What matters is whether the research question, method, findings, evidence, and limitations remain accurate and visible.",
    sections: [
      { heading: "Why ChatGPT Paper Summaries Are Convenient", paragraphs: ["ChatGPT can shorten a long paper and help you understand the broad direction of an unfamiliar topic.", "As a first pass before reading deeply, it can be useful."] },
      { heading: "Source Evidence Can Disappear", paragraphs: ["A summary may not show where each claim came from in the original paper.", "If you plan to cite the paper or use it in a report, you need a way to return to the source evidence."] },
      { heading: "Methods and Conditions Can Be Compressed", paragraphs: ["ChatGPT may shorten important methodological details and experimental conditions.", "But in a research paper, the data, setup, and conditions are often as important as the conclusion."] },
      { heading: "Conclusions Can Sound Stronger Than They Are", paragraphs: ["AI summaries can turn cautious wording into a more decisive statement.", "A limited finding, tendency, or possibility may start to look like a firm conclusion."] },
      { heading: "Use Brify to Review the Summary as a Structure", paragraphs: ["In Brify, you can split a ChatGPT summary into research question, evidence, method, findings, and limitations.", "The goal is to turn a readable summary into a structure you can verify."] },
    ],
    closing:
      "The main limitation of ChatGPT paper summaries is not that they are short. It is that the structure and evidence can disappear.",
  },
  {
    koSlug: "check-chatgpt-paper-summary",
    slug: "check-chatgpt-paper-summary",
    title: "What to Check After ChatGPT Summarizes a Research Paper",
    excerpt:
      "After ChatGPT summarizes a paper, check the research question, method, findings, limitations, and source evidence before using it.",
    seo_keywords: ["check ChatGPT paper summary", "verify ChatGPT paper summary", "AI paper summary checklist", "paper summary verification", ...commonKeywords],
    intro:
      "After getting a paper summary from ChatGPT, it can be tempting to save it or use it immediately. But the summary is a draft. At minimum, you should check the research question, method, findings, limitations, and source evidence.",
    sections: [
      { heading: "Check Whether the Research Question Is Correct", paragraphs: ["The first thing to verify is what question the paper is trying to answer.", "If the research question is wrong, the method and findings will be interpreted in the wrong direction."] },
      { heading: "Check the Method and Data Conditions", paragraphs: ["Sample size, dataset, study conditions, and analysis method all limit the conclusion.", "If the summary compresses these too much, return to the original paper."] },
      { heading: "Separate Findings From Interpretation", paragraphs: ["A paper’s actual findings and the authors’ interpretation should be separated.", "AI summaries can merge them into one conclusion, so check the numbers and interpretation separately."] },
      { heading: "Do Not Skip Limitations and Future Work", paragraphs: ["A good paper summary keeps the limitations visible.", "If the limitations are missing, the result can sound stronger than the paper supports."] },
      { heading: "Keep the Checklist in Brify", paragraphs: ["In Brify, you can keep the same review checklist as nodes for each paper.", "This becomes more useful as the number of papers grows."] },
    ],
    closing:
      "ChatGPT can be a fast starting point. To actually use a paper, turn the summary into a structure you can verify in Brify.",
  },
  {
    koSlug: "using-chatgpt-paper-summary-for-reports",
    slug: "using-chatgpt-paper-summary-for-reports",
    title: "Why You Should Not Use ChatGPT Paper Summaries Directly in Reports",
    excerpt:
      "Before using a ChatGPT paper summary in an assignment or report, check sources, evidence, interpretation, and citation points separately.",
    seo_keywords: ["ChatGPT paper summary for reports", "AI paper summary assignment", "paper summary report", "ChatGPT report limitations", ...commonKeywords],
    intro:
      "A ChatGPT paper summary can look smooth and convincing, but using it directly in an assignment, report, or presentation is risky. What matters is not whether the AI wrote a good paragraph, but whether you understand the paper and can show the evidence behind it.",
    sections: [
      { heading: "Why AI Summaries Can Be Risky in Assignments", paragraphs: ["Even a fluent summary may not have clear source evidence.", "In paper-based assignments, each claim needs to connect to a real part of the paper."] },
      { heading: "Check Source and Citation Points", paragraphs: ["You cannot cite an AI-generated sentence as if it were the original paper.", "Find where the idea appears in the paper and decide whether it needs a direct quote, paraphrase, or citation."] },
      { heading: "Separate Your Interpretation From AI Text", paragraphs: ["A report should include your interpretation, not only a generated summary.", "If your own judgment and the AI text are mixed together, the writing becomes shallow and hard to defend."] },
      { heading: "Rebuild the Summary for Reports or Presentations", paragraphs: ["A presentation does not need to follow the paper’s order exactly.", "It often works better as problem, method, result, meaning, limitation, and your own view."] },
      { heading: "Use Brify Before Submitting", paragraphs: ["A Brify structure map lets you check claims, evidence, and citation points before you submit or present.", "The goal is to turn a summary into a structure you can explain."] },
    ],
    closing:
      "A ChatGPT paper summary can be useful material, but it should not become the assignment itself. First, structure your understanding and evidence in Brify.",
  },
  {
    koSlug: "notebooklm-for-graduate-students-limitations",
    slug: "notebooklm-for-graduate-students-limitations",
    title: "When NotebookLM May Not Be Enough for Graduate Students",
    excerpt:
      "NotebookLM can help graduate students understand papers quickly, but paper comparison, evidence tracking, and research-gap organization may need more structure.",
    seo_keywords: ["NotebookLM for graduate students", "graduate student paper organization tool", "NotebookLM paper organization", "AI research notes", ...commonKeywords],
    intro:
      "For graduate students, reading papers is not just about understanding them once. Papers need to be reused in advisor meetings, literature reviews, research proposals, and thesis writing. That is why fast Q&A alone can become insufficient.",
    sections: [
      { heading: "Why Graduate Students Look for NotebookLM", paragraphs: ["There are too many papers to read and too little time.", "Being able to understand the core of a paper quickly and ask questions is genuinely attractive."] },
      { heading: "Quick Q&A vs. Research Notes", paragraphs: ["Q&A answers the question you have right now.", "Research notes need to preserve where the paper fits, what evidence it provides, what limitations it has, and how it connects to your own work."] },
      { heading: "Comparing Papers With the Same Criteria", paragraphs: ["Graduate students often need to compare several papers, not just understand one.", "If research question, method, data, findings, and limitations are not organized with the same structure, comparison becomes difficult."] },
      { heading: "Keep Research Gaps and Your Project Visible", paragraphs: ["In a literature review, the goal is not only to know what each paper says.", "You also need to identify open questions and connect them to your own research direction."] },
      { heading: "Build Paper Comparison Maps in Brify", paragraphs: ["Brify is useful for organizing papers with the same structure and comparing them over time.", "You can use NotebookLM for fast understanding and Brify for long-term research notes."] },
    ],
    closing:
      "Graduate students need more than quick answers. They need accumulated research structure. Brify helps keep paper comparisons and research gaps visible.",
  },
  {
    koSlug: "structure-map-for-multiple-papers",
    slug: "structure-map-for-multiple-papers",
    title: "Why Structure Maps Matter More Than ChatGPT When Reading Multiple Papers",
    excerpt:
      "When reading multiple papers, individual summaries are not enough. Organize research questions, methods, findings, limitations, and differences with the same criteria.",
    seo_keywords: ["ChatGPT multiple paper summaries", "multiple paper summaries", "AI paper comparison", "literature review AI tool", ...commonKeywords],
    intro:
      "Summarizing one paper and comparing several papers are completely different tasks. Even if ChatGPT summarizes each paper well, the results may be hard to use for a literature review if they are not organized with the same criteria.",
    sections: [
      { heading: "Why Multiple Paper Summaries Get Confusing", paragraphs: ["Each paper uses different terms, methods, research questions, and result descriptions.", "If each summary is saved separately, you later have to compare everything again."] },
      { heading: "Different Summary Criteria Create Problems", paragraphs: ["One summary may focus on methods while another focuses on findings.", "For a literature review, every paper needs to be viewed through the same structure."] },
      { heading: "Use the Same Frame for Question, Method, and Findings", paragraphs: ["Organize each paper with nodes for research question, subject, method, findings, and limitations.", "This makes similarities and differences easier to see."] },
      { heading: "Mark Differences and Research Gaps Separately", paragraphs: ["The point of paper comparison is not to prove that you read many papers.", "It is to find the next question. Differences and gaps should be kept visible."] },
      { heading: "Create Multiple-Paper Structure Maps in Brify", paragraphs: ["Brify helps organize several papers using the same structure map logic.", "That is more reusable than a pile of separate summaries."] },
    ],
    closing:
      "When reading multiple papers, the goal is not more summaries. It is comparable structure. Use Brify to organize papers in one reusable flow.",
  },
  {
    koSlug: "ai-paper-summary-tool-for-notebooklm-alternative",
    slug: "ai-paper-summary-tool-for-notebooklm-alternative",
    title: "How to Choose an AI Paper Summary Tool",
    excerpt:
      "When choosing an AI paper summary tool, check summary quality, source evidence, structure editing, multi-paper comparison, and export options.",
    seo_keywords: ["AI paper summary tool", "paper summarizer", "paper summary tool", "NotebookLM alternative", ...commonKeywords],
    intro:
      "When choosing an AI paper summary tool, many people look only at whether the summary is short and natural. But research papers require accuracy and reuse. A good tool should help with verification and structuring, not only summarization.",
    sections: [
      { heading: "Why Summary Quality Alone Is Not Enough", paragraphs: ["A natural summary does not always mean the paper was understood accurately.", "If method, limitation, and evidence are missing, the summary may look good but be hard to use."] },
      { heading: "Can You Trace Source Evidence and Sections?", paragraphs: ["Paper summaries should make it possible to return to the source.", "You need to know where conclusions, experimental conditions, and limitations came from."] },
      { heading: "Can You Edit the Structure Yourself?", paragraphs: ["AI summaries and categories are drafts.", "You should be able to adjust the structure according to your research purpose."] },
      { heading: "Can It Compare Multiple Papers?", paragraphs: ["Many users need to compare several papers rather than summarize one.", "Check whether the tool helps organize multiple papers with the same criteria."] },
      { heading: "Why Brify Fits Paper Structuring", paragraphs: ["Brify centers the workflow around structure maps instead of paragraph summaries.", "It helps you see research questions, methods, findings, limitations, and intended use at a glance."] },
    ],
    closing:
      "An AI paper summary tool should leave a structure you can verify, not only a fast summary. Brify helps organize the research workflow after summarization.",
  },
  {
    koSlug: "notebooklm-chatgpt-paper-workflow",
    slug: "notebooklm-chatgpt-paper-workflow",
    title: "Why NotebookLM and ChatGPT Together Can Still Leave Papers Disorganized",
    excerpt:
      "Even when using NotebookLM and ChatGPT together, paper organization can fail if summaries and answers are scattered and no reusable structure is created.",
    seo_keywords: ["NotebookLM ChatGPT paper workflow", "NotebookLM ChatGPT comparison", "AI paper organization workflow", "research material organization", ...commonKeywords],
    intro:
      "Using NotebookLM and ChatGPT together can sound powerful, but it can also scatter your research materials. If one tool gives Q&A answers, another rewrites summaries, and the results are saved separately, the research structure may never accumulate.",
    sections: [
      { heading: "Why People Use NotebookLM and ChatGPT Together", paragraphs: ["NotebookLM is useful for source-based questions, while ChatGPT is useful for rewriting and restructuring text.", "Many users combine both tools to understand papers faster."] },
      { heading: "Summaries and Answers Can Become Scattered", paragraphs: ["If you copy answers from different tools into different places, it becomes hard to trace where each idea came from.", "You may have more answers but less structure."] },
      { heading: "Questions Remain, but Structure Does Not", paragraphs: ["You may remember what you asked, but the paper’s research question, method, findings, and limitations may not remain in a consistent frame.", "The center of organization should be the material, not the tool conversation."] },
      { heading: "Merge AI Outputs Into One Research Structure", paragraphs: ["When NotebookLM answers and ChatGPT summaries are moved into one structure map, overlaps and missing points become visible.", "You can also mark which claims need source verification."] },
      { heading: "Use Brify as a Structuring Hub", paragraphs: ["Brify can serve as a hub for organizing outputs from multiple AI tools around research questions, evidence, limitations, and intended use.", "Instead of collecting tool answers, gather them into one usable structure."] },
    ],
    closing:
      "Using many AI tools is less important than managing their outputs in one structure. Brify helps make that structure visible and reusable.",
  },
  {
    koSlug: "organize-ai-paper-summaries",
    slug: "organize-ai-paper-summaries",
    title: "How to Organize AI Paper Summaries When They Still Feel Messy",
    excerpt:
      "If AI paper summaries still feel disorganized, restructure them around research question, method, findings, evidence, limitations, and intended use.",
    seo_keywords: ["organize AI paper summaries", "after paper summary organization", "AI summary organization method", "paper structuring tool", ...commonKeywords],
    intro:
      "If AI has summarized a paper but your thoughts still feel messy, that is normal. A summary reduces information, but it does not automatically decide how you should compare, explain, cite, or reuse that information.",
    sections: [
      { heading: "Why AI Summaries Can Still Feel Disorganized", paragraphs: ["Summaries are usually written as readable paragraphs.", "But if research question, evidence, method, findings, and limitations are not separated, the summary is hard to use in real work."] },
      { heading: "Rebuild the Summary Around the Research Question", paragraphs: ["Start by placing the paper’s main question at the center.", "Then break the summary into question, method, findings, and limitations."] },
      { heading: "Separate Method, Findings, and Limitations", paragraphs: ["The method explains the conditions behind the result.", "The limitations show how far the result can be trusted. Without these, the summary may look too optimistic."] },
      { heading: "Connect the Summary to Your Writing or Presentation Goal", paragraphs: ["A paper summary is usually saved because you plan to use it.", "Mark what belongs in a presentation, what evidence can support a report, and what still needs checking."] },
      { heading: "Turn AI Summaries Into Research Structure Maps in Brify", paragraphs: ["Brify helps reorganize AI summaries around research questions, evidence, limitations, and intended use.", "Instead of piling up summaries, turn them into structures you can actually use."] },
    ],
    closing:
      "After AI summarization, the next step is not more summaries. It is better structure. Brify helps turn paper summaries into research structure maps.",
  },
];

async function getKoreanPost(post) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("translation_group_id")
    .eq("locale", "ko")
    .eq("slug", post.koSlug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getExistingEnglishPost(translationGroupId, post) {
  const { data: byGroup, error: groupError } = await supabase
    .from("blog_posts")
    .select("id,translation_group_id")
    .eq("locale", "en")
    .eq("translation_group_id", translationGroupId)
    .maybeSingle();
  if (groupError) throw groupError;
  if (byGroup) return byGroup;

  const { data: bySlug, error: slugError } = await supabase
    .from("blog_posts")
    .select("id,translation_group_id")
    .eq("locale", "en")
    .eq("slug", post.slug)
    .maybeSingle();
  if (slugError) throw slugError;
  return bySlug;
}

const results = [];

for (const post of posts) {
  const koreanPost = await getKoreanPost(post);
  const translationGroupId = koreanPost?.translation_group_id ?? randomUUID();
  const existing = await getExistingEnglishPost(translationGroupId, post);
  const markdown = insertDefaultBodyImage(buildMarkdown(post));
  const payload = {
    locale: "en",
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    seo_keywords: Array.from(new Set(post.seo_keywords)),
    image_url: imageUrl,
    markdown,
    status: "draft",
    published_at: null,
    translation_group_id: translationGroupId,
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from("blog_posts")
      .update(payload)
      .eq("id", existing.id)
      .select("id,locale,slug,title,status,seo_keywords,translation_group_id,updated_at")
      .single();
    if (error) throw error;
    results.push({ action: "updated", ...data });
  } else {
    const { data, error } = await supabase
      .from("blog_posts")
      .insert(payload)
      .select("id,locale,slug,title,status,seo_keywords,translation_group_id,updated_at")
      .single();
    if (error) throw error;
    results.push({ action: "created", ...data });
  }
}

console.log(JSON.stringify({ count: results.length, results }, null, 2));
