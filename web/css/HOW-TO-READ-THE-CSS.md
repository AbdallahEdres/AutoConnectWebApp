# How to read the AutoConnect CSS

Every HTML page loads **four CSS files in this order** (do not change the order):

```html
<link rel="stylesheet" href="css/variables.css">   <!-- 1. colors & sizes -->
<link rel="stylesheet" href="css/base.css">        <!-- 2. body, container -->
<link rel="stylesheet" href="css/components.css">  <!-- 3. reusable UI pieces -->
<link rel="stylesheet" href="css/pages.css">       <!-- 4. specific screens -->
```

From `pages/` folder use `../css/...` instead of `css/...`.

---

## File roles

| File | What it controls |
|------|------------------|
| **variables.css** | `--accent-yellow`, `--bg-main`, etc. Theme in one place. |
| **base.css** | Page background, `body.rtl` / `body.ltr`, `.container`, `.page-main` |
| **components.css** | Header, footer, buttons, cards, forms, provider cards, grids — **used on many pages** |
| **pages.css** | Home hero, login card, filter bar, profile layout — **screen-specific layouts** |

Later files can override earlier ones if selectors are equally specific.

---

## Which CSS is used on which page?

| Page | Main classes (from HTML) | CSS file |
|------|--------------------------|----------|
| **index.html** | `.hero`, `.search-bar`, `.service-cards`, `.cta-banner` | pages + components |
| **login.html** | `.auth-card`, `.role-toggle`, `.auth-divider` | pages + components |
| **register.html** | `.auth-card--provider`, `.register-fields-hidden`, `.form-row` | pages + components |
| **services.html** | `.filter-bar`, `.grid-3`, `.provider-card`, `.pagination` | pages + components |
| **emergency.html** | `.emergency-hero`, `.emergency-banner`, `.grid-2` | pages + components |
| **service-detail.html** | `.detail-hero`, `.detail-layout`, `.map-placeholder` | pages + components |
| **favorites.html** | `.pills`, `.pill.active`, `.grid-auto` | components |
| **profile.html** | `.layout-with-sidebar`, `.sidebar`, `.profile-stats` | pages + components |
| **settings.html** | `.settings-grid`, `.tips-list`, `.delete-account-card` | pages + components |
| **provider-register.html** | `.provider-hero`, `.provider-form-card`, `.trust-features` | pages + components |
| **All pages** | `#site-header` → `.site-header`, `.btn-primary`, `.section-title` | components (injected by layout.js) |

---

## components.css — reusable building blocks

| Class | What it looks like | Where used |
|-------|-------------------|------------|
| `.site-header` | Sticky dark bar at top | Every page (layout.js) |
| `.logo` | Yellow “Auto” + white “Connect” | Header |
| `.nav-links a.active` | Yellow text + underline | Current page in nav |
| `.btn-primary` | Yellow filled button | Search, login, call |
| `.btn-danger` | Red button | Emergency “call now” |
| `.btn-outline` | Yellow border, transparent fill | View map, favorites |
| `.card` | Dark rounded box with border | Profile, settings, detail |
| `.section-title` | Big title + **yellow vertical bar** on the side | Section headings |
| `.form-control` | Dark input with border | All forms |
| `.provider-card` | Image top + rating + call button | Services, favorites (from ui.js) |
| `.status-dot.open` | Small green circle | “Open now” |
| `.grid-3` | 3 columns of cards | Services results |
| `.grid-auto` | Responsive card columns | Favorites |
| `.layout-with-sidebar` | Sidebar + main (240px + rest) | Profile, settings |
| `.pill.active` | Yellow rounded tab | Favorites filters |

---

## pages.css — screen-specific layouts

| Class | What it makes | Page |
|-------|---------------|------|
| `.hero-grid` | Two columns: text left, image right (RTL flips) | Home |
| `.search-bar` | Row of dropdown + input + yellow search button | Home |
| `.service-type-card` | 3 cards: mechanic, parts, towing | Home |
| `.cta-banner` | Full-width **yellow** band with dark text | Home |
| `.auth-card` | Centered login/register box (420px) | Login, register |
| `.auth-card--provider` | Wider register box (640px) for workshop fields | Register (provider) |
| `.role-toggle` | عميل / مزود segmented control | Login, register |
| `.filter-bar` | Horizontal row of filters + apply button | Services |
| `.emergency-hero` | Large card with location button | Emergency |
| `.emergency-banner` | Bottom warning strip (15088) | Emergency |
| `.detail-hero` | Wide image banner on workshop page | Service detail |
| `.detail-layout` | Main content + sidebar (map, live status) | Service detail |
| `.profile-stats .number` | Large yellow visit count | Profile |
| `.settings-grid` | Tips card + password form side by side | Settings |

---

## Responsive behavior (media queries)

Defined at the bottom of **components.css** and **pages.css**:

- **≤ 900px**: 3-column grids → 2 columns; sidebar stacks above content; hero stacks vertically.
- **≤ 640px**: Nav links hide behind **hamburger** (`.menu-toggle`); grids become 1 column; form rows stack.

`inset-inline-start` / `margin-inline` flip automatically when `body.rtl` vs `body.ltr`.

---

## How HTML connects to CSS

1. **Static HTML** uses class names: `<button class="btn btn-primary">`
2. **layout.js** injects header/footer with classes `.site-header`, `.footer-inner`
3. **ui.js** builds strings with `.provider-card`, `.provider-card__image`, etc.

If something looks unstyled, check the class name in HTML matches a rule in components.css or pages.css.

---

## Quick theme change

Edit **only** `variables.css`:

```css
--accent-yellow: #ffcc29;  /* try another hex for whole site */
--bg-main: #0b111e;
```
