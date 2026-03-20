import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo12345", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@emailprojectify.dev" },
    update: {},
    create: {
      email: "demo@emailprojectify.dev",
      name: "Demo User",
      passwordHash
    }
  });

  const projects = [
    {
      name: "Northwind Website Refresh",
      description:
        "Track client approvals, design iterations, scope discussions, and launch coordination for the Northwind website redesign."
    },
    {
      name: "Vendor Contract Renewal",
      description:
        "Capture legal review, pricing updates, renewal timelines, and negotiation notes related to the annual vendor contract."
    }
  ];

  for (const project of projects) {
    await prisma.project.upsert({
      where: {
        id: `${user.id}-${project.name}`
      },
      update: {},
      create: {
        id: `${user.id}-${project.name}`,
        userId: user.id,
        ...project
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
