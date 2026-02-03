# Savi Design System — v1.1
*A brand and UX system for the Ecommpay Virtual Assistant*  

---

## 🪄 1. Brand Essence
**Savi** is a supportive digital companion that helps small business owners make sense of payments.  
The brand feels **bright, intelligent, and reassuring**, with a visual language that evokes *guidance through light*.  

**Core attributes:**  
→ Friendly • Dependable • Warm • Clear • Empowering  

---

## 🎨 2. Visual Identity

### Logo
Use the **Savi wordmark** in white on dark backgrounds or with the brand gradient applied to the burst icon.  

**Usage examples:**
- **Primary:** White logo on *Savi Background 5*  
- **Alternative:** Gradient burst icon isolated for app icons, load screens, or motion moments  

**Clear space:** 1x the height of “S”  
**Minimum size:** 64px width  

---

## 🌈 3. Color System

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| **Primary Background** | Deep Forest Green | `#0F2B1D` | Base UI color, neutral backdrop |
| **Gradient Highlight Start** | Warm Orange | `#FF6A00` | Lower beam, energy tone |
| **Gradient Highlight End** | Magenta | `#C137A2` | Upper beam, optimism |
| **Accent Purple** | `#A020F0` | UI glow, outlines |
| **White** | `#FFFFFF` | Text, logo, icons |
| **Black (support)** | `#000000` | Extreme contrast cases |

**Signature Gradient:**  
`linear-gradient(180deg, #C137A2 0%, #FF6A00 100%)`

---

## 🪶 4. Typography

| Style | Font | Weight | Use |
|--------|------|---------|------|
| **Display / Headings** | Poppins | Bold | Headers, logo, emphasis |
| **Body / UI** | Inter | Regular | Paragraphs, chat text |
| **Emphasis / CTA** | Inter | Medium | Buttons, prompts |

**Scale:**  
- H1 – 48px / Bold  
- H2 – 32px / Bold  
- Body – 16px / Regular  
- Caption – 14px / Regular (80% opacity)  

---

## 💬 5. Tone of Voice
Savi speaks in a **human, encouraging** way — like a knowledgeable friend, not a corporate assistant.

| Situation | Example |
|------------|----------|
| Greeting | “Hey there 👋 I’m Savi — here to make payments make sense.” |
| Guidance | “Let’s walk through this step by step.” |
| Error | “Hmm, that didn’t work — but don’t worry, I’ve got this.” |
| Success | “Done! That’s one less thing to think about.” |

**Tone pillars:**  
- Clear  
- Kind  
- Reassuring  
- Smart  

---

## ✨ 6. Motion & Behaviour
Savi’s movement and light mimic curiosity and progress.  

- **Motion:** Smooth sweeps, bounces, and spotlight glow transitions  
- **Idle:** Subtle pulse or hover motion  
- **Action:** Warm orange light beam animates across UI during thinking  
- **Response:** Brief magenta highlight or upward beam when answers appear  

---

## 👾 7. Character System
**Shape:** Cone body + rounded head (abstract spotlight form)  
**Color:** Gradient from orange → pink → violet  
**Face:** Simple, with two vertical eyes  
**Personality cues:** Motion, not expression  

**Key poses:**
- Listening → soft glow  
- Thinking → rotating gradient beam  
- Speaking → beam projection  
- Happy → upward tilt and bounce  

---

## 🌌 8. Backgrounds

### Primary Background — “Savi_Background 5”
Use this as the official brand environment and hero visual backdrop.  

**File:** `Savi_Backgrounds_Savi_Background 5.png`  
**Base Color:** Deep Forest Green (#0F2B1D)  
**Lighting Gradient:** Bottom orange glow → top violet haze  
**Mood:** Calm, warm, focused — symbolises clarity emerging from complexity  

**Usage:**  
✅ Chat UI backgrounds  
✅ Website hero panels  
✅ Presentation slides  
✅ Motion and promotional assets  

**Avoid:**  
🚫 Overlaying other heavy gradients or patterns  
🚫 High-opacity blur or excessive filters  

---

## 💻 9. Chat UI Elements

| Component | Style |
|------------|--------|
| **Chat Background** | Use *Savi Background 5* full-bleed or 40% opacity over #0F2B1D |
| **Bot Bubble** | Gradient fill (#C137A2 → #FF6A00), white text |
| **User Bubble** | Transparent with thin white border |
| **Buttons** | Rounded 8px, gradient hover |
| **Text Input** | White field on translucent dark base |

**Iconography:**  
Simple line icons with gradient stroke or white outline.

---

## ⚙️ 10. Design Tokens

```json
{
  "colors": {
    "background": "#0F2B1D",
    "gradientStart": "#C137A2",
    "gradientEnd": "#FF6A00",
    "white": "#FFFFFF"
  },
  "fonts": {
    "display": "Poppins, sans-serif",
    "body": "Inter, sans-serif"
  },
  "radius": {
    "default": "8px",
    "large": "12px"
  },
  "background": {
    "image": "Savi_Backgrounds_Savi_Background 5.png",
    "fit": "cover",
    "position": "center"
  }
}
```

---

## 📘 11. Usage Summary
- Always maintain a balance of **dark calm + bright energy**  
- Use **Savi Background 5** as the *visual foundation* for all screens and hero spaces  
- Gradients, motion, and typography work together to reflect optimism and confidence  
- Keep the interface *simple, soft, and supportive*  

---

**Savi = Friendly + Functional + Focused.**  
A design system built to make complex things feel simple and human.  
