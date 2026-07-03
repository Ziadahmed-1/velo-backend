import type { Job } from 'bullmq';
import { RfmProcessor } from '../../../src/queues/rfm/rfm.processor';

describe('RfmProcessor', () => {
  let processor: RfmProcessor;

  beforeEach(() => {
    processor = new RfmProcessor();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should process job without error', async () => {
    const job = {
      data: { orderId: 'o-1', accountId: 'a-1' },
    } as unknown as Job<{ orderId: string; accountId: string }>;
    await expect(processor.process(job)).resolves.toBeUndefined();
  });
});
