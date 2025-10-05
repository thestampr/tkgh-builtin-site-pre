import { hashPassword } from '@/lib/auth/password';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetAll() {
  // Order matters to satisfy FK constraints in case onDelete is not enough
  await prisma.$transaction([
    prisma.analyticsEvent.deleteMany(),
    prisma.favoriteBuiltIn.deleteMany(),
    prisma.builtInTranslation.deleteMany(),
    prisma.builtIn.deleteMany(),
    prisma.categoryTranslation.deleteMany(),
    prisma.category.deleteMany(),
    prisma.estimate.deleteMany(),
    prisma.profileTranslation.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function demoData() {
  const password = await hashPassword('password123');

  // Users
  const provider = await prisma.user.create({
    data: {
      email: 'provider@example.com',
      passwordHash: password,
      role: 'PROVIDER',
      profile: {
        create: {
          displayName: 'Demo Provider',
          bio: 'Quality built-ins, clear pricing, friendly service.',
          avatarUrl: '/images/icon-w.png',
          coverImage: '/images/hero.jpg',
          contactJson: {
            channels: [
              { type: 'phone', value: '+66 80 000 0000' },
              { type: 'line', value: '@demo' },
            ],
          },
          ctaJson: { label: 'Get a Quote', href: '/estimate', style: 'solid' },
          translations: {
            create: [
              { locale: 'th', displayName: 'ผู้ให้บริการเดโม่', bio: 'งานบิลท์อินคุณภาพ ราคาชัดเจน บริการเป็นกันเอง', ctaLabel: 'ขอใบเสนอราคา' },
              { locale: 'en', displayName: 'Demo Provider', bio: 'Quality built-ins, clear pricing, friendly service.', ctaLabel: 'Get a Quote' },
            ],
          },
        },
      },
    },
    select: { id: true },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      passwordHash: password,
      role: 'CUSTOMER',
      profile: { create: { displayName: 'Demo Customer' } },
    },
    select: { id: true },
  });

  // Categories
  const living = await prisma.category.create({
    data: {
      providerId: provider.id,
      name: 'Living Room',
      slug: 'living-room',
      description: 'Living concepts',
      coverImage: '/images/hero.jpg',
      published: true,
      translations: {
        create: [
          { locale: 'th', name: 'ห้องนั่งเล่น', description: 'แนวคิดสำหรับห้องนั่งเล่น', excerpt: 'ไอเดียบิลท์อินห้องนั่งเล่น', published: true },
          { locale: 'en', name: 'Living Room', description: 'Living concepts', excerpt: 'Living built-in ideas', published: true },
        ],
      },
    },
  });

  const kitchen = await prisma.category.create({
    data: {
      providerId: provider.id,
      name: 'Kitchen',
      slug: 'kitchen',
      description: 'Kitchen ideas',
      coverImage: '/images/hero.jpg',
      published: true,
      translations: {
        create: [
          { locale: 'th', name: 'ครัว', description: 'ไอเดียครัว', excerpt: 'ครัวบิลท์อิน', published: true },
          { locale: 'en', name: 'Kitchen', description: 'Kitchen ideas', excerpt: 'Built-in kitchen', published: true },
        ],
      },
    },
  });

  // Built-ins
  const livingUnit = await prisma.builtIn.create({
    data: {
      providerId: provider.id,
      categoryId: living.id,
      title: 'Modern Living Wall Unit',
      slug: 'modern-living-wall-unit',
      summary: 'Sleek storage + display for living room',
      content: '# Modern Living Wall Unit\nA sample description in markdown.',
      coverImage: '/images/hero.jpg',
      galleryJson: ['/images/hero.jpg'],
      price: 259900,
      currency: 'THB',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      translations: {
        create: [
          { locale: 'th', title: 'ชั้นผนังห้องนั่งเล่นสมัยใหม่', summary: 'ที่เก็บของและโชว์งานที่สวยงาม', content: 'รายละเอียดตัวอย่าง', ctaLabel: 'ขอราคา', published: true },
          { locale: 'en', title: 'Modern Living Wall Unit', summary: 'Sleek storage + display', content: 'Sample details', ctaLabel: 'Get Price', published: true },
        ],
      },
    },
  });

  const kitchenCabinet = await prisma.builtIn.create({
    data: {
      providerId: provider.id,
      categoryId: kitchen.id,
      title: 'Minimalist Kitchen Cabinet',
      slug: 'minimalist-kitchen-cabinet',
      summary: 'Minimal lines, matte finish',
      content: 'Details coming soon',
      coverImage: '/images/hero.jpg',
      galleryJson: ['/images/hero.jpg'],
      price: 189500,
      currency: 'THB',
      status: 'DRAFT',
      translations: {
        create: [
          { locale: 'th', title: 'ตู้ครัวมินิมอล', summary: 'เส้นสายมินิมอล ผิวด้าน', content: 'รายละเอียดเร็วๆ นี้', published: false },
          { locale: 'en', title: 'Minimalist Kitchen Cabinet', summary: 'Minimal lines, matte finish', content: 'Coming soon', published: false },
        ],
      },
    },
  });

  // Favorite
  await prisma.favoriteBuiltIn.create({
    data: { userId: customer.id, builtInId: livingUnit.id },
  });

  // Analytics
  await prisma.analyticsEvent.createMany({
    data: [
      { type: 'view', path: `/p/${provider.id}/b/${livingUnit.slug}`, builtInId: livingUnit.id, userId: customer.id, userAgent: 'seed', ipHash: 'seed' },
      { type: 'view', path: `/p/${provider.id}/c/${living.slug}`, userAgent: 'seed', ipHash: 'seed' },
    ],
  });

  // Estimate
  await prisma.estimate.create({
    data: {
      locale: 'th',
      name: 'คุณลูกค้า',
      phone: '+66 89 000 0000',
      email: 'lead@example.com',
      location: 'Bangkok',
      budget: '300,000-500,000',
      detail: 'ต้องการบิลท์อินชั้นวางทีวีและตู้เก็บของ',
      userId: customer.id,
      categoryId: living.id,
      providerId: provider.id,
    },
  });

  console.log('Seeded demo data:', { provider: provider.id, customer: customer.id });
}

async function main() {
  console.log('Seeding database (clean reset + demo dataset)...');
  await resetAll();

  // By default, populate demo data that covers all tables
  // await demoData();

  console.log('Seed complete');
}

main()
.catch((e) => {
  console.error(e);
  process.exit(1);
})
.finally(async () => {
  await prisma.$disconnect();
});
