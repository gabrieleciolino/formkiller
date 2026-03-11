export const urls = {
  auth: {
    login: "/auth/login",
  },
  dashboard: {
    index: "/dashboard",
    forms: {
      index: "/dashboard/forms",
      detail: (formId: string) => `/dashboard/forms/${formId}`,
    },
    leads: {
      index: "/dashboard/leads",
      detail: (leadId: string) => `/dashboard/leads/${leadId}`,
    },
  },
  form: (formId: string) => `/form/${formId}`,
};
