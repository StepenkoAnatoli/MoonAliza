import unittest

from moonaliza import ChatAgent, MoonAliza


class MoonAlizaTests(unittest.TestCase):
    def test_agents_share_previous_chat_context(self) -> None:
        orchestrator = MoonAliza(
            agents=(
                ChatAgent("Researcher", "Insight", "research"),
                ChatAgent("Builder", "Forge", "implementation"),
            )
        )

        plan = orchestrator.build_project("Build a useful product")

        builder_message = plan.conversation[2]
        self.assertEqual(builder_message.speaker, "Builder")
        self.assertIn("Researcher:", builder_message.content)
        self.assertIn("Research kit brief", builder_message.content)

    def test_final_plan_combines_specialist_strengths(self) -> None:
        plan = MoonAliza().build_project("Launch a collaborative app")

        self.assertIn("Launch a collaborative app", plan.final_plan)
        self.assertIn("discovering requirements and risks", plan.final_plan)
        self.assertIn("turning research into delivery steps", plan.final_plan)
        self.assertIn("mapping plans into implementation tasks", plan.final_plan)


if __name__ == "__main__":
    unittest.main()
