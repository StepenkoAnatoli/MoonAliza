# MoonAliza

MoonAliza is a small research-driven build orchestrator.

It models a team of specialized chat agents that can share context with each
other, so a research-focused model, a planning-focused model, and an
implementation-focused model can combine their strengths into one final build
plan.

## Usage

```bash
python moonaliza.py "Build a cross-functional product roadmap"
```

## What it does

- starts with a research kit brief
- lets each specialist chat agent respond in sequence while seeing earlier
  messages
- produces one combined build plan that uses the best contribution from each
  specialist
