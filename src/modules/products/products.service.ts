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

  async create(accountId: string, dto: CreateProductDto) {
    return this.productRepo.save(
      this.productRepo.create({ ...dto, accountId }),
    );
  }

  async findAll(accountId: string) {
    return this.productRepo.find({
      where: { accountId },
      relations: { variants: true, attributes: true },
    });
  }

  async findOne(accountId: string, id: string) {
    const product = await this.productRepo.findOne({
      where: { id, accountId },
      relations: { variants: true, attributes: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

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

  async getSuggestions(accountId: string) {
    return this.suggestionRepo.find({
      where: { accountId, isDismissed: false },
      order: { timesMentioned: 'DESC' },
    });
  }

  async dismissSuggestion(accountId: string, id: string) {
    const suggestion = await this.suggestionRepo.findOne({
      where: { id, accountId },
    });
    if (!suggestion) throw new NotFoundException('Suggestion not found');
    suggestion.isDismissed = true;
    return this.suggestionRepo.save(suggestion);
  }

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
