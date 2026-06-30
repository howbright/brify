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
  "long document summary",
  "PDF summarizer",
  "document structure",
  "AI document summary",
  "AI structure map",
  "Brify",
];

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## A Practical Workflow",
    `To apply ${post.title.toLowerCase()} in real work, do not start by reading every page from beginning to end. First decide what the document is for and how you will use it later. Long documents do not give every paragraph the same weight.`,
    "Start by writing one sentence for the question the document is trying to answer. Then scan the table of contents or section headings to divide the document into large blocks. For each section, separate the main claim, supporting evidence, numbers, conditions, exceptions, and next actions.",
    "This turns the document into reusable material rather than a one-time summary. Reports, PDFs, manuals, meeting decks, and policy documents are often used again later for comparison, explanation, decisions, or follow-up work.",
    "## How to Structure It in Brify",
    `In Brify, you can organize ${post.seo_keywords[0]} with nodes such as document purpose, main conclusion, key evidence, tables and numbers, important conditions, open questions, and next actions.`,
    "The longer the document is, the more dangerous it is to collect only impressive sentences. You need to keep the relationship between claim, section, evidence, and condition visible. A structure map makes those relationships easier to review.",
    "It also helps to separate what is already clear from what still needs checking. AI summaries are useful, but long documents often contain tables, exceptions, footnotes, appendix details, or layout cues that deserve a second look.",
    "## Common Mistakes",
    "The first mistake is reducing a long document to one short paragraph. That may help you scan quickly, but it often leaves you unable to find the original evidence later.",
    "The second mistake is trusting the title and conclusion too quickly. In reports and manuals, conditions and exceptions can matter more than the conclusion itself.",
    "The third mistake is ignoring PDF layout. Tables, figures, footnotes, boxed text, and appendices can contain crucial information. Document structuring should preserve how information is arranged, not only what the main text says.",
    "## What to Do Today",
    `If you want to start working on ${post.seo_keywords[0]} today, choose one long document and mark only the title, table of contents, conclusion, tables, and important conditions first. Build a map of the document before trying to understand every line.`,
    "Then write one sentence for each major section: why might I need this section later? If the answer is clear, keep it in the structure map. If the answer is weak, treat it as background information.",
    "Small starts are enough. What matters is leaving behind a structure that helps you find, compare, explain, or reuse the document later.",
    "## Final Thoughts",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    koSlug: "how-to-summarize-long-documents",
    slug: "how-to-summarize-long-documents",
    title: "How to Summarize Long Documents",
    excerpt:
      "Learn how to summarize long documents by identifying purpose, structure, key claims, evidence, conditions, and reusable sections.",
    seo_keywords: ["how to summarize long documents", "long document summary", "document summary method", ...commonKeywords],
    intro:
      "Trying to read a long document from the first page to the last can quickly become exhausting. The goal is not to shrink every sentence. The goal is to understand what the document is trying to do and how its evidence supports its conclusion.",
    sections: [
      {
        heading: "Why Long Documents Are Hard to Summarize",
        paragraphs: [
          "Long documents are difficult because priorities are unclear. Background, evidence, exceptions, and conclusions often appear in different places.",
          "If you summarize without structure, the result may be short but hard to reuse later.",
        ],
      },
      {
        heading: "Define the Purpose First",
        paragraphs: [
          "The same document needs a different summary depending on whether you are studying, preparing a meeting, writing a report, or making a decision.",
          "Once the purpose is clear, it becomes easier to decide what to keep and what to compress.",
        ],
      },
      {
        heading: "Use Headings as a Map",
        paragraphs: [
          "A table of contents and section headings act like a map. They help you divide the document before you read every detail.",
          "Marking the role of each section gives you a more stable summary than simply extracting key sentences.",
        ],
      },
      {
        heading: "Separate Claims From Evidence",
        paragraphs: [
          "A summary that keeps only conclusions can be risky. You also need the evidence, conditions, and limits behind those conclusions.",
          "Numbers, comparison criteria, and exceptions are especially likely to matter later.",
        ],
      },
      {
        heading: "Use Brify for Long Document Structure",
        paragraphs: [
          "Brify is useful when you want to turn a long document into a structure map instead of a single paragraph.",
          "Separating purpose, conclusion, evidence, and conditions makes the document easier to revisit.",
        ],
      },
    ],
    closing:
      "Summarizing a long document is not only about making it shorter. It is about making it reusable. Use Brify to map the document before you rely on the summary.",
  },
  {
    koSlug: "common-pdf-summary-mistakes",
    slug: "common-pdf-summary-mistakes",
    title: "Common Mistakes When Summarizing a PDF",
    excerpt:
      "PDF summaries often miss tables, figures, footnotes, appendices, and layout cues. Learn what to check before trusting the summary.",
    seo_keywords: ["PDF summary mistakes", "PDF summarizer errors", "AI PDF summary", ...commonKeywords],
    intro:
      "A PDF is not just plain text. Tables, figures, footnotes, boxes, appendices, and page layout can all carry meaning. That is why summarizing a PDF requires more care than summarizing a simple text file.",
    sections: [
      {
        heading: "A PDF Is More Than Text",
        paragraphs: [
          "Important information in a PDF may live outside the main paragraphs.",
          "Tables can hold results, footnotes can explain conditions, and appendices can contain the details that make the main claim accurate.",
        ],
      },
      {
        heading: "Tables and Figures Can Disappear",
        paragraphs: [
          "AI summaries may focus on prose and reflect tables or figures weakly.",
          "After generating a PDF summary, check whether important tables and figures are represented correctly.",
        ],
      },
      {
        heading: "Footnotes and Appendices Matter",
        paragraphs: [
          "Footnotes and appendices may look secondary, but they often contain interpretation rules.",
          "In policy documents, contracts, technical guides, and reports, missing an appendix can change the meaning of the summary.",
        ],
      },
      {
        heading: "Layout Affects Meaning",
        paragraphs: [
          "PDFs use page order, boxed text, emphasis, and visual hierarchy to communicate importance.",
          "If you only extract text, the hierarchy of information can collapse.",
        ],
      },
      {
        heading: "Review PDF Summaries in Brify",
        paragraphs: [
          "Brify lets you separate main text, tables, figures, and conditions in a structure map.",
          "That makes it easier to check whether the summary still follows the structure of the original PDF.",
        ],
      },
    ],
    closing:
      "PDF summaries are fast, but missing tables and conditions can be costly. Use Brify to review the structure of the PDF alongside the summary.",
  },
  {
    koSlug: "why-document-structuring-matters",
    slug: "why-document-structuring-matters",
    title: "Why Document Structuring Matters More Than a Simple Summary",
    excerpt:
      "Document structuring helps with reuse, search, comparison, and verification in ways a short summary often cannot.",
    seo_keywords: ["document structuring", "document organization", "document summary", ...commonKeywords],
    intro:
      "A document summary helps you understand content quickly. But when you need to use the document again, structure often matters more than compression.",
    sections: [
      {
        heading: "Summary and Structure Are Different",
        paragraphs: [
          "A summary shortens content. Structure organizes content so you can find and reuse it.",
          "For long documents, those are not the same task.",
        ],
      },
      {
        heading: "When a Short Summary Is Not Enough",
        paragraphs: [
          "In a meeting or report, you may need to check the evidence behind a claim.",
          "A one-paragraph summary rarely shows which claim came from which section or condition.",
        ],
      },
      {
        heading: "Structure Makes Documents Searchable",
        paragraphs: [
          "If you organize a document by purpose, evidence, conditions, and next actions, you can find the useful part faster later.",
          "This matters for work documents as much as study materials.",
        ],
      },
      {
        heading: "Structure Helps Compare Documents",
        paragraphs: [
          "When several PDFs or reports use the same structure, comparison becomes easier.",
          "You can review each document's conclusion, evidence, and conditions in the same place.",
        ],
      },
      {
        heading: "Why Brify Fits Structuring",
        paragraphs: [
          "Brify helps turn documents into structure maps instead of ending with a flat text summary.",
          "The longer the document, the more valuable that structure becomes.",
        ],
      },
    ],
    closing:
      "Document structuring is what makes a summary useful later. Use Brify to turn long documents into searchable, reusable maps.",
  },
  {
    koSlug: "how-to-read-long-reports-faster",
    slug: "how-to-read-long-reports-faster",
    title: "How to Read Long Reports Faster",
    excerpt:
      "Read long reports faster by separating conclusions, key metrics, evidence, risks, conditions, and next actions.",
    seo_keywords: ["report summary", "how to read long reports", "report organization", ...commonKeywords],
    intro:
      "Before reading a long report from beginning to end, you need to understand what decision the report is meant to support. Reading reports faster is really about finding decision-relevant information faster.",
    sections: [
      {
        heading: "Reports Support Decisions",
        paragraphs: [
          "Many reports are written not just to inform but to support a decision.",
          "That means you should separate conclusion, evidence, risks, and recommendations.",
        ],
      },
      {
        heading: "Start With the Executive Summary and Conclusion",
        paragraphs: [
          "Read the summary and conclusion first to understand the report's direction.",
          "Then check which data and conditions support that conclusion.",
        ],
      },
      {
        heading: "Mark Key Metrics",
        paragraphs: [
          "Numbers often determine the weight of a report's conclusion.",
          "Record ratios, time periods, samples, units, and comparison criteria so you do not cite them incorrectly later.",
        ],
      },
      {
        heading: "Find Risks and Exceptions",
        paragraphs: [
          "Strong reports usually include risks and limitations.",
          "Missing those sections can make the conclusion sound stronger than it actually is.",
        ],
      },
      {
        heading: "Map Report Flow in Brify",
        paragraphs: [
          "Brify can separate conclusions, metrics, evidence, risks, and next actions in one map.",
          "This makes report review faster before a meeting or presentation.",
        ],
      },
    ],
    closing:
      "Reading a long report quickly is about finding the right information, not skipping thinking. Use Brify to structure the report's conclusion and evidence.",
  },
  {
    koSlug: "pdf-summary-tool-checklist",
    slug: "pdf-summary-tool-checklist",
    title: "How to Choose a PDF Summary Tool",
    excerpt:
      "When choosing a PDF summary tool, check table handling, source review, structure, editing, and sharing features.",
    seo_keywords: ["PDF summary tool", "PDF summarizer", "AI PDF summarizer", ...commonKeywords],
    intro:
      "There are many PDF summary tools, but they do not all solve the same problem. A good tool should help you review, edit, and reuse the PDF, not only produce a short paragraph.",
    sections: [
      {
        heading: "Summary Quality Is Not Enough",
        paragraphs: [
          "A fluent summary is not automatically a reliable summary.",
          "You need to know whether the PDF's structure and evidence are preserved.",
        ],
      },
      {
        heading: "Check Tables and Figures",
        paragraphs: [
          "PDFs often place critical information in tables and figures.",
          "A useful tool should make it possible to check whether those elements are reflected.",
        ],
      },
      {
        heading: "Return to the Source",
        paragraphs: [
          "If a summary sounds plausible but cannot be traced back to the original document, it is risky.",
          "Page or section-level source review is valuable.",
        ],
      },
      {
        heading: "Editing and Reuse Matter",
        paragraphs: [
          "A summary is a draft. In real work, you often need to edit, reorganize, or share it.",
          "Structure and editing support are important criteria for PDF summary tools.",
        ],
      },
      {
        heading: "Where Brify Fits",
        paragraphs: [
          "Brify focuses on turning PDFs into structure maps that can be reviewed and reused.",
          "That is useful when you need more than a quick summary.",
        ],
      },
    ],
    closing:
      "When choosing a PDF summary tool, look for verifiable structure, not only short output. Brify helps you review PDF summaries as maps.",
  },
  {
    koSlug: "organize-meeting-documents",
    slug: "organize-meeting-documents",
    title: "How to Organize Meeting Documents and Proposals",
    excerpt:
      "Organize meeting documents and proposals by purpose, agenda, evidence, issues, decisions, and next actions.",
    seo_keywords: ["meeting document summary", "proposal organization", "meeting notes from documents", ...commonKeywords],
    intro:
      "Meeting documents and proposals are not only reading materials. They are decision materials. That is why structure matters more than a simple summary.",
    sections: [
      {
        heading: "Meeting Documents Lead to Decisions",
        paragraphs: [
          "When reading meeting materials, first ask what decision the document is supposed to support.",
          "Without that purpose, background information and key information blend together.",
        ],
      },
      {
        heading: "Separate Agenda From Background",
        paragraphs: [
          "The agenda is what the meeting needs to discuss. Background explains why it matters.",
          "Separating them keeps the conversation more focused.",
        ],
      },
      {
        heading: "Mark Evidence and Issues",
        paragraphs: [
          "Proposals often combine claims and evidence.",
          "Marking which evidence supports which claim makes it easier to answer objections and questions.",
        ],
      },
      {
        heading: "Keep Decisions and Next Actions",
        paragraphs: [
          "After a meeting, the important output is often what was decided and who should do what next.",
          "A summary without next actions may not be useful.",
        ],
      },
      {
        heading: "Prepare the Meeting Flow in Brify",
        paragraphs: [
          "Brify can organize agenda items, evidence, issues, and possible decisions in one structure map.",
          "That makes long proposals easier to discuss.",
        ],
      },
    ],
    closing:
      "Meeting documents should lead to clear decisions. Use Brify to structure agenda, evidence, issues, and next actions before the meeting.",
  },
  {
    koSlug: "summarize-manuals-and-guides",
    slug: "summarize-manuals-and-guides",
    title: "How to Summarize Manuals and Guide Documents",
    excerpt:
      "Summarize manuals and guides by organizing procedures, conditions, exceptions, checklists, and troubleshooting steps.",
    seo_keywords: ["manual summary", "guide document summary", "work manual organization", ...commonKeywords],
    intro:
      "Manuals and guides are not usually documents you read once from beginning to end. They are documents you return to when you need the right procedure at the right time.",
    sections: [
      {
        heading: "Manuals Are Procedure Documents",
        paragraphs: [
          "In a manual, the order of actions often matters as much as the actions themselves.",
          "If the sequence is unclear, mistakes happen during implementation.",
        ],
      },
      {
        heading: "Separate Conditions and Exceptions",
        paragraphs: [
          "Guide documents often contain general rules and exceptions together.",
          "If you miss the exceptions, you may apply the guide incorrectly.",
        ],
      },
      {
        heading: "Turn the Manual Into a Checklist",
        paragraphs: [
          "A checklist makes a manual easier to use in real work.",
          "Add completion criteria for each step when possible.",
        ],
      },
      {
        heading: "Separate Troubleshooting",
        paragraphs: [
          "Troubleshooting sections are often the parts people return to most.",
          "Organize problem, cause, and action separately.",
        ],
      },
      {
        heading: "Reuse Manuals With Brify",
        paragraphs: [
          "Brify can turn procedures, conditions, exceptions, and checklists into a structure map.",
          "That makes manuals more useful for training, handoff, and repeated work.",
        ],
      },
    ],
    closing:
      "Summarizing a manual is about making it easier to execute, not only shorter. Use Brify to structure procedures and exceptions.",
  },
  {
    koSlug: "compare-multiple-pdfs",
    slug: "compare-multiple-pdfs",
    title: "How to Compare Multiple PDFs",
    excerpt:
      "Compare multiple PDFs by using the same structure for purpose, conclusion, evidence, numbers, conditions, similarities, and differences.",
    seo_keywords: ["compare multiple PDFs", "multiple PDF summary", "PDF comparison", ...commonKeywords],
    intro:
      "Summarizing several PDFs separately may feel useful at first, but it becomes confusing when you need to compare what each document actually says.",
    sections: [
      {
        heading: "Why Multiple PDF Summaries Get Confusing",
        paragraphs: [
          "Different documents use different formats, terms, and levels of detail.",
          "If the summaries do not share a structure, comparison becomes difficult.",
        ],
      },
      {
        heading: "Create Common Comparison Criteria",
        paragraphs: [
          "Choose criteria that apply to every PDF: purpose, audience, conclusion, evidence, numbers, conditions, and limitations.",
          "Repeating the same fields makes comparison much easier.",
        ],
      },
      {
        heading: "Separate Similarities and Differences",
        paragraphs: [
          "Similarities show the overall pattern. Differences show what may affect a decision.",
          "Keeping them separate makes the comparison clearer.",
        ],
      },
      {
        heading: "Check Numbers and Conditions",
        paragraphs: [
          "PDF differences often come from metrics and assumptions.",
          "Check time periods, units, samples, and comparison standards before drawing conclusions.",
        ],
      },
      {
        heading: "Connect PDFs in Brify",
        paragraphs: [
          "Brify lets you place multiple PDFs inside one structure map using shared criteria.",
          "That helps when preparing reports, meetings, or document reviews.",
        ],
      },
    ],
    closing:
      "Multiple PDFs should be compared with shared criteria, not only summarized separately. Use Brify to map similarities and differences.",
  },
  {
    koSlug: "extract-key-questions-from-documents",
    slug: "extract-key-questions-from-documents",
    title: "How to Extract Key Questions From Long Documents",
    excerpt:
      "Find the key questions in long documents so you can understand the purpose, conclusion, evidence, and issues faster.",
    seo_keywords: ["extract key questions from documents", "document key points", "document issue mapping", ...commonKeywords],
    intro:
      "To understand a long document, key questions can matter more than key sentences. Once you know what question the document is trying to answer, the details become easier to prioritize.",
    sections: [
      {
        heading: "Why Key Questions Matter",
        paragraphs: [
          "Most documents are written to solve a problem or answer a question.",
          "Without that question, it is hard to judge why the conclusion and evidence matter.",
        ],
      },
      {
        heading: "Use Titles and Headings",
        paragraphs: [
          "Titles, section headings, and tables of contents often hint at the document's questions.",
          "Try rewriting each heading as a question to reveal the structure.",
        ],
      },
      {
        heading: "Mark Repeated Terms",
        paragraphs: [
          "Repeated words and phrases often reveal the document's core issue.",
          "Grouping repeated concepts helps you see what the document is really focused on.",
        ],
      },
      {
        heading: "Turn Conclusions Back Into Questions",
        paragraphs: [
          "After reading the conclusion, ask what question that conclusion answers.",
          "This makes the document's logic easier to follow.",
        ],
      },
      {
        heading: "Build a Question-Based Map in Brify",
        paragraphs: [
          "In Brify, you can place the key question at the center and connect evidence and conclusions around it.",
          "This structure is useful for reports, presentations, and study notes.",
        ],
      },
    ],
    closing:
      "The core of a long document is often a question, not a sentence. Use Brify to connect questions, evidence, and conclusions.",
  },
  {
    koSlug: "check-ai-document-summary",
    slug: "why-you-should-check-ai-document-summaries",
    title: "Why You Should Check AI Document Summaries",
    excerpt:
      "AI document summaries are fast, but you should check missing sections, overstated conclusions, skipped conditions, and table errors.",
    seo_keywords: ["AI document summary", "check AI summary", "document summary errors", ...commonKeywords],
    intro:
      "AI document summaries are fast and convenient. But it is risky to assume they capture every condition, exception, table, and context in a long document.",
    sections: [
      {
        heading: "AI Summaries Are Starting Points",
        paragraphs: [
          "AI summaries help you scan a document quickly.",
          "But if you plan to use the summary for a decision, report, or presentation, it still needs review.",
        ],
      },
      {
        heading: "Check for Missing Sections",
        paragraphs: [
          "In long documents, some sections may be weakly reflected in the summary.",
          "Limitations, appendices, conditions, and exceptions deserve special attention.",
        ],
      },
      {
        heading: "Watch for Overstated Conclusions",
        paragraphs: [
          "AI can make cautious language sound more certain.",
          "Check the conditions under which the original document makes its claim.",
        ],
      },
      {
        heading: "Review Tables and Numbers",
        paragraphs: [
          "A wrong interpretation of a table or metric can create a serious error.",
          "Check units, time periods, comparison groups, and standards.",
        ],
      },
      {
        heading: "Use Brify to Review AI Summaries",
        paragraphs: [
          "Brify lets you separate AI summary output from source evidence in a structure map.",
          "That makes it easier to verify before trusting the summary.",
        ],
      },
    ],
    closing:
      "AI document summaries are useful starts, not final answers. Use Brify to check summary claims against the source structure.",
  },
  {
    koSlug: "use-document-summary-for-reporting",
    slug: "use-document-summary-for-reporting",
    title: "How to Use a Document Summary for Reporting or Presentations",
    excerpt:
      "Turn document summaries into reports or presentations by restructuring audience, conclusion, evidence, visuals, risks, and next actions.",
    seo_keywords: ["use document summary for reporting", "report from document summary", "presentation summary notes", ...commonKeywords],
    intro:
      "If you paste a document summary directly into a report or presentation, the flow can feel awkward. Reporting and presenting require an order that the audience can follow.",
    sections: [
      {
        heading: "Summaries and Reports Are Different",
        paragraphs: [
          "A summary helps you understand. A report helps someone else make sense of information or decide what to do.",
          "That means the same material needs to be reorganized for the audience.",
        ],
      },
      {
        heading: "Start With the Audience's Decision",
        paragraphs: [
          "Ask what your audience needs to decide or understand.",
          "Then reorder the conclusion and evidence around that need.",
        ],
      },
      {
        heading: "Do Not Include Every Piece of Evidence",
        paragraphs: [
          "Too much evidence weakens the main message.",
          "Keep the most important metrics, cases, and conditions in the main flow, and leave details as backup.",
        ],
      },
      {
        heading: "Make Next Actions Clear",
        paragraphs: [
          "Work reports usually need to lead to action.",
          "Separate decisions, open checks, owners, and next steps.",
        ],
      },
      {
        heading: "Build the Presentation Flow in Brify",
        paragraphs: [
          "Brify helps you rearrange document summaries into a presentation or reporting structure.",
          "You can see conclusion, evidence, risk, and next action in one map.",
        ],
      },
    ],
    closing:
      "A document summary is raw material for reporting. Use Brify to turn it into a structure your audience can follow.",
  },
  {
    koSlug: "make-long-documents-searchable",
    slug: "make-long-documents-searchable",
    title: "How to Make Long Documents Easy to Find Later",
    excerpt:
      "Make long documents searchable by organizing key questions, keywords, sections, evidence, tags, and source locations.",
    seo_keywords: ["document organization method", "make documents searchable", "long document organization", ...commonKeywords],
    intro:
      "Long documents become most frustrating later, when you need to find one detail again. If you cannot remember where something was, even a summary may send you back into the full source.",
    sections: [
      {
        heading: "Good Organization Is Findable",
        paragraphs: [
          "The goal of document organization is not just to prove that you read the document.",
          "It should help you find evidence, conditions, and key points when you need them.",
        ],
      },
      {
        heading: "Keep Keywords and Questions Together",
        paragraphs: [
          "Keywords without context can be weak. Questions without keywords can be hard to search.",
          "Keeping both makes later retrieval easier.",
        ],
      },
      {
        heading: "Record Section Locations",
        paragraphs: [
          "If you know which section held an important point, checking the original source becomes faster.",
          "Page numbers and heading names are especially useful.",
        ],
      },
      {
        heading: "Connect Evidence to Conclusions",
        paragraphs: [
          "A conclusion without evidence is hard to trust later.",
          "Connect claims with numbers, conditions, and source sections.",
        ],
      },
      {
        heading: "Create a Searchable Map in Brify",
        paragraphs: [
          "Brify helps organize long documents by keywords, relationships, and source logic.",
          "As documents accumulate, that structure can work like a reusable knowledge base.",
        ],
      },
    ],
    closing:
      "Long document organization is about finding the right detail later. Use Brify to keep questions, evidence, and conditions searchable.",
  },
];

async function getKoreanPost(koSlug) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("translation_group_id")
    .eq("locale", "ko")
    .eq("slug", koSlug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getExistingEnglishPost(post, translationGroupId) {
  const byGroup = await supabase
    .from("blog_posts")
    .select("id,translation_group_id")
    .eq("locale", "en")
    .eq("translation_group_id", translationGroupId)
    .maybeSingle();
  if (byGroup.error) throw byGroup.error;
  if (byGroup.data) return byGroup.data;

  const bySlug = await supabase
    .from("blog_posts")
    .select("id,translation_group_id")
    .eq("locale", "en")
    .eq("slug", post.slug)
    .maybeSingle();
  if (bySlug.error) throw bySlug.error;
  return bySlug.data;
}

const results = [];

for (const post of posts) {
  const koreanPost = await getKoreanPost(post.koSlug);
  const translationGroupId = koreanPost?.translation_group_id ?? randomUUID();
  const existing = await getExistingEnglishPost(post, translationGroupId);
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
