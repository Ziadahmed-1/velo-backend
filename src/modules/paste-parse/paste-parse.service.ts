import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ExtractionService } from './extraction.service';
import { CatalogMatcherService } from './catalog-matcher.service';
import { PasteParseDto } from './dto/paste-parse.dto';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Customer } from '../customers/entities/customer.entity';
import { SuggestedItem } from '../products/entities/suggested-item.entity';
import { OrderSourceChannel, MatchStatus } from '../../common/enums';

@Injectable()
export class PasteParseService {
  constructor(
    private extractionService: ExtractionService,
    private catalogMatcherService: CatalogMatcherService,
    private dataSource: DataSource,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(SuggestedItem)
    private suggestedItemRepo: Repository<SuggestedItem>,
  ) {}

  /**
   * Parse raw text into a complete draft order.
   * Orchestrates extraction, catalog matching, customer upsert, and draft order creation with SuggestedItem upserts.
   * @param accountId - Merchant account ID
   * @param dto - Paste parse input DTO
   * @returns Created draft Order
   */
  async parse(accountId: string, dto: PasteParseDto) {
    const extracted = await this.extractionService.extractFromText(dto.text);

    let customer = await this.customerRepo.findOne({
      where: { accountId, phone: extracted.phone },
    });
    if (!customer) {
      customer = this.customerRepo.create({
        accountId,
        phone: extracted.phone,
        name: extracted.customerName,
        governorate: extracted.governorate,
        district: extracted.district,
        streetAddress: extracted.street,
      });
      customer = await this.customerRepo.save(customer);
    }

    const matchResults = await this.catalogMatcherService.matchItems(
      accountId,
      extracted.items,
    );

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const subTotal = extracted.items
        .reduce((sum, item) => sum + item.qty * parseFloat(item.price), 0)
        .toFixed(2);

      const order = await qr.manager.save(
        qr.manager.create(Order, {
          accountId,
          customerId: customer.id,
          subTotal,
          shippingFee: extracted.shippingFee,
          vatAmount: '0',
          totalAmount: extracted.total,
          sourceChannel: OrderSourceChannel.PASTE_PARSE,
          isDraft: true,
          conversationContext: {
            rawExtraction: extracted,
            matchResults,
            rawText: dto.text,
          },
        }),
      );

      for (const match of matchResults) {
        await qr.manager.save(
          qr.manager.create(OrderItem, {
            orderId: order.id,
            variantId: match.matchedVariantId || '',
            quantity: match.quantity,
            price: match.price,
            matchConfidence: match.matchConfidence,
            matchStatus: match.matchStatus,
            extractedRawName: match.extractedName,
            suggestedAlternatives: match.suggestedAlternatives,
          }),
        );
      }

      for (const match of matchResults) {
        if (match.matchStatus === MatchStatus.NO_MATCH) {
          const existing = await qr.manager.findOne(SuggestedItem, {
            where: { accountId, rawName: match.extractedName },
          });
          if (existing) {
            existing.timesMentioned += 1;
            await qr.manager.save(existing);
          } else {
            await qr.manager.save(
              qr.manager.create(SuggestedItem, {
                accountId,
                rawName: match.extractedName,
                timesMentioned: 1,
              }),
            );
          }
        }
      }

      await qr.commitTransaction();

      return order;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }
}
