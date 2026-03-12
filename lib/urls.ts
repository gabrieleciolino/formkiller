export const urls = {
  auth: {
    login: "/auth/login",
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
