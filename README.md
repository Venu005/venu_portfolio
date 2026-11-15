# Venusai Yalamanchili — Portfolio

Personal site for **Venusai Yalamanchili**, software engineer and freelance developer. Built with Next.js 14, Tailwind CSS, Framer Motion and Lenis smooth scrolling.

## Run locally

```bash
pnpm install
pnpm dev
```

## Editing content

All copy lives in [`src/data/site.ts`](src/data/site.ts): profile, stats, experience, projects, services, skills and achievements.

### Your photos

- **Hero portrait:** put a photo in `public/me/` (e.g. `public/me/hero.jpg`) and set `profile.heroImage` to `"/me/hero.jpg"`.
  A centred head-and-shoulders shot on a plain background works best. It's rendered with the interactive WebGL effect
  (`src/components/site/Photo3D.tsx`): the photo turns toward the cursor, and hovering reveals a lime "x-ray" layer.
- **Optional depth map:** for a stronger 3D effect, add a grayscale depth map of the same photo (white = near) and set
  `profile.heroDepth`. Without one, a built-in head-and-shoulders depth is used.
- **Polaroids:** add `{ src, caption }` entries to `profile.gallery` to scatter photos around the About statement.

## Structure

- `src/app/` — layout, global styles
- `src/sections/` — page sections (Hero, About, Tracks, Experience, Work, Services, Skills, Contact, Footer)
- `src/components/site/` — shared pieces (Nav, Loader, Photo3D, Marquee, Reveal, SmoothScroll…)
