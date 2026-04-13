// Luminary Labs — Site Data (2026 Overhaul)

const SERVICES = [
  {
    id: "portfolio-setup",
    icon: "🎨",
    title: "Professional Portfolio Setup",
    price: "$750",
    timeline: "1 week",
    description: "A stunning, custom-built portfolio website that showcases your work and lands you clients. Fully responsive, SEO-optimized, and ready to deploy.",
    note: null,
    featured: false
  },
  {
    id: "html5-game",
    icon: "🌐",
    title: "HTML5 Gaming Experience MVP",
    price: "$1,250",
    timeline: "1 week",
    description: "An interactive HTML5 game or experience that can be embedded directly into any website. Perfect for marketing campaigns, education, or engagement.",
    note: "Embeddable in any website",
    featured: false
  },
  {
    id: "web-app",
    icon: "⚡",
    title: "Backend-Integrated Web App MVP",
    price: "$2,000",
    timeline: "1 week",
    description: "A full-stack web application with backend integration, database, and API layer. Delivered as a pitchable MVP ready for investor demos or user testing.",
    note: "Customer pays for hosting",
    featured: true
  },
  {
    id: "ai-app",
    icon: "🤖",
    title: "AI-Integrated App Development",
    price: "$3,500",
    timeline: "2 weeks",
    description: "We integrate local GGUF models or cloud APIs to build an AI-powered experience — chatbots, content generation, intelligent automation — as a pitchable MVP.",
    note: "Customer pays for API costs",
    featured: false
  },
  {
    id: "xr-app",
    icon: "🥽",
    title: "XR App Development",
    price: "$4,000",
    timeline: "4 weeks",
    description: "A complete XR application built and delivered as an APK. Covers design, development, testing, and deployment-ready packaging for Quest or other headsets.",
    note: null,
    featured: false
  }
];

const ACTIVE_CONTRACTS = [
  {
    id: "vending-backpack",
    title: "Vending Backpack",
    partner: "Aldervon Systems",
    status: "gaining",
    statusLabel: "Gaining Income",
    description: "A formal partnership developing IoT-integrated vending solutions. Subscription-based revenue model at scale with monthly recurring income per deployed machine.",
    image: null
  },
  {
    id: "museum-multiverse",
    title: "Museum Multiverse",
    partner: "MadeInBrooklynGames",
    status: "active",
    statusLabel: "Actively Paying",
    description: "Published on the Quest Store. A VR experience exploring different realms through puzzles and narrative. Ongoing milestone-based development contract.",
    image: "public/PortfolioImages/MuseumMultiverse.png"
  },
  {
    id: "westfield-spatial",
    title: "Westfield Spatial XR Experience",
    partner: "Wooly Studios",
    status: "cold",
    statusLabel: "Opportunity",
    description: "A spatial XR experience for Westfield/Unibail retail environments. Strong connection with Wooly Studios in the Spatial 360 video space. New SLAM technology provides competitive pricing advantage.",
    image: null
  }
];

const PAST_WORK = [
  {
    id: "dancing-ancestors",
    title: "Dancing With The Ancestors",
    description: "A PhD project by Sultan Sharrief, presented at the Black Bar Social at the LA Music Center. We designed and implemented advanced VFX and shaders for Depthkit volumetric clips, building custom environments for each character.",
    image: "public/PortfolioImages/DancingWithTheAncestors.webp"
  },
  {
    id: "oticon",
    title: "Oticon Hearing Tech",
    description: "An audio-first VR experience showcasing Oticon hearing aids for Veterans. Built in Unity with VR Interaction Framework for Quest devices.",
    image: "public/PortfolioImages/Oticon.webp"
  },
  {
    id: "pillow",
    title: "Pillow Sleep App",
    description: "A published immersive mixed reality app designed for use lying down. Features four interactive dreams with unique mechanics and co-op play on Quest.",
    image: "public/PortfolioImages/Pillow.webp"
  }
];

const TEAM = [
  {
    id: "angel",
    name: "Angel Berger",
    role: "CEO",
    pronouns: "She/They",
    bio: "Angel is our approachable and pragmatic leader in executive operations at Luminary Labs. They keep the ship running smoothly and make sure our clients always receive the results they are looking for.",
    image: "public/BioPics/Angel.jpeg"
  },
  {
    id: "simon",
    name: "Simon Swartout",
    role: "CVO",
    pronouns: "He/Him",
    bio: "Simon is the Chief Vision Officer of Luminary Labs and a lead developer on the team. The role of Chief Vision Officer was invented to make sure that Luminary Labs never waivers from its mission statement and that the company's interpersonal connections remain strong.",
    image: "public/BioPics/Simon.jpeg"
  },
  {
    id: "crimson",
    name: "Crimson Wheeler",
    role: "CTO",
    pronouns: "He/Him",
    bio: "Crimson is the chief technical officer of Luminary Labs LLC and therefore heads our technical operations. Our backend software pipeline is managed by Crimson, as he doubles as our studio architect. Crimson plays a pivotal role in automating studio operations and integrating AI into our workflows.",
    image: "public/BioPics/Crimson.jpg"
  },
];

const NEXUS_PRODUCTS = [
  {
    id: "nexus-engine",
    icon: "⚙️",
    title: "Nexus Engine",
    status: "pre-release",
    statusLabel: "Pre-Release · Q3 2026",
    description: "A standalone, interoperable orchestration engine for modular game development and AI logic pipelines. Runs in C#, Dart, and future C++ environments.",
    features: ["Phase-Driven Lifecycle", "Hierarchical Sequencing", "Zero-Alloc Async (NexusTask)", "Multi-Runtime (Unity, Dart CLI)"]
  },
  {
    id: "nexus-ar",
    icon: "📱",
    title: "Nexus AR Dashboard",
    status: "in-dev",
    statusLabel: "In Development",
    description: "Create easy AR experiences with a visual dashboard. Designed for rapid prototyping and deployment of augmented reality content.",
    features: ["Visual AR Builder", "Rapid Prototyping", "Cross-Platform Export"]
  },
  {
    id: "nexus-central",
    icon: "🧠",
    title: "NexusCentral",
    status: "pre-release",
    statusLabel: "Triceratops RC · v1.0 Nov 2026",
    description: "A robust platform for agentic orchestration with local-first AI. Desktop (Avalonia), Runtime (Rust), CLI (Python), and Web (Next.js) — unified by a tool namespace contract.",
    features: ["4-Endpoint Protocol", "Rust Native Runtime", "Integration Registry", "Offline-First"]
  }
];
