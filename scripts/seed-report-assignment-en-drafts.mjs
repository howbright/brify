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
  "organize report materials",
  "summarize assignment materials",
  "assignment material organization",
  "report material summary",
  "structure study materials",
  "AI structure map",
  "Brify",
];

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## Turning Materials Into a Submission-Ready Structure in Brify",
    `The most important point in ${post.title} is that collecting materials and using them well are not the same thing. A report or assignment is not a list of sources. It needs to show how you understand the question, which claims you are making, and what evidence supports those claims.`,
    "In Brify, you can organize materials into a structure map with nodes such as assignment question, main claim, supporting source, citation point, your interpretation, outline candidate, and sentence ideas for the final report or presentation. This keeps an AI summary from becoming the final answer too quickly.",
    "When you work with multiple sources, citations can get mixed together, similar ideas repeat, and the evidence you actually need may be missing. A structure map makes it easier to see which source supports which claim, where the gaps are, and what should be removed before you write.",
    "## When a Structure Map Helps Most",
    "A structure map becomes especially useful when you have enough material but cannot build a report outline, when an AI summary is available but you cannot tell what came from the original source and what is your own interpretation, or when team project materials are scattered across messages, documents, and links.",
    "It also helps when you are close to submission and suddenly need to find citations again. At that point, more summarization is usually not the answer. What you need is a clear connection between the assignment question, claims, evidence, and sources.",
    "## Pre-Submission Checklist",
    `If you are working on ${post.seo_keywords[0]} today, check four things: does this material directly answer the assignment question, does each claim have evidence and a source, are the original summary and your interpretation separated, and can the structure be turned into a report outline or presentation flow?`,
    "If those four things are not visible, the material is not fully ready for submission yet. Turning it into a Brify structure map connects understanding, citation checking, outline building, and presentation preparation in one workflow.",
    "## Final Thoughts",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    koSlug: "organize-report-materials",
    slug: "organize-report-materials",
    title: "How to Organize Report Materials When You Do Not Know Where to Start",
    excerpt:
      "Organizing report materials is not about collecting more sources. It is about sorting them into topic, claim, evidence, citation, and outline.",
    seo_keywords: ["organize report materials", "report material organization", "how to organize a report", "organize research materials", ...commonKeywords],
    intro:
      "Report material organization often becomes difficult not because you lack sources, but because you have too many of them. You may have saved web pages, PDFs, articles, lecture slides, and parts of academic papers, but when it is time to write the first sentence, the whole pile feels unclear. At that moment, the next step is not more searching. It is reorganizing what you already have around the question your report needs to answer.",
    sections: [
      {
        heading: "Why Report Materials Become Hard to Organize",
        paragraphs: [
          "When you collect materials, you usually move by search keywords. When you write a report, however, you need to move by questions and claims. A long list of saved sources does not automatically create a report structure.",
          "Many people feel organized because they have file names, links, or source titles. But what a report really needs is a clear sense of what each source can support, what evidence it provides, and how reliable that evidence is.",
        ],
      },
      {
        heading: "Start by Writing the Report Question in One Sentence",
        paragraphs: [
          "Before reading everything again, write the question your report should answer in one sentence. For example, a question like 'How do AI summary tools change the way students study?' gives you a filter for deciding what matters.",
          "Without a clear question, every source looks important. With a clear question, it becomes easier to separate background information, core evidence, counterarguments, and conclusion material.",
        ],
      },
      {
        heading: "Sort Sources Into Claims, Evidence, Examples, and Background",
        paragraphs: [
          "When organizing report materials, sorting by role is more useful than summarizing each source in isolation. Some sources are good for background, some support the main claim, and some work better as examples or counterpoints.",
          "Once each source has a role, you can see where it belongs in the report. It stops being a pile of summaries and starts becoming writing material.",
        ],
      },
      {
        heading: "Keep Citation Points Separate",
        paragraphs: [
          "One of the easiest things to lose during material organization is the source. If you only copy a summary, you may later forget which document or page it came from.",
          "Whenever you read a source, keep the title, author or institution, URL or page, and the sentence you may want to cite. This saves a lot of time near submission.",
        ],
      },
      {
        heading: "Build a Report Material Map in Brify",
        paragraphs: [
          "In Brify, you can place the report question at the center and connect claims, evidence, citations, examples, and counterarguments around it. This turns a file list into a logical structure.",
          "Before drafting, the map helps you see which claims lack evidence, which sources overlap, and where citations are missing.",
        ],
      },
    ],
    closing:
      "Organizing report materials is not a competition to collect more sources. If you first build a structure of question, claim, evidence, and citation in Brify, writing becomes much less blocked.",
  },
  {
    koSlug: "summarize-assignment-materials",
    slug: "summarize-assignment-materials",
    title: "How to Turn Assignment Material Summaries Into Your Own Writing",
    excerpt:
      "Summarizing assignment materials should lead to the assignment question, your interpretation, citations, and a structure you can write from.",
    seo_keywords: ["summarize assignment materials", "assignment summary method", "organize assignment materials", "college assignment summary", ...commonKeywords],
    intro:
      "Summarizing assignment materials is not simply shortening a long text. In an assignment, you are usually evaluated on whether you understood the material, connected it to the assignment question, and explained it in your own words. That means an AI summary or source summary should be restructured before it becomes part of the final submission.",
    sections: [
      {
        heading: "Assignment Summaries Are Different From Simple Summaries",
        paragraphs: [
          "A simple summary reduces the main points of a source. An assignment material summary also asks which parts answer the assignment question, which parts support your claim, and where the source needs to be cited.",
          "The same source can be useful in different ways depending on the topic. A good summary is not a balanced miniature of the whole source. It is a focused selection of what your assignment actually needs.",
        ],
      },
      {
        heading: "Select Only What Matches the Assignment Question",
        paragraphs: [
          "Keep the assignment question next to you while summarizing. Background information that does not directly answer the question can be shortened, while claims and evidence that support your argument should be kept in more detail.",
          "Without this step, the summary may look clean but still fail to fit the final assignment.",
        ],
      },
      {
        heading: "Separate Source Summary From Your Interpretation",
        paragraphs: [
          "A common risk in assignments is mixing what the source says with what you think. Separate factual source content, the author’s claim, and your own interpretation.",
          "This is even more important when using AI summaries. AI-generated text is a draft, not a source. You still need to confirm the original material and keep your own interpretation separate.",
        ],
      },
      {
        heading: "Check Before Turning It Into Submission Text",
        paragraphs: [
          "Before turning a summary into final writing, check the source, terminology, evidence, and connection to the assignment question. Also check whether you can explain the idea in your own words.",
          "A final sentence should be natural, but natural writing is not enough. It must be clear what source supports it.",
        ],
      },
      {
        heading: "Use Brify to Rebuild the Material Into Your Structure",
        paragraphs: [
          "In Brify, you can keep source summary, your interpretation, and final writing ideas as separate nodes. This prevents the reading stage and the writing stage from blending together.",
          "When the assignment question sits at the center, it becomes easier to decide what belongs in the introduction, body, and conclusion.",
        ],
      },
    ],
    closing:
      "Summarizing assignment materials is the beginning, not the end. Separating source content, interpretation, and writing structure in Brify makes the final assignment safer and stronger.",
  },
  {
    koSlug: "make-report-outline-from-materials",
    slug: "make-report-outline-from-materials",
    title: "How to Build a Report Outline From Your Materials",
    excerpt:
      "A report outline should not follow the order of your sources. Reorder materials into problem, background, evidence, analysis, and conclusion.",
    seo_keywords: ["build report outline", "report outline from sources", "report structure method", "make report outline", ...commonKeywords],
    intro:
      "Sometimes you have read enough material but still cannot create a report outline. This usually does not mean you failed to understand the sources. More often, it happens because the order in which you found or read the materials is being confused with the order your report should follow.",
    sections: [
      {
        heading: "Why an Outline Does Not Appear Automatically",
        paragraphs: [
          "The order of reading depends on search results, difficulty, and personal interest. A report outline, however, should follow the logic that helps a reader understand your answer.",
          "If each source summary becomes one section, the report often feels scattered. Readers care less about which source you read first and more about how the argument develops.",
        ],
      },
      {
        heading: "Source Order and Report Order Are Different",
        paragraphs: [
          "The first source you read does not have to become the introduction. A statistic or example you found later may be the best way to open the problem.",
          "When building an outline, ignore the saved order of your files and reorganize everything around the question you are answering.",
        ],
      },
      {
        heading: "Use Problem, Background, Evidence, and Analysis",
        paragraphs: [
          "A useful starting structure is problem, background, main claim, evidence, analysis, limitation, and conclusion. Your final report may change this order, but it gives you a stable first map.",
          "Once you connect sources to each section, the gaps become visible. You may have too much background but too little evidence, or many examples but weak analysis.",
        ],
      },
      {
        heading: "Find Missing and Excessive Material",
        paragraphs: [
          "An outline shows where your material is missing and where it is excessive. Some sections may have too many sources, while others have no evidence at all.",
          "At this stage, decide whether you need to search more, remove unnecessary material, or move a source to a better section.",
        ],
      },
      {
        heading: "Create Outline Candidates in Brify",
        paragraphs: [
          "In Brify, you can create outline nodes and connect the relevant sources under each one. Seeing the outline and evidence together makes it easier to judge balance.",
          "Before writing, you can adjust section order and strengthen weak areas in the map, which often saves time during drafting.",
        ],
      },
    ],
    closing:
      "A report outline does not automatically emerge from your sources. Build the flow of problem, evidence, analysis, and conclusion in Brify first, and the writing will follow more naturally.",
  },
  {
    koSlug: "connect-claims-and-evidence-for-reports",
    slug: "connect-claims-and-evidence-for-reports",
    title: "How to Connect Claims and Evidence in a Report",
    excerpt:
      "A persuasive report needs claims, evidence, examples, and sources organized together before they become paragraphs.",
    seo_keywords: ["report evidence organization", "connect claims and evidence", "report claim evidence", "find evidence for assignment", ...commonKeywords],
    intro:
      "A report can feel weak even when the sentences are well written. The more common problem is that claims and evidence are not clearly connected. If the reader cannot see what supports each claim, the report loses persuasive power no matter how polished the writing sounds.",
    sections: [
      {
        heading: "Why Reports Often Feel Vague",
        paragraphs: [
          "Many reports contain source summaries but weak claims, or strong claims but insufficient evidence. When the source and the argument move separately, the report gets longer without becoming more convincing.",
          "The core of a report is showing what you are saying and why you are allowed to say it.",
        ],
      },
      {
        heading: "Separate Claims From Source Summaries",
        paragraphs: [
          "A source summary is what someone else said. A claim is the direction you are taking in your report. If these are not separated, the writing can become only a list of source descriptions.",
          "Try writing each paragraph claim in one sentence first, then attach the sources that support it.",
        ],
      },
      {
        heading: "Mark the Sentences and Data That Count as Evidence",
        paragraphs: [
          "Evidence should be concrete: a sentence, statistic, example, finding, or documented case. When using numbers, keep the source and conditions together.",
          "While reading, mark anything that might later support a claim. It is much safer than trying to find it again the night before submission.",
        ],
      },
      {
        heading: "Keep Counterevidence and Limitations Visible",
        paragraphs: [
          "A strong report does not collect only evidence that supports its position. Counterarguments and limitations show that you understand the issue more carefully.",
          "If you keep them separately, you can write a more balanced conclusion and answer presentation questions more confidently.",
        ],
      },
      {
        heading: "Build Claim-Evidence Links in Brify",
        paragraphs: [
          "In Brify, each claim can have supporting evidence, examples, citations, counterpoints, and limitations underneath it. This makes paragraph strength visible before you write.",
          "The map helps you find claims that are too strong for their evidence or paragraphs that have evidence but no clear claim.",
        ],
      },
    ],
    closing:
      "Report persuasiveness comes from claim-evidence connection more than stylish writing. Before drafting, use Brify to attach evidence and sources to each claim.",
  },
  {
    koSlug: "keep-sources-while-summarizing-materials",
    slug: "keep-sources-while-summarizing-materials",
    title: "How to Keep Sources and Citations While Summarizing Multiple Materials",
    excerpt:
      "When summarizing multiple materials, keep summaries, source locations, citation candidates, and your interpretation separated.",
    seo_keywords: ["summarize materials with sources", "assignment source organization", "report citation organization", "citation management for materials", ...commonKeywords],
    intro:
      "When you summarize multiple materials, everything may feel clear at first. A few days later, however, you may not remember which sentence came from which source, whether it can be cited, or whether it was your own interpretation. A summary without source tracking can weaken the reliability of the final assignment.",
    sections: [
      {
        heading: "Why Sources Get Mixed When You Summarize Many Materials",
        paragraphs: [
          "When several sources discuss similar topics, their terms and claims start to repeat. If you only collect summaries, it becomes hard to know which idea came from which source.",
          "AI summaries can make this even harder because different sources may be rewritten in a similar style.",
        ],
      },
      {
        heading: "What to Keep Next to Every Summary",
        paragraphs: [
          "Next to each summary, keep the title, author or organization, URL or file name, page or section, and the important sentence you checked. For web sources, do not save only the link. Save why the link matters.",
          "This information also makes citation formatting much easier later. Source organization should happen during summarization, not only at the end.",
        ],
      },
      {
        heading: "Separate Citable Material From Background Notes",
        paragraphs: [
          "Not every summary is something you should cite. Some material only helps you understand the topic, while some can support a specific paragraph.",
          "Mark notes as citation candidates, background reference, or needs verification. This makes final review much easier.",
        ],
      },
      {
        heading: "Separate Your Interpretation From the Original Source",
        paragraphs: [
          "Keep what the original source says separate from what you think it means. Without that distinction, you may accidentally present your interpretation as the source’s claim or treat the source’s idea as your own.",
          "A simple split between source content and your interpretation reduces plagiarism risk and improves clarity.",
        ],
      },
      {
        heading: "Create a Source-Aware Material Map in Brify",
        paragraphs: [
          "In Brify, each evidence node can include the source and citation point. Keeping summaries and sources in the same structure reduces time spent searching later.",
          "You can also gather multiple sources under the same claim and compare which one provides the strongest evidence.",
        ],
      },
    ],
    closing:
      "If you lose sources while summarizing, the final stage becomes stressful. Use Brify to keep summary, source, and interpretation together from the beginning.",
  },
  {
    koSlug: "organize-team-assignment-materials",
    slug: "organize-team-assignment-materials",
    title: "How to Organize Scattered Materials in a Team Assignment",
    excerpt:
      "In team assignments, materials should be reorganized by topic, role, claim, evidence, and presentation section rather than by person.",
    seo_keywords: ["organize team assignment materials", "group project material organization", "team project materials", "collaborative report materials", ...commonKeywords],
    intro:
      "The hardest part of a team assignment is often not a lack of materials. It is that the materials are scattered everywhere. One teammate sends links in chat, another writes in a shared document, and someone else keeps PDFs separately. Even when everyone works hard, the overall report or presentation flow can remain unclear.",
    sections: [
      {
        heading: "Why Team Materials Scatter So Quickly",
        paragraphs: [
          "In a team project, each person usually researches a different part. That makes materials naturally accumulate by person.",
          "The final submission, however, cannot be a bundle of each person’s notes. It needs one logical flow.",
        ],
      },
      {
        heading: "Move From Person-Based to Topic-Based Organization",
        paragraphs: [
          "It is fine to collect materials by teammate at first. But once there are enough sources, reorganize them by final structure: background, problem, examples, solution, limitation, and conclusion.",
          "This shift makes it clearer where each source will actually be used.",
        ],
      },
      {
        heading: "View Report Parts and Presentation Parts Together",
        paragraphs: [
          "Many team assignments include both a written report and a presentation. The two outputs are not identical, but their main claims should stay connected.",
          "When organizing materials, mark whether a source is for a report paragraph, a presentation slide, or both.",
        ],
      },
      {
        heading: "Find Overlap and Missing Sections",
        paragraphs: [
          "When all materials are placed in one structure, overlap and gaps become visible. The team may have too many background sources and not enough evidence for the solution.",
          "This makes the next round of research more specific and reduces meeting time.",
        ],
      },
      {
        heading: "Share a Team Material Structure in Brify",
        paragraphs: [
          "A Brify structure map can organize team materials by topic, section, evidence, and source. It helps turn scattered individual research into one submission structure.",
          "Before a team meeting, reviewing the map can lead to better discussion than simply reporting progress.",
        ],
      },
    ],
    closing:
      "Team material organization is not just combining files. Reorganize sources around topics and sections in Brify so the team can see one shared flow.",
  },
  {
    koSlug: "turn-assignment-materials-into-presentation",
    slug: "turn-assignment-materials-into-presentation",
    title: "How to Turn Assignment Materials Into a Presentation",
    excerpt:
      "To turn assignment materials into a presentation, compress them into problem, main claim, evidence, example, and conclusion rather than copying everything.",
    seo_keywords: ["organize presentation materials", "make presentation from assignment", "turn report into presentation", "presentation content structure", ...commonKeywords],
    intro:
      "A common mistake when turning assignment materials into a presentation is copying report paragraphs directly onto slides. A report is meant to be read in detail. A presentation needs a flow that listeners can follow in limited time. That means the same materials must be reorganized for speaking.",
    sections: [
      {
        heading: "Why Report Material Does Not Fit Directly on Slides",
        paragraphs: [
          "Report paragraphs are dense and detailed. If they are moved directly onto slides, the screen becomes crowded and the presenter ends up reading.",
          "Presentation slides should guide the audience through the main flow rather than contain every detail.",
        ],
      },
      {
        heading: "Define the Core Question of the Presentation",
        paragraphs: [
          "Before building slides, decide what the audience should understand after listening. This question helps you decide what to include and remove.",
          "Some background that belongs in a report can be shortened in a presentation. A clear example or visual may matter more.",
        ],
      },
      {
        heading: "Place One Claim and One Evidence Point on Each Slide",
        paragraphs: [
          "A strong slide usually has one main message. If several claims and several pieces of evidence are placed on one slide, the audience loses direction.",
          "Try connecting one claim with one supporting point per slide, then explain the details verbally.",
        ],
      },
      {
        heading: "Choose Examples and Visuals With a Purpose",
        paragraphs: [
          "Examples matter in presentations, but they should support the main claim rather than simply make the slide more interesting.",
          "Tables, images, and comparison charts should help comprehension. If they only decorate the slide, they may distract from the argument.",
        ],
      },
      {
        heading: "Use Brify to Structure the Presentation Flow",
        paragraphs: [
          "In Brify, you can reorganize assignment materials into presentation question, slide message, evidence, example, and conclusion. You can keep the report structure and presentation structure separate.",
          "Before presenting, the map helps you find weak transitions, unsupported slides, and sections with too much information.",
        ],
      },
    ],
    closing:
      "Turning assignment materials into a presentation is not just shortening them. It is rebuilding the flow. Use Brify to shape the core question and slide sequence first.",
  },
  {
    koSlug: "assignment-summary-checklist-before-submit",
    slug: "assignment-summary-checklist-before-submit",
    title: "A Checklist for Reviewing Assignment Material Summaries Before Submission",
    excerpt:
      "Before submitting an assignment, check summary accuracy, sources, interpretation, claim-evidence links, outline flow, and citation readiness.",
    seo_keywords: ["assignment submission checklist", "assignment summary checklist", "report submission review", "material summary checklist", ...commonKeywords],
    intro:
      "Right before submitting an assignment, it is easy to focus only on grammar, formatting, or word count. But in a source-based assignment, the more important question is whether the summary is accurate, the sources are visible, and your claims are connected to evidence. A submission checklist should check the logic of your materials, not only the surface of the writing.",
    sections: [
      {
        heading: "What People Often Miss Before Submission",
        paragraphs: [
          "Many students polish sentences at the end but do not check the structure of the materials. A paragraph can sound natural while still lacking evidence or clear citation.",
          "If you used AI summaries or multiple source summaries, you should especially check where each important idea came from.",
        ],
      },
      {
        heading: "Check Whether the Summary Answers the Assignment Question",
        paragraphs: [
          "A summary can be clear and still fail to answer the assignment question. Look at each paragraph and ask how it connects to the task.",
          "Remove or shorten explanations that do not support the question, and make key claims and evidence more visible.",
        ],
      },
      {
        heading: "Check Sources and Citation Marks",
        paragraphs: [
          "Sources take a long time to recover if you leave them until the end. Before submission, check whether every key claim has a source and whether direct quotes and paraphrases are separated.",
          "If your materials include web pages, articles, academic papers, and lecture slides, the citation style may differ by source type.",
        ],
      },
      {
        heading: "Check Whether Claims and Evidence Are Connected",
        paragraphs: [
          "Treat the first sentence of each paragraph as the claim and check whether the following evidence is enough. If a claim is too strong, soften it or add support.",
          "On the other hand, a paragraph that only summarizes sources without your own claim may need a clearer role in the assignment.",
        ],
      },
      {
        heading: "Review the Final Structure in Brify",
        paragraphs: [
          "A Brify structure map shows the assignment question, claims, evidence, sources, and your interpretation in one place. Structural problems are often easier to find in a map than in a finished paragraph.",
          "Even a short final review can reveal missing sources, repeated points, or claims that need stronger evidence.",
        ],
      },
    ],
    closing:
      "A pre-submission review is there to reduce anxiety. Check in Brify whether question, claim, evidence, and source are connected, then submit with more confidence.",
  },
];

async function getKoreanSource(post) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,slug,translation_group_id")
    .eq("locale", "ko")
    .eq("slug", post.koSlug)
    .single();
  if (error) throw error;
  return data;
}

async function getExistingEnglishPost(post) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,translation_group_id")
    .eq("locale", "en")
    .eq("slug", post.slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

const results = [];

for (const post of posts) {
  const source = await getKoreanSource(post);
  const existing = await getExistingEnglishPost(post);
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
    translation_group_id: source.translation_group_id,
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from("blog_posts")
      .update(payload)
      .eq("id", existing.id)
      .select("id,locale,slug,title,status,seo_keywords,translation_group_id,updated_at")
      .single();
    if (error) throw error;
    results.push({ action: "updated", koSlug: source.slug, ...data });
  } else {
    const { data, error } = await supabase
      .from("blog_posts")
      .insert(payload)
      .select("id,locale,slug,title,status,seo_keywords,translation_group_id,updated_at")
      .single();
    if (error) throw error;
    results.push({ action: "created", koSlug: source.slug, ...data });
  }
}

console.log(JSON.stringify({ count: results.length, results }, null, 2));
