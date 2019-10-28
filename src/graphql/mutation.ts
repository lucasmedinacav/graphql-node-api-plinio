import { commentMutations } from './resources/comment/comment.schema';
import { postMutations } from './resources/post/post.schema';
import { tokenMutations } from './resources/token/token.schema';
import { userMutations } from './resources/user/user.schema';

const Mutation = `
    type Mutation {
        ${userMutations}
        ${postMutations}
        ${commentMutations}
        ${tokenMutations}
    }
`;

export { Mutation };

