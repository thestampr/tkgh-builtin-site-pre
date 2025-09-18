import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth/password';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing (dev only)
  await prisma.analyticsEvent.deleteMany();
  await prisma.favoriteBuiltIn.deleteMany();
  await prisma.builtIn.deleteMany();
  await prisma.category.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const password = await hashPassword('password123');

  // Demo seed disabled for clean initial deployment.
  // To re-enable, uncomment the block below.
  /*
  const provider = await prisma.user.create({
    data: { email: 'provider@example.com', passwordHash: password, role: 'PROVIDER', profile: { create: { displayName: 'Demo Provider', published: true } } },
    select: { id: true }
  });
  await prisma.user.create({
    data: { email: 'user@example.com', passwordHash: password, role: 'USER', profile: { create: { displayName: 'Normal User', published: true } } }
  });
  const catLiving = await prisma.category.create({ data: { providerId: provider.id, name: 'Living Room', slug: 'living-room', description: 'Living concepts', published: true } });
  const catKitchen = await prisma.category.create({ data: { providerId: provider.id, name: 'Kitchen', slug: 'kitchen', description: 'Kitchen ideas', published: true } });
  await prisma.builtIn.create({ data: { providerId: provider.id, categoryId: catLiving.id, title: 'Modern Living Wall Unit', slug: 'modern-living-wall-unit', summary: 'Sleek storage + display for living room', content: '# Modern Living Wall Unit\\nA sample description in markdown.', coverImage: '/images/hero.jpg', galleryJson: JSON.stringify(['/images/hero.jpg']), price: 259900, status: 'PUBLISHED', publishedAt: new Date() } });
  await prisma.builtIn.create({ data: { providerId: provider.id, categoryId: catKitchen.id, title: 'Minimalist Kitchen Cabinet', slug: 'minimalist-kitchen-cabinet', summary: 'Minimal lines, matte finish', content: 'Details coming soon', price: 189500, status: 'DRAFT' } });
  console.log('Seed complete');
  */
  console.log('Seed skipped (clean deploy)');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
