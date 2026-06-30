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
  "organize market research report",
  "structure meeting materials",
  "business research organization",
  "competitor analysis organization",
  "meeting decision tracking",
  "business document structure",
  "AI structure map",
  "Brify",
];

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## Turning Business Materials Into a Decision Structure in Brify",
    `The important point in ${post.title} is not making the material shorter. It is organizing it so it can lead to the next judgment and the next action. Market research reports, competitor analysis, customer insights, and meeting materials are not only things to read. They are inputs for decisions.`,
    "In Brify, you can turn business materials into a structure map with nodes such as core question, market/customer/competitor information, evidence, interpretation, open issues, decisions, action items, owners, and deadlines. This keeps research summaries and meeting notes from becoming scattered documents.",
    "In real work, more information often makes the conclusion less clear. If numbers, customer quotes, competitor features, and meeting opinions are placed in the same paragraph, it becomes hard to tell what is fact, what is interpretation, and what needs to be done next.",
    "## When a Structure Map Becomes More Useful",
    "A structure map is especially useful when you have read a market research report but cannot explain what it means for your product or project, when meeting materials are long but the actual decision is unclear, or when a meeting note exists but owners and next actions are vague.",
    "It also helps when research findings and meeting decisions are stored separately and never become an action plan. At that point, the answer is not a longer summary. What you need is a structure that connects insight, decision, and action item.",
    "## Business Review Checklist",
    `If you are working on ${post.seo_keywords[0]} today, check four things: what decision question does this material answer, are evidence and interpretation separated, are the meeting issues visible, and does the material connect to next actions and owners?`,
    "If those four things are not visible, the material may look organized but may not be ready for execution. Turning it into a Brify structure map connects research, meetings, and action planning in one workflow.",
    "## Final Thoughts",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    koSlug: "organize-market-research-report",
    slug: "organize-market-research-report",
    title: "How to Organize a Market Research Report and Keep Only What Matters",
    excerpt:
      "Learn how to organize a market research report by market size, customer segments, competition, growth drivers, risks, and action hypotheses.",
    seo_keywords: ["organize market research report", "market research organization", "research report organization", "market analysis report summary", ...commonKeywords],
    intro:
      "A market research report usually contains numbers, charts, industry trends, customer segments, and competitor information all at once. If you finish reading it but still cannot answer what matters for your team, the work is not finished. Organizing a market research report is not about making it shorter. It is about turning it into a structure that supports decisions.",
    sections: [
      {
        heading: "Why Market Research Reports Are Long and Hard to Use",
        paragraphs: [
          "Market research reports often combine macro trends, customer behavior, competition, and technology shifts in one document. You may understand the report as you read it, but still struggle to turn it into a business judgment.",
          "Copying the numbers from the report is not enough. You need to know whether a number supports market entry, pricing, feature prioritization, positioning, or marketing messaging.",
        ],
      },
      {
        heading: "Start With the Decision Question",
        paragraphs: [
          "Before organizing the report, decide what question it should help answer. For example: is this market worth entering, which customer segment should we target first, or what message should we use against competitors?",
          "Without a question, every chart looks important. With a question, you can separate useful data from background information.",
        ],
      },
      {
        heading: "Separate Market Size, Customers, Competition, and Risks",
        paragraphs: [
          "A practical structure is market size, growth drivers, customer segments, competitors, risks, and execution opportunities. This breaks a long report into units that can support business decisions.",
          "Market size supports opportunity judgment, customer segments support targeting, competition supports differentiation, and risks help adjust execution priority.",
        ],
      },
      {
        heading: "Separate Data From Interpretation",
        paragraphs: [
          "The number in the report and your interpretation of that number are different things. A 20 percent growth rate is data. Saying the market is attractive is an interpretation.",
          "If you keep the data as evidence and your team’s interpretation as a separate note, later discussions become clearer because fact and judgment do not blur together.",
        ],
      },
      {
        heading: "Create a Market Research Structure Map in Brify",
        paragraphs: [
          "In Brify, you can organize a market research report into market, customer, competition, risk, and action hypothesis. This is more useful for decisions than a single paragraph summary.",
          "Sharing the structure map before a meeting helps the team see where different interpretations come from.",
        ],
      },
    ],
    closing:
      "The goal of organizing a market research report is not to create a shorter report. Use Brify to connect market, customer, competition, risk, and action hypotheses into a structure that supports the next decision.",
  },
  {
    koSlug: "organize-competitor-analysis",
    slug: "organize-competitor-analysis",
    title: "How to Organize Competitor Analysis Materials",
    excerpt:
      "Competitor analysis becomes useful when features, pricing, customer segments, messaging, strengths, weaknesses, and differentiation opportunities are organized together.",
    seo_keywords: ["organize competitor analysis", "competitor research organization", "competitor comparison table", "market research competitor analysis", ...commonKeywords],
    intro:
      "Competitor analysis quickly becomes a pile of links. Websites, pricing pages, feature lists, customer reviews, ad copy, and funding news keep accumulating, but the conclusion can remain unclear. Organizing competitor analysis is not about making a list of competitors. It is about finding decision criteria and differentiation hypotheses for your own product or service.",
    sections: [
      {
        heading: "Why Competitor Research Gets Complicated Quickly",
        paragraphs: [
          "Competitor materials come in different formats. Some are feature-focused, some are pricing-focused, and others come from reviews, brand messaging, or sales pages.",
          "If you only group materials by competitor, comparison becomes difficult. The comparison criteria need to be organized first.",
        ],
      },
      {
        heading: "Choose Comparison Criteria Before Collecting More",
        paragraphs: [
          "Trying to compare every feature and every price point usually creates a large table with a weak conclusion. Start with the criteria that matter to your own decision.",
          "For example, the focus changes depending on whether early customers care most about price, ease of use, collaboration, security, onboarding, or integrations.",
        ],
      },
      {
        heading: "Separate Features, Pricing, Customers, and Messaging",
        paragraphs: [
          "A useful competitor analysis separates features, pricing, customer segment, core message, strengths, weaknesses, and repeated complaints from reviews.",
          "Customer segment and message often matter more than a feature table. Two products can have similar functions but completely different market positions.",
        ],
      },
      {
        heading: "Turn Strengths and Weaknesses Into Action Hypotheses",
        paragraphs: [
          "Finding competitor weaknesses is not enough. You need to decide whether the weakness is an opportunity for your product or a difficulty in the whole market.",
          "If reviews repeatedly say setup is difficult, that may become a hypothesis for improving your onboarding message or first-use experience.",
        ],
      },
      {
        heading: "Build a Competitor Comparison Structure in Brify",
        paragraphs: [
          "In Brify, you can create competitor nodes and comparison-criteria nodes together. Connecting features, pricing, customers, messaging, complaints, and differentiation opportunities makes the conclusion clearer.",
          "The same structure map can be reused in product meetings, messaging reviews, and pricing discussions.",
        ],
      },
    ],
    closing:
      "Competitor analysis is not about knowing more competitors. It is about deciding what you should do differently. Use Brify to organize comparison criteria and differentiation hypotheses together.",
  },
  {
    koSlug: "organize-customer-insights",
    slug: "organize-customer-insights",
    title: "How to Turn Customer Insights Into Product and Marketing Decisions",
    excerpt:
      "Customer insights should be organized by segment, problem, repeated wording, purchase reason, churn reason, and product improvement hypothesis.",
    seo_keywords: ["organize customer insights", "customer interview organization", "survey results organization", "customer review analysis", ...commonKeywords],
    intro:
      "Customer interviews, survey responses, app reviews, support tickets, and sales call notes are all valuable. But because they come in different formats, putting them in one place does not automatically create a product decision or marketing message. Organizing customer insights is less about a polished summary and more about finding repeated problems and actionable hypotheses.",
    sections: [
      {
        heading: "Why Customer Materials Become Scattered",
        paragraphs: [
          "Customer materials vary by channel. Interviews are long, surveys are short, reviews include emotion, and support tickets focus on problems.",
          "If you simply collect them as they are, you may have many customer voices but still not know which problem to solve first.",
        ],
      },
      {
        heading: "Separate Customer Segments and Situations First",
        paragraphs: [
          "Not every customer comment should carry the same weight. Start by separating new users, power users, churned customers, and customers near purchase.",
          "The same complaint can lead to a different product priority depending on who said it and in what situation.",
        ],
      },
      {
        heading: "Find Repeated Frictions and Exact Wording",
        paragraphs: [
          "In customer insights, repeated patterns matter more than one strong opinion. If many customers describe the same friction in similar words, it may be a real signal for product or messaging.",
          "The customer’s exact wording is also valuable for marketing. Keep customer language separate from the team’s interpretation so it can be used more accurately later.",
        ],
      },
      {
        heading: "Connect Insights to Product and Marketing Decisions",
        paragraphs: [
          "Customer insights become weak if they stop at what the customer said. You need to decide whether each insight connects to product improvement, onboarding, pricing, content, or advertising.",
          "For example, a review saying the product is useful but hard to start with may point to first-use flow or tutorial messaging rather than adding more features.",
        ],
      },
      {
        heading: "Structure Customer Insights in Brify",
        paragraphs: [
          "In Brify, you can connect customer segment, problem, original wording, repeated frequency, product hypothesis, and marketing message in one structure map.",
          "This helps product and marketing teams use the same customer material for different decisions without losing the original signal.",
        ],
      },
    ],
    closing:
      "Customer insight work is not just summarizing what customers said. Use Brify to connect segments, problems, repeated wording, and product hypotheses to real decisions.",
  },
  {
    koSlug: "structure-meeting-materials-before-meeting",
    slug: "structure-meeting-materials-before-meeting",
    title: "How to Structure Meeting Materials Before a Meeting",
    excerpt:
      "Structuring meeting materials before a meeting helps separate agenda, background, decisions, issues, questions, and missing information.",
    seo_keywords: ["structure meeting materials", "organize meeting materials", "meeting agenda organization", "meeting preparation materials", ...commonKeywords],
    intro:
      "You can read meeting materials in advance and still enter the meeting unsure what needs to be decided. Understanding the content and structuring it for a meeting are different tasks. Structuring meeting materials is not meeting-note writing. It is making the agenda and decision points clear before the meeting starts.",
    sections: [
      {
        heading: "What Goes Wrong When You Only Read Meeting Materials",
        paragraphs: [
          "Meeting materials often contain background, data, proposals, issues, and reference links together. Reading them in order may help you understand the content, but not necessarily what should be discussed first.",
          "The shorter the meeting, the more important it becomes to separate decisions and questions instead of summarizing everything.",
        ],
      },
      {
        heading: "Separate Agenda From Background Information",
        paragraphs: [
          "The agenda is what the meeting needs to address. Background information is what helps people understand that agenda. If the two are mixed, the meeting can become a long explanation session.",
          "Before the meeting, list the agenda first and connect only the necessary background under each item.",
        ],
      },
      {
        heading: "Mark What Needs to Be Decided",
        paragraphs: [
          "The most important thing to mark in meeting materials is the decision point. Is this meeting for sharing opinions, approving a proposal, or deciding priority?",
          "When the decision point is visible, the discussion is less likely to drift away from the goal.",
        ],
      },
      {
        heading: "Prepare Issues and Questions in Advance",
        paragraphs: [
          "Potential conflicts and questions should be separated before the meeting. If unclear parts are skipped while reading, they usually return during the meeting and consume time.",
          "Issues can be grouped as disagreement, missing data, customer impact, schedule risk, or resource risk.",
        ],
      },
      {
        heading: "Create a Pre-Meeting Structure Map in Brify",
        paragraphs: [
          "In Brify, you can organize meeting materials into agenda, background, decision point, issue, question, and additional material.",
          "When the structure is shared before the meeting, participants can enter the conversation with the same flow in mind.",
        ],
      },
    ],
    closing:
      "Structuring meeting materials is not about preparing more. It is about saving meeting time. Use Brify to separate agenda, decisions, issues, and questions before the meeting starts.",
  },
  {
    koSlug: "organize-meeting-decisions-action-items",
    slug: "organize-meeting-decisions-action-items",
    title: "How to Organize Meeting Decisions and Action Items",
    excerpt:
      "After a meeting, separate decisions, open issues, owners, deadlines, and next action items instead of keeping only a long transcript.",
    seo_keywords: ["organize meeting decisions", "meeting action items", "post-meeting organization", "meeting notes structure", ...commonKeywords],
    intro:
      "A long meeting note does not guarantee good execution. In many cases, everything discussed is written down, but it is still unclear who should do what by when. The purpose of post-meeting organization is not to preserve every sentence. It is to make execution stable after the meeting ends.",
    sections: [
      {
        heading: "Why Long Meeting Notes Still Fail",
        paragraphs: [
          "Meeting notes can contain background, opinions, objections, temporary ideas, jokes, and decisions all together. If they remain in that form, action items are hard to find later.",
          "After a meeting, the full record and the execution structure should be separated. Not every spoken point has the same importance.",
        ],
      },
      {
        heading: "Separate Decisions From Discussion",
        paragraphs: [
          "First, extract what was actually decided. Discussed and decided are not the same. Decisions become the reference point for future action.",
          "Unresolved opinions should be kept as open issues or follow-up items, not written as if they were decisions.",
        ],
      },
      {
        heading: "Keep Open Issues and Missing Materials Visible",
        paragraphs: [
          "Issues that were not resolved in the meeting still matter. But if they are written like decisions, confusion follows.",
          "For each open issue, note why it remains open, what information is missing, and who will check it.",
        ],
      },
      {
        heading: "Add Owner, Deadline, and Next Step",
        paragraphs: [
          "An action item needs more than a task sentence. It needs an owner, a deadline, and a completion condition.",
          "For example, competitor research is vague. Check Company A’s new pricing policy by next Tuesday and add it to the comparison table is actionable.",
        ],
      },
      {
        heading: "Build a Post-Meeting Execution Map in Brify",
        paragraphs: [
          "In Brify, you can structure meeting content into decisions, open issues, missing materials, owners, deadlines, and action items.",
          "With this structure, the next action and responsibility are visible without rereading the entire meeting note.",
        ],
      },
    ],
    closing:
      "Post-meeting organization is about execution, not just record keeping. Use Brify to separate decisions and action items so the next work is immediately visible.",
  },
  {
    koSlug: "turn-research-and-meetings-into-action-plan",
    slug: "turn-research-and-meetings-into-action-plan",
    title: "How to Turn Market Research and Meeting Materials Into an Action Plan",
    excerpt:
      "To turn research and meetings into action, connect insights, decisions, hypotheses, owners, deadlines, and success metrics.",
    seo_keywords: ["business research organization", "business document structure", "research findings organization", "action plan organization", ...commonKeywords],
    intro:
      "Sometimes the market research report is organized and the meeting materials are organized, but the work still does not move. The reason is that research insights and meeting decisions are stored separately. The final goal of business research organization is not a polished summary. It is the next action that can actually be executed.",
    sections: [
      {
        heading: "Why Organized Materials Do Not Always Lead to Execution",
        paragraphs: [
          "Research materials are often organized around insights, while meeting materials are organized around agenda and decisions. If the two are not connected, even strong research and good meetings can fail to become an action plan.",
          "An action plan needs not only what you learned, but what you will do, who will do it, and when it will be reviewed.",
        ],
      },
      {
        heading: "Connect Research Insights to Meeting Decisions",
        paragraphs: [
          "A research insight should be linked to the decision it influenced. If customer segment analysis led to a target customer decision, that connection should be visible.",
          "Without this link, teams later forget why a decision was made and repeat the same discussion.",
        ],
      },
      {
        heading: "Turn Insights Into Hypotheses, Owners, Deadlines, and Metrics",
        paragraphs: [
          "An action plan needs a step where insights become hypotheses. For example, if customers want structure more than a fast summary, the hypothesis may be that adding structure-map examples to the landing page will improve conversion.",
          "Then attach an owner, deadline, and metric. That is what turns research into an experiment or task.",
        ],
      },
      {
        heading: "Leave Review Points for the Next Meeting",
        paragraphs: [
          "An action plan is not a document you create once and forget. It should also say what needs to be checked in the next meeting.",
          "Progress, metric changes, missing information, and decisions to make next should be visible before the next discussion begins.",
        ],
      },
      {
        heading: "Build an Action Plan Structure Map in Brify",
        paragraphs: [
          "In Brify, you can connect research insights, meeting decisions, execution hypotheses, owners, deadlines, and success metrics in one structure.",
          "When market research and meeting materials become one execution flow, material organization is more likely to turn into real progress.",
        ],
      },
    ],
    closing:
      "The end of business research organization is not a summary. It is execution. Use Brify to connect insights, decisions, hypotheses, owners, and deadlines into a plan that moves.",
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
