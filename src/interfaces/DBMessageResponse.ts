import {OutputUser} from './User';

export default interface DBMessageResponse {
  message: string;
  data: OutputUser | OutputUser[];
}
