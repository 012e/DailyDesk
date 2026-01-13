export const DEFAULT_TEMPLATES = [
  {
    id: "system-1-on-1",
    name: "1-on-1 Meeting Agenda",
    description: "Template for weekly 1-on-1 meetings with direct reports or managers.",
    coverColor: "#4bce97", // Green
    labels: [
      { name: "Meeting", color: "#4bce97" },
      { name: "Priority", color: "#f5cd47" }
    ],
    checklist: [
      { name: "Review progress on current tasks", completed: false },
      { name: "Discuss blockers and challenges", completed: false },
      { name: "Feedback session", completed: false },
      { name: "Action items for next week", completed: false }
    ]
  },
  {
    id: "system-project-plan",
    name: "Project Planning",
    description: "Standard structure for planning a new project or feature.",
    coverColor: "#579dff", // Blue
    checklist: [
      { name: "Define goals and objectives", completed: false },
      { name: "Identify key stakeholders", completed: false },
      { name: "Create timeline and milestones", completed: false },
      { name: "Resource allocation", completed: false },
      { name: "Risk assessment", completed: false }
    ]
  },
  {
    id: "system-bug-report",
    name: "Bug Report",
    description: "Standard format for reporting bugs.",
    coverColor: "#f87168", // Red
    labels: [
      { name: "Bug", color: "#f87168" }
    ],
    checklist: [
      { name: "Steps to reproduce", completed: false },
      { name: "Expected behavior", completed: false },
      { name: "Actual behavior", completed: false },
      { name: "Screenshots/Logs attached", completed: false }
    ]
  },
  {
    id: "system-onboarding",
    name: "New Employee Onboarding",
    description: "Checklist for onboarding a new team member.",
    coverColor: "#9f8fe3", // Purple
    checklist: [
      { name: "Set up email and accounts", completed: false },
      { name: "Hardware setup (Laptop, Monitor)", completed: false },
      { name: "Team introduction", completed: false },
      { name: "Review company policies", completed: false },
      { name: "First week goals", completed: false }
    ]
  }
];
