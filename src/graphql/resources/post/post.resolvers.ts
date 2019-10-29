import { GraphQLResolveInfo } from 'graphql';
import { Transaction } from 'sequelize';
import { PostInstance } from '../../../models/PostModel';
import { handleError } from '../../../utils/utils';
import { authResolvers } from '../../composable/auth.resolver';
import { compose } from '../../composable/composable.resolver';
import { AuthUser } from './../../../interfaces/AuthUserInterface';
import { DataLoaders } from './../../../interfaces/DataLoaderInterface';
import { DbConnection } from './../../../interfaces/DbConnectionInterface';
import { throwError } from './../../../utils/utils';
import * as graphqlFields from 'graphql-fields';
import { ResolverContext } from './../../../interfaces/ResolverContextInterface';
import { RequestedFields } from './../../ast/RequestedFields';

export const postResolvers = {
    Post: {

        author: (post, args, { dataloaders: { userLoader } }: { dataloaders: DataLoaders }, info: GraphQLResolveInfo) => {
            return userLoader.load({ key: post.get('author'), info })
                .catch(handleError);
        },

        comments: (post, { first = 10, offset = 0 }, context: ResolverContext, info: GraphQLResolveInfo) => {
            return context.db.Comment
                .findAll({
                    where: { post: post.get('id') },
                    limit: first,
                    offset: offset,
                    attributes: context.requestedFields.getFields(info)
                }).catch(handleError);
        }
    },

    Query: {

        posts: (parent, { first = 10, offset = 0 }, { db, requestedFields }: { db: DbConnection, requestedFields: RequestedFields }, info: GraphQLResolveInfo) => {
            return db.Post
                .findAll({
                    limit: first,
                    offset: offset,
                    attributes: requestedFields.getFields(info, { keep: ['id'], exclude: ['comments'] })
                }).catch(handleError);
        },

        post: (parent, { id }, { db, requestedFields }: { db: DbConnection, requestedFields: RequestedFields }, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.Post
                .findById(id, {
                    attributes: requestedFields.getFields(info, { keep: ['id'], exclude: ['comments'] })
                })
                .then((post: PostInstance) => {
                    throwError(!post, `Post with id ${id} not found!`);
                    return post
                }).catch(handleError);
        }
    },

    Mutation: {
        createPost: compose(...authResolvers)((parent, { input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            input.author = authUser.id;
            return db.sequelize.transaction((t: Transaction) => {
                return db.Post.create(input, { transaction: t });
            }).catch(handleError);
        }),

        updatePost: compose(...authResolvers)((parent, { id, input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            input.author = authUser.id;
            return db.sequelize.transaction((t: Transaction) => {
                return db.Post
                    .findById(id)
                    .then((post: PostInstance) => {
                        throwError(post.get('author') != authUser.id, `Unauthorized! You can only edit posts by yourself!`)
                        throwError(!post, `Post with id ${id} not found!`);
                        input.author = authUser.id;
                        return post.update(input, { transaction: t })
                    })
            }).catch(handleError);
        }),

        deletePost: compose(...authResolvers)((parent, { id }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.sequelize.transaction((t: Transaction) => {
                return db.Post
                    .findById(id)
                    .then((post: PostInstance) => {
                        throwError(post.get('author') != authUser.id, `Unauthorized! You can only delete posts by yourself!`)
                        throwError(!post, `Post with id ${id} not found!`);
                        return post.destroy({ transaction: t })
                            .then(post => post);
                    })
            }).catch(handleError);
        }),
    }
};