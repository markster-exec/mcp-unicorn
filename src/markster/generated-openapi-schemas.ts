// Auto-generated from Markster OpenAPI spec.
// Do not hand-edit. Regenerate via: npm run openapi:generate

export const MARKSTER_OPENAPI_VERSION = "0.1.0";
export const MARKSTER_TOOL_RESPONSE_SCHEMA_SOURCES = [
  {
    toolName: "ai_team_chat_turn",
    paths: ["/api/app/ai-team/conversations/{conversation_id}/messages"],
    method: "post",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "ai_team_workspace",
    paths: ["/api/app/ai-team/agents"],
    method: "get",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "cold_mail_health",
    paths: ["/api/domains/setup/status"],
    method: "get",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "contact_profile_workspace",
    paths: ["/api/app/contacts/profile"],
    method: "get",
    statusCodes: ["manual"],
    source: "manual:awaiting-openapi-sync",
  },
  {
    toolName: "content_audio_library",
    paths: ["/api/content/audio-tracks"],
    method: "get",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "content_calendar_workspace",
    paths: ["/api/content/calendars"],
    method: "get",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "content_post_workspace",
    paths: ["/api/content/items/{item_id}/post/generate"],
    method: "post",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "content_social_accounts",
    paths: ["/api/content/social-accounts"],
    method: "get",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "customer_artifact_workspace",
    paths: ["/api/app/customer-content/artifacts"],
    method: "get",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "customer_data_change_review",
    paths: ["/api/app/customer-content/proposals"],
    method: "get",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "customer_document_workspace",
    paths: ["/api/app/customer-content/documents"],
    method: "get",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "customer_image_assets",
    paths: ["/api/upload"],
    method: "post",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "customer_profile_manage",
    paths: ["/api/app/me"],
    method: "get",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "customer_workspace_snapshot",
    paths: ["/api/app/me"],
    method: "get",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "dashboard_insights",
    paths: ["/api/app/dashboard"],
    method: "get",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "domain_mailbox_manage",
    paths: ["/api/domains/"],
    method: "get",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "onboarding_ai_assist",
    paths: ["/api/app/onboarding/ai/prefill"],
    method: "post",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "onboarding_flow_manage",
    paths: ["/api/app/onboarding/start"],
    method: "post",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "outreach_brand_assets_workspace",
    paths: ["/api/tap/brand-assets/brands"],
    method: "get",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "outreach_enrollment",
    paths: ["/api/app/sequences/{sequence_id}/enroll"],
    method: "post",
    statusCodes: ["202"],
    source: "openapi",
  },
  {
    toolName: "outreach_icp_workspace",
    paths: ["/api/tap/icps"],
    method: "get",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "outreach_sequence_workspace",
    paths: ["/api/app/sequences"],
    method: "get",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "sales_intelligence",
    paths: ["/api/app/me"],
    method: "get",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "task_action",
    paths: [
      "/api/app/tasks/tasks/{task_id}/complete",
      "/api/app/tasks/tasks/{task_id}/reopen",
      "/api/app/tasks/tasks/{task_id}/start",
      "/api/app/tasks/tasks/{task_id}/submit-data",
      "/api/app/tasks/tasks/{task_id}/validate",
    ],
    method: "post",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "task_content_regenerate",
    paths: ["/api/app/tasks/regenerate"],
    method: "post",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "task_workspace",
    paths: ["/api/app/tasks/overview"],
    method: "get",
    statusCodes: ["200"],
    source: "openapi",
  },
  {
    toolName: "voice_pack_workspace",
    paths: ["/api/voice-packs"],
    method: "get",
    statusCodes: ["200"],
    source: "openapi",
  },
];
export const MARKSTER_TOOL_RESPONSE_SCHEMAS = Object.freeze({
  sales_intelligence: {
    properties: {
      plan_tier: {
        type: "string",
        enum: [
          "sandbox",
          "starter",
          "growth",
          "professional",
          "business",
          "scale",
          "enterprise",
          "start",
          "grow",
          "meeting_machine",
        ],
      },
      calendar_link: {
        anyOf: [
          {
            type: "string",
          },
          {
            type: "null",
          },
        ],
      },
      demo_mode: {
        anyOf: [
          {
            type: "string",
          },
          {
            type: "null",
          },
        ],
      },
      custom_fields: {
        anyOf: [
          {
            additionalProperties: true,
            type: "object",
          },
          {
            type: "null",
          },
        ],
      },
      whatsapp_morning_brief_enabled: {
        anyOf: [
          {
            type: "boolean",
          },
          {
            type: "null",
          },
        ],
        default: false,
      },
      id: {
        type: "integer",
      },
      company_id: {
        type: "integer",
      },
      onboarding_state: {
        anyOf: [
          {
            additionalProperties: true,
            type: "object",
          },
          {
            type: "null",
          },
        ],
      },
      onboarding_completed: {
        type: "integer",
      },
      preferred_language: {
        anyOf: [
          {
            type: "string",
          },
          {
            type: "null",
          },
        ],
        default: "en",
      },
      whatsapp_morning_brief_last_sent_at: {
        anyOf: [
          {
            type: "string",
            format: "date-time",
          },
          {
            type: "null",
          },
        ],
      },
      created_at: {
        type: "string",
        format: "date-time",
      },
      updated_at: {
        anyOf: [
          {
            type: "string",
            format: "date-time",
          },
          {
            type: "null",
          },
        ],
      },
      company: {
        properties: {
          name: {
            type: "string",
          },
          website: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          business_type: {
            anyOf: [
              {
                type: "string",
                enum: [
                  "retail",
                  "local_storefront",
                  "local_mobile_service",
                  "professional_services",
                ],
              },
              {
                type: "null",
              },
            ],
          },
          industry: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          google_folder_id: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          replyio_workspace_id: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          usp: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          icp: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          business_goals: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          industry_trends_email: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          id: {
            type: "integer",
          },
          created_at: {
            type: "string",
            format: "date-time",
          },
          updated_at: {
            anyOf: [
              {
                type: "string",
                format: "date-time",
              },
              {
                type: "null",
              },
            ],
          },
          onboarding_profile: {
            anyOf: [
              {
                additionalProperties: true,
                type: "object",
              },
              {
                type: "null",
              },
            ],
          },
          primary_offer: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          target_role: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          buyer_geo: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          availability_days: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          availability_hours_start: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          availability_hours_end: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          meeting_duration_min: {
            anyOf: [
              {
                type: "integer",
              },
              {
                type: "null",
              },
            ],
          },
          meeting_modes: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          office_address: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          on_site_radius_km: {
            anyOf: [
              {
                type: "integer",
              },
              {
                type: "null",
              },
            ],
          },
          on_site_fee_note: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          weekly_bookings_goal: {
            anyOf: [
              {
                type: "integer",
              },
              {
                type: "null",
              },
            ],
          },
          avg_deal_value: {
            anyOf: [
              {
                type: "integer",
              },
              {
                type: "null",
              },
            ],
          },
          allowed_channels: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          timezone: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
        },
        type: "object",
        required: ["name", "id", "created_at"],
      },
      contacts: {
        items: {
          properties: {
            first_name: {
              type: "string",
            },
            last_name: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            email: {
              type: "string",
              format: "email",
            },
            phone: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            position: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            is_primary: {
              type: "integer",
              default: 0,
            },
            id: {
              type: "integer",
            },
            company_id: {
              type: "integer",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              anyOf: [
                {
                  type: "string",
                  format: "date-time",
                },
                {
                  type: "null",
                },
              ],
            },
          },
          type: "object",
          required: ["first_name", "email", "id", "company_id", "created_at"],
        },
        type: "array",
        default: [],
      },
    },
    type: "object",
    required: [
      "plan_tier",
      "id",
      "company_id",
      "onboarding_completed",
      "created_at",
      "company",
    ],
  },
  customer_workspace_snapshot: {
    properties: {
      plan_tier: {
        type: "string",
        enum: [
          "sandbox",
          "starter",
          "growth",
          "professional",
          "business",
          "scale",
          "enterprise",
          "start",
          "grow",
          "meeting_machine",
        ],
      },
      calendar_link: {
        anyOf: [
          {
            type: "string",
          },
          {
            type: "null",
          },
        ],
      },
      demo_mode: {
        anyOf: [
          {
            type: "string",
          },
          {
            type: "null",
          },
        ],
      },
      custom_fields: {
        anyOf: [
          {
            additionalProperties: true,
            type: "object",
          },
          {
            type: "null",
          },
        ],
      },
      whatsapp_morning_brief_enabled: {
        anyOf: [
          {
            type: "boolean",
          },
          {
            type: "null",
          },
        ],
        default: false,
      },
      id: {
        type: "integer",
      },
      company_id: {
        type: "integer",
      },
      onboarding_state: {
        anyOf: [
          {
            additionalProperties: true,
            type: "object",
          },
          {
            type: "null",
          },
        ],
      },
      onboarding_completed: {
        type: "integer",
      },
      preferred_language: {
        anyOf: [
          {
            type: "string",
          },
          {
            type: "null",
          },
        ],
        default: "en",
      },
      whatsapp_morning_brief_last_sent_at: {
        anyOf: [
          {
            type: "string",
            format: "date-time",
          },
          {
            type: "null",
          },
        ],
      },
      created_at: {
        type: "string",
        format: "date-time",
      },
      updated_at: {
        anyOf: [
          {
            type: "string",
            format: "date-time",
          },
          {
            type: "null",
          },
        ],
      },
      company: {
        properties: {
          name: {
            type: "string",
          },
          website: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          business_type: {
            anyOf: [
              {
                type: "string",
                enum: [
                  "retail",
                  "local_storefront",
                  "local_mobile_service",
                  "professional_services",
                ],
              },
              {
                type: "null",
              },
            ],
          },
          industry: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          google_folder_id: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          replyio_workspace_id: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          usp: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          icp: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          business_goals: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          industry_trends_email: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          id: {
            type: "integer",
          },
          created_at: {
            type: "string",
            format: "date-time",
          },
          updated_at: {
            anyOf: [
              {
                type: "string",
                format: "date-time",
              },
              {
                type: "null",
              },
            ],
          },
          onboarding_profile: {
            anyOf: [
              {
                additionalProperties: true,
                type: "object",
              },
              {
                type: "null",
              },
            ],
          },
          primary_offer: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          target_role: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          buyer_geo: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          availability_days: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          availability_hours_start: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          availability_hours_end: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          meeting_duration_min: {
            anyOf: [
              {
                type: "integer",
              },
              {
                type: "null",
              },
            ],
          },
          meeting_modes: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          office_address: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          on_site_radius_km: {
            anyOf: [
              {
                type: "integer",
              },
              {
                type: "null",
              },
            ],
          },
          on_site_fee_note: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          weekly_bookings_goal: {
            anyOf: [
              {
                type: "integer",
              },
              {
                type: "null",
              },
            ],
          },
          avg_deal_value: {
            anyOf: [
              {
                type: "integer",
              },
              {
                type: "null",
              },
            ],
          },
          allowed_channels: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          timezone: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
        },
        type: "object",
        required: ["name", "id", "created_at"],
      },
      contacts: {
        items: {
          properties: {
            first_name: {
              type: "string",
            },
            last_name: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            email: {
              type: "string",
              format: "email",
            },
            phone: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            position: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            is_primary: {
              type: "integer",
              default: 0,
            },
            id: {
              type: "integer",
            },
            company_id: {
              type: "integer",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              anyOf: [
                {
                  type: "string",
                  format: "date-time",
                },
                {
                  type: "null",
                },
              ],
            },
          },
          type: "object",
          required: ["first_name", "email", "id", "company_id", "created_at"],
        },
        type: "array",
        default: [],
      },
    },
    type: "object",
    required: [
      "plan_tier",
      "id",
      "company_id",
      "onboarding_completed",
      "created_at",
      "company",
    ],
  },
  customer_profile_manage: {
    properties: {
      plan_tier: {
        type: "string",
        enum: [
          "sandbox",
          "starter",
          "growth",
          "professional",
          "business",
          "scale",
          "enterprise",
          "start",
          "grow",
          "meeting_machine",
        ],
      },
      calendar_link: {
        anyOf: [
          {
            type: "string",
          },
          {
            type: "null",
          },
        ],
      },
      demo_mode: {
        anyOf: [
          {
            type: "string",
          },
          {
            type: "null",
          },
        ],
      },
      custom_fields: {
        anyOf: [
          {
            additionalProperties: true,
            type: "object",
          },
          {
            type: "null",
          },
        ],
      },
      whatsapp_morning_brief_enabled: {
        anyOf: [
          {
            type: "boolean",
          },
          {
            type: "null",
          },
        ],
        default: false,
      },
      id: {
        type: "integer",
      },
      company_id: {
        type: "integer",
      },
      onboarding_state: {
        anyOf: [
          {
            additionalProperties: true,
            type: "object",
          },
          {
            type: "null",
          },
        ],
      },
      onboarding_completed: {
        type: "integer",
      },
      preferred_language: {
        anyOf: [
          {
            type: "string",
          },
          {
            type: "null",
          },
        ],
        default: "en",
      },
      whatsapp_morning_brief_last_sent_at: {
        anyOf: [
          {
            type: "string",
            format: "date-time",
          },
          {
            type: "null",
          },
        ],
      },
      created_at: {
        type: "string",
        format: "date-time",
      },
      updated_at: {
        anyOf: [
          {
            type: "string",
            format: "date-time",
          },
          {
            type: "null",
          },
        ],
      },
      company: {
        properties: {
          name: {
            type: "string",
          },
          website: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          business_type: {
            anyOf: [
              {
                type: "string",
                enum: [
                  "retail",
                  "local_storefront",
                  "local_mobile_service",
                  "professional_services",
                ],
              },
              {
                type: "null",
              },
            ],
          },
          industry: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          google_folder_id: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          replyio_workspace_id: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          usp: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          icp: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          business_goals: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          industry_trends_email: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          id: {
            type: "integer",
          },
          created_at: {
            type: "string",
            format: "date-time",
          },
          updated_at: {
            anyOf: [
              {
                type: "string",
                format: "date-time",
              },
              {
                type: "null",
              },
            ],
          },
          onboarding_profile: {
            anyOf: [
              {
                additionalProperties: true,
                type: "object",
              },
              {
                type: "null",
              },
            ],
          },
          primary_offer: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          target_role: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          buyer_geo: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          availability_days: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          availability_hours_start: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          availability_hours_end: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          meeting_duration_min: {
            anyOf: [
              {
                type: "integer",
              },
              {
                type: "null",
              },
            ],
          },
          meeting_modes: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          office_address: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          on_site_radius_km: {
            anyOf: [
              {
                type: "integer",
              },
              {
                type: "null",
              },
            ],
          },
          on_site_fee_note: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          weekly_bookings_goal: {
            anyOf: [
              {
                type: "integer",
              },
              {
                type: "null",
              },
            ],
          },
          avg_deal_value: {
            anyOf: [
              {
                type: "integer",
              },
              {
                type: "null",
              },
            ],
          },
          allowed_channels: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          timezone: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
        },
        type: "object",
        required: ["name", "id", "created_at"],
      },
      contacts: {
        items: {
          properties: {
            first_name: {
              type: "string",
            },
            last_name: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            email: {
              type: "string",
              format: "email",
            },
            phone: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            position: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            is_primary: {
              type: "integer",
              default: 0,
            },
            id: {
              type: "integer",
            },
            company_id: {
              type: "integer",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              anyOf: [
                {
                  type: "string",
                  format: "date-time",
                },
                {
                  type: "null",
                },
              ],
            },
          },
          type: "object",
          required: ["first_name", "email", "id", "company_id", "created_at"],
        },
        type: "array",
        default: [],
      },
    },
    type: "object",
    required: [
      "plan_tier",
      "id",
      "company_id",
      "onboarding_completed",
      "created_at",
      "company",
    ],
  },
  contact_profile_workspace: {
    anyOf: [
      {
        type: "object",
      },
      {
        type: "array",
      },
    ],
  },
  onboarding_flow_manage: {
    properties: {
      responses: {
        anyOf: [
          {
            additionalProperties: true,
            type: "object",
          },
          {
            type: "null",
          },
        ],
      },
      current_step: {
        type: "integer",
        default: 0,
      },
      id: {
        type: "integer",
      },
      survey_id: {
        type: "integer",
      },
      customer_id: {
        type: "integer",
      },
      is_completed: {
        type: "integer",
      },
      started_at: {
        type: "string",
        format: "date-time",
      },
      completed_at: {
        anyOf: [
          {
            type: "string",
            format: "date-time",
          },
          {
            type: "null",
          },
        ],
      },
      last_updated_at: {
        anyOf: [
          {
            type: "string",
            format: "date-time",
          },
          {
            type: "null",
          },
        ],
      },
    },
    type: "object",
    required: ["id", "survey_id", "customer_id", "is_completed", "started_at"],
  },
  onboarding_ai_assist: {
    properties: {
      suggested: {
        additionalProperties: true,
        type: "object",
      },
      reasoning: {
        additionalProperties: {
          type: "string",
        },
        type: "object",
      },
      notes: {
        items: {
          type: "string",
        },
        type: "array",
      },
    },
    type: "object",
  },
  dashboard_insights: {
    properties: {
      customer_id: {
        type: "integer",
      },
      period: {
        type: "string",
      },
      qualified_meetings: {
        type: "integer",
      },
      show_rate: {
        anyOf: [
          {
            type: "number",
          },
          {
            type: "null",
          },
        ],
      },
      positive_reply_rate: {
        anyOf: [
          {
            type: "number",
          },
          {
            type: "null",
          },
        ],
      },
      bookings_per_1k_recipients: {
        anyOf: [
          {
            type: "number",
          },
          {
            type: "null",
          },
        ],
      },
      deliverability_health_index: {
        anyOf: [
          {
            type: "number",
          },
          {
            type: "null",
          },
        ],
      },
      hard_bounce_rate: {
        anyOf: [
          {
            type: "number",
          },
          {
            type: "null",
          },
        ],
      },
      complaint_rate: {
        anyOf: [
          {
            type: "number",
          },
          {
            type: "null",
          },
        ],
      },
      messages_sent: {
        type: "integer",
      },
      leads_generated: {
        type: "integer",
      },
      daily_send_pace: {
        anyOf: [
          {
            type: "integer",
          },
          {
            type: "null",
          },
        ],
      },
      sql_rate: {
        anyOf: [
          {
            type: "number",
          },
          {
            type: "null",
          },
        ],
      },
      time_to_first_send_hours: {
        anyOf: [
          {
            type: "number",
          },
          {
            type: "null",
          },
        ],
      },
      time_to_first_meeting_hours: {
        anyOf: [
          {
            type: "number",
          },
          {
            type: "null",
          },
        ],
      },
      revenue: {
        anyOf: [
          {
            type: "number",
          },
          {
            type: "null",
          },
        ],
      },
      previous_qualified_meetings: {
        anyOf: [
          {
            type: "integer",
          },
          {
            type: "null",
          },
        ],
      },
      previous_messages_sent: {
        anyOf: [
          {
            type: "integer",
          },
          {
            type: "null",
          },
        ],
      },
      previous_revenue: {
        anyOf: [
          {
            type: "number",
          },
          {
            type: "null",
          },
        ],
      },
      previous_positive_reply_rate: {
        anyOf: [
          {
            type: "number",
          },
          {
            type: "null",
          },
        ],
      },
      previous_show_rate: {
        anyOf: [
          {
            type: "number",
          },
          {
            type: "null",
          },
        ],
      },
      previous_bookings_per_1k_recipients: {
        anyOf: [
          {
            type: "number",
          },
          {
            type: "null",
          },
        ],
      },
    },
    type: "object",
    required: [
      "customer_id",
      "period",
      "qualified_meetings",
      "show_rate",
      "positive_reply_rate",
      "bookings_per_1k_recipients",
      "deliverability_health_index",
      "hard_bounce_rate",
      "complaint_rate",
      "messages_sent",
      "leads_generated",
      "daily_send_pace",
      "sql_rate",
      "time_to_first_send_hours",
      "time_to_first_meeting_hours",
      "revenue",
    ],
  },
  task_workspace: {
    additionalProperties: true,
    type: "object",
  },
  task_action: {},
  task_content_regenerate: {},
  ai_team_workspace: {
    items: {
      properties: {
        name: {
          type: "string",
        },
        system_prompt: {
          type: "string",
        },
        specialty: {
          anyOf: [
            {
              type: "string",
            },
            {
              type: "null",
            },
          ],
        },
        is_active: {
          type: "boolean",
          default: true,
        },
        is_default: {
          type: "boolean",
          default: false,
        },
        avatar_emoji: {
          type: "string",
          default: "🤖",
        },
        model: {
          anyOf: [
            {
              type: "string",
            },
            {
              type: "null",
            },
          ],
        },
        tool_allowlist: {
          anyOf: [
            {
              items: {
                type: "string",
              },
              type: "array",
            },
            {
              type: "null",
            },
          ],
        },
        tool_denylist: {
          anyOf: [
            {
              items: {
                type: "string",
              },
              type: "array",
            },
            {
              type: "null",
            },
          ],
        },
        web_grounding_enabled: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "null",
            },
          ],
        },
        deep_research_enabled: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "null",
            },
          ],
        },
        id: {
          type: "integer",
        },
        azure_assistant_id: {
          anyOf: [
            {
              type: "string",
            },
            {
              type: "null",
            },
          ],
        },
        created_at: {
          type: "string",
          format: "date-time",
        },
        updated_at: {
          anyOf: [
            {
              type: "string",
              format: "date-time",
            },
            {
              type: "null",
            },
          ],
        },
      },
      type: "object",
      required: ["name", "system_prompt", "id", "created_at"],
    },
    type: "array",
  },
  ai_team_chat_turn: {},
  customer_artifact_workspace: {
    type: "array",
    items: {
      properties: {
        content: {
          type: "string",
        },
        artifact_type: {
          type: "string",
          enum: [
            "blog_post",
            "social_post",
            "email",
            "strategy_doc",
            "marketing_copy",
            "other",
          ],
        },
        artifact_metadata: {
          anyOf: [
            {
              additionalProperties: true,
              type: "object",
            },
            {
              type: "null",
            },
          ],
        },
        id: {
          type: "integer",
        },
        customer_id: {
          type: "integer",
        },
        conversation_id: {
          anyOf: [
            {
              type: "integer",
            },
            {
              type: "null",
            },
          ],
        },
        created_by_agent_id: {
          anyOf: [
            {
              type: "integer",
            },
            {
              type: "null",
            },
          ],
        },
        status: {
          type: "string",
          enum: ["draft", "approved", "published", "archived"],
        },
        published_at: {
          anyOf: [
            {
              type: "string",
              format: "date-time",
            },
            {
              type: "null",
            },
          ],
        },
        published_url: {
          anyOf: [
            {
              type: "string",
            },
            {
              type: "null",
            },
          ],
        },
        created_at: {
          type: "string",
          format: "date-time",
        },
        updated_at: {
          anyOf: [
            {
              type: "string",
              format: "date-time",
            },
            {
              type: "null",
            },
          ],
        },
        created_by_agent_name: {
          anyOf: [
            {
              type: "string",
            },
            {
              type: "null",
            },
          ],
        },
        conversation_title: {
          anyOf: [
            {
              type: "string",
            },
            {
              type: "null",
            },
          ],
        },
      },
      type: "object",
      required: [
        "title",
        "content",
        "artifact_type",
        "id",
        "customer_id",
        "conversation_id",
        "created_by_agent_id",
        "status",
        "published_at",
        "published_url",
        "created_at",
        "updated_at",
      ],
    },
  },
  customer_document_workspace: {
    type: "array",
    items: {
      properties: {
        content: {
          type: "string",
        },
        document_type: {
          type: "string",
          enum: [
            "brand_guide",
            "tone_voice",
            "positioning",
            "icp_analysis",
            "value_proposition",
            "messaging_framework",
            "other",
          ],
        },
        id: {
          type: "integer",
        },
        customer_id: {
          type: "integer",
        },
        created_by_agent_id: {
          anyOf: [
            {
              type: "integer",
            },
            {
              type: "null",
            },
          ],
        },
        is_active: {
          type: "boolean",
        },
        used_in_context_count: {
          type: "integer",
        },
        last_used_at: {
          anyOf: [
            {
              type: "string",
              format: "date-time",
            },
            {
              type: "null",
            },
          ],
        },
        created_at: {
          type: "string",
          format: "date-time",
        },
        updated_at: {
          anyOf: [
            {
              type: "string",
              format: "date-time",
            },
            {
              type: "null",
            },
          ],
        },
        created_by_agent_name: {
          anyOf: [
            {
              type: "string",
            },
            {
              type: "null",
            },
          ],
        },
      },
      type: "object",
      required: [
        "title",
        "content",
        "document_type",
        "id",
        "customer_id",
        "created_by_agent_id",
        "is_active",
        "used_in_context_count",
        "last_used_at",
        "created_at",
        "updated_at",
      ],
    },
  },
  customer_data_change_review: {
    type: "array",
    items: {
      properties: {
        target_model: {
          type: "string",
          enum: ["Company", "Customer", "Contact"],
        },
        target_record_id: {
          type: "integer",
        },
        changes: {
          additionalProperties: {
            properties: {
              old_value: {},
              new_value: {},
            },
            type: "object",
            required: ["old_value", "new_value"],
          },
          type: "object",
        },
        ai_reasoning: {
          type: "string",
        },
        id: {
          type: "integer",
        },
        customer_id: {
          type: "integer",
        },
        conversation_id: {
          anyOf: [
            {
              type: "integer",
            },
            {
              type: "null",
            },
          ],
        },
        proposed_by_agent_id: {
          anyOf: [
            {
              type: "integer",
            },
            {
              type: "null",
            },
          ],
        },
        status: {
          type: "string",
          enum: ["pending", "approved", "rejected"],
        },
        reviewed_at: {
          anyOf: [
            {
              type: "string",
              format: "date-time",
            },
            {
              type: "null",
            },
          ],
        },
        reviewed_by_user: {
          anyOf: [
            {
              type: "string",
            },
            {
              type: "null",
            },
          ],
        },
        rejection_reason: {
          anyOf: [
            {
              type: "string",
            },
            {
              type: "null",
            },
          ],
        },
        created_at: {
          type: "string",
          format: "date-time",
        },
        proposed_by_agent_name: {
          anyOf: [
            {
              type: "string",
            },
            {
              type: "null",
            },
          ],
        },
        conversation_title: {
          anyOf: [
            {
              type: "string",
            },
            {
              type: "null",
            },
          ],
        },
      },
      type: "object",
      required: [
        "target_model",
        "target_record_id",
        "changes",
        "ai_reasoning",
        "id",
        "customer_id",
        "conversation_id",
        "proposed_by_agent_id",
        "status",
        "reviewed_at",
        "reviewed_by_user",
        "rejection_reason",
        "created_at",
      ],
    },
  },
  content_calendar_workspace: {},
  content_post_workspace: {},
  content_audio_library: {},
  content_social_accounts: {},
  outreach_brand_assets_workspace: {
    properties: {
      brands: {
        items: {
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            customer_id: {
              type: "integer",
            },
            client_id: {
              anyOf: [
                {
                  type: "string",
                  format: "uuid",
                },
                {
                  type: "null",
                },
              ],
            },
            company_name_display: {
              type: "string",
            },
            company_tagline: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            company_description_short: {
              type: "string",
            },
            company_description_long: {
              type: "string",
            },
            founding_story: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            years_in_business: {
              anyOf: [
                {
                  type: "integer",
                },
                {
                  type: "null",
                },
              ],
            },
            team_size_display: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            headquarters_city: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            headquarters_country: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            service_area: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              anyOf: [
                {
                  type: "string",
                  format: "date-time",
                },
                {
                  type: "null",
                },
              ],
            },
          },
          type: "object",
          required: [
            "id",
            "customer_id",
            "company_name_display",
            "company_description_short",
            "company_description_long",
            "created_at",
          ],
        },
        type: "array",
      },
      total: {
        type: "integer",
      },
    },
    type: "object",
    required: ["brands", "total"],
  },
  outreach_icp_workspace: {
    properties: {
      icps: {
        items: {
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            customer_id: {
              type: "integer",
            },
            name: {
              type: "string",
            },
            icp: {
              additionalProperties: true,
              type: "object",
            },
            icp_hash: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            apollo_filters: {
              anyOf: [
                {
                  additionalProperties: true,
                  type: "object",
                },
                {
                  type: "null",
                },
              ],
            },
          },
          type: "object",
          required: ["id", "customer_id", "name", "icp"],
        },
        type: "array",
      },
      total: {
        type: "integer",
      },
    },
    type: "object",
    required: ["icps", "total"],
  },
  outreach_sequence_workspace: {
    properties: {
      view_only: {
        type: "boolean",
        default: false,
      },
      tier: {
        anyOf: [
          {
            type: "string",
          },
          {
            type: "null",
          },
        ],
      },
      sequences: {
        items: {
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            customer_id: {
              type: "integer",
            },
            client_id: {
              anyOf: [
                {
                  type: "string",
                  format: "uuid",
                },
                {
                  type: "null",
                },
              ],
            },
            sequence_name: {
              type: "string",
            },
            icp_id: {
              anyOf: [
                {
                  type: "string",
                  format: "uuid",
                },
                {
                  type: "null",
                },
              ],
            },
            brand_id: {
              anyOf: [
                {
                  type: "string",
                  format: "uuid",
                },
                {
                  type: "null",
                },
              ],
            },
            campaign_id: {
              anyOf: [
                {
                  type: "string",
                  format: "uuid",
                },
                {
                  type: "null",
                },
              ],
            },
            offer_id: {
              anyOf: [
                {
                  type: "string",
                  format: "uuid",
                },
                {
                  type: "null",
                },
              ],
            },
            sender_id: {
              anyOf: [
                {
                  type: "string",
                  format: "uuid",
                },
                {
                  type: "null",
                },
              ],
            },
            sequence_status: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            status: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            channel_mix: {
              anyOf: [
                {
                  items: {
                    type: "string",
                  },
                  type: "array",
                },
                {
                  type: "null",
                },
              ],
            },
            primary_channel: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            reply_behavior: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            auto_pause_on_reply: {
              anyOf: [
                {
                  type: "boolean",
                },
                {
                  type: "null",
                },
              ],
            },
            auto_pause_on_ooo: {
              anyOf: [
                {
                  type: "boolean",
                },
                {
                  type: "null",
                },
              ],
            },
            auto_unsubscribe_on_request: {
              anyOf: [
                {
                  type: "boolean",
                },
                {
                  type: "null",
                },
              ],
            },
            max_steps: {
              anyOf: [
                {
                  type: "integer",
                },
                {
                  type: "null",
                },
              ],
            },
            max_duration_days: {
              anyOf: [
                {
                  type: "integer",
                },
                {
                  type: "null",
                },
              ],
            },
            warmup_template: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            notes: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            sourcing_enabled: {
              anyOf: [
                {
                  type: "boolean",
                },
                {
                  type: "null",
                },
              ],
            },
            daily_cap_override: {
              anyOf: [
                {
                  type: "integer",
                },
                {
                  type: "null",
                },
              ],
            },
            estimated_contact_count: {
              anyOf: [
                {
                  type: "integer",
                },
                {
                  type: "null",
                },
              ],
            },
            replyio_email_account_ids: {
              anyOf: [
                {
                  items: {
                    type: "integer",
                  },
                  type: "array",
                },
                {
                  type: "null",
                },
              ],
            },
            timezone_override: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            allocation_weight: {
              anyOf: [
                {
                  type: "integer",
                },
                {
                  type: "null",
                },
              ],
            },
            replyio_campaign_id: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            replyio_published_version: {
              anyOf: [
                {
                  type: "integer",
                },
                {
                  type: "null",
                },
              ],
            },
            replyio_last_published_at: {
              anyOf: [
                {
                  type: "string",
                  format: "date-time",
                },
                {
                  type: "null",
                },
              ],
            },
            replyio_publish_status: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            replyio_last_publish_error: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            is_template: {
              anyOf: [
                {
                  type: "boolean",
                },
                {
                  type: "null",
                },
              ],
            },
            template_source_id: {
              anyOf: [
                {
                  type: "string",
                  format: "uuid",
                },
                {
                  type: "null",
                },
              ],
            },
            last_run_at: {
              anyOf: [
                {
                  type: "string",
                  format: "date-time",
                },
                {
                  type: "null",
                },
              ],
            },
            last_error: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },
            emails_sent: {
              anyOf: [
                {
                  type: "integer",
                },
                {
                  type: "null",
                },
              ],
            },
            emails_replied: {
              anyOf: [
                {
                  type: "integer",
                },
                {
                  type: "null",
                },
              ],
            },
            emails_bounced: {
              anyOf: [
                {
                  type: "integer",
                },
                {
                  type: "null",
                },
              ],
            },
            good_replies: {
              anyOf: [
                {
                  type: "integer",
                },
                {
                  type: "null",
                },
              ],
            },
            meetings_booked: {
              anyOf: [
                {
                  type: "integer",
                },
                {
                  type: "null",
                },
              ],
            },
            today_allocated: {
              anyOf: [
                {
                  type: "integer",
                },
                {
                  type: "null",
                },
              ],
            },
            today_used: {
              anyOf: [
                {
                  type: "integer",
                },
                {
                  type: "null",
                },
              ],
            },
            has_running_run: {
              anyOf: [
                {
                  type: "boolean",
                },
                {
                  type: "null",
                },
              ],
              default: false,
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              anyOf: [
                {
                  type: "string",
                  format: "date-time",
                },
                {
                  type: "null",
                },
              ],
            },
          },
          type: "object",
          required: ["id", "customer_id", "sequence_name", "created_at"],
        },
        type: "array",
        default: [],
      },
    },
    type: "object",
  },
  outreach_enrollment: {
    properties: {
      job_ids: {
        items: {
          type: "string",
        },
        type: "array",
      },
    },
    type: "object",
    required: ["job_ids"],
  },
  domain_mailbox_manage: {
    items: {
      properties: {
        domain_name: {
          type: "string",
        },
        is_primary: {
          type: "boolean",
          default: false,
        },
        status: {
          type: "string",
          enum: ["pending", "active", "warming_up", "suspended", "failed"],
        },
        email_provider: {
          anyOf: [
            {
              type: "string",
            },
            {
              type: "null",
            },
          ],
        },
        provider_config: {
          anyOf: [
            {
              additionalProperties: true,
              type: "object",
            },
            {
              type: "null",
            },
          ],
        },
        warmup_duration_days: {
          type: "integer",
          default: 30,
        },
        target_warmup_volume: {
          type: "integer",
          default: 50,
        },
        notes: {
          anyOf: [
            {
              type: "string",
            },
            {
              type: "null",
            },
          ],
        },
        custom_fields: {
          anyOf: [
            {
              additionalProperties: true,
              type: "object",
            },
            {
              type: "null",
            },
          ],
        },
        id: {
          type: "integer",
        },
        customer_id: {
          type: "integer",
        },
        setup_completed_at: {
          anyOf: [
            {
              type: "string",
              format: "date-time",
            },
            {
              type: "null",
            },
          ],
        },
        last_health_check: {
          anyOf: [
            {
              type: "string",
              format: "date-time",
            },
            {
              type: "null",
            },
          ],
        },
        dns_records: {
          anyOf: [
            {
              additionalProperties: true,
              type: "object",
            },
            {
              type: "null",
            },
          ],
        },
        warmup_started_at: {
          anyOf: [
            {
              type: "string",
              format: "date-time",
            },
            {
              type: "null",
            },
          ],
        },
        current_warmup_volume: {
          type: "integer",
          default: 0,
        },
        reputation_score: {
          anyOf: [
            {
              type: "number",
            },
            {
              type: "null",
            },
          ],
        },
        bounce_rate: {
          anyOf: [
            {
              type: "number",
            },
            {
              type: "null",
            },
          ],
        },
        complaint_rate: {
          anyOf: [
            {
              type: "number",
            },
            {
              type: "null",
            },
          ],
        },
        open_rate: {
          anyOf: [
            {
              type: "number",
            },
            {
              type: "null",
            },
          ],
        },
        reply_rate: {
          anyOf: [
            {
              type: "number",
            },
            {
              type: "null",
            },
          ],
        },
        health_score: {
          anyOf: [
            {
              type: "number",
            },
            {
              type: "null",
            },
          ],
        },
        last_bounce_check: {
          anyOf: [
            {
              type: "string",
              format: "date-time",
            },
            {
              type: "null",
            },
          ],
        },
        last_complaint_check: {
          anyOf: [
            {
              type: "string",
              format: "date-time",
            },
            {
              type: "null",
            },
          ],
        },
        created_at: {
          type: "string",
          format: "date-time",
        },
        updated_at: {
          anyOf: [
            {
              type: "string",
              format: "date-time",
            },
            {
              type: "null",
            },
          ],
        },
        mailboxes: {
          items: {
            properties: {
              email_address: {
                type: "string",
                format: "email",
              },
              display_name: {
                anyOf: [
                  {
                    type: "string",
                  },
                  {
                    type: "null",
                  },
                ],
              },
              is_primary: {
                type: "boolean",
                default: false,
              },
              status: {
                type: "string",
                enum: [
                  "pending",
                  "active",
                  "warming_up",
                  "suspended",
                  "failed",
                ],
              },
              auth_method: {
                anyOf: [
                  {
                    type: "string",
                  },
                  {
                    type: "null",
                  },
                ],
              },
              daily_send_limit: {
                type: "integer",
                default: 50,
              },
              hourly_send_limit: {
                type: "integer",
                default: 10,
              },
              max_recipients_per_email: {
                type: "integer",
                default: 1,
              },
              warmup_duration_days: {
                type: "integer",
                default: 30,
              },
              target_warmup_volume: {
                type: "integer",
                default: 50,
              },
              signature: {
                anyOf: [
                  {
                    type: "string",
                  },
                  {
                    type: "null",
                  },
                ],
              },
              reply_to_address: {
                anyOf: [
                  {
                    type: "string",
                    format: "email",
                  },
                  {
                    type: "null",
                  },
                ],
              },
              tracking_enabled: {
                type: "boolean",
                default: true,
              },
              notes: {
                anyOf: [
                  {
                    type: "string",
                  },
                  {
                    type: "null",
                  },
                ],
              },
              custom_fields: {
                anyOf: [
                  {
                    additionalProperties: true,
                    type: "object",
                  },
                  {
                    type: "null",
                  },
                ],
              },
              id: {
                type: "integer",
              },
              customer_id: {
                type: "integer",
              },
              domain_id: {
                type: "integer",
              },
              setup_completed_at: {
                anyOf: [
                  {
                    type: "string",
                    format: "date-time",
                  },
                  {
                    type: "null",
                  },
                ],
              },
              last_health_check: {
                anyOf: [
                  {
                    type: "string",
                    format: "date-time",
                  },
                  {
                    type: "null",
                  },
                ],
              },
              auth_config: {
                anyOf: [
                  {
                    additionalProperties: true,
                    type: "object",
                  },
                  {
                    type: "null",
                  },
                ],
              },
              warmup_started_at: {
                anyOf: [
                  {
                    type: "string",
                    format: "date-time",
                  },
                  {
                    type: "null",
                  },
                ],
              },
              current_warmup_volume: {
                type: "integer",
                default: 0,
              },
              emails_sent_today: {
                type: "integer",
                default: 0,
              },
              emails_sent_this_week: {
                type: "integer",
                default: 0,
              },
              emails_sent_this_month: {
                type: "integer",
                default: 0,
              },
              bounce_rate: {
                anyOf: [
                  {
                    type: "number",
                  },
                  {
                    type: "null",
                  },
                ],
              },
              complaint_rate: {
                anyOf: [
                  {
                    type: "number",
                  },
                  {
                    type: "null",
                  },
                ],
              },
              open_rate: {
                anyOf: [
                  {
                    type: "number",
                  },
                  {
                    type: "null",
                  },
                ],
              },
              reply_rate: {
                anyOf: [
                  {
                    type: "number",
                  },
                  {
                    type: "null",
                  },
                ],
              },
              unsubscribe_rate: {
                anyOf: [
                  {
                    type: "number",
                  },
                  {
                    type: "null",
                  },
                ],
              },
              health_score: {
                anyOf: [
                  {
                    type: "number",
                  },
                  {
                    type: "null",
                  },
                ],
              },
              last_activity: {
                anyOf: [
                  {
                    type: "string",
                    format: "date-time",
                  },
                  {
                    type: "null",
                  },
                ],
              },
              last_bounce_check: {
                anyOf: [
                  {
                    type: "string",
                    format: "date-time",
                  },
                  {
                    type: "null",
                  },
                ],
              },
              last_complaint_check: {
                anyOf: [
                  {
                    type: "string",
                    format: "date-time",
                  },
                  {
                    type: "null",
                  },
                ],
              },
              created_at: {
                type: "string",
                format: "date-time",
              },
              updated_at: {
                anyOf: [
                  {
                    type: "string",
                    format: "date-time",
                  },
                  {
                    type: "null",
                  },
                ],
              },
            },
            type: "object",
            required: [
              "email_address",
              "id",
              "customer_id",
              "domain_id",
              "created_at",
            ],
          },
          type: "array",
          default: [],
        },
      },
      type: "object",
      required: ["domain_name", "id", "customer_id", "created_at"],
    },
    type: "array",
  },
  cold_mail_health: {
    properties: {
      customer_id: {
        type: "integer",
      },
      total_domains: {
        type: "integer",
      },
      active_domains: {
        type: "integer",
      },
      total_mailboxes: {
        type: "integer",
      },
      active_mailboxes: {
        type: "integer",
      },
      setup_completion_percentage: {
        type: "number",
      },
      domains_with_issues: {
        items: {
          type: "string",
        },
        type: "array",
        default: [],
      },
      mailboxes_with_issues: {
        items: {
          type: "string",
        },
        type: "array",
        default: [],
      },
      last_health_check: {
        anyOf: [
          {
            type: "string",
            format: "date-time",
          },
          {
            type: "null",
          },
        ],
      },
    },
    type: "object",
    required: [
      "customer_id",
      "total_domains",
      "active_domains",
      "total_mailboxes",
      "active_mailboxes",
      "setup_completion_percentage",
    ],
  },
  customer_image_assets: {},
  voice_pack_workspace: {
    properties: {
      voice_packs: {
        items: {
          properties: {
            name: {
              type: "string",
              maxLength: 255,
              minLength: 1,
            },
            is_company_default: {
              type: "boolean",
              default: false,
            },
            is_active: {
              type: "boolean",
              default: true,
            },
            voice_context: {
              type: "string",
              minLength: 1,
            },
            id: {
              type: "integer",
            },
            customer_id: {
              type: "integer",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
          },
          type: "object",
          required: [
            "name",
            "voice_context",
            "id",
            "customer_id",
            "created_at",
            "updated_at",
          ],
        },
        type: "array",
      },
      total: {
        type: "integer",
      },
      company_default_id: {
        anyOf: [
          {
            type: "integer",
          },
          {
            type: "null",
          },
        ],
      },
    },
    type: "object",
    required: ["voice_packs", "total"],
  },
} as const);
export const MARKSTER_TOOL_COUNT = 27;
