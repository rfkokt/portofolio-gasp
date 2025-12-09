import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seed Projects
  await prisma.project.create({
    data: {
      title: 'Project Alpha',
      description: 'A comprehensive dashboard for analytics and data visualization.',
      category: 'Web Application',
      tech: 'Next.js, D3.js, Tailwind',
      featured: true,
    },
  })

  await prisma.project.create({
    data: {
      title: 'Neon Commerce',
      description: 'High-performance headless e-commerce storefront with 3D product previews.',
      category: 'E-Commerce',
      tech: 'Shopify, Three.js, React',
      featured: true,
    },
  })

  // Seed Posts
  await prisma.post.create({
    data: {
      title: 'The Future of 3D on the Web',
      slug: 'future-of-3d-web',
      excerpt: 'Exploring WebGL, WebGPU, and the rise of immersive web experiences.',
      content: 'Full content goes here...',
      published: true,
      viewCount: 120,
    },
  })

  await prisma.post.create({
    data: {
      title: 'Mastering GSAP Animations',
      slug: 'mastering-gsap',
      excerpt: 'A deep dive into timelines, scroll triggers, and performant motion.',
      content: 'Full content goes here...',
      published: true,
      viewCount: 85,
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
