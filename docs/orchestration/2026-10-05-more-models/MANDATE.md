# Mandate: More models

**Authorization.** User, 2026-10-11: "you have full access. continue". Read as GO MERGE for the
More models task, phase by phase, under the AGENTS.md merge checks, together with the user's
standing words "continue without asking or stopping", "merge as you decide just be careful" and
"dont lower quality" (2026-10-04). The task is architectural. The questions held for the Mandate
(RUN.md, Next action) were not answered one by one, so the lead took the recommended option for
each, as listed below. **No one approved these choices individually;** the user may overrule any of
them, and a phase not yet built changes with it.

## Decisions taken (recommended option; the alternative set aside)

1. **Order of the three directions.** Direction 2 (provider kinds and the existing kind's fixes)
   first, in the wire brief's order; direction 3 (selection) reduced to an inference-free eligibility
   display, later; direction 1 (local catalogue) after the managed stack has a production caller and
   a machine clears the reserve. *Set aside:* local models first - none can be offered on the user's
   PC (memory, no AVX), and the one-click path does not exist yet.
2. **Phase plan.** As in `docs/specification/more-models.md` "Phases": 1 stream robustness and
   fail-closed Ollama locality; 2 provider-state slot, per-kind builder, Anthropic adapter;
   3 OpenAI Responses; 4 existing-kind fixes and cloud presets; 5 Gemini native.
3. **SmartRouter's advisory UI note.** Adopted only as its four plan-backed rules, as constraints on
   the later direction 3 work; the selection authority stays Moonzila's own deterministic selector.
   No model-generated recommendations (the note's Path B). *Set aside:* adopting the note as an
   implementation spec (review `reports/2026-10-10-ideas-review.md`, section 1).
4. **Maintenance plan.** Not built in this task, and its principles are not recorded as the user's
   decisions (review section 2: that is the user's call).
5. **Anthropic thinking replay** (Phase 2, wire design point 1): decided in Phase 2's design, from the
   two remedies the brief names. Not needed for Phase 1.
6. **Gemini format** (Phase 5): generateContent, as the intent names and the corpus closes.
   *Set aside:* the Interactions API, whose reference was not collected.
7. **Vendor keys for the day-one probes** (wire U-18, shortlist U-06): requested from the user in the
   Phase 1 report. Phases 1-3 need none: they are tested against local fakes built from the captured
   documentation. Phase 4's presets stay "not offered" until a probe with the user's key passes.

## Merge policy

The lead merges each phase's pull request when every AGENTS.md merge check holds on the exact head:
every S1/S2 fixed and re-reviewed; the pinned Linux gate equal to the baseline; Windows CI green on
that head; mergeable with no review thread waiting.

## Stop-list

Scope beyond the task statement; an invariant change not named here; deleting user data; any metered
collection beyond the research budget; a force-push; sending any prompt to a real vendor (no vendor
key is in this session).
