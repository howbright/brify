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

const posts = [
  {
    locale: "ko",
    slug: "how-to-organize-research-paper",
    title: "논문 정리, 어디서부터 시작해야 할까",
    excerpt:
      "논문 정리를 시작할 때 제목, 초록, 연구 질문, 방법, 결과, 한계를 어떤 순서로 봐야 하는지 설명합니다.",
    seo_keywords: [
      "논문 정리",
      "논문 정리 방법",
      "논문 읽는 법",
      "논문 구조화",
      "연구 논문 정리",
      "대학원생 논문 정리",
      "AI 구조맵",
      "Brify",
    ],
    markdown: `논문을 처음 읽을 때 가장 흔한 실수는 중요한 문장을 밑줄 치는 것부터 시작하는 것입니다. 밑줄은 도움이 될 수 있지만, 논문 정리의 출발점은 문장 수집이 아니라 **연구의 구조를 파악하는 일**입니다.

논문은 보통 하나의 주장으로만 이루어져 있지 않습니다. 연구 배경, 문제 제기, 연구 질문, 방법, 결과, 해석, 한계가 서로 연결되어 있습니다. 그래서 논문을 제대로 정리하려면 "무슨 말을 했는가"보다 먼저 "어떤 흐름으로 그 말을 했는가"를 봐야 합니다.

## 논문 정리가 어려운 이유

논문은 일상적인 글보다 정보 밀도가 높습니다. 한 문단 안에도 개념, 선행연구, 방법론, 결과 해석이 섞여 있을 수 있습니다. 그래서 처음부터 모든 문장을 같은 무게로 읽으면 금방 지칩니다.

또 논문은 결론만 읽는다고 충분히 이해되지 않습니다. 같은 결론이라도 어떤 데이터를 썼는지, 어떤 방법으로 분석했는지, 어떤 한계를 인정했는지에 따라 의미가 달라집니다.

논문 정리가 어려운 진짜 이유는 내용이 길어서가 아니라, **중요한 정보들이 서로 떨어져 있기 때문**입니다. 초록에는 핵심 주장이 있고, 방법론에는 신뢰도의 근거가 있고, 결과에는 데이터가 있고, 논의에는 연구자의 해석이 있습니다.

## 논문을 처음 볼 때 확인할 5가지

논문을 정리할 때는 다음 순서로 보는 것이 좋습니다.

1. 이 논문이 다루는 문제는 무엇인가
2. 연구 질문이나 가설은 무엇인가
3. 어떤 데이터와 방법을 사용했는가
4. 결과는 무엇을 보여주는가
5. 연구자는 어떤 한계를 인정하는가

이 다섯 가지를 먼저 잡으면 논문 전체를 다 읽기 전에도 큰 흐름이 보입니다. 반대로 이 구조 없이 문장만 요약하면, 나중에 다시 읽을 때 "그래서 이 논문이 왜 중요했지?"라는 질문이 남습니다.

## 초록만 읽고 끝내면 놓치는 것

초록은 논문을 빠르게 훑는 데 유용합니다. 하지만 초록은 압축된 문장입니다. 연구 방법의 세부 조건, 데이터의 범위, 분석의 제한점, 결과 해석의 조심스러운 부분은 충분히 드러나지 않을 수 있습니다.

특히 리포트나 문헌리뷰에 논문을 활용하려면 초록만으로는 부족합니다. 초록의 결론을 그대로 가져오면 연구자가 실제로 어떤 조건에서 그 결론을 냈는지 놓칠 수 있습니다.

초록은 입구입니다. 논문 정리는 그 입구를 지나 본문 구조를 확인하는 일입니다.

## 연구 질문, 방법, 결과를 연결해서 보는 법

논문을 정리할 때 가장 중요한 연결은 **연구 질문 -> 방법 -> 결과**입니다.

연구 질문은 이 논문이 답하려는 문제입니다. 방법은 그 질문에 답하기 위해 선택한 절차입니다. 결과는 그 방법을 통해 나온 관찰입니다. 이 세 가지가 연결되지 않으면 논문 요약은 단편적인 정보 목록이 됩니다.

예를 들어 어떤 논문이 "생성형 AI가 대학생의 보고서 작성 과정에 어떤 영향을 주는가"를 묻는다면, 방법론에서는 어떤 학생을 대상으로 했는지, 어떤 데이터를 모았는지, 어떤 기준으로 분석했는지를 봐야 합니다. 결과에서는 단순히 "도움이 되었다"가 아니라 어떤 과정에서 도움이 되었고 어떤 부분에서 문제가 생겼는지를 확인해야 합니다.

## 논문 정리 노트에 반드시 남겨야 할 것

논문 정리 노트에는 최소한 다음 정보가 있어야 합니다.

- 한 문장 핵심 요약
- 연구 질문
- 주요 개념
- 연구 대상과 데이터
- 연구 방법
- 주요 결과
- 연구 한계
- 내 연구나 과제와 연결되는 지점

이 항목들은 나중에 논문을 다시 찾을 때 특히 중요합니다. 단순 요약문만 있으면 다시 원문을 열어야 할 일이 많지만, 구조화된 정리 노트가 있으면 필요한 지점을 더 빨리 찾을 수 있습니다.

## Brify 구조맵으로 논문 흐름을 정리하는 방식

Brify는 논문을 짧은 요약문 하나로 줄이는 대신, 논문의 흐름을 구조맵으로 펼쳐서 볼 수 있게 돕습니다. 연구 질문, 방법, 결과, 한계처럼 서로 다른 정보가 어디에 있는지 분리해서 볼 수 있고, 필요한 부분을 다시 편집하거나 공유할 수 있습니다.

논문을 많이 읽어야 하는 사람에게 중요한 것은 "한 번 빨리 읽기"가 아니라 "나중에 다시 찾아볼 수 있게 남기기"입니다. 그래서 논문 정리는 요약보다 구조가 중요합니다.

## 마무리

논문 정리는 문장을 줄이는 일이 아닙니다. 연구가 어떤 질문에서 출발했고, 어떤 방법을 거쳐, 어떤 결과와 한계에 도달했는지 파악하는 일입니다.

긴 논문을 읽을 때 요약만으로 부족하다고 느꼈다면, Brify에서 논문을 구조맵으로 정리해보세요. 논문의 흐름과 근거를 더 분명하게 따라갈 수 있습니다.`,
  },
  {
    locale: "ko",
    slug: "why-paper-summary-is-not-enough",
    title: "논문 요약만으로는 부족한 이유",
    excerpt:
      "논문 요약은 빠르게 내용을 훑는 데 유용하지만 연구의 논리와 근거를 놓치기 쉽습니다. 구조화가 필요한 이유를 정리합니다.",
    seo_keywords: [
      "논문 요약",
      "논문 요약 한계",
      "AI 논문 요약",
      "논문 분석",
      "논문 구조화",
      "연구 논문 요약",
      "AI 구조맵",
      "Brify",
    ],
    markdown: `논문 요약은 분명히 유용합니다. 긴 논문을 빠르게 훑고, 주제가 내 관심사와 맞는지 판단하고, 핵심 결론을 먼저 확인할 수 있기 때문입니다.

하지만 논문을 실제로 이해하거나 리포트, 문헌리뷰, 연구 아이디어에 활용하려면 요약만으로는 부족한 순간이 많습니다. 논문 요약은 대체로 "무슨 내용인가"를 알려주지만, "왜 그런 결론이 나왔는가"를 충분히 보여주지는 못합니다.

## 논문 요약이 도와주는 것

논문 요약의 가장 큰 장점은 속도입니다. 초록과 결론을 읽는 것보다 더 빠르게 핵심 내용을 파악할 수 있고, 여러 논문 중 어떤 것을 깊게 읽을지 고르는 데 도움이 됩니다.

특히 처음 접하는 분야에서는 요약이 진입 장벽을 낮춰줍니다. 낯선 용어가 많은 논문도 요약을 먼저 읽으면 큰 주제와 결론을 잡을 수 있습니다.

그래서 논문 요약은 나쁜 방법이 아닙니다. 문제는 요약을 최종 정리로 착각할 때 생깁니다.

## 논문 요약이 자주 놓치는 것

논문 요약은 보통 핵심 주장과 결과를 중심으로 압축됩니다. 이 과정에서 다음 정보가 약해질 수 있습니다.

- 연구 질문의 정확한 범위
- 선행연구와의 차이
- 데이터의 성격과 한계
- 방법론의 조건
- 결과의 예외나 제한
- 연구자가 조심스럽게 표현한 부분

이런 정보들은 논문을 신뢰할 수 있는지 판단하는 데 중요합니다. 그런데 짧은 요약문에서는 자주 생략됩니다.

## 연구 방법과 결과를 분리해서 보면 생기는 문제

논문에서 결과는 방법과 분리해서 이해할 수 없습니다. 같은 결과라도 어떤 대상, 어떤 데이터, 어떤 분석 방법으로 나왔는지에 따라 의미가 달라집니다.

예를 들어 어떤 AI 교육 논문이 "학습 효율이 높아졌다"고 말한다고 해도, 그것이 단기 실험인지, 자기보고식 설문인지, 실제 성적 데이터인지에 따라 해석은 달라집니다.

요약문은 이런 조건을 짧게 줄이거나 생략할 수 있습니다. 그래서 논문 요약만 보고 결론을 인용하면, 연구의 범위를 과장하거나 맥락을 놓칠 위험이 있습니다.

## 논문을 다시 찾아봐야 하는 순간

논문 요약을 읽고도 결국 원문을 다시 열어야 하는 순간이 있습니다.

- 정확한 실험 조건이 궁금할 때
- 표나 그림의 세부 결과를 확인해야 할 때
- 연구 한계를 인용해야 할 때
- 내 주장에 맞는 근거 문장을 찾아야 할 때
- 여러 논문을 비교해야 할 때

이 순간에는 한 문단 요약보다 구조화된 정리가 훨씬 유용합니다. 어디에 어떤 정보가 있는지 보여주는 정리가 있어야 다시 찾는 시간이 줄어듭니다.

## 요약보다 구조맵이 필요한 경우

논문을 단순히 훑는 목적이라면 요약으로 충분할 수 있습니다. 하지만 다음 상황이라면 구조맵이 더 적합합니다.

- 논문을 리포트나 발표에 활용해야 할 때
- 문헌리뷰를 위해 여러 논문을 비교해야 할 때
- 연구 방법과 결과를 정확히 이해해야 할 때
- 나중에 다시 찾아볼 연구 노트가 필요할 때
- AI가 요약한 내용이 맞는지 검토해야 할 때

구조맵은 논문의 정보를 한 덩어리로 압축하지 않습니다. 연구의 흐름을 나누어 보여주기 때문에, 사용자가 필요한 지점을 다시 확인하기 쉽습니다.

## Brify가 논문 요약과 다른 점

Brify는 논문을 짧은 문장 몇 개로만 줄이는 방향이 아닙니다. 논문의 큰 흐름과 세부 항목을 구조맵으로 보여주는 데 초점을 둡니다.

이 방식은 논문을 많이 읽는 사람에게 특히 중요합니다. 논문 한 편을 읽고 끝나는 것이 아니라, 나중에 다시 찾고, 비교하고, 발표하고, 리포트에 활용해야 하기 때문입니다.

Brify 구조맵에서는 논문의 주요 흐름을 확인하고, 필요한 부분을 편집하고, 공유할 수 있습니다. 요약은 시작점이고, 구조화는 실제 활용을 위한 정리입니다.

## 마무리

논문 요약은 빠른 이해를 돕습니다. 하지만 논문의 논리, 근거, 한계까지 이해하려면 요약만으로는 부족합니다.

논문을 제대로 활용해야 한다면 "이 논문이 무엇을 말하는가"에서 멈추지 말고 "어떤 근거와 구조로 말하는가"까지 확인해야 합니다. Brify에서 논문을 구조맵으로 정리하면 그 흐름을 더 분명하게 따라갈 수 있습니다.`,
  },
  {
    locale: "ko",
    slug: "ai-paper-summary-tool-checklist",
    title: "AI 논문 요약 도구를 고를 때 봐야 할 기준",
    excerpt:
      "AI 논문 요약 도구를 고를 때 요약 품질, 원문 근거, 구조화, 편집 가능성, 공유 기능을 확인해야 합니다.",
    seo_keywords: [
      "AI 논문 요약",
      "AI 논문 요약 도구",
      "논문 요약 AI",
      "논문 정리 AI",
      "논문 요약 툴",
      "논문 구조화 도구",
      "AI 구조맵",
      "Brify",
    ],
    markdown: `AI 논문 요약 도구는 점점 많아지고 있습니다. PDF를 올리면 요약해주는 도구, 질문에 답해주는 도구, 핵심 문장을 뽑아주는 도구도 있습니다.

하지만 논문을 실제로 읽고 활용해야 하는 사람에게 중요한 기준은 단순히 "요약이 짧고 자연스러운가"가 아닙니다. 좋은 AI 논문 요약 도구는 논문을 빠르게 줄이는 것을 넘어, 사용자가 다시 검토하고 활용할 수 있게 만들어야 합니다.

## AI 논문 요약 도구가 많아진 이유

논문은 길고 어렵습니다. 특히 대학원생, 연구자, 리포트를 준비하는 학생은 짧은 시간 안에 여러 논문을 읽어야 합니다. 그래서 AI 논문 요약 도구에 대한 수요가 커졌습니다.

AI는 초록, 서론, 결론을 빠르게 압축하고, 낯선 분야의 큰 흐름을 잡는 데 도움을 줄 수 있습니다. 문제는 모든 요약 도구가 같은 수준의 검토 가능성을 제공하지는 않는다는 점입니다.

논문은 정확성이 중요합니다. 그래서 AI가 만든 요약을 그대로 믿기보다, 어떤 근거에서 나온 요약인지 확인할 수 있어야 합니다.

## 기준 1: 요약 품질이 충분한가

가장 먼저 볼 것은 기본 요약 품질입니다. 좋은 요약은 단순히 짧은 문장이 아니라 다음 요소를 포함해야 합니다.

- 연구 주제
- 연구 질문
- 사용한 방법
- 핵심 결과
- 연구 한계
- 활용 가능성

이 중 결과만 있고 방법과 한계가 빠져 있다면, 리포트나 연구 노트에 쓰기에는 위험할 수 있습니다.

## 기준 2: 원문 근거를 확인할 수 있는가

AI 논문 요약에서 가장 중요한 기준 중 하나는 원문 근거 확인입니다. 요약문이 그럴듯해도 원문에서 어떤 부분을 바탕으로 했는지 확인할 수 없다면 신뢰하기 어렵습니다.

논문은 표현이 조심스럽습니다. "가능성을 시사한다"와 "증명했다"는 다릅니다. AI가 이 차이를 과감하게 줄여버리면, 사용자는 논문의 의미를 과장해서 이해할 수 있습니다.

따라서 좋은 도구는 요약 결과를 원문과 다시 연결할 수 있어야 합니다.

## 기준 3: 논문 구조를 보여주는가

논문은 보통 서론, 선행연구, 방법, 결과, 논의, 결론으로 구성됩니다. 좋은 AI 논문 요약 도구는 이 구조를 무시하지 않아야 합니다.

한 문단 요약은 빠르지만, 나중에 다시 보기 어렵습니다. 반면 구조화된 정리는 연구 질문과 방법, 결과와 한계를 따로 볼 수 있게 해줍니다.

특히 여러 논문을 비교해야 하는 경우에는 구조가 중요합니다. 논문마다 같은 기준으로 정리되어 있어야 비교가 가능하기 때문입니다.

## 기준 4: 편집할 수 있는가

AI가 만든 결과는 초안입니다. 사용자는 자신의 연구 목적, 수업 과제, 발표 흐름에 맞게 수정해야 합니다.

그래서 결과를 편집할 수 있는지도 중요합니다. 복사만 가능한 요약보다, 구조를 유지하면서 제목, 항목, 메모를 수정할 수 있는 도구가 실제 작업에는 더 유용합니다.

논문 정리는 한 번 생성하고 끝나는 것이 아니라, 읽으면서 계속 다듬는 과정입니다.

## 기준 5: 저장하고 공유할 수 있는가

논문을 읽는 목적은 혼자 이해하는 것에서 끝나지 않는 경우가 많습니다. 발표 자료를 만들거나, 팀원과 공유하거나, 나중에 문헌리뷰에서 다시 찾아야 합니다.

따라서 AI 논문 요약 도구는 저장과 공유도 중요합니다. 링크로 공유하거나, 정리 결과를 다시 열어볼 수 있어야 연구 노트로 쓸 수 있습니다.

## Brify가 지향하는 AI 논문 정리 방식

Brify는 논문을 단순히 짧게 요약하는 것보다, 논문의 흐름을 구조맵으로 정리하는 데 초점을 둡니다.

논문을 구조맵으로 보면 연구 질문, 방법, 결과, 한계가 분리되어 보입니다. 사용자는 필요한 항목을 편집하고, 나중에 다시 찾아보고, 공유할 수 있습니다.

AI 논문 요약 도구를 고를 때는 "얼마나 짧게 줄여주는가"보다 "내가 다시 검토하고 활용할 수 있는가"를 봐야 합니다.

## 마무리

AI 논문 요약은 빠른 출발점이 될 수 있습니다. 하지만 좋은 도구는 속도만 제공하지 않습니다. 원문 근거, 구조화, 편집 가능성, 공유 가능성까지 제공해야 실제 공부와 연구에 도움이 됩니다.

논문을 단순 요약문으로 끝내고 싶지 않다면, Brify에서 논문을 구조맵으로 정리해보세요. 요약 이후의 검토와 활용까지 이어갈 수 있습니다.`,
  },
];

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
  const payload = {
    ...post,
    image_url: imageUrl,
    markdown: insertDefaultBodyImage(post.markdown),
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
