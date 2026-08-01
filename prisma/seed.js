const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // 1. Seed default system settings
  await prisma.systemSetting.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      companyName: 'Izzey Clean & Move',
      vatNumber: 'DE356789123',
      invoicePrefix: 'INV-',
      quotePrefix: 'Q-',
      paymentTermsDays: 14,
      currency: 'EUR',
      language: 'de',
    },
  });
  console.log('System settings seeded.');

  // 2. Seed default users
  const users = [
    {
      name: 'Izuddin SuperAdmin',
      email: 'superadmin@izzey.de',
      role: 'SUPER_ADMIN',
      password: 'SuperAdmin123!',
    },
    {
      name: 'Izzey Admin',
      email: 'admin@izzey.de',
      role: 'ADMIN',
      password: 'Admin123!',
    },
    {
      name: 'Izzey Accountant',
      email: 'accountant@izzey.de',
      role: 'ACCOUNTANT',
      password: 'Accountant123!',
    },
    {
      name: 'Izzey Employee',
      email: 'employee@izzey.de',
      role: 'EMPLOYEE',
      password: 'Employee123!',
    },
  ];

  for (const u of users) {
    const hashedPassword = bcrypt.hashSync(u.password, 10);
    
    const existingUser = await prisma.user.findUnique({
      where: { email: u.email },
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          role: u.role,
          password: hashedPassword,
        },
      });
      console.log(`User created: ${u.email} (${u.role})`);
    } else {
      console.log(`User already exists: ${u.email}`);
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
