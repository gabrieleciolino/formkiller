export const urls = {
  auth: {
    login: "/auth/login",
  },
  admin: {
    index: "/admin",
    forms: {
      index: "/admin/forms",
      create: "/admin/forms/create",
      detail: (formId: string) => `/admin/forms/${formId}`,
    },
    leads: {
      index: "/admin/leads",
      detail: (leadId: string) => `/admin/leads/${leadId}`,
    },
    sessions: {
      index: "/admin/sessions",
    },
    library: {
      index: "/admin/library",
    },
  },
  dashboard: {
    index: "/dashboard",
    forms: {
      index: "/dashboard/forms",
      create: "/dashboard/forms/create",
      detail: (formId: string) => `/dashboard/forms/${formId}`,
    },
    leads: {
      index: "/dashboard/leads",
      detail: (leadId: string) => `/dashboard/leads/${leadId}`,
    },
    sessions: {
      index: "/dashboard/sessions",
    },
    library: {
      index: "/dashboard/library",
    },
  },
  form: (formId: string) => `/form/${formId}`,
};
