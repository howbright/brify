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
  return insertDefaultBodyImage(
    [
      post.intro,
      ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
      `## ${post.shared.heading}`,
      ...post.shared.paragraphs,
      `## ${post.closingHeading}`,
      post.closing,
    ].join("\n\n")
  );
}

const posts = [
  {
    key: "recommendation-checklist",
    locales: [
      {
        locale: "ko",
        slug: "ai-summary-tool-recommendation-checklist",
        title: "AI 요약 도구 추천: 고르기 전에 봐야 할 7가지 기준",
        excerpt:
          "AI 요약 도구를 고를 때 자료 유형, 원문 확인, 구조화, 편집 가능성, 재사용성까지 함께 봐야 하는 이유를 설명합니다.",
        seo_keywords: [
          "AI 요약 도구 추천",
          "AI 요약툴 추천",
          "PDF 요약 도구",
          "문서 요약 AI",
          "요약 프로그램 추천",
          "AI 자료 정리 도구",
          "구조화 요약 도구",
          "Brify",
        ],
        intro:
          "AI 요약 도구를 찾기 시작하면 선택지가 너무 많아집니다. 어떤 도구는 PDF 요약을 강조하고, 어떤 도구는 유튜브나 회의록 요약을 강조하며, 어떤 도구는 긴 문서를 아주 짧게 줄여준다고 말합니다. 하지만 좋은 AI 요약 도구를 고를 때 가장 먼저 봐야 할 것은 '얼마나 짧게 줄이는가'가 아닙니다. 내가 그 요약을 다시 검토하고, 수정하고, 다음 작업에 쓸 수 있는지가 더 중요합니다.",
        sections: [
          {
            heading: "AI 요약 도구를 고르기 전에 목적부터 정하기",
            paragraphs: [
              "요약 도구를 고르기 전에 먼저 이 자료를 왜 요약하려는지 정해야 합니다. 시험 공부를 위한 요약인지, 논문을 문헌리뷰에 쓰기 위한 요약인지, 회의자료를 액션아이템으로 바꾸기 위한 요약인지에 따라 필요한 기능이 달라집니다.",
              "목적이 없으면 가장 짧고 그럴듯한 요약이 좋아 보입니다. 하지만 중요한 자료일수록 짧은 문장보다 근거, 한계, 다시 확인할 부분이 더 필요합니다.",
            ],
          },
          {
            heading: "어떤 자료를 요약할 수 있는지 확인하기",
            paragraphs: [
              "AI 요약 도구마다 잘 다루는 자료가 다릅니다. 텍스트 입력에 강한 도구, PDF에 강한 도구, 영상 자막에 강한 도구, 회의록 정리에 강한 도구가 있습니다.",
              "내가 자주 다루는 자료가 논문인지, PDF 보고서인지, 유튜브 강의인지, 회의자료인지 먼저 확인해야 합니다. 자료 유형이 맞지 않으면 요약 품질이 좋아도 실제 업무에는 불편할 수 있습니다.",
            ],
          },
          {
            heading: "짧은 요약보다 중요한 원문 검토 가능성",
            paragraphs: [
              "AI 요약은 최종 답이 아니라 초안입니다. 특히 논문, 보고서, 계약서, 회의자료처럼 중요한 자료는 요약문만 보고 판단하면 위험할 수 있습니다.",
              "좋은 요약 도구는 핵심 문장만 보여주는 것이 아니라, 어떤 내용이 원문 어디에서 나왔는지 다시 확인할 수 있게 도와야 합니다. 원문 검토 흐름이 없는 요약은 빠르지만 불안정합니다.",
            ],
          },
          {
            heading: "요약 결과를 구조화할 수 있는가",
            paragraphs: [
              "요약문이 한 문단으로만 남으면 나중에 다시 쓰기 어렵습니다. 공부에는 개념과 복습 질문이 필요하고, 보고서에는 주장과 근거가 필요하며, 회의에는 결정사항과 액션아이템이 필요합니다.",
              "그래서 요약 결과를 핵심 질문, 주장, 근거, 예시, 한계, 다음 행동으로 나눌 수 있는지 봐야 합니다. 구조화가 가능해야 요약이 실제 작업 자료가 됩니다.",
            ],
          },
          {
            heading: "Brify가 구조화 요약에 맞는 이유",
            paragraphs: [
              "Brify는 긴 자료를 한 문단 요약으로 끝내기보다, 다시 검토 가능한 구조맵으로 바꾸는 흐름에 초점을 둡니다. 자료의 핵심 질문, 큰 주제, 근거, 한계, 다시 볼 부분을 나누어 볼 수 있습니다.",
              "AI 요약 도구를 고를 때 단순히 빠른 요약만 보지 말고, 요약 이후에 공부, 보고서, 회의로 이어질 수 있는지를 확인해보세요.",
            ],
          },
        ],
        shared: {
          heading: "AI 요약 결과를 그대로 믿으면 생기는 문제",
          paragraphs: [
            "AI가 만든 요약은 자연스럽게 읽히기 때문에 맞는 말처럼 느껴질 수 있습니다. 하지만 자연스러운 문장과 정확한 이해는 같은 것이 아닙니다. 중요한 결론이 빠지거나, 근거가 약한 내용이 강하게 표현되거나, 원문의 조건이 생략될 수 있습니다.",
            "따라서 좋은 AI 요약 도구는 요약을 빨리 만드는 도구이면서 동시에 사용자가 다시 확인할 수 있는 구조를 남겨야 합니다. Brify에서 구조맵을 쓰는 이유도 여기에 있습니다.",
          ],
        },
        closingHeading: "마무리",
        closing:
          "AI 요약 도구 추천을 찾고 있다면 먼저 순위보다 기준을 보세요. 지금 읽어야 하는 PDF나 논문 하나를 Brify에 넣어, 요약이 검토 가능한 구조로 남는지 확인해보는 것이 가장 현실적인 첫걸음입니다.",
      },
      {
        locale: "en",
        slug: "ai-summary-tool-recommendation-checklist",
        title: "AI Summary Tool Recommendation: 7 Criteria to Check First",
        excerpt:
          "Learn how to choose an AI summary tool by checking material type, source review, structure, editability, and reuse.",
        seo_keywords: [
          "AI summary tool recommendation",
          "best AI summarizer",
          "PDF summary tool",
          "document summary AI",
          "AI tool for organizing materials",
          "structured summary tool",
          "AI structure map",
          "Brify",
        ],
        intro:
          "Once you start searching for an AI summary tool, the choices quickly become overwhelming. Some tools focus on PDFs, some on YouTube or meeting notes, and others promise to make long documents extremely short. But the first question should not be how short the summary becomes. The better question is whether you can review, edit, and reuse the result in your next task.",
        sections: [
          {
            heading: "Start With the Purpose Before Choosing a Tool",
            paragraphs: [
              "Before choosing a summarizer, decide why you are summarizing the material. A study summary, a literature review summary, and a meeting action summary all need different features.",
              "Without a purpose, the shortest and smoothest summary looks attractive. But for important material, evidence, limitations, and points to verify matter more than shortness.",
            ],
          },
          {
            heading: "Check Which Material Types the Tool Handles Well",
            paragraphs: [
              "AI summary tools vary by material type. Some work best with pasted text, some with PDFs, some with video transcripts, and some with meeting notes.",
              "Start by checking whether your usual material is a paper, PDF report, YouTube lecture, or meeting document. A tool can produce good summaries and still be inconvenient if it does not match your source type.",
            ],
          },
          {
            heading: "Source Review Matters More Than a Short Summary",
            paragraphs: [
              "An AI summary is a draft, not a final answer. For papers, reports, contracts, and meeting materials, making decisions from the summary alone can be risky.",
              "A good tool should help you return to the source and check where the summary came from. A summary without a review workflow is fast, but not stable enough for serious use.",
            ],
          },
          {
            heading: "Can the Result Be Structured",
            paragraphs: [
              "If a summary remains as one paragraph, it is hard to reuse. Study needs concepts and review questions, reports need claims and evidence, and meetings need decisions and action items.",
              "Look for a tool that can separate the core question, claims, evidence, examples, limitations, and next actions. Structure is what turns a summary into working material.",
            ],
          },
          {
            heading: "Why Brify Fits Structured Summarization",
            paragraphs: [
              "Brify is built around turning long materials into reviewable structure maps, not just one short paragraph. It helps separate core questions, main topics, evidence, limitations, and items to revisit.",
              "When choosing an AI summary tool, do not only ask whether it summarizes quickly. Ask whether the result can support study, writing, and meetings afterward.",
            ],
          },
        ],
        shared: {
          heading: "The Risk of Trusting AI Summaries Too Quickly",
          paragraphs: [
            "AI summaries often read naturally, which makes them feel correct. But natural wording and accurate understanding are not the same thing. Important conclusions may be omitted, weak evidence may sound stronger than it is, and source conditions may disappear.",
            "A good AI summary tool should therefore create a fast draft while leaving a structure that users can review. That is why Brify focuses on structure maps.",
          ],
        },
        closingHeading: "Final Thoughts",
        closing:
          "If you are looking for an AI summary tool recommendation, start with criteria rather than rankings. Try one paper or PDF in Brify and see whether the result becomes a structure you can actually review.",
      },
      {
        locale: "fr",
        slug: "recommandation-outil-resume-ia",
        title: "Outil de résumé IA: 7 critères à vérifier avant de choisir",
        excerpt:
          "Découvrez comment choisir un outil de résumé IA selon le type de document, la vérification de la source, la structure, l'édition et la réutilisation.",
        seo_keywords: [
          "outil de résumé IA recommandé",
          "meilleur outil résumé IA",
          "outil résumé PDF",
          "IA résumé document",
          "outil IA organisation documents",
          "résumé structuré",
          "carte de structure IA",
          "Brify",
        ],
        intro:
          "Quand vous cherchez un outil de résumé IA, les options deviennent vite nombreuses. Certains outils mettent en avant les PDF, d'autres les vidéos YouTube ou les comptes rendus de réunion, et d'autres promettent de rendre un long document très court. Mais la première question n'est pas seulement la longueur du résumé. Il faut surtout savoir si vous pourrez vérifier, modifier et réutiliser le résultat.",
        sections: [
          {
            heading: "Commencer par l'objectif avant de choisir",
            paragraphs: [
              "Avant de choisir un outil, demandez-vous pourquoi vous résumez ce contenu. Un résumé pour étudier, pour une revue de littérature ou pour transformer une réunion en actions ne demande pas les mêmes fonctions.",
              "Sans objectif, le résumé le plus court et le plus fluide semble séduisant. Mais pour un contenu important, les preuves, les limites et les points à vérifier comptent davantage.",
            ],
          },
          {
            heading: "Vérifier les types de documents pris en charge",
            paragraphs: [
              "Les outils de résumé IA ne sont pas tous forts sur les mêmes formats. Certains fonctionnent mieux avec du texte copié, d'autres avec les PDF, les transcriptions vidéo ou les notes de réunion.",
              "Commencez par identifier vos documents habituels: article scientifique, rapport PDF, cours YouTube ou document de réunion. Un outil peut bien résumer tout en restant peu pratique s'il ne correspond pas à vos sources.",
            ],
          },
          {
            heading: "La vérification de la source compte plus qu'un résumé court",
            paragraphs: [
              "Un résumé IA est un brouillon, pas une réponse finale. Pour les articles, rapports, contrats ou réunions, décider uniquement à partir du résumé peut être risqué.",
              "Un bon outil doit aider à revenir à la source et à vérifier d'où vient chaque point. Un résumé sans flux de vérification est rapide, mais fragile pour un usage sérieux.",
            ],
          },
          {
            heading: "Le résultat peut-il être structuré",
            paragraphs: [
              "Si le résumé reste un seul paragraphe, il devient difficile à réutiliser. Pour étudier, il faut des concepts et des questions. Pour un rapport, il faut des affirmations et des preuves. Pour une réunion, il faut des décisions et des actions.",
              "Cherchez un outil capable de séparer question centrale, affirmations, preuves, exemples, limites et prochaines étapes. C'est la structure qui transforme un résumé en document de travail.",
            ],
          },
          {
            heading: "Pourquoi Brify convient au résumé structuré",
            paragraphs: [
              "Brify vise à transformer les longs contenus en cartes de structure vérifiables, pas seulement en paragraphes courts. Il aide à séparer les questions centrales, les grands thèmes, les preuves, les limites et les points à revoir.",
              "Lorsque vous choisissez un outil de résumé IA, ne demandez pas seulement s'il résume vite. Demandez si le résultat peut ensuite servir à étudier, rédiger ou préparer une réunion.",
            ],
          },
        ],
        shared: {
          heading: "Le risque de faire trop vite confiance aux résumés IA",
          paragraphs: [
            "Les résumés IA se lisent souvent naturellement, ce qui les rend convaincants. Mais une phrase fluide n'est pas forcément une compréhension correcte. Une conclusion importante peut manquer, une preuve faible peut sembler forte, et les conditions de la source peuvent disparaître.",
            "Un bon outil doit donc produire un brouillon rapide tout en laissant une structure que l'utilisateur peut vérifier. C'est pour cette raison que Brify met l'accent sur les cartes de structure.",
          ],
        },
        closingHeading: "Pour conclure",
        closing:
          "Si vous cherchez une recommandation d'outil de résumé IA, commencez par les critères plutôt que par les classements. Essayez un article ou un PDF dans Brify et regardez si le résultat devient une structure réellement vérifiable.",
      },
    ],
  },
  {
    key: "paper-comparison",
    locales: [
      {
        locale: "ko",
        slug: "paper-summary-tool-comparison",
        title: "논문 요약 툴 비교: 단순 요약보다 중요한 선택 기준",
        excerpt:
          "논문 요약 툴을 비교할 때 연구 질문, 방법론, 결과, 한계, 인용 검토까지 함께 봐야 하는 이유를 설명합니다.",
        seo_keywords: [
          "논문 요약 툴 비교",
          "AI 논문 요약 도구",
          "논문 요약 사이트 비교",
          "논문 정리 툴",
          "대학원생 논문 요약 도구",
          "논문 구조화",
          "문헌리뷰 도구",
          "Brify",
        ],
        intro:
          "논문 요약 툴을 고를 때 단순히 결론을 빨리 알려주는지만 보면 부족합니다. 논문은 일반 문서보다 구조가 중요합니다. 연구 질문이 무엇인지, 어떤 방법으로 검증했는지, 결과가 무엇인지, 한계가 어디에 있는지, 문헌리뷰에 인용해도 되는지까지 확인해야 합니다.",
        sections: [
          {
            heading: "논문 요약은 일반 문서 요약과 다르다",
            paragraphs: [
              "일반 문서 요약은 핵심 내용을 짧게 줄이면 어느 정도 목적을 달성할 수 있습니다. 하지만 논문 요약은 연구의 구조를 이해해야 합니다.",
              "논문에서 중요한 것은 결론만이 아닙니다. 연구 질문, 선행연구와의 관계, 방법론, 데이터, 결과, 한계가 함께 보여야 실제 학습이나 연구에 쓸 수 있습니다.",
            ],
          },
          {
            heading: "초록 요약만 잘해도 충분할까",
            paragraphs: [
              "초록은 논문의 압축된 소개이지만, 초록만으로 논문 전체를 이해했다고 보기는 어렵습니다. 방법론의 조건, 실험의 범위, 한계는 본문에서 더 자세히 확인해야 합니다.",
              "따라서 논문 요약 툴을 비교할 때는 초록을 자연스럽게 줄이는 능력보다 본문 구조를 분리해주는 능력이 더 중요합니다.",
            ],
          },
          {
            heading: "연구 질문, 방법론, 결과를 분리할 수 있는가",
            paragraphs: [
              "좋은 논문 요약 도구는 연구 질문과 방법론과 결과를 분리해서 보여줘야 합니다. 이 세 가지가 섞이면 논문을 인용하거나 비교할 때 혼란이 생깁니다.",
              "특히 문헌리뷰를 준비한다면 각 논문이 어떤 질문에 답했고, 어떤 방법으로 확인했고, 어떤 결과를 냈는지 표처럼 정리할 수 있어야 합니다.",
            ],
          },
          {
            heading: "한계와 추가 검토 지점을 표시할 수 있는가",
            paragraphs: [
              "논문 요약에서 한계를 놓치면 연구 결과를 과장해서 이해할 수 있습니다. 표본, 실험 조건, 데이터 범위, 후속 연구 제안은 따로 표시하는 것이 좋습니다.",
              "AI가 만든 요약이 자연스러워 보여도 한계가 생략되면 문헌리뷰나 보고서에서 위험합니다. 반드시 원문 검토 지점이 남아야 합니다.",
            ],
          },
          {
            heading: "Brify로 논문을 구조맵으로 정리하는 방식",
            paragraphs: [
              "Brify에서는 논문을 연구 질문, 핵심 주장, 방법론, 결과, 한계, 인용 후보로 나누어 구조맵으로 볼 수 있습니다. 결론만 보는 방식보다 문헌리뷰에 옮기기 쉽습니다.",
              "논문 요약 툴을 비교할 때는 빠른 요약보다, 나중에 원문을 확인하고 다른 논문과 비교할 수 있는 구조가 남는지 확인해보세요.",
            ],
          },
        ],
        shared: {
          heading: "논문 요약 툴 비교 체크리스트",
          paragraphs: [
            "논문 요약 도구를 고를 때는 다섯 가지를 확인하세요. 연구 질문을 분리하는가, 방법론과 데이터 조건을 보여주는가, 결과와 해석을 구분하는가, 한계와 추가 검토 지점을 남기는가, 문헌리뷰나 인용 정리에 다시 쓸 수 있는가.",
            "이 기준을 통과하지 못하면 요약이 빠르더라도 연구 작업에는 부족할 수 있습니다. 논문은 짧게 읽는 것보다 정확하게 검토하는 흐름이 중요합니다.",
          ],
        },
        closingHeading: "마무리",
        closing:
          "논문 요약 툴 비교에서 중요한 것은 가장 예쁜 요약문이 아닙니다. Brify처럼 연구 질문, 근거, 방법론, 한계를 따로 확인할 수 있는 구조를 남기는지가 더 중요합니다.",
      },
      {
        locale: "en",
        slug: "paper-summary-tool-comparison",
        title: "Paper Summary Tool Comparison: What Matters Beyond a Short Summary",
        excerpt:
          "Learn how to compare paper summary tools by research question, method, results, limitations, citation review, and literature review use.",
        seo_keywords: [
          "paper summary tool comparison",
          "AI paper summary tool",
          "research paper summarizer comparison",
          "paper organization tool",
          "graduate student paper summary tool",
          "paper structuring",
          "literature review tool",
          "Brify",
        ],
        intro:
          "When choosing a paper summary tool, it is not enough to ask whether it can show the conclusion quickly. Academic papers depend on structure. You need to see the research question, method, results, limitations, and whether the paper can actually be used in a literature review.",
        sections: [
          {
            heading: "Paper Summaries Are Different From General Summaries",
            paragraphs: [
              "A general document summary can often succeed by shortening the main points. A paper summary has to preserve the research structure.",
              "The conclusion is only one part of the paper. Research question, relation to prior work, methodology, data, results, and limitations all need to remain visible for study or research use.",
            ],
          },
          {
            heading: "Is Abstract Summarization Enough",
            paragraphs: [
              "The abstract is a compressed introduction, but it is not the whole paper. Method conditions, experiment scope, and limitations often require checking the main body.",
              "That is why paper summary tools should be compared by how well they separate the paper structure, not only by how smoothly they shorten the abstract.",
            ],
          },
          {
            heading: "Can It Separate Question, Method, and Results",
            paragraphs: [
              "A useful paper summary tool should separate the research question, methodology, and results. If these are mixed together, citing or comparing the paper becomes confusing.",
              "For literature reviews, you need to know what each paper asked, how it tested the question, and what it found. That structure is more valuable than a polished paragraph.",
            ],
          },
          {
            heading: "Can It Mark Limitations and Review Points",
            paragraphs: [
              "If a summary misses limitations, the results may sound stronger than they are. Sample size, experimental conditions, data scope, and future work should be kept visible.",
              "Even when an AI summary sounds natural, missing limitations can create problems in a literature review or report. The tool should leave points that need source review.",
            ],
          },
          {
            heading: "How Brify Structures Papers",
            paragraphs: [
              "In Brify, a paper can be organized into a structure map with research question, key claim, method, result, limitation, and citation candidate nodes. This is easier to transfer into a literature review than a conclusion-only summary.",
              "When comparing paper summary tools, look for whether the tool leaves a structure you can review against the original source and compare with other papers later.",
            ],
          },
        ],
        shared: {
          heading: "Paper Summary Tool Comparison Checklist",
          paragraphs: [
            "Check five things when choosing a paper summary tool: does it separate the research question, show method and data conditions, distinguish results from interpretation, preserve limitations and review points, and support later literature review or citation work?",
            "If a tool fails these criteria, it may still be fast but not strong enough for research work. Papers need a review workflow, not just a shorter version.",
          ],
        },
        closingHeading: "Final Thoughts",
        closing:
          "The most important part of comparing paper summary tools is not the prettiest summary. What matters is whether the tool, like Brify, leaves research questions, evidence, methods, and limitations in a structure you can verify.",
      },
      {
        locale: "fr",
        slug: "comparatif-outils-resume-article-scientifique",
        title: "Comparatif d'outils de résumé d'article scientifique: les vrais critères",
        excerpt:
          "Comparez les outils de résumé d'articles scientifiques selon la question de recherche, la méthode, les résultats, les limites et l'usage en revue de littérature.",
        seo_keywords: [
          "comparatif outil résumé article scientifique",
          "outil IA résumé article scientifique",
          "comparaison résumé papier de recherche",
          "outil organisation article scientifique",
          "outil résumé pour doctorants",
          "structuration article scientifique",
          "outil revue de littérature",
          "Brify",
        ],
        intro:
          "Pour choisir un outil de résumé d'article scientifique, il ne suffit pas de regarder s'il donne vite la conclusion. Un article scientifique repose sur une structure. Il faut voir la question de recherche, la méthode, les résultats, les limites et la possibilité d'utiliser l'article dans une revue de littérature.",
        sections: [
          {
            heading: "Le résumé d'article scientifique est différent d'un résumé classique",
            paragraphs: [
              "Un résumé de document général peut souvent réussir en raccourcissant les points principaux. Un résumé d'article doit préserver la structure de recherche.",
              "La conclusion n'est qu'une partie. Question de recherche, lien avec les travaux précédents, méthodologie, données, résultats et limites doivent rester visibles pour l'étude ou la recherche.",
            ],
          },
          {
            heading: "Résumer l'abstract suffit-il",
            paragraphs: [
              "L'abstract est une introduction compressée, mais il ne remplace pas l'article complet. Les conditions de méthode, le périmètre de l'expérience et les limites demandent souvent une lecture du corps du texte.",
              "C'est pourquoi il faut comparer les outils selon leur capacité à séparer la structure de l'article, pas seulement selon la fluidité du résumé de l'abstract.",
            ],
          },
          {
            heading: "Sépare-t-il question, méthode et résultats",
            paragraphs: [
              "Un bon outil doit distinguer question de recherche, méthodologie et résultats. Si ces éléments sont mélangés, citer ou comparer l'article devient difficile.",
              "Pour une revue de littérature, vous devez savoir quelle question chaque article pose, comment il la teste et ce qu'il trouve. Cette structure vaut plus qu'un paragraphe élégant.",
            ],
          },
          {
            heading: "Marque-t-il les limites et les points à vérifier",
            paragraphs: [
              "Si un résumé oublie les limites, les résultats peuvent sembler plus forts qu'ils ne le sont. Taille d'échantillon, conditions expérimentales, périmètre des données et pistes futures doivent rester visibles.",
              "Même si un résumé IA semble naturel, l'absence de limites peut poser problème dans une revue de littérature ou un rapport. L'outil doit laisser des points de vérification.",
            ],
          },
          {
            heading: "Comment Brify structure les articles",
            paragraphs: [
              "Dans Brify, un article peut être organisé en carte de structure avec question de recherche, affirmation clé, méthode, résultat, limite et candidat à la citation. C'est plus facile à transférer vers une revue de littérature qu'un résumé centré sur la conclusion.",
              "Quand vous comparez les outils, vérifiez s'ils laissent une structure que vous pouvez relire dans la source et comparer avec d'autres articles.",
            ],
          },
        ],
        shared: {
          heading: "Checklist de comparaison",
          paragraphs: [
            "Vérifiez cinq éléments: l'outil sépare-t-il la question de recherche, montre-t-il méthode et conditions de données, distingue-t-il résultats et interprétation, garde-t-il les limites et points à vérifier, aide-t-il la revue de littérature ou les citations ?",
            "Si ces critères ne sont pas remplis, l'outil peut être rapide mais insuffisant pour un travail de recherche. Un article demande un flux de vérification, pas seulement une version plus courte.",
          ],
        },
        closingHeading: "Pour conclure",
        closing:
          "Dans un comparatif d'outils de résumé d'article scientifique, le plus important n'est pas le résumé le plus élégant. Ce qui compte, c'est de garder question, preuves, méthode et limites dans une structure vérifiable, comme dans Brify.",
      },
    ],
  },
  {
    key: "use-case",
    locales: [
      {
        locale: "ko",
        slug: "choose-ai-summary-tool-by-use-case",
        title: "AI 요약 도구, 목적별로 어떻게 골라야 할까",
        excerpt:
          "공부, 논문, PDF 보고서, 유튜브 강의, 회의자료처럼 사용 목적별로 AI 요약 도구를 고르는 기준을 설명합니다.",
        seo_keywords: [
          "AI 요약 도구 추천",
          "AI 요약 도구 비교",
          "공부 요약 도구",
          "보고서 요약 AI",
          "회의자료 요약 도구",
          "논문 요약 툴 비교",
          "유튜브 요약 도구",
          "Brify",
        ],
        intro:
          "AI 요약 도구에는 하나의 정답이 없습니다. 공부할 때 좋은 도구와 논문을 정리할 때 좋은 도구, 회의자료를 정리할 때 좋은 도구는 다를 수 있습니다. 그래서 도구를 고를 때는 '가장 유명한가'보다 '내 자료가 어떤 작업으로 이어지는가'를 먼저 봐야 합니다.",
        sections: [
          {
            heading: "모든 AI 요약 도구가 같은 문제를 해결하지 않는다",
            paragraphs: [
              "어떤 도구는 긴 글을 빠르게 줄이는 데 강하고, 어떤 도구는 PDF나 영상처럼 특정 형식에 강합니다. 또 어떤 도구는 요약 이후의 정리와 재사용에 더 강합니다.",
              "따라서 하나의 도구를 모든 상황에 무리하게 쓰기보다, 내가 자주 다루는 자료와 결과물을 기준으로 판단하는 것이 좋습니다.",
            ],
          },
          {
            heading: "공부용 요약 도구를 고를 때",
            paragraphs: [
              "공부용 요약 도구는 핵심 개념을 짧게 보여주는 것만으로는 부족합니다. 복습 질문, 헷갈리는 개념, 예시, 시험에 나올 수 있는 연결 관계가 함께 보여야 합니다.",
              "특히 강의 노트나 교재를 정리할 때는 단순 요약보다 나중에 다시 떠올릴 수 있는 구조가 중요합니다.",
            ],
          },
          {
            heading: "논문 요약 도구를 고를 때",
            paragraphs: [
              "논문 요약 도구는 연구 질문, 방법론, 결과, 한계를 분리해야 합니다. 결론만 빨리 보는 도구는 처음 훑어보기에는 좋지만 문헌리뷰에는 부족할 수 있습니다.",
              "논문은 인용과 검토가 필요하기 때문에 원문 확인 흐름이 있는지도 중요합니다.",
            ],
          },
          {
            heading: "PDF 보고서와 유튜브 강의 요약 도구를 고를 때",
            paragraphs: [
              "PDF 보고서는 결론, 근거, 표와 그림, 조건을 분리해주는 도구가 좋습니다. 보고서 요약은 나중에 의사결정이나 글쓰기에 쓰일 가능성이 높기 때문입니다.",
              "유튜브나 강의 영상은 타임라인, 핵심 개념, 다시 볼 구간이 중요합니다. 영상 요약은 짧은 문단보다 구간별 구조가 더 유용할 때가 많습니다.",
            ],
          },
          {
            heading: "Brify가 여러 자료 유형에 맞는 이유",
            paragraphs: [
              "Brify는 자료를 한 문단으로 줄이는 것보다, 결과를 구조맵으로 남기는 데 초점을 둡니다. 그래서 공부, 논문, PDF, 회의자료처럼 서로 다른 목적에서도 재사용 가능한 구조를 만들 수 있습니다.",
              "AI 요약 도구를 고르기 어렵다면 지금 가장 급한 자료 하나를 기준으로 시작하세요. 그 자료가 다음 작업으로 이어지는지 보면 선택이 더 쉬워집니다.",
            ],
          },
        ],
        shared: {
          heading: "회의자료 요약 도구를 고를 때",
          paragraphs: [
            "회의자료나 회의록은 전체 내용을 줄이는 것보다 결정사항, 보류된 쟁점, 담당자, 기한, 액션아이템을 분리하는 것이 중요합니다. 회의 요약이 실행으로 이어지지 않으면 정리의 의미가 약해집니다.",
            "따라서 회의자료용 도구는 요약문보다 실행 구조를 남길 수 있어야 합니다. Brify의 구조맵은 이런 흐름에 맞게 회의 내용을 다시 정리하는 데 쓸 수 있습니다.",
          ],
        },
        closingHeading: "마무리",
        closing:
          "AI 요약 도구 추천을 볼 때는 내 목적을 먼저 정하세요. 공부에는 복습 질문, 논문에는 연구 구조, 보고서에는 근거, 회의에는 액션아이템이 필요합니다. Brify에서 자료 하나를 구조맵으로 바꿔보면 어떤 요약 방식이 나에게 맞는지 더 빨리 알 수 있습니다.",
      },
      {
        locale: "en",
        slug: "choose-ai-summary-tool-by-use-case",
        title: "How to Choose an AI Summary Tool by Use Case",
        excerpt:
          "Learn how to choose an AI summary tool for studying, papers, PDF reports, YouTube lectures, and meeting materials.",
        seo_keywords: [
          "AI summary tool recommendation",
          "AI summary tool comparison",
          "study summary tool",
          "report summary AI",
          "meeting notes summarizer",
          "paper summary tool comparison",
          "YouTube summary tool",
          "Brify",
        ],
        intro:
          "There is no single correct AI summary tool for every situation. A tool that works well for studying may not be the best tool for papers, and a meeting summary tool may need a different structure again. Instead of asking which tool is most famous, ask what your material needs to become next.",
        sections: [
          {
            heading: "Not Every AI Summary Tool Solves the Same Problem",
            paragraphs: [
              "Some tools are strong at shortening long text, some are built around PDFs or videos, and some are better at organizing and reusing the result.",
              "Rather than forcing one tool into every situation, judge tools by the materials you handle most often and the output you need afterward.",
            ],
          },
          {
            heading: "For Studying",
            paragraphs: [
              "A study summary tool should do more than show key points. It should help you create review questions, identify confusing concepts, keep examples, and see relationships that may appear in exams.",
              "For lecture notes and textbooks, a structure you can recall later is more useful than a short summary that feels clean only once.",
            ],
          },
          {
            heading: "For Papers",
            paragraphs: [
              "A paper summary tool should separate research question, method, results, and limitations. A conclusion-only tool can be helpful for a quick scan, but it may not be enough for a literature review.",
              "Because papers require citation and verification, the ability to return to the original source is also important.",
            ],
          },
          {
            heading: "For PDF Reports and YouTube Lectures",
            paragraphs: [
              "For PDF reports, look for tools that separate conclusion, evidence, tables, figures, and conditions. Report summaries often become inputs for decisions or writing.",
              "For YouTube lectures, timeline, key concepts, and sections to revisit matter more than a short paragraph. Video summaries are often more useful when organized by segment.",
            ],
          },
          {
            heading: "Why Brify Works Across Material Types",
            paragraphs: [
              "Brify focuses on leaving a structure map rather than only shortening the material. That makes it useful across study materials, papers, PDFs, and meeting documents because the result can be reused.",
              "If choosing feels difficult, start with the most urgent material you have. When you see whether the result can move into your next task, the right summary style becomes clearer.",
            ],
          },
        ],
        shared: {
          heading: "For Meeting Materials",
          paragraphs: [
            "Meeting materials and meeting notes need decisions, open issues, owners, deadlines, and action items more than a shortened transcript. If the summary does not support execution, its value is limited.",
            "A meeting-focused tool should leave an action structure, not just a readable paragraph. Brify structure maps can help reorganize meeting content into that workflow.",
          ],
        },
        closingHeading: "Final Thoughts",
        closing:
          "When looking for AI summary tool recommendations, define your use case first. Study needs review questions, papers need research structure, reports need evidence, and meetings need action items. Trying one material in Brify can quickly show which summary style fits your work.",
      },
      {
        locale: "fr",
        slug: "choisir-outil-resume-ia-selon-usage",
        title: "Comment choisir un outil de résumé IA selon votre usage",
        excerpt:
          "Apprenez à choisir un outil de résumé IA pour étudier, résumer des articles, des rapports PDF, des vidéos YouTube ou des documents de réunion.",
        seo_keywords: [
          "outil de résumé IA recommandé",
          "comparaison outil résumé IA",
          "outil résumé études",
          "IA résumé rapport",
          "outil résumé réunion",
          "comparatif outil résumé article scientifique",
          "outil résumé YouTube",
          "Brify",
        ],
        intro:
          "Il n'existe pas un seul outil de résumé IA idéal pour tous les cas. Un outil utile pour étudier peut ne pas convenir aux articles scientifiques, et un outil pour les réunions doit encore suivre une autre logique. Au lieu de demander quel outil est le plus connu, demandez ce que votre document doit devenir ensuite.",
        sections: [
          {
            heading: "Tous les outils ne résolvent pas le même problème",
            paragraphs: [
              "Certains outils sont forts pour raccourcir un texte long, d'autres pour les PDF ou les vidéos, et d'autres pour organiser et réutiliser le résultat.",
              "Plutôt que de forcer un outil dans toutes les situations, évaluez-le selon les documents que vous traitez souvent et le résultat dont vous avez besoin après le résumé.",
            ],
          },
          {
            heading: "Pour étudier",
            paragraphs: [
              "Un outil de résumé pour étudier doit faire plus que montrer les points clés. Il doit aider à créer des questions de révision, repérer les concepts confus, garder les exemples et montrer les relations importantes.",
              "Pour des notes de cours ou un manuel, une structure que l'on peut se rappeler plus tard est plus utile qu'un résumé court et propre à la première lecture.",
            ],
          },
          {
            heading: "Pour les articles scientifiques",
            paragraphs: [
              "Un outil de résumé d'article doit séparer question de recherche, méthode, résultats et limites. Un outil centré sur la conclusion peut aider pour un premier survol, mais il est souvent insuffisant pour une revue de littérature.",
              "Comme les articles demandent citations et vérification, la possibilité de revenir à la source originale est également importante.",
            ],
          },
          {
            heading: "Pour les rapports PDF et les cours YouTube",
            paragraphs: [
              "Pour les rapports PDF, cherchez un outil qui sépare conclusion, preuves, tableaux, figures et conditions. Les résumés de rapports deviennent souvent des entrées pour décider ou rédiger.",
              "Pour les cours YouTube, la timeline, les concepts clés et les passages à revoir comptent plus qu'un court paragraphe. Les résumés vidéo sont souvent plus utiles par segment.",
            ],
          },
          {
            heading: "Pourquoi Brify fonctionne avec plusieurs types de contenu",
            paragraphs: [
              "Brify met l'accent sur une carte de structure plutôt que sur un simple raccourcissement du contenu. Cela le rend utile pour les cours, articles, PDF et documents de réunion, car le résultat peut être réutilisé.",
              "Si le choix est difficile, commencez par le document le plus urgent. En voyant si le résultat peut passer à votre prochaine tâche, le bon style de résumé devient plus clair.",
            ],
          },
        ],
        shared: {
          heading: "Pour les documents de réunion",
          paragraphs: [
            "Les documents et notes de réunion demandent surtout décisions, points ouverts, responsables, échéances et actions. Un résumé qui ne soutient pas l'exécution a une valeur limitée.",
            "Un outil adapté aux réunions doit laisser une structure d'action, pas seulement un paragraphe lisible. Les cartes de structure Brify peuvent aider à réorganiser le contenu de réunion dans ce flux.",
          ],
        },
        closingHeading: "Pour conclure",
        closing:
          "Quand vous cherchez une recommandation d'outil de résumé IA, définissez d'abord votre usage. Les études demandent des questions, les articles une structure de recherche, les rapports des preuves et les réunions des actions. Tester un document dans Brify permet de voir rapidement quel style de résumé convient à votre travail.",
      },
    ],
  },
];

async function getExistingPost(locale, slug) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,translation_group_id")
    .eq("locale", locale)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

const results = [];

for (const group of posts) {
  const existingGroups = [];
  for (const post of group.locales) {
    const existing = await getExistingPost(post.locale, post.slug);
    post.existing = existing;
    if (existing?.translation_group_id) existingGroups.push(existing.translation_group_id);
  }
  const translationGroupId = existingGroups[0] ?? randomUUID();

  for (const post of group.locales) {
    const payload = {
      locale: post.locale,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      seo_keywords: Array.from(new Set(post.seo_keywords)),
      image_url: imageUrl,
      markdown: buildMarkdown(post),
      status: "draft",
      published_at: null,
      translation_group_id: translationGroupId,
    };

    if (post.existing?.id) {
      const { data, error } = await supabase
        .from("blog_posts")
        .update(payload)
        .eq("id", post.existing.id)
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
}

const summary = results.reduce((acc, post) => {
  acc[post.locale] = (acc[post.locale] ?? 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({ count: results.length, summary, results }, null, 2));
