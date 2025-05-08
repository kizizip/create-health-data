// 건강 데이터 생성기
// 실행 방법:
// 1. 이 코드를 Node.js 환경에서 실행하고 결과를 파일에 저장: node generate_health_data.js > health_data.jsonl
// 2. 생성된 health_data.jsonl 파일에는 5000개의 정상 건강 데이터가 포함됩니다.

// 날짜 생성 함수
function generateRandomDate(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const randomDate = new Date(
    startDate.getTime() +
      Math.random() * (endDate.getTime() - startDate.getTime())
  );
  return randomDate.toISOString().split("T")[0] + "T00:00:00";
}

// 범위 내 랜덤 수 생성 함수
function randomInRange(min, max, decimals = 2) {
  const random = Math.random() * (max - min) + min;
  return Number(random.toFixed(decimals));
}

// 날짜를 로컬 시간 기준으로 포맷팅하는 함수
function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T00:00:00`;
}

// 한 세트의 건강 데이터 생성 (5일 기간, 1-5개의 측정 데이터)
function generateHealthDataSet() {
  // 기본 변수 설정
  const height = randomInRange(155, 190, 1);
  const baseWeight = randomInRange(50, 85, 1);
  // const periodDays = 5; // 5일 기간 고정

  // 시작 날짜 생성 (2022-2025년 사이)
  const startYear = 2022 + Math.floor(Math.random() * 4);
  const startMonth = Math.floor(Math.random() * 12) + 1;
  const startDay = Math.floor(Math.random() * 28) + 1;

  // 시작 날짜 객체 생성 (로컬 시간 기준)
  const startDateObj = new Date(startYear, startMonth - 1, startDay);
  const startDate = formatLocalDate(startDateObj);

  // 끝 날짜 계산 (시작일로부터 4일 후, 총 5일 기간)
  const endDateObj = new Date(startYear, startMonth - 1, startDay + 4);
  const endDate = formatLocalDate(endDateObj);

  // 개인 기준 값 설정 (이 값 주변에서 변동)
  const baseBF = randomInRange(18, 27, 2); // 체지방률 기준값
  const baseMM = randomInRange(42, 48, 2); // 근육량 기준값
  const baseBW = randomInRange(50, 56, 2); // 체수분률 기준값
  const baseProt = randomInRange(17, 20, 2); // 단백질 기준값
  const baseMin = randomInRange(4.0, 5.0, 2); // 무기질 기준값
  const baseHR = randomInRange(55, 75, 1); // 심박수 기준값
  const baseO2 = randomInRange(96, 99, 1); // 산소포화도 기준값
  const baseSys = randomInRange(110, 135, 1); // 수축기 혈압 기준값
  const baseDia = randomInRange(70, 85, 1); // 이완기 혈압 기준값

  // 측정 일수 결정 (1-5일)
  const measurementDays = Math.floor(Math.random() * 5) + 1;

  // 5일 기간 내의 모든 가능한 날짜 생성
  const possibleDates = [];
  for (let i = 0; i < 5; i++) {
    const tempDate = new Date(startYear, startMonth - 1, startDay + i);
    possibleDates.push(formatLocalDate(tempDate));
  }

  // 랜덤하게 측정 날짜 선택
  const selectedDates = [];
  const availableDates = [...possibleDates];

  for (let i = 0; i < measurementDays; i++) {
    const randomIndex = Math.floor(Math.random() * availableDates.length);
    selectedDates.push(availableDates[randomIndex]);
    availableDates.splice(randomIndex, 1);
  }

  // 선택된 날짜 정렬
  selectedDates.sort();

  // 개인 일별 데이터 생성
  const dailyData = [];

  for (const currentDate of selectedDates) {
    // 약간의 변동성 추가
    const bf = randomInRange(baseBF - 0.3, baseBF + 0.3, 2);
    const mm = randomInRange(baseMM - 0.3, baseMM + 0.3, 2);
    const bw = randomInRange(baseBW - 0.3, baseBW + 0.3, 2);
    const prot = randomInRange(baseProt - 0.2, baseProt + 0.2, 2);
    const min = randomInRange(baseMin - 0.1, baseMin + 0.1, 2);
    const wt = randomInRange(baseWeight - 0.5, baseWeight + 0.5, 1);
    const hr = Math.round(randomInRange(baseHR - 2, baseHR + 2, 0));
    const o2 = Math.round(randomInRange(baseO2 - 1, baseO2 + 1, 0));
    const sys = Math.round(randomInRange(baseSys - 2, baseSys + 2, 0));
    const dia = Math.round(randomInRange(baseDia - 2, baseDia + 2, 0));

    dailyData.push({
      bf,
      mm,
      bw,
      prot,
      min,
      wt,
      ht: height,
      hr,
      o2,
      sys,
      dia,
      d: currentDate,
    });
  }

  // 평균, 최소, 최대값 계산
  const wsum = {
    avg: {},
    min: {},
    max: {},
  };

  // 각 지표별 평균, 최소, 최대값 계산
  const metrics = [
    "bf",
    "mm",
    "bw",
    "prot",
    "min",
    "wt",
    "ht",
    "hr",
    "o2",
    "sys",
    "dia",
  ];

  metrics.forEach((metric) => {
    const values = dailyData.map((day) => day[metric]);

    // 지표별로 다른 소수점 자릿수 적용
    let decimals = 2; // 기본값
    if (metric === "wt" || metric === "ht") {
      decimals = 1; // 체중, 신장은 소수점 1자리
    } else if (
      metric === "hr" ||
      metric === "o2" ||
      metric === "sys" ||
      metric === "dia"
    ) {
      decimals = 0; // 심박수, 산소포화도, 혈압은 정수
    }

    wsum.avg[metric] = Number(
      (values.reduce((a, b) => a + b, 0) / values.length).toFixed(decimals)
    );
    wsum.min[metric] = Number(Math.min(...values).toFixed(decimals));
    wsum.max[metric] = Number(Math.max(...values).toFixed(decimals));
  });

  // 건강 데이터용 100개 독립 메뉴 목록
  const foodRecommendations = [
    "연어와 퀴노아 샐러드",
    "팥 현미밥과 된장국",
    "흑임자 연두부",
    "잡곡밥과 버섯전골",
    "삼치구이와 된장찌개",
    "호두 사과 샐러드",
    "북어 야채죽",
    "고등어 조림과 현미밥",
    "표고버섯 들깨탕",
    "더덕구이와 보리밥",
    "우엉차와 녹두죽",
    "메밀국수와 두부 김무침",
    "낙지 연포탕",
    "통밀빵과 블루베리 요거트",
    "오리 훈제와 현미밥",
    "두부 스테이크",
    "잡곡밥과 된장국",
    "견과류 샐러드",
    "닭가슴살 샐러드",
    "퀴노아 샐러드",
    "구운 연어와 브로콜리",
    "현미밥과 갈치구이",
    "토마토 달걀 샐러드",
    "참치 아보카도 덮밥",
    "곤약 냉면",
    "콩나물국과 보리밥",
    "토마토 두부 샐러드",
    "단호박 영양밥",
    "오트밀 요거트",
    "연근 우엉차",
    "삶은 달걀과 아보카도 토스트",
    "그릭 요거트와 견과류",
    "닭가슴살 현미 덮밥",
    "감자 닭가슴살 수프",
    "시금치 달걀 프리타타",
    "고구마 현미밥",
    "연어 아보카도 샐러드",
    "해초 두부 무침",
    "버섯 영양밥",
    "소고기 야채 볶음",
    "통곡물 크래커와 훈제연어",
    "렌틸콩 수프",
    "검은콩 퀴노아 볼",
    "브로콜리 치즈 구이",
    "흰살생선 스튜",
    "토마토 바질 계란찜",
    "팽이버섯 두부 국",
    "쪽파 달걀말이",
    "청국장과 보리밥",
    "콜리플라워 볶음밥",
    "달래 된장국",
    "고사리 나물과 오곡밥",
    "병아리콩 샐러드",
    "참치 김밥",
    "김치 닭가슴살 볶음밥",
    "닭고기 야채 수프",
    "블루베리 그릭요거트 파르페",
    "달걀 현미 리조또",
    "바나나 아몬드 스무디",
    "쇠고기 미역국",
    "키위 그릭요거트",
    "돼지고기 생姜焼き(쇼가야키)",
    "연두부 부추 무침",
    "황태 콩나물국",
    "두부 김치 볶음",
    "차돌박이 샐러드",
    "시금치 프로틴 스무디",
    "닭가슴살 김치찌개",
    "콩나물 얼갈이 된장국",
    "우유 오트밀 죽",
    "미역 냉국",
    "계란 토마토 볶음밥",
    "꽁치 무조림",
    "양배추 달걀 샐러드",
    "삼계탕",
    "치아씨드 요거트 볼",
    "바나나 땅콩버터 통밀 토스트",
    "단호박 스프",
    "황태 콩나물 해장국",
    "타이 치킨 샐러드",
    "현미 채소 영양밥",
    "홍합 미역국",
    "참치 계란 샌드위치",
    "두부 채소 냉국",
    "새우 아보카도 롤",
    "통밀 파스타 샐러드",
    "계란 고구마 샐러드",
    "연어 구이와 찐 채소",
    "닭가슴살 데리야끼 덮밥",
    "해산물 토마토 스튜",
    "두부 샐러드와 참깨 드레싱",
    "오이 냉국",
    "닭고기 야채 카레",
    "시금치 리코타 오믈렛",
    "단호박 닭가슴살 구이",
    "연어 크림 파스타",
  ];

  // 랜덤 음식 추천 선택 수정 부분
  // 기존에는 미리 정의된 조합에서 선택했지만, 이제는 3개 메뉴를 랜덤하게 선택
  function getRandomFoodRecommendations() {
    // 섞인 배열에서 3개 항목 선택
    const shuffled = [...foodRecommendations].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }

  // 랜덤 음식 추천
  const foodSet = getRandomFoodRecommendations();

  // 최종 데이터 구성
  const input = {
    ws: startDate,
    we: endDate,
    dm: dailyData,
  };

  const output = {
    wsum,
    anom: [],
    cmt: {
      g: "모든 지표가 평균 범위 내에 있습니다.",
    },
    fd: foodSet,
  };

  return {
    input: `### 질문:\n${JSON.stringify(
      input
    )}\n### 지시사항:\nwsum, anom, cmt.g(평균 대비 %), fd 생성\n### 답변:\n`,
    output: JSON.stringify(output),
  };
}

// 5000개의 데이터 생성하여 JSONL 형태로 출력
function generateNormalDataSets() {
  for (let i = 0; i < 5000; i++) {
    const dataSet = generateHealthDataSet();
    console.log(JSON.stringify(dataSet));
  }
}

// 실행
generateNormalDataSets();
