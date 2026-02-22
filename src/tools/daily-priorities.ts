import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { shouldLogToolCalls } from "../markster/client";
import { DailyPrioritiesInput } from "../types/contracts";
import {
  DEAL_DEFAULTS,
  getBaselineFinancials,
  getCompanyByKey,
  getSignals,
  getAllCompanies,
} from "../services/mockData";

type PriorityTask = {
  id: string;
  category: "sales" | "marketing" | "finance" | "ops";
  title: string;
  description: string;
  priority: "critical" | "high" | "medium";
  time_minutes: number;
  revenue_impact: number;
  source: string;
  action_scene?: string;
  action_args?: Record<string, unknown>;
};

function buildPriorityTasks(timeboxMinutes: number): PriorityTask[] {
  const tasks: PriorityTask[] = [];
  const financials = getBaselineFinancials();

  // 1. Hottest deal follow-up (from signals)
  const figmaSignals = getSignals("figma");
  const warmest = figmaSignals.sort(
    (a, b) => b.intent_score - a.intent_score,
  )[0];
  if (warmest) {
    tasks.push({
      id: "t1",
      category: "sales",
      title: `Follow up with ${warmest.name} at Figma`,
      description: `Intent score ${warmest.intent_score}/100. ${warmest.status}. 6 pricing page visits, ROI calculator used, demo requested. Send personalized follow-up referencing their activity.`,
      priority: "critical",
      time_minutes: 10,
      revenue_impact: 150000,
      source: "Engagement Signals",
      action_scene: "outreach",
      action_args: {
        mode: "draft",
        contact_name: warmest.name,
        company: "Figma",
      },
    });
  }

  // 2. Pipeline review — stale deals
  const anthropicDeal = DEAL_DEFAULTS["anthropic"];
  if (anthropicDeal) {
    tasks.push({
      id: "t2",
      category: "sales",
      title: "Move Anthropic deal forward",
      description: `$${(anthropicDeal.dealSize / 1000).toFixed(
        0,
      )}K deal stuck in ${anthropicDeal.dealStage.replace(
        "_",
        " ",
      )}. Review proposal and schedule decision call.`,
      priority: "high",
      time_minutes: 15,
      revenue_impact: anthropicDeal.dealSize,
      source: "Pipeline",
      action_scene: "pipeline",
    });
  }

  // 3. Content publishing
  tasks.push({
    id: "t3",
    category: "marketing",
    title: "Review and publish LinkedIn post",
    description:
      "Draft post on ScaleOS methodology is ready for final review. High-engagement window: 8-10 AM EST. Approve and schedule.",
    priority: "high",
    time_minutes: 5,
    revenue_impact: 0,
    source: "Content Calendar",
    action_scene: "content",
  });

  // 4. Respond to inbound
  tasks.push({
    id: "t4",
    category: "sales",
    title: "Respond to Scale AI inbound inquiry",
    description:
      "$200K potential deal. Jenny Kim (VP Engineering) downloaded case study yesterday. Send warm intro within 24h window.",
    priority: "critical",
    time_minutes: 10,
    revenue_impact: 200000,
    source: "Engagement Signals",
    action_scene: "outreach",
    action_args: {
      mode: "draft",
      contact_name: "Jenny Kim",
      company: "Scale AI",
    },
  });

  // 5. Check email infrastructure
  tasks.push({
    id: "t5",
    category: "ops",
    title: "Verify cold email domain health",
    description:
      "Weekly domain reputation check. Last scan showed 94% inbox rate. Confirm deliverability before Monday outreach batch.",
    priority: "medium",
    time_minutes: 5,
    revenue_impact: 0,
    source: "Cold Mail Health",
    action_scene: "cold-mail",
  });

  // 6. Finance check
  tasks.push({
    id: "t6",
    category: "finance",
    title: "Review burn rate and runway",
    description: `Current burn: $${(financials.monthly_burn / 1000).toFixed(
      1,
    )}K/mo. Runway: ${financials.runway_months.toFixed(
      1,
    )} months. Churn is above 3% target. Review expansion revenue options.`,
    priority: "high",
    time_minutes: 10,
    revenue_impact: 0,
    source: "Financial Dashboard",
    action_scene: "overview",
  });

  // 7. Ramp deal — proposal follow-up
  const rampDeal = DEAL_DEFAULTS["ramp"];
  if (rampDeal) {
    tasks.push({
      id: "t7",
      category: "sales",
      title: "Check Ramp proposal status",
      description: `$${(rampDeal.dealSize / 1000).toFixed(
        0,
      )}K deal, proposal sent. Daniel Park hasn't responded in 3 days. Send gentle nudge.`,
      priority: "medium",
      time_minutes: 5,
      revenue_impact: rampDeal.dealSize,
      source: "Pipeline",
      action_scene: "outreach",
      action_args: {
        mode: "draft",
        contact_name: "Daniel Park",
        company: "Ramp",
      },
    });
  }

  // Sort by revenue impact * urgency, then fit within timebox
  const priorityWeight = { critical: 3, high: 2, medium: 1 };
  tasks.sort(
    (a, b) =>
      b.revenue_impact * priorityWeight[b.priority] -
      a.revenue_impact * priorityWeight[a.priority],
  );

  // Fit within timebox
  let remaining = timeboxMinutes;
  const fitted: PriorityTask[] = [];
  for (const task of tasks) {
    if (remaining <= 0) break;
    if (task.time_minutes <= remaining) {
      fitted.push(task);
      remaining -= task.time_minutes;
    }
  }

  return fitted;
}

export function registerDailyPrioritiesTool(
  server: McpServer,
  uiResourceUri: string,
): void {
  registerAppTool(
    server,
    "daily_priorities",
    {
      title: "Daily Priorities",
      description:
        "Generate a time-boxed, prioritized action plan ranked by revenue impact and urgency. Pulls from pipeline, signals, content, outreach, and financials.",
      inputSchema: DailyPrioritiesInput.shape,
      _meta: {
        ui: { resourceUri: uiResourceUri },
        "ui/resourceUri": uiResourceUri,
      },
    },
    async (args) => {
      const parsed = DailyPrioritiesInput.parse(args);
      const timeboxMinutes = parsed.timebox_minutes ?? 60;

      if (shouldLogToolCalls()) {
        console.info(
          `[mcp-server] start tool=daily_priorities timebox=${timeboxMinutes}`,
        );
      }

      const tasks = buildPriorityTasks(timeboxMinutes);
      const totalRevenue = tasks.reduce((s, t) => s + t.revenue_impact, 0);
      const totalMinutes = tasks.reduce((s, t) => s + t.time_minutes, 0);

      const payload = {
        tool: "daily_priorities",
        source: "mock",
        timebox_minutes: timeboxMinutes,
        total_tasks: tasks.length,
        total_minutes: totalMinutes,
        total_revenue_at_stake: totalRevenue,
        tasks,
        generated_at: new Date().toISOString(),
      };

      if (shouldLogToolCalls()) {
        console.info(
          `[mcp-server] done tool=daily_priorities tasks=${tasks.length} revenue=${totalRevenue}`,
        );
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(payload),
          },
        ],
      };
    },
  );
}
