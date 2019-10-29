import { PostInstance } from '../models/PostModel';
import { UserInstance } from '../models/UserModel';
import { DataLoaderParam } from './DataLoaderParamInterface';
import DataLoader = require('dataloader');

export interface DataLoaders {
    userLoader: DataLoader<DataLoaderParam<number>, UserInstance>;
    postLoader: DataLoader<DataLoaderParam<number>, PostInstance>;
}