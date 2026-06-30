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
  "YouTube summary",
  "lecture video notes",
  "YouTube video summary",
  "AI video summary",
  "AI structure map",
  "Brify",
];

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## A Practical Workflow",
    `To apply ${post.title.toLowerCase()} in real work or study, first stop treating the video as something you must watch from beginning to end. A video moves in time, but useful knowledge needs to be saved by topic, question, concept, example, and conclusion.`,
    "First, decide why you are summarizing the video. Are you studying, preparing a report, collecting ideas, comparing products, or trying to understand the main point quickly? The purpose changes what you should keep.",
    "Second, scan the title, description, chapters, and transcript. Look for the question the video is trying to answer. Third, separate the main claim or concept, supporting reasons, examples, sections to rewatch, and points that still need checking.",
    "Fourth, do not turn the whole video into a long transcript note. Rebuild it into a structure you can search, review, and reuse later. This is especially important for long videos and lecture videos, where concepts, examples, questions, and checklists need to stay connected.",
    "## How to Structure It in Brify",
    `In Brify, you can organize ${post.seo_keywords[0]} with nodes such as video purpose, key question, main concepts, important examples, sections to rewatch, points to verify, and next actions.`,
    "This keeps the video from disappearing into a short paragraph. You can see what the key idea is, which example explains it, which section deserves another look, and how the video can be used later.",
    "A structure map is also useful when you use AI summaries. Even if the AI output sounds fluent, transcripts may contain errors, context may be missing, conclusions may be overstated, and important examples may be skipped. Brify lets you separate the summary from the parts that still need review.",
    "## Common Mistakes",
    "The first mistake is reducing the entire video to one paragraph. That may help you scan quickly, but it is weak when you later need evidence, examples, timestamps, or study notes.",
    "The second mistake is trusting the transcript too much. Auto-generated captions can miss names, technical terms, speaker changes, and context. A transcript summary should be checked against the important parts of the video.",
    "The third mistake is summarizing lecture videos and general YouTube videos in the same way. Lecture videos need concepts, definitions, examples, practice questions, and review prompts. General YouTube videos may need claims, cases, conclusions, and useful sections.",
    "## What to Do Today",
    `If you want to start working on ${post.seo_keywords[0]} today, choose one video and write only three things first: what question does this video answer, which section should I rewatch, and what part can I actually use for my work or study?`,
    "Then place the key question at the center of a Brify map and connect concepts, examples, reasons, and rewatch sections around it. You do not need to organize the whole video perfectly. What matters is leaving a structure that helps you regain the context later.",
    "Video organization is not about saving more videos. It is about making the videos you already watched findable and useful again.",
    "## Final Thoughts",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    koSlug: "how-to-summarize-youtube-videos",
    slug: "how-to-summarize-youtube-videos",
    title: "How to Summarize YouTube Videos Quickly",
    excerpt:
      "Learn how to summarize YouTube videos by using the title, transcript, main claims, examples, and conclusions in the right order.",
    seo_keywords: ["YouTube summary", "YouTube video summary", "summarize YouTube videos", "AI YouTube summary", ...commonKeywords],
    intro:
      "You may not have time to watch every YouTube video from beginning to end, but you still need to understand what the video is saying. A useful YouTube summary is not just shorter. It captures the main claim, supporting reasons, examples, and conclusion.",
    sections: [
      { heading: "When You Need a YouTube Summary", paragraphs: ["Saved videos pile up quickly, but only a few get watched completely.", "For study, work research, idea collection, or product comparison, understanding the core message is often more important than full viewing."] },
      { heading: "Why the Title and Description Are Not Enough", paragraphs: ["Titles and thumbnails are often written to attract attention.", "The actual conclusion, evidence, and useful examples may appear in the middle or final part of the video."] },
      { heading: "Use the Transcript to Find the Flow", paragraphs: ["A transcript is a strong starting point for a YouTube summary.", "Instead of treating every sentence equally, look for repeated keywords, transitions, and places where the speaker moves from background to argument."] },
      { heading: "Separate Claims, Reasons, and Examples", paragraphs: ["The most important step is not copying everything the speaker says.", "Keep the main claim, the reasons behind it, and the examples that explain it in separate parts."] },
      { heading: "Create a Video Summary Map in Brify", paragraphs: ["Brify helps you organize the key question, claim, reasons, examples, and sections to rewatch as a map.", "That structure is easier to revisit than a single paragraph summary."] },
    ],
    closing:
      "A YouTube summary saves time, but it should not erase the structure of the video. Use Brify to keep the claim and evidence visible.",
  },
  {
    koSlug: "summarize-long-youtube-videos",
    slug: "summarize-long-youtube-videos",
    title: "How to Summarize Long YouTube Videos",
    excerpt:
      "Summarize long YouTube videos by separating the overall flow, chapters, repeated claims, key examples, and final conclusion.",
    seo_keywords: ["long YouTube summary", "summarize long videos", "YouTube video summary", "long video summary", ...commonKeywords],
    intro:
      "A 30-minute, one-hour, or two-hour YouTube video is hard to handle as one block. Before summarizing it, you need to divide the video into sections and separate useful information from repeated explanation.",
    sections: [
      { heading: "Why Long Videos Are Hard to Summarize", paragraphs: ["Long videos are difficult because key points, background stories, examples, and repeated explanations are mixed together.", "Without structure, it becomes unclear what should be kept."] },
      { heading: "Divide the Video Before Summarizing", paragraphs: ["A long video should not be reduced into one summary immediately.", "Split it into introduction, problem, explanation, examples, and conclusion so each section has a clear role."] },
      { heading: "Separate Repeated Claims From New Information", paragraphs: ["Speakers often repeat the same point in different words.", "Repetition can signal importance, but it should be separated from genuinely new information."] },
      { heading: "Keep Important Examples Apart From Background Stories", paragraphs: ["Examples help explain the main idea, but not every story has the same value.", "Keep examples that clarify the core concept and mark the rest as background."] },
      { heading: "Map the Flow in Brify", paragraphs: ["Brify lets you divide long videos into sections and mark what to rewatch.", "For long videos, section-level structure is usually more useful than a short paragraph."] },
    ],
    closing:
      "Long YouTube videos should be divided before they are shortened. Use Brify to keep the key sections and rewatch points visible.",
  },
  {
    koSlug: "organize-lecture-videos-into-notes",
    slug: "organize-lecture-videos-into-notes",
    title: "How to Turn Lecture Videos Into Study Notes",
    excerpt:
      "Turn lecture videos into study notes by organizing key concepts, definitions, examples, formulas, questions, and review points.",
    seo_keywords: ["lecture video notes", "organize lecture videos", "online lecture notes", "lecture video summary", ...commonKeywords],
    intro:
      "Lecture videos are different from general YouTube videos. Their purpose is not only quick understanding. You need to remember, review, explain, and apply the ideas later.",
    sections: [
      { heading: "How Lecture Videos Are Different", paragraphs: ["For a general video, the main claim and conclusion may be enough.", "For a lecture video, you also need the order of concepts, definitions, examples, and applications."] },
      { heading: "Separate Concepts From Examples", paragraphs: ["Lectures often mix concept explanations with examples.", "In your notes, put the concept first and connect the examples underneath it."] },
      { heading: "Mark Definitions, Formulas, and Procedures", paragraphs: ["Definitions, formulas, and procedures are the parts you need to find quickly later.", "Do not let them disappear inside long paragraphs."] },
      { heading: "Turn Confusion Into Questions", paragraphs: ["Good lecture notes include what you do not yet understand.", "Mark unclear sections as questions so your next review session has a clear target."] },
      { heading: "Build Lecture Notes in Brify", paragraphs: ["Brify can connect learning goals, concepts, examples, questions, and review points in one structure map.", "You can recover the lecture flow without rewatching the whole video."] },
    ],
    closing:
      "Lecture video notes should support review, not just capture words. Use Brify to connect concepts, examples, and questions.",
  },
  {
    koSlug: "summarize-youtube-lectures-for-review",
    slug: "summarize-youtube-lectures-for-review",
    title: "How to Summarize YouTube Lectures for Review",
    excerpt:
      "Summarize YouTube lectures for review by structuring learning goals, concept flow, examples, practice points, and confusing sections.",
    seo_keywords: ["YouTube lecture summary", "lecture video review", "YouTube lecture notes", "lecture summary notes", ...commonKeywords],
    intro:
      "There are many useful lectures on YouTube, but saving them is not the same as studying them. A review-friendly summary should preserve the order of concepts and the relationships between them.",
    sections: [
      { heading: "What Makes a Review Summary Different", paragraphs: ["A quick summary helps you understand the main idea.", "A review summary should help you recall concepts and apply them later."] },
      { heading: "Find the Learning Goal and Core Concepts", paragraphs: ["First, write what you should understand by the end of the lecture.", "Then place the core concepts in the order needed to reach that goal."] },
      { heading: "Connect Examples to Explanations", paragraphs: ["Examples are useful only when they stay connected to the concept they explain.", "If you keep examples alone, the underlying principle can become unclear."] },
      { heading: "Mark Confusing Sections", paragraphs: ["The most important review points are often the parts you do not fully understand.", "Keep confusing sections, timestamps, and questions separate."] },
      { heading: "Build a Review Map in Brify", paragraphs: ["Brify lets you connect learning goals, concept flow, examples, and questions in one map.", "During review, you can start with weak points instead of rewatching everything."] },
    ],
    closing:
      "A YouTube lecture summary should become useful again during review. Use Brify to keep the lecture understandable and reusable.",
  },
  {
    koSlug: "why-structure-video-content",
    slug: "why-structure-video-content",
    title: "Why You Should Structure Video Content Like a Document",
    excerpt:
      "Learn why structuring video content helps with search, review, sharing, reporting, and reuse more than a simple summary.",
    seo_keywords: ["video content organization", "structure video content", "YouTube content notes", "video summary method", ...commonKeywords],
    intro:
      "Video moves in time, but we do not reuse information in time order. Later, what matters is which topic, claim, example, or conclusion you need to find again.",
    sections: [
      { heading: "Why Videos Are Hard to Find Again", paragraphs: ["Documents can be searched and skimmed more easily than videos.", "If you do not remember the exact words, finding the right section in a video can take a long time."] },
      { heading: "The Limits of Timeline Summaries", paragraphs: ["A timeline summary shows what happened first and next.", "But for reuse, you often need topics, claims, examples, and conclusions reorganized by meaning."] },
      { heading: "Rebuild the Video by Topic and Example", paragraphs: ["When you group video points by topic, the content becomes more like a usable document.", "Examples, objections, and conclusions become easier to compare."] },
      { heading: "Make Video Content Searchable", paragraphs: ["Keywords, questions, sections, and purpose make video notes easier to retrieve.", "A structured note lasts longer than a saved video link."] },
      { heading: "Structure Video Content in Brify", paragraphs: ["Brify helps turn video content into a map instead of a flat summary.", "Once the relationships are visible, the video becomes easier to review, share, or turn into a report."] },
    ],
    closing:
      "Videos pass by, but useful knowledge needs structure. Use Brify to turn video content into something you can find and use again.",
  },
  {
    koSlug: "check-ai-youtube-summaries",
    slug: "check-ai-youtube-summaries",
    title: "What to Check When Using AI YouTube Summaries",
    excerpt:
      "When using AI YouTube summaries, check transcript errors, missing context, overstated conclusions, and skipped examples.",
    seo_keywords: ["AI YouTube summary", "YouTube summary AI", "YouTube summary tool", "AI video summary", ...commonKeywords],
    intro:
      "AI YouTube summaries are fast, but speed does not guarantee accuracy. Transcript errors, missing context, skipped examples, and overstated conclusions can all affect the result.",
    sections: [
      { heading: "What AI YouTube Summaries Do Well", paragraphs: ["AI is useful for finding repeated themes and the general flow of a long transcript.", "It can help you understand the direction of a video before watching the whole thing."] },
      { heading: "Check Transcript Errors", paragraphs: ["Many AI summaries depend on captions or transcripts.", "If the transcript misreads names, numbers, or technical terms, the summary may repeat the mistake."] },
      { heading: "Watch for Missing Context and Examples", paragraphs: ["Tone, screen visuals, jokes, and examples often carry meaning in videos.", "A text summary may skip those signals."] },
      { heading: "Check Whether the Conclusion Is Overstated", paragraphs: ["AI can make cautious statements sound more certain.", "Compare the summary with the original section before relying on a strong conclusion."] },
      { heading: "Review AI Summaries in Brify", paragraphs: ["Brify lets you separate AI output, important transcript sections, examples, and items to verify.", "That makes the summary easier to trust and improve."] },
    ],
    closing:
      "An AI YouTube summary is a useful starting point, not the final version. Use Brify to review the summary against the video structure.",
  },
  {
    koSlug: "extract-key-concepts-from-lecture-videos",
    slug: "extract-key-concepts-from-lecture-videos",
    title: "How to Extract Key Concepts From Lecture Videos",
    excerpt:
      "Extract key concepts from lecture videos by separating definitions, examples, counterexamples, applications, and review questions.",
    seo_keywords: ["lecture notes organization", "lecture video key points", "concept notes", "study notes", ...commonKeywords],
    intro:
      "After watching a lecture video, it is common to feel that you heard a lot but cannot explain the material clearly. That usually happens because concepts, examples, counterexamples, and applications are mixed together.",
    sections: [
      { heading: "Why Lecture Notes Become Too Long", paragraphs: ["If you write down almost everything, your notes get longer but not necessarily clearer.", "Without separating core concepts from supporting explanation, review becomes difficult."] },
      { heading: "Separate Core Concepts From Support", paragraphs: ["A core concept is a term or idea that helps you understand other parts of the lecture.", "Supporting explanation helps clarify the concept but should not be treated as the concept itself."] },
      { heading: "Connect Examples and Counterexamples", paragraphs: ["Examples are hard to use later if they are isolated.", "Connect each example and counterexample to the concept or condition it demonstrates."] },
      { heading: "Mark Points for Exams or Assignments", paragraphs: ["Lecture video notes should be shaped by how you will use them later.", "Mark concepts that may appear in exams, cases that may help with assignments, and parts you need to explain again."] },
      { heading: "Build Concept Notes in Brify", paragraphs: ["Brify lets you place a concept at the center and connect examples, counterexamples, and questions around it.", "That structure is more useful for review than linear notes."] },
    ],
    closing:
      "Good lecture notes preserve relationships, not just words. Use Brify to connect concepts and examples into notes you can actually understand later.",
  },
  {
    koSlug: "youtube-transcript-summary-mistakes",
    slug: "youtube-transcript-summary-mistakes",
    title: "Common Mistakes When Summarizing YouTube Transcripts",
    excerpt:
      "YouTube transcript summaries can be affected by auto-caption errors, speaker confusion, repeated phrases, and missing context.",
    seo_keywords: ["YouTube transcript summary", "YouTube script summary", "transcript summary mistakes", "video transcript notes", ...commonKeywords],
    intro:
      "A YouTube transcript makes video summarization much faster, but the transcript alone is not the whole video. Auto-captions and spoken language can create problems that weaken the summary.",
    sections: [
      { heading: "Why Transcript Summaries Are Convenient but Risky", paragraphs: ["Transcripts turn video into text, so they are easy to process.", "But facial expression, slides, emphasis, screen content, and context may not appear in the transcript."] },
      { heading: "Check Auto-Caption Errors", paragraphs: ["Auto-captions can misread names, foreign words, numbers, and technical terms.", "If the error affects a key term, the summary can change meaning."] },
      { heading: "Remove Repetition and Filler", paragraphs: ["Video transcripts often contain filler words, repeated phrases, and unfinished sentences.", "A useful summary should keep meaning, not every spoken habit."] },
      { heading: "Preserve Speaker and Context", paragraphs: ["In interviews or debates, who said something matters.", "If speaker context disappears, opinions and counterarguments can get mixed together."] },
      { heading: "Restructure Transcript Notes in Brify", paragraphs: ["Brify helps separate claims, reasons, examples, and sections to verify.", "Instead of trusting the transcript directly, you can rebuild it into a clearer structure."] },
    ],
    closing:
      "A YouTube transcript is useful raw material, not the final summary. Use Brify to restructure transcript summaries and catch weak spots.",
  },
  {
    koSlug: "find-important-parts-in-long-videos",
    slug: "find-important-parts-in-long-videos",
    title: "How to Find the Important Parts in Long Videos",
    excerpt:
      "Find important parts in long videos by using titles, chapters, transcripts, repeated keywords, and question-based scanning.",
    seo_keywords: ["long video summary", "find important parts in YouTube videos", "video key sections", "long lecture summary", ...commonKeywords],
    intro:
      "You do not always need to watch a long video from beginning to end. The goal is not to skip thinking, but to find the section that answers your question.",
    sections: [
      { heading: "When You Do Not Need the Whole Video", paragraphs: ["Product reviews, lectures, interviews, and webinars often concentrate useful information in specific sections.", "If your purpose is clear, finding the right section can be more efficient than full viewing."] },
      { heading: "Start With the Question You Need Answered", paragraphs: ["Before scanning a long video, define what you are looking for.", "Without a question, every section can feel important."] },
      { heading: "Use Chapters and Transcripts as Clues", paragraphs: ["Chapters, descriptions, and repeated transcript keywords are useful signals.", "They help you locate sections where a topic is discussed in depth."] },
      { heading: "Use Repeated Keywords Carefully", paragraphs: ["Repeated keywords often point to the central topic.", "But repetition alone is not enough; check whether the keyword connects to a conclusion or example."] },
      { heading: "Save Rewatch Sections in Brify", paragraphs: ["In Brify, you can save important sections with the reason they matter.", "Pairing timestamps with key questions makes later review faster."] },
    ],
    closing:
      "To find the important parts in a long video, start with a question. Use Brify to keep the useful sections and the reason for saving them.",
  },
  {
    koSlug: "youtube-summary-tool-checklist",
    slug: "youtube-summary-tool-checklist",
    title: "How to Choose a YouTube Summary Tool",
    excerpt:
      "When choosing a YouTube summary tool, check transcript handling, long video support, source review, structure, editing, and sharing.",
    seo_keywords: ["YouTube summary tool", "video summary tool", "AI video summary tool", "lecture summary tool", ...commonKeywords],
    intro:
      "There are many YouTube summary tools, but a good tool is not just one that produces a short and fluent paragraph. It should help you check, edit, structure, and reuse the result.",
    sections: [
      { heading: "Do Not Judge Only the Summary Text", paragraphs: ["A fluent summary can still miss the main point of the video.", "When choosing a tool, look for reviewable structure, not only good wording."] },
      { heading: "Check Transcript and Long Video Support", paragraphs: ["YouTube summary tools depend heavily on transcript quality.", "For long videos, sectioning and repeated information handling also matter."] },
      { heading: "Can You Return to the Original Flow?", paragraphs: ["If the summary stands alone, important sections may be hard to verify.", "A good workflow should let you return to chapters, transcript sections, or timestamps."] },
      { heading: "Editing and Sharing Matter", paragraphs: ["A summary is usually a draft.", "If you use it for study notes, work research, or meetings, you need to edit and share it easily."] },
      { heading: "Why Brify Fits Video Summaries", paragraphs: ["Brify is designed for structure maps rather than flat summaries.", "It helps keep summaries, verification points, and key questions together."] },
    ],
    closing:
      "A YouTube summary tool should help you reuse the video, not only shorten it. Use Brify to structure, review, and apply video summaries.",
  },
  {
    koSlug: "turn-lecture-videos-into-review-materials",
    slug: "turn-lecture-videos-into-review-materials",
    title: "How to Turn Lecture Videos Into Review Materials",
    excerpt:
      "Turn lecture videos into review materials by organizing key concepts, likely test points, questions, examples, and checklists.",
    seo_keywords: ["lecture video review", "lecture review materials", "online lecture review", "study from lecture videos", ...commonKeywords],
    intro:
      "Watching a lecture video once is not the same as turning it into review material. Review material should help you explain, remember, and apply the content later.",
    sections: [
      { heading: "Review Material Is Different From a Summary", paragraphs: ["A summary helps you understand quickly.", "Review material helps you recall and use the content during exams, assignments, or practice."] },
      { heading: "Mark Concepts That May Be Tested", paragraphs: ["Repeated or emphasized concepts are often important.", "Definitions, comparisons, procedures, and conditions should be marked clearly."] },
      { heading: "Keep Questions for What You Cannot Explain", paragraphs: ["Do not hide weak points during review.", "If you cannot explain a concept, turn it into a question for the next study session."] },
      { heading: "Turn Examples Into Checklists", paragraphs: ["Examples in lecture videos can often become step-by-step practice guides.", "Turning examples into checklists helps with application."] },
      { heading: "Build a Review Routine in Brify", paragraphs: ["Brify can connect concepts, questions, examples, and checklists in one review map.", "Next time, you can review the weak parts first."] },
    ],
    closing:
      "Lecture videos last longer when you turn them into review structures. Use Brify to connect concepts, questions, and checklists.",
  },
  {
    koSlug: "make-youtube-videos-searchable",
    slug: "make-youtube-videos-searchable",
    title: "How to Make YouTube Videos Easy to Find Later",
    excerpt:
      "Make YouTube videos easier to find later by saving key questions, keywords, sections, summaries, tags, and use cases.",
    seo_keywords: ["YouTube content organization", "organize saved YouTube videos", "video knowledge management", "find YouTube videos later", ...commonKeywords],
    intro:
      "Saving a useful YouTube video does not mean the knowledge is saved. As your saved list grows, you need a structure that helps you find the right video and the right section again.",
    sections: [
      { heading: "Why Saved YouTube Videos Get Lost", paragraphs: ["YouTube playlists mainly show titles and thumbnails.", "They do not always preserve why you saved the video, what mattered, or which section you needed."] },
      { heading: "Save the Key Question for Each Video", paragraphs: ["When you save a video, write the question it helps answer.", "For example: what problem does this video solve for me?"] },
      { heading: "Keep Keywords and Sections Together", paragraphs: ["Keywords without context are weak, and timestamps without keywords are hard to search.", "Save keywords, timestamps, and short explanations together."] },
      { heading: "Organize Videos by Use Case", paragraphs: ["Study, work research, inspiration, and later viewing need different structures.", "Sorting by purpose makes a video library easier to use."] },
      { heading: "Create a Searchable Video Map in Brify", paragraphs: ["Brify helps organize videos by keywords, questions, and use cases.", "When several videos connect to one topic, they can become a reusable knowledge map."] },
    ],
    closing:
      "The goal is not to save more YouTube videos. It is to make the useful ones findable again. Use Brify to build a searchable video knowledge map.",
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
