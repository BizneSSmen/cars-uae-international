import { Injectable, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AdvertisementModel } from './models/advertisement.model';
import { AdvertisementDto } from './interfaces/dto/advertisement.dto';
import { v4 as uuid } from 'uuid';
import { FileModel } from './models/image.model';
import { UserModel } from 'src/user/models/user.model';
import { ConditionModel } from '../vehicle/models/condition.model';
import { EngineModel } from 'src/vehicle/models/engine.model';
import { ColorModel } from 'src/vehicle/models/color.model';
import { MakeModel } from 'src/vehicle/models/make.model';
import { CarModel } from 'src/vehicle/models/car-model.model';
import { CountryModel } from 'src/user/models/country.model';
import { CityModel } from 'src/user/models/city.model';
import { MediaDto } from './interfaces/dto/mediaData.dto';
import { QueryDto } from './interfaces/dto/query.dto';
import { skip } from 'node:test';

@Injectable()
export class AdvertisementService {
  private readonly limit: number = 10;

  constructor(
    @InjectModel(AdvertisementModel)
    private readonly advertisementModel: typeof AdvertisementModel,
    @InjectModel(FileModel)
    private readonly fileModel: typeof FileModel,
  ) {}

  public async finAll(query: QueryDto): Promise<AdvertisementModel[]> {
    return await this.advertisementModel.findAll({
      include: [
        {
          model: UserModel,
          as: 'user',
          required: true,
          include: [
            {
              model: CityModel,
              as: 'city',
              required: true,
              where: query.city ? { id: query.city } : {},
              include: [
                {
                  model: CountryModel,
                  as: 'country',
                  required: true,
                  where: query.country ? { id: query.country } : {},
                },
              ],
              attributes: { exclude: ['country_id'] },
            },
          ],
          attributes: {
            exclude: ['city_id'],
          },
        },
        {
          model: FileModel,
          as: 'media',
          required: false,
        },
        {
          model: UserModel,
          as: 'favoritedBy',
          required: false,
        },
        {
          model: EngineModel,
          as: 'engine',
          required: true,
          where: query.engine ? { id: query.engine } : {},
        },
        {
          model: ColorModel,
          as: 'color',
          required: true,
          where: query.color ? { id: query.color } : {},
        },
        {
          model: CarModel,
          as: 'model',
          required: true,
          where: query.model ? { id: query.model } : {},
          include: [
            {
              model: MakeModel,
              as: 'make',
              required: true,
              where: query.make ? { id: query.make } : {},
            },
          ],
          attributes: { exclude: ['make_id'] },
        },
        {
          model: ConditionModel,
          as: 'condition',
          required: true,
          where: query.condition ? { id: query.condition } : {},
        },
      ],
      attributes: {
        exclude: [
          'user_id',
          'engine_id',
          'color_id',
          'make_id',
          'model_id',
          'condition_id',
        ],
      },
      limit: this.limit,
      offset: this.limit * (query.page - 1),
    });
  }

  public async findById(id: string): Promise<AdvertisementModel> {
    return await this.advertisementModel.findByPk(id, {
      include: [{ model: FileModel, as: 'images', required: false }],
    });
  }

  public async deleteById(advertisementId: string): Promise<void> {
    await this.advertisementModel.destroy({ where: { id: advertisementId } });
  }

  public async createOne(
    advertisement: AdvertisementDto,
  ): Promise<AdvertisementModel> {
    const id = uuid();
    return await this.advertisementModel.create({
      id: id,
      ...advertisement,
    });
  }

  public async updateOneById(
    advertisementId: string,
    advertisement: AdvertisementDto,
  ): Promise<AdvertisementModel> {
    await this.advertisementModel.update(advertisement, {
      where: { id: advertisementId },
    });
    return await this.findById(advertisementId);
  }

  public async addFile(
    imageUrl: string,
    advertisementId: string,
    order: number,
    main: boolean,
  ): Promise<FileModel> {
    return await this.fileModel.create({
      image_url: imageUrl,
      advertisement_id: advertisementId,
      order: order,
      main: main,
    });
  }

  public async deleteFile(fileId: number): Promise<void> {
    await this.fileModel.destroy({ where: { id: fileId } });
  }

  public async addFiles(
    mediaData: MediaDto[],
    advertisementId: string,
  ): Promise<FileModel[]> {
    return await Promise.all(
      mediaData.map(({ url, order, main }) =>
        this.addFile(url, advertisementId, order, main),
      ),
    );
  }
}
