import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Recursive parser function to find and parse serialized fields in results
function parseJSONFieldsRecursive(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(parseJSONFieldsRecursive);
  }
  
  // Parse requiredDocuments
  if (obj.requiredDocuments !== undefined && typeof obj.requiredDocuments === 'string') {
    try {
      obj.requiredDocuments = JSON.parse(obj.requiredDocuments);
    } catch {
      obj.requiredDocuments = obj.requiredDocuments.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }

  // Parse eligibilityCriteria
  if (obj.eligibilityCriteria !== undefined && typeof obj.eligibilityCriteria === 'string') {
    try {
      obj.eligibilityCriteria = JSON.parse(obj.eligibilityCriteria);
    } catch {}
  }

  // Parse academicDetails
  if (obj.academicDetails !== undefined && typeof obj.academicDetails === 'string') {
    try {
      obj.academicDetails = JSON.parse(obj.academicDetails);
    } catch {}
  }

  // Parse metadata
  if (obj.metadata !== undefined && typeof obj.metadata === 'string') {
    try {
      obj.metadata = JSON.parse(obj.metadata);
    } catch {}
  }
  
  for (const key of Object.keys(obj)) {
    if (obj[key] && typeof obj[key] === 'object') {
      obj[key] = parseJSONFieldsRecursive(obj[key]);
    }
  }
  
  return obj;
}

// Prisma Middleware to automatically handle array/JSON serialization for SQLite
prismaClient.$use(async (params, next) => {
  const data = params.args?.data;
  if (data) {
    // requiredDocuments array to JSON String
    if (params.model === 'Scholarship' && Array.isArray(data.requiredDocuments)) {
      data.requiredDocuments = JSON.stringify(data.requiredDocuments);
    }
    
    // eligibilityCriteria object to JSON String
    if (params.model === 'Scholarship' && data.eligibilityCriteria && typeof data.eligibilityCriteria === 'object') {
      data.eligibilityCriteria = JSON.stringify(data.eligibilityCriteria);
    }

    // academicDetails object to JSON String
    if (params.model === 'Application' && data.academicDetails && typeof data.academicDetails === 'object') {
      data.academicDetails = JSON.stringify(data.academicDetails);
    }

    // metadata object to JSON String
    if (params.model === 'AuditLog' && data.metadata && typeof data.metadata === 'object') {
      data.metadata = JSON.stringify(data.metadata);
    }
  }
  
  const result = await next(params);
  return parseJSONFieldsRecursive(result);
});

export const prisma = prismaClient;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
