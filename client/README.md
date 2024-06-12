This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Maintaining Dependencies

Periodically updgrading this project's dependencies is vital. You can check the
status of the current dependencies by entering `npm outdated`. This will give you
a list of dependencies that have an out-of-date version.

You can use `npm update` to update all packages at once while respecting the
semantic versioning in `package.json`, but if you need to break those constraints
for a package you need to use `npm install <dependency>@latest`. Yes, you must do
this manually for each dependency one-by-one. It is recommended that you commit
each such change after you confirm that it didn't break anything or fix the things
it did break. Then, if you upgrade something that breaks the client and you can't
fix it, you can revert the change to both `package.json` and `package-lock.json`
easily and recover a working local environment.