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

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## A Practical Workflow",
    `To apply ${post.title.toLowerCase()} in a real research workflow, start by gathering the papers you already have in one place. Then avoid jumping straight into writing. First, turn each paper into comparable information.`,
    "Write one sentence for the question your literature review needs to answer. Separate papers that directly support that question from papers that only provide background. For each paper, record the research question, population or material, method, main finding, limitation, and relevance to your own project.",
    "Once those fields are consistent, patterns become visible. You can see which claims repeat, which methods dominate the field, which findings disagree, and where your own research question might fit.",
    "## How to Structure It in Brify",
    `In Brify, you can organize ${post.seo_keywords[0]} around nodes such as research question, paper groups, method differences, result differences, limitations, research gaps, and connection to your own project.`,
    "The goal is not to create another isolated note for every paper. Place each paper under a theme, debate, method, or gap. Papers that make similar claims can sit together. Papers that disagree can become a separate branch, which makes the logic of the review easier to explain later.",
    "It also helps to mark what is already clear and what still needs checking. A literature review is not finished in one pass. It becomes stronger through reading, comparison, revision, and source verification.",
    "## Common Mistakes",
    "The first mistake is organizing papers in the order you read them. Reading order is not the same as review logic. Readers do not need to know which paper came first in your workflow; they need to understand how the field has discussed the problem.",
    "The second mistake is giving every paper equal weight. In a literature review, some papers are central evidence, while others provide context. Treating every paper the same makes the review longer but not clearer.",
    "The third mistake is declaring a research gap too quickly. Before saying that no one has studied a question, check your search terms, scope, adjacent concepts, and similar studies. A research gap needs evidence, not just intuition.",
    "## What to Do Today",
    `If you want to start working on ${post.seo_keywords[0]} today, choose only three papers and organize them with the same criteria. Three papers are enough to reveal repeated themes, missing details, and possible gaps.`,
    "Then write one sentence for each paper: why does this paper matter for my research question? If the sentence is hard to write, the paper may not be central to your review. If the sentence is clear, the paper may deserve deeper reading and citation tracking.",
    "Small steps are fine. What matters is that every reading session leaves behind a structure that helps the next reading session and the next writing session.",
    "## Final Thoughts",
    post.closing,
  ].join("\n\n");
}

const commonKeywords = [
  "literature review",
  "graduate research workflow",
  "research paper organization",
  "AI structure map",
  "Brify",
];

const posts = [
  {
    koSlug: "how-to-start-literature-review",
    slug: "how-to-start-a-literature-review",
    title: "How to Start a Literature Review",
    excerpt:
      "Learn how to start a literature review by narrowing your topic, choosing search terms, selecting papers, comparing evidence, and finding research gaps.",
    seo_keywords: ["how to start a literature review", "literature review method", "prior research review", ...commonKeywords],
    intro:
      "Starting a literature review can feel overwhelming. You may not know how many papers to read, which ones belong in the review, or how to turn notes into a coherent argument. A literature review is not a list of papers you have read. It is a structured explanation of the research conversation your project belongs to.",
    sections: [
      {
        heading: "Why Literature Reviews Feel Difficult",
        paragraphs: [
          "A literature review is difficult because every paper asks a slightly different question, uses a different method, studies a different context, and admits different limitations.",
          "If you summarize papers one by one without comparing those differences, the review gets longer but the research landscape remains unclear.",
        ],
      },
      {
        heading: "Narrow the Topic First",
        paragraphs: [
          "Do not begin with a broad keyword and collect everything. First narrow the population, phenomenon, method, and context your project actually cares about.",
          "For example, 'AI in education' is too broad. 'Generative AI in undergraduate writing courses' gives you a clearer boundary for deciding which papers belong.",
        ],
      },
      {
        heading: "Define Search Terms and Inclusion Criteria",
        paragraphs: [
          "A good literature review starts with search design. List the main keywords, related terms, field-specific phrases, and terms you want to exclude.",
          "Then define inclusion and exclusion criteria. Ask whether each paper is directly related to your question, whether its method is comparable, and whether its context is still relevant.",
        ],
      },
      {
        heading: "Compare Papers With the Same Criteria",
        paragraphs: [
          "As you read, record the same fields for every paper: research question, population, method, finding, limitation, and relevance to your project.",
          "This makes it possible to explain the field as a pattern of claims, methods, and gaps rather than a list of author names.",
        ],
      },
      {
        heading: "Build the Review Flow in Brify",
        paragraphs: [
          "Brify can help you connect multiple papers into a structure map. Instead of stacking summaries, you can separate themes, debates, methods, limitations, and research gaps.",
          "Starting with a structure map makes the writing stage less intimidating because the logic of the review is already visible.",
        ],
      },
    ],
    closing:
      "A literature review is not a contest to read the most papers. It is a way to understand a research conversation. Use Brify to turn a paper list into a structured review map.",
  },
  {
    koSlug: "how-to-organize-prior-research",
    slug: "how-to-organize-prior-research",
    title: "How to Organize Prior Research for a Literature Review",
    excerpt:
      "Organize prior research by themes, methods, findings, limitations, and research gaps instead of turning each paper into a separate summary.",
    seo_keywords: ["organize prior research", "prior research review", "literature review organization", ...commonKeywords],
    intro:
      "Organizing prior research is not the same as pasting together summaries. The goal is to show why your research question matters by explaining what existing studies have already done and what they still leave open.",
    sections: [
      {
        heading: "Prior Research Is Not Just Paper Summaries",
        paragraphs: [
          "A paper summary compresses one study. A prior research review compares multiple studies and explains how they relate to your own project.",
          "That means every note should include the question: what does this paper mean for my research question?",
        ],
      },
      {
        heading: "Group Studies by Theme",
        paragraphs: [
          "Listing papers by author often weakens the logic of a review. Strong prior research sections are grouped by themes, debates, or methodological approaches.",
          "When you group similar questions, methods, and conclusions, the shape of the field becomes easier to see.",
        ],
      },
      {
        heading: "Compare Methods and Findings Together",
        paragraphs: [
          "Findings make more sense when they stay connected to methods. A survey, interview study, experiment, or log analysis can support different kinds of claims.",
          "If two papers reach different conclusions, method and context often explain why.",
        ],
      },
      {
        heading: "Look for Limitations and Research Gaps",
        paragraphs: [
          "Limitations are not just weaknesses. They are clues that show where your own research might contribute.",
          "Repeated limitations, understudied populations, missing comparisons, or narrow methods can all become research gap candidates.",
        ],
      },
      {
        heading: "Use Brify to Structure Prior Research",
        paragraphs: [
          "Brify helps you organize prior research by themes and relationships rather than by isolated paper notes.",
          "This structure can become the bridge between reading papers and writing a research proposal, thesis introduction, or literature review section.",
        ],
      },
    ],
    closing:
      "Prior research organization is evidence-building for your own research question. Use Brify to map the flow, limitations, and gaps before you start writing.",
  },
  {
    koSlug: "why-literature-review-matrix-matters",
    slug: "why-a-literature-review-matrix-matters",
    title: "Why a Literature Review Matrix Matters",
    excerpt:
      "A literature review matrix helps you compare research questions, methods, findings, and limitations across papers.",
    seo_keywords: ["literature review matrix", "research paper comparison table", "prior research matrix", ...commonKeywords],
    intro:
      "A literature review matrix is a table that lets you compare multiple papers with the same criteria. It is not just an administrative spreadsheet. It is a tool for seeing patterns, differences, and gaps across studies.",
    sections: [
      {
        heading: "What a Literature Review Matrix Is",
        paragraphs: [
          "A useful matrix usually includes author, year, research question, population, method, findings, limitations, and relevance to your own project.",
          "The key is consistency. You ask every paper the same questions so the papers become comparable.",
        ],
      },
      {
        heading: "What to Include in the Matrix",
        paragraphs: [
          "Bibliographic information is not enough. Include theoretical perspective, method, data, main finding, limitation, and suggested future research.",
          "You can also add custom fields that matter for your topic, such as target population, measurement approach, or unit of analysis.",
        ],
      },
      {
        heading: "Why a Table Is Not Enough",
        paragraphs: [
          "A matrix is excellent for comparison, but it does not always show flow. Tables split information into rows and columns, while literature reviews need relationships and arguments.",
          "After the matrix, you still need to identify groups, debates, disagreements, and gaps.",
        ],
      },
      {
        heading: "See Connections Between Papers",
        paragraphs: [
          "Once the matrix is built, group papers with similar questions, similar methods, or conflicting findings.",
          "Those connections turn a table of studies into the outline of a literature review.",
        ],
      },
      {
        heading: "Use Brify With Your Matrix",
        paragraphs: [
          "You can move the information from a matrix into Brify and connect it by theme, debate, method, and gap.",
          "If the matrix organizes data, Brify helps you see the review logic that data creates.",
        ],
      },
    ],
    closing:
      "A literature review matrix is not proof that you read many papers. It is a tool for finding meaningful differences. Use Brify to turn that matrix into a review structure.",
  },
  {
    koSlug: "why-grad-students-struggle-with-paper-notes",
    slug: "why-graduate-students-struggle-with-paper-notes",
    title: "Why Graduate Students Struggle With Paper Notes",
    excerpt:
      "Graduate students often read many papers but still struggle to turn notes into a literature review. The problem is usually structure.",
    seo_keywords: ["graduate student paper notes", "graduate research workflow", "literature review notes", ...commonKeywords],
    intro:
      "Graduate students read a lot of papers. But after a few weeks, it can become hard to remember why a paper mattered, how it connects to the project, or where it belongs in a literature review.",
    sections: [
      {
        heading: "Why Reading More Does Not Always Help",
        paragraphs: [
          "The main problem is inconsistent notes. One day you summarize the abstract, another day you copy a sentence, and another day you only save the PDF.",
          "Those notes accumulate, but they do not become searchable research knowledge.",
        ],
      },
      {
        heading: "The Limit of Summary-Based Notes",
        paragraphs: [
          "Summaries are useful, but they are not enough for literature review work. You also need relationships between papers, method differences, conflicting findings, and gaps.",
          "Even strong paper summaries can fail if you do not have criteria for comparing them.",
        ],
      },
      {
        heading: "Connect Each Paper to Your Research Question",
        paragraphs: [
          "After reading each paper, write how it relates to your research question. Is it direct evidence, background, a method reference, a counterargument, or something to exclude?",
          "This small classification makes later selection much easier.",
        ],
      },
      {
        heading: "Create Repeatable Note Criteria",
        paragraphs: [
          "Graduate students do not need a perfect note app as much as they need repeatable criteria.",
          "Use the same fields each time: question, method, finding, limitation, and relevance to your own work.",
        ],
      },
      {
        heading: "Build Cumulative Research Notes in Brify",
        paragraphs: [
          "Brify can turn paper notes into a structure map that grows over time.",
          "When papers are organized with the same structure, the later literature review becomes much easier to assemble.",
        ],
      },
    ],
    closing:
      "Reading many papers is less important than comparing papers with the same questions. Use Brify to turn scattered notes into a research map.",
  },
  {
    koSlug: "how-to-find-research-gap",
    slug: "how-to-find-a-research-gap",
    title: "How to Find a Research Gap in a Literature Review",
    excerpt:
      "Find research gaps by comparing topics, populations, methods, data, findings, and limitations across prior studies.",
    seo_keywords: ["how to find a research gap", "research gap", "literature review research gap", ...commonKeywords],
    intro:
      "A research gap is not a random idea that appears out of nowhere. It emerges when you compare prior studies and notice what remains underexplained, understudied, or unresolved.",
    sections: [
      {
        heading: "What a Research Gap Really Is",
        paragraphs: [
          "A research gap can be a missing population, an underused method, an unresolved contradiction, a narrow context, or a question that prior studies have not fully answered.",
          "The point is not simply to say nobody has done something. You need to explain why the missing piece matters.",
        ],
      },
      {
        heading: "Compare Limitations Across Papers",
        paragraphs: [
          "Do not read each limitation section in isolation. Put limitations side by side and look for repetition.",
          "Repeated issues such as small samples, single-country settings, short-term data, or narrow measurements often point toward gap candidates.",
        ],
      },
      {
        heading: "Look at Population and Method Differences",
        paragraphs: [
          "Different populations and methods can produce different conclusions. Tracking those differences can lead to stronger research questions.",
          "For example, survey studies, interviews, experiments, and platform data each reveal different parts of the same phenomenon.",
        ],
      },
      {
        heading: "Find Repeated Conclusions and Missing Questions",
        paragraphs: [
          "If many papers repeat a similar conclusion, ask where that conclusion applies and where it might not.",
          "If a question keeps disappearing from the literature, that absence may become a research gap.",
        ],
      },
      {
        heading: "Map Gap Candidates in Brify",
        paragraphs: [
          "Brify helps you lay out limitations, methods, populations, and findings across papers.",
          "When the differences are visible, possible research gaps become easier to evaluate.",
        ],
      },
    ],
    closing:
      "Research gaps come from the differences and limits of prior research. Use Brify to map those differences before choosing your own research question.",
  },
  {
    koSlug: "literature-review-for-research-proposal",
    slug: "literature-review-for-a-research-proposal",
    title: "How to Prepare a Literature Review for a Research Proposal",
    excerpt:
      "Prepare a research proposal literature review by organizing prior studies and connecting them to your research question.",
    seo_keywords: ["research proposal literature review", "prior research for proposal", "graduate research proposal", ...commonKeywords],
    intro:
      "The literature review in a research proposal is not a report on how much you have read. It shows why your research question is necessary, where the field currently stands, and what remains unresolved.",
    sections: [
      {
        heading: "The Role of the Literature Review in a Proposal",
        paragraphs: [
          "A proposal literature review provides background and justification. Advisors and reviewers use it to see whether you understand the field.",
          "Instead of listing summaries, you need to show the conversation your project will enter.",
        ],
      },
      {
        heading: "Build the Topic Flow First",
        paragraphs: [
          "Before writing sentences, build the flow of topics. Move from the broader field to specific debates, and then toward your own research question.",
          "Once the flow is visible, it becomes easier to decide which papers belong early and which belong later.",
        ],
      },
      {
        heading: "Organize the Limits of Prior Research",
        paragraphs: [
          "A proposal should show both what prior research has achieved and what it has not yet solved.",
          "Separate limits by population, method, data, context, and theoretical explanation.",
        ],
      },
      {
        heading: "Connect the Review to Your Research Question",
        paragraphs: [
          "The end of the literature review should naturally lead to your research question.",
          "If that connection is weak, the review may look like a reading list rather than a proposal argument.",
        ],
      },
      {
        heading: "Use Brify to Plan the Proposal Structure",
        paragraphs: [
          "Brify can help you map prior research, research gaps, and your own question before drafting the proposal.",
          "Seeing the structure first makes the writing stage less blocked.",
        ],
      },
    ],
    closing:
      "A proposal literature review proves why your project should exist. Use Brify to design the flow before turning it into paragraphs.",
  },
  {
    koSlug: "prepare-papers-for-advisor-meeting",
    slug: "prepare-papers-for-an-advisor-meeting",
    title: "How to Prepare Papers for an Advisor Meeting",
    excerpt:
      "Before an advisor meeting, organize papers by key questions, evidence, unclear points, and next actions.",
    seo_keywords: ["advisor meeting paper notes", "graduate advisor meeting", "research meeting preparation", ...commonKeywords],
    intro:
      "Before an advisor meeting, you do not need to produce a perfect summary of every paper. You need to make the discussion clear: what you understood, what you are unsure about, and what decision should come next.",
    sections: [
      {
        heading: "Why Preparation Matters",
        paragraphs: [
          "Meeting time is limited. If you spend all of it explaining papers from the beginning, there is little room left for research direction.",
          "Good meeting notes highlight key evidence, unclear points, and concrete next steps.",
        ],
      },
      {
        heading: "Keep the Main Question for Each Paper",
        paragraphs: [
          "For every paper, separate the paper's own research question from the question you want to discuss with your advisor.",
          "Advisor conversations often begin with questions, not summaries.",
        ],
      },
      {
        heading: "Separate What Is Clear From What Is Not",
        paragraphs: [
          "Do not hide unclear parts. Mark whether the method, interpretation, or connection to your project is confusing.",
          "Specific uncertainty leads to better feedback.",
        ],
      },
      {
        heading: "Prepare the Next Reading Candidates",
        paragraphs: [
          "Bring a short list of papers you might read next. These can come from key citations, opposing findings, or methods you need to understand.",
          "This turns the meeting into part of a research routine rather than a one-time check-in.",
        ],
      },
      {
        heading: "Use Brify as a Meeting Map",
        paragraphs: [
          "Brify can organize key questions, evidence, concerns, and next actions in one structure map.",
          "That makes it easier to guide the conversation and preserve decisions after the meeting.",
        ],
      },
    ],
    closing:
      "Advisor meeting notes should clarify discussion, not just prove that you read. Use Brify to organize questions and evidence before the meeting.",
  },
  {
    koSlug: "group-papers-by-theme-for-literature-review",
    slug: "group-papers-by-theme-for-a-literature-review",
    title: "How to Group Papers by Theme for a Literature Review",
    excerpt:
      "Group papers by theme, debate, method, population, and conflicting findings instead of listing them by author.",
    seo_keywords: ["group papers by theme", "thematic literature review", "literature review organization", ...commonKeywords],
    intro:
      "Listing papers by author can make a literature review easy to start, but it often weakens the argument. A strong review shows a thematic structure, not just a paper list.",
    sections: [
      {
        heading: "Why Author-by-Author Organization Is Limited",
        paragraphs: [
          "Author-by-author organization shows who did what, but it does not show how the field is structured.",
          "A literature review needs logic more than chronology.",
        ],
      },
      {
        heading: "Create Theme-Based Groups",
        paragraphs: [
          "Look for repeated themes across papers: similar research questions, similar phenomena, or shared theoretical perspectives.",
          "These groups can become the main sections of the review.",
        ],
      },
      {
        heading: "Group by Method When It Matters",
        paragraphs: [
          "For some topics, methods explain why results differ. Experiments, surveys, interviews, case studies, and log data each produce different evidence.",
          "Method-based groups can help you explain disagreements more carefully.",
        ],
      },
      {
        heading: "Group Conflicting Findings",
        paragraphs: [
          "Some of the most useful literature review sections come from disagreement.",
          "Separate conflicting findings and ask whether population, context, measurement, or method explains the difference.",
        ],
      },
      {
        heading: "Build Theme Structure in Brify",
        paragraphs: [
          "Brify lets you organize papers under themes, methods, findings, and limitations.",
          "Turning an author list into a thematic structure makes the review easier to write and easier to revise.",
        ],
      },
    ],
    closing:
      "A good literature review is a themed research conversation. Use Brify to turn your paper list into a structure that readers can follow.",
  },
  {
    koSlug: "when-zotero-notion-is-not-enough-for-literature-review",
    slug: "when-zotero-and-notion-are-not-enough-for-a-literature-review",
    title: "When Zotero and Notion Are Not Enough for a Literature Review",
    excerpt:
      "Zotero and Notion are useful, but literature reviews also need structure, relationships, and research gap mapping.",
    seo_keywords: ["literature review tool", "Zotero Notion literature review", "graduate student research tools", ...commonKeywords],
    intro:
      "Zotero and Notion are useful tools. But managing references and building the logic of a literature review are two different tasks.",
    sections: [
      {
        heading: "What Zotero and Notion Do Well",
        paragraphs: [
          "Zotero is strong for reference management, citation workflows, and PDF organization. Notion is flexible for notes and databases.",
          "Both can be important parts of a research system.",
        ],
      },
      {
        heading: "Reference Management Is Not Review Structure",
        paragraphs: [
          "Saving references well does not automatically create a literature review argument.",
          "A review also needs relationships between papers, debates, gaps, and a clear flow toward your research question.",
        ],
      },
      {
        heading: "The Relationship Problem",
        paragraphs: [
          "As papers accumulate, individual notes may remain accessible while relationships become harder to see.",
          "Research gaps and conflicting findings are especially hard to notice if every note stays isolated.",
        ],
      },
      {
        heading: "Why You Need a Separate Review Flow",
        paragraphs: [
          "A literature review turns stored materials into an argument. That step needs theme groups and logical sequence.",
          "Using different tools for reference storage and structure mapping can make the workflow clearer.",
        ],
      },
      {
        heading: "How Brify Fits Into the Workflow",
        paragraphs: [
          "You can keep references and PDFs in Zotero while using Brify to map relationships, themes, debates, and gaps.",
          "That lets each tool do what it is best at.",
        ],
      },
    ],
    closing:
      "Reference management and literature review structure are different problems. Keep your sources where they are, and use Brify to map the relationships between them.",
  },
  {
    koSlug: "how-to-select-papers-for-literature-review",
    slug: "how-to-select-papers-for-a-literature-review",
    title: "How to Select Papers for a Literature Review",
    excerpt:
      "Select literature review papers by relevance, method, citation context, recency, and connection to your research gap.",
    seo_keywords: ["select papers for literature review", "literature review criteria", "prior research selection", ...commonKeywords],
    intro:
      "In a literature review, collecting many papers is less important than selecting the papers your research question actually needs.",
    sections: [
      {
        heading: "Why Selection Matters More Than Volume",
        paragraphs: [
          "If every search result enters the review, the argument becomes unfocused.",
          "A strong literature review has clear reasons for including papers and clear reasons for excluding others.",
        ],
      },
      {
        heading: "Set Inclusion and Exclusion Criteria",
        paragraphs: [
          "Define criteria such as topic, population, method, publication period, field, and data type.",
          "Exclude papers that are only loosely related, too far from your context, or impossible to compare with your main studies.",
        ],
      },
      {
        heading: "Balance Recent and Foundational Work",
        paragraphs: [
          "Recent papers show current debates, but foundational papers explain where the field came from.",
          "A good review often needs both.",
        ],
      },
      {
        heading: "Check Relevance to Your Research Question",
        paragraphs: [
          "For each paper, write one sentence explaining its relevance to your project.",
          "If that sentence is difficult to write, the paper may not belong in the core review.",
        ],
      },
      {
        heading: "Use Brify to Record Selection Reasons",
        paragraphs: [
          "Brify can help you keep inclusion and exclusion reasons next to the papers themselves.",
          "This is useful when you later need to explain the scope of your literature review.",
        ],
      },
    ],
    closing:
      "A literature review should not include every paper you find. Use Brify to record why each paper belongs in the review.",
  },
  {
    koSlug: "literature-review-outline-before-writing",
    slug: "literature-review-outline-before-writing",
    title: "Build a Literature Review Outline Before You Start Writing",
    excerpt:
      "Before writing a literature review, structure themes, paper groups, debates, research gaps, and your research question.",
    seo_keywords: ["literature review outline", "literature review structure", "prior research writing", ...commonKeywords],
    intro:
      "Writing a literature review from a blank document is hard. Before drafting, you need a structure for themes, paper groups, debates, research gaps, and your own research question.",
    sections: [
      {
        heading: "Why Writing Immediately Gets Stuck",
        paragraphs: [
          "Even if you have read many papers, writing stalls when the order is unclear.",
          "A literature review is not written in reading order. It is written in argument order.",
        ],
      },
      {
        heading: "Paper Groups Are Not the Same as an Outline",
        paragraphs: [
          "Paper groups collect similar studies. An outline decides the order in which readers should encounter the argument.",
          "Keeping those two levels separate prevents the review from becoming a classification table.",
        ],
      },
      {
        heading: "Build a Debate-Centered Flow",
        paragraphs: [
          "A review becomes stronger when it follows debates and unresolved questions rather than only topics.",
          "Debates naturally lead toward your own research question.",
        ],
      },
      {
        heading: "Connect the Gap to the Ending",
        paragraphs: [
          "The end of the review should point toward a research gap and your question.",
          "Without that connection, the review may not support the proposal or thesis introduction.",
        ],
      },
      {
        heading: "Turn a Brify Map Into a Draft",
        paragraphs: [
          "A Brify structure map can become the outline for your literature review.",
          "Use major themes, sub-debates, key papers, and research gaps as nodes, then expand each node into paragraphs.",
        ],
      },
    ],
    closing:
      "A literature review should start with structure, not panic in a blank document. Use Brify to build the outline first.",
  },
  {
    koSlug: "how-to-explain-differences-between-papers",
    slug: "how-to-explain-differences-between-papers",
    title: "How to Explain Differences Between Papers in a Literature Review",
    excerpt:
      "Explain differences between papers by comparing methods, populations, findings, interpretation, and relevance to your research question.",
    seo_keywords: ["compare papers in literature review", "differences between research papers", "literature review comparison", ...commonKeywords],
    intro:
      "Explaining differences between papers is not the same as listing results side by side. A literature review should explain why those differences exist and what they mean for your own research.",
    sections: [
      {
        heading: "Why Difference Matters",
        paragraphs: [
          "Papers on the same topic can reach different conclusions. If you do not explain why, the review becomes confusing.",
          "Differences reveal debates, limits, and unresolved questions in the field.",
        ],
      },
      {
        heading: "Start With Method Differences",
        paragraphs: [
          "When results differ, check the methods first. Surveys, interviews, experiments, and case studies each support different claims.",
          "Understanding method differences helps you interpret findings more fairly.",
        ],
      },
      {
        heading: "Compare Population and Context",
        paragraphs: [
          "The same phenomenon may look different across students, workers, experts, beginners, countries, or institutions.",
          "Context can explain why conclusions do not fully match.",
        ],
      },
      {
        heading: "Handle Conflicting Findings Carefully",
        paragraphs: [
          "Do not force conflicting results into one simple conclusion.",
          "Instead, explain the conditions under which each result appears.",
        ],
      },
      {
        heading: "Use Brify to Map Causes of Difference",
        paragraphs: [
          "Brify lets you place method, population, context, and findings side by side.",
          "When causes of difference are visible, your literature review becomes analytical rather than descriptive.",
        ],
      },
    ],
    closing:
      "Differences between papers should be interpreted, not just listed. Use Brify to map possible reasons for those differences.",
  },
  {
    koSlug: "weekly-literature-review-routine-for-grad-students",
    slug: "weekly-literature-review-routine-for-graduate-students",
    title: "A Weekly Literature Review Routine for Graduate Students",
    excerpt:
      "A weekly literature review routine helps graduate students search, select, structure, and update research questions consistently.",
    seo_keywords: ["weekly literature review routine", "graduate research routine", "PhD literature review workflow", ...commonKeywords],
    intro:
      "A literature review should not be written in a rush right before a deadline. For graduate students, it works better as a weekly research system that accumulates over time.",
    sections: [
      {
        heading: "Why a Weekly Routine Helps",
        paragraphs: [
          "If paper reading depends only on deadlines, sources accumulate without structure.",
          "A weekly routine turns search, selection, organization, and question refinement into a repeatable process.",
        ],
      },
      {
        heading: "Choose This Week's Search Direction",
        paragraphs: [
          "Each week, pick one search focus: a concept, population, method, opposing view, or recent debate.",
          "Recording search terms also helps you explain the scope of your review later.",
        ],
      },
      {
        heading: "Use the Same Criteria for Every Paper",
        paragraphs: [
          "For every paper, record question, method, finding, limitation, and relevance to your project.",
          "Consistent criteria make papers comparable a month later.",
        ],
      },
      {
        heading: "Update the Research Question",
        paragraphs: [
          "The final step each week is to update your own research question.",
          "Ask whether the new papers narrowed, changed, strengthened, or challenged your question.",
        ],
      },
      {
        heading: "Maintain the Routine in Brify",
        paragraphs: [
          "Brify can hold weekly paper groups, research gaps, search terms, and next actions in one structure map.",
          "Over time, that map becomes the skeleton of the literature review.",
        ],
      },
    ],
    closing:
      "A literature review is a research system that grows weekly. Use Brify to accumulate paper structures before the writing deadline arrives.",
  },
  {
    koSlug: "what-to-check-when-using-ai-for-literature-review",
    slug: "what-to-check-when-using-ai-for-a-literature-review",
    title: "What to Check When Using AI for a Literature Review",
    excerpt:
      "When using AI for a literature review, check search scope, paper selection, source evidence, citation context, and research gap interpretation.",
    seo_keywords: ["AI literature review", "AI literature review tool", "literature review automation", ...commonKeywords],
    intro:
      "AI can make literature review work faster. But a literature review still requires research judgment, so AI output should be checked structurally rather than accepted as final.",
    sections: [
      {
        heading: "What AI Can Help With",
        paragraphs: [
          "AI can help scan long papers, extract themes, summarize findings, and suggest early structure.",
          "It is especially useful during early exploration and first-draft planning.",
        ],
      },
      {
        heading: "Do Not Trust Paper Selection Blindly",
        paragraphs: [
          "AI may miss important papers, include weakly related studies, or reflect a narrow search scope.",
          "You need to be able to explain the selection criteria yourself.",
        ],
      },
      {
        heading: "Check Source Evidence and Citation Context",
        paragraphs: [
          "Always compare AI summaries with the original source. Citation context, cautious wording, and limitations can be flattened.",
          "A fluent summary is not the same as a verified literature review.",
        ],
      },
      {
        heading: "Review the Research Gap Yourself",
        paragraphs: [
          "AI may suggest research gaps too quickly. A real gap must be grounded in differences, limitations, and missing questions across studies.",
          "Treat AI-generated gaps as candidates, not conclusions.",
        ],
      },
      {
        heading: "Use Brify to Review AI Output",
        paragraphs: [
          "Brify can turn AI-generated literature review notes into a structure map for checking gaps, sources, and overstatements.",
          "This lets you combine AI speed with human research judgment.",
        ],
      },
    ],
    closing:
      "AI can speed up literature review work, but the structure still needs verification. Use Brify to inspect and revise AI output before trusting it.",
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
