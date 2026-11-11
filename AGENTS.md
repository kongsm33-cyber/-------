# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

# 프로젝트
게임의 명세는 spec.md에 있다. 작업을 시작하기 전에 spec.md를 읽는다.
작업 목록 tasks.md가 있으면 함께 읽고, 작업을 마치면 해당 항목에 체크한다.
명세에 없는 기능은 만들지 않는다. 명세와 다르게 만들어야 하면 먼저 묻는다.
Phaser 3는 CDN으로 불러오고, npm과 빌드 도구는 사용하지 않는다.
VS Code의 Live Server로 index.html을 열어 실행할 수 있어야 한다.
화면은 [모바일 세로 / PC 가로] 비율을 기준으로 한다.
git 명령은 실행하지 않는다. 커밋과 push는 사용자가 직접 한다.
수정 범위가 크면 진행하지 말고 먼저 허락을 받는다.
하나의 파일에 모든 기능을 넣지 않고, 유지보수가 쉬운 구조로 모듈화한다.
요청이 명확하지 않으면 추론해서 실행하지 말고, 이해한 내용을 먼저 말한다.
design.md가 있으면 모든 디자인을 design.md에 맞춰 일관되게 만든다.
사용자가 입력한 프롬프트는 날짜와 시각을 앞에 붙여 prompt.txt 끝에 그대로 추가한다. 저장했다는 사실은 말하지 않는다.

# 작업 로그
작업을 마칠 때마다 work-log.md 파일 끝에 아래 네 항목을 추가한다.
날짜와 시각 / 요청 요약 / 수정한 파일 / 판단 근거 한 줄
