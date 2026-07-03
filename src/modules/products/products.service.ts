import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { SuggestedItem } from './entities/suggested-item.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { CreateVariantFromSuggestionDto } from './dto/suggested-item.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepo: Repository<ProductVariant>,
    @InjectRepository(SuggestedItem)
    private suggestionRepo: Repository<SuggestedItem>,
  ) {}

  /**
   * Create a new product.
   * @param accountId - Tenant account ID
   * @param dto - Product creation payload
   * @returns The created Product entity
   */
  async create(accountId: string, dto: CreateProductDto) {
    return this.productRepo.save(
      this.productRepo.create({ ...dto, accountId }),
    );
  }

  /**
   * List all products for the given account.
   * @param accountId - Tenant account ID
   * @returns Array of Product entities with variants and attributes
   */
  async findAll(accountId: string) {
    return this.productRepo.find({
      where: { accountId },
      relations: { variants: true, attributes: true },
    });
  }

  /**
   * Get a single product by ID.
   * @param accountId - Tenant account ID
   * @param id - Product ID
   * @returns The Product entity with variants and attributes
   * @throws NotFoundException if not found
   */
  async findOne(accountId: string, id: string) {
    const product = await this.productRepo.findOne({
      where: { id, accountId },
      relations: { variants: true, attributes: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  /**
   * Create a variant under an existing product.
   * @param accountId - Tenant account ID
   * @param productId - Parent product ID
   * @param dto - Variant creation payload
   * @returns The created ProductVariant entity
   * @throws NotFoundException if parent product not found
   */
  async createVariant(
    accountId: string,
    productId: string,
    dto: CreateVariantDto,
  ) {
    await this.findOne(accountId, productId);
    return this.variantRepo.save(
      this.variantRepo.create({ ...dto, accountId, productId }),
    );
  }

  /**
   * List undismissed item suggestions (no-match items from LLM).
   * @param accountId - Tenant account ID
   * @returns Array of undismissed SuggestedItem entities
   */
  async getSuggestions(accountId: string) {
    return this.suggestionRepo.find({
      where: { accountId, isDismissed: false },
      order: { timesMentioned: 'DESC' },
    });
  }

  /**
   * Dismiss a suggestion so it no longer appears in the list.
   * @param accountId - Tenant account ID
   * @param id - Suggestion ID
   * @returns The updated SuggestedItem entity
   * @throws NotFoundException if suggestion not found
   */
  async dismissSuggestion(accountId: string, id: string) {
    const suggestion = await this.suggestionRepo.findOne({
      where: { id, accountId },
    });
    if (!suggestion) throw new NotFoundException('Suggestion not found');
    suggestion.isDismissed = true;
    return this.suggestionRepo.save(suggestion);
  }

  /**
   * Create a product variant from an LLM-generated suggestion.
   * Marks the suggestion as dismissed and linked to the new variant.
   * @param accountId - Tenant account ID
   * @param id - Suggestion ID
   * @param dto - Variant creation payload
   * @returns The created ProductVariant entity
   * @throws NotFoundException if suggestion not found
   * @throws BadRequestException if suggestion already has a linked variant
   */
  async createVariantFromSuggestion(
    accountId: string,
    id: string,
    dto: CreateVariantFromSuggestionDto,
  ) {
    const suggestion = await this.suggestionRepo.findOne({
      where: { id, accountId },
    });
    if (!suggestion) throw new NotFoundException('Suggestion not found');
    if (suggestion.linkedVariantId)
      throw new BadRequestException('Suggestion already has a linked variant');

    await this.findOne(accountId, dto.productId);

    const variant = await this.variantRepo.save(
      this.variantRepo.create({
        accountId,
        productId: dto.productId,
        sku: dto.sku,
        price: dto.price.toString(),
        costPrice: (dto.costPrice || 0).toString(),
      }),
    );

    suggestion.linkedVariantId = variant.id;
    suggestion.isDismissed = true;
    await this.suggestionRepo.save(suggestion);

    return variant;
  }
}
