# RHConnect Admin Design System
**Aligned with Candidate Frontend Design**

---

## 1. LAYOUT STRUCTURE

### Container & Responsive Grid
```scss
// Main content
.admin-page {
  padding: 1.75rem 1.25rem sm:px-8;  // 28px / 32px
  max-width: 1280px;
  margin: 0 auto;
  background: var(--paper);  // Light: #F3F6F7, Dark: #0A1520
}

// Grid layouts
.grid-4-col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 0.875rem;  // 14px
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

// Two-column layout (7:5 split)
.grid-main {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  
  @media (min-width: 1024px) {
    grid-template-columns: 7fr 5fr;
  }
}
```

---

## 2. COLOR PALETTE (CSS Variables)

### Light Mode (Default)
```css
:root {
  /* Core Colors */
  --signal:          #0F766E;    /* Primary teal */
  --signal-light:    #E6F7F5;    /* Light background */
  --signal-lighter:  #F0FDFB;    /* Very light background */
  
  --emerald:         #059669;    /* Success green */
  --emerald-light:   #E7F5ED;    /* Light background */
  
  --amber:           #D4A72C;    /* Warning amber */
  --amber-light:     #FDF8EC;    /* Light background */
  
  --error:           #E11D48;    /* Error red */
  --error-light:     #FEE2E7;    /* Light background */
  
  --paper:           #F3F6F7;    /* Page background */
  --ink:             #172A3A;    /* Primary text */
  --secondary-text:  #475569;    /* Secondary text */
  --muted-text:      #94A3B8;    /* Muted text */
  
  --border:          #E2E8F0;    /* Borders */
  --border-subtle:   #F1F5F9;    /* Subtle dividers */
  
  --surface:         #FFFFFF;    /* Card background */
  --surface-alt:     #F8FAFC;    /* Alternative surface */
  
  --hover-bg:        #FFFFFF;    /* Hover background */
  --hover-border:    rgba(15, 118, 110, 0.3);  /* Hover border */
}
```

### Dark Mode (`.theme-dark` class)
```css
.theme-dark {
  --signal:          #2DD4BF;    /* Teal (lighter) */
  --signal-light:    rgba(45, 212, 191, 0.15);
  --signal-lighter:  rgba(45, 212, 191, 0.05);
  
  --emerald:         #34D399;    /* Emerald (lighter) */
  --emerald-light:   rgba(52, 211, 153, 0.15);
  
  --amber:           #FBBF24;    /* Amber (lighter) */
  --amber-light:     rgba(251, 191, 36, 0.15);
  
  --error:           #F87171;    /* Red (lighter) */
  --error-light:     rgba(248, 113, 113, 0.15);
  
  --paper:           #0A1520;    /* Page background */
  --ink:             #E8EDF2;    /* Primary text */
  --secondary-text:  #8CA0B3;    /* Secondary text */
  --muted-text:      #5A7088;    /* Muted text */
  
  --border:          rgba(255, 255, 255, 0.1);  /* Borders */
  --border-subtle:   rgba(255, 255, 255, 0.05);
  
  --surface:         #14263A;    /* Card background */
  --surface-alt:     #0F1D2E;    /* Alternative surface */
  
  --hover-bg:        #1A2F42;    /* Hover background */
  --hover-border:    rgba(45, 212, 191, 0.3);
}
```

---

## 3. TYPOGRAPHY

### Font Families
```css
/* Headings */
.heading-display {
  font-family: 'Manrope', 'IBM Plex Sans', sans-serif;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* Body text */
body, html, button, input, textarea {
  font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
  font-weight: 500;
}
```

### Typography Scale
```css
/* Headings */
.h1, h1 {
  font-size: 1.875rem;  /* 30px */
  line-height: 1.25;
  font-weight: 700;
  @apply heading-display;
}

.h2, h2 {
  font-size: 1.5rem;    /* 24px */
  line-height: 1.35;
  font-weight: 700;
  @apply heading-display;
}

.h3, h3 {
  font-size: 1rem;      /* 16px */
  line-height: 1.4;
  font-weight: 700;
  @apply heading-display;
}

.h4, h4 {
  font-size: 0.875rem;  /* 14px */
  line-height: 1.43;
  font-weight: 700;
  @apply heading-display;
}

/* Body text */
.body-lg {
  font-size: 1rem;      /* 16px */
  line-height: 1.5;
  font-weight: 500;
}

.body-md, p {
  font-size: 0.875rem;  /* 14px */
  line-height: 1.625;
  font-weight: 500;
}

.body-sm {
  font-size: 0.8125rem; /* 13px */
  line-height: 1.54;
  font-weight: 500;
}

.body-xs {
  font-size: 0.75rem;   /* 12px */
  line-height: 1.33;
  font-weight: 500;
}

.body-tiny {
  font-size: 0.625rem;  /* 10px */
  line-height: 1.2;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

---

## 4. COMPONENTS

### Badge/Status Pill
```scss
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;        /* 6px */
  padding: 0.25rem 0.625rem;  /* 4px 10px */
  border-radius: 9999px;
  font-size: 0.75rem;   /* 12px */
  font-weight: 700;
  border: 1px solid;
  white-space: nowrap;
  
  &.badge-active {
    background: var(--emerald-light);
    border-color: #A7F3D0;
    color: #047857;
  }
  
  &.badge-pending {
    background: var(--amber-light);
    border-color: #FCD34D;
    color: #92400E;
  }
  
  &.badge-rejected {
    background: var(--error-light);
    border-color: #FECACA;
    color: #BE123C;
  }
  
  &.badge-inactive {
    background: #F1F5F9;
    border-color: #CBD5E1;
    color: #64748B;
  }
}
```

### Button Primary
```scss
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;          /* 8px */
  padding: 0.625rem 1.25rem;  /* 10px 20px */
  border-radius: 0.75rem;    /* 12px */
  background: var(--signal);
  color: white;
  font-size: 0.875rem;  /* 14px */
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 150ms ease-in-out;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  
  &:hover:not(:disabled) {
    background: #115E59;
    box-shadow: 0 4px 6px rgba(15, 118, 110, 0.2);
  }
  
  &:focus {
    outline: none;
    ring: 2px;
    ring-color: rgba(15, 118, 110, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

### Button Secondary
```scss
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 0.875rem;  /* 10px 14px */
  border-radius: 0.75rem;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  color: var(--secondary-text);
  font-size: 0.75rem;   /* 12px */
  font-weight: 700;
  cursor: pointer;
  transition: all 150ms ease-in-out;
  
  &:hover {
    background: var(--hover-bg);
    border-color: var(--signal);
    color: var(--signal);
  }
  
  .theme-dark & {
    background: #1A2F42;
    border-color: #2A3F55;
    color: #8CA0B3;
    
    &:hover {
      background: #213449;
      border-color: var(--signal);
      color: var(--signal);
    }
  }
}
```

### Card Container
```scss
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 1rem;      /* 16px */
  padding: 1.5rem;          /* 24px */
  transition: all 200ms ease-in-out;
  
  &:hover {
    border-color: var(--signal);
  }
  
  /* Card with shadow */
  &.card-shadow {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    
    &:hover {
      box-shadow: 0 4px 6px rgba(15, 118, 110, 0.15);
    }
  }
  
  .theme-dark & {
    background: var(--surface);
    border-color: var(--border);
  }
}
```

### Form Input
```scss
.input {
  width: 100%;
  padding: 0.625rem 1rem;   /* 10px 16px */
  border-radius: 0.75rem;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 150ms ease-in-out;
  
  &::placeholder {
    color: var(--muted-text);
  }
  
  &:focus {
    outline: none;
    border-color: var(--signal);
    box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
  }
  
  &:disabled {
    background: var(--surface-alt);
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .theme-dark & {
    background: #0F1D2E;
    border-color: #2A3F55;
    color: var(--ink);
  }
}
```

### Table
```scss
.table {
  width: 100%;
  border-collapse: collapse;
  
  thead {
    background: var(--surface-alt);
    border-bottom: 1px solid var(--border);
  }
  
  th {
    padding: 1rem 1.5rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--secondary-text);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  td {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-subtle);
    color: var(--ink);
    font-size: 0.875rem;
  }
  
  tbody tr {
    transition: background-color 150ms ease-in-out;
    
    &:hover {
      background: var(--paper);
    }
  }
  
  .theme-dark & {
    tbody tr:hover {
      background: #0F1D2E;
    }
  }
}
```

---

## 5. SPACING SYSTEM

```css
/* Consistent spacing scale */
:root {
  --space-xs:   4px;     /* 0.25rem */
  --space-sm:   8px;     /* 0.5rem */
  --space-md:   12px;    /* 0.75rem */
  --space-lg:   16px;    /* 1rem */
  --space-xl:   20px;    /* 1.25rem */
  --space-2xl:  24px;    /* 1.5rem */
  --space-3xl:  28px;    /* 1.75rem */
  --space-4xl:  32px;    /* 2rem */
  --space-6xl:  48px;    /* 3rem */
}

/* Common patterns */
.section-gap      { gap: 1.5rem; }           /* 24px */
.component-gap    { gap: 1rem; }             /* 16px */
.element-gap      { gap: 0.5rem; }           /* 8px */
.section-padding  { padding: 1.5rem 2rem; } /* 24px 32px */
.card-padding     { padding: 1.5rem; }      /* 24px */
```

---

## 6. RESPONSIVE BREAKPOINTS

```scss
// Mobile first
$sm: 640px;   // Tablets portrait
$md: 768px;   // Tablets landscape
$lg: 1024px;  // Desktops
$xl: 1280px;  // Large screens
$2xl: 1536px; // Ultra-wide

@mixin respond-sm { @media (min-width: $sm) { @content; } }
@mixin respond-md { @media (min-width: $md) { @content; } }
@mixin respond-lg { @media (min-width: $lg) { @content; } }
@mixin respond-xl { @media (min-width: $xl) { @content; } }

// Common patterns
.hidden-mobile  { display: none; @include respond-md { display: block; } }
.hidden-desktop { display: block; @include respond-lg { display: none; } }
```

---

## 7. ANIMATIONS & TRANSITIONS

```css
/* Standard transitions */
.transition-fast    { transition: all 150ms ease-in-out; }
.transition-normal  { transition: all 200ms ease-in-out; }
.transition-slow    { transition: all 300ms ease-in-out; }

/* Color-specific */
.transition-colors { transition: color, background-color, border-color 150ms ease-in-out; }

/* Animations */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-fade-in { animation: fade-in 200ms ease-in-out; }
.animate-slide-up { animation: slide-up 300ms ease-out cubic-bezier(0.23, 1, 0.320, 1); }
.animate-spin { animation: spin 1s linear infinite; }
```

---

## 8. DARK MODE STRATEGY

**Implementation:**
- Root CSS variables defined globally and overridden in `.theme-dark`
- No component-level dark mode logic
- All color values reference variables
- Angular component class binding: `[class.theme-dark]="isDarkMode"`

**Example:**
```html
<!-- In admin layout -->
<div [class.theme-dark]="(themeService.isDarkMode$ | async)">
  <!-- All child components inherit dark mode -->
</div>
```

```typescript
// In component
export class AdminComponent {
  isDarkMode$ = this.themeService.isDarkMode$;
  
  constructor(private themeService: ThemeService) {}
}
```

---

## 9. MIGRATION CHECKLIST

- [ ] Update all color hex values to CSS variables
- [ ] Replace hardcoded padding/margins with spacing system
- [ ] Update button styles to new button classes
- [ ] Convert cards to use .card class
- [ ] Update form inputs to use .input class
- [ ] Update typography to use h1-h4, body-lg, body-md, etc.
- [ ] Add hover states to all interactive elements
- [ ] Test dark mode toggle across all pages
- [ ] Verify responsive behavior on mobile/tablet/desktop
- [ ] Check accessibility (focus states, contrast, keyboard nav)
- [ ] Verify animations and transitions smooth
- [ ] Test on different browsers

---

## 10. COMPONENT MAPPING

| Candidate Component | Admin Equivalent | Status |
|-------------------|-----------------|--------|
| DashboardCandidat | Dashboard | ✓ Done |
| ProfilePage | Users / Settings | ⏳ In Progress |
| VerificationPage | Verifications | ⏳ To Do |
| CandidateAIAssistantPage | AI-Supervision | ⏳ To Do |
| Applications (company) | Applications | ⏳ To Do |
| Offers (company) | Offers | ⏳ To Do |
| Stats/Reporting (company) | Reporting | ⏳ To Do |
