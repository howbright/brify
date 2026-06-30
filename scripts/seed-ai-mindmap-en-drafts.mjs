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
  "AI mind map",
  "AI structure map",
  "text to mind map",
  "document structuring",
  "AI summary",
  "Brify",
];

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## A Practical Workflow",
    `To apply ${post.seo_keywords[0]} in real work or study, first think less about making a pretty diagram and more about what you need to find again later. A mind map is useful for branching from a central topic, but in serious study and work, the relationships between claims, evidence, examples, and conditions matter even more.`,
    "First, write the core question the material is trying to answer. Second, scan the text, transcript, document, notes, or summary for repeated themes and important conclusions. Third, separate the evidence and examples that support those conclusions. Fourth, mark the source locations or uncertain points that should be checked again.",
    "This turns an AI mind map into a reusable structure rather than a visual decoration. The longer the source material is, the more important this structure becomes. Articles, PDFs, YouTube videos, lecture notes, meeting documents, and research summaries are all easier to reuse when their logic is visible.",
    "## How to Structure It in Brify",
    `In Brify, you can organize ${post.seo_keywords[0]} with nodes such as key question, main topics, conclusion, evidence, examples, points to verify, and next actions.`,
    "This gives you a view that feels like a mind map but works more like a practical structure map. You can see which argument is supported by which evidence, which example matters most, and what still needs to be checked against the original material.",
    "That is why Brify emphasizes AI structure maps. A fluent AI summary can be useful, but it is not enough when you need to study, report, present, or make a decision. The structure behind the summary should remain visible and editable.",
    "## Common Mistakes",
    "The first mistake is treating an AI mind map as a finished visual result. A clean layout can still be weak if it misses the core question, the evidence, or the conditions behind a conclusion.",
    "The second mistake is confusing summarization with structuring. A summary makes content shorter. Structuring makes the shortened content easier to inspect, verify, and reuse.",
    "The third mistake is trusting AI categories without review. AI can group topics too broadly, skip important evidence, or make a cautious conclusion sound stronger than it really is. A useful map should leave room for human checking.",
    "## What to Do Today",
    `If you want to start working on ${post.seo_keywords[0]} today, choose one long source and write only three things first: what question does this source answer, what is the most important conclusion, and where is the evidence for that conclusion?`,
    "Then place the key question at the center of a Brify map and connect topics, conclusions, evidence, examples, and verification points around it. The first map does not have to be perfect. What matters is leaving a structure that helps you regain the context later.",
    "Start small. Turning one article, one PDF, or one video into a structure map is enough to feel the difference between a short summary and a reusable knowledge structure.",
    "## Final Thoughts",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    koSlug: "what-is-ai-mindmap",
    slug: "what-is-ai-mindmap",
    title: "What Is an AI Mind Map and How Can You Use It?",
    excerpt:
      "Learn what an AI mind map is and how it can help organize long articles, documents, lectures, YouTube videos, and research notes.",
    seo_keywords: ["AI mind map", "AI mind mapping tool", "automatic mind map", "mind map AI", ...commonKeywords],
    intro:
      "An AI mind map is not just a tool that automatically draws attractive branches. It is closer to a way of turning complex information, such as long articles, documents, lectures, videos, and notes, into a structure you can understand at a glance.",
    sections: [
      { heading: "Why AI Mind Maps Are Useful", paragraphs: ["The longer a source becomes, the harder it is to keep the whole flow in your head.", "An AI mind map helps you quickly separate the main topic from supporting ideas so you can see the overall structure."] },
      { heading: "How AI Mind Maps Differ From Regular Mind Maps", paragraphs: ["A regular mind map usually depends on the user manually creating and arranging branches.", "An AI mind map starts by extracting repeated themes, key concepts, and relationships from the source material."] },
      { heading: "What Can You Turn Into a Mind Map?", paragraphs: ["Long articles, PDFs, meeting documents, lecture notes, YouTube transcripts, and research summaries can all be structured.", "The important part is not the file type, but whether the ideas and relationships inside it can be separated clearly."] },
      { heading: "Summary vs. Mind Map", paragraphs: ["A summary makes content shorter.", "A mind map shows how ideas connect, which makes the material easier to revisit and explain."] },
      { heading: "Why Brify Focuses on AI Structure Maps", paragraphs: ["Brify combines the visual clarity of a mind map with the practical value of document structuring.", "Instead of stopping at a simple mind map, it keeps evidence and relationships visible through an AI structure map."] },
    ],
    closing:
      "An AI mind map is a starting point for turning complex information into an understandable structure. Use Brify to turn long material into an AI structure map you can actually reuse.",
  },
  {
    koSlug: "ai-structure-map-vs-ai-mindmap",
    slug: "ai-structure-map-vs-ai-mindmap",
    title: "AI Structure Map vs. AI Mind Map: What Is the Difference?",
    excerpt:
      "Compare AI structure maps and AI mind maps, and learn why structure can matter more than a short summary.",
    seo_keywords: ["AI structure map", "structure map", "AI structuring", "mind map structure", ...commonKeywords],
    intro:
      "AI mind maps and AI structure maps may look similar, but they are designed for slightly different jobs. A mind map is strong at expanding ideas, while a structure map focuses on preserving the logic and evidence inside source material.",
    sections: [
      { heading: "Mind Maps Expand Ideas", paragraphs: ["A mind map is useful when you want to branch out from a central topic.", "It works well for brainstorming, exploring concepts, and seeing related ideas quickly."] },
      { heading: "Structure Maps Preserve Relationships", paragraphs: ["A structure map rearranges existing material into relationships you can inspect.", "Its focus is on how claims, evidence, examples, and conditions connect."] },
      { heading: "When a Summary Is Not Enough", paragraphs: ["A summary is fast to read, but it can blur where the evidence came from or how the logic flows.", "Reports, lectures, and research materials often need structure because you may need to check them again later."] },
      { heading: "Keep Logic, Evidence, and Examples Together", paragraphs: ["If only the conclusion remains, it is hard to know why that conclusion was reached.", "When evidence and examples stay attached, the material becomes safer to reuse."] },
      { heading: "How Brify Uses AI Structure Maps", paragraphs: ["Brify does not end long material with a single short summary.", "It turns information into a structure map so users can scan the result while still tracking the evidence."] },
    ],
    closing:
      "An AI structure map goes beyond a good-looking mind map. It makes material easier to check, explain, and reuse. Brify is built around that deeper kind of structuring.",
  },
  {
    koSlug: "turn-text-into-mindmap",
    slug: "turn-text-into-mindmap",
    title: "How to Turn Text Into a Mind Map",
    excerpt:
      "Learn how to turn long text into a mind map by separating core topics, subtopics, evidence, examples, and action points.",
    seo_keywords: ["text to mind map", "turn text into mind map", "writing mind map", "automatic mind map generator", ...commonKeywords],
    intro:
      "Turning written text or notes into a mind map can make the material much easier to understand. The goal is not simply to shorten sentences, but to reveal the relationships hidden inside them.",
    sections: [
      { heading: "Why Turn Text Into a Mind Map?", paragraphs: ["Long text usually has to be read from beginning to end before the flow becomes clear.", "A mind map lets you see the central topic and supporting points at once."] },
      { heading: "Start With the Core Question", paragraphs: ["Before structuring text, ask what question the text is trying to answer.", "That question helps you decide which paragraphs are central and which are supporting details."] },
      { heading: "Group Paragraphs by Role", paragraphs: ["If you simply move every paragraph into a map, the result becomes cluttered.", "It is better to separate paragraphs into topic, evidence, example, conclusion, and action."] },
      { heading: "Connect Evidence and Examples", paragraphs: ["A useful structure shows how evidence supports the main point.", "Examples should remain connected to the claim they explain instead of floating alone."] },
      { heading: "Create a Text Structure Map in Brify", paragraphs: ["Brify helps turn copied text, notes, or drafts into a structure map.", "That makes old notes easier to review, rewrite, and reuse."] },
    ],
    closing:
      "A text mind map is a structure for understanding long writing again later. Use Brify to turn text into a map where relationships are visible.",
  },
  {
    koSlug: "turn-writing-into-mindmap",
    slug: "turn-writing-into-mindmap",
    title: "Why Turn Your Writing Into a Mind Map?",
    excerpt:
      "Turning writing into a mind map helps reveal topic flow, weak logic, repeated paragraphs, and missing evidence before editing.",
    seo_keywords: ["turn writing into mind map", "writing structure", "writing summary mind map", "writing organization tool", ...commonKeywords],
    intro:
      "Turning your writing into a mind map does more than make it easier to read. It can reveal the flow of your argument, repeated sections, missing evidence, and weak connections.",
    sections: [
      { heading: "Why Long Writing Is Hard to See Clearly", paragraphs: ["Writing is read line by line, so the full structure is difficult to see at once.", "Drafts can become especially unclear when paragraphs are long or repetitive."] },
      { heading: "Find the Main Claim", paragraphs: ["Before mapping a draft, identify the central claim the writing is trying to make.", "If the main claim is unclear, the supporting paragraphs will be hard to organize."] },
      { heading: "Find Repetition and Missing Evidence", paragraphs: ["When the draft is opened as a structure, repeated points become easier to notice.", "You can also see where a conclusion exists without enough evidence."] },
      { heading: "Review Structure Before Polishing Sentences", paragraphs: ["It is often better to check structure before editing wording.", "A map can show which paragraphs should be merged, moved, or strengthened."] },
      { heading: "Use Brify to Check the Flow", paragraphs: ["Brify helps divide writing into main claim, subtopics, evidence, and examples.", "It is useful before rewriting a draft or preparing presentation material."] },
    ],
    closing:
      "A mind map can show what is weak in your writing before you spend time polishing sentences. Use Brify to open your draft as a structure map.",
  },
  {
    koSlug: "organize-documents-as-mindmap",
    slug: "organize-documents-as-mindmap",
    title: "The Easiest Way to Organize Documents as a Mind Map",
    excerpt:
      "Organize reports, proposals, and meeting documents as mind maps by separating purpose, conclusion, evidence, conditions, and next actions.",
    seo_keywords: ["document mind map", "document structure", "document organization mind map", "AI document organizer", ...commonKeywords],
    intro:
      "Organizing a document as a mind map can make long reports and proposals much easier to scan. But a useful document mind map should keep not only the conclusion, but also the evidence and conditions behind it.",
    sections: [
      { heading: "Document Summary vs. Document Mind Map", paragraphs: ["A document summary shows the content in a shorter form.", "A document mind map shows how purpose, conclusion, evidence, and conditions connect."] },
      { heading: "Start With Purpose and Conclusion", paragraphs: ["Before structuring a document, ask what the document is trying to explain or decide.", "Once the purpose and conclusion are clear, the rest of the information becomes easier to prioritize."] },
      { heading: "Separate Evidence, Conditions, and Exceptions", paragraphs: ["A conclusion is more reliable when the supporting evidence and conditions remain visible.", "Exceptions and limitations should also be marked so the document is not reused incorrectly."] },
      { heading: "Turn It Into a Meeting or Reporting Structure", paragraphs: ["Work documents often lead to discussion or decisions.", "Adding issues, risks, and next actions makes the map more useful for meetings."] },
      { heading: "Create Document Structure Maps in Brify", paragraphs: ["Brify turns documents into reusable structure maps instead of one-paragraph summaries.", "This helps you understand reports, proposals, and meeting materials more quickly."] },
    ],
    closing:
      "A document mind map should keep conclusions and evidence together. Use Brify to turn documents into structure maps you can review and reuse.",
  },
  {
    koSlug: "turn-summary-into-mindmap",
    slug: "turn-summary-into-mindmap",
    title: "Why You Should Turn Summaries Into Mind Maps",
    excerpt:
      "Turning AI summaries into mind maps makes claims, evidence, examples, and points to verify easier to inspect.",
    seo_keywords: ["summary mind map", "summary structure", "organize summaries", "AI summary mind map", ...commonKeywords],
    intro:
      "Even when you already have an AI summary, the result can still be hard to revisit later. A summary is quick to read, but it may hide the relationships between claims and evidence.",
    sections: [
      { heading: "Why Summaries Can Still Be Hard to Reuse", paragraphs: ["Summaries are usually written as connected paragraphs.", "They may be shorter than the original, but they do not always show what is central and what needs to be checked."] },
      { heading: "Separate Claims From Evidence", paragraphs: ["When turning a summary into a mind map, first separate conclusions from the evidence behind them.", "This makes it easier to judge whether the summary is reliable."] },
      { heading: "Mark Missing Examples and Verification Points", paragraphs: ["AI summaries can skip examples or conditions.", "A mind map gives you a place to mark what should be checked in the original source."] },
      { heading: "Turn Summaries Into Presentations or Reports", paragraphs: ["A summary alone can feel flat in a presentation.", "A structure map makes it easier to rearrange conclusions, evidence, examples, and next actions into a clearer flow."] },
      { heading: "Build Summary Structure Maps in Brify", paragraphs: ["Brify helps you treat an AI summary as the starting point, not the final answer.", "You can restructure the summary, review weak points, and turn it into reusable material."] },
    ],
    closing:
      "A summary is a starting point, while a mind map supports review and reuse. Use Brify to turn AI summaries into clearer structure maps.",
  },
  {
    koSlug: "pdf-to-mindmap-checklist",
    slug: "pdf-to-mindmap-checklist",
    title: "What to Check When Turning a PDF Into a Mind Map",
    excerpt:
      "When turning a PDF into a mind map, check tables, figures, footnotes, appendices, and conditions so the structure stays accurate.",
    seo_keywords: ["PDF mind map", "PDF structure", "PDF summary mind map", "AI PDF organizer", ...commonKeywords],
    intro:
      "Turning a PDF into a mind map can make a long document much easier to understand. But a PDF is not just plain text, so tables, figures, footnotes, and appendices need to be considered too.",
    sections: [
      { heading: "A PDF Is Not Just Text", paragraphs: ["A PDF may contain body text, tables, charts, boxes, footnotes, and appendices.", "Some of the most important evidence may appear outside the main paragraphs."] },
      { heading: "Reflect Tables and Figures in the Structure", paragraphs: ["Tables and figures often support the main conclusion.", "Marking them separately in the mind map makes the document easier to verify."] },
      { heading: "Check Footnotes and Appendices", paragraphs: ["Footnotes and appendices may look secondary, but they often contain interpretation conditions.", "Missing those conditions can lead to using the PDF incorrectly."] },
      { heading: "Review the PDF Summary as a Map", paragraphs: ["A PDF summary alone may not show what was omitted.", "A mind map lets you check body text, tables, conditions, and appendices separately."] },
      { heading: "Create PDF Structure Maps in Brify", paragraphs: ["Brify is designed for workflows where PDFs are not reduced to one short paragraph.", "It helps you leave long PDFs in a form that can be checked again later."] },
    ],
    closing:
      "A PDF mind map should include more than the body text. Use Brify to structure PDFs in a way that keeps evidence and conditions visible.",
  },
  {
    koSlug: "youtube-video-to-mindmap",
    slug: "youtube-video-to-mindmap",
    title: "How to Turn a YouTube Video Into a Mind Map",
    excerpt:
      "Turn YouTube videos into mind maps by organizing the key question, sections, claims, examples, and parts to rewatch.",
    seo_keywords: ["YouTube mind map", "video mind map", "YouTube summary mind map", "lecture video mind map", ...commonKeywords],
    intro:
      "YouTube videos are easy to save but hard to find again. Turning a video into a mind map helps you keep the key question, important sections, examples, and parts to rewatch in one structure.",
    sections: [
      { heading: "Why Videos Need Structure", paragraphs: ["Videos move in time, so specific information can be hard to find later.", "Structuring the video lets you revisit the content by topic instead of by timeline alone."] },
      { heading: "Use Captions and Chapters to Find Sections", paragraphs: ["YouTube captions and chapters are good starting points for structuring a video.", "Repeated keywords and transitions often reveal the important sections."] },
      { heading: "Separate Claims, Examples, and Rewatch Points", paragraphs: ["A claim is close to the video’s conclusion, while an example helps explain it.", "Rewatch points should be saved with timestamps or questions."] },
      { heading: "Organize Lecture Videos Around Concepts", paragraphs: ["Lecture videos require more concept-focused structure than general videos.", "Definitions, examples, questions, and review points should stay connected."] },
      { heading: "Create YouTube Structure Maps in Brify", paragraphs: ["Brify lets you keep the key question, claims, examples, and rewatch sections of a video in a structure map.", "That makes the video easier to review or use as source material later."] },
    ],
    closing:
      "A YouTube mind map is a structure for finding and reviewing video knowledge. Use Brify to turn videos into maps you can revisit.",
  },
  {
    koSlug: "ai-mindmap-tool-checklist",
    slug: "ai-mindmap-tool-checklist",
    title: "How to Choose an AI Mind Mapping Tool",
    excerpt:
      "Choose an AI mind mapping tool by checking input types, structure quality, editability, source review, and sharing features.",
    seo_keywords: ["AI mind mapping tool", "AI mind map generator", "automatic mind map tool", "structuring tool", ...commonKeywords],
    intro:
      "When choosing an AI mind mapping tool, it is not enough to look at whether the result is visually attractive. What matters is what material the tool can handle, whether the structure is accurate, and whether you can review and edit the result.",
    sections: [
      { heading: "Why a Pretty Mind Map Is Not Enough", paragraphs: ["A beautiful mind map can still be weak if the logical structure is wrong.", "For study or work, the relationships between evidence and conclusions need to remain visible."] },
      { heading: "Check Supported Input Types", paragraphs: ["A useful tool should handle text, documents, PDFs, video summaries, and other source types.", "If input options are limited, the tool’s real use cases become limited too."] },
      { heading: "Check Whether the Structure Makes Sense", paragraphs: ["Review whether AI-created branches are grouped logically.", "If a key conclusion is buried as a minor example or evidence is missing, the map needs revision."] },
      { heading: "Check Editability and Source Review", paragraphs: ["An AI mind map should be treated as a draft.", "You need to edit it and check the original source before using it as reliable material."] },
      { heading: "Why Brify Fits a Structuring Workflow", paragraphs: ["Brify focuses on turning summaries into structure maps that can be reviewed and reused.", "It values usable structure over a decorative visual result."] },
    ],
    closing:
      "An AI mind mapping tool should give you a structure you can verify, not just a pretty result. Brify is designed for summary, structure, and reuse.",
  },
  {
    koSlug: "check-ai-generated-mindmap",
    slug: "check-ai-generated-mindmap",
    title: "Why You Should Check AI-Generated Mind Maps",
    excerpt:
      "AI-generated mind maps should be checked for missing evidence, wrong topic grouping, overstated conclusions, and source verification points.",
    seo_keywords: ["check AI mind map", "check AI summary", "mind map errors", "AI structuring errors", ...commonKeywords],
    intro:
      "AI-generated mind maps are fast and convenient, but they should not replace your own understanding. AI can group topics incorrectly, skip evidence, or make a conclusion sound stronger than it is.",
    sections: [
      { heading: "An AI Mind Map Is a Draft", paragraphs: ["AI can quickly classify material and create a first structure.", "That structure should still be reviewed according to your goal."] },
      { heading: "Check Wrong Topic Grouping", paragraphs: ["AI may group ideas together because they use similar words.", "If the meanings are different, the resulting structure can be misleading."] },
      { heading: "Look for Missing Evidence and Examples", paragraphs: ["Important evidence or examples may disappear from an AI-generated map.", "If a conclusion remains without support, go back to the original source."] },
      { heading: "Be Careful With Overstated Conclusions", paragraphs: ["AI can turn cautious language into a more decisive claim.", "This matters especially for reports, study notes, and work decisions."] },
      { heading: "Review AI Structure Maps in Brify", paragraphs: ["Brify lets you edit and review AI-generated structures.", "Keeping source evidence and verification points visible makes the map safer to use."] },
    ],
    closing:
      "An AI mind map is a fast draft, not something you need to trust blindly. Use Brify to review and improve the structure before relying on it.",
  },
  {
    koSlug: "use-ai-mindmap-for-study",
    slug: "use-ai-mindmap-for-study",
    title: "How to Use AI Mind Maps for Studying",
    excerpt:
      "Use AI mind maps for studying by organizing concepts, definitions, examples, questions, and review points into a clear structure.",
    seo_keywords: ["AI mind map for studying", "study mind map", "AI study notes", "concept mind map", ...commonKeywords],
    intro:
      "Using AI mind maps for studying can make long lecture notes and reading materials easier to review. But a study mind map should be more than a pretty note. It should support recall and understanding.",
    sections: [
      { heading: "Why Study Mind Maps Help", paragraphs: ["Study materials become harder to remember as time passes.", "A mind map helps you recover the relationship between concepts instead of rereading everything."] },
      { heading: "Separate Concepts From Examples", paragraphs: ["If concepts and examples are mixed together, review becomes confusing.", "Place the concept first and connect examples underneath it."] },
      { heading: "Turn Confusion Into Questions", paragraphs: ["In studying, unclear parts are just as important as the parts you understand.", "Question nodes make your next review session more focused."] },
      { heading: "Create a Review Order", paragraphs: ["A mind map can also help determine review order.", "You can move from basic concepts to applied examples in a clear path."] },
      { heading: "Build Study Structure Maps in Brify", paragraphs: ["Brify turns lecture notes, documents, and summaries into concept-focused structure maps.", "During review, you can recover the flow without rereading all the material."] },
    ],
    closing:
      "An AI mind map for studying should help memory, review, and explanation. Use Brify to connect concepts, examples, and questions in a study structure map.",
  },
  {
    koSlug: "use-ai-structure-map-for-work",
    slug: "use-ai-structure-map-for-work",
    title: "How to Use AI Structure Maps at Work",
    excerpt:
      "Use AI structure maps at work to organize meeting materials, reports, proposals, and research into conclusions, evidence, issues, and next actions.",
    seo_keywords: ["AI work structuring", "work mind map", "meeting document structure", "report structure map", ...commonKeywords],
    intro:
      "At work, organizing information does not stop at understanding it. Meeting materials, reports, proposals, and research eventually need to lead to a decision or a next action.",
    sections: [
      { heading: "When Work Needs Structuring", paragraphs: ["Structuring is useful when meeting materials are too long or when a report’s conclusion and evidence are scattered.", "It is also useful when a proposal or research note has important issues that are hard to see."] },
      { heading: "Separate Conclusions From Evidence", paragraphs: ["Work documents become clearer when conclusions and evidence are separated.", "Conclusions without evidence are weak, while evidence without direction is hard to act on."] },
      { heading: "Mark Issues and Risks", paragraphs: ["A good work structure map shows not only positive conclusions, but also issues and risks.", "That helps teams know what needs to be discussed before a decision."] },
      { heading: "Connect the Map to Next Actions", paragraphs: ["A work structure map should end with next actions.", "Marking who needs to check, decide, or prepare something makes the information more actionable."] },
      { heading: "Create Work Structure Maps in Brify", paragraphs: ["Brify helps organize meeting documents, reports, and proposals into conclusions, evidence, issues, and next actions.", "It turns information into a structure that can support decisions."] },
    ],
    closing:
      "An AI structure map for work should make conclusions and next actions clear. Use Brify to turn complex work materials into structures that support decisions.",
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
