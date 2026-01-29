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
Business Context: Australia's largest city and tech hub, home to thousands of startups and established businesses. Strong presence of finance, professional services, and technology companies.
```

### City: Melbourne (Alternative Test)
```
City Name: Melbourne
State: VIC
Business Context: Australia's creative and cultural capital with a thriving startup ecosystem. Known for its strong retail, hospitality, and professional services sectors.
```

### City: Perth (Alternative Test)
```
City Name: Perth
State: WA
Business Context: Western Australia's economic engine, driven by mining, resources, and construction. Growing tech scene with businesses looking to modernise operations.
```

---

## The Prompt

Copy everything below this line and paste into your LLM:

---

You are writing landing page content for JARVE, an Australian web development agency run by James. 

## Page Context

**Service:** MVP Development
**City:** Sydney, NSW
**Price Range:** $5-12K
**Timeline:** 2-4 weeks
**Business Context:** Australia's largest city and tech hub, home to thousands of startups and established businesses. Strong presence of finance, professional services, and technology companies.

## Brand Voice

- Direct and confident, not salesy or corporate
- Speak to business owners and founders, not developers
- Focus on outcomes and business results, not technical details
- Australian English spelling (colour, optimise, etc.)
- First person singular when referring to JARVE ("I build..." not "We build...")
- No clichés like "in today's fast-paced world" or "cutting-edge solutions"
- No emojis

## Required Sections

Generate each section with the specified word count. Be specific and practical, not generic.

### 1. Hero Headline
- Maximum 10 words
- Mention the city name naturally
- Focus on the core benefit/outcome
- Make it punchy and direct

### 2. Hero Subheadline  
- Maximum 30 words
- Expand on the headline
- Mention the service type
- Include a hint of the timeline or value proposition

### 3. City Context
- 60-80 words
- Why businesses in this specific city need this service
- Reference the local business environment genuinely
- Make it feel locally relevant, not like you just swapped in a city name
- Mention specific industries or business types common in this city

### 4. Problem Statement
- 80-100 words
- What pain points does this service solve?
- Be specific to the service type (MVP = validation, speed to market, etc.)
- Use "you" language to speak directly to the reader
- Paint a picture of their current frustration

### 5. Solution Overview
- 80-100 words
- How JARVE solves this problem
- Mention the timeline naturally
- Focus on the process and what they'll get
- Keep it practical, not abstract

### 6. Three Key Benefits
- Each benefit needs a bold title (3-5 words) and description (30-40 words)
- Make benefits specific to this service type
- Focus on business outcomes, not features
- Vary the angle of each benefit (speed, cost, quality, etc.)

### 7. CTA Text
- Maximum 8 words
- Action-oriented
- Creates urgency without being pushy

### 8. Meta Description
- Maximum 155 characters
- Include city name and service
- Compelling reason to click
- Natural, not keyword-stuffed

## Output Format

Return your response as JSON with this exact structure:

```json
{
  "heroHeadline": "Your headline here",
  "heroSubheadline": "Your subheadline here",
  "cityContext": "Your city context paragraph here",
  "problemStatement": "Your problem statement paragraph here",
  "solutionOverview": "Your solution overview paragraph here",
  "benefits": [
    {
      "title": "Benefit One Title",
      "description": "Benefit one description here"
    },
    {
      "title": "Benefit Two Title",
      "description": "Benefit two description here"
    },
    {
      "title": "Benefit Three Title",
      "description": "Benefit three description here"
    }
  ],
  "ctaText": "Your CTA text here",
  "metaDescription": "Your meta description here"
}
```

Generate unique, natural-sounding content now.

---

## Testing Checklist

After generating, verify:

- [ ] Headline mentions city naturally (not forced)
- [ ] No generic filler phrases
- [ ] Benefits are specific, not vague
- [ ] City context feels genuine, not templated
- [ ] Word counts are within range
- [ ] Australian spelling used
- [ ] First person singular ("I" not "we")
- [ ] No emojis
- [ ] JSON is valid

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
```

---

## All Cities Reference

### Tier 1 (Priority)
| City | State | Business Context |
|------|-------|------------------|
| Sydney | NSW | Australia's largest city and tech hub. Finance, professional services, startups. |
| Melbourne | VIC | Creative capital with thriving startup ecosystem. Retail, hospitality, professional services. |
| Brisbane | QLD | Fast-growing business centre. Construction, property, tourism, emerging tech scene. |
| Perth | WA | Resources and mining capital. Construction, engineering, businesses modernising operations. |
| Adelaide | SA | Defence, health, and wine industries. Growing tech sector, cost-effective business environment. |

### Tier 2
| City | State | Business Context |
|------|-------|------------------|
| Gold Coast | QLD | Tourism and lifestyle businesses. Property development, hospitality, health and wellness. |
| Newcastle | NSW | Industrial heritage transitioning to services. Mining support, healthcare, education. |
| Canberra | ACT | Government and public sector. Defence contractors, policy organisations, associations. |
| Hobart | TAS | Tourism, agriculture, and Antarctic research. Small business community, creative industries. |
| Wollongong | NSW | Manufacturing and university town. Steel industry, education, healthcare services. |

### Tier 3
| City | State | Business Context |
|------|-------|------------------|
| Geelong | VIC | Manufacturing hub south of Melbourne. Automotive transition, education, health. |
| Townsville | QLD | North Queensland's largest city. Mining services, defence, tropical agriculture. |
| Cairns | QLD | Tourism gateway to Great Barrier Reef. Hospitality, marine industries, tropical agriculture. |
| Darwin | NT | Northern gateway to Asia. Defence, resources, tourism, government services. |
| Toowoomba | QLD | Agricultural hub. Farming, logistics, regional services, growing tech presence. |

---

## Quick Test Combinations

1. **MVP Development + Sydney** (tech startup angle)
2. **Web App Development + Perth** (mining/resources modernisation angle)
3. **Internal Tools + Brisbane** (construction/trades angle)
4. **Business Automation + Melbourne** (professional services efficiency angle)
5. **Custom Software + Adelaide** (defence/manufacturing angle)

Try generating content for each to see the variation.
