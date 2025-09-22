// app/api/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { originalToReactFlow } from "@/app/lib/diagram/reactflow-auto-layout";
//서버에서 쓸 supabase 클라이언트를 생성함. 

export const dynamic = "force-dynamic";
//이 라우트를 항상 동적으로 처리 캐시로 정적 서빙하지 않도록 지시. 


export function isReactFlow(v: any) {
  return v && typeof v === "object" && Array.isArray(v.nodes) && Array.isArray(v.edges);
}
//React flow 스냅샾처럼 보이는지 확인 즉 { nodes: [], edges: [] } 와 비슷한 형태인지 확인하는 함수 

export function isOriginalArray(v: any) {
  return Array.isArray(v) && v.length > 0 && typeof v[0] === "object" && "id" in v[0];
}
// 평평한 배열이나 각 요소는 object 이고 id 속성이 있음 

export function isOriginalObject(v: any) {
  return v && typeof v === "object" && v.type === "original" && Array.isArray(v.nodes);
}
// 오브젝트이고, 거기에 type:"original" 이라는 속성이 들어있고, nodes: [] 가 있음. 

// 간단 레이아웃: depth/순서 기반으로 좌표 배치
// 이 함수는 원본에서 React Flow를 뽑아내는 함수이다. 결과는 object인데 type:"reactflow" 라는 속성을 가지고 있고, nodes:[], edges: [] 속성도 가지고 있음. 
export function originalToReactFlow_old(original: any): { version: 1; type: "reactflow"; nodes: any[]; edges: any[] } {
  const items = isOriginalObject(original) ? original.nodes : (isOriginalArray(original) ? original : []);
  // original이 original 타입 속성이 있으면 original.nodes이 items 이고, 이게 id속성이 있는 오브잭트의 베열이면 그 자체를 그냥 반환하고 아니면 []를 반환한다. 
  // 즉 items는 nodes이네!! (@질문@: 그러면 isOriginalObject===true 일때, edges는 어떻게 되는거야? 무시하는거야? )
  
  if (!Array.isArray(items) || items.length === 0) {
    return { version: 1, type: "reactflow", nodes: [], edges: [] };
  }
  // items가 array가 아니거나, 길이가 0이면 빈 배열을 리턴한다. 

  // id -> item 맵 //nodes중에서도 id로 node를 바로 찾을수 있게 map을 만든다. 
  const map = new Map(items.map((n: any) => [n.id, n]));
  // child 집합
  const childSet = new Set<string>();
  // 그리고 각 노드의 children 필드를 검색해서 childSet에 다 넣어둔다. 
  items.forEach((n: any) => (n.children || []).forEach((cid: string) => childSet.add(cid)));
  // 루트 목록
  //그리고 items중에서도 childeSet에 없는 애들은 당연히 root이므로 루트의 목록을 뽑을 수 있게 된다. roots는 node와 같은 타입이겠지. 
  const roots = items.filter((n: any) => !childSet.has(n.id));

  // BFS로 depth 계산 + 레벨별 순서
  const depth = new Map<string, number>(); // depth는 뭘까?  아마도 각 id가 몇번째 depth인지 저장해 놓는것인가? 
  const order = new Map<string, number>(); // order는 뭘까? 각 depth중에서도 order가 몇번째인지 저장해놓는것인가? 
  const levels: string[][] = []; // levels는 뭘까? 

  const queue: string[] = roots.map((r: any) => r.id); // 응? 이 queue라고 하는것은 루트들의 id의 리스트인가? 
  roots.forEach((r: any, idx: number) => {
    depth.set(r.id, 0); //내 추측이 맞았네, 일단 root들은 depth가 0이지. 
    if (!levels[0]) levels[0] = [];//이렇다면 levels라고 하는건 이중배열이네? 
    order.set(r.id, levels[0].length);//특정 노드에 대해서 레벨[0]의 length를 넣어주고. 즉, 특정 노드가 각 댑스에서 몇번째 노드인지를 알 수 있는것이네 
    levels[0].push(r.id);// 그지, 레벨에 넣어주어야지~ 이렇게 해서 가로적으로 노드상황을 알수가 있네, 
  });

  while (queue.length) {// queue는 roots의 id의 리스트였는데, 루트를 돌면서 뭐를 하려는걸까? 
    const pid = queue.shift()!; // 일단 이 배열에서 하나씩 꺼내. 
    const p = map.get(pid); //어? map은 뭐였지? 이 map은 id로 노드를 바로 찾을 수 있는 map이었구나. 그러면 p라고 하는건 해당 pid를 id로 가진 루트노드중의 하나이구나. 
    const d = depth.get(pid) ?? 0; // 아 이건, 그 노드의 depth를 알수 있는거네, 당연히 0이겠지~
    (p?.children || []).forEach((cid: string) => { // 이번엔 그 root노드들의 children을 돌아보자. 
      if (!map.has(cid)) return; // 만약에 그 cid가 map에없다면 말도 안되는 상황이지만 return해버리자. 끝내는거야. 
      if (!depth.has(cid)) {//그리고 cid가 depth에 없다면? 당연히 처음 돌때는 없겠지, 아까 root node에 대한 depth만 처리해줬으니까. 
        depth.set(cid, d + 1); // 그러지 자기 부모보다 depth가 1 추가 되겠지 
        if (!levels[d + 1]) levels[d + 1] = []; // 그리고 해당 levels에 배열이 없다면 빈배열을 일단 세팅해주고. 
        order.set(cid, levels[d + 1].length); //해당 node가 그 level에서의 순서가 어떻게 되는지를 계산한다. 
        levels[d + 1].push(cid);// 그리고 levels에도 자기 레벨부분에 이 node의 id를 넣어준다. 
        queue.push(cid);// 그리고 queue에 이 cid를 넣어준다. //그러면 아까는 root를 shift했으니까 root는 shift해서 처음부터 하나씩 빼서 자식들을 조사해서 자식들은 맨 뒤에 넣어주는거네 ?
      }
    });
  }// 그리고 이 작업은 queue가 다 없어질때까지 하는거니까 모든 node에 대헤 다 해주는거고, depth 와 order과 level이 싹 정리되겠네 

  // 좌표 배치
  const X_STEP = 320; // 이건 무슨 좌표지? 
  const Y_STEP = 120;

  const nodes = items.map((n: any) => { // items들도 node들인데 이걸을 다시 map을 통해서 내가 이용하고 싶은형태로 재조합해주네. 그리고 위에서 얻은 값을 이용해서 다시 세팅해주는구나. 
    const d = depth.get(n.id) ?? 0; // 이것은 해당 노드의 depth
    const k = order.get(n.id) ?? 0; // 이것은 각 레벨에서의 해당 노드의 order순서. 
    return {
      id: n.id, // id
      type: "custom", // type은 "custom"이네 
      position: { x: k * X_STEP, y: d * Y_STEP }, // 헐 [질문] position을 직접 계산해줘? x는 order가 증가함에 따라 커지고 y는 depth가 증가함에 따라 커지네. 왜 이걸 계산해야하지? 레이아웃 계산해주는 라이브러리를 쓰고있지 않아? 
      data: {
        nodeType: n.nodeType,// 아 nodeType은 이게 title인지 descrption인지 적어놓는 거잖아. 
        title: n.title, 
        description: n.description,
        label: n.title || n.description || "", // 기본 label 보강 음?? 이건 왜 필요한지 모르겠는걸? 
      },
    };
  });

  const edges: any[] = []; // 자 이제 edges를 해볼까? 
  items.forEach((n: any) => { // 역시 node들을 돌아보자. 
    (n.children || []).forEach((cid: string) => { // 그리고 내부 루프로 자식을을 돌아보자 
      if (!map.has(cid)) return;
      edges.push({
        id: `e-${n.id}-${cid}`, // 자식들을 돌면서 부모의 아이디와 자식의 아이디를 연력하는 edges를 생성해서 넣어주자. 
        source: n.id,
        target: cid,
      });
    });
  });

  return { version: 1, type: "reactflow", nodes, edges }; // 그리고 여기서 만든 nodes와 edges를 type "reactflow"로 해서 반환하자 
}// 이 함수의 이름은 originalToReactFlow 이다 알았나? 

export function toReactFlowState(raw: any) { //그렇다면 여기서 raw는 originalToReactFlow 를 통과한 함수네. 아닌가? 그런데 소스를 보면 
  //originalToReactFlow를 고치면 무조건 형식이 version과 type도 생기게 되는데, 그게 없다는 뜻은, nodes와 edges만 가진 어떤 object 가 존재한다는 뜻인가? 
  //그래서 version과 type을 채워줘야한다는 뜻인가? 
  if (!raw) return null;
  if (isReactFlow(raw)) {
    // type/version 누락 시 보강
    return {
      version: raw.version ?? 1,
      type: raw.type ?? "reactflow",
      nodes: raw.nodes,
      edges: raw.edges,
    };
  }
 
  return null;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id"); //id는 ? 파라미터로 들어오지 
  if (!id) {
    return NextResponse.json({ error: "요약 ID가 필요합니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(); // 그리고 user는 로그인 되어있어야한다. 

  if (authError || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("summaries")
    .select(`
      id, user_id, created_at, source_type, source_title, source_url,
      summary_text, detailed_summary_text, diagram_json, temp_diagram_json,
      status, lang, is_public, updated_at, category,
      summary_keywords(
        keyword:keywords(id, name, lang)
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("❌ Supabase 에러:", error);
    return NextResponse.json({ error: "요약을 불러오지 못했습니다." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "요약을 찾을 수 없습니다." }, { status: 404 });
  }

  // 키워드 평탄화
  const keywords =
    data.summary_keywords?.map((k: any) => ({
      id: k?.keyword?.id,
      name: k?.keyword?.name,
      lang: k?.keyword?.lang,
    }))?.filter(Boolean) ?? [];

  // 1) temp(편집본) → reactflow 스냅샷으로 강제
  const overlayRF = toReactFlowState(data.temp_diagram_json);
  //즉 overlayRF는 temap_diagram_json에서 type과 version이 추가되었다고 보면 된다. db에는 type과 version이 안들어가있음. 

  // 2) original(원본 트리) → reactflow로 변환
  const originalRF = await originalToReactFlow(data.diagram_json ?? data.diagram_json);
  //temp_diagram_json이 있다면 굳지 안해줘도 될 것 같은데 왜 해주는지는 잘 모르겠다. 중요한건 위치들이 다 계산되어 들어가 있다는 사실이다. 

  //그러면 여기까지 했을때, overlayRF는 편집본이고, originalRF는 오리지널인데 두개의 형식, 타입이 똑같다. 아 그러나.. 각 노드의 타입이 다른것 같은데? 
  // 아 temp속에 속성이 훨~씬 더 많다. 

  // 3) 우선순위: overlayRF(nodes>0) > originalRF(nodes>0) > 빈 값
  const effective =
    (overlayRF && overlayRF.nodes?.length ? overlayRF : null) ??
    (originalRF && originalRF.nodes?.length ? originalRF : null) ??
    { version: 1, type: "reactflow", nodes: [], edges: [] };

  const diagram_source =
    overlayRF && overlayRF.nodes?.length ? "overlay" :
    originalRF && originalRF.nodes?.length ? "original" : "none";

  const result = {
    ...data,
    keywords,
    // 참고용(원본은 그대로 유지)
    original_diagram_json: data.diagram_json ?? null,
    temp_diagram_json: overlayRF, // reactflow로 강제
    effective_diagram_json: effective, // ✅ 항상 reactflow
    diagram_source,
  };

  delete (result as any).summary_keywords;

  const res = NextResponse.json(result);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
