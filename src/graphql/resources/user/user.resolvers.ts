import { GraphQLResolveInfo } from "graphql";
import { Transaction } from "sequelize";
import { UserInstance } from "../../../models/UserModel";
import { handleError } from "../../../utils/utils";
import { compose } from "../../composable/composable.resolver";
import { AuthUser } from './../../../interfaces/AuthUserInterface';
import { DbConnection } from './../../../interfaces/DbConnectionInterface';
import { throwError } from './../../../utils/utils';
import { authResolvers } from './../../composable/auth.resolver';

export const userResolvers = {

    User: {
        posts: (user: UserInstance, { first = 10, offset = 0 }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
            return db.Post
                .findAll({
                    where: { author: user.get('id') },
                    limit: first,
                    offset: offset
                }).catch(handleError)
        }
    },

    Query: {
        //o { first = 10, offset = 0 } é uma desestruturação do campo args, e eles são preenchidos com 10 ou 0, respectivamente, caso nao venha nenhum valor
        //o db (dbConnection) é uma desestruturação do campo context (context.db)
        users: (parent, { first = 10, offset = 0 }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
            return db.User
                .findAll({
                    limit: first,
                    offset: offset
                })
                .catch(handleError);
        },

        user: (parent, { id }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.User
                .findById(id).then((user: UserInstance) => {
                    throwError(!user, `User with id ${id} not found!`);
                    return user;
                }).catch(handleError);
        },

        currentUser: compose(...authResolvers)((parent, args, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            return db.User
                .findById(authUser.id)
                .then((user: UserInstance) => {
                    throwError(!user, `User with id ${authUser.id} not found`);
                    return user;
                }).catch(handleError);
        })
    },

    Mutation: {

        createUser: (parent, { input }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
            return db.sequelize.transaction((t: Transaction) => {
                return db.User
                    .create(input, { transaction: t });
            }).catch(handleError);
        },

        updateUser: compose(...authResolvers)((parent, { input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            return db.sequelize.transaction((t: Transaction) => {
                return db.User
                    .findById(authUser.id)
                    .then((user: UserInstance) => {
                        throwError(!user, `User with id ${authUser.id} not found!`);
                        return user.update(input, { transaction: t });
                    });
            }).catch(handleError);
        }),

        updateUserPassword: compose(...authResolvers)((parent, { input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            return db.sequelize.transaction((t: Transaction) => {
                return db.User
                    .findById(authUser.id)
                    .then((user: UserInstance) => {
                        throwError(!user, `User with id ${authUser.id} not found!`);
                        return user.update(input, { transaction: t })
                            .then((user: UserInstance) => !!user);
                    });
            }).catch(handleError);
        }),

        deleteUser: compose(...authResolvers)((parent, args, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            return db.sequelize.transaction((t: Transaction) => {
                return db.User.findById(authUser.id)
                    .then((user: UserInstance) => {
                        throwError(!user, `User with id ${authUser.id} not found!`);
                        return user.destroy({ transaction: t })
                            .then(user => user);
                    })
            }).catch(handleError);
        }),
    }
};