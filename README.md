# Jiaqi Wang · Personal website

An English-first bilingual homepage covering cosmology research, AI interests and creative projects.

Live website: https://wangjia7.github.io/

## Preview

No build or dependencies required. From this directory, run:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173/.

## Update

- `index.html`: sections, links and bilingual text. For translated elements, edit both `data-zh` and `data-en`, plus the initial English text. Use literal `\n` for line breaks in translated headings.
- `assets/style.css`: layout, colours and typography.
- `assets/site.js`: language selection and illustrative geometric figures.
- `assets/fonts/`: self-hosted Sora variable font, licensed under the bundled SIL Open Font License.

GitHub Pages serves the root of the `gh-pages` branch. Commit updates to that branch to publish. `.nojekyll` makes this a plain static site. The previous `index.md` and `_config.yml` are preserved in the repository for reference.

## Content sources

Education and outreach: the previous homepage and public profile https://github.com/Wangjia7. Research links: https://arxiv.org/abs/2604.02300 and https://arxiv.org/abs/2207.12771, https://arxiv.org/abs/2510.20896 and https://arxiv.org/abs/2205.01816. Creative project descriptions are based on their public repositories.

The cosmic web and wave figures are procedural conceptual illustrations, not simulation results or audio previews. The network slowly evolves, and its anchors respond to the pointer. Filament particles, halo nodes and loop polygons all share those moving anchors, so Structure, Nodes and Loops stay aligned. Click or use the scatter button to disperse the network; pause/resume is available. Animation pauses offscreen and in hidden tabs, and reduced-motion preferences render a static diagram. There is no analytics, external runtime font service, server, or contact-form data collection.
