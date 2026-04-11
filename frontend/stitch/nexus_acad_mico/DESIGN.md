# Design System Document: Academic Precision

## 1. Overview & Creative North Star
**Creative North Star: The Institutional Architect**

In the context of a Brazilian technical college, the interface must do more than just display data—it must embody authority, clarity, and the rigor of technical education. This design system moves away from "generic dashboard" tropes to embrace **Institutional Minimalism**. 

While inspired by the utility of the Google Admin Console and the surgical precision of Linear, our approach uses **Tonal Layering** and **Information Density** as its primary design drivers. We break the "template" look by favoring high-contrast typography scales and eliminating the "box-within-a-box" clutter common in educational software. The goal is an interface that feels like a high-end editorial publication: structured, spacious where necessary, and intensely functional.

---

## 2. Colors & Surface Philosophy

The palette is rooted in `primary` (#1E40AF) to convey institutional trust, supported by a sophisticated range of slates and surfaces that define hierarchy without visual noise.

### The "No-Line" Rule
To achieve a premium, modern feel, **1px solid borders are prohibited for sectioning.** 
*   **The Law:** Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section sitting on a `surface` background.
*   **The Exception:** Only use the `outline-variant` at 15% opacity for complex data tables where cell distinction is critical for accessibility.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine technical paper.
*   **Level 0 (Background):** `surface` (#F9F9FF) - The base canvas.
*   **Level 1 (Sectioning):** `surface-container-low` (#F0F3FF) - Used for grouping related content areas.
*   **Level 2 (Interactive/Cards):** `surface-container-lowest` (#FFFFFF) - Reserved for the highest priority data containers.

### Signature Textures & Glass
*   **The Glass Rule:** Floating elements (modals, dropdowns) must use `surface-container-lowest` with a 70% opacity and a `backdrop-blur` of 12px. This creates a "frosted glass" effect that keeps the user grounded in the layout.
*   **Subtle Gradients:** For primary CTAs (e.g., "Matricular Aluno"), use a subtle vertical gradient from `primary` (#00288E) to `primary_container` (#1E40AF). This adds a "soul" to the button that flat colors lack.

---

## 3. Typography: The Editorial Scale

We use **Inter** exclusively. The weight and scale are used to create a "Technical Editorial" look, ensuring that even data-dense screens feel organized.

*   **Display/Headline:** Use `headline-sm` (1.5rem) for main dashboard greetings. Use `title-lg` (1.375rem) with `font-semibold` for page titles like "Relatório de Frequência."
*   **The Data Grid:** All table data must use `body-sm` (0.75rem). This allows for high information density without sacrificing legibility.
*   **Labels:** Use `label-md` (0.75rem) in `on_surface_variant` (#444653) for input labels.
*   **Hierarchy through Contrast:** Pair a `title-sm` (1.0rem, bold) with a `label-sm` (0.68rem, medium) to create clear metadata clusters without needing lines.

---

## 4. Elevation & Depth

We convey importance through **Tonal Layering** rather than traditional drop shadows.

*   **The Layering Principle:** Instead of a shadow, place a `#FFFFFF` card on a `#F1F5F9` background. The 4% difference in luminosity provides enough "lift" for a professional aesthetic.
*   **Ambient Shadows:** For "Floating" elements (Modals, Popovers), use an extra-diffused shadow:
    *   `box-shadow: 0 10px 25px -5px rgba(30, 41, 59, 0.04), 0 8px 10px -6px rgba(30, 41, 59, 0.04);`
    *   Note the use of Slate-800 (`on-surface`) as the shadow tint rather than pure black.
*   **The Ghost Border:** If a container requires an edge (e.g., on a very bright screen), use `outline-variant` at 20% opacity.

---

## 5. Components

### Buttons
*   **Primary:** High-contrast `primary` background. 0.375rem (md) rounded corners. Vertical padding: 10px; Horizontal: 16px.
*   **Secondary:** `surface-container-high` background with `on-surface` text. No border.
*   **Tertiary:** Transparent background, `primary` text. Use for low-emphasis actions like "Cancelar."

### Input Fields & Selects
*   **Style:** Flat backgrounds (`surface-container-lowest`).
*   **Active State:** No heavy glow. Use a 2px `primary` bottom-border or a subtle `outline` shift.
*   **Validation:** Error states must use `error` (#BA1A1A) for text and a `error_container` (#FFDAD6) subtle background tint.

### Data Tables (The Core Component)
*   **Forbid Dividers:** Use vertical white space (`spacing-4`) and alternating row tints (`surface` vs `surface-container-low`) instead of horizontal lines.
*   **Alignment:** Numbers (Grades, IDs) are always right-aligned. Text (Student Names, Courses) is left-aligned.
*   **Status Chips:** Use `tertiary_container` for "Aprovado" and `error_container` for "Reprovado." Text should be the "on-container" variant for high accessibility.

### New Component: The "Academic Summary" Card
A specialized card for student profiles. Uses a `surface-container-highest` header area that bleeds into a `surface-container-lowest` body. No borders; the depth is created purely by the color transition.

---

## 6. Do's and Don'ts

### Do
*   **DO** use Brazilian Portuguese (PT-BR) consistently. Use "Matrícula" instead of "ID," "Turma" instead of "Class."
*   **DO** prioritize "Breathing Room." Even in data-dense views, ensure 24px (1.5rem) of padding between major containers.
*   **DO** use high-contrast text for accessibility (WCAG AA compliant).

### Don't
*   **DON'T** use 100% opaque black shadows. It breaks the "light and airy" technical feel.
*   **DON'T** use icons without labels in the main navigation. In an institutional context, clarity beats minimalism.
*   **DON'T** use "Standard" blue links. Use the `primary` token with a medium weight to indicate interactivity.