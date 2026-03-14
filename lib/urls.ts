export const urls = {
  home: "/",
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
    tests: {
      index: "/admin/tests",
      create: "/admin/tests/create",
      detail: (testId: string) => `/admin/tests/${testId}`,
    },
    slides: {
      index: "/admin/slides",
      detail: (testId: string) => `/admin/slides/${testId}`,
    },
    users: {
      index: "/admin/users",
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
  form: (assignmentId: string) => `/form/${assignmentId}`,
  test: (slug: string) => `/test/${slug}`,
};
