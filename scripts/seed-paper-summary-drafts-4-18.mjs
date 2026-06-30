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
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
        return [key, value];
      })
  );
}

const env = {
  ...loadEnvFile(".env"),
  ...loadEnvFile(".env.local"),
  ...process.env,
};

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const imageUrl =
  "https://ojtkmpiiquwgetwyoyqy.supabase.co/storage/v1/object/public/blog-images/en/1781139691915-2a845d34-3b57-448b-a7b8-6626b7c23d2b-4.001.jpeg";
const bodyImageUrl =
  "https://ojtkmpiiquwgetwyoyqy.supabase.co/storage/v1/object/public/blog-images/ko/1780975282822-6cc628f6-a35f-47be-b13e-9bdfa6de3045-2026-06-09-12.20.23.png";
const bodyImageMarkdown = `![blog image](${bodyImageUrl})`;

function insertDefaultBodyImage(markdown) {
  const cleanMarkdown = markdown.trim();
  if (!cleanMarkdown || cleanMarkdown.includes(bodyImageUrl)) {
    return cleanMarkdown;
  }

  const lines = cleanMarkdown.split(/\r?\n/);
  const headingIndexes = lines
    .map((line, index) => (/^##\s+/.test(line.trim()) ? index : -1))
    .filter((index) => index > 0);

  if (headingIndexes.length > 0) {
    const midpoint = Math.floor(lines.length / 2);
    const insertIndex =
      headingIndexes.find((index) => index >= midpoint) ??
      headingIndexes[Math.floor(headingIndexes.length / 2)];
    lines.splice(insertIndex, 0, "", bodyImageMarkdown, "");
    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  const blocks = cleanMarkdown.split(/\n{2,}/);
  const insertBlockIndex = Math.max(1, Math.ceil(blocks.length / 2));
  blocks.splice(insertBlockIndex, 0, bodyImageMarkdown);
  return blocks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

function buildMarkdown({ intro, sections, closing }) {
  return [
    intro.trim(),
    ...sections.map((section) =>
      [`## ${section.heading}`, ...section.paragraphs].join("\n\n")
    ),
    "## 마무리",
    closing.trim(),
  ].join("\n\n");
}

const posts = [
  {
    locale: "ko",
    slug: "paper-organization-routine-for-grad-students",
    title: "대학원생을 위한 논문 정리 루틴",
    excerpt:
      "대학원생이 매주 논문을 읽고 정리할 때 사용할 수 있는 반복 루틴을 소개합니다.",
    seo_keywords: [
      "대학원생 논문 정리",
      "논문 정리 루틴",
      "대학원 논문 읽기",
      "문헌 정리",
      "논문 정리",
      "연구 노트",
      "AI 구조맵",
      "Brify",
    ],
    intro:
      "대학원생에게 논문 정리는 한 번 하고 끝나는 일이 아닙니다. 매주 읽은 논문이 쌓이고, 그 논문들이 수업 발표, 연구계획서, 문헌리뷰, 학위논문으로 다시 연결됩니다. 그래서 중요한 것은 빠르게 요약하는 기술보다 **반복 가능한 논문 정리 루틴**입니다.",
    sections: [
      {
        heading: "대학원생에게 논문 정리가 누적되어야 하는 이유",
        paragraphs: [
          "논문을 읽을 때마다 새 문서를 만들고 한 문단 요약만 남기면, 시간이 지나면서 다시 찾기 어려워집니다. 어떤 논문이 어떤 연구 질문을 다뤘는지, 어떤 방법을 썼는지, 내 연구와 어떤 관련이 있었는지 기억이 흐려집니다.",
          "대학원생의 논문 정리는 개인적인 메모가 아니라 연구 자산입니다. 나중에 문헌리뷰를 쓸 때, 발표를 준비할 때, 지도교수와 논의할 때 다시 꺼내 쓸 수 있어야 합니다.",
        ],
      },
      {
        heading: "읽기 전: 연구 질문 먼저 잡기",
        paragraphs: [
          "논문을 열기 전에 먼저 해야 할 일은 이 논문에서 무엇을 얻고 싶은지 정하는 것입니다. 전체 내용을 모두 외우려는 태도보다, 내 연구나 과제와 연결되는 질문을 정하고 읽는 편이 훨씬 효율적입니다.",
          "예를 들어 이 논문이 이론적 배경을 주는지, 방법론 참고가 되는지, 반대 근거로 쓸 수 있는지 먼저 구분하면 읽는 방식도 달라집니다.",
        ],
      },
      {
        heading: "읽는 중: 방법과 결과 연결하기",
        paragraphs: [
          "논문을 읽는 동안에는 결과만 따로 적지 않는 것이 중요합니다. 결과는 연구 대상, 데이터, 분석 방법과 함께 봐야 의미가 생깁니다.",
          "정리 노트에는 '무슨 결과가 나왔는가'뿐 아니라 '어떤 조건에서 나온 결과인가'를 같이 남겨야 합니다. 그래야 나중에 다른 논문과 비교할 수 있습니다.",
        ],
      },
      {
        heading: "읽은 후: 내 연구와 연결하기",
        paragraphs: [
          "논문을 다 읽은 뒤에는 핵심 요약보다 먼저 내 연구와의 연결점을 적어보는 것이 좋습니다. 이 논문이 내 주장을 강화하는지, 질문을 바꾸게 만드는지, 방법론을 참고할 수 있는지 따져봐야 합니다.",
          "이 단계가 빠지면 논문 정리는 단순 독서 기록이 됩니다. 연구에 쓰이는 정리가 되려면 반드시 나의 문제의식과 연결되어야 합니다.",
        ],
      },
      {
        heading: "Brify로 논문 정리 루틴을 만드는 법",
        paragraphs: [
          "Brify에서는 논문을 구조맵으로 정리해 연구 질문, 방법, 결과, 한계를 나누어 볼 수 있습니다. 한 문단 요약으로 끝나는 것이 아니라, 나중에 다시 찾아볼 수 있는 구조가 남습니다.",
          "매주 읽는 논문을 같은 구조로 정리하면 문헌리뷰를 시작할 때 큰 도움이 됩니다. 어떤 논문이 어떤 질문에 답했는지, 어떤 방법을 썼는지 더 빠르게 비교할 수 있습니다.",
        ],
      },
    ],
    closing:
      "대학원생에게 논문 정리는 속도보다 누적성이 중요합니다. 매주 읽은 논문을 Brify 구조맵으로 쌓아두면, 나중에 문헌리뷰와 발표, 연구계획서 작성에서 다시 활용할 수 있습니다.",
  },
  {
    locale: "ko",
    slug: "can-you-read-only-paper-abstract",
    title: "논문 초록만 읽어도 될까",
    excerpt:
      "논문 초록은 핵심을 빠르게 보여주지만 연구 방법, 데이터, 한계는 충분히 드러나지 않습니다.",
    seo_keywords: [
      "논문 초록 요약",
      "논문 요약",
      "논문 초록 읽기",
      "논문 빠르게 읽는 법",
      "논문 정리",
      "논문 구조화",
      "AI 구조맵",
      "Brify",
    ],
    intro:
      "논문 초록은 논문을 빠르게 파악하는 데 매우 유용합니다. 하지만 초록만 읽고 논문을 이해했다고 생각하면 중요한 맥락을 놓칠 수 있습니다. 초록은 논문의 입구이지, 논문 전체를 대신하는 정리는 아닙니다.",
    sections: [
      {
        heading: "초록이 알려주는 것",
        paragraphs: [
          "초록은 보통 연구 주제, 문제의식, 방법, 핵심 결과, 결론을 짧게 압축합니다. 그래서 처음 논문을 고를 때 가장 먼저 읽기 좋은 부분입니다.",
          "여러 논문을 빠르게 훑어야 할 때 초록은 필터 역할을 합니다. 내 관심 주제와 맞는지, 깊게 읽을 가치가 있는지 판단할 수 있습니다.",
        ],
      },
      {
        heading: "초록이 숨기는 것",
        paragraphs: [
          "초록은 짧아야 하므로 많은 정보가 생략됩니다. 연구 대상의 구체적인 조건, 데이터 수집 방식, 분석 과정, 한계는 충분히 드러나지 않을 수 있습니다.",
          "특히 논문을 인용하거나 리포트에 활용하려면 초록만으로는 위험합니다. 결론이 어떤 근거에서 나왔는지 확인하지 않으면 연구의 의미를 과장할 수 있습니다.",
        ],
      },
      {
        heading: "방법론을 확인하지 않으면 위험한 이유",
        paragraphs: [
          "논문의 신뢰도는 결과보다 방법에서 먼저 결정됩니다. 어떤 데이터를 썼는지, 표본은 충분했는지, 분석 방식은 적절했는지 확인해야 합니다.",
          "초록은 방법론을 한 문장으로 줄이는 경우가 많습니다. 하지만 그 한 문장만으로는 연구가 내 상황에 적용 가능한지 판단하기 어렵습니다.",
        ],
      },
      {
        heading: "결과와 결론을 구분해야 하는 이유",
        paragraphs: [
          "초록에서는 결과와 결론이 가까이 붙어 제시됩니다. 그러나 결과는 데이터가 보여준 내용이고, 결론은 연구자가 그 결과를 해석한 주장입니다.",
          "논문을 제대로 정리하려면 결과와 결론을 분리해서 봐야 합니다. 이 차이를 놓치면 논문의 주장을 지나치게 단순하게 받아들이게 됩니다.",
        ],
      },
      {
        heading: "초록 이후 논문을 구조적으로 확인하는 법",
        paragraphs: [
          "초록을 읽은 뒤에는 서론의 연구 질문, 방법론, 결과, 논의, 한계 순서로 핵심 구조를 확인하는 것이 좋습니다. 모든 문장을 다 읽기 전에 구조를 먼저 잡으면 훨씬 효율적입니다.",
          "Brify는 이 흐름을 구조맵으로 펼쳐볼 수 있게 돕습니다. 초록 이후 본문에서 확인해야 할 내용을 나누어 볼 수 있기 때문에 빠른 검토에 유용합니다.",
        ],
      },
    ],
    closing:
      "초록은 좋은 출발점이지만 끝은 아닙니다. 초록 이후의 방법, 결과, 한계를 구조적으로 확인해야 논문을 안전하게 활용할 수 있습니다. Brify로 초록 이후의 논문 구조를 펼쳐보세요.",
  },
  {
    locale: "ko",
    slug: "how-to-read-papers-faster",
    title: "논문을 빠르게 읽는 법: 요약보다 먼저 볼 것들",
    excerpt:
      "논문을 빠르게 읽으려면 초록, 그림, 연구 질문, 방법, 결론을 순서대로 훑고 구조를 잡아야 합니다.",
    seo_keywords: [
      "논문 빠르게 읽는 법",
      "논문 정리",
      "논문 요약",
      "논문 읽는 순서",
      "논문 구조화",
      "AI 논문 요약",
      "AI 구조맵",
      "Brify",
    ],
    intro:
      "논문을 빠르게 읽는다는 것은 대충 읽는다는 뜻이 아닙니다. 오히려 먼저 구조를 잡고, 중요한 부분에 시간을 쓰는 방식입니다. 처음부터 끝까지 같은 속도로 읽으면 오래 걸리고 핵심도 흐려질 수 있습니다.",
    sections: [
      {
        heading: "논문을 처음부터 끝까지 읽으면 오래 걸리는 이유",
        paragraphs: [
          "논문은 일반 글처럼 앞에서 뒤로 자연스럽게 읽히지 않을 때가 많습니다. 선행연구, 방법론, 결과표, 논의가 서로 다른 밀도로 구성되어 있기 때문입니다.",
          "처음부터 모든 문장을 이해하려고 하면 시간이 오래 걸립니다. 먼저 전체 구조를 잡고, 필요한 부분을 다시 깊게 읽는 편이 훨씬 효율적입니다.",
        ],
      },
      {
        heading: "먼저 봐야 할 5개 지점",
        paragraphs: [
          "논문을 빠르게 파악하려면 제목, 초록, 서론 마지막의 연구 질문, 그림과 표, 결론과 한계를 먼저 확인하세요. 이 다섯 지점은 논문의 큰 방향을 보여줍니다.",
          "이 순서로 보면 논문이 어떤 문제를 다루는지, 어떤 결과를 냈는지, 어디까지 믿을 수 있는지 빠르게 감을 잡을 수 있습니다.",
        ],
      },
      {
        heading: "그림과 표로 연구 흐름 파악하기",
        paragraphs: [
          "많은 논문에서 핵심 결과는 그림과 표에 압축되어 있습니다. 본문을 읽기 전에 그림 제목, 표 제목, 캡션을 훑으면 연구의 흐름이 보입니다.",
          "다만 그림과 표만 보고 결론을 내리면 안 됩니다. 어떤 데이터에서 나온 결과인지 방법론과 함께 확인해야 합니다.",
        ],
      },
      {
        heading: "모르는 용어를 정리하는 법",
        paragraphs: [
          "낯선 용어가 많을 때는 모든 용어를 즉시 검색하지 말고, 반복해서 등장하는 핵심 용어부터 정리하세요. 논문에서 한 번만 나오는 용어와 연구를 이해하는 데 꼭 필요한 용어는 다릅니다.",
          "용어를 구조맵 안에서 연구 질문이나 방법과 연결해두면 나중에 다시 읽을 때 훨씬 빠르게 복기할 수 있습니다.",
        ],
      },
      {
        heading: "Brify 구조맵으로 빠르게 전체 흐름 보기",
        paragraphs: [
          "Brify는 긴 논문을 구조맵으로 펼쳐서 큰 흐름을 먼저 볼 수 있게 합니다. 전체를 한 문단으로 줄이는 것이 아니라, 어떤 항목들이 어떻게 연결되는지 확인할 수 있습니다.",
          "시간이 부족할수록 요약문만 보는 것보다 구조를 먼저 잡는 편이 안전합니다. 필요한 부분만 다시 깊게 읽을 수 있기 때문입니다.",
        ],
      },
    ],
    closing:
      "논문을 빠르게 읽으려면 덜 읽는 것이 아니라 먼저 구조를 잡아야 합니다. Brify로 논문의 큰 흐름을 구조맵으로 보고, 중요한 부분에 시간을 집중해보세요.",
  },
  {
    locale: "ko",
    slug: "pdf-paper-summary-mistakes",
    title: "PDF 논문 요약을 할 때 놓치기 쉬운 것",
    excerpt:
      "PDF 논문 요약을 할 때 표, 그림, 방법론, 한계, 참고문헌 맥락을 놓치지 않는 방법을 설명합니다.",
    seo_keywords: [
      "PDF 논문 요약",
      "PDF 요약",
      "AI 논문 요약",
      "논문 PDF 정리",
      "논문 정리",
      "논문 구조화",
      "AI 구조맵",
      "Brify",
    ],
    intro:
      "PDF 논문을 AI로 요약하면 빠르게 핵심 내용을 볼 수 있습니다. 하지만 PDF 논문은 단순 텍스트 파일이 아닙니다. 표, 그림, 캡션, 섹션 구조, 참고문헌 맥락이 함께 들어 있기 때문에 요약 과정에서 중요한 정보가 빠질 수 있습니다.",
    sections: [
      {
        heading: "PDF 논문 요약이 어려운 이유",
        paragraphs: [
          "PDF는 보기에는 안정적이지만, AI가 읽을 때는 문단 순서, 표, 주석, 캡션이 복잡하게 섞일 수 있습니다. 특히 2단 편집 논문에서는 텍스트 추출 순서가 자연스럽지 않을 수 있습니다.",
          "그래서 PDF 논문 요약은 요약 결과만 볼 것이 아니라, 중요한 섹션이 제대로 반영되었는지 확인해야 합니다.",
        ],
      },
      {
        heading: "표와 그림이 빠지면 생기는 문제",
        paragraphs: [
          "논문의 핵심 결과는 본문보다 표와 그림에 더 선명하게 들어 있는 경우가 많습니다. 표와 그림이 빠진 요약은 연구 결과의 세부 차이를 놓칠 수 있습니다.",
          "특히 수치 비교, 실험 조건, 모델 성능, 인터뷰 범주처럼 표로 정리된 내용은 반드시 따로 확인해야 합니다.",
        ],
      },
      {
        heading: "방법론 섹션을 따로 봐야 하는 이유",
        paragraphs: [
          "PDF 요약 도구는 결론이나 초록을 중심으로 답을 만들기 쉽습니다. 그러나 논문을 신뢰하려면 방법론 섹션을 따로 봐야 합니다.",
          "연구 대상, 데이터 수집 방식, 분석 절차가 어떤지 확인해야 결과를 얼마나 믿을 수 있는지 판단할 수 있습니다.",
        ],
      },
      {
        heading: "결과와 한계를 연결해서 읽기",
        paragraphs: [
          "논문 결과는 한계와 함께 읽어야 합니다. 어떤 조건에서는 유의미했지만 다른 상황에서는 적용하기 어려울 수 있습니다.",
          "PDF 요약이 결과만 강조하고 한계를 줄여버리면 실제 활용에서는 위험합니다. 한계 섹션을 구조적으로 따로 남겨두는 것이 좋습니다.",
        ],
      },
      {
        heading: "Brify로 PDF 논문을 구조화하는 방식",
        paragraphs: [
          "Brify는 PDF 논문을 단순히 짧은 요약문으로 줄이는 대신, 논문의 흐름을 구조맵으로 정리하는 데 초점을 둡니다.",
          "표, 그림, 방법론, 한계처럼 다시 확인해야 하는 지점이 구조 안에 남아 있으면, 나중에 원문을 다시 찾기도 쉬워집니다.",
        ],
      },
    ],
    closing:
      "PDF 논문 요약은 빠르지만, 표와 그림, 방법론, 한계를 놓치면 위험합니다. PDF 논문을 Brify 구조맵으로 정리하면 요약 이후에도 필요한 근거를 다시 확인하기 쉽습니다.",
  },
  {
    locale: "ko",
    slug: "research-paper-organization-checklist",
    title: "논문 한 편을 정리하는 체크리스트",
    excerpt:
      "논문 한 편을 읽고 정리할 때 연구 질문, 데이터, 방법, 결과, 한계, 내 연구와의 연결을 확인하세요.",
    seo_keywords: [
      "논문 정리 체크리스트",
      "논문 정리 방법",
      "논문 요약",
      "연구 논문 읽기",
      "논문 구조화",
      "연구 노트",
      "AI 구조맵",
      "Brify",
    ],
    intro:
      "논문을 읽고 나서 무엇을 남겨야 할지 애매하다면 체크리스트가 필요합니다. 좋은 논문 정리는 감상문이 아니라, 나중에 다시 활용할 수 있는 정보 구조입니다.",
    sections: [
      {
        heading: "논문 정리 체크리스트가 필요한 이유",
        paragraphs: [
          "논문마다 형식은 비슷해 보여도 실제로 중요한 지점은 조금씩 다릅니다. 체크리스트가 있으면 논문마다 같은 기준으로 정보를 뽑을 수 있습니다.",
          "특히 여러 논문을 비교해야 할 때 같은 항목으로 정리된 노트가 큰 힘을 발휘합니다.",
        ],
      },
      {
        heading: "기본 정보 체크",
        paragraphs: [
          "먼저 제목, 저자, 연도, 학술지나 학회, 연구 분야를 적습니다. 이 기본 정보는 나중에 인용하거나 다시 찾을 때 필요합니다.",
          "한 문장 핵심 요약도 남겨두면 좋습니다. 단, 이 요약은 전체 정리의 시작일 뿐입니다.",
        ],
      },
      {
        heading: "연구 질문과 가설 체크",
        paragraphs: [
          "논문이 어떤 질문에 답하려는지 확인하세요. 연구 질문이 명확하지 않으면 방법과 결과도 흩어져 보입니다.",
          "가설이 있다면 가설과 결과가 어떻게 연결되는지도 함께 정리해야 합니다.",
        ],
      },
      {
        heading: "방법과 데이터 체크",
        paragraphs: [
          "연구 대상, 데이터 출처, 수집 방식, 분석 방법을 분리해 적습니다. 이 항목들은 논문 결과의 신뢰도를 판단하는 기준입니다.",
          "방법과 데이터가 약하면 결론이 강해 보여도 조심해서 해석해야 합니다.",
        ],
      },
      {
        heading: "결과, 한계, 활용 가능성 체크",
        paragraphs: [
          "핵심 결과만 적지 말고 연구 한계와 내 작업에 활용할 수 있는 지점도 함께 남기세요. 논문 정리는 미래의 나를 위한 검색 가능한 메모여야 합니다.",
          "Brify 구조맵을 사용하면 이 항목들을 각각 노드로 나누어 정리할 수 있어 다시 찾아보기 쉽습니다.",
        ],
      },
    ],
    closing:
      "논문 한 편을 읽었다면 연구 질문, 방법, 결과, 한계, 활용 가능성을 남겨야 합니다. Brify 구조맵에 체크리스트를 적용하면 논문 정리가 더 일관되고 재사용 가능해집니다.",
  },
  {
    locale: "ko",
    slug: "paper-summary-for-report-risk",
    title: "논문 요약문을 과제나 리포트에 바로 쓰면 위험한 이유",
    excerpt:
      "논문 요약문을 그대로 리포트에 쓰면 맥락과 근거가 빠질 수 있습니다. 안전하게 활용하는 정리법을 설명합니다.",
    seo_keywords: [
      "논문 요약 리포트",
      "논문 요약 과제",
      "논문 정리",
      "리포트 자료 정리",
      "논문 근거 정리",
      "AI 논문 요약",
      "AI 구조맵",
      "Brify",
    ],
    intro:
      "AI가 만든 논문 요약문은 과제나 리포트 준비에 도움이 될 수 있습니다. 하지만 그 요약문을 그대로 가져다 쓰면 논문의 맥락과 근거가 빠져 위험할 수 있습니다.",
    sections: [
      {
        heading: "논문 요약문을 그대로 쓰면 생기는 문제",
        paragraphs: [
          "요약문은 논문의 복잡한 논리를 짧게 줄입니다. 그래서 문장은 자연스러워 보여도 연구 방법, 데이터 조건, 한계가 충분히 남지 않을 수 있습니다.",
          "리포트에서는 단순히 논문이 무엇을 말했는지가 아니라, 그 주장이 어떤 근거에서 나왔는지를 보여줘야 합니다.",
        ],
      },
      {
        heading: "인용과 해석은 다르다",
        paragraphs: [
          "논문의 문장을 인용하는 것과 그 논문을 해석하는 것은 다릅니다. 요약문만 보고 해석하면 원래 논문의 조심스러운 표현을 놓칠 수 있습니다.",
          "리포트에 쓰기 전에는 원문에서 실제로 어떤 표현을 썼는지, 결론의 범위가 어디까지인지 확인해야 합니다.",
        ],
      },
      {
        heading: "논문의 한계를 함께 써야 하는 이유",
        paragraphs: [
          "좋은 리포트는 논문의 결론만 가져오지 않습니다. 연구 한계와 적용 범위를 함께 설명합니다.",
          "한계를 쓰지 않으면 논문의 주장을 과장하게 되고, 평가자에게 얕은 이해로 보일 수 있습니다.",
        ],
      },
      {
        heading: "내 주장과 논문 근거를 연결하는 법",
        paragraphs: [
          "논문은 내 주장을 대신 써주는 자료가 아닙니다. 내 주장에 필요한 근거를 제공하는 자료입니다.",
          "따라서 논문 요약을 읽은 뒤에는 내 리포트의 주장과 논문의 연구 질문, 방법, 결과가 어떻게 연결되는지 따로 정리해야 합니다.",
        ],
      },
      {
        heading: "Brify 구조맵으로 리포트 근거 정리하기",
        paragraphs: [
          "Brify 구조맵을 사용하면 논문 요약, 방법, 결과, 한계를 분리해서 정리할 수 있습니다. 리포트를 쓸 때 필요한 근거를 더 쉽게 찾아볼 수 있습니다.",
          "요약문을 그대로 붙이는 대신, 구조맵에서 내 주장과 연결되는 지점을 골라 쓰면 더 안전하고 설득력 있는 리포트가 됩니다.",
        ],
      },
    ],
    closing:
      "논문 요약문은 리포트의 출발점이 될 수 있지만 최종 답안이 되어서는 안 됩니다. Brify로 논문 근거를 구조화한 뒤, 내 주장과 연결해서 활용해보세요.",
  },
  {
    locale: "ko",
    slug: "chatgpt-paper-summary-checkpoints",
    title: "ChatGPT로 논문 요약할 때 확인해야 할 것",
    excerpt:
      "ChatGPT로 논문을 요약할 때는 원문 근거, 섹션 누락, 방법론 해석, 한계 요약을 반드시 확인해야 합니다.",
    seo_keywords: [
      "ChatGPT 논문 요약",
      "AI 논문 요약",
      "논문 요약 AI",
      "논문 정리",
      "논문 요약 오류",
      "논문 구조화",
      "AI 구조맵",
      "Brify",
    ],
    intro:
      "ChatGPT로 논문을 요약하면 빠르고 편합니다. 하지만 논문은 정확성이 중요한 자료입니다. AI가 만든 요약이 자연스럽다고 해서 그대로 믿기보다는 몇 가지 지점을 반드시 확인해야 합니다.",
    sections: [
      {
        heading: "ChatGPT 논문 요약의 장점",
        paragraphs: [
          "ChatGPT는 긴 문장을 읽기 쉬운 형태로 바꾸고, 낯선 논문의 큰 흐름을 빠르게 파악하는 데 도움을 줄 수 있습니다.",
          "특히 처음 접하는 분야에서는 용어와 핵심 주제를 잡는 출발점으로 유용합니다.",
        ],
      },
      {
        heading: "원문 근거를 확인해야 하는 이유",
        paragraphs: [
          "AI 요약은 원문 문장을 압축하거나 재구성합니다. 이 과정에서 표현의 강도가 달라질 수 있습니다.",
          "논문에서 '가능성을 시사한다'고 한 내용을 '증명했다'처럼 받아들이지 않으려면 원문 근거를 확인해야 합니다.",
        ],
      },
      {
        heading: "방법론과 결과 해석의 위험",
        paragraphs: [
          "논문 요약에서 가장 위험한 부분은 방법론과 결과 해석입니다. 연구 대상과 분석 방법을 제대로 보지 않으면 결과의 의미를 잘못 이해할 수 있습니다.",
          "ChatGPT 요약을 받은 뒤에는 방법론 섹션이 충분히 반영되었는지 따로 확인하는 것이 좋습니다.",
        ],
      },
      {
        heading: "긴 논문에서 섹션이 누락될 수 있는 문제",
        paragraphs: [
          "긴 논문은 모든 섹션이 같은 비중으로 요약되지 않을 수 있습니다. 초록과 결론은 잘 반영되지만, 표, 그림, 한계는 약해질 수 있습니다.",
          "그래서 요약 결과를 섹션별로 나누어 검토해야 합니다.",
        ],
      },
      {
        heading: "Brify처럼 구조를 남기는 방식의 장점",
        paragraphs: [
          "Brify는 논문을 하나의 요약문으로만 남기지 않고 구조맵으로 정리합니다. 사용자는 연구 질문, 방법, 결과, 한계를 나누어 확인할 수 있습니다.",
          "AI가 요약한 내용을 다시 검토하고 활용하려면 구조가 남아 있는 편이 훨씬 안전합니다.",
        ],
      },
    ],
    closing:
      "ChatGPT 논문 요약은 편리하지만 검토가 필요합니다. 원문 근거와 논문 구조를 함께 확인하고 싶다면 Brify에서 구조맵으로 정리해보세요.",
  },
];

const additionalPosts = [
  ["research-paper-notes-structure", "논문 정리 노트는 어떻게 만들어야 할까", "논문 정리 노트에는 연구 질문, 핵심 개념, 방법, 결과, 한계, 내 메모가 분리되어 있어야 합니다.", ["논문 정리 노트", "논문 노트", "논문 요약", "연구 노트"], "논문 정리 노트는 읽은 내용을 기록하는 문서가 아니라, 나중에 다시 찾고 비교할 수 있는 지식 구조입니다.", ["좋은 논문 정리 노트의 조건", "한 문단 요약만으로 부족한 이유", "섹션별 메모를 나누는 법", "내 생각과 원문 정보를 구분하기", "Brify 구조맵을 논문 노트로 쓰는 법"]],
  ["compare-multiple-research-papers", "논문 여러 편을 비교 정리하는 방법", "여러 논문을 비교할 때는 연구 질문, 대상, 방법, 결과, 한계를 같은 기준으로 정리해야 합니다.", ["논문 비교 정리", "문헌 비교", "논문 정리", "문헌리뷰"], "논문 여러 편을 각각 요약해두는 것만으로는 비교가 어렵습니다. 같은 기준으로 구조화해야 공통점과 차이가 보입니다.", ["여러 논문 요약이 금방 헷갈리는 이유", "비교 기준을 먼저 정해야 하는 이유", "연구 방법과 데이터 비교하기", "결과와 한계 비교하기", "Brify 구조맵으로 논문 비교 정리하기"]],
  ["can-you-trust-ai-paper-summary", "AI 논문 요약 결과를 믿어도 될까", "AI 논문 요약은 빠르지만 원문 근거와 섹션 구조를 확인하지 않으면 오류를 놓칠 수 있습니다.", ["AI 논문 요약 신뢰도", "AI 논문 요약", "논문 요약 오류", "논문 정리 AI"], "AI 논문 요약은 빠른 출발점이 될 수 있지만, 연구 판단을 대신해주지는 않습니다. 신뢰하려면 원문과 구조를 확인해야 합니다.", ["AI 논문 요약이 틀릴 수 있는 이유", "긴 논문에서 생기는 누락", "용어와 방법론 오해", "원문 근거를 확인하는 습관", "Brify로 검토 가능한 요약 만들기"]],
  ["how-to-summarize-paper-methods", "논문 방법론 섹션을 정리하는 법", "논문 방법론 섹션은 연구 대상, 데이터, 절차, 분석 방법, 한계를 중심으로 정리해야 합니다.", ["논문 방법론 정리", "논문 정리", "논문 요약", "연구 방법론"], "논문 방법론은 지루해 보일 수 있지만, 결과를 믿어도 되는지 판단하는 핵심 근거입니다.", ["방법론 섹션이 중요한 이유", "연구 대상과 데이터 확인하기", "절차와 분석 방법 나누기", "결과와 방법을 연결하기", "Brify 구조맵에서 방법론을 따로 보는 법"]],
  ["paper-results-vs-conclusion", "논문 결과와 결론을 헷갈리지 않는 법", "논문 결과는 데이터가 보여준 내용이고, 결론은 연구자가 해석한 주장입니다. 둘을 구분해야 정확히 정리할 수 있습니다.", ["논문 결과 결론 차이", "논문 요약", "논문 정리", "논문 읽는 법"], "논문을 요약할 때 결과와 결론을 섞어버리면 연구자의 해석을 데이터 자체로 착각할 수 있습니다.", ["결과와 결론이 다른 이유", "결과 섹션에서 봐야 할 것", "결론 섹션에서 조심해야 할 것", "과장된 결론을 확인하는 법", "Brify로 결과와 결론을 분리해 정리하기"]],
  ["why-paper-limitations-matter", "논문 한계를 정리해야 하는 이유", "논문 한계는 단순한 약점이 아니라 연구를 정확히 해석하고 다음 연구를 찾는 기준입니다.", ["논문 한계 정리", "논문 요약", "논문 정리", "연구 한계"], "논문 한계는 연구의 약점만을 뜻하지 않습니다. 결과를 어디까지 적용할 수 있는지 알려주는 중요한 경계선입니다.", ["논문 한계가 중요한 이유", "표본, 데이터, 방법의 한계", "연구자가 직접 쓴 한계와 숨은 한계", "리포트와 문헌리뷰에서 한계를 쓰는 법", "Brify 구조맵에서 한계를 따로 표시하기"]],
  ["paper-summary-for-presentation", "논문 요약을 발표 준비에 활용하는 법", "논문 발표를 준비할 때는 전체 요약보다 연구 배경, 질문, 방법, 결과, 한계의 발표 흐름을 잡아야 합니다.", ["논문 발표 요약", "논문 발표 준비", "논문 정리", "논문 요약"], "발표용 논문 정리는 혼자 읽기 위한 요약과 다릅니다. 청중이 따라올 수 있는 순서로 논문의 구조를 다시 배열해야 합니다.", ["발표용 논문 요약이 다른 이유", "발표 흐름을 먼저 잡기", "배경과 연구 질문 연결하기", "방법과 결과를 짧게 설명하기", "Brify 구조맵으로 발표 흐름 만들기"]],
  ["what-to-check-after-ai-paper-organization", "논문 정리를 AI에게 맡겨도 내가 꼭 해야 하는 일", "AI가 논문을 정리해도 연구 질문, 방법, 결과, 한계, 내 목적과의 연결은 사용자가 확인해야 합니다.", ["AI 논문 정리", "AI 논문 요약", "논문 정리 AI", "논문 요약"], "AI는 논문 정리 속도를 높여주지만, 연구 판단을 대신하지는 않습니다. 사용자가 반드시 확인해야 할 항목이 있습니다.", ["AI 논문 정리가 편한 이유", "그래도 사용자가 확인해야 할 5가지", "내 연구 목적과 연결하기", "원문 근거를 다시 보는 습관", "Brify로 AI 정리를 검토 가능한 구조로 남기기"]],
];

for (const [slug, title, excerpt, keywords, intro, headings] of additionalPosts) {
  posts.push({
    locale: "ko",
    slug,
    title,
    excerpt,
    seo_keywords: [...keywords, "논문 구조화", "AI 구조맵", "Brify"],
    intro,
    sections: headings.map((heading, index) => ({
      heading,
      paragraphs: [
        `${heading}는 ${title}에서 가장 먼저 확인해야 할 지점입니다. 논문을 단순히 짧게 줄이는 것이 아니라, 어떤 정보가 어떤 근거와 연결되는지 보는 데 초점을 맞춰야 합니다.`,
        index === headings.length - 1
          ? "Brify는 이 과정을 구조맵으로 정리해 줍니다. 연구 질문, 방법, 결과, 한계처럼 나중에 다시 확인해야 하는 항목을 분리해서 볼 수 있기 때문에 논문을 실제 작업에 활용하기 쉽습니다."
          : "이 항목을 따로 정리해두면 나중에 리포트, 발표, 문헌리뷰에서 필요한 근거를 더 빠르게 찾을 수 있습니다. 요약문 하나보다 구조화된 메모가 더 오래 남습니다.",
      ],
    })),
    closing: `${title}의 핵심은 논문을 빠르게 줄이는 것이 아니라 다시 검토할 수 있게 정리하는 것입니다. Brify에서 논문을 구조맵으로 바꾸면 요약 이후의 확인과 활용까지 이어갈 수 있습니다.`,
  });
}

async function getExistingPost(post) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,translation_group_id")
    .eq("locale", post.locale)
    .eq("slug", post.slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

const results = [];

for (const post of posts) {
  const existing = await getExistingPost(post);
  const markdown = post.markdown ?? buildMarkdown(post);
  const payload = {
    locale: post.locale,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    seo_keywords: post.seo_keywords,
    image_url: imageUrl,
    markdown: insertDefaultBodyImage(markdown),
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
