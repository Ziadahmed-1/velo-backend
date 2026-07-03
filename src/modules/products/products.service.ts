import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepo: Repository<ProductVariant>,
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
}
