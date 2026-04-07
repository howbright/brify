export async function summarizeTextOnly(userText: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`이 영상은 **정신건강의학과 의사와 범죄 프로파일러**가 함께 **소시오패스와 사이코패스에 대한 실질적인 사례와 특징, 대응 방법** 등을 대화 형식으로 설명한 콘텐츠입니다. 주요 내용을 핵심 요점으로 구조화하면 다음과 같습니다:

---

### 🔍 1. 소시오패스 vs 사이코패스의 차이
- **의학적 정식 명칭은 아님**, 하지만 사회에서 범죄 피해 설명에 자주 사용됨.
- **소시오패스**: 사회 규범을 무시하고 타인을 착취함. 감정적 공감 능력이 결핍됨.
- **사이코패스**: 감정 없는 접근, 잔혹함에도 **양심·죄책감 없음**.
- 구분은 **학문적 논란**이 있으며, 케이스마다 다름.

---

### 👁️‍🗨️ 2. 대표적 사례
- **테드 번디**: 연쇄살인범. 구속 중 결혼. 법정에서 스스로 변호함.
- **국내 사례**: 유명 사건이나 학폭, 성폭력 가해자가 반사회적 성향을 보이며, **사회적 지위로 피해자보다 우위에 서는** 케이스.

---

### 🧠 3. 공통된 특징
- **양심 결여**, 타인을 단지 도구처럼 사용.
- **공감 능력 부족**, 타인의 고통에 무감각.
- **규범 무시**, 충동적, 공격적, 책임감 없음.
- 말투와 표정에서 의도적으로 정상처럼 보이려 하지만 특정 자극에 본성이 드러나기도 함.

---

### 🧪 4. 진단 기준
- **반사회적 인격장애 (ASPD)**로 분류됨.
- 18세 이상, 15세 이전부터 행동 문제 존재 여부 확인.
- 사기, 충동성, 공감 결여, 반복된 규범 위반 등 3개 이상 해당 시 진단 가능.

---

### ⚠️ 5. 피해자 대응법
- **자책하지 말 것**: 그들의 행동은 피해자의 잘못이 아님.
- **정서적·물리적 거리 두기**: 정보를 노출하지 말고 무덤덤하게 대처.
- **경계 분명히**: ‘싫다’, ‘안 된다’는 말을 명확히 하고, 사적 영역 지키기.
- **주변인과 전문가의 도움 필요**: 가스라이팅 등에서 벗어나기 위한 **결절점(탈출 계기)** 마련이 핵심.

---

### 🏢 6. 직장 내 소시오패스 대응
- 단순히 회피로 끝나지 않음. 법적 대응과 심리적 방어 필요.
- 퇴사 후에도 괴롭힘이 지속될 수 있어 적극적인 **법적·행정적 보호** 요청이 중요.

---

### 🎯 핵심 메시지
> 이들은 타인의 심리를 기가 막히게 파악하고 조종한다.  
> 따라서 **도움을 청하는 것을 두려워하지 말고**, **자신을 지키는 것이 최우선**이다.

---

필요하다면, “간단한 카드 뉴스 형식 구조화”이나 “10문장 구조화”도 도와줄게요.
`);
    }, 1500); // 1.5초 지연
  });
}

export async function summarizeTextOnly2(userText: string): Promise<string> {
  const prompt = `다음 글을 간결하게 핵심정리해줘:\n\n${userText}`;

  const res = await fetch("/api/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: "이 글을 보기쉽게 정리해줘",
      user: prompt,
    }),
  });

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  console.log("📦 GPT 응답 내용:", content);

  if (!content) {
    console.error("GPT 응답이 비어있습니다:", json);
    throw new Error("GPT 응답을 받아오지 못했습니다.");
  }

  try {
    return JSON.parse(content);
  } catch (e) {
    console.error("❌ JSON 파싱 오류:", content);
    throw new Error("GPT 응답을 파싱할 수 없습니다.");
  }
}

export const summarizeAndGenerateTree = async (
  userText: string
): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: "root",
        label: "서준석 원장님 인터뷰 핵심정리",
        children: [
          {
            id: "1",
            label: "공부는 쉽지 않았다",
            children: [
              { id: "1-1", label: "공부가 고통스럽고 힘들었다" },
              { id: "1-2", label: "자기만의 마인드 컨트롤법 찾음" },
            ],
          },
          {
            id: "2",
            label: "절실함과 성장 마인드셋",
            children: [
              { id: "2-1", label: "절실함은 성장의 원동력" },
              { id: "2-2", label: "패배 극복 → 자기 효능감 향상" },
            ],
          },
          {
            id: "3",
            label: "공부 습관 만드는 법",
            children: [
              { id: "3-1", label: "엉덩이 붙이고 앉는 연습부터" },
              { id: "3-2", label: "만화책으로 공부 시간 늘리기" },
            ],
          },
          {
            id: "4",
            label: "아침 공부 루틴",
            children: [
              { id: "4-1", label: "새벽 집중력 최고" },
              { id: "4-2", label: "습관화되면 5시 기상 가능" },
            ],
          },
          {
            id: "5",
            label: "복습의 3단계",
            children: [
              { id: "5-1", label: "1단계: 강의 내용 훑기" },
              { id: "5-2", label: "2단계: 개념 응용 문제 풀이" },
              { id: "5-3", label: "3단계: 문제 해결 안 되면 개념 복습" },
            ],
          },
          {
            id: "6",
            label: "공부 지속 트릭",
            children: [
              { id: "6-1", label: "집중력 떨어지면 만화책/낮잠" },
              { id: "6-2", label: "죄책감으로 재집중 유도" },
            ],
          },
          {
            id: "7",
            label: "암기와 장기 기억 전략",
            children: [
              { id: "7-1", label: "충분한 수면과 일주일 간격 복습" },
              {
                id: "7-2",
                label: "3단계 암기법: 2주 전 훑기 → 1주 전 정독 → 전날 마무리",
              },
            ],
          },
          {
            id: "8",
            label: "공부를 즐기게 된 계기",
            children: [
              { id: "8-1", label: "어릴 적 문제 해결의 성취감" },
              { id: "8-2", label: "친구들의 인정을 받는 쾌감" },
            ],
          },
          {
            id: "9",
            label: "핵심 메시지",
            children: [
              {
                id: "9-1",
                label: "공부는 힘들지만, 반복되는 성취감이 습관으로 이어짐",
              },
              { id: "9-2", label: "노력, 실패 극복, 습관이 성공의 열쇠" },
            ],
          },
        ],
      });
    }, 1500);
  });
};

export async function summarizeAndGenerateTree2(
  userText: string
): Promise<any> {
  const systemPrompt = `
  너는 긴 글을 읽고 핵심 내용을 트리 형태로 정리하는 핵심정리 도우미야.
  아래와 같은 JSON 구조로 핵심정리해줘:
  
  {
    "id": "root",
    "label": "핵심정리 제목",
    "children": [
      {
        "id": "1",
        "label": "첫번째 핵심",
        "children": [...]
      }
    ]
  }`;

  const res = await fetch("/api/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: systemPrompt,
      user: userText,
    }),
  });

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  console.log("📦 GPT 응답 내용:", content);

  if (!content) {
    console.error("GPT 응답이 비어있습니다:", json);
    throw new Error("GPT 응답을 받아오지 못했습니다.");
  }

  try {
    return JSON.parse(json.content);
  } catch (e) {
    console.error("❌ JSON 파싱 오류:", e);
    throw new Error("GPT 응답을 파싱할 수 없습니다.");
  }
}

export async function summarizeBoth(
  userText: string
): Promise<{ text: string; tree: any }> {
  const [text, tree] = await Promise.all([
    summarizeTextOnly(userText),
    summarizeAndGenerateTree(userText),
  ]);
  return { text, tree };
}
