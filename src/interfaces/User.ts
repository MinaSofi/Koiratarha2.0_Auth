import {Document} from 'mongoose';
interface User extends Document {
  username: string;
  password: string;
  role: 'user' | 'admin';
}

interface OutputUser {
  id?: string;
  username: string;
}

export {User, OutputUser};
