export async function summarizeTextOnly(userText: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`🎓 서준석 원장님 인터뷰 요약

🔹 1. 공부는 쉽지 않았다
공부가 늘 고통스럽고 힘들었다. 하기 싫지만 어쩔 수 없이 해야 했음.

최고의 효율을 내기 위해 자기만의 마인드 컨트롤법을 찾음.

🔹 2. 절실함과 성장 마인드셋
상위권과 그렇지 않은 학생들의 결정적 차이는 ‘절실함’.

절실함은 부끄러운 것이 아니라, 성장의 원동력.

실패를 반복하면서도 도전하고 깨뜨리는 사고회로가 중요함.

패배를 빠르게 극복하는 습관을 통해 자기 효능감을 키움.

🔹 3. 공부 습관 만드는 법
처음에는 엉덩이 붙이고 앉아 있는 연습부터 시작.

만화책 보며 버티기 → 점점 공부 시간 늘림.

중요한 건 "책상 앞에 얼마나 오래 앉아 있느냐".

🔹 4. 아침 공부 루틴
새벽 시간대의 집중력이 탁월함.

아침 6~7시 공부는 하루 전체 효율을 올림.

습관화되면 5시에 일어나 공부도 가능.

🔹 5. 복습의 3단계
강의 내용 훑기 (개념 이해)

개념 응용 문제 풀기

문제 해결 안 될 때 → 다시 개념으로 복습

강의만 듣고 이해했다고 착각하는 것이 문제.
진정한 이해는 문제를 풀 때 드러남.

🔹 6. 공부를 지속하게 만드는 트릭
집중력이 떨어지면 만화책 or 낮잠으로 충전.

휴식 후 몰려오는 죄책감으로 재집중 유도.

집중력은 유한하므로, 충전과 회복 전략이 필요함.

🔹 7. 암기법과 장기 기억 전략
단기 기억 → 장기 기억으로 넘어가려면:

수면 충분히 확보

일주일 간격의 복습

시험 공부 팁:

2주 전 훑기 → 1주 전 정독 → 전날 마무리

🔹 8. 공부를 즐기게 된 계기
어릴 적 문제를 풀었을 때의 쾌감과 성취감이 동기부여가 됨.

친구들에게 수학 잘하는 아이로 인정받는 경험이 가장 강력한 동기였음.

📚 핵심 메시지
🎯 공부는 힘들지만, 성취감이 반복되면 습관이 되고 즐거워진다.
노력의 쾌감, 실패를 극복하는 마인드, 반복적인 습관이 성공의 열쇠!

`);
    }, 1500); // 1.5초 지연
  });
}

export async function summarizeTextOnly2(userText: string): Promise<string> {
  const prompt = `다음 글을 간결하게 요약해줘:\n\n${userText}`;

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

export const summarizeAndGenerateTree = async (userText: string): Promise<any> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: "root",
          label: "서준석 원장님 인터뷰 요약",
          children: [
            {
              id: "1",
              label: "공부는 쉽지 않았다",
              children: [
                { id: "1-1", label: "공부가 고통스럽고 힘들었다" },
                { id: "1-2", label: "자기만의 마인드 컨트롤법 찾음" }
              ]
            },
            {
              id: "2",
              label: "절실함과 성장 마인드셋",
              children: [
                { id: "2-1", label: "절실함은 성장의 원동력" },
                { id: "2-2", label: "패배 극복 → 자기 효능감 향상" }
              ]
            },
            {
              id: "3",
              label: "공부 습관 만드는 법",
              children: [
                { id: "3-1", label: "엉덩이 붙이고 앉는 연습부터" },
                { id: "3-2", label: "만화책으로 공부 시간 늘리기" }
              ]
            },
            {
              id: "4",
              label: "아침 공부 루틴",
              children: [
                { id: "4-1", label: "새벽 집중력 최고" },
                { id: "4-2", label: "습관화되면 5시 기상 가능" }
              ]
            },
            {
              id: "5",
              label: "복습의 3단계",
              children: [
                { id: "5-1", label: "1단계: 강의 내용 훑기" },
                { id: "5-2", label: "2단계: 개념 응용 문제 풀이" },
                { id: "5-3", label: "3단계: 문제 해결 안 되면 개념 복습" }
              ]
            },
            {
              id: "6",
              label: "공부 지속 트릭",
              children: [
                { id: "6-1", label: "집중력 떨어지면 만화책/낮잠" },
                { id: "6-2", label: "죄책감으로 재집중 유도" }
              ]
            },
            {
              id: "7",
              label: "암기와 장기 기억 전략",
              children: [
                { id: "7-1", label: "충분한 수면과 일주일 간격 복습" },
                { id: "7-2", label: "3단계 암기법: 2주 전 훑기 → 1주 전 정독 → 전날 마무리" }
              ]
            },
            {
              id: "8",
              label: "공부를 즐기게 된 계기",
              children: [
                { id: "8-1", label: "어릴 적 문제 해결의 성취감" },
                { id: "8-2", label: "친구들의 인정을 받는 쾌감" }
              ]
            },
            {
              id: "9",
              label: "핵심 메시지",
              children: [
                { id: "9-1", label: "공부는 힘들지만, 반복되는 성취감이 습관으로 이어짐" },
                { id: "9-2", label: "노력, 실패 극복, 습관이 성공의 열쇠" }
              ]
            }
          ]
        });
      }, 1500);
    });
  };

export async function summarizeAndGenerateTree2(userText: string): Promise<any> {
  const systemPrompt = `
  너는 긴 글을 읽고 핵심 내용을 트리 형태로 정리하는 요약 도우미야.
  아래와 같은 JSON 구조로 요약해줘:
  
  {
    "id": "root",
    "label": "요약 제목",
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
