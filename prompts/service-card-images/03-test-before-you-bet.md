```xml
<image_prompt>

  <!-- ========== MASTER STYLE GUIDE (consistent across all 4 cards) ========== -->

  <style_guide>
    <illustration_type>Modern flat vector illustration with subtle depth and polish</illustration_type>
    <aesthetic>Premium SaaS marketing style, clean but rich with detail, contemporary tech aesthetic</aesthetic>

    <color_palette>
      <primary name="Deep Purple">#4F46E5</primary>
      <secondary name="Royal Blue">#6366F1</secondary>
      <accent name="Teal Mint">#2DD4BF</accent>
      <light name="Soft Lavender">#C7D2FE</light>
      <highlight name="White">#FFFFFF</highlight>
      <dark name="Deep Navy">#1E1B4B</dark>
    </color_palette>

    <color_usage>
      <background>Smooth gradient from deep purple at top to royal blue at bottom</background>
      <skyline>Dark navy city silhouette with small illuminated window dots for depth</skyline>
      <character_clothing>Teal/mint as primary clothing color</character_clothing>
      <character_hair>Teal/mint colored hair to match accent</character_hair>
      <floating_elements>White, soft lavender, and teal-to-purple gradients on arrows</floating_elements>
      <skin_tones>Warm tan/brown, simplified flat color</skin_tones>
    </color_usage>

    <rendering_rules>
      <rule>Clean vector shapes with flat color fills</rule>
      <rule>Subtle thin white or light outlines on character silhouette for definition</rule>
      <rule>Gradient fills allowed on directional arrows (purple to teal)</rule>
      <rule>UI elements (cards, clipboards) have soft drop shadows</rule>
      <rule>Mix of solid and outline-only decorative elements</rule>
      <rule>Dot grid patterns as decorative accents</rule>
      <rule>Small sparkle/star shapes scattered for polish</rule>
    </rendering_rules>

    <character_style>
      <silhouette>Clean defined shape with subtle outline</silhouette>
      <features>Simplified face - minimal or no facial details, profile or three-quarter view</features>
      <hair>Stylized, teal/mint colored to match brand accent</hair>
      <proportions>Slightly elongated, elegant, modern</proportions>
      <pose>Confident, professional, dynamic</pose>
    </character_style>

    <decorative_elements>
      <element>Lightning bolt icons in white</element>
      <element>Upward trending arrows with purple-to-teal gradient</element>
      <element>Cursor/pointer icons in white</element>
      <element>Circle outlines (unfilled) in lavender</element>
      <element>Dot grid patterns in light purple</element>
      <element>Small 4-point sparkle stars</element>
      <element>Globe/world icons</element>
    </decorative_elements>

    <composition_rules>
      <aspect_ratio>16:9 horizontal banner</aspect_ratio>
      <layers>
        <layer depth="1">Gradient background (purple to blue)</layer>
        <layer depth="2">City skyline silhouette with lit windows at bottom 20%</layer>
        <layer depth="3">Large floating decorative elements (arrows, rockets)</layer>
        <layer depth="4">Main character and primary prop</layer>
        <layer depth="5">Small accent decorations (sparkles, dots, checkmarks)</layer>
      </layers>
      <density>Rich with elements but not cluttered, balanced spacing</density>
    </composition_rules>
  </style_guide>

  <!-- ========== THIS IMAGE: Test Before You Bet (MVP/Validation) ========== -->

  <subject>
    <character>
      <description>Entrepreneurial person in dynamic launching pose, releasing a small rocket or prototype upward</description>
      <pose>Action stance with arm extended upward, body showing forward momentum and energy, confident entrepreneurial spirit</pose>
      <clothing>Teal/mint colored hoodie or casual jacket, dark navy pants</clothing>
      <hair>Teal/mint colored, stylized modern cut</hair>
    </character>

    <main_prop>Small stylized rocket with teal and white colors, launching upward with motion trail particles</main_prop>

    <secondary_props>
      <item>Floating clipboard or tablet showing checklist with checkmarks</item>
      <item>Lightbulb icon representing ideas</item>
      <item>Circular iteration/refresh arrows</item>
      <item>Target/bullseye with arrow hitting center</item>
      <item>User feedback avatars in small circles</item>
      <item>Progress indicator showing launch stages</item>
    </secondary_props>
  </subject>

  <floating_decorations>
    <item>Rocket trail particles in white and teal</item>
    <item>Upward trending arrows with purple-to-teal gradient</item>
    <item>Checkmark icons in white</item>
    <item>Small flag/milestone markers</item>
    <item>Iteration cycle arrows</item>
    <item>Circle outlines in soft lavender</item>
    <item>Dot grid patterns in corners</item>
    <item>Small 4-point sparkle stars in white</item>
    <item>Data point dots forming upward curve</item>
  </floating_decorations>

  <mood>
    <feeling>Bold, experimental, optimistic</feeling>
    <energy>High momentum, startup excitement, forward thrust</energy>
    <message>Launch fast, learn from users, iterate to success</message>
  </mood>

  <negative_prompts>
    <avoid>Photorealistic style</avoid>
    <avoid>3D rendering</avoid>
    <avoid>Detailed facial features</avoid>
    <avoid>Childish or cartoonish style</avoid>
    <avoid>Gambling imagery (dice, cards, chips)</avoid>
    <avoid>Failure or crash imagery</avoid>
    <avoid>Empty or sparse composition</avoid>
    <avoid>Dark or moody atmosphere</avoid>
  </negative_prompts>

</image_prompt>
```
