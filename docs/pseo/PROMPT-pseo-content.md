# pSEO Content Generation Prompt

Use this prompt with Claude, ChatGPT, or any LLM to generate landing page content.

---

## Test Variables

Copy these into the prompt where indicated:

### Service: MVP Development
```
Service Name: MVP Development
Service Description: Go from idea to working product in weeks. Validate before you invest everything.
Price Range: $5-12K
Timeline: 2-4 weeks
Key Features:
- Core features that prove your idea
- User auth & responsive design
- Deployed and ready for users
- 1 week of post-launch support
```

### City: Sydney
```
City Name: Sydney
State: NSW
Local Details:
- Startup ecosystem: 2,500+ tech startups, largest in Australia
- Key hubs: Tech Central (Central-Eveleigh), Barangaroo, North Sydney
- Dominant industries: Fintech, SaaS, professional services, property tech
- Local accelerators: Startmate, Antler, Stone & Chalk
- Business culture: Fast-moving, competitive, high expectations
```

### City: Melbourne (Alternative Test)
```
City Name: Melbourne
State: VIC
Local Details:
- Startup ecosystem: 2,000+ startups, strong creative/design focus
- Key hubs: Cremorne (tech precinct), Collingwood, CBD
- Dominant industries: Retail tech, health tech, creative industries, hospitality
- Local accelerators: LaunchVic programs, Melbourne Accelerator Program
- Business culture: Design-conscious, relationship-focused, strong café culture
```

### City: Perth (Alternative Test)
```
City Name: Perth
State: WA
Local Details:
- Business context: Mining and resources capital, $170B+ export industry
- Key industries: Mining tech, construction, engineering services, agriculture
- Pain points: Legacy systems, remote workforce management, compliance
- Business culture: Practical, results-focused, less hype than east coast
- Unique factor: 2-3 hour time difference from eastern states
```

---

## The Prompt

Copy everything below this line and paste into your LLM:

---

You are writing landing page content for JARVE, a one-person Australian web development business run by James, based in Australia.

## Background on James/JARVE
- Ran a painting business for 20 years before teaching himself to code
- Builds custom web apps, MVPs, and internal tools
- Direct, practical communication style — not corporate or salesy
- Solo operator, not an agency with account managers
- Australian business (ABN registered, AUD pricing, ACST/ACDT timezone)

## Page Context

**Service:** MVP Development  
**City:** Sydney, NSW  
**Price Range:** $5-12K  
**Timeline:** 2-4 weeks

**Local Details:**
- Startup ecosystem: 2,500+ tech startups, largest in Australia
- Key hubs: Tech Central (Central-Eveleigh), Barangaroo, North Sydney
- Dominant industries: Fintech, SaaS, professional services, property tech
- Local accelerators: Startmate, Antler, Stone & Chalk
- Business culture: Fast-moving, competitive, high expectations

## Voice and Tone

Write like James would — a practical tradesman who now builds software. NOT like a marketing agency.

**DO:**
- Be direct and matter-of-fact
- Use simple language a business owner understands
- Sound like a real person, not a brochure
- Be specific and concrete (numbers, examples)
- Australian English spelling

**DON'T:**
- Use filler phrases like "[City] moves fast" or "in today's competitive landscape"
- Sound corporate or polished
- Use buzzwords (cutting-edge, innovative, leverage, synergy)
- Name-drop suburbs just to seem local — only reference locations if genuinely relevant
- Say "we" — James works alone, use "I"

## Required Sections

Keep content SHORT and SCANNABLE. These are pSEO pages, not blog posts.

### 1. Hero Headline (max 8 words)
- Punchy, direct benefit
- City name should feel natural, not forced
- If the headline works better without the city name, leave it out

### 2. Hero Subheadline (max 20 words)
- One clear sentence
- Mention timeline or price if it fits naturally

### 3. City Context (max 50 words)
- ONE specific, genuinely local insight about why this service matters here
- Reference a real local detail (industry concentration, specific business challenge, ecosystem fact)
- NOT generic "lots of businesses here need software"

### 4. Problem Statement (max 60 words)
- What's the actual pain?
- Be specific to this service type
- Short, punchy sentences
- "You" language

### 5. Solution (max 60 words)
- How James solves it
- Mention timeline naturally
- Concrete, not abstract

### 6. Three Benefits (max 25 words each)
- Title: 3-4 words
- Description: One sentence, specific outcome
- No fluff

### 7. Local Signals
Things that matter to a local business owner choosing a developer:
- Timezone alignment
- Australian business context (ABN, AUD, local payment)
- Communication style
- Any in-person availability (if applicable to this city)

Generate 2-3 short, practical local signals.

### 8. CTA Text (max 6 words)
- Direct action
- No "Let's" or "Let us" — sounds corporate

### 9. Meta Description (max 150 characters)
- City + service + key differentiator
- Written for humans, not keyword stuffing

### 10. FAQs (3-5)
- 3-5 genuinely different questions — cover pricing, process, timeline, technical, and local angles
- Each answer 40-50 words, practical and direct
- No rephrased versions of the same question

### 11. Testimonial Match
- 15-word description of the ideal testimonial for this page
- Specific enough to filter a database

## Output Format

Return as JSON:

```json
{
  "heroHeadline": "",
  "heroSubheadline": "",
  "cityContext": "",
  "problemStatement": "",
  "solution": "",
  "benefits": [
    { "title": "", "description": "" },
    { "title": "", "description": "" },
    { "title": "", "description": "" }
  ],
  "localSignals": [
    "",
    "",
    ""
  ],
  "ctaText": "",
  "metaDescription": "",
  "faq": [
    { "question": "", "answer": "" },
    { "question": "", "answer": "" },
    { "question": "", "answer": "" }
  ],
  "testimonialMatch": "",
  "layout": ""
}

**Note on `layout`:** The generator script assigns a random layout variant (standard, problem-first, faq-heavy, benefits-grid, story-flow) automatically. The LLM does not need to output this field — it will be overwritten by post-processing.
```

## Quality Check Before Responding

Before outputting, verify:
1. Could this content work for ANY city if you swapped the name? If yes, it's too generic. Add real local specificity.
2. Does it sound like marketing copy or like a practical person explaining their service? It should be the latter.
3. Is anything over the word limit? Cut it down.
4. Did you use any filler phrases? Remove them.
5. Is your heroHeadline just "[Service] [City]"? That's keyword stuffing — rewrite as a benefit.
6. Is your ctaText identical to what you'd write for any other page? Make it specific.
7. Did you say "we" anywhere? Change to "I".

Generate the content now.

**Note:** The generator script assigns `layout` automatically (overrides any LLM output) and post-processes all "we" → "I" using word-boundary matching (`\bwe\b`) to avoid corrupting words like "somewhere" or "between".

---

## Testing Checklist

After generating, verify:

**Authenticity:**
- [ ] Would this work for ANY city if you swapped the name? (If yes, it's too generic)
- [ ] Does it sound like a real person or a marketing brochure?
- [ ] City context references something genuinely specific to that market
- [ ] No filler phrases ("moves fast", "competitive landscape", "cutting-edge")

**Voice:**
- [ ] First person singular ("I" not "we")
- [ ] Direct and practical, not polished
- [ ] Sounds like an ex-tradie who builds software, not a marketing agency
- [ ] Australian English spelling

**Structure:**
- [ ] All sections within word limits
- [ ] Content is scannable (short paragraphs, punchy sentences)
- [ ] Local signals are practical (timezone, ABN, etc.), not fluff
- [ ] JSON is valid

**Local Specificity:**
- [ ] City context mentions a real local detail (ecosystem size, specific industry, hub)
- [ ] Local signals would actually matter to someone in that city
- [ ] FAQ is something a local business owner would genuinely ask

---

## Alternative Service Variables

### Web App Development
```
Service Name: Web App Development
Service Description: Custom web apps that replace spreadsheets, automate workflows, and actually get used.
Price Range: $12-25K
Timeline: 4-8 weeks
Key Features:
- Everything in MVP
- Integrations with your existing tools
- Admin dashboard & reporting
- 2 weeks of post-launch support
Common Use Cases:
- Client portals
- Booking/scheduling systems
- Custom CRM
- Operations dashboards
- Quote/proposal systems
Typical Client: Established business (5-50 staff) that's outgrown spreadsheets and generic tools
```

### Internal Tools
```
Service Name: Internal Tools
Service Description: Dashboards, admin panels, and workflow tools your team will actually use.
Price Range: $8-20K
Timeline: 3-6 weeks
Key Features:
- Custom to your process
- Integrates with your existing stack
- Built for daily operations
- Training and documentation included
Common Use Cases:
- Admin dashboards
- Staff scheduling
- Job/project management
- Inventory tracking
- Reporting tools
Typical Client: Operations manager or business owner tired of workarounds
```

### Custom Software
```
Service Name: Custom Software Development
Service Description: Bespoke software solutions for complex business problems that off-the-shelf tools can't solve.
Price Range: $15-40K
Timeline: 6-12 weeks
Key Features:
- Custom architecture design
- Scalable infrastructure
- Ongoing support options
- Full documentation and handoff
Common Use Cases:
- Multi-user platforms
- Complex business logic
- Industry-specific requirements
- Integration-heavy systems
Typical Client: Business with a specific problem that off-the-shelf tools can't solve
```

### Business Automation
```
Service Name: Business Automation
Service Description: Automate repetitive tasks and connect your tools so your team can focus on real work.
Price Range: $5-15K
Timeline: 2-4 weeks
Key Features:
- Workflow automation
- Tool integrations (Xero, Google, Slack, etc.)
- Custom dashboards
- Reduce manual data entry
Common Use Cases:
- Invoice automation
- Lead routing
- Report generation
- Data sync between tools
- Notification systems
Typical Client: Business owner who spends hours on repetitive admin tasks
```

---

## All Cities Reference

### Tier 1 (Priority)

**Sydney, NSW**
```
- Startup ecosystem: 2,500+ tech startups, largest in Australia
- Key hubs: Tech Central (Central-Eveleigh), Barangaroo, North Sydney
- Dominant industries: Fintech, SaaS, professional services, property tech
- Local accelerators: Startmate, Antler, Stone & Chalk
- Business culture: Fast-moving, competitive, high expectations
- Unique: ~40% of Australia's tech investment flows here
```

**Melbourne, VIC**
```
- Startup ecosystem: 2,000+ startups, strong creative/design focus
- Key hubs: Cremorne (tech precinct), Collingwood, CBD
- Dominant industries: Retail tech, health tech, creative industries, hospitality
- Local accelerators: LaunchVic programs, Melbourne Accelerator Program
- Business culture: Design-conscious, relationship-focused
- Unique: Australia's largest concentration of health tech startups
```

**Brisbane, QLD**
```
- Growing tech scene: $1B+ annual tech investment
- Key industries: Construction tech, property, mining services, tourism
- Business challenges: Rapid growth, need to scale operations
- Local context: Major infrastructure boom (Olympics 2032)
- Business culture: Practical, less formal than Sydney/Melbourne
- Unique: Fastest-growing capital city in Australia
```

**Perth, WA**
```
- Economy: Mining and resources capital, $170B+ export industry
- Key industries: Mining tech, construction, engineering services, agriculture
- Business challenges: Legacy systems, remote workforce, compliance
- Business culture: Practical, results-focused, less hype than east coast
- Unique: 2-3 hour time difference from eastern states
- Pain point: Hard to find developers who understand resources sector
```

**Adelaide, SA** ⭐ HOME BASE
```
- HOME BASE: James/JARVE is based in Adelaide — only city where in-person meetings are standard
- Key industries: Defence ($90B shipbuilding program), health, wine, manufacturing
- Growing tech: Lot Fourteen innovation precinct, Australian Space Agency HQ
- Business culture: Relationship-driven, lower cost base than east coast
- Unique: Australia's defence capital, Lot Fourteen is largest innovation precinct
- Advantage: 30-40% lower operating costs than Sydney
```

### Tier 2

**Gold Coast, QLD**
```
- Industries: Tourism ($5B+), property development, health & wellness, marine
- Business challenges: Seasonal fluctuations, booking/scheduling systems
- Culture: Lifestyle-focused, small business heavy
- Unique: Australia's 6th largest city, massive short-term rental market
```

**Newcastle, NSW**
```
- Transition: From coal/steel to diversified economy
- Key industries: Mining services, healthcare, university/education, renewable energy
- Business culture: Working class roots, practical approach
- Unique: Major hub for Hunter Valley region businesses
```

**Canberra, ACT**
```
- Economy: 75% government-related
- Key industries: Defence contractors, policy/research, associations, education
- Business challenges: Government procurement, compliance, security clearances
- Unique: Highest average income in Australia, very stable economy
```

**Hobart, TAS**
```
- Key industries: Tourism, agriculture, Antarctic research, creative industries
- Business culture: Small community, relationships matter, boutique focus
- Unique: Smallest capital but fastest growing property market
- Challenge: Limited local tech talent, remote work essential
```

### Tier 3

**Geelong, VIC** — Manufacturing transition, health precinct, commuter city to Melbourne
**Townsville, QLD** — Defence (Lavarack Barracks), mining services, James Cook University
**Cairns, QLD** — Tourism gateway, marine industries, tropical agriculture
**Darwin, NT** — Defence, resources, Asian trade gateway, government services
**Toowoomba, QLD** — Agricultural hub, Inland Rail terminus, logistics

---

## Quick Test Combinations

Test these to see genuine variation:

1. **MVP Development + Sydney** — Startup validation angle
2. **Web App Development + Perth** — Mining/resources modernisation  
3. **Internal Tools + Brisbane** — Construction boom, scaling operations
4. **Business Automation + Adelaide** — Defence compliance, process efficiency
5. **Custom Software + Canberra** — Government contractor needs

The content should feel meaningfully different for each, not just city-name swaps.
