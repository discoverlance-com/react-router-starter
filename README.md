# Welcome to React Router Starter

React router is a modern, production-ready template for building full-stack
React applications using React Router.

This is a template that builds upon react router and provides some tooling such
as styling, csp, custom node server, shadcn ui and testing.

This is of course bare bones but gives you enough to get started with your
project. Changes and suggestions for improvement are welcome. If you have any
issues or suggestions, please create an issue on the github repository.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/discoverlance-com/react-router-starter/tree/main/default)

## Features

- Content Security Policy
- Styling with Tailwind and Shadcn ui
- Default Error Boundary with Splat Route Customisation
- Unit and Component Testing with Vitest
- Playwright for End to End Testing
- API Mocking with MSW - for testing
- Prettier for formatting components

## Getting Started

### Installation

Install the dependencies:

```bash
yarn
```

### Development

Start the development server with HMR, Mock Server:

```bash
yarn run dev
```

Your application will be available at `http://localhost:3000`.

## Building for Production

Create a production build:

```bash
yarn run build
```

## Deployment

### Docker Deployment

This template includes three Dockerfiles optimized for different package
managers:

- `Dockerfile`

To build and run using Docker:

```bash
# For npm
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports
Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

---

Built with ❤️ using React Router.

## Acknowledgements

1. [Epic Stack](https://github.com/epicweb-dev/epic-stack) - The primary pieces
   including client hints, honeypot, custom node server were inspired by this
   project. If you want a full experience with database setup, authentication
   and much more with react router, I encourage you to check out this project.
