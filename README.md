# 은지님네 냉장고 🧊

냉장실 · 냉동실 · 김치냉장고 재료를 한 화면에서 보고, 내일 뭐 먹을지 정하는 모바일용 페이지입니다.

- 주소: https://totalplus.github.io/fridge/
- 자료 출처: `kitchen/fridge.md` (은지님 냉장고 기록)

## 파일 구조

```
index.html      화면 뼈대
css/style.css   파스텔 크림·민트 테마
js/app.js       data.json을 읽어서 그리는 코드 (데이터 없음)
data.json       ★ 재료·식단·장보기 전부 여기에
```

매일 아침·저녁 식단을 바꿀 때는 **`data.json`만 고치고 push** 하면 됩니다.
`index.html`·`app.js`는 건드릴 필요가 없습니다.

## 식단 규칙 (매일 업데이트할 때 꼭 지켜 주세요)

- **평일(월~금)**: 아침 · 저녁만. 점심은 도아는 기관, 어른은 회사에서 먹으므로 넣지 않습니다.
  - `todayPlan.meals`에 `lunch` 그룹을 넣지 않고, 대신 `passNote`(🏫 점심은 비워 뒀어요)를 둡니다.
  - `weekPlan`의 평일은 `"lunch": "기관·회사 식사"`, `"lunchPass": true`.
- **주말(토·일)**: 아침 · 점심 · 저녁 세 끼 모두.
- 아이 메뉴(도아 5세·도현 2세)와 어른 메뉴는 카드로 나눠서, 아이 몫은 간을 약하게 적어 주세요.

## data.json 고치는 법

- `updatedAt` — 마지막 업데이트 시각 (`2026-11-19T20:59:00+09:00` 형식, 한국 시간)
- `items[]` — 재료 한 줄에 하나
  - `loc`: `cold`(냉장실) / `frozen`(냉동실) / `kimchi`(김치냉장고)
  - `cat`: `fruit` `veg` `protein` `kimchi` `kids` `meal` (필터 칩과 1:1)
  - `tags`: `"우선 소진"`, `"임박"` — 상단 배지 숫자가 여기서 자동 계산됩니다
- `todayPlan` — `meals[].cards[]` 의 `id`가 `먹음` 체크 키입니다. 날짜가 바뀌면 id도 `2026-11-21-breakfast-kids` 처럼 새로 지어 주세요(체크가 새로 시작됨).
- `weekPlan[]` — 7일치 아침/점심/저녁 한 줄 요약
- `simpleMeals[]` — 간단 식단 카드
- `shopping[]` — 장보기 목록

## 배포

- 주소: https://edithshin90.github.io/FRIDGE/
- GitHub Pages가 **`gh-pages` 브랜치 루트**를 보고 있습니다. 그래서 `data.json`을 고친 뒤에는 아래처럼 **main과 gh-pages 두 곳에 같이** 올려 주세요.

```bash
git add data.json && git commit -m "식단 업데이트"
git push origin main main:gh-pages
```

- (선택) 저장소 Settings → Pages → Source를 `main` / `root`로 바꾸면 `git push origin main` 하나로 끝납니다.
- push 후 1~2분이면 반영됩니다.
