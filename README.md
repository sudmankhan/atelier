# FORM & GRAIN

An interactive chairmaking studio: change a chair in 3D and see why chairs hold up — joint stress, tipping and wood movement calculated from statics and USDA Wood Handbook data, every number labelled with where it comes from. See [docs/PRODUCT_GUIDE.md](docs/PRODUCT_GUIDE.md) for a plain-language guide and [docs/README.md](docs/README.md) for the developer docs.

## Lovable project

This project was built with [Lovable](https://lovable.dev).

### Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev      # open the local URL Vite prints
npx vitest run   # tests
```

The AI mentor and photo inspector need `LOVABLE_API_KEY` (provided inside Lovable); everything else works locally without it.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
