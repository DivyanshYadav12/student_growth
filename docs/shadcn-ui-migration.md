# shadcn/ui migration — Design System v2

## Migration goal

Standardize the shared frontend primitives on shadcn/ui conventions while preserving the existing Dashboard, Academics, and Skill Quest routes and their prototype interactions.

## Implementation choices

- **Component base:** Radix UI. This is explicitly selected in `components.json` so the component behavior remains consistent with the Radix-based components in this migration.
- **Style preset:** `radix-vega` (Radix primitives with the Vega visual style).
- **CSS:** Tailwind CSS v4 with semantic CSS variables in `src/app/globals.css`.
- **Icons:** Lucide React.
- **Utilities:** `cn()` combines `clsx` and `tailwind-merge`.
- **Forms:** React Hook Form + Zod, with shared form-field wrappers available for upcoming forms.
- **Feedback:** Sonner, mounted once in the root layout.

## Shared component library

`src/components/ui/` now contains source-owned primitives for:

- Button, Badge, Card, Input, Textarea, Label, Separator, Progress, Skeleton, Alert and Table.
- Tabs, Accordion, Dialog, Alert Dialog, Dropdown Menu, Sheet, Popover, Select, Checkbox, Radio Group, Switch, Avatar, Scroll Area and Tooltip.
- Form wrappers, Breadcrumb, Sidebar primitives and Sonner integration.

The project owns these component files and can customize them directly. The `components.json` file records the aliases and style configuration used by the shadcn CLI when adding further components.

## Migrated application areas

- The application shell now uses shared Button, Input, Avatar, Dropdown Menu, Sheet, Tooltip Provider and Sidebar primitives.
- The Academics catalogue uses shared Input and Select components.
- The Subject Detail page uses shared Input, Select and Tabs components.
- Skill Quest catalogue filters use shared Button components.
- Skill Quest path modules use the shared Accordion component.
- The root layout mounts the Sonner toaster.
- `/design-system` is a component showcase route for visual and interaction checks.

Existing product-specific components remain in `src/components/{dashboard,academics,skill-quest,layout}`. They should compose the shared primitives rather than duplicate generic UI behavior.

## Run locally

Requirements: Node.js 20.9+ and npm.

```powershell
npm install
npm run dev
```

Open these routes:

- `/` — Dashboard
- `/academics` — subject catalogue
- `/academics/subjects/dbms` — DBMS subject detail
- `/quest` — Skill Quest catalogue
- `/quest/paths/cpp-dsa-foundations` — C++ and DSA path
- `/quest/lessons/arrays-sliding-window` — sample lesson
- `/design-system` — component showcase

## Add more shadcn components later

The project has an existing App Router setup and a `components.json` file. For a new component, run the CLI from the project root and review the generated diff before accepting changes:

```powershell
npx shadcn@latest add calendar
```

Replace `calendar` with the component needed. Avoid re-running `init` over the existing project unless intentionally reconciling configuration changes.

## Validation caveat

The source files were syntax-transpiled successfully during this migration. A full TypeScript check and Next.js build require the declared npm dependencies to be installed. Package-registry access was unavailable in the build environment, so dependency installation, browser QA and a production build remain to be completed on the development machine.

## Follow-up engineering tasks

1. Run `npm install` and commit the generated `package-lock.json`.
2. Run `npm run typecheck`, `npm run lint` and `npm run build`; resolve any version-specific issues.
3. Test keyboard operation, focus restoration, screen-reader labels and mobile navigation at real breakpoints.
4. Gradually replace remaining page-specific hard-coded colors with semantic theme tokens.
5. Keep product behavior and API/domain logic outside `components/ui`.
