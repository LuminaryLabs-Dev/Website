// NexusCentral Landing Page Data
const NEXUS_CENTRAL_DATA = {
  hero: {
    title: "Democratizing AI",
    titleAccent: "Operational Workflows",
    subtitle: "A unified control plane for your distributed AI ecosystem. We are building the open-source infrastructure to make enterprise-grade agent routing, workflow orchestration, and tooling accessible to everyone.",
    releaseDate: "June 15th, 2026",
    earlyAccessCount: "2,400+",
    ctaText: "Request Access"
  },
  fundraiser: {
    title: "Open Source Fundraiser",
    description: "Help us reach our goal before the June 15th launch.",
    raised: 18450,
    goal: 25000,
    currency: "$",
    stripeLink: "#donate"
  },
  features: [
    {
      id: "console",
      title: "Operational Discipline",
      description: "Moving beyond simple 'chat bubbles'. The NexusCentral desktop console (built in C#/Avalonia) provides a high-density operator view. Monitor agents, read live reasoning traces, and manage memory context like a true system admin.",
      points: [
        "Real-time reasoning traces",
        "High-density information layout"
      ],
      image: "public/NexusCentralPics/console_abstract.png",
      iconColor: "bg-blue-100 text-nexus-primary",
      iconPath: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      skew: true,
      reverse: false,
      rotation: "rotate-1"
    },
    {
      id: "wrapper",
      title: "The \"Wrapper\" Standard",
      description: "Bridging the gap between static scripts and AI. Our innovative wrapper standard allows you to turn any existing CLI tool, Python script, or local program into a fully functional, self-documenting \"Nexus Agent\".",
      points: [
        "Instant CLI integration",
        "Standardized input/output schemas"
      ],
      image: "public/NexusCentralPics/wrapper_abstract.png",
      iconColor: "bg-purple-100 text-nexus-secondary",
      iconPath: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
      skew: false,
      reverse: true,
      rotation: "-rotate-1"
    },
    {
      id: "routing",
      title: "LAN-Aware Routing",
      description: "True distributed AI. NexusCentral features built-in peer discovery. Share models and delegate agent tasks seamlessly across multiple machines on your local network—no complicated cloud setups required.",
      points: [],
      note: {
        title: "Local API Nervous System",
        text: "Powered by a local integration core on port 3005, enabling instant cross-device communication."
      },
      image: "public/NexusCentralPics/routing_abstract.png",
      iconColor: "bg-sky-100 text-nexus-accent",
      iconPath: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
      skew: true,
      skewConfig: "background: #F1F5F9; transform: skewY(2deg);",
      reverse: false,
      rotation: "rotate-2"
    },
    {
      id: "workflows",
      title: "Workflow Ladders",
      description: "Design complex, multi-step agent chaining visually. The automation platform maps directly to human-readable YAML/JSON, letting you orchestrate sophisticated operations without writing boilerplate code.",
      points: [],
      image: "public/NexusCentralPics/workflow_abstract.png",
      iconColor: "bg-orange-100 text-orange-600",
      iconPath: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      skew: false,
      reverse: true,
      rotation: "-rotate-2"
    }
  ],
  footer: {
    copy: "© 2026 NexusCentral. Democratizing AI Operations.",
    links: [
      { label: "Luminary Labs Home", href: "index.html" },
      { label: "Open Source", href: "opensource.html" },
      { label: "Contact", href: "contact.html" }
    ]
  }
};
