import bcrypt from 'bcryptjs';
import prisma from '../src/config/database';

const Role = {
  STUDENT: 'STUDENT',
  VERIFIER: 'VERIFIER',
  COMMITTEE: 'COMMITTEE',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
};

async function main() {
  console.log('🌱 Seeding database...\n');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.workflowAction.deleteMany();
  await prisma.documentReview.deleteMany();
  await prisma.document.deleteMany();
  await prisma.application.deleteMany();
  await prisma.scholarship.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 12);

  // ─── CREATE USERS ───────────────────────────────────────
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@scholarship.edu',
      passwordHash,
      role: Role.SUPER_ADMIN,
      profile: {
        create: {
          firstName: 'System',
          lastName: 'Administrator',
          phone: '+91-9000000001',
        },
      },
    },
  });
  console.log(`✅ Super Admin created: ${superAdmin.email}`);

  const verifier = await prisma.user.create({
    data: {
      email: 'verifier@scholarship.edu',
      passwordHash,
      role: Role.VERIFIER,
      profile: {
        create: {
          firstName: 'Priya',
          lastName: 'Sharma',
          phone: '+91-9000000002',
          department: 'Document Verification',
        },
      },
    },
  });
  console.log(`✅ Verifier created: ${verifier.email}`);

  const committee = await prisma.user.create({
    data: {
      email: 'committee@scholarship.edu',
      passwordHash,
      role: Role.COMMITTEE,
      profile: {
        create: {
          firstName: 'Rajesh',
          lastName: 'Kumar',
          phone: '+91-9000000003',
          department: 'Scholarship Committee',
        },
      },
    },
  });
  console.log(`✅ Committee member created: ${committee.email}`);

  const student = await prisma.user.create({
    data: {
      email: 'student@scholarship.edu',
      passwordHash,
      role: Role.STUDENT,
      profile: {
        create: {
          firstName: 'Ananya',
          lastName: 'Patel',
          phone: '+91-9000000004',
          dateOfBirth: new Date('2003-05-15'),
          address: '123 College Road, Mumbai, Maharashtra',
          institution: 'Indian Institute of Technology, Mumbai',
          department: 'Computer Science',
          yearOfStudy: 3,
          cgpa: 8.5,
        },
      },
    },
  });
  console.log(`✅ Student created: ${student.email}`);

  // ─── CREATE SCHOLARSHIPS ────────────────────────────────
  const meritScholarship = await prisma.scholarship.create({
    data: {
      name: 'National Merit Scholarship 2025-26',
      description:
        'A prestigious merit-based scholarship for undergraduate students with outstanding academic performance. This scholarship aims to support talented students from all disciplines who demonstrate exceptional academic achievement and leadership qualities.',
      totalBudget: 5000000,
      perAwardAmount: 100000,
      maxAwardees: 50,
      eligibilityCriteria: {
        minCgpa: 8.0,
        maxFamilyIncome: 1000000,
        allowedYears: [2, 3, 4],
      },
      requiredDocuments: [
        'marksheet',
        'income_certificate',
        'id_proof',
        'institution_letter',
      ],
      applicationDeadline: new Date('2026-08-31'),
      academicYear: '2025-26',
    },
  });
  console.log(`✅ Scholarship created: ${meritScholarship.name}`);

  const needBasedScholarship = await prisma.scholarship.create({
    data: {
      name: 'Vidyalakshmi Need-Based Scholarship 2025-26',
      description:
        'A need-based financial assistance program designed to support economically disadvantaged students pursuing higher education. The scholarship covers tuition fees and provides a monthly stipend for living expenses.',
      totalBudget: 10000000,
      perAwardAmount: 200000,
      maxAwardees: 50,
      eligibilityCriteria: {
        minCgpa: 6.0,
        maxFamilyIncome: 300000,
        allowedDepartments: ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Chemical'],
      },
      requiredDocuments: [
        'marksheet',
        'income_certificate',
        'caste_certificate',
        'bank_statement',
        'id_proof',
      ],
      applicationDeadline: new Date('2026-09-15'),
      academicYear: '2025-26',
    },
  });
  console.log(`✅ Scholarship created: ${needBasedScholarship.name}`);

  // ─── CREATE SAMPLE APPLICATION ──────────────────────────
  const application = await prisma.application.create({
    data: {
      studentId: student.id,
      scholarshipId: meritScholarship.id,
      status: 'DRAFT',
      personalStatement:
        'I am a passionate Computer Science student with a strong academic record. This scholarship will help me focus on my research in machine learning and contribute to open-source projects.',
      familyIncome: 450000,
      academicDetails: {
        cgpa: 8.5,
        yearOfStudy: 3,
        institution: 'Indian Institute of Technology, Mumbai',
        department: 'Computer Science',
      },
    },
  });
  console.log(`✅ Sample application created (DRAFT): ${application.id}`);

  // ─── CREATE NOTIFICATIONS ──────────────────────────────
  await prisma.notification.create({
    data: {
      userId: student.id,
      title: 'Welcome to the Scholarship Portal!',
      message: 'Your account has been created. Explore available scholarships and apply today.',
    },
  });

  console.log('\n✨ Seeding completed successfully!\n');
  console.log('─────────────────────────────────────');
  console.log('  Login Credentials (all passwords: Password123!)');
  console.log('─────────────────────────────────────');
  console.log(`  Super Admin : admin@scholarship.edu`);
  console.log(`  Verifier    : verifier@scholarship.edu`);
  console.log(`  Committee   : committee@scholarship.edu`);
  console.log(`  Student     : student@scholarship.edu`);
  console.log('─────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
