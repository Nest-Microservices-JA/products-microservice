import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../common/prisma/services/prisma.service';

@Injectable()
export class ProductsService {

  constructor(private prisma: PrismaService) {}

  create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: createProductDto
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const total = await this.prisma.product.count({ where: { available: true }});
    const lastPage = Math.ceil(total / limit);
    return {
      data: await this.prisma.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { available: true }
      }),
      meta: {
        total,
        page,
        lastPage
      }
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id, available: true }
    });
    if (!product) {
      throw new RpcException({
        message: `Product with id #${ id } not found`,
        status: HttpStatus.BAD_REQUEST
      });
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {

    const { id: _, ...data} = updateProductDto;

    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    // return this.prisma.product.delete({
    //   where: { id }
    // });
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        available: false
      }
    });
    return product;
  }
}
