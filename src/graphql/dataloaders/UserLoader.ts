
import { UserModel, UserInstance } from './../../models/UserModel';
import { DataLoaderParam } from './../../interfaces/DataLoaderParamInterface';
import { RequestedFields } from './../ast/RequestedFields';

export class UserLoader {
    static batchUsers(User: UserModel, params: DataLoaderParam<number>[], requestedFields: RequestedFields): Promise<UserInstance[]> {

        let ids: number[] = params.map(param => param.key);

        return Promise.resolve(
            User.findAll({
                where: { id: { $in: ids } },
                attributes: requestedFields.getFields(params[0].info, { keep: ['id'], exclude: ['posts'] })
            }).then(users => {
                // cria um objeto js onde cada chave é um id de usuário
                // e o valor, o usuário em si
                const usersMap = users.reduce(
                    (prev, user) => ({
                        ...prev,
                        [user.id]: user,
                    }), {})
                return ids.map(id => usersMap[id])
            })
        );
    }
}