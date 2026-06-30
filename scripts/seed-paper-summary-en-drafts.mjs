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

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [
      `## ${section.heading}`,
      ...section.paragraphs,
    ].join("\n\n")),
    "## Final thoughts",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    koSlug: "how-to-organize-research-paper",
    slug: "how-to-organize-research-paper",
    title: "How to Organize a Research Paper Before You Summarize It",
    excerpt:
      "Learn how to organize a research paper by research question, method, findings, and limitations before turning it into a simple summary.",
    seo_keywords: [
      "research paper organization",
      "how to organize a research paper",
      "research paper summary",
      "AI structure map",
      "paper reading workflow",
      "graduate research tool",
      "Brify",
    ],
    intro:
      "The most common mistake when reading a research paper is starting with highlights. Highlighting can help, but paper organization starts with understanding the structure of the study, not collecting impressive sentences.",
    sections: [
      {
        heading: "Why research papers are hard to organize",
        paragraphs: [
          "Research papers are dense because the problem, prior work, method, findings, interpretation, and limitations are spread across different sections.",
          "If you treat every sentence with the same weight, the paper quickly turns into a pile of notes. A useful summary starts by separating the paper's structure.",
        ],
      },
      {
        heading: "Five things to check first",
        paragraphs: [
          "Before writing a summary, identify the research problem, research question, data or materials, method, main findings, and limitations.",
          "These items give you a map of the paper. Once the map is clear, the details become much easier to place.",
        ],
      },
      {
        heading: "Why the abstract is not enough",
        paragraphs: [
          "The abstract is useful, but it compresses the study. It often leaves out the conditions, limits, and methodological details that make the findings meaningful.",
          "If you plan to cite or reuse the paper, you need more than the abstract. You need a structure that points back to the original logic.",
        ],
      },
      {
        heading: "Connect question, method, and findings",
        paragraphs: [
          "A paper becomes easier to understand when you connect what it asks, how it investigates the question, and what the evidence shows.",
          "This connection is what turns a paper summary into a reusable research note.",
        ],
      },
      {
        heading: "How Brify helps",
        paragraphs: [
          "Brify turns long papers into editable structure maps. Instead of leaving you with one compressed paragraph, it helps separate the research question, method, findings, and limitations.",
          "That structure is easier to review, edit, and reuse when you prepare a report, presentation, or literature review.",
        ],
      },
    ],
    closing:
      "Organizing a research paper is not the same as shortening it. If a plain summary feels too thin, use Brify to turn the paper into a structure map you can actually revisit.",
  },
  {
    koSlug: "why-paper-summary-is-not-enough",
    slug: "why-paper-summary-is-not-enough",
    title: "Why a Research Paper Summary Is Often Not Enough",
    excerpt:
      "A research paper summary can help you scan quickly, but it often loses the method, evidence, and limitations that make the study useful.",
    seo_keywords: [
      "research paper summary",
      "paper summary limitations",
      "AI paper summary",
      "research paper analysis",
      "paper structure map",
      "Brify",
    ],
    intro:
      "A research paper summary is useful. It helps you scan a long paper, decide whether it matters, and understand the headline finding. But if you need to use the paper for real work, a summary alone is often not enough.",
    sections: [
      {
        heading: "What a paper summary does well",
        paragraphs: [
          "A good summary gives you speed. It helps you understand the topic, the basic claim, and whether the paper deserves a closer read.",
          "For unfamiliar fields, this can reduce the initial friction of reading dense academic writing.",
        ],
      },
      {
        heading: "What summaries often leave out",
        paragraphs: [
          "Summaries often compress the research question, method, data, limitations, and cautious wording.",
          "Those details matter because they determine how much trust you should place in the findings.",
        ],
      },
      {
        heading: "Method and findings should stay connected",
        paragraphs: [
          "A finding means little without the method that produced it. The same conclusion can mean very different things depending on the sample, data, and analysis.",
          "When a summary separates findings from method, it becomes easy to overstate what the paper actually shows.",
        ],
      },
      {
        heading: "When you need more than a summary",
        paragraphs: [
          "You need more than a summary when preparing a presentation, writing a report, comparing multiple papers, or checking whether an AI summary is accurate.",
          "In those cases, structure matters more than compression.",
        ],
      },
      {
        heading: "How Brify is different",
        paragraphs: [
          "Brify focuses on structure maps rather than one-paragraph summaries. It keeps the paper's logic visible so you can follow the evidence.",
          "That makes it easier to revisit the paper later and use it responsibly.",
        ],
      },
    ],
    closing:
      "A summary can start the reading process, but a structure map helps you use the paper. Brify is built for the moment when a short summary is no longer enough.",
  },
  {
    koSlug: "ai-paper-summary-tool-checklist",
    slug: "ai-paper-summary-tool-checklist",
    title: "How to Choose an AI Paper Summarizer",
    excerpt:
      "When choosing an AI paper summarizer, check summary quality, source traceability, structure, editing, and sharing features.",
    seo_keywords: [
      "AI paper summarizer",
      "AI research paper summary",
      "paper summary tool",
      "research paper AI tool",
      "paper structure map",
      "Brify",
    ],
    intro:
      "AI paper summarizers are everywhere now. Some tools summarize PDFs, some answer questions, and some extract key ideas. The real question is not only whether the summary sounds good, but whether you can trust and reuse it.",
    sections: [
      {
        heading: "Summary quality",
        paragraphs: [
          "A useful AI paper summary should include the research topic, question, method, findings, limitations, and possible use cases.",
          "If the tool only gives a polished conclusion, it may not be enough for academic work.",
        ],
      },
      {
        heading: "Source traceability",
        paragraphs: [
          "You should be able to check where the summary comes from. Research papers use careful language, and AI can make cautious claims sound stronger than they are.",
          "A good workflow makes it easy to return to the original source.",
        ],
      },
      {
        heading: "Paper structure",
        paragraphs: [
          "A paper is not just a block of text. It has a question, method, findings, discussion, and limitations.",
          "The best tool keeps those parts visible instead of flattening everything into one paragraph.",
        ],
      },
      {
        heading: "Editing and reuse",
        paragraphs: [
          "AI output is a draft. You should be able to edit it for your research question, class report, or presentation.",
          "Editable structure is more useful than a static summary when you need to work with the paper over time.",
        ],
      },
      {
        heading: "Where Brify fits",
        paragraphs: [
          "Brify turns papers into structure maps so you can review, edit, and share the logic of the paper.",
          "It is designed for people who need more than a quick summary.",
        ],
      },
    ],
    closing:
      "Choose an AI paper summarizer by asking whether it helps you verify and reuse the paper. Brify gives you a structure map for that deeper workflow.",
  },
];

const concisePosts = [
  {
    koSlug: "paper-organization-routine-for-grad-students",
    slug: "paper-organization-routine-for-grad-students",
    title: "A Research Paper Organization Routine for Graduate Students",
    excerpt: "A practical weekly routine for graduate students who need to read, organize, and reuse research papers.",
    keywords: ["graduate student research workflow", "paper organization routine", "literature review notes"],
    angle: "Graduate students need a repeatable system, not just one-off summaries.",
    sections: ["Why paper notes should accumulate", "Before reading: define your question", "While reading: connect method and findings", "After reading: connect the paper to your work", "Using Brify as a paper routine"],
  },
  {
    koSlug: "can-you-read-only-paper-abstract",
    slug: "can-you-read-only-paper-abstract",
    title: "Can You Understand a Paper by Reading Only the Abstract?",
    excerpt: "The abstract is a useful entry point, but it rarely shows enough method, data, and limitation detail.",
    keywords: ["paper abstract summary", "research paper abstract", "read papers faster"],
    angle: "The abstract is an entry point, not the whole paper.",
    sections: ["What the abstract tells you", "What the abstract leaves out", "Why the method section still matters", "Separate findings from conclusions", "Use structure after the abstract"],
  },
  {
    koSlug: "how-to-read-papers-faster",
    slug: "how-to-read-papers-faster",
    title: "How to Read Research Papers Faster Without Losing the Logic",
    excerpt: "Read papers faster by scanning the abstract, figures, research question, method, findings, and limitations first.",
    keywords: ["how to read papers faster", "paper reading workflow", "research paper summary"],
    angle: "Reading faster means finding structure first, not skipping thinking.",
    sections: ["Why linear reading takes too long", "Five places to scan first", "Use figures and tables carefully", "Track key terms", "Use Brify to see the whole structure"],
  },
  {
    koSlug: "pdf-paper-summary-mistakes",
    slug: "pdf-paper-summary-mistakes",
    title: "Common Mistakes When Summarizing a Research Paper PDF",
    excerpt: "PDF paper summaries often miss tables, figures, methods, limitations, and source context.",
    keywords: ["PDF paper summary", "PDF summarizer", "AI paper summary"],
    angle: "A PDF paper is not just plain text; layout and evidence matter.",
    sections: ["Why PDF papers are tricky", "Tables and figures can carry the result", "Check the method section separately", "Read findings with limitations", "Use Brify for PDF paper structure"],
  },
  {
    koSlug: "research-paper-organization-checklist",
    slug: "research-paper-organization-checklist",
    title: "A Checklist for Organizing One Research Paper",
    excerpt: "Use this checklist to capture a paper's question, method, findings, limitations, and relevance.",
    keywords: ["research paper checklist", "paper organization checklist", "research paper notes"],
    angle: "A checklist keeps your paper notes consistent and reusable.",
    sections: ["Why a checklist helps", "Basic paper information", "Research question and hypothesis", "Method and data", "Findings, limitations, and reuse"],
  },
  {
    koSlug: "paper-summary-for-report-risk",
    slug: "paper-summary-for-report-risk",
    title: "Why You Should Not Paste a Paper Summary Directly Into a Report",
    excerpt: "A paper summary can help with reports, but using it directly can lose context, evidence, and limitations.",
    keywords: ["paper summary for report", "research paper report", "paper evidence notes"],
    angle: "Reports need evidence structure, not just a short summary.",
    sections: ["What goes wrong with direct summaries", "Citation is not interpretation", "Include limitations", "Connect evidence to your argument", "Use Brify to organize report evidence"],
  },
  {
    koSlug: "chatgpt-paper-summary-checkpoints",
    slug: "chatgpt-paper-summary-checkpoints",
    title: "What to Check When Using ChatGPT to Summarize a Research Paper",
    excerpt: "If you use ChatGPT for paper summaries, check source evidence, missing sections, methods, and limitations.",
    keywords: ["ChatGPT paper summary", "AI paper summary", "paper summary errors"],
    angle: "ChatGPT can help, but paper summaries still need verification.",
    sections: ["What ChatGPT does well", "Check the source evidence", "Watch method and finding interpretation", "Long papers can lose sections", "Keep structure with Brify"],
  },
  {
    koSlug: "research-paper-notes-structure",
    slug: "research-paper-notes-structure",
    title: "How to Structure Research Paper Notes",
    excerpt: "Good paper notes separate research question, concepts, method, findings, limitations, and your own thoughts.",
    keywords: ["research paper notes", "paper notes structure", "research notes AI"],
    angle: "Paper notes should be a searchable knowledge structure.",
    sections: ["What good paper notes need", "Why one paragraph is not enough", "Separate notes by section", "Separate your thoughts from the paper", "Use Brify as a paper note map"],
  },
  {
    koSlug: "compare-multiple-research-papers",
    slug: "compare-multiple-research-papers",
    title: "How to Compare and Organize Multiple Research Papers",
    excerpt: "Compare multiple papers by using the same criteria: question, sample, method, findings, and limitations.",
    keywords: ["compare research papers", "literature review organization", "paper comparison"],
    angle: "Multiple papers need shared criteria, not separate summaries.",
    sections: ["Why multiple summaries get confusing", "Set comparison criteria first", "Compare methods and data", "Compare findings and limitations", "Use Brify for paper comparison"],
  },
  {
    koSlug: "can-you-trust-ai-paper-summary",
    slug: "can-you-trust-ai-paper-summary",
    title: "Can You Trust an AI Research Paper Summary?",
    excerpt: "AI paper summaries are fast, but you still need source checks, section structure, and method verification.",
    keywords: ["AI paper summary accuracy", "AI research summary", "paper summary trust"],
    angle: "AI summaries are useful starting points, not final research judgment.",
    sections: ["Why AI paper summaries can be wrong", "Long papers can lose details", "Terms and methods can be misunderstood", "Check the source habitually", "Make summaries verifiable with Brify"],
  },
  {
    koSlug: "how-to-summarize-paper-methods",
    slug: "how-to-summarize-paper-methods",
    title: "How to Summarize the Method Section of a Research Paper",
    excerpt: "Summarize a method section by separating participants, data, procedure, analysis, and limitations.",
    keywords: ["paper method section summary", "research method summary", "paper methods"],
    angle: "The method section tells you whether the findings are trustworthy.",
    sections: ["Why the method section matters", "Check participants and data", "Separate procedure and analysis", "Connect method to findings", "Map methods in Brify"],
  },
  {
    koSlug: "paper-results-vs-conclusion",
    slug: "paper-results-vs-conclusion",
    title: "Research Paper Results vs. Conclusion: What Is the Difference?",
    excerpt: "Results describe what the data showed; conclusions explain how the authors interpret those results.",
    keywords: ["paper results vs conclusion", "research paper summary", "paper reading guide"],
    angle: "Separating results and conclusions makes your summaries more accurate.",
    sections: ["Why results and conclusions differ", "What to read in the results section", "Be careful with conclusions", "Check for overstated claims", "Separate them in Brify"],
  },
  {
    koSlug: "why-paper-limitations-matter",
    slug: "why-paper-limitations-matter",
    title: "Why Research Paper Limitations Matter",
    excerpt: "Limitations help you interpret a paper accurately and avoid overstating what the research shows.",
    keywords: ["research paper limitations", "paper limitations summary", "research limitations"],
    angle: "Limitations are not just weaknesses; they define the boundary of the findings.",
    sections: ["Why limitations matter", "Sample, data, and method limits", "Stated and hidden limitations", "Use limitations in reports and reviews", "Mark limitations in Brify"],
  },
  {
    koSlug: "paper-summary-for-presentation",
    slug: "paper-summary-for-presentation",
    title: "How to Use a Paper Summary for a Presentation",
    excerpt: "A presentation needs the paper's background, question, method, findings, and limitations in a clear order.",
    keywords: ["paper summary for presentation", "research paper presentation", "paper presentation notes"],
    angle: "Presentation notes need audience-friendly structure, not just a private summary.",
    sections: ["Why presentation summaries are different", "Build the presentation flow first", "Connect background and research question", "Explain method and findings briefly", "Use Brify to build the flow"],
  },
  {
    koSlug: "what-to-check-after-ai-paper-organization",
    slug: "what-to-check-after-ai-paper-organization",
    title: "What You Still Need to Check After AI Organizes a Research Paper",
    excerpt: "Even after AI organizes a paper, you should check the question, method, findings, limitations, and relevance to your work.",
    keywords: ["AI paper organization", "AI paper summary", "research paper AI tool"],
    angle: "AI speeds up organization, but the research judgment is still yours.",
    sections: ["Why AI organization is useful", "Five things you still need to check", "Connect the paper to your purpose", "Return to the source", "Review AI structure in Brify"],
  },
];

for (const item of concisePosts) {
  posts.push({
    koSlug: item.koSlug,
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt,
    seo_keywords: [...item.keywords, "paper structure map", "AI structure map", "Brify"],
    intro: item.angle,
    sections: item.sections.map((heading, index) => ({
      heading,
      paragraphs: [
        `${heading} is a key part of ${item.title.toLowerCase()}. When you organize a paper, the goal is not only to shorten it, but to preserve the logic that makes the paper useful.`,
        index === item.sections.length - 1
          ? "Brify helps by turning the paper into an editable structure map. That makes it easier to review the research question, method, findings, and limitations without losing the source logic."
          : "Keeping this point separate makes the note easier to reuse later for reports, presentations, literature reviews, or research discussions.",
      ],
    })),
    closing: `${item.title} is ultimately about making the paper easier to verify and reuse. Brify gives you a structure map so the summary does not become a dead end.`,
  });
}

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
    seo_keywords: post.seo_keywords,
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
