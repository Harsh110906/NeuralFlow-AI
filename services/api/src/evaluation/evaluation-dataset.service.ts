import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EvaluationDatasetService {
  constructor(private prisma: PrismaService) {}

  async createDataset(workspaceId: string, name: string, description?: string) {
    return this.prisma.evaluationDataset.create({
      data: { workspaceId, name, description },
    });
  }

  async createDatasetVersion(
    datasetId: string,
    description: string,
    testCases: any[],
  ) {
    const dataset = await this.prisma.evaluationDataset.findUnique({
      where: { id: datasetId },
    });
    if (!dataset) throw new NotFoundException('Dataset not found');

    const lastVersion = await this.prisma.evaluationDatasetVersion.findFirst({
      where: { datasetId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = lastVersion ? lastVersion.version + 1 : 1;

    return this.prisma.evaluationDatasetVersion.create({
      data: {
        datasetId,
        version: nextVersion,
        description,
        testCases: {
          create: testCases.map((tc) => ({
            input: tc.input,
            expectedOut: tc.expectedOut,
            assertions: tc.assertions,
          })),
        },
      },
      include: { testCases: true },
    });
  }

  async getDatasetVersions(datasetId: string) {
    return this.prisma.evaluationDatasetVersion.findMany({
      where: { datasetId },
      orderBy: { version: 'desc' },
    });
  }

  async getDatasets(workspaceId: string) {
    return this.prisma.evaluationDataset.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDataset(id: string) {
    const dataset = await this.prisma.evaluationDataset.findUnique({
      where: { id },
    });
    if (!dataset) throw new NotFoundException('Dataset not found');
    return dataset;
  }

  async getTestCases(versionId: string) {
    return this.prisma.evaluationTestCase.findMany({
      where: { datasetVersionId: versionId },
    });
  }
}
