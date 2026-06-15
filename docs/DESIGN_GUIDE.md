# Replo Design Guide

## Product Design Intent
Replo is a CS operations and CX operations service for commerce brands. The product should feel like a clean B2B SaaS: trustworthy, operationally competent, calm, practical, professional, and simple.

## Visual Source Of Truth
The original Claude-designed homepage at `public/replo-original/index.html` is the visual source of truth for the public homepage.

Do not redesign, rebuild, or reinterpret the original homepage unless explicitly instructed. Public homepage work should preserve its structure, copy, spacing, and visual tone. Small behavioral changes such as CTA routing may be added with minimal scripts when safer than rebuilding the bundle.

## Brand Tone
Use concise Korean copy. Prefer operational clarity over marketing flourish. Replo should sound competent, direct, and helpful.

Avoid playful consumer app styling, excessive gradients, overly decorative UI, random new design systems, unnecessary animation, and dense layouts.

## Color System
Baseline colors:

- Primary Purple: `#5B47E0`
- Soft Background: `#F7F6FF`
- White: `#FFFFFF`
- Dark Text: `#1F2933` or similar
- Muted Text: `#6B7280` or similar
- Light Border: `#CBD2DA` or similar
- Page Gray: `#F1F3F5` or similar

Use `#5B47E0` for primary CTAs and selected/active states. Use soft backgrounds and white cards. Keep contrast high. Do not introduce unrelated accent colors.

## Typography Rules
Use a modern system sans stack or Pretendard when available. Headings should be bold and direct. Body copy should be readable at 15-18px with comfortable line height. Avoid novelty fonts and cramped letter spacing.

## Layout And Spacing
Use centered, constrained layouts for public forms and content-heavy sections. Prefer generous whitespace over dense dashboards on public pages. Keep page sections visually simple: white or soft background bands, restrained borders, and predictable spacing.

## Button Rules
Primary CTAs use purple fill with white text. Secondary buttons use white background with a light border. Buttons should have clear labels and be large enough to tap on mobile. Public homepage CTAs should direct users toward `/contact`, not login.

## Card Rules
Cards should be white, lightly bordered, and modestly rounded. Use cards for grouped content, forms, pricing tiers, or dashboard modules. Avoid nested decorative cards and heavy shadows.

## Form Rules
Forms should be compact, clear, and mobile-first. Labels must be visible. Required fields should be validated before submission. Error messages should be user-facing Korean text. Do not collect payment credentials in public forms.

## Diagnosis Form Rules
The current diagnosis form direction is single-page dropdown-based, not multi-step.

Do not use a stepper. Do not use large radio option cards for the current version. Use dropdown/select fields for the first three questions and text inputs for contact fields.

The diagnosis form should be:

- One-page
- Dropdown-based
- Compact
- Mobile-first
- Centered on desktop
- White card on light gray or soft purple background
- Simple B2B SaaS style
- Easy to complete quickly

## Public Homepage Rules
The public homepage visual design must remain the Claude-designed bundle. Hide or de-emphasize public-facing login buttons unless explicitly instructed. Main public CTAs should lead to `/contact`.

Do not change the original hero copy or nav labels without explicit instruction.

## Auth And Customer Portal Rules
The customer mypage at `/mypage` and operations dashboard at `/dashboard` should remain protected by Supabase Auth. Public pages such as `/contact` must not require login. Customer portal UI should stay calm, compact, and operational rather than decorative.

## Customer Portal Layout System
The authenticated customer portal uses one shared navigation system. Do not recreate the rail, workspace sidebar, navigation icons, active states, profile shortcut, or logout control inside individual pages.

### Shared Components

- `src/components/portal/PortalRail.tsx`
  - The single source of truth for the primary portal navigation.
  - Contains dashboard, reports, integrations, and account links.
  - Owns the navigation icons, labels, active state, profile shortcut, and mobile bottom navigation.
- `src/components/portal/PortalShell.tsx`
  - The required shell for dashboard, report, integration, and integration-detail pages.
  - Owns `PortalRail`, the workspace name and plan sidebar, logout, and the main content region.
  - Use its `sidebar` prop only for page-specific controls such as filters, sync status, or actions.
- `src/app/dashboard/[tenantId]/loading.tsx`
  - The shared route-loading UI for the dashboard subtree.
  - Keep its rail, sidebar, cards, and progress treatment visually aligned with `PortalShell`.

### Required Page Structure

All routes under `/dashboard/[tenantId]`, including reports and integration detail pages, must render their content inside `PortalShell`.

```tsx
<PortalShell
  tenantId={tenantId}
  tenantName={tenant.name}
  planName={tenant.planName}
  active="reports"
>
  {/* Page content only */}
</PortalShell>
```

Pass exactly one active section:

- `dashboard`: operations dashboard
- `reports`: reports and report detail pages
- `integrations`: integrations and connector detail pages
- `account`: mypage and workspace settings

The mypage keeps its settings-specific secondary menu, including workspace settings. Its primary navigation must still use `PortalRail`. Do not create a separate mypage rail.

### Portal Layout Rules

- Desktop uses a three-column layout: primary rail, workspace sidebar, main content.
- The primary rail remains visible on dashboard, reports, integrations, connector details, and mypage.
- The workspace sidebar must not disappear on report or integration routes.
- The primary rail is the only global page navigation. Do not repeat dashboard, reports, integrations, or account links in the workspace sidebar.
- The workspace sidebar shows workspace identity and page-specific controls only.
- `워크스페이스 설정` and its settings menu are exposed only on the account route at `/mypage`.
- Desktop navigation uses the shared icon-and-label treatment. Do not replace it with numbered navigation.
- Mobile converts the shared primary rail into a fixed bottom navigation.
- At widths of `640px` and below, reserve bottom padding for the fixed navigation and verify that `document.documentElement.scrollWidth` does not exceed the viewport width.
- Page-specific controls belong in `PortalShell.sidebar`; primary navigation does not.
- Portal colors, spacing, cards, and typography should continue using the existing rules in `src/app/dashboard/dashboard.css` and `src/components/portal/PortalRail.module.css`.

### Portal Loading Rules

Data-heavy portal routes must always provide visible loading feedback.

- Route transitions in the dashboard subtree use `src/app/dashboard/[tenantId]/loading.tsx`.
- Client-side refetch, filtering, and synchronization use the thin `.dashboard-progress` progress bar at the top of the main content.
- Keep the progress bar visible for the full request lifecycle, including error responses, and clear it in `finally`.
- Disable the action that started the request while it is running to prevent duplicate requests.
- Use `role="progressbar"` with a Korean `aria-label`.
- Loading skeletons should preserve the normal rail, sidebar, card, and panel geometry to avoid layout jumps.
- Do not replace portal loading feedback with a blank screen, an isolated spinner, or text-only loading.

### Dashboard Date Defaults

- The operations dashboard opens with daily data for the current calendar month.
- Use the tenant-facing `Asia/Seoul` date: start at the first day of the current month and end at today.
- Example: May opens as May 1 through today in May; June opens as June 1 through today in June.
- Keep explicit user-selected start and end dates when refreshing or filtering.
- Do not expose a manual day/week/month selector.
- Select chart aggregation automatically: up to 31 days uses daily points, up to 56 days uses weekly points, and longer ranges use monthly points.
- Trend chart points must expose the represented date or date range and count through mouse hover and keyboard focus.
- Trend charts show a vertical guide for every data point and date labels at an automatically reduced interval; always keep the first and last date visible.
- ChannelTalk 처리 건수 and plan usage use `closedAt` in the tenant timezone. Open or snoozed chats are not counted as completed work.
- The reports route may keep its separate long-range reporting period.

### Portal Implementation Don'ts

Do not:

- Add page-local copies of `PortalRail`, `PortalShell`, `NavIcon`, workspace navigation, or logout logic.
- Add new `.dashboard-rail`, `.mypage-rail`, numbered rail, or equivalent duplicate rail styles.
- Duplicate the primary rail links inside the workspace sidebar.
- Show `워크스페이스 설정` outside the account route.
- Render reports, integrations, or connector details as standalone cards without the shared portal shell.
- Hide the primary navigation on integration pages.
- Introduce a second set of active-state colors or navigation breakpoints.
- Add a new portal route without checking desktop and `390px` mobile layouts.

## Accessibility Basics
Use semantic labels for form fields. Preserve keyboard access for buttons and links. Maintain high contrast and visible focus states. Tap targets should be comfortable on mobile.

## Responsive Behavior
Public forms should use one column on mobile. Desktop forms should stay centered and not stretch too wide. Minimal scroll is acceptable on mobile if it improves usability.

## Do And Don't
Do:

- Preserve the Claude-designed public homepage.
- Use `#5B47E0` for primary action states.
- Keep forms compact and easy to complete.
- Keep Korean copy clear and practical.
- Verify mobile layouts for horizontal overflow.
- Reuse `PortalShell` and `PortalRail` for authenticated portal screens.
- Add route and request loading feedback to data-heavy portal screens.

Don't:

- Redesign the public homepage without explicit instruction.
- Replace the diagnosis form with a multi-step flow.
- Use large radio-card selections for the current diagnosis form.
- Make login the main public CTA.
- Introduce unrelated colors, decorative animations, or a new visual system.
- Ask for card number, CVC, expiration date, billing password, or payment credentials.
- Rebuild portal navigation or workspace layout inside individual pages.
