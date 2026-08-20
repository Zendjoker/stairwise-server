import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const posters = [
    { phone: '+15550000001', name: 'Dana K.', rating: 4.9, tasksPosted: 21, memberSinceYear: 2023 },
    { phone: '+15550000002', name: 'Leo M.', rating: 4.7, tasksPosted: 8, memberSinceYear: 2024 },
    { phone: '+15550000003', name: 'Jordan P.', rating: 5.0, tasksPosted: 34, memberSinceYear: 2022 },
    { phone: '+15550000004', name: 'Renee A.', rating: 4.6, tasksPosted: 12, memberSinceYear: 2023 },
    { phone: '+15550000005', name: 'Chris B.', rating: 4.8, tasksPosted: 5, memberSinceYear: 2025 },
    { phone: '+15550000006', name: 'Omar S.', rating: 4.5, tasksPosted: 3, memberSinceYear: 2025 },
    { phone: '+15550000007', name: 'Stairwise Offices Inc.', rating: 4.9, tasksPosted: 17, memberSinceYear: 2024 },
  ];

  const posterUsers = [];
  for (const p of posters) {
    posterUsers.push(
      await db.user.upsert({
        where: { phone: p.phone },
        update: {},
        create: { ...p, role: 'client' },
      })
    );
  }

  const reviewers = [
    { phone: '+15550001001', name: 'Marcus T.' },
    { phone: '+15550001002', name: 'Priya S.' },
    { phone: '+15550001003', name: 'Aisha R.' },
    { phone: '+15550001004', name: 'Sam K.' },
    { phone: '+15550001005', name: 'Wei C.' },
    { phone: '+15550001006', name: 'Devon L.' },
    { phone: '+15550001007', name: 'Nina F.' },
    { phone: '+15550001008', name: 'Grace L.' },
    { phone: '+15550001009', name: 'Ben H.' },
  ];

  const reviewerUsers = [];
  for (const r of reviewers) {
    reviewerUsers.push(
      await db.user.upsert({ where: { phone: r.phone }, update: {}, create: { ...r, role: 'tasker' } })
    );
  }

  const reviewsByPoster = [
    [
      { author: reviewerUsers[0], rating: 5, text: 'Clear instructions, easy building, paid right away.' },
      { author: reviewerUsers[1], rating: 5, text: 'Friendly and flexible on timing. Would work for again.' },
    ],
    [{ author: reviewerUsers[2], rating: 5, text: 'Everything was staged and ready to go.' }],
    [
      { author: reviewerUsers[3], rating: 5, text: 'Fixed a leaky faucet fast. Booking again for sure.' },
      { author: reviewerUsers[4], rating: 5, text: 'Super tidy and on time, would recommend.' },
    ],
    [{ author: reviewerUsers[5], rating: 4, text: 'Heavy load but the crew handled it well.' }],
    [{ author: reviewerUsers[6], rating: 5, text: 'Yard looked incredible before the open house.' }],
    [{ author: reviewerUsers[7], rating: 4, text: 'Garage was a mess but they knocked it out fast.' }],
    [{ author: reviewerUsers[8], rating: 5, text: 'Cable management looked professional after.' }],
  ];

  for (let i = 0; i < posterUsers.length; i++) {
    for (const review of reviewsByPoster[i]) {
      await db.review.create({
        data: {
          targetId: posterUsers[i].id,
          authorId: review.author.id,
          rating: review.rating,
          text: review.text,
        },
      });
    }
  }

  const inMinutes = (m: number) => new Date(Date.now() + m * 60000);

  const tasks = [
    {
      title: 'Move a couch up two flights',
      description:
        'Need help getting a 3-seat couch from a moving truck up to a 2nd floor apartment. No elevator.',
      address: '412 Oak St, San Francisco, CA',
      date: new Date('2026-08-22T14:00:00.000Z'),
      category: 'Moving',
      icon: 'sofa',
      taskersNeeded: 2,
      hourlyRateCents: 3000,
      requirements: [],
      expiresAt: inMinutes(45),
      postedById: posterUsers[0].id,
    },
    {
      title: 'Load a van with boxes',
      description: 'About 25 boxes need to go from a storage unit into a rental van. Dolly available on site.',
      address: '88 Harrison Ave, San Francisco, CA',
      date: new Date('2026-08-21T10:30:00.000Z'),
      category: 'Moving',
      icon: 'package-variant-closed',
      taskersNeeded: 1,
      hourlyRateCents: 2500,
      requirements: ['Van required'],
      expiresAt: inMinutes(20),
      postedById: posterUsers[1].id,
    },
    {
      title: 'Assemble IKEA bed frame',
      description: 'Standard queen bed frame, all parts and instructions on hand. Should take about an hour.',
      address: '1200 Valencia St, San Francisco, CA',
      date: new Date('2026-08-23T16:00:00.000Z'),
      category: 'Assembly',
      icon: 'wrench',
      taskersNeeded: 1,
      hourlyRateCents: 3500,
      requirements: ['Own tools'],
      expiresAt: inMinutes(90),
      postedById: posterUsers[2].id,
    },
    {
      title: 'Haul old furniture to dump',
      description: 'Need a truck and a hand to take an old mattress and dresser to the dump. Dump fee covered.',
      address: '55 9th St, San Francisco, CA',
      date: new Date('2026-08-24T09:00:00.000Z'),
      category: 'Hauling',
      icon: 'dump-truck',
      taskersNeeded: 2,
      hourlyRateCents: 4000,
      requirements: ['Van required'],
      expiresAt: inMinutes(60),
      postedById: posterUsers[3].id,
    },
    {
      title: 'Yard cleanup before open house',
      description: 'Rake leaves, trim hedges, and haul green waste to the curb ahead of a Saturday open house.',
      address: '331 Cortland Ave, San Francisco, CA',
      date: new Date('2026-08-22T08:00:00.000Z'),
      category: 'Yard work',
      icon: 'grass',
      taskersNeeded: 1,
      hourlyRateCents: 2200,
      requirements: [],
      expiresAt: inMinutes(120),
      postedById: posterUsers[4].id,
    },
    {
      title: 'Junk removal from garage',
      description:
        'Clearing a two-car garage of old appliances and scrap wood. Load into your truck or van and haul away.',
      address: '2100 Mission St, San Francisco, CA',
      date: new Date('2026-08-23T11:00:00.000Z'),
      category: 'Trash Removal',
      icon: 'delete-outline',
      taskersNeeded: 2,
      hourlyRateCents: 2800,
      requirements: ['Van required'],
      expiresAt: inMinutes(15),
      postedById: posterUsers[5].id,
    },
    {
      title: 'Office cleanout and cable management',
      description: 'Tidy up a small office: wipe down desks, organize and bundle loose cables, take out recycling.',
      address: '600 Townsend St, San Francisco, CA',
      date: new Date('2026-08-25T13:00:00.000Z'),
      category: 'Office Cleaning',
      icon: 'broom',
      taskersNeeded: 1,
      hourlyRateCents: 2600,
      requirements: [],
      expiresAt: inMinutes(75),
      postedById: posterUsers[6].id,
    },
  ];

  for (const t of tasks) {
    await db.task.create({ data: t });
  }

  console.log(`Seeded ${posterUsers.length} posters, ${reviewerUsers.length} reviewers, ${tasks.length} tasks.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
