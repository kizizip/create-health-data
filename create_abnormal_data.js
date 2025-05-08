// 개인 건강 패턴 분석기 - 현실적인 데이터 생성 및 분석
// 실행 방법:
// 1. 이 코드를 Node.js 환경에서 실행하고 결과를 파일에 저장: node realistic_health_analyzer.js > realistic_health_analysis.jsonl
// 2. 생성된 realistic_health_analysis.jsonl 파일에는 현실적인 건강 데이터의 추이 및 특이사항 분석이 포함됩니다.

// 파일 시스템 모듈 추가
const fs = require('fs');
const { start } = require('repl');

// 날짜 생성 함수
function generateRandomDate(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
  return randomDate.toISOString().split('T')[0] + 'T00:00:00';
}

// 범위 내 랜덤 수 생성 함수
function randomInRange(min, max, decimals = 2) {
  const random = Math.random() * (max - min) + min;
  return Number(random.toFixed(decimals));
}

// 지표 코드와 한국어 명칭 매핑
const metricKoreanNames = {
  "bf": "체지방률",
  "mm": "근육량",
  "bw": "체수분률",
  "prot": "단백질",
  "min": "무기질",
  "wt": "체중",
  "ht": "신장",
  "hr": "심박수",
  "o2": "산소포화도",
  "sys": "수축기혈압",
  "dia": "이완기혈압"
};

// 지표별 단위 반환 함수
function getUnit(metric) {
  switch(metric) {
    case "bf": case "bw": return "%";
    case "mm": case "wt": return "kg";
    case "prot": case "min": return "%";
    case "hr": return "bpm";
    case "o2": return "%";
    case "sys": case "dia": return "mmHg";
    default: return "";
  }
}

// 변동성 범위 정의 (지표별 정상적인 변동 범위) - 현실적인 값
const normalVariation = {
  "bf": 0.5,    // 체지방률의 주간 평균 대비 허용 변동 범위 (±0.5%)
  "mm": 0.3,    // 근육량의 주간 평균 대비 허용 변동 범위 (±0.3kg)
  "bw": 1.0,    // 체수분률의 주간 평균 대비 허용 변동 범위 (±1.0%)
  "prot": 0.2,  // 단백질의 주간 평균 대비 허용 변동 범위 (±0.2%)
  "min": 0.1,   // 무기질의 주간 평균 대비 허용 변동 범위 (±0.1%)
  "wt": 1.0,    // 체중의 주간 평균 대비 허용 변동 범위 (±1.0kg)
  "hr": 8,      // 심박수의 주간 평균 대비 허용 변동 범위 (±8bpm)
  "o2": 1,      // 산소포화도의 주간 평균 대비 허용 변동 범위 (±1%)
  "sys": 8,     // 수축기혈압의 주간 평균 대비 허용 변동 범위 (±8mmHg)
  "dia": 5      // 이완기혈압의 주간 평균 대비 허용 변동 범위 (±5mmHg)
};

// 확장된 식단 추천 목록
const foodRecommendations = [
    // 균형 잡힌 식단 (모든 영양소 균형)
    "현미밥과 된장찌개, 구운 생선, 채소 모듬",
    "통밀빵 아보카도 토스트와 그릭 요거트",
    "퀴노아 샐러드와 닭가슴살",
    "연어 스테이크와 찐 브로콜리, 현미",
    "토마토 달걀 볶음과 잡곡밥",
    "두부 채소 덮밥",
    "닭가슴살 감자 구이와 샐러드",
    "오트밀과 과일, 견과류",
    "참치 야채 비빔밥",
    "통밀 파스타와 토마토 소스, 그린 샐러드",
    "버섯 리소토와 그린 샐러드",
    "쌀국수와 채소, 저지방 육수",
    "삼색 채소 쌈밥과 들깨탕",
    "모듬 해산물 스프와 통밀 빵",
    "닭가슴살 야채 카레와 현미밥",
    
    // 체중 관리 식단
    "곤약 야채 볶음밥",
    "닭가슴살 샐러드와 통밀빵",
    "두부 스크램블과 야채 스틱",
    "현미밥과 버섯 두부 볶음",
    "오이 토마토 달걀 샌드위치",
    "단호박 영양 스튜",
    "해초 두부 샐러드",
    "채소 프리타타",
    "배추 닭가슴살 쌈",
    "시금치 달걀찜과 잡곡밥",
    "곤약 비빔국수",
    "오이 냉국과 콩나물밥",
    "닭가슴살 샐러드 랩",
    "훈제 연어 아보카도 샐러드",
    "저탄수화물 스크램블 에그와 야채",
    
    // 근육 관리 식단
    "소고기 두부 스테이크와 찐 채소",
    "닭가슴살 도시락 (채소, 현미 포함)",
    "연어 아보카도 덮밥",
    "삶은 계란 2개와 샐러드, 통곡물빵",
    "우유 단백질 스무디와 견과류",
    "돼지고기 김치찌개와 잡곡밥",
    "콩비지찌개와 현미밥",
    "달걀 샌드위치와 그릭 요거트",
    "닭가슴살 카레라이스",
    "고등어구이와 두부 된장국, 채소 무침",
    "소고기 미역국과 현미밥",
    "닭가슴살 브로콜리 볶음밥",
    "참치 통조림 샐러드와 고구마",
    "그릭 요거트 블루베리 프로틴 볼",
    "렌틸콩 닭가슴살 수프",
    
    // 수분 균형 식단
    "수박 키위 요거트 볼",
    "오이 냉국과 잡곡밥",
    "토마토 오이 샐러드와 닭가슴살",
    "미역오이냉국과 현미밥",
    "수박 오이 스무디",
    "열무 냉국과 보리밥",
    "토마토 계란 수프",
    "미역 무 냉국과 오이무침",
    "콩나물 국밥과 오이 김치",
    "참외 오이 주스와 통곡물빵",
    "오이 토마토 냉스프",
    "백김치 물냉면",
    "수박 블루베리 스무디 볼",
    "오이 우엉 냉채와 보리밥",
    "토마토 셀러리 주스와 치아씨드",
    
    // 단백질 강화 식단
    "소고기 채소 볶음과 현미밥",
    "닭가슴살 튀김 없는 치킨 샐러드",
    "참치 삶은 달걀 샐러드와 통밀빵",
    "두부 깻잎 구이와 채소 쌈",
    "돼지고기 불고기와 야채볶음",
    "소고기 콩나물 국밥",
    "그릭 요거트와 견과류, 과일",
    "계란 아보카도 토스트",
    "연어 스크램블 에그와 현미밥",
    "치킨 브로콜리 볶음밥",
    "콩가루 두부 부침과 버섯볶음",
    "계란 닭가슴살 김밥",
    "훈제 오리 샐러드",
    "소고기 콩나물 덮밥",
    "콩 견과류 에너지바와 그릭요거트",
    
    // 혈압 관리 식단
    "현미밥과 가지 된장찌개, 청경채 볶음",
    "토마토 오이 샐러드와 등푸른 생선구이",
    "당근 시금치 스무디와 통곡물빵",
    "마늘 버섯 영양밥과 두부국",
    "삼겹살 대신 안심 구이와 채소",
    "현미밥과 버섯 들깨탕",
    "저염 된장국과 청국장, 잡곡밥",
    "콩나물 무침과 두부조림, 잡곡밥",
    "시금치 달걀 볶음밥",
    "호두 바나나 오트밀",
    "오트밀 고구마죽",
    "양파 마늘 팽이버섯 구이",
    "저염 연두부 비지찌개",
    "호박고구마 채소 스튜",
    "검은콩 수수밥과 시래기국",
    
    // 면역력 강화 식단
    "마늘 생강 홍삼 영양밥",
    "달래 시금치 두부 된장국",
    "표고버섯 영지버섯 약선탕",
    "생강차와 견과류 오트밀",
    "도라지 배 생강 차와 통밀빵",
    "토마토 마늘 닭가슴살 수프",
    "브로콜리 마늘 볶음과 현미밥",
    "양배추 당근 도라지 샐러드",
    "홍삼 대추 영양밥과 된장국",
    "녹황색 채소 과일 스무디",
    "단호박 닭가슴살 영양찜",
    "연근 우엉 연어구이",
    "고구마 잣 죽",
    "발효식품 모듬(요거트, 김치, 청국장)",
    "오메가3 풍부한 견과류와 과일 샐러드",
    
    // 에너지 증진 식단
    "견과류 아보카도 오트밀",
    "바나나 단호박 스무디",
    "고구마밥과 단호박찜",
    "퀴노아 영양밥과 된장국",
    "바나나 땅콩버터 통밀 토스트",
    "귀리 요거트 파르페",
    "치아시드 아사이 스무디",
    "단호박 꿀고구마 샐러드",
    "블루베리 바나나 오트밀",
    "꿀 생강차와 잣 호두 간식",
    "바나나 브라운라이스 샐러드",
    "단호박 연근 찜",
    "고구마 콩 에너지바",
    "귀리 바나나 팬케이크",
    "다크초콜릿 견과류 그래놀라",
    
    // 심장 건강 식단
    "연어 아몬드 샐러드",
    "오메가3 풍부한 등푸른 생선구이",
    "호두 아마씨드 오트밀",
    "올리브오일 채소 구이",
    "아보카도 토마토 달걀 샐러드",
    "베리류 요거트 파르페",
    "다크 초콜릿 견과류 그래놀라",
    "귀리 아마씨드 스무디",
    "카카오닙스 바나나 요거트",
    "올리브오일 마늘 토마토 파스타",
    "견과류 블루베리 샐러드",
    "아보카도 연어 샌드위치",
    "검은콩 퀴노아 샐러드",
    "시금치 아몬드 연어구이",
    "토마토 마늘 스크램블에그",
    
    // 소화 개선 식단
    "발효 요거트와 과일, 견과류",
    "오트밀 바나나 생강차",
    "파파야 요거트 스무디",
    "발효 김치와 현미밥",
    "된장찌개와 무채 나물",
    "코코넛워터 바나나 스무디",
    "키위 파인애플 요거트",
    "브로콜리 스프와 통밀빵",
    "생강 레몬 허브티와 크래커",
    "파파야 리치 과일 샐러드",
    "케일 파인애플 스무디",
    "양배추 사과 주스",
    "청국장과 곤드레나물밥",
    "물김치와 고구마밥",
    "프로바이오틱스 요거트 볼"
  ];

// 날짜가 유효한지 검사하는 함수 (강화된 버전)
function validateDate(date, startDate, endDate) {
  const dateObj = new Date(date);
  const startObj = new Date(startDate);
  const endObj = new Date(endDate);
  
  // 날짜를 YYYY-MM-DD 형식으로 비교
  const dateStr = dateObj.toISOString().split('T')[0];
  const startStr = startObj.toISOString().split('T')[0];
  const endStr = endObj.toISOString().split('T')[0];
  
  return dateStr >= startStr && dateStr <= endStr;
}


// 특이점 생성 함수 - 더 현실적인 변화 패턴 생성
function generateRealisticAnomaly(metric, baseValue, dayIndex, totalDays, patternType) {
  // 특이점 생성을 위한 계수
  const anomalyFactors = {
    "bf": { max: 2.0, trend: 0.4 },    // 체지방 최대 2배, 추세 0.4배 변동
    "mm": { max: 1.5, trend: 0.3 },    // 근육량 최대 1.5배, 추세 0.3배 변동
    "bw": { max: 1.8, trend: 0.4 },    // 체수분 최대 1.8배, 추세 0.4배 변동
    "prot": { max: 1.5, trend: 0.3 },  // 단백질 최대 1.5배, 추세 0.3배 변동
    "min": { max: 1.5, trend: 0.25 },  // 무기질 최대 1.5배, 추세 0.25배 변동
    "wt": { max: 1.5, trend: 0.2 },    // 체중 최대 1.5배, 추세 0.2배 변동
    "hr": { max: 2.0, trend: 0.4 },    // 심박수 최대 2배, 추세 0.4배 변동
    "o2": { max: 1.5, trend: 0.2 },    // 산소포화도 최대 1.5배, 추세 0.2배 변동
    "sys": { max: 2.0, trend: 0.4 },   // 수축기혈압 최대 2배, 추세 0.4배 변동
    "dia": { max: 2.0, trend: 0.4 }    // 이완기혈압 최대 2배, 추세 0.4배 변동
  };
  
  const factor = anomalyFactors[metric] || { max: 1.5, trend: 0.3 };
  
  // 패턴 유형별 적용
  if (patternType === 0) {
    // 급증/급감 패턴 (특정 날짜에 큰 변화)
    // 15% 확률로만 급변 발생 (더 현실적인 빈도)
    if (Math.random() > 0.85) {
      // 급증 또는 급감
      const direction = Math.random() > 0.5 ? 1 : -1;
      // 최대 변동 폭 제한
      const maxChange = normalVariation[metric] * factor.max;
      return baseValue + (direction * randomInRange(normalVariation[metric], maxChange, 2));
    }
  } else if (patternType === 1) {
    // 추세 패턴 (꾸준한 증가 또는 감소)
    const direction = Math.random() > 0.5 ? 1 : -1; // 1=상승, -1=하락
    // 완만한 변화 곡선 - 전체 일수를 기준으로 정규화
    const normalizedDay = dayIndex / totalDays;
    return baseValue + (direction * normalVariation[metric] * normalizedDay * totalDays * factor.trend);
  } else if (patternType === 2) {
    // 변동성 패턴 (불규칙한 변화)
    // 불규칙 변동의 크기 제한
    const variationMultiplier = Math.sin(dayIndex * 2.5) * 1.5; 
    return baseValue + (normalVariation[metric] * variationMultiplier);
  }
  
  // 기본적으로는 정상 범위 내 변동
  return baseValue + randomInRange(-normalVariation[metric], normalVariation[metric], 2);
}

// 특이점 감지 함수 - 현실적인 임계값 설정
function detectSignificantDeviation(value, avgValue, metric) {
  // 각 지표별 의미 있는 변화로 간주할 임계값 (정상 변동의 배수)
  const significanceThresholds = {
    "bf": 2.5,    // 체지방률은 정상 변동의 2.5배 이상 차이 시 특이점
    "mm": 2.5,    // 근육량은 정상 변동의 2.5배 이상 차이 시 특이점
    "bw": 2.5,    // 체수분률은 정상 변동의 2.5배 이상 차이 시 특이점
    "prot": 2.5,  // 단백질은 정상 변동의 2.5배 이상 차이 시 특이점
    "min": 3.0,   // 무기질은 정상 변동의 3.0배 이상 차이 시 특이점
    "wt": 2.0,    // 체중은 정상 변동의 2.0배 이상 차이 시 특이점
    "hr": 2.0,    // 심박수는 정상 변동의 2.0배 이상 차이 시 특이점
    "o2": 3.0,    // 산소포화도는 정상 변동의 3.0배 이상 차이 시 특이점
    "sys": 2.0,   // 수축기혈압은 정상 변동의 2.0배 이상 차이 시 특이점
    "dia": 2.0    // 이완기혈압은 정상 변동의 2.0배 이상 차이 시 특이점
  };
  
  const threshold = significanceThresholds[metric] || 2.5;
  
  // 평균과의 차이가 임계값을 초과하는지 확인
  return Math.abs(value - avgValue) > (normalVariation[metric] * threshold);
}

// 변동성 패턴 감지 함수 - 현실적인 임계값 설정
function detectExcessiveVariability(values, metric) {
  if (values.length < 3) return false;
  
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  // 표준편차 계산
  const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length);
  const cv = (stdDev / avg) * 100; // 변동계수(CV)
  
  // 각 지표별 예상 변동계수의 임계값 - 현실적인 값으로 조정
  const cvThresholds = {
    "bf": 2.0,    // 체지방률 변동계수 임계값
    "mm": 1.5,    // 근육량 변동계수 임계값
    "bw": 2.0,    // 체수분률 변동계수 임계값
    "prot": 1.5,  // 단백질 변동계수 임계값
    "min": 2.0,   // 무기질 변동계수 임계값
    "wt": 1.0,    // 체중 변동계수 임계값
    "hr": 7.0,    // 심박수 변동계수 임계값
    "o2": 1.5,    // 산소포화도 변동계수 임계값
    "sys": 7.0,   // 수축기혈압 변동계수 임계값
    "dia": 6.0    // 이완기혈압 변동계수 임계값
  };
  
  const threshold = cvThresholds[metric] || 3.0;
  const expectedCV = (normalVariation[metric] / avg) * 100 * threshold;
  
  return cv > expectedCV;
}

// 개인 건강 데이터 분석 및 패턴 생성
function generateHealthTrendAnalysis() {
  try {
    // 기본 변수 설정
    const height = randomInRange(155, 190, 1);
    const baseWeight = randomInRange(50, 85, 1);
    
    // 5일 기간 설정
    const startYear = 2022 + Math.floor(Math.random() * 4);
    const startMonth = Math.floor(Math.random() * 12) + 1;
    const startDay = Math.floor(Math.random() * 28) + 1;
    
    const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}T00:00:00`;
    
    // 끝 날짜 계산 (시작일로부터 4일)
    const endDateObj = new Date(startDate);
    endDateObj.setDate(endDateObj.getDate() + 5); // 시작일 포함 5일 기간
    const endDate = endDateObj.toISOString().split('T')[0] + 'T00:00:00';
    
    
    // 개인 기준 값 설정
    const baseBF = randomInRange(18, 35, 2);
    const baseMM = randomInRange(35, 55, 2);
    const baseBW = randomInRange(45, 65, 2);
    const baseProt = randomInRange(15, 22, 2);
    const baseMin = randomInRange(3.5, 6.0, 2);
    const baseHR = randomInRange(55, 95, 1);
    const baseO2 = randomInRange(94, 99, 1);
    const baseSys = randomInRange(100, 145, 1);
    const baseDia = randomInRange(65, 95, 1);
    
    // 1-3개의 랜덤 변화 패턴 선택 (더 현실적인 빈도)
    // 50% 확률로 1개, 30% 확률로 2개, 20% 확률로 3개의 변화 패턴
    let variationsCount;
    const randomValue = Math.random();
    if (randomValue < 0.5) {
      variationsCount = 1;
    } else if (randomValue < 0.8) {
      variationsCount = 2;
    } else {
      variationsCount = 3;
    }
    
    const allMetrics = ['bf', 'mm', 'bw', 'prot', 'min', 'wt', 'hr', 'o2', 'sys', 'dia'];
    const metrics = [...allMetrics]; // 복사본 생성
    const selectedMetrics = [];
    
    // 변화 패턴을 적용할 지표 선택
    while (selectedMetrics.length < variationsCount && metrics.length > 0) {
      const randomIndex = Math.floor(Math.random() * metrics.length);
      selectedMetrics.push(metrics[randomIndex]);
      metrics.splice(randomIndex, 1);
    }
    
    // 변화 패턴 유형 선택 (각 선택된 지표별)
    const patternTypes = {};
    selectedMetrics.forEach(metric => {
      // 0=급증/급감, 1=추세(상승/하락), 2=변동성
      // 패턴 유형 확률 조정: 추세(50%), 급변(30%), 변동성(20%)
      const randomValue = Math.random();
      if (randomValue < 0.5) {
        patternTypes[metric] = 1; // 추세 패턴
      } else if (randomValue < 0.8) {
        patternTypes[metric] = 0; // 급증/급감 패턴
      } else {
        patternTypes[metric] = 2; // 변동성 패턴
      }
    });
    
    // 5일 기간 내에 3-5개의 측정 데이터 생성
    const daysCount = Math.floor(Math.random() * 3) + 3; // 3-5일간의 데이터
    
    // 측정 날짜 선택 (중복 없이)
    const allDays = [0, 1, 2, 3, 4]; // 0일차부터 4일차까지 (5일)
    const selectedDays = [];
    
    // 랜덤하게 날짜 선택
    while (selectedDays.length < daysCount) {
      const randomIndex = Math.floor(Math.random() * allDays.length);
      const selectedDay = allDays[randomIndex];
      selectedDays.push(selectedDay);
      allDays.splice(randomIndex, 1); // 선택된 날짜 제거
    }
    
    // 선택된 날짜 정렬
    selectedDays.sort((a, b) => a - b);
    
    // 개인 일별 데이터 생성
    const dailyData = [];
    const metricTimeSeries = {};
    
    // 각 지표별 시계열 데이터 초기화
    allMetrics.forEach(metric => {
      metricTimeSeries[metric] = [];
    });
    
    // 기본 데이터 생성
    for (const dayOffset of selectedDays) {
      const currentDateObj = new Date(startDate);
      currentDateObj.setDate(currentDateObj.getDate() + dayOffset);
      const currentDate = currentDateObj.toISOString().split('T')[0] + 'T00:00:00';
      
      // 기본 약간의 변동성을 가진 데이터 생성 - 소수점 자릿수 통일
      let bf = randomInRange(baseBF - normalVariation.bf, baseBF + normalVariation.bf, 2); // 체지방률: 소수점 2자리
      let mm = randomInRange(baseMM - normalVariation.mm, baseMM + normalVariation.mm, 2); // 근육량: 소수점 2자리
      let bw = randomInRange(baseBW - normalVariation.bw, baseBW + normalVariation.bw, 2); // 체수분률: 소수점 2자리
      let prot = randomInRange(baseProt - normalVariation.prot, baseProt + normalVariation.prot, 2); // 단백질: 소수점 2자리
      let min = randomInRange(baseMin - normalVariation.min, baseMin + normalVariation.min, 2); // 무기질: 소수점 2자리
      let wt = randomInRange(baseWeight - normalVariation.wt, baseWeight + normalVariation.wt, 1); // 체중: 소수점 1자리
      let hr = Math.round(randomInRange(baseHR - normalVariation.hr, baseHR + normalVariation.hr, 0)); // 심박수: 정수
      let o2 = Math.round(randomInRange(baseO2 - normalVariation.o2, baseO2 + normalVariation.o2, 0)); // 산소포화도: 정수
      let sys = Math.round(randomInRange(baseSys - normalVariation.sys, baseSys + normalVariation.sys, 0)); // 수축기혈압: 정수
      let dia = Math.round(randomInRange(baseDia - normalVariation.dia, baseDia + normalVariation.dia, 0)); // 이완기혈압: 정수
      
      // 선택된 지표에 패턴 적용
      for (const metric of selectedMetrics) {
        const patternType = patternTypes[metric];
        
        let baseValue;
        switch (metric) {
          case "bf": baseValue = bf; break;
          case "mm": baseValue = mm; break;
          case "bw": baseValue = bw; break;
          case "prot": baseValue = prot; break;
          case "min": baseValue = min; break;
          case "wt": baseValue = wt; break;
          case "hr": baseValue = hr; break;
          case "o2": baseValue = o2; break;
          case "sys": baseValue = sys; break;
          case "dia": baseValue = dia; break;
        }
        
        // 특이점 생성 함수 호출
        const modifiedValue = generateRealisticAnomaly(metric, baseValue, selectedDays.indexOf(dayOffset), selectedDays.length, patternType);
        
        // 수정된 값 적용
        switch (metric) {
          case "bf": bf = modifiedValue; break;
          case "mm": mm = modifiedValue; break;
          case "bw": bw = modifiedValue; break;
          case "prot": prot = modifiedValue; break;
          case "min": min = modifiedValue; break;
          case "wt": wt = modifiedValue; break;
          case "hr": hr = Math.round(modifiedValue); break;
          case "o2": o2 = Math.round(modifiedValue); break;
          case "sys": sys = Math.round(modifiedValue); break;
          case "dia": dia = Math.round(modifiedValue); break;
        }
      }
      
      // 수정된 값 적용 후 소수점 자릿수 조정 재확인
      bf = Number(bf.toFixed(2));
      mm = Number(mm.toFixed(2));
      bw = Number(bw.toFixed(2));
      prot = Number(prot.toFixed(2));
      min = Number(min.toFixed(2));
      wt = Number(wt.toFixed(1));
      hr = Math.round(hr);
      o2 = Math.round(o2);
      sys = Math.round(sys);
      dia = Math.round(dia);
      
      // 일일 데이터 저장
      const dayData = {
        bf, mm, bw, prot, min, wt, ht: height, hr, o2, sys, dia, d: currentDate
      };
      
      dailyData.push(dayData);
      
      // 각 지표별 시계열 데이터 업데이트
      Object.keys(dayData).forEach(metric => {
        if (metric !== 'd' && metric !== 'ht') {
          metricTimeSeries[metric].push({
            day: dayOffset + 1, // 1일차부터 시작하도록
            value: dayData[metric],
            date: currentDate
          });
        }
      });
    }

    // 실제 데이터의 시작일과 종료일 찾기 (코드 위치 수정)
    const actualStartDate = dailyData.length > 0 ? 
                            dailyData.reduce((earliest, data) => 
                            new Date(data.d) < new Date(earliest) ? data.d : earliest, 
                            dailyData[0].d) : 
                            startDate;
                            
    const actualEndDate = dailyData.length > 0 ? 
                          dailyData.reduce((latest, data) => 
                          new Date(data.d) > new Date(latest) ? data.d : latest, 
                          dailyData[0].d) : 
                          endDate;
    
    // 측정 데이터에서 실제 사용할 데이터만 필터링 (날짜 범위 내의 데이터만)
    const validDailyData = dailyData.filter(data => validateDate(data.d, actualStartDate, actualEndDate));
    
    // 평균, 최소, 최대값 계산
    const wsum = {
      avg: {},
      min: {},
      max: {}
    };
    
    // 평균, 최소, 최대값 계산 시 소수점 자릿수 조정
    allMetrics.forEach(metric => {
      const values = dailyData.map(day => day[metric]);
      
      // 지표별로 다른 소수점 자릿수 적용
      let decimals = 2; // 기본값
      if (metric === 'wt' || metric === 'ht') {
        decimals = 1; // 체중, 신장은 소수점 1자리
      } else if (metric === 'hr' || metric === 'o2' || metric === 'sys' || metric === 'dia') {
        decimals = 0; // 심박수, 산소포화도, 혈압은 정수
      }
      
      // 평균값 계산 및 소수점 자릿수 조정
      wsum.avg[metric] = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(decimals));
      
      // 최소/최대값도 동일한 소수점 자릿수 조정
      wsum.min[metric] = Number(Math.min(...values).toFixed(decimals));
      wsum.max[metric] = Number(Math.max(...values).toFixed(decimals));
    });
    
    // 변화 패턴 감지 및 코멘트 생성
    let anomalies = [];
    const comments = [];
    
    // 1. 급증/급감 패턴 감지 - 현실적인 임계값 사용
    Object.keys(metricTimeSeries).forEach(metric => {
      if (metricTimeSeries[metric].length > 0) {
        const timeSeries = metricTimeSeries[metric];
        const avgValue = wsum.avg[metric];
        
        // 각 날짜별로 평균 대비 급변 확인
        timeSeries.forEach(point => {
          // 날짜가 범위 내에 있는지 확인 (수정됨)
          if (!validateDate(point.date, actualStartDate, actualEndDate)) {
            return; // 범위 밖이면 스킵
          }
          
          // 값 형식 통일
          const formattedValue = metric === "hr" || metric === "o2" || metric === "sys" || metric === "dia" 
            ? Math.round(point.value) 
            : Number(point.value.toFixed(1));
            
          // 특이점 감지 함수 호출
          if (detectSignificantDeviation(point.value, avgValue, metric)) {
            const isHigher = point.value > avgValue;
            const percentChange = isHigher 
              ? Math.round((point.value / avgValue - 1) * 100)
              : Math.round((1 - point.value / avgValue) * 100);
              
            if (percentChange >= 2) { // 최소 2% 이상 변화한 경우만 보고
              const type = isHigher ? "급증" : "급감";
              const direction = isHigher ? "높았습니다" : "낮았습니다";
              
              // 날짜 형식 변환
              const date = new Date(point.date);
              const month = date.getMonth() + 1;
              const day = date.getDate();
              
              const comment = `${month}월 ${day}일, 평소에 비해 ${metricKoreanNames[metric]} 수치가 ${formattedValue}${getUnit(metric)}로, 평소보다 ${percentChange}% ${direction}.`;
              
              anomalies.push({
                type: type,
                metric: metric,
                metricName: metricKoreanNames[metric],
                day: point.day,
                date: point.date,
                value: formattedValue, // 수정: 실제 데이터와 일치하도록 formattedValue 사용
                avgValue: avgValue,
                percentChange: percentChange
              });
              
              comments.push(comment);
            }
          }
        });
      }
    });


    // 3. 큰 변동성 패턴 감지 - 현실적인 임계값 사용
    Object.keys(metricTimeSeries).forEach(metric => {
      const timeSeries = metricTimeSeries[metric];
      if (timeSeries.length >= 3) {
        const values = timeSeries.map(point => point.value);
        
        // 변동성 패턴 감지 함수 호출
        if (detectExcessiveVariability(values, metric)) {
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length);
          const cv = Number(((stdDev / avg) * 100).toFixed(1));
          
          // 가장 큰 변동이 있는 날짜 찾기
          let maxDeviation = 0;
          let maxDeviationDate = timeSeries[0].date;
          let maxDeviationValue = timeSeries[0].value;
          
          timeSeries.forEach(point => {
            const deviation = Math.abs(point.value - avg);
            if (deviation > maxDeviation) {
              maxDeviation = deviation;
              maxDeviationDate = point.date;
              maxDeviationValue = point.value;
            }
          });
          
          // 날짜가 범위 내에 있는지 확인 (수정됨)
          if (validateDate(maxDeviationDate, startDate, endDate)) {
            const date = new Date(maxDeviationDate);
            const month = date.getMonth() + 1;
            const day = date.getDate();
            
            // 값 형식 통일
            const formattedValue = metric === "hr" || metric === "o2" || metric === "sys" || metric === "dia" 
              ? Math.round(maxDeviationValue) 
              : Number(maxDeviationValue.toFixed(1));
            
            const comment = `${month}월 ${day}일, ${metricKoreanNames[metric]} 수치가 평소보다 크게 변동했습니다(변동계수: ${cv}%).`;
            anomalies.push({
              type: "큰변동성",
              metric: metric,
              metricName: metricKoreanNames[metric],
              date: maxDeviationDate,
              value: formattedValue, // 수정: 실제 값 추가
              cv: cv
            });
            comments.push(comment);
          }
        }
      }
    });

    // 이상 특징이 너무 적은 경우, 실제 데이터 범위 내에서 가장 큰 차이를 보이는 값 찾기
    if (anomalies.length === 0 && validDailyData.length > 0) {
      // 모든 유효한 데이터 중에서 가장 평균과 차이가 큰 지표와 날짜 찾기
      let maxDiff = -1;
      let maxDiffMetric = null;
      let maxDiffDay = null;
      let maxDiffValue = 0;
      let maxDiffPercent = 0;
      let isHigher = true;
      
      for (const metric of allMetrics) {
        const avgValue = wsum.avg[metric];
        if (!avgValue) continue;
        
        for (const data of validDailyData) {
          const value = data[metric];
          if (!value) continue;
          
          // 값 형식 통일
          const formattedValue = metric === "hr" || metric === "o2" || metric === "sys" || metric === "dia" 
            ? Math.round(value) 
            : Number(value.toFixed(1));
          
          const currentIsHigher = value > avgValue;
          const percentChange = currentIsHigher 
            ? (value / avgValue - 1) * 100
            : (1 - value / avgValue) * 100;
          
          if (percentChange > maxDiff) {
            maxDiff = percentChange;
            maxDiffMetric = metric;
            maxDiffDay = data.d;
            maxDiffValue = formattedValue;
            maxDiffPercent = Math.round(percentChange);
            isHigher = currentIsHigher;
          }
        }
      }
      
      if (maxDiffMetric && maxDiffDay) {
        const type = isHigher ? "급증" : "급감";
        const direction = isHigher ? "높았습니다" : "낮았습니다";
        
        const date = new Date(maxDiffDay);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        const comment = `${month}월 ${day}일, 평소에 비해 ${metricKoreanNames[maxDiffMetric]} 수치가 ${maxDiffValue}${getUnit(maxDiffMetric)}로, 평소보다 ${maxDiffPercent}% ${direction}.`;
        
        anomalies.push({
          type: type,
          metric: maxDiffMetric,
          metricName: metricKoreanNames[maxDiffMetric],
          day: validDailyData.findIndex(d => d.d === maxDiffDay) + 1,
          date: maxDiffDay,
          value: maxDiffValue,
          avgValue: wsum.avg[maxDiffMetric],
          percentChange: maxDiffPercent
        });
        
        comments.push(comment);
      }
    }
    
    // 이상 특징이 여전히 없고 모든 시도가 실패한 경우에만 기본 예시 사용
    if (anomalies.length === 0) {
      // 기본 예시 특이사항 (마지막 수단)
      const defaultMetric = "hr";
      const avgValue = wsum.avg[defaultMetric] || 70;
      const percentChange = 5;
      const formattedValue = Math.round(avgValue * 1.05); // 5% 증가
      
      // 첫 번째 유효한 날짜 사용
      const validDate = validDailyData.length > 0 ? validDailyData[0].d : startDate;
      const date = new Date(validDate);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      const comment = `${month}월 ${day}일, 평소에 비해 ${metricKoreanNames[defaultMetric]} 수치가 ${formattedValue}${getUnit(defaultMetric)}로, 평소보다 ${percentChange}% 높았습니다.`;
      
      // 참고: 이 코드는 정말 필요한 경우에만 사용되어야 함
      anomalies.push({
        type: "급증",
        metric: defaultMetric,
        metricName: metricKoreanNames[defaultMetric],
        day: 1,
        date: validDate,
        value: formattedValue,
        avgValue: avgValue,
        percentChange: percentChange
      });
      
      comments.push(comment);
    }
    // 이상 특징이 너무 많은 경우, 가장 중요한 특징만 유지 (최대 5개)
    else if (anomalies.length > 5) {
      // 중요도 순으로 정렬: 추세 > 급변 > 변동성
      anomalies.sort((a, b) => {
        // 유형별 우선순위
        const typePriority = {
          "상승추세": 3, 
          "하락추세": 3,
          "급증": 2,
          "급감": 2,
          "큰변동성": 1
        };
        
        const priorityDiff = typePriority[b.type] - typePriority[a.type];
        if (priorityDiff !== 0) return priorityDiff;
        
        // 같은 유형일 경우 변화 정도로 정렬
        if (a.percentChange && b.percentChange) {
          return b.percentChange - a.percentChange;
        } else if (a.cv && b.cv) {
          return b.cv - a.cv;
        }
        
        return 0;
      });
      
      // 상위 5개만 유지
      anomalies = anomalies.slice(0, 5);
      
      // 코멘트도 다시 필터링
      const selectedAnomalyTypes = anomalies.map(a => {
        if (a.type === "급증" || a.type === "급감") {
          return `${a.type}_${a.metric}_${a.date}`;
        } else if (a.type === "상승추세" || a.type === "하락추세") {
          return `${a.type}_${a.metric}`;
        } else {
          return `${a.type}_${a.metric}`;
        }
      });
      
      // 코멘트 매칭 및 필터링 (수정됨 - 날짜 기반 비교)
      const filteredComments = [];
      for (const anomaly of anomalies) {
        const date = new Date(anomaly.date);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        let commentFound = false;
        
        for (const comment of comments) {
          if (comment.includes(`${month}월 ${day}일`) && 
              comment.includes(metricKoreanNames[anomaly.metric])) {
            filteredComments.push(comment);
            commentFound = true;
            break;
          }
        }
        
        // 코멘트가 없으면 생성
        if (!commentFound) {
          if (anomaly.type === "급증" || anomaly.type === "급감") {
            const direction = anomaly.type === "급증" ? "높았습니다" : "낮았습니다";
            const comment = `${month}월 ${day}일, 평소에 비해 ${metricKoreanNames[anomaly.metric]} 수치가 ${anomaly.value}${getUnit(anomaly.metric)}로, 평소보다 ${anomaly.percentChange}% ${direction}.`;
            filteredComments.push(comment);
          } else if (anomaly.type === "큰변동성") {
            const comment = `${month}월 ${day}일, ${metricKoreanNames[anomaly.metric]} 수치가 평소보다 크게 변동했습니다(변동계수: ${anomaly.cv}%).`;
            filteredComments.push(comment);
          }
        }
      }
      
      // 최종 코멘트 갱신
      comments.length = 0;
      comments.push(...filteredComments);
    }
    
    // 중복 코멘트 제거
    const uniqueComments = [...new Set(comments)];
    
    // 식단 추천
    const recommendCount = 3;
    const shuffledFoods = [...foodRecommendations].sort(() => 0.5 - Math.random());
    const foodSet = shuffledFoods.slice(0, recommendCount);
    
    // 종합 코멘트 작성
    let finalComment = "";
    if (anomalies.length === 0) {
      finalComment = "측정 기간 동안 특별한 변화나 특이사항이 발견되지 않았습니다. 현재의 건강 관리를 유지하세요.";
    } else {
      // 변화 개수 요약
      finalComment = `측정 기간 동안 ${anomalies.length}개의 특이사항이 발견되었습니다. `;
      
      // 모든 코멘트 포함 (제한 제거)
      finalComment += uniqueComments.join(" ");
    }
    
    // 최종 데이터 구성
    const input = {
      ws: startDate,
      we: endDate,
      dm: dailyData
    };
    
    const output = {
      wsum: wsum,
      anom: anomalies,
      cmt: {
        g: finalComment
      },
      fd: foodSet
    };
    
    return {
      input: `### 질문:\n${JSON.stringify(input)}\n### 지시사항:\nwsum, anom, cmt.g(평균 대비 %), fd 생성\n### 답변:\n`,
      output: JSON.stringify(output)
    };
  } catch (error) {
    // 오류 발생 시 기본 데이터 생성
    console.error("Error generating data:", error);
    
    // 응급 복구 데이터 생성
    const startDate = "2023-01-01T00:00:00";
    const endDate = "2023-01-05T00:00:00";
    
    // 기본 데이터
    const dailyData = [
      {
        bf: 25.5, mm: 45.2, bw: 55.3, prot: 18.1, min: 4.5, wt: 70.5, ht: 175.0,
        hr: 72, o2: 98, sys: 125, dia: 75, d: "2023-01-01T00:00:00"
      },
      {
        bf: 25.3, mm: 45.3, bw: 55.4, prot: 18.2, min: 4.5, wt: 70.3, ht: 175.0,
        hr: 85, o2: 98, sys: 124, dia: 76, d: "2023-01-03T00:00:00"
      },
      {
        bf: 25.4, mm: 45.4, bw: 55.5, prot: 18.0, min: 4.4, wt: 70.4, ht: 175.0,
        hr: 75, o2: 97, sys: 126, dia: 74, d: "2023-01-05T00:00:00"
      }
    ];
    
    const wsum = {
      avg: {
        bf: 25.4, mm: 45.3, bw: 55.4, prot: 18.1, min: 4.47, wt: 70.4, ht: 175.0,
        hr: 77.33, o2: 97.67, sys: 125, dia: 75
      },
      min: {
        bf: 25.3, mm: 45.2, bw: 55.3, prot: 18.0, min: 4.4, wt: 70.3, ht: 175.0,
        hr: 72, o2: 97, sys: 124, dia: 74
      },
      max: {
        bf: 25.5, mm: 45.4, bw: 55.5, prot: 18.2, min: 4.5, wt: 70.5, ht: 175.0,
        hr: 85, o2: 98, sys: 126, dia: 76
      }
    };
    
    const anomalies = [
      {
        type: "급증",
        metric: "hr",
        metricName: "심박수",
        day: 2,
        date: "2023-01-03T00:00:00",
        value: 85,
        avgValue: 77.33,
        percentChange: 10
      }
    ];
    
    const finalComment = "측정 기간 동안 1개의 특이사항이 발견되었습니다. 1월 3일, 평소에 비해 심박수 수치가 85bpm로, 평소보다 10% 높았습니다.";
    
    const foodSet = [
      "현미밥과 된장찌개, 구운 생선, 채소 모듬",
      "통밀빵 아보카도 토스트와 그릭 요거트",
      "퀴노아 샐러드와 닭가슴살"
    ];
    
    const input = {
      ws: startDate,
      we: endDate,
      dm: dailyData
    };
    
    const output = {
      wsum: wsum,
      anom: anomalies,
      cmt: {
        g: finalComment
      },
      fd: foodSet
    };
    
    return {
      input: `### 질문:\n${JSON.stringify(input)}\n### 지시사항:\nwsum, anom, cmt.g(평균 대비 %), fd 생성\n### 답변:\n`,
      output: JSON.stringify(output)
    };
  }
}

// 데이터 생성하여 파일에 저장하는 방식
function generateHealthTrendDataSets(count = 5000) {
  // 결과를 저장할 파일 열기 (기존 파일이 있으면 덮어씀)
  const outputStream = fs.createWriteStream('realistic_health_analysis.jsonl');
  
  for (let i = 0; i < count; i++) {
    try {
      const dataSet = generateHealthTrendAnalysis();
      // 콘솔 대신 파일에 쓰기
      outputStream.write(JSON.stringify(dataSet) + '\n');
      
      // 진행 상황 표시 (콘솔에 출력)
      if (i % 100 === 0) {
        console.log(`${i}/${count} 데이터 생성 완료...`);
      }
    } catch (error) {
      console.error("Error in dataset generation:", error);
    }
  }
  
  // 파일 쓰기 완료 후 스트림 닫기
  outputStream.end();
  console.log(`총 ${count}개의 데이터 생성 완료! 'realistic_health_analysis.jsonl' 파일에 저장되었습니다.`);
}

// 실행
generateHealthTrendDataSets(5000);
