export type MarksterToolHttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

export type MarksterToolDescriptor = {
  name: string;
  title: string;
  description: string;
  category: string;
  method: MarksterToolHttpMethod;
  endpoint: string;
};

export type MarksterToolUseCaseGuide = {
  whenToUse: string;
  avoid: string;
  exampleArgs: string;
  expectedOutput: string;
};

export const MARKSTER_TOOL_CATALOG: MarksterToolDescriptor[] = [
  // Sales Intelligence
  {
    name: "sales_intelligence",
    title: "Sales Intelligence",
    description:
      "Research a target account, gather signals, and run the pricing simulator for one deal context.",
    category: "Sales Intelligence",
    method: "GET",
    endpoint: "/api/app/me",
  },
  {
    name: "runtime_mode_switch",
    title: "Runtime Mode Switch",
    description:
      "Switch MCP runtime behavior: live_with_fallback (recommended), live_strict, or full mock.",
    category: "Sales Intelligence",
    method: "POST",
    endpoint: "/mcp/runtime-mode",
  },

  // Customer Workspace & Onboarding
  {
    name: "customer_workspace_snapshot",
    title: "Customer Workspace Snapshot",
    description:
      "Unified read model of customer state (profile, notifications, onboarding, tasks, cold-mail readiness, top KPIs).",
    category: "Customer Workspace & Onboarding",
    method: "GET",
    endpoint:
      "/api/app/me?expand=notifications,onboarding,tasks,cold-mail-setup,dashboard",
  },
  {
    name: "customer_profile_manage",
    title: "Customer Profile Manage",
    description:
      "Read and update customer profile plus onboarding defaults used by Markster workflows.",
    category: "Customer Workspace & Onboarding",
    method: "GET",
    endpoint: "/api/app/me",
  },
  {
    name: "contact_profile_workspace",
    title: "Contact Profile Workspace",
    description:
      "Lookup contacts by name/email/title/company, or fetch one by contact_id, with optional ContactDB enrichment payloads.",
    category: "Customer Workspace & Onboarding",
    method: "GET",
    endpoint: "/api/app/contacts/profile",
  },
  {
    name: "company_profile_workspace",
    title: "Company Profile Workspace",
    description:
      "Lookup companies by id/name/domain/website/industry, or fetch one by company_id, with optional raw provider payloads.",
    category: "Customer Workspace & Onboarding",
    method: "GET",
    endpoint: "/api/app/companies/profile",
  },
  {
    name: "onboarding_flow_manage",
    title: "Onboarding Flow Manage",
    description:
      "Start onboarding, persist step answers, and retrieve consolidated onboarding profile data.",
    category: "Customer Workspace & Onboarding",
    method: "POST",
    endpoint: "/api/app/onboarding/start",
  },
  {
    name: "onboarding_ai_assist",
    title: "Onboarding AI Assist",
    description:
      "Generate onboarding prefill values, score completion quality, and build voice-pack defaults.",
    category: "Customer Workspace & Onboarding",
    method: "POST",
    endpoint: "/api/app/onboarding/ai/prefill",
  },
  {
    name: "dashboard_insights",
    title: "Dashboard Insights",
    description:
      "Read dashboard slices/time-series and optionally trigger dashboard refresh jobs.",
    category: "Customer Workspace & Onboarding",
    method: "GET",
    endpoint: "/api/app/dashboard",
  },
  {
    name: "pipeline_workspace",
    title: "Pipeline Workspace",
    description:
      "Read CRM pipeline overview, trend history, at-risk deal signals, and trigger pipeline refresh.",
    category: "Customer Workspace & Onboarding",
    method: "GET",
    endpoint: "/api/app/dashboard",
  },

  // Tasks
  {
    name: "task_workspace",
    title: "Task Workspace",
    description:
      "Read task overview/progress and initialize workstreams when missing.",
    category: "Tasks",
    method: "GET",
    endpoint: "/api/app/tasks/overview",
  },
  {
    name: "task_action",
    title: "Task Action",
    description:
      "Start/complete/reopen tasks; update notes and validation state for onboarding tasks.",
    category: "Tasks",
    method: "POST",
    endpoint: "/api/app/tasks/tasks/{task_id}/{action}",
  },
  {
    name: "task_content_regenerate",
    title: "Task Content Regenerate",
    description:
      "Regenerate onboarding-generated content blocks by task content type.",
    category: "Tasks",
    method: "POST",
    endpoint: "/api/app/tasks/regenerate",
  },

  // AI Team
  {
    name: "ai_team_workspace",
    title: "AI Team Workspace",
    description:
      "List agents and manage AI team conversations (create/list/get/rename/delete/switch).",
    category: "AI Team",
    method: "GET",
    endpoint: "/api/app/ai-team/agents",
  },
  {
    name: "ai_team_chat_turn",
    title: "AI Team Chat Turn",
    description:
      "Send a message turn and receive a response for a single agent conversation.",
    category: "AI Team",
    method: "POST",
    endpoint: "/api/app/ai-team/conversations/{conversation_id}/messages",
  },

  // Customer Knowledge, Content Artifacts & Approval
  {
    name: "customer_artifact_workspace",
    title: "Customer Artifact Workspace",
    description:
      "Create/list/edit/archive artifacts and run publish/export operations.",
    category: "Customer Knowledge, Content Artifacts & Approval",
    method: "GET",
    endpoint: "/api/app/customer-content/artifacts",
  },
  {
    name: "customer_document_workspace",
    title: "Customer Document Workspace",
    description:
      "CRUD for customer documents used as canonical AI context during operations.",
    category: "Customer Knowledge, Content Artifacts & Approval",
    method: "GET",
    endpoint: "/api/app/customer-content/documents",
  },
  {
    name: "customer_data_change_review",
    title: "Customer Data Change Review",
    description:
      "Open and act on data-change proposals with approval/rejection workflow.",
    category: "Customer Knowledge, Content Artifacts & Approval",
    method: "GET",
    endpoint: "/api/app/customer-content/proposals",
  },

  // Content Calendar & Social Publishing
  {
    name: "content_calendar_workspace",
    title: "Content Calendar Workspace",
    description:
      "Resolve latest active calendar, return this week's post queue, or fetch full calendar items.",
    category: "Content Calendar & Social Publishing",
    method: "GET",
    endpoint: "/api/content/calendars",
  },
  {
    name: "content_post_workspace",
    title: "Content Post Workspace",
    description:
      "Open full post payload (title/body/media), generate from item, edit, regenerate media, and approve/schedule.",
    category: "Content Calendar & Social Publishing",
    method: "POST",
    endpoint: "/api/content/items/{item_id}/post/generate",
  },
  {
    name: "content_audio_library",
    title: "Content Audio Library",
    description: "List/upload/delete reusable audio tracks for media remixes.",
    category: "Content Calendar & Social Publishing",
    method: "GET",
    endpoint: "/api/content/audio-tracks",
  },
  {
    name: "content_social_accounts",
    title: "Content Social Accounts",
    description:
      "Fetch CRM-connected social accounts available for outbound publishing.",
    category: "Content Calendar & Social Publishing",
    method: "GET",
    endpoint: "/api/content/social-accounts",
  },

  // Cold Outreach Pipeline
  {
    name: "outreach_brand_assets_workspace",
    title: "Cold Outreach Brand Assets Workspace",
    description:
      "Manage brands, offers, social proof, case studies, and sender personas.",
    category: "Cold Outreach Pipeline",
    method: "GET",
    endpoint: "/api/app/brand-assets",
  },
  {
    name: "outreach_icp_workspace",
    title: "Cold Outreach ICP Workspace",
    description:
      "Create/list/filter/update/delete ICP profiles that drive sequencing decisions.",
    category: "Cold Outreach Pipeline",
    method: "GET",
    endpoint: "/api/tap/icps",
  },
  {
    name: "outreach_sequence_workspace",
    title: "Cold Outreach Sequence Workspace",
    description:
      "Manage outbound sequence lifecycle with mailbox allocation, status, and performance.",
    category: "Cold Outreach Pipeline",
    method: "GET",
    endpoint: "/api/app/sequences",
  },
  {
    name: "outreach_enrollment",
    title: "Cold Outreach Enrollment",
    description:
      "Enroll payload or customer-facing campaign targets into sequences.",
    category: "Cold Outreach Pipeline",
    method: "POST",
    endpoint: "/api/app/sequences/{sequence_id}/enroll",
  },

  // Domains, Mailboxes & File Assets
  {
    name: "domain_mailbox_manage",
    title: "Domain + Mailbox Manage",
    description:
      "CRUD domain and mailbox configuration with health checks for outbound infrastructure.",
    category: "Domains, Mailboxes & File Assets",
    method: "GET",
    endpoint: "/api/domains",
  },
  {
    name: "cold_mail_health",
    title: "Cold Mail Health",
    description:
      "Read outbound readiness from domain and mailbox inventory (counts, active state, issues, health snapshots).",
    category: "Domains, Mailboxes & File Assets",
    method: "GET",
    endpoint: "/api/app/domains",
  },
  {
    name: "customer_image_assets",
    title: "Customer Image Assets",
    description:
      "Upload or remove profile and logo assets used in templates and pages.",
    category: "Domains, Mailboxes & File Assets",
    method: "POST",
    endpoint: "/api/upload",
  },

  // Voice & Localization
  {
    name: "voice_pack_workspace",
    title: "Voice Pack Workspace",
    description:
      "Create/update voice packs and set the active company default for message style.",
    category: "Voice & Localization",
    method: "GET",
    endpoint: "/api/voice-packs",
  },
];

export const MARKSTER_TOOL_USE_CASES: Record<string, MarksterToolUseCaseGuide> =
  {
    sales_intelligence: {
      whenToUse:
        "Use for account research, buying-signal checks, or pricing simulation before pitching a deal.",
      avoid: "Avoid for CRM/task/content operations.",
      exampleArgs: `{"mode":"research","company_name":"Airtame"}`,
      expectedOutput:
        "Research object, signals list, or pricing simulation depending on mode.",
    },
    runtime_mode_switch: {
      whenToUse:
        "Use when you need to force server behavior for demo reliability (live_with_fallback vs strict live vs full mock).",
      avoid:
        "Avoid during normal user workflows; leave default live_with_fallback unless an operator explicitly asks.",
      exampleArgs: `{"mode":"mock"}`,
      expectedOutput:
        "Current runtime mode, previous mode, and whether the override was applied.",
    },
    customer_workspace_snapshot: {
      whenToUse:
        "Use at the start of a session to hydrate profile, onboarding, tasks, notifications, and KPI context in one call.",
      avoid: "Avoid for narrow single-field updates.",
      exampleArgs: "{}",
      expectedOutput:
        "One consolidated customer state payload for fast session bootstrap.",
    },
    customer_profile_manage: {
      whenToUse:
        "Use to read or update customer profile/onboarding-profile defaults.",
      avoid: "Avoid for task actions or content generation.",
      exampleArgs: `{"mode":"update_profile","profile":{"timezone":"Europe/Copenhagen"}}`,
      expectedOutput: "Current profile data or update confirmation payload.",
    },
    contact_profile_workspace: {
      whenToUse:
        "Use to find a specific person, fetch one contact by id, or retrieve enriched profile context.",
      avoid:
        "Avoid broad unfiltered search mode; use mode=list intentionally when broad browsing is needed.",
      exampleArgs: `{"mode":"search","name":"Ivan Ivanka","include_enriched":true}`,
      expectedOutput:
        "Filtered contact results with optional ContactDB enrichment metadata.",
    },
    company_profile_workspace: {
      whenToUse:
        "Use to find a specific company, fetch one company by id, or compare CRM/contactdb company matches.",
      avoid:
        "Avoid broad unfiltered search mode; use mode=list intentionally when broad browsing is needed.",
      exampleArgs: `{"mode":"search","domain":"stripe.com","source":"all","limit":10}`,
      expectedOutput:
        "Filtered company results with provider metadata and optional raw payloads.",
    },
    onboarding_flow_manage: {
      whenToUse:
        "Use to start onboarding, save onboarding answers, or read consolidated onboarding profile state.",
      avoid: "Avoid for unrelated customer profile updates.",
      exampleArgs: `{"mode":"save","step_answers":{"icp":"B2B SaaS founders"}}`,
      expectedOutput: "Onboarding status/progress payload with saved state.",
    },
    onboarding_ai_assist: {
      whenToUse:
        "Use when onboarding needs AI prefill, quality scoring, or default voice-pack generation.",
      avoid: "Avoid for direct dashboard/task workflows.",
      exampleArgs: `{"mode":"score","company_name":"Markster"}`,
      expectedOutput: "AI suggestions/scores or generated onboarding defaults.",
    },
    dashboard_insights: {
      whenToUse:
        "Use when user asks for KPIs, trends, metric history, or dashboard refresh.",
      avoid: "Avoid for non-analytics write actions.",
      exampleArgs: `{"mode":"metrics","metric":"pipeline_created","date_from":"2026-02-01","date_to":"2026-02-20"}`,
      expectedOutput: "Dashboard summary, metric history, or refresh status.",
    },
    pipeline_workspace: {
      whenToUse:
        "Use when user asks directly about pipeline health, stage trends, at-risk deals, or pipeline refresh.",
      avoid:
        "Avoid for non-pipeline analytics; use dashboard_insights for broader KPI requests.",
      exampleArgs: `{"mode":"trend","metric":"pipeline_created","date_from":"2026-02-01","date_to":"2026-02-21"}`,
      expectedOutput:
        "Pipeline-focused overview or metric-history payload from Markster dashboard APIs.",
    },
    task_workspace: {
      whenToUse:
        "Use to inspect task overview/progress before taking task actions.",
      avoid: "Avoid when a specific task action is already known.",
      exampleArgs: "{}",
      expectedOutput: "Task overview/progress snapshot for current customer.",
    },
    task_action: {
      whenToUse:
        "Use to move a task lifecycle state (start, complete, reopen, submit-data, validate).",
      avoid: "Avoid for read-only dashboards or profile lookups.",
      exampleArgs: `{"action":"complete","task_id":"task-123","notes":"Validated by Ivan"}`,
      expectedOutput: "Task action result with updated task status.",
    },
    task_content_regenerate: {
      whenToUse:
        "Use when onboarding-generated task content needs regeneration or rewrite.",
      avoid: "Avoid for non-task content workflows.",
      exampleArgs: `{"task_id":"task-123"}`,
      expectedOutput: "Regenerated task content blocks.",
    },
    ai_team_workspace: {
      whenToUse:
        "Use for AI team agent discovery and conversation lifecycle management.",
      avoid: "Avoid when only a single chat turn is needed.",
      exampleArgs: `{"mode":"create","conversation_name":"Q1 pipeline review"}`,
      expectedOutput: "Agent list or conversation management response.",
    },
    ai_team_chat_turn: {
      whenToUse:
        "Use to send one message into an AI team conversation and receive an answer.",
      avoid: "Avoid for conversation list/create/rename/delete actions.",
      exampleArgs: `{"mode":"send","conversation_id":"conv-123","message":"Summarize current cold outreach risks."}`,
      expectedOutput: "Assistant response for the conversation turn.",
    },
    customer_artifact_workspace: {
      whenToUse:
        "Use to manage customer content artifacts (create, inspect, update, archive, publish/export).",
      avoid: "Avoid for raw document editing.",
      exampleArgs: "{}",
      expectedOutput: "Artifact list/state or action result.",
    },
    customer_document_workspace: {
      whenToUse:
        "Use for CRUD on customer context documents used by downstream AI flows.",
      avoid: "Avoid for generated-post operations.",
      exampleArgs: "{}",
      expectedOutput: "Customer document list/content or action result.",
    },
    customer_data_change_review: {
      whenToUse:
        "Use to review/approve/reject structured data-change proposals.",
      avoid: "Avoid for unrelated profile reads.",
      exampleArgs: "{}",
      expectedOutput: "Proposal queue and review decisions.",
    },
    content_calendar_workspace: {
      whenToUse:
        "Use first for content asks. Default mode returns latest active calendar and posts for the current week.",
      avoid: "Avoid for opening a single post body/media payload.",
      exampleArgs: `{"mode":"current_week"}`,
      expectedOutput:
        "Active calendar metadata plus week_posts[] with item_id/post_id/title/date/channel/theme/image_url.",
    },
    content_post_workspace: {
      whenToUse:
        "Use to open one post or mutate post state (generate/edit/regenerate/approve/schedule).",
      avoid: "Avoid for 'what is on my calendar this week' requests.",
      exampleArgs: `{"mode":"get","post_id":"1234"}`,
      expectedOutput:
        "Single post payload with full text fields and image/video URLs, or mutation result.",
    },
    content_audio_library: {
      whenToUse:
        "Use to list/upload/delete reusable audio assets for media generation.",
      avoid: "Avoid for text-only post changes.",
      exampleArgs: "{}",
      expectedOutput: "Audio asset inventory or mutation result.",
    },
    content_social_accounts: {
      whenToUse:
        "Use before scheduling to inspect which social accounts are currently available.",
      avoid: "Avoid for post content edits.",
      exampleArgs: "{}",
      expectedOutput: "Connected social accounts available for publishing.",
    },
    outreach_brand_assets_workspace: {
      whenToUse:
        "Use when cold-outreach messaging assets (brands/offers/social proof/personas) must be updated.",
      avoid: "Avoid for enrollment or sequence runtime operations.",
      exampleArgs: "{}",
      expectedOutput: "Brand asset inventory or mutation result.",
    },
    outreach_icp_workspace: {
      whenToUse:
        "Use to create/tune ICP definitions that drive cold outreach targeting.",
      avoid: "Avoid for direct contact lookup.",
      exampleArgs: "{}",
      expectedOutput: "ICP definitions and related filter payloads.",
    },
    outreach_sequence_workspace: {
      whenToUse:
        "Use to inspect/manage sequence lifecycle, mailbox allocation, and sequence performance.",
      avoid: "Avoid for one-off enrollment jobs.",
      exampleArgs: "{}",
      expectedOutput: "Sequence objects, status changes, and performance data.",
    },
    outreach_enrollment: {
      whenToUse:
        "Use to enroll specific leads into an outreach sequence/campaign.",
      avoid: "Avoid for sequence template edits.",
      exampleArgs: `{"sequence_id":"seq-12","lead_ids":["lead-1","lead-2"]}`,
      expectedOutput: "Enrollment job status/result payload.",
    },
    domain_mailbox_manage: {
      whenToUse:
        "Use to manage and inspect domain/mailbox configuration and health controls.",
      avoid: "Avoid for summary-only health checks.",
      exampleArgs: "{}",
      expectedOutput: "Domain/mailbox inventory and config action results.",
    },
    cold_mail_health: {
      whenToUse:
        "Use right before outreach sends to verify aggregate domain/mailbox readiness and detect issues.",
      avoid: "Avoid for domain/mailbox mutation workflows.",
      exampleArgs: "{}",
      expectedOutput:
        "Aggregated readiness metrics: totals, active counts, issues, and inventories.",
    },
    customer_image_assets: {
      whenToUse:
        "Use to upload/delete customer-owned logo/profile assets used in outbound content.",
      avoid: "Avoid for non-image brand assets.",
      exampleArgs: `{"mode":"delete","asset_id":"asset-123"}`,
      expectedOutput: "Asset operation result and updated asset metadata.",
    },
    voice_pack_workspace: {
      whenToUse:
        "Use to list voice packs or set the active default voice for generation.",
      avoid: "Avoid for post content editing.",
      exampleArgs: `{"mode":"set_default","voice_pack_id":"vp-42"}`,
      expectedOutput: "Voice pack inventory or default voice update result.",
    },
  };

export const MARKSTER_TOOL_NAMES = MARKSTER_TOOL_CATALOG.map(
  (tool) => tool.name,
);
