
import { GraphQLResolveInfo } from 'graphql';
import { Transaction } from 'sequelize';
import { DbConnection } from './../../../interfaces/DbConnectionInterface';
import { CommentInstance } from '../../../models/CommentModel';
import { handleError } from '../../../utils/utils';
import { throwError } from './../../../utils/utils';
import { compose } from '../../composable/composable.resolver';
import { AuthUser } from './../../../interfaces/AuthUserInterface';
import { authResolvers } from '../../composable/auth.resolver';

export const commentResolvers = {

    Comment: {
        user: (comment, args, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
            return db.User
                .findById(comment.get('user'))
                .catch(handleError);
        },
        post: (comment, args, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
            return db.Post
                .findById(comment.get('user'))
                .catch(handleError);
        }
    },

    Query: {
        commentsByPosts: (parent, { postId, first = 10, offset = 0 }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
            postId = parseInt(postId);
            return db.Comment
                .findAll({
                    where: { post: postId },
                    limit: first,
                    offset: offset
                })
                .catch(handleError);
        }
    },

    Mutation: {
        createComment: compose(...authResolvers)((parent, { input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            input.user = authUser.id;
            return db.sequelize.transaction((t: Transaction) => {
                return db.Comment
                    .create(input, { transaction: t });
            }).catch(handleError);
        }),

        updateComment: compose(...authResolvers)((parent, { id, input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.sequelize.transaction((t: Transaction) => {
                return db.Comment
                    .findById(id)
                    .then((comment: CommentInstance) => {
                        throwError(comment.get('user') != authUser.id, `Unauthorized! You can only edit comments by yourself!`)
                        throwError(!comment, `Comment with id ${id} not found!`);
                        input.user = authUser.id;
                        return comment.update(input, { transaction: t })
                    })
            }).catch(handleError);
        }),

        deleteComment: compose(...authResolvers)((parent, { id }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.sequelize.transaction((t: Transaction) => {
                return db.Comment
                    .findById(id)
                    .then((comment: CommentInstance) => {
                        throwError(comment.get('user') != authUser.id, `Unauthorized! You can only delete comments by yourself!`)
                        throwError(!comment, `Comment with id ${id} not found!`);
                        return comment.destroy({ transaction: t })
                            .then(comment => comment);
                    })
            }).catch(handleError);
        }),
    }
};