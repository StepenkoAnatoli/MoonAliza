from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable, Sequence
import sys


@dataclass(frozen=True)
class ChatMessage:
    speaker: str
    audience: str
    content: str


@dataclass(frozen=True)
class ChatAgent:
    name: str
    model: str
    specialty: str

    def speak(
        self,
        goal: str,
        research_brief: str,
        conversation: Sequence[ChatMessage],
    ) -> ChatMessage:
        collaborators = [
            f"{message.speaker}: {message.content.split(' Shared context:', 1)[0]}"
            for message in conversation
            if message.speaker != self.name
        ]
        shared_context = (
            " | ".join(collaborators)
            if collaborators
            else "No collaborator context is available yet."
        )
        content = (
            f"{self.name} uses {self.model} for {self.specialty}. "
            f"Goal: {goal}. "
            f"Research brief: {research_brief}. "
            f"Shared context: {shared_context}"
        )
        return ChatMessage(speaker=self.name, audience="team", content=content)


@dataclass(frozen=True)
class ResearchKit:
    checklist: tuple[str, ...] = (
        "clarify the goal",
        "compare strong model specialties",
        "plan build and validation steps",
    )

    def prepare_brief(self, goal: str) -> str:
        steps = "; ".join(self.checklist)
        return f"Research kit brief for '{goal}': {steps}."


@dataclass(frozen=True)
class BuildPlan:
    goal: str
    research_brief: str
    conversation: tuple[ChatMessage, ...]
    final_plan: str

    def render(self) -> str:
        messages = "\n".join(
            f"- {message.speaker} -> {message.audience}: {message.content}"
            for message in self.conversation
        )
        return (
            f"Goal: {self.goal}\n"
            f"{self.research_brief}\n\n"
            f"Conversation:\n{messages}\n\n"
            f"Final plan:\n{self.final_plan}"
        )


@dataclass(frozen=True)
class MoonAliza:
    research_kit: ResearchKit = field(default_factory=ResearchKit)
    agents: tuple[ChatAgent, ...] = (
        ChatAgent("Researcher", "Insight", "discovering requirements and risks"),
        ChatAgent("Planner", "Atlas", "turning research into delivery steps"),
        ChatAgent("Builder", "Forge", "mapping plans into implementation tasks"),
    )

    def build_project(self, goal: str) -> BuildPlan:
        research_brief = self.research_kit.prepare_brief(goal)
        conversation = [ChatMessage("ResearchKit", "team", research_brief)]

        for agent in self.agents:
            conversation.append(agent.speak(goal, research_brief, conversation))

        final_plan = self._synthesize(goal)
        conversation.append(ChatMessage("MoonAliza", "builder", final_plan))

        return BuildPlan(
            goal=goal,
            research_brief=research_brief,
            conversation=tuple(conversation),
            final_plan=final_plan,
        )

    def _synthesize(self, goal: str) -> str:
        contributions = "\n".join(
            f"- {agent.name} ({agent.model}) covers {agent.specialty}."
            for agent in self.agents
        )
        return (
            f"MoonAliza build plan for '{goal}':\n"
            f"{contributions}\n"
            "- Combine the specialist outputs into one validated delivery plan.\n"
            "- Build the project, test the result, and iterate with the same team."
        )


def main(argv: Iterable[str] | None = None) -> int:
    args = list(argv if argv is not None else sys.argv[1:])
    if not args:
        print("Usage: python moonaliza.py \"<project goal>\"")
        return 1

    build_plan = MoonAliza().build_project(" ".join(args))
    print(build_plan.render())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
