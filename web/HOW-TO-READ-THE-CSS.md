# How to read the AutoConnect CSS

Every page loads **shared CSS from the `web/` root**, then its own page stylesheet when needed:

```html
<link rel="stylesheet" href="../variables.css">   <!-- 1. colors & sizes -->
<link rel="stylesheet" href="../base.css">        <!-- 2. body, container -->
<link rel="stylesheet" href="../components.css">  <!-- 3. reusable UI pieces -->
<link rel="stylesheet" href="home.css">           <!-- 4. this screen only (example) -->
```

Each screen lives in its own folder (e.g. `web/home/index.html`, `web/services/index.html`).

---

## File roles

| File | What it controls |
|------|------------------|
| **variables.css** | `--accent-yellow`, `--bg-main`, etc. Theme in one place. |
| **base.css** | Page background, `body.rtl` / `body.ltr`, `.container`, `.page-main` |
| **components.css** | Header, footer, buttons, cards, forms, provider cards, grids — **used on many pages** |
| **`[page]/[page].css`** | Home hero, login card, filter bar, profile layout — **screen-specific layouts** |

Later files can override earlier ones if selectors are equally specific.

---

## Which CSS is used on which page?

| Page | Main classes (from HTML) | Page CSS file |
|------|--------------------------|---------------|
| **home/index.html** | `.hero`, `.search-bar`, `.service-cards`, `.cta-banner` | `home/home.css` |
| **login/index.html** | `.auth-card`, `.role-toggle`, `.auth-divider` | `login/login.css` |
| **register/index.html** | `.auth-card--provider`, `.register-fields-hidden`, `.form-row` | `register/register.css` |
| **services/index.html** | `.filter-bar`, `.grid-3`, `.provider-card` | `services/services.css` |
| **emergency/index.html** | `.emergency-hero`, `.emergency-banner`, `.grid-2` | `emergency/emergency.css` |
| **service-detail/index.html** | `.detail-hero`, `.detail-layout`, `.map-placeholder` | `service-detail/service-detail.css` |
| **favorites/index.html** | `.pills`, `.pill.active`, `.grid-auto` | components only |
| **profile/index.html** | `.layout-with-sidebar`, `.sidebar`, `.profile-stats` | `profile/profile.css` |
| **settings/index.html** | `.settings-grid`, `.tips-list`, `.delete-account-card` | `settings/settings.css` |
| **provider-register/index.html** | `.provider-hero`, `.provider-form-card`, `.trust-features` | `provider-register/provider-register.css` |
| **All pages** | `#site-header` → `.site-header`, `.btn-primary`, `.section-title` | components (injected by main.js) |

---

## components.css — reusable building blocks

| Class | What it looks like | Where used |
|-------|-------------------|------------|
| `.site-header` | Sticky dark bar at top | Every page (main.js) |
| `.logo` | Yellow “Auto” + white “Connect” | Header |
| `.nav-links a.active` | Yellow text + underline | Current page in nav |
| `.btn-primary` | Yellow filled button | Search, login, call |
| `.btn-danger` | Red button | Emergency “call now” |
| `.btn-outline` | Yellow border, transparent fill | View map, favorites |
| `.card` | Dark rounded box with border | Profile, settings, detail |
| `.section-title` | Big title + **yellow vertical bar** on the side | Section headings |
| `.form-control` | Dark input with border | All forms |
| `.provider-card` | Image top + rating + call button | Services, favorites (from main.js) |
| `.status-dot.open` | Small green circle | “Open now” |
| `.grid-3` | 3 columns of cards | Services results |
| `.grid-auto` | Responsive card columns | Favorites |
| `.layout-with-sidebar` | Sidebar + main (240px + rest) | Profile, settings |
| `.pill.active` | Yellow rounded tab | Favorites filters |

---

## Page CSS — screen-specific layouts

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

Defined at the bottom of **components.css** and individual page CSS files:

- **≤ 900px**: 3-column grids → 2 columns; sidebar stacks above content; hero stacks vertically.
- **≤ 640px**: Nav links hide behind **hamburger** (`.menu-toggle`); grids become 1 column; form rows stack.

`inset-inline-start` / `margin-inline` flip automatically when `body.rtl` vs `body.ltr`.

---

## How HTML connects to CSS

1. **Static HTML** uses class names: `<button class="btn btn-primary">`
2. **main.js** injects header/footer with classes `.site-header`, `.footer-inner`
3. **main.js** (`renderProviderCard`) builds strings with `.provider-card`, `.provider-card__image`, etc.

If something looks unstyled, check the class name in HTML matches a rule in components.css or the page CSS file.

---

## Quick theme change

Edit **only** `variables.css`:

```css
--accent-yellow: #ffcc29;  /* try another hex for whole site */
--bg-main: #0b111e;
```

---

## CSS Properties Reference

Below is a quick reference table of all CSS properties used throughout the AutoConnect stylesheets:

| Property | Short Description |
|---|---|
| `align-items` | Aligns flex items or grid items along the cross axis (vertical alignment in a horizontal flex container). |
| `aspect-ratio` | Sets a preferred aspect ratio for the box (e.g., `16/9` or `1/1`). |
| `background` | Shorthand for setting multiple background properties (color, image, position, repeat, etc.) in a single rule. |
| `background-color` | Sets the background color of an element. |
| `background-position` | Sets the initial position of a background image. |
| `background-size` | Sets the size of the element's background image (e.g., `cover`, `contain`). |
| `border` | Shorthand for setting border width, style, and color around an element. |
| `border-bottom` | Sets the properties (width, style, color) of the bottom border. |
| `border-color` | Sets the color of the border on all four sides. |
| `border-radius` | Rounds the corners of an element's outer border edge. |
| `border-top` | Sets the properties (width, style, color) of the top border. |
| `bottom` | Sets the vertical position of a positioned element relative to its container's bottom edge. |
| `box-shadow` | Adds shadow effects around an element's frame. |
| `box-sizing` | Defines how the width and height of an element are calculated (e.g., `border-box` includes padding/border). |
| `clip` | Defines a clipping region (deprecated/legacy, often used for visually hiding elements when combined with absolute positioning). |
| `color` | Sets the foreground/text color of an element. |
| `content` | Used with the `::before` and `::after` pseudo-elements to insert generated content. |
| `cursor` | Specifies the mouse cursor to display when pointing over an element (e.g., `pointer`). |
| `direction` | Sets the text/layout direction (`ltr` for left-to-right, `rtl` for right-to-left). |
| `display` | Specifies the layout behavior/rendering box of an element (e.g., `block`, `inline`, `flex`, `grid`, `none`). |
| `flex-direction` | Sets the direction of the flex container's main axis (e.g., `row` or `column`). |
| `flex-shrink` | Determines how much a flex item will shrink relative to the rest of the flex items when space is limited. |
| `flex-wrap` | Sets whether flex items are forced onto a single line or can wrap onto multiple lines. |
| `font` | Shorthand for setting font style, variant, weight, size, line height, and family. |
| `font-family` | Specifies the font/typeface list for text. |
| `font-size` | Sets the size of the font. |
| `font-weight` | Sets the thickness/weight of the font (e.g., `bold`, `500`). |
| `gap` | Sets the gaps (gutters) between grid rows/columns and flex items. |
| `grid-column` | Shorthand specifying a grid item's size and location within grid columns. |
| `grid-template-columns` | Defines the line names and track sizing functions of the grid columns. |
| `height` | Sets the height of an element. |
| `inset` | Shorthand for top, right, bottom, and left properties on positioned elements. |
| `inset-inline` | Shorthand for the logical inline start and end offsets of an element. |
| `inset-inline-end` | Sets the logical inline-end offset (corresponds to right in LTR, left in RTL). |
| `inset-inline-start` | Sets the logical inline-start offset (corresponds to left in LTR, right in RTL). |
| `justify-content` | Aligns flex items or grid items along the main axis (horizontal alignment in a horizontal flex container). |
| `letter-spacing` | Sets the horizontal spacing behavior between text characters. |
| `line-height` | Sets the height of a line box (commonly used to adjust line spacing in text). |
| `list-style` | Shorthand for setting list item marker properties (type, position, image). |
| `margin` | Sets the margin area on all four sides of an element. |
| `margin-bottom` | Sets the bottom margin area. |
| `margin-inline` | Shorthand for setting logical inline start and end margins. |
| `margin-inline-end` | Sets the logical inline-end margin of an element (respects text direction). |
| `margin-top` | Sets the top margin area. |
| `max-height` | Sets the maximum height of an element. |
| `max-width` | Sets the maximum width of an element. |
| `min-height` | Sets the minimum height of an element. |
| `min-width` | Sets the minimum width of an element. |
| `object-fit` | Specifies how an `<img>` or `<video>` should be resized to fit its container (e.g., `cover`, `contain`). |
| `object-position` | Specifies the alignment of the replaced element's content inside its box. |
| `opacity` | Sets the opacity/transparency level of an element. |
| `outline` | Shorthand for drawing a line around elements, outside the border edge, often used for accessibility focus indicators. |
| `overflow` | Specifies what to do when content overflows an element's box (e.g., `hidden`, `auto`, `scroll`). |
| `padding` | Sets the padding area on all four sides of an element. |
| `padding-block` | Shorthand for setting logical block start and end paddings (top and bottom). |
| `padding-bottom` | Sets the bottom padding area. |
| `padding-inline-start` | Sets the logical inline-start padding of an element (left in LTR, right in RTL). |
| `padding-top` | Sets the top padding area. |
| `position` | Specifies the positioning method used for an element (e.g., `static`, `relative`, `absolute`, `fixed`, `sticky`). |
| `right` | Sets the horizontal position of a positioned element relative to its container's right edge. |
| `scroll-behavior` | Sets the behavior for a scrolling box when scrolling is triggered by navigation or APIs (e.g., `smooth`). |
| `text-align` | Specifies the horizontal alignment of text. |
| `text-decoration` | Sets the appearance of decorative lines on text (e.g., `underline`, `none`). |
| `top` | Sets the vertical position of a positioned element relative to its container's top edge. |
| `transform` | Applies 2D or 3D transformations to an element (e.g., `translate`, `rotate`, `scale`). |
| `transition` | Shorthand for setting transition properties, duration, timing function, and delay for CSS animations. |
| `user-select` | Controls whether the user can select text within the element. |
| `width` | Sets the width of an element. |
| `z-index` | Sets the stack order of a positioned element (which elements cover others). |
