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
  "시장조사 보고서 정리",
  "회의자료 구조화",
  "실무 리서치 자료 정리",
  "경쟁사 분석 정리",
  "회의 결정사항 정리",
  "업무 자료 구조화",
  "AI 구조맵",
  "Brify",
];

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## Brify에서 실무 자료를 의사결정 구조로 바꾸기",
    `${post.title}에서 중요한 것은 자료를 짧게 만드는 것이 아니라, 다음 판단과 행동으로 이어질 수 있게 정리하는 것입니다. 시장조사 보고서, 경쟁사 분석, 고객 인사이트, 회의자료는 모두 읽기 위한 자료이면서 동시에 결정을 위한 자료입니다.`,
    "Brify에서는 업무 자료를 '핵심 질문', '시장/고객/경쟁 정보', '근거 데이터', '해석', '쟁점', '결정사항', '액션아이템', '담당자와 기한'으로 나누어 구조맵으로 정리할 수 있습니다. 이렇게 하면 보고서 요약과 회의록이 따로 흩어지지 않고 하나의 실행 흐름으로 이어집니다.",
    "특히 실무에서는 정보가 많을수록 결론이 흐려질 때가 많습니다. 숫자, 고객 발언, 경쟁사 기능, 회의 의견을 모두 같은 문단에 넣으면 무엇이 사실이고 무엇이 해석이며 무엇을 해야 하는지 구분하기 어렵습니다.",
    "## 이런 경우에는 구조맵이 더 필요합니다",
    "첫째, 시장조사 보고서를 읽었지만 우리 제품이나 프로젝트에 어떤 의미인지 정리되지 않을 때입니다. 둘째, 회의자료는 많지만 회의에서 무엇을 결정해야 하는지 불분명할 때입니다. 셋째, 회의 후 긴 회의록은 있는데 담당자와 다음 행동이 명확하지 않을 때입니다.",
    "넷째, 리서치 결과와 회의 결정이 따로 저장되어 실행계획으로 이어지지 않을 때입니다. 이때 필요한 것은 더 긴 요약이 아니라, 인사이트와 결정사항과 액션아이템이 연결된 구조입니다.",
    "## 실무 체크리스트",
    `오늘 ${post.seo_keywords[0]}를 한다면 네 가지를 확인해보세요. 이 자료가 어떤 의사결정 질문에 답하는가, 핵심 근거와 해석이 분리되어 있는가, 회의에서 결정해야 할 쟁점이 보이는가, 다음 행동과 담당자까지 연결되는가.`,
    "이 네 가지가 보이지 않으면 자료는 정리된 것처럼 보여도 실행 가능한 상태는 아닙니다. Brify에서 구조맵으로 바꾸면 리서치, 회의, 실행계획을 한 흐름으로 관리할 수 있습니다.",
    "## 마무리",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    slug: "organize-market-research-report",
    title: "시장조사 보고서 정리, 핵심만 남기는 법",
    excerpt:
      "시장조사 보고서를 정리할 때 시장 규모, 고객군, 경쟁 구도, 성장 요인, 리스크, 실행 가설을 나누어 보는 방법을 설명합니다.",
    seo_keywords: ["시장조사 보고서 정리", "시장조사 자료 정리", "리서치 보고서 정리", "시장분석 보고서 요약", ...commonKeywords],
    intro:
      "시장조사 보고서는 보통 숫자, 그래프, 산업 동향, 고객 세그먼트, 경쟁사 정보가 한꺼번에 들어 있습니다. 다 읽고 나서도 '그래서 우리에게 중요한 것은 무엇인가'가 남지 않는다면 정리는 아직 끝난 것이 아닙니다. 시장조사 보고서 정리는 내용을 짧게 줄이는 일이 아니라, 의사결정에 필요한 구조로 바꾸는 일입니다.",
    sections: [
      {
        heading: "시장조사 보고서가 길고 어려운 이유",
        paragraphs: [
          "시장조사 보고서는 정보량이 많고, 같은 자료 안에서도 거시 시장, 고객 행동, 경쟁 구도, 기술 변화가 함께 다뤄집니다. 그래서 순서대로 읽으면 이해는 되지만 실제 업무 판단으로 옮기기 어렵습니다.",
          "특히 보고서에 나온 수치를 그대로 옮겨 적는 것만으로는 부족합니다. 그 숫자가 시장 진입, 가격, 기능 우선순위, 마케팅 메시지 중 어떤 판단에 필요한지 따로 정리해야 합니다.",
        ],
      },
      {
        heading: "먼저 의사결정 질문을 정하기",
        paragraphs: [
          "시장조사 보고서를 읽기 전에 이번 자료가 어떤 질문에 답해야 하는지 정해야 합니다. 예를 들어 '이 시장에 들어갈 만한가', '어떤 고객군을 먼저 잡아야 하는가', '경쟁사 대비 어떤 메시지를 써야 하는가'처럼 질문이 있어야 합니다.",
          "질문이 없으면 모든 차트와 문장이 중요해 보입니다. 질문이 있으면 필요한 데이터와 배경 설명을 구분할 수 있습니다.",
        ],
      },
      {
        heading: "시장 규모, 고객, 경쟁, 리스크로 나누기",
        paragraphs: [
          "시장조사 보고서는 시장 규모, 성장 요인, 고객군, 경쟁사, 규제나 리스크, 실행 기회로 나누어 보는 것이 좋습니다. 이 기준을 잡으면 긴 보고서도 업무 판단에 필요한 단위로 쪼개집니다.",
          "예를 들어 시장 규모는 기회 판단에, 고객군은 초기 타겟 선정에, 경쟁 구도는 차별화 전략에, 리스크는 실행 우선순위 조정에 연결됩니다.",
        ],
      },
      {
        heading: "데이터와 해석을 분리하기",
        paragraphs: [
          "보고서에 있는 숫자와 그 숫자에 대한 해석은 분리해야 합니다. 성장률 20퍼센트라는 데이터와 '이 시장은 진입하기 좋다'는 해석은 같은 것이 아닙니다.",
          "데이터를 근거로 남기고, 그 옆에 우리 팀의 해석과 가설을 따로 적어두면 나중에 회의에서 논쟁이 생겨도 무엇이 사실이고 무엇이 판단인지 구분할 수 있습니다.",
        ],
      },
      {
        heading: "Brify로 시장조사 구조맵 만들기",
        paragraphs: [
          "Brify에서는 시장조사 보고서를 시장, 고객, 경쟁, 리스크, 실행 가설로 나누어 구조맵으로 정리할 수 있습니다. 단순 요약문보다 의사결정에 필요한 흐름이 더 잘 보입니다.",
          "회의 전에 이 구조맵을 공유하면 팀원들이 같은 자료를 읽고도 서로 다른 해석을 하는 지점을 빠르게 확인할 수 있습니다.",
        ],
      },
    ],
    closing:
      "시장조사 보고서 정리의 목적은 더 짧은 보고서를 만드는 것이 아닙니다. Brify에서 시장, 고객, 경쟁, 리스크, 실행 가설을 연결해 다음 판단으로 이어지는 구조를 만들어보세요.",
  },
  {
    slug: "organize-competitor-analysis",
    title: "경쟁사 분석 자료를 정리하는 방법",
    excerpt:
      "경쟁사 분석 자료는 기능, 가격, 고객군, 메시지, 강점, 약점, 차별화 기회 기준으로 정리해야 실행에 도움이 됩니다.",
    seo_keywords: ["경쟁사 분석 정리", "경쟁사 조사 정리", "경쟁사 비교표", "시장조사 경쟁사 분석", ...commonKeywords],
    intro:
      "경쟁사 분석을 시작하면 금방 링크가 쌓입니다. 웹사이트, 가격표, 기능 소개, 고객 리뷰, 광고 문구, 투자 기사까지 모으다 보면 자료는 많아지지만 결론은 흐려질 수 있습니다. 경쟁사 분석 정리는 경쟁사 목록을 만드는 일이 아니라, 우리 제품이나 서비스의 선택 기준과 차별화 가설을 찾는 일입니다.",
    sections: [
      {
        heading: "경쟁사 자료가 금방 복잡해지는 이유",
        paragraphs: [
          "경쟁사 자료는 형식이 제각각입니다. 어떤 자료는 기능 중심이고, 어떤 자료는 가격 중심이며, 어떤 자료는 고객 후기나 브랜드 메시지 중심입니다.",
          "이 자료를 단순히 경쟁사별로만 모으면 비교가 어렵습니다. 비교 기준이 먼저 정리되어야 자료가 의미를 갖습니다.",
        ],
      },
      {
        heading: "비교 기준을 먼저 정해야 하는 이유",
        paragraphs: [
          "모든 기능과 가격을 다 비교하려고 하면 표는 커지지만 결론은 약해집니다. 먼저 우리에게 중요한 비교 기준을 정해야 합니다.",
          "예를 들어 초기 고객에게 중요한 기준이 가격인지, 사용 편의성인지, 협업 기능인지, 보안인지에 따라 경쟁사 분석의 초점이 달라집니다.",
        ],
      },
      {
        heading: "기능, 가격, 고객군, 메시지로 나누기",
        paragraphs: [
          "경쟁사 자료는 기능, 가격, 고객군, 핵심 메시지, 강점, 약점, 리뷰에서 반복되는 불만으로 나누어 정리하면 좋습니다. 이렇게 하면 단순 정보 수집을 넘어 패턴이 보입니다.",
          "특히 고객군과 메시지는 기능표보다 더 중요할 때가 많습니다. 같은 기능을 갖고 있어도 누구에게 어떤 문제 해결로 말하는지에 따라 시장 포지션이 달라집니다.",
        ],
      },
      {
        heading: "강점과 약점을 실행 가설로 바꾸기",
        paragraphs: [
          "경쟁사의 약점을 찾는 것에서 끝나면 분석은 실행으로 이어지지 않습니다. 그 약점이 우리에게 기회인지, 아니면 시장 전체의 어려움인지 구분해야 합니다.",
          "예를 들어 경쟁사 리뷰에서 '설정이 어렵다'는 불만이 반복된다면, 우리 제품의 온보딩 메시지나 첫 사용 경험을 개선할 가설로 바꿀 수 있습니다.",
        ],
      },
      {
        heading: "Brify로 경쟁사 비교 구조 만들기",
        paragraphs: [
          "Brify에서는 경쟁사별 노드와 비교 기준별 노드를 함께 만들 수 있습니다. 기능, 가격, 고객, 메시지, 리뷰 불만, 차별화 기회를 연결하면 결론이 더 선명해집니다.",
          "이 구조맵은 제품 회의, 마케팅 메시지 검토, 가격 전략 논의에서 그대로 다시 쓸 수 있습니다.",
        ],
      },
    ],
    closing:
      "경쟁사 분석은 많이 아는 것이 아니라 무엇을 다르게 할지 찾는 과정입니다. Brify에서 비교 기준과 차별화 가설을 함께 정리해보세요.",
  },
  {
    slug: "organize-customer-insights",
    title: "고객 인사이트 자료를 제품·마케팅 결정으로 바꾸는 법",
    excerpt:
      "고객 인사이트 자료는 고객군, 문제, 반복 표현, 구매 이유, 이탈 이유, 제품 개선 가설로 나누어야 실행에 연결됩니다.",
    seo_keywords: ["고객 인사이트 정리", "고객 인터뷰 정리", "설문조사 결과 정리", "고객 리뷰 분석", ...commonKeywords],
    intro:
      "고객 인터뷰, 설문 응답, 앱 리뷰, 고객 문의, 영업 미팅 메모는 모두 중요한 자료입니다. 하지만 형식이 제각각이라 한 곳에 모아도 바로 제품 결정이나 마케팅 메시지로 이어지지 않을 때가 많습니다. 고객 인사이트 정리는 예쁜 요약보다 반복되는 문제와 실행 가능한 가설을 찾는 일입니다.",
    sections: [
      {
        heading: "고객 자료가 흩어지는 이유",
        paragraphs: [
          "고객 자료는 채널마다 형태가 다릅니다. 인터뷰는 긴 문장이고, 설문은 짧은 답변이며, 리뷰는 감정이 섞여 있고, 고객 문의는 문제 중심으로 적힙니다.",
          "이 자료를 그대로 모으면 고객의 목소리는 많지만 어떤 문제를 먼저 해결해야 하는지 보이지 않습니다.",
        ],
      },
      {
        heading: "고객군과 상황을 먼저 나누기",
        paragraphs: [
          "모든 고객 의견을 같은 무게로 보면 판단이 흐려집니다. 먼저 신규 사용자, 고급 사용자, 이탈 고객, 구매 직전 고객처럼 고객군과 상황을 나누는 것이 좋습니다.",
          "같은 불만이라도 누가 어떤 상황에서 말했는지에 따라 제품 개선의 우선순위가 달라집니다.",
        ],
      },
      {
        heading: "반복되는 불편과 표현 찾기",
        paragraphs: [
          "고객 인사이트에서 중요한 것은 한 명의 강한 의견보다 반복되는 패턴입니다. 여러 고객이 비슷한 표현으로 불편을 말한다면 제품이나 메시지에 신호가 있을 가능성이 큽니다.",
          "고객이 실제로 쓴 표현은 마케팅 문구에도 도움이 됩니다. 팀의 해석과 고객의 원문 표현을 분리해두면 나중에 더 정확하게 사용할 수 있습니다.",
        ],
      },
      {
        heading: "제품 개선과 마케팅 메시지로 연결하기",
        paragraphs: [
          "고객 인사이트는 '고객이 이렇게 말했다'에서 멈추면 약합니다. 이 말이 제품 개선, 온보딩, 가격, 콘텐츠, 광고 메시지 중 어디에 연결되는지 정리해야 합니다.",
          "예를 들어 '기능은 좋은데 어디서 시작할지 모르겠다'는 리뷰는 기능 추가보다 첫 사용 흐름 개선이나 튜토리얼 메시지 개선으로 이어질 수 있습니다.",
        ],
      },
      {
        heading: "Brify로 고객 인사이트 구조화하기",
        paragraphs: [
          "Brify에서는 고객군, 문제, 원문 표현, 반복 빈도, 제품 가설, 마케팅 메시지를 연결해 구조맵으로 만들 수 있습니다. 고객 자료가 단순 메모가 아니라 실행 가능한 인사이트가 됩니다.",
          "이 구조를 보면 제품팀과 마케팅팀이 같은 고객 자료를 놓고도 각자 필요한 결정을 더 쉽게 할 수 있습니다.",
        ],
      },
    ],
    closing:
      "고객 인사이트 정리는 고객 말을 짧게 요약하는 일이 아닙니다. Brify에서 고객군, 문제, 반복 표현, 제품 가설을 연결해 실제 결정으로 이어지게 만들어보세요.",
  },
  {
    slug: "structure-meeting-materials-before-meeting",
    title: "회의 전에 회의자료를 구조화하는 방법",
    excerpt:
      "회의 전에 회의자료를 구조화하면 안건, 배경, 결정할 사항, 쟁점, 질문, 필요한 자료를 분리해 회의 시간을 줄일 수 있습니다.",
    seo_keywords: ["회의자료 구조화", "회의자료 정리", "회의 안건 정리", "회의 준비 자료 정리", ...commonKeywords],
    intro:
      "회의자료를 미리 읽었는데도 회의가 시작되면 무엇을 결정해야 하는지 흐려지는 경우가 있습니다. 자료의 내용을 이해하는 것과 회의에서 쓸 수 있게 구조화하는 것은 다릅니다. 회의자료 구조화는 회의록 작성이 아니라, 회의 전에 안건과 결정할 것을 선명하게 만드는 일입니다.",
    sections: [
      {
        heading: "회의자료를 그냥 읽으면 생기는 문제",
        paragraphs: [
          "회의자료에는 배경 설명, 데이터, 제안, 쟁점, 참고 링크가 함께 들어 있습니다. 순서대로 읽기만 하면 내용은 알 수 있지만 회의에서 무엇을 먼저 논의해야 하는지 분명하지 않을 수 있습니다.",
          "특히 회의 시간이 짧을수록 자료의 모든 내용을 요약하는 것보다 결정할 것과 질문을 미리 분리하는 것이 중요합니다.",
        ],
      },
      {
        heading: "안건과 배경 정보를 분리하기",
        paragraphs: [
          "회의 안건은 이번 회의에서 다룰 주제이고, 배경 정보는 그 안건을 이해하기 위한 자료입니다. 이 둘이 섞이면 회의가 설명 시간으로 길어질 수 있습니다.",
          "회의 전에는 안건을 먼저 적고, 각 안건 아래에 필요한 배경 자료만 연결하는 방식이 좋습니다.",
        ],
      },
      {
        heading: "이번 회의에서 결정할 것을 먼저 표시하기",
        paragraphs: [
          "회의자료를 볼 때 가장 먼저 표시해야 하는 것은 결정할 사항입니다. 의견 공유 회의인지, 승인 회의인지, 우선순위 결정 회의인지에 따라 자료를 읽는 방식이 달라집니다.",
          "결정할 것이 보이면 회의 중 논의가 옆길로 새는 것을 줄일 수 있습니다.",
        ],
      },
      {
        heading: "쟁점과 질문을 미리 정리하기",
        paragraphs: [
          "회의에서 충돌할 수 있는 쟁점과 확인해야 할 질문은 미리 분리해두는 것이 좋습니다. 자료를 읽다가 애매한 부분을 그냥 넘기면 회의 중에 다시 시간이 걸립니다.",
          "쟁점은 찬반 의견, 데이터 부족, 고객 영향, 일정 리스크처럼 나누어두면 논의가 더 생산적입니다.",
        ],
      },
      {
        heading: "Brify로 회의 전 구조맵 만들기",
        paragraphs: [
          "Brify에서는 회의자료를 안건, 배경, 결정할 것, 쟁점, 질문, 추가 자료로 나누어 구조맵으로 정리할 수 있습니다. 회의 전에 이 구조를 보면 참여자가 같은 흐름을 공유하기 쉽습니다.",
          "회의자료를 읽는 시간이 회의 준비로 이어지면 실제 회의 시간은 더 짧고 명확해집니다.",
        ],
      },
    ],
    closing:
      "회의자료 구조화는 회의를 길게 준비하는 일이 아니라 회의 시간을 아끼는 일입니다. Brify에서 안건, 결정사항, 쟁점, 질문을 먼저 나누어보세요.",
  },
  {
    slug: "organize-meeting-decisions-action-items",
    title: "회의 후 결정사항과 액션아이템을 정리하는 법",
    excerpt:
      "회의 후에는 논의 내용 전체보다 결정사항, 보류 쟁점, 담당자, 기한, 다음 액션아이템을 분리해 정리해야 합니다.",
    seo_keywords: ["회의 결정사항 정리", "회의록 액션아이템", "회의 후 정리", "회의 내용 구조화", ...commonKeywords],
    intro:
      "회의록이 길다고 해서 회의 후 실행이 잘 되는 것은 아닙니다. 오히려 논의 내용을 모두 적어두었는데 정작 누가 무엇을 언제까지 해야 하는지 보이지 않는 경우가 많습니다. 회의 후 정리의 목적은 회의 내용을 모두 보관하는 것이 아니라, 이후 실행이 흔들리지 않게 만드는 것입니다.",
    sections: [
      {
        heading: "회의록이 길어도 실행이 안 되는 이유",
        paragraphs: [
          "회의록에는 배경, 의견, 반론, 농담, 임시 아이디어, 결정사항이 한꺼번에 들어갈 수 있습니다. 이 상태로 남겨두면 나중에 다시 읽어도 실행할 항목을 찾기 어렵습니다.",
          "회의 후에는 전체 기록과 실행 구조를 분리해야 합니다. 모든 말이 같은 중요도를 갖는 것은 아닙니다.",
        ],
      },
      {
        heading: "결정사항과 논의 내용을 분리하기",
        paragraphs: [
          "먼저 회의에서 실제로 결정된 것을 따로 뽑아야 합니다. '논의했다'와 '결정했다'는 다릅니다. 결정사항은 이후 행동의 기준이 됩니다.",
          "결정되지 않은 의견은 보류 쟁점이나 추가 검토 항목으로 남겨야 합니다. 그래야 다음 회의에서 다시 시작하지 않습니다.",
        ],
      },
      {
        heading: "보류된 쟁점과 추가 확인 자료 남기기",
        paragraphs: [
          "회의에서 결론을 내지 못한 쟁점도 중요합니다. 다만 그것을 결정사항처럼 쓰면 혼란이 생깁니다.",
          "보류된 쟁점은 왜 보류됐는지, 어떤 자료가 더 필요한지, 누가 확인할 것인지까지 함께 남겨야 합니다.",
        ],
      },
      {
        heading: "담당자, 기한, 다음 행동을 표시하기",
        paragraphs: [
          "액션아이템은 할 일 문장만으로는 부족합니다. 담당자, 기한, 완료 기준이 있어야 실행됩니다.",
          "예를 들어 '경쟁사 추가 조사'보다 '다음 주 화요일까지 A사가 새로 출시한 가격 정책을 조사해 비교표에 반영'처럼 적어야 실제 업무로 이어집니다.",
        ],
      },
      {
        heading: "Brify로 회의 후 실행 구조 만들기",
        paragraphs: [
          "Brify에서는 회의 내용을 결정사항, 보류 쟁점, 추가 확인 자료, 담당자, 기한, 액션아이템으로 나누어 구조맵으로 정리할 수 있습니다.",
          "이 구조가 있으면 회의록을 다시 읽지 않아도 다음 행동과 책임이 보입니다.",
        ],
      },
    ],
    closing:
      "회의 후 정리는 기록보다 실행이 목적입니다. Brify에서 결정사항과 액션아이템을 분리해 다음 업무가 바로 보이게 만들어보세요.",
  },
  {
    slug: "turn-research-and-meetings-into-action-plan",
    title: "시장조사와 회의자료를 실행계획으로 연결하는 법",
    excerpt:
      "시장조사와 회의자료를 실행계획으로 연결하려면 인사이트, 결정사항, 가설, 담당자, 기한, 검증 지표를 함께 정리해야 합니다.",
    seo_keywords: ["실무 리서치 자료 정리", "업무 자료 구조화", "리서치 결과 정리", "실행계획 정리", ...commonKeywords],
    intro:
      "시장조사 보고서도 정리했고 회의자료도 정리했는데 실제 업무가 움직이지 않는 경우가 있습니다. 이유는 리서치 인사이트와 회의 결정사항이 서로 따로 저장되어 있기 때문입니다. 실무 자료 정리의 마지막 목표는 보기 좋은 요약이 아니라 실행 가능한 다음 행동입니다.",
    sections: [
      {
        heading: "자료 정리가 실행으로 이어지지 않는 이유",
        paragraphs: [
          "리서치 자료는 인사이트 중심으로 정리되고, 회의자료는 안건과 결정 중심으로 정리됩니다. 둘이 연결되지 않으면 좋은 자료와 좋은 회의가 있어도 실행계획은 흐려집니다.",
          "실행계획에는 무엇을 알게 되었는지뿐 아니라 그래서 무엇을 할지, 누가 할지, 언제 확인할지가 필요합니다.",
        ],
      },
      {
        heading: "리서치 인사이트와 회의 결정사항 연결하기",
        paragraphs: [
          "시장조사에서 나온 인사이트가 회의에서 어떤 결정으로 이어졌는지 연결해야 합니다. 예를 들어 고객군 분석이 초기 타겟 선정으로 이어졌다면 그 연결을 명확히 남겨야 합니다.",
          "이 연결이 없으면 시간이 지나면서 왜 그런 결정을 했는지 기억하기 어렵고, 같은 논의를 반복하게 됩니다.",
        ],
      },
      {
        heading: "가설, 담당자, 기한, 지표로 바꾸기",
        paragraphs: [
          "실행계획은 인사이트를 가설로 바꾸는 단계가 필요합니다. '고객은 빠른 요약보다 구조화를 원한다'는 인사이트라면 '구조맵 예시를 랜딩페이지에 추가하면 전환율이 오른다'는 가설로 바꿀 수 있습니다.",
          "그다음 담당자, 기한, 검증 지표를 붙여야 합니다. 그래야 리서치가 실제 실험이나 업무로 이어집니다.",
        ],
      },
      {
        heading: "다음 회의에서 확인할 것 남기기",
        paragraphs: [
          "실행계획은 한 번 만들고 끝나는 문서가 아닙니다. 다음 회의에서 무엇을 확인할지 함께 남겨야 합니다.",
          "진행 상태, 지표 변화, 추가로 필요한 자료, 결정해야 할 쟁점을 미리 표시하면 다음 회의가 더 짧고 선명해집니다.",
        ],
      },
      {
        heading: "Brify로 실행계획 구조맵 만들기",
        paragraphs: [
          "Brify에서는 리서치 인사이트, 회의 결정사항, 실행 가설, 담당자, 기한, 검증 지표를 한 구조로 연결할 수 있습니다.",
          "시장조사와 회의자료를 따로 보관하지 않고 하나의 실행 흐름으로 만들면, 자료 정리가 실제 업무 진척으로 이어질 가능성이 높아집니다.",
        ],
      },
    ],
    closing:
      "실무 리서치 자료 정리의 끝은 요약이 아니라 실행입니다. Brify에서 인사이트, 결정사항, 가설, 담당자, 기한을 연결해 움직이는 계획으로 바꿔보세요.",
  },
];

async function getExistingPost(post) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,translation_group_id")
    .eq("locale", "ko")
    .eq("slug", post.slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

const results = [];

for (const post of posts) {
  const existing = await getExistingPost(post);
  const markdown = insertDefaultBodyImage(buildMarkdown(post));
  const payload = {
    locale: "ko",
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    seo_keywords: Array.from(new Set(post.seo_keywords)),
    image_url: imageUrl,
    markdown,
    status: "draft",
    published_at: null,
    translation_group_id: existing?.translation_group_id ?? randomUUID(),
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
