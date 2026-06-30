import fs from "node:fs";
import path from "node:path";
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
  "how to use Brify",
  "how to make a structure map",
  "Brify tutorial",
  "create a document structure map",
  "AI structure map workflow",
  "document structuring",
  "AI structure map",
  "Brify",
];

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## What to Remember When Making a Structure Map in Brify",
    `The most important point in ${post.title} is that the AI output should not be treated as the final answer. Brify gives you a fast starting structure for long materials, but you still need to check whether that structure fits your purpose.`,
    "After adding your material, review the main titles, child nodes, evidence, examples, and parts that need verification. If a title is too broad, narrow it. If two nodes say nearly the same thing, merge them. If a conclusion has weak evidence, mark it for review.",
    "Once you do that, the structure map becomes more than a summary. It becomes a working document you can reread, explain, turn into a report, or bring into a meeting.",
    "## A Checklist for First-Time Users",
    `If you are working on ${post.seo_keywords[0]} today, check four things first: why am I organizing this material, what is the most important question, are the AI draft's conclusions separated from evidence, and where will I reuse this structure later?`,
    "When these four things are clear, the quality of the structure map becomes much more stable. The goal is not a perfect first result. The goal is to leave a structure you can review and improve.",
    "## Common Mistakes",
    "The first mistake is trusting the result immediately after adding the material. AI can create a fast draft, but it may miss context or fail to mark the limits of the source clearly enough.",
    "The second mistake is assuming that more nodes mean a better structure. A good structure map is not the one with the most branches. It is the one where the question, evidence, and next step are easy to see.",
    "The third mistake is saving the structure map and never using it again. A structure map becomes more valuable when you turn it into review questions, a report outline, a meeting agenda, or a presentation flow.",
    "## Final Thoughts",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    koSlug: "how-to-use-brify",
    slug: "how-to-use-brify",
    title: "How to Use Brify: A Quick Guide for First-Time Users",
    excerpt:
      "Learn the basic Brify workflow: add your material, review the AI draft, edit the structure map, and reuse it for study, reports, and meetings.",
    seo_keywords: ["how to use Brify", "Brify tutorial", "Brify structure map", "Brify guide", ...commonKeywords],
    intro:
      "When you open Brify for the first time, it can be hard to know what to add first. You may have papers, PDFs, YouTube transcripts, meeting materials, or reports, but trying to use every feature at once can make the workflow feel heavier than it needs to be. The key to using Brify is not simply shortening long material. It is turning it into a structure map that you can return to later.",
    sections: [
      {
        heading: "When Brify Is Most Useful",
        paragraphs: [
          "Brify is useful when you need to read a long material and rebuild its main flow. It works well for a paper you want to use in a literature review, a PDF report where you need key evidence, a lecture video you want to review, or meeting materials that need to become clear agenda items.",
          "If all you need is a one-paragraph summary, a simple summarizer may be enough. But if you need to check evidence later, turn the content into an outline, compare it with other sources, or reuse it in a meeting, a structure map is more helpful.",
        ],
      },
      {
        heading: "What Should You Add First",
        paragraphs: [
          "For your first use, choose one material with a clear boundary. A single paper, one PDF, one meeting document, or one lecture transcript is easier to review than a large folder of mixed materials.",
          "Before adding the material, write your purpose in one sentence. For example: 'I want to see whether this paper is useful for my literature review' or 'I want to find the decisions hidden in this meeting document.' A clear purpose gives you a standard for judging the structure map.",
        ],
      },
      {
        heading: "How Not to Overtrust the AI Draft",
        paragraphs: [
          "The AI draft in Brify is a starting point. It can quickly show the main topics and subtopics, but that does not mean every conclusion is fully verified.",
          "When you review the draft, do not look only at the conclusion. Check whether the evidence is visible, whether important claims need source review, and whether any part should be marked as uncertain.",
        ],
      },
      {
        heading: "What to Check in the Structure Map",
        paragraphs: [
          "A useful structure map separates the core question, main topics, supporting evidence, examples, and limitations. If everything appears at the same depth, the map may become hard to reuse.",
          "Node names matter too. Instead of keeping long AI-generated sentences, rename nodes by their role, such as 'main claim,' 'evidence,' 'counterpoint,' or 'needs review.' That makes the map easier to use later.",
        ],
      },
      {
        heading: "Reuse Brify Results for Study, Reports, and Meetings",
        paragraphs: [
          "A structure map should not stop at storage. For study, it can become review questions. For reports, it can become an outline and evidence list. For meetings, it can become agenda items and open issues.",
          "Start small. Turn one material into a structure map, then reuse that structure in your next task. That is where Brify becomes more than a summary tool.",
        ],
      },
    ],
    closing:
      "You do not need to start Brify in a complicated way. Add one paper or PDF you already need to read, review the AI draft, and edit the structure so it fits your own purpose.",
  },
  {
    koSlug: "how-to-make-a-structure-map",
    slug: "how-to-make-a-structure-map",
    title: "How to Make a Structure Map for Long Materials",
    excerpt:
      "Learn how to make a structure map by separating the core question, claims, evidence, examples, limitations, and next actions.",
    seo_keywords: ["how to make a structure map", "document structuring method", "structure map guide", "text structure map", ...commonKeywords],
    intro:
      "When people hear structure map, they often imagine a mind map with many branches. But the purpose of a structure map is not to create a pretty diagram. It is to make the question, claims, and evidence inside a long material visible again. Once you know how to make a structure map, papers, reports, meeting notes, and lecture notes become much easier to organize.",
    sections: [
      {
        heading: "How a Structure Map Differs From a Mind Map",
        paragraphs: [
          "A mind map is useful for expanding ideas from a central keyword. It works well for brainstorming and exploring related concepts.",
          "A structure map focuses on reorganizing existing material into meaningful relationships. The central question, claims, evidence, examples, and limitations matter more than the central keyword.",
        ],
      },
      {
        heading: "Find the Core Question First",
        paragraphs: [
          "The first step is to find the question the material is trying to answer. Ask: what is this paper trying to prove, what decision does this report support, or what should this meeting material help decide?",
          "Without a core question, every sentence can look important. With a question, you can separate the main point from background information.",
        ],
      },
      {
        heading: "Separate Claims, Evidence, and Examples",
        paragraphs: [
          "When structuring a long material, separate claims from evidence. If you keep only conclusion sentences, it becomes hard to know later why those conclusions were reached.",
          "Data, examples, quotations, and explanations all play different roles. A structure map should keep those roles visible so the material can be reused safely in a report or presentation.",
        ],
      },
      {
        heading: "Keep Limitations and Items to Verify Separate",
        paragraphs: [
          "A good structure map does not contain only confident statements. It should also mark unclear points, limitations, and parts that need source review.",
          "This helps you avoid overtrusting an AI draft or your own first summary. A structure map should support both understanding and verification.",
        ],
      },
      {
        heading: "Create a Structure Map Draft in Brify",
        paragraphs: [
          "You can make a structure map manually, but long materials make the first classification slow. In Brify, you can add the material and quickly see a draft map of the core question, main topics, evidence, and points to review.",
          "Then you can rename nodes, add missing evidence, merge similar branches, and remove items that do not fit your purpose.",
        ],
      },
    ],
    closing:
      "The key to making a structure map is not creating many branches. It is preserving the relationships between question, claim, evidence, and limitation. Use Brify to turn long material into a structure you can actually review.",
  },
  {
    koSlug: "make-first-structure-map-in-brify",
    slug: "make-first-structure-map-in-brify",
    title: "How to Make Your First Structure Map in Brify",
    excerpt:
      "A practical tutorial for choosing your first material, adding it to Brify, reviewing the AI draft, editing nodes, and reusing the result.",
    seo_keywords: ["make a Brify structure map", "Brify first use", "add materials to Brify", "AI structure map tutorial", ...commonKeywords],
    intro:
      "The two most common questions before making your first structure map in Brify are: what should I add, and how do I know whether the result is right? Your first structure map does not need to be perfect. It is a way to see the main flow of a material and practice editing that flow into a structure you can use.",
    sections: [
      {
        heading: "Choose a Material That Is Not Too Difficult",
        paragraphs: [
          "For your first use, avoid adding a whole book or several PDFs at once. Choose one material with a clear beginning and end, such as one paper, one lecture transcript, or one meeting document.",
          "A smaller material makes it easier to review the AI draft and understand how Brify creates a structure.",
        ],
      },
      {
        heading: "Write Your Purpose Before Adding the Material",
        paragraphs: [
          "Before adding the material, write one sentence about why you are organizing it. For example: 'I want to find evidence for my report from this PDF' or 'I want to turn this lecture into review questions.'",
          "A clear purpose helps you decide which nodes matter and which ones are less relevant. The same material may need a different structure for study, a report, or a meeting.",
        ],
      },
      {
        heading: "What to Review First in the AI Draft",
        paragraphs: [
          "When Brify creates the first structure map, start with the main titles and sections. Check whether the overall flow of the material has been captured correctly.",
          "Then check whether conclusions and evidence are separated, whether important examples are missing, and whether any part needs source review. Do not try to edit every sentence immediately. Review the big structure first.",
        ],
      },
      {
        heading: "Rename Nodes for Your Own Workflow",
        paragraphs: [
          "AI-generated node names may be too close to the original wording or too long. Rename them so they match your work purpose.",
          "For example, instead of 'discussion of research results,' you might use 'key findings,' 'limitations,' or 'evidence for my report.' Role-based names make the map easier to reuse.",
        ],
      },
      {
        heading: "Make a Structure for Reuse, Not Perfection",
        paragraphs: [
          "The goal of your first structure map is not perfection. It is reusability. If you can quickly find the core question, conclusion, evidence, and points to verify later, it is already a useful start.",
          "After making the map, try turning it into review questions, a report outline, or meeting agenda items. That is when the value of the structure becomes clearer.",
        ],
      },
    ],
    closing:
      "To make your first structure map in Brify, you only need one material and one purpose sentence. Start small, review the AI draft, and adjust the structure so it fits your own workflow.",
  },
  {
    koSlug: "clean-up-complex-structure-map",
    slug: "clean-up-complex-structure-map",
    title: "How to Clean Up a Structure Map That Feels Too Complex",
    excerpt:
      "Learn how to clean up a structure map by merging duplicate nodes, shortening long titles, marking unsupported claims, and removing irrelevant branches.",
    seo_keywords: ["clean up a structure map", "edit a structure map", "AI structure map editing", "document structure cleanup", ...commonKeywords],
    intro:
      "Sometimes an AI-generated structure map or a manually built map feels too complex. It has many nodes, but the important point is hard to see. Titles are long, similar branches repeat, and the map starts to feel like another long document. Cleaning up a structure map is not about making it prettier. It is about making it reusable.",
    sections: [
      {
        heading: "Why Structure Maps Become Too Complex",
        paragraphs: [
          "A structure map often becomes complex when every part of the source material is copied at the same level. Conclusions, background details, examples, and conditions all appear with equal weight, so the flow becomes unclear.",
          "This can also happen with AI drafts. AI can extract many items quickly, but prioritizing them for your purpose still requires human review.",
        ],
      },
      {
        heading: "Merge Duplicate Nodes and Similar Expressions",
        paragraphs: [
          "Start by finding nodes that say nearly the same thing. Merge them into one node and keep only the useful details underneath.",
          "Reducing duplication makes the whole map smaller and helps the main flow stand out. Merging is often safer than deleting too early.",
        ],
      },
      {
        heading: "Turn Long Sentence Titles Into Short Role Names",
        paragraphs: [
          "If node titles are too long, the map becomes hard to scan. Instead of using a full sentence as a title, name the role of that node.",
          "For example, 'users leave during the first experience because they do not understand the feature' can become 'first-use drop-off cause.' The details can remain inside the node.",
        ],
      },
      {
        heading: "Mark Unsupported Claims and Items to Verify",
        paragraphs: [
          "If a node contains a conclusion but the evidence is not visible, do not delete it immediately. Mark it as needs review so you can return to the source later.",
          "This is especially important with AI drafts. A summary can sound plausible even when the source evidence is weak. A structure map should make those areas easier to notice.",
        ],
      },
      {
        heading: "A Cleanup Routine in Brify",
        paragraphs: [
          "In Brify, a useful cleanup order is: check duplicate nodes, shorten long titles, mark unsupported claims, and remove branches that do not match your purpose.",
          "After this routine, the map may become shorter, but it should not become weaker. It should become closer to a structure you can use again.",
        ],
      },
    ],
    closing:
      "If your structure map feels complex, it does not mean the result failed. In Brify, clean up duplicates, long titles, unsupported claims, and items to verify so the map becomes easier to use.",
  },
  {
    koSlug: "reuse-brify-structure-map",
    slug: "reuse-brify-structure-map",
    title: "How to Reuse a Brify Structure Map for Study, Reports, and Meetings",
    excerpt:
      "Learn how to reuse a Brify structure map as review questions, a report outline, a presentation flow, a meeting agenda, or action items.",
    seo_keywords: ["reuse Brify structure map", "structure map workflow", "reuse organized materials", "AI structure map use cases", ...commonKeywords],
    intro:
      "A structure map becomes more valuable when you reuse it. If you only save the map after creating it in Brify, you miss much of its value. For study, it can become review questions. For writing, it can become a report outline and evidence list. For meetings, it can become agenda items and action items.",
    sections: [
      {
        heading: "Why Saving a Structure Map Is Not Enough",
        paragraphs: [
          "Many organization tools feel satisfying at the moment of creation, but the result often sits unopened later. Structure maps can become the same kind of unused artifact if you do not connect them to your next task.",
          "If the structure you created does not become the starting point for study, writing, or discussion, the time spent organizing may not turn into real progress.",
        ],
      },
      {
        heading: "Turn Study Materials Into Review Questions",
        paragraphs: [
          "If you used Brify to map a paper or lecture, turn each major node into a review question. A concept node can become 'what does this concept mean,' and an evidence node can become 'what supports this conclusion?'",
          "This turns the structure map from a passive summary into an active study tool for exams, presentations, or research meetings.",
        ],
      },
      {
        heading: "Turn It Into a Report or Presentation Outline",
        paragraphs: [
          "For reports or presentations, the main flow of the structure map can become an outline. Core question, background, conclusion, evidence, limitations, and proposal can become the first draft of your structure.",
          "Do not copy the map as-is. Rearrange it in the order your reader or audience will understand best.",
        ],
      },
      {
        heading: "Turn It Into Meeting Agenda Items and Action Items",
        paragraphs: [
          "For business materials, a structure map can become a meeting agenda. Separate what needs to be decided, what needs discussion, what needs more data, and who owns the next action.",
          "After the meeting, update the map with decisions and action items. Then the same material can continue into the next meeting instead of disappearing into a note archive.",
        ],
      },
      {
        heading: "Keep Updating Your Brify Structure Map",
        paragraphs: [
          "It is better to treat a structure map as a living working document, not a finished file. When you read new material or make a decision in a meeting, add it to the existing structure.",
          "With this habit, Brify becomes more than a summary tool. It becomes a workspace for accumulating and reusing structured knowledge.",
        ],
      },
    ],
    closing:
      "The key to using a Brify structure map is reuse. Turn the map into review questions, a report outline, a meeting agenda, or action items so it becomes the starting point for your next task.",
  },
];

async function getKoreanGroupId(koSlug) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("translation_group_id")
    .eq("locale", "ko")
    .eq("slug", koSlug)
    .maybeSingle();
  if (error) throw error;
  if (!data?.translation_group_id) {
    throw new Error(`Missing Korean source post or translation_group_id for ${koSlug}`);
  }
  return data.translation_group_id;
}

async function getExistingPost(post) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id")
    .eq("locale", "en")
    .eq("slug", post.slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

const results = [];

for (const post of posts) {
  const [translationGroupId, existing] = await Promise.all([getKoreanGroupId(post.koSlug), getExistingPost(post)]);
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
